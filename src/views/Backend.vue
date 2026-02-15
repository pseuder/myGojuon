<template>
  <div class="flex h-full flex-col gap-4 px-4 py-4">
    <!-- filter bar -->
    <div class="flex items-center justify-between">
      <el-input
        v-model="songFilterText"
        placeholder="請輸入作者名稱進行過濾"
        class="w-full"
        clearable
      />
    </div>
    <!-- 原生HTML表格 -->
    <div class="table-container">
      <table ref="authorTableRef" class="native-table">
        <thead>
          <tr>
            <th class="drag-handle-header"></th>
            <th class="sortable">顯示順序</th>
            <th class="sortable">作者</th>
            <th class="sortable">歌曲數量</th>
            <th class="sortable">公開</th>

            <th class="operations">
              <div class="text-center">
                <el-button type="success" @click="songhandleAdd"
                  >新增歌曲</el-button
                >
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in authorfilteredTableData"
            :key="row.id"
            :data-id="row.id"
            class="table-row"
          >
            <td class="drag-handle">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path
                  d="M5 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM5 7a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-6 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"
                />
              </svg>
            </td>
            <td>{{ row.display_order }}</td>
            <td>{{ row.name }}</td>
            <td>{{ row.song_count }}</td>
            <td>{{ row.is_public ? "是" : "否" }}</td>

            <td class="operations">
              <el-button
                type="primary"
                size="small"
                @click="authorhandleEdit(row)"
                >編輯</el-button
              >
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
          <el-input v-model="authorformData.name"></el-input>
        </el-form-item>
        <el-form-item label="公開" prop="is_public">
          <el-switch v-model="authorformData.is_public"></el-switch>
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
                  <td class="drag-handle">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path
                        d="M5 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM5 7a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-6 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"
                      />
                    </svg>
                  </td>
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
                      type="primary"
                      size="small"
                      @click="songhandleEdit(song)"
                      >編輯歌曲</el-button
                    >
                    <el-button
                      type="danger"
                      size="small"
                      @click="songhandleDelete(song)"
                      >刪除歌曲</el-button
                    >
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
        <el-button type="primary" @click="updateAuthorInfo">{{
          authorIsEdit ? "更新" : "新增"
        }}</el-button>
        <el-button @click="authorDialogVisible = false">取消</el-button>
      </div>
    </template>
  </el-dialog>

  <el-dialog
    :title="songDialogTitle"
    v-model="songDialogVisible"
    width="80%"
    top="5vh"
    style="height: 85vh; overflow: auto"
    body-class="h-[85%]"
  >
    <div class="h-full">
      <el-form
        :model="songformData"
        ref="songform"
        label-width="80px"
        label-position="left"
        v-loading="songDialogLoading"
        class="h-full overflow-auto"
      >
        <el-form-item label="影片名稱" prop="name">
          <el-input v-model="songformData.name"></el-input>
        </el-form-item>
        <el-form-item label="作者" prop="name">
          <el-input v-model="songformData.author"></el-input>
        </el-form-item>
        <el-form-item label="影片ID" prop="source_id">
          <el-input v-model="songformData.source_id"></el-input>
        </el-form-item>
        <el-form-item label="影片標籤" prop="tags">
          <el-input
            v-model="songformData.tags"
            placeholder="請用逗號分隔"
          ></el-input>
        </el-form-item>
        <el-form-item label="公開" prop="is_public">
          <el-switch v-model="songformData.is_public"></el-switch>
        </el-form-item>
        <el-form-item label="歌詞" prop="original">
          <div class="flex w-full">
            <el-input
              v-model="songformData.original"
              class="flex-1"
              type="textarea"
              rows="15"
            ></el-input>
            <el-input
              v-model="songformData.converted"
              class="flex-1"
              type="textarea"
              rows="15"
              v-loading="songconvertLoading"
            ></el-input>
          </div>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <div class="shrink-0 text-right">
        <el-button @click="convert_lyrics">取得轉換歌詞</el-button>
        <el-button type="primary" @click="saveVideo">{{
          songIsEdit ? "更新" : "新增"
        }}</el-button>
        <el-button @click="songDialogVisible = false">取消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { ElMessage } from "element-plus";
import Sortable from "sortablejs";
import { useApi } from "@/composables/useApi.js";
import { useRouter } from "vue-router";
const MYAPI = useApi();

const songTableData = ref([]);
const songDialogVisible = ref(false);
const songDialogLoading = ref(false);
const songIsEdit = ref(false);
const songFilterText = ref("");
const songDialogTitle = computed(() =>
  songIsEdit.value ? "編輯歌曲" : "新增歌曲",
);
const songconvertLoading = ref(false);
const songform = ref(null);
const songformData = ref({
  id: "",
  source_id: "",
  name: "",
  author: "",
  tags: "",
  is_public: false,
  original: "",
  converted: "",
});

