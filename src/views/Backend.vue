<template>
  <div class="flex h-full flex-col gap-4 px-4 py-4">
    <div class="text-right">
      <el-button type="primary" @click="openImportDialog">
        從網址匯入歌曲
      </el-button>
    </div>
    <div class="table-container">
      <table ref="authorTableRef" class="native-table">
        <thead>
          <tr>
            <th class="drag-handle-header"></th>
            <th class="sortable">顯示順序</th>
            <th class="sortable">作者</th>
            <th class="sortable">歌曲數量</th>
            <th class="sortable">公開</th>
            <th class="operations"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in songTableData"
            :key="row.artist_id"
            :data-id="row.artist_id"
            class="table-row"
          >
            <td class="drag-handle"><DragIcon /></td>
            <td>{{ row.display_order }}</td>
            <td>{{ row.name }}</td>
            <td>{{ row.song_count }}</td>
            <td>{{ row.artist_is_public ? "是" : "否" }}</td>
            <td class="operations">
              <el-button
                type="primary"
                size="small"
                @click="authorhandleEdit(row)"
              >
                顯示歌手所有歌曲
              </el-button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <el-dialog
    :title="authorDialogTitle"
    v-model="authorDialogVisible"
    width="80%"
    top="5vh"
    style="height: 85vh; overflow: auto"
    body-class="h-[85%]"
  >
    <div class="h-full">
      <el-form
        :model="authorformData"
        ref="authorform"
        label-width="80px"
        label-position="left"
        v-loading="authorDialogLoading"
        class="h-full overflow-auto"
      >
        <el-form-item label="作者名稱" prop="name">
          <el-input v-model="authorformData.name" />
        </el-form-item>
        <el-form-item label="公開" prop="is_public">
          <el-switch v-model="authorformData.is_public" />
        </el-form-item>
        <el-form-item label="歌曲列表">
          <div class="table-container">
            <table class="native-table" ref="songTableRef">
              <thead>
                <tr>
                  <th class="drag-handle-header"></th>
                  <th>顯示順序</th>
                  <th>歌曲名稱</th>
                  <th>影片ID</th>
                  <th>公開</th>
                  <th>標籤</th>
                  <th class="operations">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="song in authorformData.songs"
                  :key="song.song_id"
                  class="song-row"
                >
                  <td class="drag-handle"><DragIcon /></td>
                  <td>{{ song.display_order }}</td>
                  <td>{{ song.name }}</td>
                  <td>{{ song.source_id }}</td>
                  <td>{{ song.is_public ? "是" : "否" }}</td>
                  <td>{{ song.tags }}</td>
                  <td class="operations">
                    <el-button
                      type="success"
                      size="small"
                      @click="songhandleJumpEdit(song)"
                      >跳轉編輯</el-button
                    >
                    <el-button
                      type="danger"
                      size="small"
                      @click="handleSongDelete(song)"
                    >
                      刪除歌曲
                    </el-button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <div class="shrink-0 text-right">
        <el-button type="primary" @click="updateAuthorInfo">更新</el-button>
        <el-button @click="authorDialogVisible = false">取消</el-button>
      </div>
    </template>
  </el-dialog>

  <el-dialog
    title="從網址匯入歌曲"
    v-model="importDialogVisible"
    width="80%"
    top="5vh"
    :close-on-click-modal="!importRunning"
    :close-on-press-escape="!importRunning"
    :show-close="!importRunning"
  >
    <el-form label-width="80px" label-position="left">
      <el-form-item label="歌曲網址">
        <el-input
          v-model="importForm.urls"
          type="textarea"
          :rows="5"
          placeholder="每行一個網址，例如 https://www.marumaru-x.com/japanese-song/play-xxxx"
          :disabled="importRunning"
        />
      </el-form-item>
      <el-form-item label="歌手名稱">
        <el-select
          v-model="importForm.artist"
          filterable
          allow-create
          default-first-option
          placeholder="選擇既有歌手或輸入新名稱"
          :disabled="importRunning"
          class="w-full"
        >
          <el-option
            v-for="row in songTableData"
            :key="row.artist_id"
            :label="row.name"
            :value="row.name"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="公開">
        <el-switch v-model="importForm.is_public" :disabled="importRunning" />
      </el-form-item>
    </el-form>

    <div v-if="importResults.length" class="table-container">
      <table class="native-table">
        <thead>
          <tr>
            <th>網址</th>
            <th>狀態</th>
            <th>歌曲名稱</th>
            <th>發布網址 / 錯誤訊息</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in importResults" :key="item.url">
            <td class="break-all">{{ item.url }}</td>
            <td class="whitespace-nowrap">
              <el-tag :type="importStatusMap[item.status].type">
                {{ importStatusMap[item.status].label }}
              </el-tag>
            </td>
            <td>{{ item.name }}</td>
            <td class="break-all">
              <a
                v-if="item.status === 'success'"
                :href="`/S/${item.source_id}`"
                target="_blank"
                class="text-blue-500 underline"
              >
                {{ publishedUrl(item.source_id) }}
              </a>
              <span v-else-if="item.status === 'error'" class="text-red-500">
                {{ item.message }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <div class="text-right">
        <el-button
          type="primary"
          :loading="importRunning"
          @click="startImport"
        >
          {{ importRunning ? "發布中..." : "開始發布" }}
        </el-button>
        <el-button :disabled="importRunning" @click="importDialogVisible = false">
          關閉
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import Sortable from "sortablejs";
import { useApi } from "@/composables/useApi.js";

const MYAPI = useApi();

// ========================================
// 通用工具
// ========================================

const DragIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M5 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM5 7a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-6 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
    </svg>
  `,
};

// 建立拖曳排序，若已有實例則先銷毀避免重複綁定
const createSortable = (prevInstance, tbodyEl, onEndCallback) => {
  if (prevInstance) prevInstance.destroy();
  return Sortable.create(tbodyEl, {
    animation: 150,
    handle: ".drag-handle",
    onEnd: onEndCallback,
  });
};

// 依陣列位置重新編號 display_order（從 1 開始）
const buildOrderData = (list, mapFn) =>
  list.map((item, index) => {
    item.display_order = index + 1;
    return mapFn(item, index);
  });

// ========================================
// 歌手列表（主表格）
// ========================================

const songTableData = ref([]);
const authorTableRef = ref(null);
let authorSortableInstance = null;

const authorfetchData = () => {
  MYAPI.get("/get_artists_list").then((res) => {
    if (res.status === "success") {
      songTableData.value = res.data;
      nextTick(() => authorinitSortable());
    } else {
      ElMessage({ type: res.status, message: res.message });
    }
  });
};

const authorinitSortable = () => {
  const tbody = authorTableRef.value.querySelector("tbody");
  authorSortableInstance = createSortable(
    authorSortableInstance,
    tbody,
    async ({ oldIndex, newIndex }) => {
      if (oldIndex === newIndex) return;
      ElMessage.info("拖曳結束，正在更新順序...");

      const [item] = songTableData.value.splice(oldIndex, 1);
      songTableData.value.splice(newIndex, 0, item);

      const orderData = buildOrderData(songTableData.value, (item) => ({
        artist_id: item.artist_id,
        display_order: item.display_order,
      }));

      await updateAuthorOrder(orderData);
    },
  );
};

const updateAuthorOrder = async (orderData) => {
  try {
    const res = await MYAPI.post("/update_artist_order", {
      new_orders: orderData,
    });
    if (res.status === "success") {
      ElMessage.success("作者順序更新成功！");
    } else {
      ElMessage.error(res.message || "更新順序失敗");
      authorfetchData();
    }
  } catch (error) {
    console.error("更新作者順序時發生錯誤:", error);
    ElMessage.error("更新順序時發生網路錯誤");
    authorfetchData();
  }
};

// ========================================
// 歌手 Dialog（編輯 + 歌曲列表）
// ========================================

const authorDialogTitle = "編輯作者";
const authorDialogVisible = ref(false);
const authorDialogLoading = ref(false);
const authorformData = ref({
  artist_id: null,
  name: "",
  is_public: false,
  songs: [],
});

const resetAuthorForm = () => {
  authorformData.value = {
    artist_id: null,
    name: "",
    is_public: false,
    songs: [],
  };
};

const authorhandleEdit = async (row) => {
  resetAuthorForm();
  authorDialogVisible.value = true;
  authorDialogLoading.value = true;
  try {
    const res = await MYAPI.get("/get_artist_info/" + row.artist_id);
    if (res.status !== "success") {
      ElMessage.error(res.message || "無法取得作者資訊");
      return;
    }
    const data = res.data;
    authorformData.value = {
      artist_id: data.artist_id,
      name: data.name,
      // PGSQL 回傳 boolean
      is_public: Boolean(data.is_public),
      songs: data.songs || [],
    };
    nextTick(() => songinitSortable());
  } finally {
    authorDialogLoading.value = false;
  }
};

// 以目前畫面上的歌曲順序組出送往後端的資料
const currentSongOrder = () =>
  buildOrderData(authorformData.value.songs, (item) => ({
    song_id: item.song_id,
    display_order: item.display_order,
  }));

const saveArtistInfoAndSongOrder = () =>
  MYAPI.post("/update_artist_info_and_song_order", {
    artist_id: authorformData.value.artist_id,
    artist_name: authorformData.value.name,
    artist_is_public: authorformData.value.is_public ? 1 : 0,
    new_orders: currentSongOrder(),
  });

const updateAuthorInfo = async () => {
  if (!authorformData.value.songs.length) {
    return ElMessage.warning("此作者沒有歌曲，無法更新");
  }
  try {
    const res = await saveArtistInfoAndSongOrder();
    if (res.status === "success") {
      ElMessage.success("作者資訊更新成功！");
      authorDialogVisible.value = false;
      authorfetchData();
    } else {
      ElMessage.error(res.message || "更新失敗");
    }
  } catch (error) {
    console.error("更新作者資訊時發生錯誤:", error);
    ElMessage.error("更新時發生網路錯誤");
  }
};

// ========================================
// 歌曲操作（Dialog 內的歌曲表格）
// ========================================

const songTableRef = ref(null);
let songSortableInstance = null;

const songinitSortable = () => {
  const tbody = songTableRef.value.querySelector("tbody");
  songSortableInstance = createSortable(
    songSortableInstance,
    tbody,
    async ({ oldIndex, newIndex }) => {
      if (oldIndex === newIndex) return;
      ElMessage.info("拖曳結束，正在更新順序...");

      const [item] = authorformData.value.songs.splice(oldIndex, 1);
      authorformData.value.songs.splice(newIndex, 0, item);

      await updateSongOrder();
    },
  );
};

const updateSongOrder = async () => {
  const artistId = authorformData.value.artist_id;
  try {
    const res = await saveArtistInfoAndSongOrder();
    if (res.status === "success") {
      ElMessage.success("歌曲順序更新成功！");
    } else {
      ElMessage.error(res.message || "更新順序失敗");
      authorhandleEdit({ artist_id: artistId });
    }
  } catch (error) {
    console.error("更新歌曲順序時發生錯誤:", error);
    ElMessage.error("更新順序時發生網路錯誤");
    authorhandleEdit({ artist_id: artistId });
  }
};

const songhandleJumpEdit = (row) => {
  if (row.source_id) window.open(`/S/${row.source_id}`, "_blank");
};

const handleSongDelete = (row) => {
  ElMessageBox.confirm("確定刪除此影片嗎?", "提示", {
    confirmButtonText: "OK",
    cancelButtonText: "Cancel",
    type: "warning",
  })
    .then(async () => {
      const res = await MYAPI.del("/delete_song/" + row.source_id);
      if (res.status !== "success") {
        return ElMessage.error(res.message || "刪除失敗");
      }
      authorformData.value.songs = authorformData.value.songs.filter(
        (song) => song.song_id !== row.song_id,
      );
      authorfetchData();
      ElMessage({ type: "success", message: "刪除成功" });
    })
    .catch(() => {
      ElMessage({ type: "info", message: "已取消刪除" });
    });
};

// ========================================
// 從網址匯入歌曲（抓取 marumaru 歌詞並發布）
// ========================================

// 抓取一首歌需要開啟瀏覽器並可能重試，給較長的逾時
const IMPORT_TIMEOUT = 3 * 60 * 1000;

const importStatusMap = {
  pending: { label: "等待中", type: "info" },
  running: { label: "處理中", type: "warning" },
  success: { label: "已發布", type: "success" },
  error: { label: "失敗", type: "danger" },
};

const importDialogVisible = ref(false);
const importRunning = ref(false);
const importForm = ref({ urls: "", artist: "", is_public: false });
const importResults = ref([]);

const publishedUrl = (sourceId) =>
  `${import.meta.env.VITE_SITE_BASE}/S/${sourceId}`;

const openImportDialog = () => {
  importResults.value = [];
  importDialogVisible.value = true;
};

const startImport = async () => {
  const urls = [
    ...new Set(
      importForm.value.urls
        .split("\n")
        .map((url) => url.trim())
        .filter(Boolean),
    ),
  ];
  const artist = (importForm.value.artist || "").trim();
  if (!urls.length) return ElMessage.warning("請填寫至少一個網址");
  if (!artist) return ElMessage.warning("請填寫歌手名稱");

  importRunning.value = true;
  importResults.value = urls.map((url) => ({ url, status: "pending" }));

  // 逐一處理，避免後端同時開啟多個瀏覽器
  for (const item of importResults.value) {
    item.status = "running";
    try {
      const res = await MYAPI.post(
        "/import_maru_song",
        { url: item.url, artist, is_public: importForm.value.is_public },
        {},
        IMPORT_TIMEOUT,
      );
      if (res.status === "success") {
        Object.assign(item, res.data, { status: "success" });
      } else {
        Object.assign(item, { status: "error", message: res.message });
      }
    } catch (error) {
      Object.assign(item, { status: "error", message: error.message });
    }
  }

  importRunning.value = false;
  const successCount = importResults.value.filter(
    (item) => item.status === "success",
  ).length;
  ElMessage({
    type: successCount === urls.length ? "success" : "warning",
    message: `發布完成：成功 ${successCount} / ${urls.length}`,
  });
  authorfetchData();
};

onMounted(() => {
  authorfetchData();
});
</script>

<style scoped>
.table-container {
  width: 100%;
  overflow-x: auto;
}

.native-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #ddd;
  background-color: white;
}

.native-table th,
.native-table td {
  padding: 12px 8px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.native-table th {
  background-color: #f5f7fa;
  font-weight: 600;
  color: #606266;
  border-bottom: 2px solid #ddd;
}

.native-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.3s;
}

.native-table th.sortable:hover {
  background-color: #ebeef5;
}

.native-table tbody tr {
  transition: background-color 0.3s;
}

.native-table tbody tr:hover {
  background-color: #f5f7fa;
}

.native-table tbody tr.table-row {
  cursor: default;
}

.native-table .operations {
  text-align: center;
  white-space: nowrap;
}

.native-table .operations .el-button {
  margin: 0 2px;
}

/* 拖動手柄樣式 */
.drag-handle-header {
  width: 30px;
  padding: 8px 4px !important;
}

.drag-handle {
  width: 30px;
  text-align: center;
  cursor: move;
  color: #909399;
  padding: 12px 4px !important;
}

.drag-handle:hover {
  color: #409eff;
}

.drag-handle svg {
  display: inline-block;
  vertical-align: middle;
}

.sortable-drag {
  opacity: 0.6;
}

.sortable-ghost {
  background-color: #409eff !important;
  color: white;
}
</style>
