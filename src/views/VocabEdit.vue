<template>
  <div v-loading="loadingSet" class="flex h-full flex-col gap-4 px-2 py-4 md:px-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-2xl font-bold text-indigo-700">
        {{ isEdit ? t("vocab.edit_set") : t("vocab.create_set") }}
      </h1>
      <el-button :icon="Back" @click="router.push('/VocabSets')">
        {{ t("vocab.back_to_list") }}
      </el-button>
    </div>

    <div
      v-if="!authStore.isLoggedIn"
      class="py-20 text-center text-lg text-gray-400"
    >
      {{ t("vocab.login_required") }}
    </div>

    <div
      v-else-if="!authStore.isAdmin"
      class="py-20 text-center text-lg text-gray-400"
    >
      {{ t("vocab.admin_only") }}
    </div>

    <template v-else>
      <!-- 標題 / 說明 -->
      <div class="flex flex-col gap-2">
        <el-input
          v-model="title"
          :maxlength="100"
          show-word-limit
          size="large"
          :placeholder="t('vocab.title_placeholder')"
        />
        <el-input
          v-model="description"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 4 }"
          :maxlength="500"
          :placeholder="t('vocab.description_placeholder')"
        />
      </div>

      <!-- 匯入單字 -->
      <div
        v-if="showImport"
        class="flex flex-col gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3"
      >
        <div class="flex items-center justify-between">
          <span class="font-bold text-indigo-700">
            {{ rows.length ? t("vocab.append_words") : t("vocab.import_words") }}
          </span>
          <el-button v-if="rows.length" text :icon="Close" @click="showImport = false" />
        </div>
        <p class="text-sm whitespace-pre-line text-gray-600">{{ t("vocab.import_hint") }}</p>
        <el-input
          v-model="importText"
          type="textarea"
          class="import-input"
          :autosize="{ minRows: 6, maxRows: 16 }"
          :placeholder="t('vocab.import_placeholder')"
        />
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-4">
            <el-checkbox v-model="autoTranslate">{{ t("vocab.auto_translate") }}</el-checkbox>
            <span class="text-sm text-gray-500">
              {{ t("vocab.parsed_count", { n: parsedImport.length }) }}
            </span>
          </div>
          <el-button
            type="primary"
            :loading="converting"
            :disabled="!parsedImport.length"
            @click="handleImport"
          >
            {{ t("vocab.convert") }}
          </el-button>
        </div>
      </div>

      <!-- 轉換結果：編輯 & 確認 -->
      <div v-if="rows.length" class="flex flex-col gap-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-gray-600">
            {{ t("vocab.confirm_hint", { n: rows.length }) }}
          </span>
          <div class="flex gap-2">
            <el-button v-if="!showImport" :icon="Upload" @click="showImport = true">
              {{ t("vocab.append_words") }}
            </el-button>
            <el-button :icon="Plus" @click="addRow">{{ t("vocab.add_row") }}</el-button>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <div
            v-for="(row, idx) in rows"
            :key="row.key"
            class="word-row flex flex-col gap-2 rounded-lg border p-2 md:flex-row md:items-start"
            :class="rowError(row) ? 'border-red-300 bg-red-50/40' : 'border-gray-200'"
          >
            <!-- 編號 + 發音 + 預覽 -->
            <div class="flex min-w-0 items-center gap-2 md:w-56 md:shrink-0">
              <span class="w-7 shrink-0 text-right text-sm text-gray-400">{{ idx + 1 }}</span>
              <button
                type="button"
                class="shrink-0 rounded-full p-1 hover:bg-indigo-100"
                :title="t('tools.speak')"
                :disabled="!row.word"
                @click="speak(speechText(row), row.key)"
              >
                <img
                  :src="speakingKey === row.key ? '/images/volume2.png' : '/images/volume.png'"
                  alt=""
                  class="h-5 w-5"
                />
              </button>
              <div class="flex min-w-0 flex-col">
                <RubyWord :word="row.word" :tokens="row.tokens" class="truncate text-2xl" />
                <span class="truncate text-xs text-gray-500">
                  {{ row.kana }}<template v-if="row.romaji"> ・ {{ row.romaji }}</template>
                </span>
              </div>
              <el-icon v-if="row.converting" class="is-loading shrink-0 text-indigo-500">
                <Loading />
              </el-icon>
            </div>

            <!-- 單字 / 意思 / 讀音 -->
            <div class="flex min-w-0 flex-1 flex-col gap-1">
              <div class="flex flex-col gap-1 sm:flex-row">
                <el-input
                  v-model="row.word"
                  class="sm:w-48"
                  :maxlength="100"
                  :placeholder="t('vocab.word')"
                  @change="reconvertRow(row)"
                />
                <el-input
                  v-model="row.meaning"
                  class="flex-1"
                  :class="{ 'auto-meaning': row.auto_meaning }"
                  :maxlength="500"
                  :placeholder="t('vocab.meaning')"
                  @input="row.auto_meaning = false"
                />
              </div>
              <div class="flex flex-wrap items-center gap-2 text-xs">
                <el-tag v-if="row.auto_meaning" size="small" type="warning">
                  {{ t("vocab.auto_translated") }}
                </el-tag>
                <el-tag v-if="duplicateKeys.has(row.key)" size="small" type="info">
                  {{ t("vocab.duplicate") }}
                </el-tag>
                <span v-if="rowError(row)" class="text-red-500">{{ rowError(row) }}</span>
                <el-button
                  v-if="kanjiTokens(row).length"
                  link
                  size="small"
                  type="primary"
                  @click="row.editReading = !row.editReading"
                >
                  {{ t("vocab.edit_reading") }}
                </el-button>
              </div>

              <!-- 讀音編輯：每個漢字/片假名段一個輸入框 -->
              <div v-if="row.editReading" class="flex flex-wrap gap-2 rounded bg-gray-50 p-2">
                <div
                  v-for="(token, tIdx) in row.tokens"
                  :key="tIdx"
                  class="flex flex-col items-center"
                >
                  <input
                    v-if="token.cvt !== '' || !isKana(token.ori)"
                    v-model="token.cvt"
                    class="w-20 rounded border border-gray-300 px-1 text-center text-sm"
                    @change="onReadingChange(row)"
                  />
                  <span v-else class="h-[22px]"></span>
                  <span class="text-lg">{{ token.ori }}</span>
                </div>
              </div>
            </div>

            <el-button
              class="self-end md:self-start"
              circle
              plain
              type="danger"
              :icon="Delete"
              :title="t('vocab.delete')"
              @click="removeRow(idx)"
            />
          </div>
        </div>

        <div class="sticky bottom-0 flex justify-end gap-2 bg-white/90 py-3">
          <el-button @click="router.push('/VocabSets')">{{ t("vocab.cancel") }}</el-button>
          <el-button type="primary" size="large" :loading="saving" @click="handleSave">
            {{ isEdit ? t("vocab.save") : t("vocab.confirm_create") }}
          </el-button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { Back, Close, Plus, Upload, Delete, Loading } from "@element-plus/icons-vue";
