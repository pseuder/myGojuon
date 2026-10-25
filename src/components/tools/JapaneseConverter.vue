<template>
  <div class="flex flex-col gap-4">
    <el-input
      v-model="inputText"
      type="textarea"
      :autosize="{ minRows: 4, maxRows: 12 }"
      :maxlength="MAX_LENGTH"
      show-word-limit
      :placeholder="t('tools.converter_placeholder')"
      class="converter-input"
    />

    <div v-if="lines.length" class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-500">
          {{ loading ? t("tools.converting") : "" }}
        </span>
        <el-button round @click="speak(allSpeechText(), ALL_KEY)">
          <img
            :src="speakIcon(ALL_KEY)"
            alt=""
            class="mr-2 h-5 w-5"
          />
          {{ t("tools.speak_all") }}
        </el-button>
      </div>

      <div
        v-for="(line, idx) in lines"
        :key="idx"
        class="result-line"
        :class="{ 'opacity-60': loading }"
      >
        <template v-if="line.source.trim()">
          <div class="flex items-start gap-3">
            <button
              type="button"
              class="mt-3 shrink-0 rounded-full p-1 transition hover:bg-indigo-100"
              :title="t('tools.speak')"
              @click="speak(line.kana || line.source, idx)"
            >
              <img :src="speakIcon(idx)" :alt="t('tools.speak')" class="h-6 w-6" />
            </button>
            <div class="flex min-w-0 flex-col gap-1">
              <p class="ruby-line text-xl">
                <!-- prettier-ignore -->
                <template v-for="(token, tIdx) in line.tokens" :key="tIdx"><ruby v-if="token.cvt">{{ token.ori }}<rt>{{ token.cvt }}</rt></ruby><span v-else>{{ token.ori }}</span></template>
              </p>
              <p class="text-indigo-700">{{ line.kana }}</p>
              <p class="text-gray-600 italic">{{ line.romaji }}</p>
              <p v-if="lineTranslations" class="text-emerald-700">
                {{ lineTranslations[idx] }}
              </p>
            </div>
          </div>
        </template>
      </div>

      <!-- 譯文行數與原文對不上時，改為整段顯示 -->
      <div
        v-if="translations.length && !lineTranslations"
        class="rounded-lg bg-emerald-50 p-3 text-emerald-800"
      >
        <p class="mb-1 text-sm text-emerald-600">{{ t("tools.translation") }}</p>
        <p class="whitespace-pre-wrap">{{ translations.join("\n") }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useApi } from "@/composables/useApi.js";
import { useGoogleTTS } from "@/composables/useGoogleTTS.js";

const { t, locale } = useI18n();
const MYAPI = useApi();
const { speak, speakingKey } = useGoogleTTS("ja");

const MAX_LENGTH = 2000;
const DEBOUNCE_MS = 300;
const ALL_KEY = "__all__";

const inputText = ref("");
const lines = ref([]);
const translations = ref([]);
const loading = ref(false);

// 譯文與原文逐行對應；行數不同則回傳 null
const lineTranslations = computed(() =>
  translations.value.length === lines.value.length ? translations.value : null,
);

// 全部朗讀以轉換後的假名為主；輸入改過還沒轉換完時用原文
const allSpeechText = () => {
  const converted = lines.value.map((line) => line.source).join("\n");
  if (converted !== inputText.value) return inputText.value;
  return lines.value.map((line) => line.kana || line.source).join("\n");
};

const speakIcon = (key) =>
  speakingKey.value === key ? "/images/volume2.png" : "/images/volume.png";

// 只採用最後一次請求的結果，避免較慢的舊回應覆蓋新內容
let requestSeq = 0;
let debounceTimer = null;

// 翻譯與假名轉換分開請求，翻譯較慢或失敗都不影響假名顯示
const translate = async (text, seq) => {
  try {
    const res = await MYAPI.post("/translate_japanese", {
      text,
      target: locale.value === "en" ? "en" : "zh-TW",
    });
    if (seq !== requestSeq) return;
    translations.value = res.status === "success" ? res.data : [];
  } catch (err) {
    console.error(err);
    if (seq === requestSeq) translations.value = [];
  }
};

const convert = async (text) => {
  const seq = ++requestSeq;
  loading.value = true;
  translate(text, seq);
  try {
    const res = await MYAPI.post("/convert_japanese", { text });
    if (seq !== requestSeq) return;
    if (res.status === "success") {
      const sourceLines = text.split("\n");
      lines.value = res.data.map((line, i) => ({
        ...line,
        source: sourceLines[i] ?? "",
      }));
    }
  } catch (err) {
    console.error(err);
  } finally {
    if (seq === requestSeq) loading.value = false;
  }
};

watch(inputText, (text) => {
  clearTimeout(debounceTimer);
  if (!text.trim()) {
    requestSeq++;
    lines.value = [];
    translations.value = [];
    loading.value = false;
    return;
  }
  debounceTimer = setTimeout(() => convert(text), DEBOUNCE_MS);
});
</script>

<style scoped>
.converter-input :deep(textarea) {
  font-size: 1.125rem;
}
.result-line {
  min-height: 0.75rem;
  transition: opacity 0.15s;
}
.ruby-line {
  line-height: 2.4;
}
.ruby-line ruby {
  ruby-align: center;
}
.ruby-line rt {
  font-size: 0.55em;
  color: #6366f1;
}
</style>
