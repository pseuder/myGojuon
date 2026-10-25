// stores/vocab.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { useApi } from "@/composables/useApi.js";

// 後端回傳 status=error 時轉成例外，呼叫端統一 catch
const unwrap = (res) => {
  if (res.status !== "success") throw new Error(res.message || "error");
  return res.data;
};

export const useVocabStore = defineStore("vocab", () => {
  const MYAPI = useApi();

  // --- State ---
  const sets = ref([]);
  const isFetching = ref(false);
  const isInitialized = ref(false);

  // --- 單字集 ---
  const fetchSets = async () => {
    isFetching.value = true;
    try {
      sets.value = unwrap(await MYAPI.get("/get_vocab_sets")) ?? [];
      isInitialized.value = true;
    } finally {
      isFetching.value = false;
    }
  };

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

  const recordAnswer = async (wordId, isFamiliar) => {
    const data = unwrap(
      await MYAPI.request("/record_vocab_answer", {
        method: "POST",
        body: { vocab_word_id: wordId, is_familiar: isFamiliar },
        retry: 2,
      }),
    );
    isInitialized.value = false; // 列表上的進度已變動
    return data;
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

  return {
    sets,
    resetStats,
    isFetching,
    isInitialized,
    fetchSets,
    getSet,
    convertWords,
    saveSet,
    deleteSet,
    getStudyWords,
    recordAnswer,
  };
});