import { useAuthStore, useVocabStore } from "@/stores/index.js";
import { useGoogleTTS } from "@/composables/useGoogleTTS.js";
import RubyWord from "@/components/vocab/RubyWord.vue";

const MAX_WORDS = 500;

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const vocabStore = useVocabStore();
const { speak, speakingKey } = useGoogleTTS("ja");

const setId = computed(() => (route.params.id ? Number(route.params.id) : null));
const isEdit = computed(() => !!setId.value);

const title = ref("");
const description = ref("");
const importText = ref("");
const autoTranslate = ref(true);
const showImport = ref(true);
const rows = ref([]);
const converting = ref(false);
const saving = ref(false);
const loadingSet = ref(false);

let rowSeq = 0;
const makeRow = (w = {}) => ({
  key: ++rowSeq,
  vocab_word_id: w.vocab_word_id ?? null,
  word: w.word ?? "",
  tokens: (w.tokens ?? []).map((tk) => ({ ori: tk.ori, cvt: tk.cvt ?? "" })),
  kana: w.kana ?? "",
  romaji: w.romaji ?? "",
  meaning: w.meaning ?? "",
  auto_meaning: !!w.auto_meaning,
  convertedWord: w.word ?? "", // 上次轉換時的原文，用來判斷是否需要重轉
  editReading: false,
  converting: false,
});

const translateTarget = () => (locale.value === "en" ? "en" : "zh-TW");

// --- 匯入解析 ---
// 每行一個單字；分隔依序判斷：Tab > 逗號（半形/全形）> 第一個空白（半形/全形）
const parseLine = (line) => {
  const text = line.trim();
  if (!text) return null;
  let m = text.match(/^([^\t]+)\t+(.*)$/);
  if (!m) m = text.match(/^([^,，]+)[,，](.*)$/);
  if (!m) m = text.match(/^(\S+)[\s　]+(.*)$/);
  const word = (m ? m[1] : text).trim();
  const meaning = (m ? m[2] : "").trim();
  return word ? { word, meaning } : null;
};

const parsedImport = computed(() =>
  importText.value.split(/\r?\n/).map(parseLine).filter(Boolean),
);

const handleImport = async () => {
  const items = parsedImport.value;
  if (rows.value.length + items.length > MAX_WORDS) {
    ElMessage.warning(t("vocab.too_many", { n: MAX_WORDS }));
    return;
  }
  converting.value = true;
  try {
    const converted = await vocabStore.convertWords(
      items,
      autoTranslate.value,
      translateTarget(),
    );
    rows.value.push(...converted.map(makeRow));
    importText.value = "";
    showImport.value = false;
  } catch (err) {
    ElMessage.error(err.message || t("vocab.convert_failed"));
  } finally {
    converting.value = false;
  }
};

