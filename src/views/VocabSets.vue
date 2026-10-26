<template>
  <div class="flex h-full flex-col gap-4 px-2 py-4 md:px-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-bold text-indigo-700">{{ t("vocab.title") }}</h1>
      <div v-if="authStore.isLoggedIn" class="flex gap-2">
        <el-button
          v-if="authStore.isAdmin"
          type="primary"
          :icon="Plus"
          @click="router.push('/VocabSets/create')"
        >
          {{ t("vocab.create_set") }}
        </el-button>
        <el-button
          type="success"
          :icon="CaretRight"
          :disabled="!vocabStore.sets.length"
          @click="router.push('/VocabStudy')"
        >
          {{ t("vocab.start_study") }}
        </el-button>
      </div>
    </div>

    <!-- 未登入 -->
    <div
      v-if="!authStore.isLoggedIn"
      class="flex flex-col items-center justify-center gap-4 py-20 text-gray-400"
    >
      <el-icon class="text-6xl"><Collection /></el-icon>
      <p class="text-lg">{{ t("vocab.login_required") }}</p>
    </div>

    <!-- 卡片清單 -->
    <div
      v-else
      v-loading="vocabStore.isFetching && !vocabStore.sets.length"
      class="flex min-h-40 w-full flex-wrap content-start justify-center gap-4 p-2"
    >
      <div
        v-for="set in vocabStore.sets"
        :key="set.vocab_set_id"
        class="flex w-full flex-col sm:w-fit"
      >
        <div
          class="vocab-card relative flex h-52 w-full cursor-pointer flex-col overflow-hidden rounded-lg border border-teal-100 sm:w-80 md:w-96"
          @click="openDetail(set)"
        >
          <div
            class="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 bg-linear-to-br from-emerald-100 to-teal-200 px-12"
          >
            <span
              class="line-clamp-2 text-center text-3xl font-bold text-teal-800"
            >
              {{ set.title }}
            </span>
            <span class="text-sm text-teal-700">
              {{ t("vocab.creator") }}：{{ set.creator_name || "-" }}
            </span>
          </div>

          <!-- 右上角：重置次數 / 直接開始學這一集 -->
          <div class="absolute top-2 right-2 flex gap-1" @click.stop>
            <el-button
              style="margin-left: 0; font-size: 18px"
              circle
              size="small"
              type="warning"
              :icon="RefreshLeft"
              :title="t('vocab.reset_stats')"
              :disabled="!set.studied_count"
              :loading="resettingId === set.vocab_set_id"
              @click="handleReset(set)"
            />
            <el-button
              style="margin-left: 0; font-size: 20px"
              circle
              size="small"
              type="success"
              :icon="CaretRight"
              :title="t('vocab.study_this')"
              @click="studySet(set.vocab_set_id)"
            />
          </div>

          <div
            class="flex flex-col gap-1 border-t border-teal-100 bg-white px-3 py-2"
          >
            <div class="flex items-center justify-between text-lg font-bold">
              <span>{{ set.word_count }} {{ t("vocab.words") }}</span>
              <el-tag
                v-if="set.unfamiliar_count > 0"
                type="danger"
                size="small"
                effect="plain"
              >
                {{ t("vocab.unfamiliar") }} {{ set.unfamiliar_count }}
              </el-tag>
            </div>
            <el-progress
              :percentage="progressOf(set)"
              :stroke-width="6"
              :format="() => `${set.studied_count}/${set.word_count}`"
            />
          </div>
        </div>
      </div>

      <div
        v-if="vocabStore.isInitialized && !vocabStore.sets.length"
        class="w-full pt-8 text-center text-gray-400"
      >
        {{ t("vocab.no_sets") }}
      </div>
    </div>

    <!-- 單字集詳細 -->
    <el-dialog
      v-model="detailVisible"
      :title="detail?.title || ''"
      width="min(720px, 95vw)"
      top="5vh"
      append-to-body
    >
      <div v-loading="detailLoading" class="flex min-h-32 flex-col gap-3">
        <template v-if="detail">
          <p
            v-if="detail.description"
            class="whitespace-pre-wrap text-gray-600"
          >
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

      <template #footer>
        <div v-if="detail" class="flex flex-wrap justify-end gap-2">
          <el-button
            v-if="authStore.isAdmin"
            type="danger"
            :icon="Delete"
            plain
            @click="handleDelete"
          >
            {{ t("vocab.delete") }}
          </el-button>
          <el-button
            v-if="authStore.isAdmin"
            :icon="Edit"
            @click="router.push(`/VocabSets/${detail.vocab_set_id}/edit`)"
          >
            {{ t("vocab.edit") }}
          </el-button>
          <el-button
            type="success"
            :icon="CaretRight"
            @click="studySet(detail.vocab_set_id)"
          >
            {{ t("vocab.study_this") }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  VideoPlay,
  Collection,
  Edit,
  Delete,
  RefreshLeft,
  CaretRight,
} from "@element-plus/icons-vue";
import { useAuthStore, useVocabStore } from "@/stores/index.js";
import { useGoogleTTS } from "@/composables/useGoogleTTS.js";
import RubyWord from "@/components/vocab/RubyWord.vue";

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const vocabStore = useVocabStore();
const { speak, speakingKey } = useGoogleTTS("ja");

const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref(null);

const progressOf = (set) =>
  set.word_count ? Math.round((set.studied_count / set.word_count) * 100) : 0;

const loadSets = async () => {
  if (!authStore.isLoggedIn) return;
  try {
    await vocabStore.fetchSets();
  } catch (err) {
    ElMessage.error(err.message);
  }
};

const openDetail = async (set) => {
  detail.value = null;
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    detail.value = await vocabStore.getSet(set.vocab_set_id);
  } catch (err) {
    ElMessage.error(err.message);
    detailVisible.value = false;
  } finally {
    detailLoading.value = false;
  }
};

const studySet = (setId) => {
  router.push({ path: "/VocabStudy", query: { sets: String(setId) } });
};

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      t("vocab.delete_confirm", { title: detail.value.title }),
      t("vocab.delete"),
      {
        type: "warning",
        confirmButtonText: t("vocab.delete"),
        cancelButtonText: t("vocab.cancel"),
      },
    );
  } catch {
    return;
  }
  try {
    await vocabStore.deleteSet(detail.value.vocab_set_id);
    detailVisible.value = false;
    ElMessage.success(t("vocab.deleted"));
  } catch (err) {
    ElMessage.error(err.message);
  }
};

// 重置自己在此學習集的熟悉 / 不熟悉次數
const resettingId = ref(null);
const handleReset = async (set) => {
  try {
    await ElMessageBox.confirm(
      t("vocab.reset_confirm", { title: set.title }),
      t("vocab.reset_stats"),
      {
        type: "warning",
        confirmButtonText: t("vocab.reset"),
        cancelButtonText: t("vocab.cancel"),
      },
    );
  } catch {
    return;
  }
  resettingId.value = set.vocab_set_id;
  try {
    await vocabStore.resetStats(set.vocab_set_id);
    ElMessage.success(t("vocab.reset_done"));
  } catch (err) {
    ElMessage.error(err.message);
  } finally {
    resettingId.value = null;
  }
};

watch(() => authStore.isLoggedIn, loadSets);

onMounted(() => {
  document.title = `${t("vocab.title")} - ${t("site_title")}`;
  loadSets();
});
</script>

<style scoped>
.vocab-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition:
    box-shadow 0.2s,
    transform 0.2s;
}
.vocab-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}
</style>