const authorTableData = ref([]);
const authorDialogVisible = ref(false);
const authorDialogLoading = ref(false);
const authorIsEdit = ref(false);
const authorFilterText = ref("");
const authorDialogTitle = "編輯作者";
const authorform = ref(null);
const authorformData = ref({
  id: "",
  name: "",
  is_public: false,
  display_order: 0,
  songs: [],
  orderData: [],
});

const authorTableRef = ref(null);
const songTableRef = ref(null);

const authorfilteredTableData = computed(() => {
  if (!songFilterText.value) {
    return songTableData.value;
  }
  const lowerCaseFilter = songFilterText.value.toLowerCase();
  return songTableData.value.filter((item) => {
    return item.name && item.name.toLowerCase().includes(lowerCaseFilter);
  });
});

const songhandleAdd = () => {
  songresetForm();
  songIsEdit.value = false;
  songDialogVisible.value = true;
};

// 跳轉至新視窗 /S/<video_id>
const songhandleJumpEdit = (row) => {
  const videoId = row.source_id;
  if (videoId) {
    const url = `/S/${videoId}`;
    window.open(url, "_blank");
  }
};

const songhandleEdit = (row) => {
  songresetForm();
  songDialogVisible.value = true;
  songDialogLoading.value = true;
  MYAPI.get("/get_video/" + row.source_id).then((res) => {
    let data = res["data"];
    songformData.value = { ...row };
    songformData.value.is_public = data.is_public === 1;
    songformData.value.original = data.original;
    songformData.value.converted = data.converted;
    songformData.value.author = authorformData.value.name;
    songIsEdit.value = true;
    songDialogLoading.value = false;
  });
};

const authorresetForm = () => {
  authorformData.value = {
    id: "",
    name: "",
    is_public: false,
    display_order: 0,
    songs: [],
  };
};

const authorhandleAdd = () => {
  authorresetForm();
  authorIsEdit.value = false;
  authorDialogVisible.value = true;
};

const authorhandleEdit = (row) => {
  authorresetForm();
  authorDialogVisible.value = true;
  authorDialogLoading.value = true;
  MYAPI.get("/get_author/" + row.id).then((res) => {
    let data = res["data"];
    authorformData.value.is_public = data.is_public === 1;
    authorformData.value.songs = data.songs || [];
    authorformData.value.id = data.id;
    authorformData.value.name = data.name;

    authorIsEdit.value = true;
    authorDialogLoading.value = false;

    // 初始化歌曲拖曳排序
    nextTick(() => {
      songinitSortable();

      ElMessage.info("歌曲列表已初始化拖曳排序功能");
    });
  });
};

// 初始化特定作者的歌曲拖曳排序
const songinitSortable = () => {
  // 獲取原生表格的 tbody 元素
  const tbody = songTableRef.value.querySelector("tbody");

  Sortable.create(tbody, {
    animation: 150, // 拖曳動畫時間
    handle: ".drag-handle", // 只能通過這個 class 的元素來拖動
    // 拖曳結束後觸發的事件
    onEnd: async (evt) => {
      ElMessage.info("拖曳結束，正在更新順序...");
      const { oldIndex, newIndex } = evt;

      // 如果位置沒有改變，則不執行任何操作
      if (oldIndex === newIndex) {
        return;
      }

      // 1. 更新前端數據順序，讓畫面保持同步
      const itemToMove = authorformData.value.songs.splice(oldIndex, 1)[0];
      authorformData.value.songs.splice(newIndex, 0, itemToMove);

      // 2. 準備要送到後端的資料
      const orderData = authorformData.value.songs.map((item, index) => {
        // 更新本地的 display_order，雖然不是必須，但保持資料一致性是個好習慣
        item.display_order = index + 1;
        return {
          video_id: item.id,
          author_id: authorformData.value.id,
          display_order: index + 1, // 順序從 1 開始
        };
      });

      authorformData.value.orderData = orderData;

      // 3. 呼叫 API 更新後端資料庫
      // await updateSongOrder(orderData);
    },
  });
};

const updateAuthorInfo = async () => {
  try {
    const res = await MYAPI.post("/update_authorInfo", {
      author_id: authorformData.value.id,
      author_name: authorformData.value.name,
      author_is_public: authorformData.value.is_public ? 1 : 0,
      new_orders: authorformData.value.orderData,
    });
    if (res.status === "success") {
      ElMessage.success("歌曲順序更新成功！");
      // 可以選擇重新獲取一次資料，以確保完全同步
      // authorfetchData();
    } else {
      ElMessage.error(res.message || "更新順序失敗");
      // 如果更新失敗，最好是重新載入資料以還原順序
      authorfetchData();
    }
  } catch (error) {
    console.error("更新歌曲順序時發生錯誤:", error);
    ElMessage.error("更新順序時發生網路錯誤");
    // 出錯時也還原順序
    authorfetchData();
  }
};