// --- 單列編輯 ---
const isKana = (text) => /^[぀-ゟー\s]*$/.test(text);
const kanjiTokens = (row) => row.tokens.filter((tk) => tk.cvt || !isKana(tk.ori));

// 發音以標記的假名為主；原文改過還沒重轉時用原文
const speechText = (row) =>
  (row.word.trim() === row.convertedWord && row.kana) || row.word;

const convertRow = async (row, payload) => {
  row.converting = true;
  try {
    const [res] = await vocabStore.convertWords([payload], false, translateTarget());
    if (res) {
      row.tokens = res.tokens;
      row.kana = res.kana;
      row.romaji = res.romaji;
      row.convertedWord = res.word;
    }
  } catch (err) {
    ElMessage.error(err.message || t("vocab.convert_failed"));
  } finally {
    row.converting = false;
  }
};

// 改了單字原文：重新斷詞標註（意思保留）
const reconvertRow = (row) => {
  row.word = row.word.trim();
  if (!row.word || row.word === row.convertedWord) return;
  row.editReading = false;
  convertRow(row, { word: row.word });
};

// 手動改讀音：依 tokens 重算全假名與羅馬拼音
const onReadingChange = (row) => {
  row.tokens.forEach((tk) => (tk.cvt = tk.cvt.trim()));
  convertRow(row, { word: row.word, tokens: row.tokens });
};

const addRow = () => {
  if (rows.value.length >= MAX_WORDS) {
    ElMessage.warning(t("vocab.too_many", { n: MAX_WORDS }));
    return;
  }
  rows.value.push(makeRow());
};

const removeRow = (idx) => rows.value.splice(idx, 1);

// --- 驗證 ---
const duplicateKeys = computed(() => {
  const seen = new Map();
  const dup = new Set();
  for (const row of rows.value) {
    const w = row.word.trim();
    if (!w) continue;
    if (seen.has(w)) {
      dup.add(row.key);
      dup.add(seen.get(w));
    } else seen.set(w, row.key);
  }
  return dup;
});

const showErrors = ref(false);
const rowError = (row) => {
  if (!showErrors.value) return "";
  if (!row.word.trim()) return t("vocab.word_required");
  if (!row.meaning.trim()) return t("vocab.meaning_required");
  return "";
};

const handleSave = async () => {
  showErrors.value = true;
  if (!title.value.trim()) {
    ElMessage.warning(t("vocab.title_required"));
    return;
  }
  // 完全空白的列直接略過
  const filled = rows.value.filter((r) => r.word.trim() || r.meaning.trim());
  if (!filled.length) {
    ElMessage.warning(t("vocab.words_required"));
    return;
  }
  if (filled.some((r) => rowError(r))) {
    ElMessage.warning(t("vocab.fix_errors"));
    return;
  }
  if (rows.value.some((r) => r.converting)) {
    ElMessage.warning(t("vocab.converting_wait"));
    return;
  }

  saving.value = true;
  try {
    await vocabStore.saveSet({
      vocab_set_id: setId.value,
      title: title.value.trim(),
      description: description.value.trim(),
      words: filled.map((r) => {
        // 原文改過但還沒轉換成功時，不送出舊的讀音
        const fresh = r.word.trim() === r.convertedWord;
        return {
          vocab_word_id: r.vocab_word_id,
          word: r.word.trim(),
          tokens: fresh ? r.tokens : [],
          kana: fresh ? r.kana : "",
          romaji: fresh ? r.romaji : "",
          meaning: r.meaning.trim(),
        };
      }),
    });
    ElMessage.success(isEdit.value ? t("vocab.saved") : t("vocab.created"));
    router.push("/VocabSets");
  } catch (err) {
    ElMessage.error(err.message);
  } finally {
    saving.value = false;
  }
};

// --- 編輯模式：載入既有單字 ---
const loadSet = async () => {
  if (!isEdit.value || !authStore.isAdmin) return;
  loadingSet.value = true;
  try {
    const data = await vocabStore.getSet(setId.value);
    title.value = data.title;
    description.value = data.description;
    rows.value = data.words.map(makeRow);
    showImport.value = false;
  } catch (err) {
    ElMessage.error(err.message);
    router.replace("/VocabSets");
  } finally {
    loadingSet.value = false;
  }
};

onMounted(() => {
  document.title = `${isEdit.value ? t("vocab.edit_set") : t("vocab.create_set")} - ${t("site_title")}`;
  loadSet();
});
</script>

<style scoped>
.import-input :deep(textarea) {
  font-size: 1.05rem;
}
.auto-meaning :deep(.el-input__wrapper) {
  background-color: #fffbeb;
}
</style>
