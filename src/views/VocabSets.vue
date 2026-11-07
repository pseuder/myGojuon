<template>
  <!-- 外框高度固定為可視高度（寬版版面），卡片清單在框內捲動 -->
  <div class="flex h-full flex-col gap-4 overflow-y-auto px-2 py-4 md:px-4">
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-3">
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

    <!-- 搜尋在上、單字集在下 -->
    <div v-else class="flex flex-col gap-4">
      <!-- 單字搜尋：查某個單字是否已存在於系統中 -->
      <div class="flex shrink-0 flex-col gap-2">
        <el-input
          v-model="keyword"
          class="w-full md:max-w-xl"
          size="large"
          clearable
          :prefix-icon="Search"
          :placeholder="t('vocab.search_placeholder')"
          @keydown.enter="runSearch"
        />
        <div
          v-if="searchedKeyword"
          v-loading="isSearching"
          class="w-full rounded-lg border border-teal-100 bg-white md:max-w-xl"
        >
          <div v-if="!searchResults.length" class="px-4 py-3 text-gray-500">
            {{ t("vocab.search_not_found", { q: searchedKeyword }) }}
          </div>
          <template v-else>
            <div
              class="border-b border-teal-50 px-4 py-2 text-sm text-gray-500"
            >
              {{ t("vocab.search_found", { n: searchResults.length }) }}
              <span v-if="searchResults.length >= SEARCH_LIMIT">
                ・{{ t("vocab.search_limit_hint", { n: SEARCH_LIMIT }) }}
              </span>
            </div>
            <ul class="max-h-72 overflow-y-auto">
              <li
                v-for="w in searchResults"
                :key="w.vocab_word_id"
                class="flex cursor-pointer items-center gap-3 border-b border-teal-50 px-4 py-2 last:border-b-0 hover:bg-teal-50"
                @click="openDetail(w)"
              >
                <div class="flex min-w-0 flex-1 flex-col">
                  <div class="flex flex-wrap items-baseline gap-x-2">
                    <span class="text-lg font-bold text-teal-800">{{
                      w.word
                    }}</span>
                    <span
                      v-if="w.kana && w.kana !== w.word"
                      class="text-sm text-gray-500"
                    >
                      {{ w.kana }}
                    </span>
                    <el-tag
                      v-if="w.is_exact"
                      type="success"
                      size="small"
                      effect="plain"
                    >
                      {{ t("vocab.search_exact") }}
                    </el-tag>
                  </div>
                  <span class="truncate text-sm text-gray-600">{{
                    w.meaning
                  }}</span>
                </div>
                <el-tag class="max-w-40 shrink-0" type="info" size="small">
                  <span class="truncate">{{ w.set_title }}</span>
                </el-tag>
              </li>
            </ul>
          </template>
        </div>
      </div>

      <!-- 卡片清單 -->
      <div
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
    </div>

    <!-- 單字集詳細 -->
    <VocabSetDetailDialog v-model="detailVisible" :set-id="detailId">
      <template #footer="{ detail }">
        <div class="flex flex-wrap justify-end gap-2">
          <el-button
            v-if="authStore.isAdmin"
            type="danger"
            :icon="Delete"
            plain
            @click="handleDelete(detail)"
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
    </VocabSetDetailDialog>
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
  Search,
} from "@element-plus/icons-vue";
import { useAuthStore, useVocabStore } from "@/stores/index.js";
import VocabSetDetailDialog from "@/components/vocab/VocabSetDetailDialog.vue";

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const vocabStore = useVocabStore();

const detailVisible = ref(false);
const detailId = ref(null);

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

const openDetail = (set) => {
  detailId.value = set.vocab_set_id;
  detailVisible.value = true;
};

// --- 單字搜尋（輸入停頓後自動查詢）---
const SEARCH_LIMIT = 50; // 與後端 vocab_module.SEARCH_LIMIT 一致
const keyword = ref("");
const searchedKeyword = ref("");
const searchResults = ref([]);
const isSearching = ref(false);
let searchTimer = null;
let searchSeq = 0;

const runSearch = async () => {
  clearTimeout(searchTimer);
  const q = keyword.value.trim();
  const seq = ++searchSeq;
  if (!q) {
    searchedKeyword.value = "";
    searchResults.value = [];
    return;
  }
  isSearching.value = true;
  try {
    const res = await vocabStore.searchWords(q);
    if (seq !== searchSeq) return; // 已有較新的查詢
    searchResults.value = res;
    searchedKeyword.value = q;
  } catch (err) {
    if (seq === searchSeq) ElMessage.error(err.message);
  } finally {
    if (seq === searchSeq) isSearching.value = false;
  }
};

watch(keyword, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(runSearch, 300);
});

const studySet = (setId) => {
  router.push({ path: "/VocabStudy", query: { sets: String(setId) } });
};

const handleDelete = async (detail) => {
  try {
    await ElMessageBox.confirm(
      t("vocab.delete_confirm", { title: detail.title }),
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
    await vocabStore.deleteSet(detail.vocab_set_id);
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