const songhandleDelete = (row) => {
  ElMessageBox.confirm("確定刪除此影片嗎?", "提示", {
    confirmButtonText: "OK",
    cancelButtonText: "Cancel",
    type: "warning",
  })
    .then(async () => {
      await MYAPI.del("/delete_video/" + row.id);
      authorfetchData();
      songDialogVisible.value = false;
      ElMessage({
        type: "success",
        message: "刪除成功",
      });
    })
    .catch(() => {
      ElMessage({
        type: "info",
        message: "已取消刪除",
      });
    });
};

function customStringify(obj) {
  return (
    JSON.stringify(obj, null, 2)
      // 處理 lyrics 內部的物件格式
      .replace(
        /{\s*"cvt":\s*"([^"]*)",\s*"ori":\s*"([^"]*)"\s*}/g,
        '{"cvt": "$1","ori": "$2"}',
      )
      // 修正最後一個逗號後的換行
      .replace(/},\s+]/g, "},\n  ]")
  );
}

const convert_lyrics = async () => {
  songconvertLoading.value = true;
  let res = await MYAPI.post("/convert_lyrics", {
    lyrics: songformData.value.original,
  });

  if (res["status"] === "success") {
    songformData.value.converted = customStringify(res["data"]);
  } else {
    console.error(res);
  }

  ElMessage({
    type: "success",
    message: "轉換成功",
  });

  songconvertLoading.value = false;
};

const saveVideo = async () => {
  songDialogLoading.value = true;
  let res = await MYAPI.post("/upsert_video", songformData.value);

  if (res["status"] === "success") {
    authorfetchData();
  } else {
    console.error(res);
  }

  ElMessage({
    type: res["status"],
    message: res["message"],
  });
  songDialogLoading.value = false;
};

const authorfetchData = () => {
  MYAPI.get("/get_all_authors").then((res) => {
    if (res["status"] == "success") {
      songTableData.value = res["data"];

      nextTick(() => {
        authorinitSortable();
      });
    } else {
      ElMessage({
        type: res["status"],
        message: res["message"],
      });
    }
  });
};

const authorinitSortable = () => {
  // 獲取原生表格的 tbody 元素
  const tbody = authorTableRef.value.querySelector("tbody");

  Sortable.create(tbody, {
    animation: 150, // 拖曳動畫時間
    handle: ".drag-handle", // 只能通過這個 class 的元素來拖動
    // 拖曳結束後觸發的事件
    onEnd: async (evt) => {
      ElMessage.info("拖曳結束，正在更新順序...");
      const { oldIndex, newIndex } = evt;

      // 如果位置沒有改變，則不執行任何操作
      if (oldIndex === newIndex) {
        return;
      }

      // 1. 更新前端數據順序，讓畫面保持同步
      const itemToMove = songTableData.value.splice(oldIndex, 1)[0];
      songTableData.value.splice(newIndex, 0, itemToMove);

      // 2. 準備要送到後端的資料
      const orderData = songTableData.value.map((item, index) => {
        // 更新本地的 display_order，雖然不是必須，但保持資料一致性是個好習慣
        item.display_order = index + 1;
        return {
          id: item.id,
          display_order: index + 1, // 順序從 1 開始
        };
      });

      // 3. 呼叫 API 更新後端資料庫
      await updateAuthorOrder(orderData);
    },
  });
};

const updateAuthorOrder = async (orderData) => {
  try {
    const res = await MYAPI.post("/update_authors_order", {
      new_orders: orderData,
    });
    if (res.status === "success") {
      ElMessage.success("作者順序更新成功！");
      // 可以選擇重新獲取一次資料，以確保完全同步
      // authorfetchData();
    } else {
      ElMessage.error(res.message || "更新順序失敗");
      // 如果更新失敗，最好是重新載入資料以還原順序
      authorfetchData();
    }
  } catch (error) {
    console.error("更新作者順序時發生錯誤:", error);
    ElMessage.error("更新順序時發生網路錯誤");
    // 出錯時也還原順序
    authorfetchData();
  }
};

const songresetForm = () => {
  songformData.value = {
    id: "",
    source_id: "",
    name: "",
    author: "",
    tags: "",
    is_public: false,
    original: "",
    converted: "",
  };
};

const resolveVideoUrl = (source_id) => {
  return "/SongPractice/" + source_id;
};

onMounted(() => {
  authorfetchData();
});
</script>

<style scoped>
@reference "tailwindcss";
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
