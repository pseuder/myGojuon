<template>
  <!-- 單字集詳細：開啟時依 setId 載入；底部按鈕由使用的頁面透過 footer slot 決定 -->
  <el-dialog
    :model-value="modelValue"
    :title="detail?.title || ''"
    width="min(720px, 95vw)"
    top="5vh"
    append-to-body
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-loading="loading" class="flex min-h-32 flex-col gap-3">
      <template v-if="detail">
        <p v-if="detail.description" class="whitespace-pre-wrap text-gray-600">
          {{ detail.description }}
        </p>
        <p class="text-sm text-gray-500">
          {{ t("vocab.creator") }}：{{ detail.creator_name || "-" }} ・
          {{ detail.words.length }} {{ t("vocab.words") }}
        </p>

        <div
          class="max-h-[55vh] overflow-y-auto rounded border border-gray-200"
        >
          <div
            v-for="w in detail.words"
            :key="w.vocab_word_id"
            class="flex items-center gap-3 border-b border-gray-100 px-3 py-1 last:border-b-0"
          >
            <button
              type="button"
              class="shrink-0 rounded-full p-1 hover:bg-indigo-100"
              :title="t('tools.speak')"
              @click="speak(w.kana || w.word, w.vocab_word_id)"
            >
              <img
                :src="
                  speakingKey === w.vocab_word_id
                    ? '/images/volume2.png'
                    : '/images/volume.png'
                "
                alt=""
                class="h-5 w-5"
              />
            </button>
            <RubyWord
              :word="w.word"
              :tokens="w.tokens"
              class="min-w-24 text-xl"
            />
            <span class="flex-1 text-gray-700">{{ w.meaning }}</span>
            <span class="shrink-0 text-xs whitespace-nowrap">
              <span class="text-emerald-600">✓{{ w.familiar_count }}</span>
              <span class="ml-2 text-red-500">✗{{ w.unfamiliar_count }}</span>
            </span>
          </div>
        </div>
      </template>
    </div>

    <template v-if="detail && $slots.footer" #footer>
      <slot name="footer" :detail="detail" />
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { useVocabStore } from "@/stores/index.js";
import { useGoogleTTS } from "@/composables/useGoogleTTS.js";
import RubyWord from "@/components/vocab/RubyWord.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  setId: { type: Number, default: null },
});
const emit = defineEmits(["update:modelValue"]);

const { t } = useI18n();
const vocabStore = useVocabStore();
const { speak, speakingKey, stop } = useGoogleTTS("ja");

const detail = ref(null);
const loading = ref(false);
// 連續點不同學習集時，只採用最後一次的結果
let requestId = 0;

const load = async () => {
  const myId = ++requestId;
  detail.value = null;
  loading.value = true;
  try {
    const data = await vocabStore.getSet(props.setId);
    if (myId === requestId) detail.value = data;
  } catch (err) {
    if (myId !== requestId) return;
    ElMessage.error(err.message);
    emit("update:modelValue", false);
  } finally {
    if (myId === requestId) loading.value = false;
  }
};

watch(
  () => [props.modelValue, props.setId],
  ([open]) => {
    if (open && props.setId != null) load();
    if (!open) stop();
  },
);
</script>
