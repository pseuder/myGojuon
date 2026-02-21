<template>
  <div class="flex h-full flex-col gap-4 px-4 py-4">
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
            :key="row.id"
            :data-id="row.id"
            class="table-row"
          >
            <td class="drag-handle"><DragIcon /></td>
            <td>{{ row.display_order }}</td>
            <td>{{ row.name }}</td>
            <td>{{ row.song_count }}</td>
            <td>{{ row.is_public ? "是" : "否" }}</td>
            <td class="operations">
              <el-button
                type="primary"
                size="small"
                @click="handleShowAllSongs(row)"
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
                  :key="song.id"
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
                    >
                      跳轉編輯
                    </el-button>
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

const createSortable = (tbodyEl, onEndCallback) => {
  Sortable.create(tbodyEl, {
    animation: 150,
    handle: ".drag-handle",
    onEnd: onEndCallback,
  });
};

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

const fetchArtistData = () => {
  MYAPI.get("/get_artists_list").then((res) => {
    if (res.status === "success") {
      songTableData.value = res.data;
      nextTick(() => initArtistSortable());
    } else {
      ElMessage({ type: res.status, message: res.message });
    }
  });
};

const initArtistSortable = () => {
  const tbody = authorTableRef.value.querySelector("tbody");
  createSortable(tbody, async ({ oldIndex, newIndex }) => {
    if (oldIndex === newIndex) return;
    ElMessage.info("拖曳結束，正在更新順序...");

    const [item] = songTableData.value.splice(oldIndex, 1);
    songTableData.value.splice(newIndex, 0, item);

    const orderData = buildOrderData(songTableData.value, (item) => ({
      artist_id: item.artist_id,
      display_order: item.display_order,
    }));

    await updateArtistOrder(orderData);
  });
};

const updateArtistOrder = async (orderData) => {
  try {
    const res = await MYAPI.post("/update_artist_order", {
      new_orders: orderData,
    });
    if (res.status === "success") {
      ElMessage.success("作者順序更新成功！");
    } else {
      ElMessage.error(res.message || "更新順序失敗");
      fetchArtistData();
    }
  } catch {
    ElMessage.error("更新順序時發生網路錯誤");
    fetchArtistData();
  }
};

// ========================================
// 歌手 Dialog（編輯 + 歌曲列表）
// ========================================

const authorDialogTitle = "編輯作者";
const authorDialogVisible = ref(false);
const authorDialogLoading = ref(false);
const authorformData = ref({
  id: "",
  name: "",
  is_public: false,
  display_order: 0,
  songs: [],
  orderData: [],
});

const resetAuthorForm = () => {
  authorformData.value = {
    id: "",
    name: "",
    is_public: false,
    display_order: 0,
    songs: [],
    orderData: [],
  };
};

const handleShowAllSongs = (row) => {
  resetAuthorForm();
  authorDialogVisible.value = true;
  authorDialogLoading.value = true;

  MYAPI.get("/get_artist_info/" + row.artist_id).then((res) => {
    const data = res.data;
    authorformData.value = {
      ...authorformData.value,
      id: data.artist_id,
      name: data.name,
      is_public: data.is_public,
      songs: data.songs || [],
    };
    authorDialogLoading.value = false;
    nextTick(() => initSongSortable());
  });
};

const updateAuthorInfo = async () => {
  try {
    const res = await MYAPI.post("/update_authorInfo", {
      artist_id: authorformData.value.id,
      artist_name: authorformData.value.name,
      artist_is_public: authorformData.value.is_public,
      new_orders: authorformData.value.orderData,
    });
    if (res.status === "success") {
      ElMessage.success("歌曲順序更新成功！");
    } else {
      ElMessage.error(res.message || "更新順序失敗");
      fetchArtistData();
    }
  } catch {
    ElMessage.error("更新順序時發生網路錯誤");
    fetchArtistData();
  }
};

// ========================================
// 歌曲操作（Dialog 內的歌曲表格）
// ========================================

const songTableRef = ref(null);

const initSongSortable = () => {
  const tbody = songTableRef.value.querySelector("tbody");
  createSortable(tbody, ({ oldIndex, newIndex }) => {
    if (oldIndex === newIndex) return;

    const [item] = authorformData.value.songs.splice(oldIndex, 1);
    authorformData.value.songs.splice(newIndex, 0, item);

    authorformData.value.orderData = buildOrderData(
      authorformData.value.songs,
      (item) => ({
        song_id: item.song_id,
        author_id: authorformData.value.id,
        display_order: item.display_order,
      }),
    );
  });
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
      await MYAPI.del("/delete_song/" + row.song_id);
      fetchArtistData();
      ElMessage({ type: "success", message: "刪除成功" });
    })
    .catch(() => {
      ElMessage({ type: "info", message: "已取消刪除" });
    });
};

// ========================================
// 生命週期
// ========================================

onMounted(() => fetchArtistData());
</script>

<style scoped>
/* 略（與原版相同） */
</style>

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
