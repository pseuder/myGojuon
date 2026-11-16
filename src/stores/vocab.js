// stores/vocab.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { useApi } from "@/composables/useApi.js";
import { useAuthStore } from "@/stores/auth.js";
import {
  studyOwner,
  loadAnswerOutbox,
  saveAnswerOutbox,
} from "@/utils/vocabStudyStorage.js";

// 與後端 VocabAnswersRequest 的上限一致
const RECORD_BATCH = 500;

// 後端回傳 status=error 時轉成例外，呼叫端統一 catch
const unwrap = (res) => {
  if (res.status !== "success") throw new Error(res.message || "error");
  return res.data;
};

export const useVocabStore = defineStore("vocab", () => {
  const MYAPI = useApi();
  const authStore = useAuthStore();

  // --- State ---
  const sets = ref([]);
  const isFetching = ref(false);
  const isInitialized = ref(false);

  // --- 單字集 ---
  const fetchSets = async () => {
    isFetching.value = true;
    try {
      // 先把還沒送出的作答送完，抓回來的進度才是最新的（送失敗不擋列表）
      await flushAnswers().catch(() => {});
      sets.value = unwrap(await MYAPI.get("/get_vocab_sets")) ?? [];
      isInitialized.value = true;
    } finally {
      isFetching.value = false;
    }
  };

  /** 搜尋單字是否已存在於學習集（日文 / 假名 / 羅馬拼音 / 意思） */
  const searchWords = async (q) =>
    unwrap(await MYAPI.get("/search_vocab_words", { q })) ?? [];

  const getSet = async (setId) =>
    unwrap(await MYAPI.get(`/get_vocab_set/${setId}`));

  const convertWords = async (words, translate, target) =>
    unwrap(
      await MYAPI.request("/convert_vocab_words", {
        method: "POST",
        body: { words, translate, target },
        timeout: 60000,
      }),
    );

  const saveSet = async ({ vocab_set_id, title, description, words }) => {
    const path = vocab_set_id ? "/update_vocab_set" : "/create_vocab_set";
    const data = unwrap(
      await MYAPI.post(path, { vocab_set_id, title, description, words }),
    );
    isInitialized.value = false; // 下次進列表重新抓
    return data.vocab_set_id;
  };

  const deleteSet = async (setId) => {
    unwrap(await MYAPI.post("/delete_vocab_set", { vocab_set_id: setId }));
    sets.value = sets.value.filter((s) => s.vocab_set_id !== setId);
  };

  // --- 學習 ---
  const getStudyWords = async (params) =>
    unwrap(await MYAPI.post("/get_vocab_study_words", params));

  // --- 作答記錄：先排進 localStorage 的待送佇列，再整批送出 ---
  // 後端以（單字, 作答時間）判斷是否已記錄過，所以同一筆重送不會重複累加
  const answerOwner = () => studyOwner(authStore.user);
  const answerKey = (a) => `${a.vocab_word_id}:${a.answered_at}`;

  /** 把作答排進待送佇列（尚未送出） */
  const queueAnswers = (answers) => {
    if (!answers.length) return;
    const owner = answerOwner();
    saveAnswerOutbox(owner, [...loadAnswerOutbox(owner), ...answers]);
  };

  const sendAnswers = async (answers, keepalive) => {
    if (!keepalive)
      return MYAPI.request("/record_vocab_answers", {
        method: "POST",
        body: { answers },
        retry: 2,
      });
    // 頁面切到背景 / 即將關閉：axios（XHR）會被中斷，改用 keepalive 的 fetch 讓請求送完
    const base = String(import.meta.env.VITE_API_BASE).replace(/\/+$/, "");
    const res = await fetch(`${base}/record_vocab_answers`, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify({ answers }),
    });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.response = { status: res.status };
      throw err;
    }
    return res.json();
  };

  const flushOutbox = async (keepalive) => {
    if (!authStore.isLoggedIn) return;
    const owner = answerOwner();
    for (;;) {
      const batch = loadAnswerOutbox(owner).slice(0, RECORD_BATCH);
      if (!batch.length) return;
      // 送出期間可能又有新的作答排進來，只移除這次送出的那幾筆
      const sent = new Set(batch.map(answerKey));
      const dropBatch = () =>
        saveAnswerOutbox(
          owner,
          loadAnswerOutbox(owner).filter((a) => !sent.has(answerKey(a))),
        );
      try {
        unwrap(await sendAnswers(batch, keepalive));
      } catch (err) {
        // 格式被後端拒絕（400 / 422）：重送也不會成功，丟掉以免永遠卡在佇列最前面
        // 其他都留著下次再送：斷線、逾時、5xx、後端尚未更新的 404，
        // 以及 200 + status=error（登入過期也是這樣回，重新登入後就能送出）
        const status = err.response?.status;
        if (status === 400 || status === 422) dropBatch();
        throw err;
      }
      dropBatch();
      isInitialized.value = false; // 列表上的進度已變動
    }
  };

  // 同一時間只跑一個送出流程，後來的排在後面
  let flushChain = Promise.resolve();
  /** 送出待送佇列；失敗時 reject，佇列內容會保留到下次 */
  const flushAnswers = ({ keepalive = false } = {}) => {
    const run = flushChain.then(() => flushOutbox(keepalive));
    flushChain = run.catch(() => {});
    return run;
  };

  /** 重置自己在此學習集的熟悉 / 不熟悉次數 */
  const resetStats = async (setId) => {
    unwrap(await MYAPI.post("/reset_vocab_set_stats", { vocab_set_id: setId }));
    const set = sets.value.find((s) => s.vocab_set_id === setId);
    if (set) {
      set.studied_count = 0;
      set.unfamiliar_count = 0;
    }
  };

  /** 重置自己在所有學習集的熟悉 / 不熟悉次數 */
  const resetAllStats = async () => {
    unwrap(await MYAPI.post("/reset_all_vocab_stats", {}));
    sets.value.forEach((set) => {
      set.studied_count = 0;
      set.unfamiliar_count = 0;
    });
  };

  // --- 手動覆寫發音（管理員） ---
  const ttsOverrideForm = (text, lang, file) => {
    const form = new FormData();
    form.append("text", text);
    form.append("lang", lang);
    if (file) form.append("file", file);
    return form;
  };

  const listTtsOverrides = async (lang = "ja") =>
    unwrap(await MYAPI.get("/tts_overrides", { lang })) ?? [];

  const uploadTtsOverride = async (text, file, lang = "ja") =>
    unwrap(await MYAPI.post("/upload_tts_override", ttsOverrideForm(text, lang, file)));

  /** 取得 Google 翻譯網頁的發音（Blob）；後端失敗時回的是 JSON 錯誤 */
  const fetchGoogleTranslateTts = async (text, lang = "ja") => {
    const blob = await MYAPI.request("/google_translate_tts", {
      params: { q: text, lang },
      responseType: "blob",
      timeout: 20000,
    });
    if (blob.type.includes("json")) unwrap(JSON.parse(await blob.text()));
    return blob;
  };

  const deleteTtsOverride = async (text, lang = "ja") =>
    unwrap(await MYAPI.post("/delete_tts_override", ttsOverrideForm(text, lang)));

  return {
    sets,
    listTtsOverrides,
    uploadTtsOverride,
    fetchGoogleTranslateTts,
    deleteTtsOverride,
    resetStats,
    resetAllStats,
    isFetching,
    isInitialized,
    fetchSets,
    getSet,
    searchWords,
    convertWords,
    saveSet,
    deleteSet,
    getStudyWords,
    queueAnswers,
    flushAnswers,
  };
});
