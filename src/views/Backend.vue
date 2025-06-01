<template>
  <div class="h-full flex flex-col px-4 py-4 gap-4">
    <!-- filter bar -->
    <div class="flex justify-between items-center">
      <el-input
        v-model="filterText"
        placeholder="請輸入影片名稱、作者進行過濾"
        class="w-full"
        clearable
      />
    </div>
    <el-table
      :data="filteredTableData"
      style="width: 100%"
      highlight-current-row
    >
      <el-table-column
        prop="UID"
        label="UID"
        min-width="100"
        sortable
      ></el-table-column>
      <el-table-column
        prop="video_name"
        label="影片名稱"
        min-width="180"
      ></el-table-column>
      <el-table-column
        prop="author"
        label="作者"
        min-width="100"
      ></el-table-column>
      <el-table-column prop="tags" label="影片標籤" min-width="200">
        <template #default="scope">
          <el-tag
            v-for="tag in scope.row.tags?.split(',')"
            :key="tag"
            type="success"
            class="mb-1"
            >{{ tag }}</el-tag
          >
        </template>
      </el-table-column>
      <el-table-column prop="public" label="公開" min-width="200">
        <template #default="scope">
          <el-tag v-if="scope.row.public" type="success">公開</el-tag>
          <el-tag v-else type="danger">未公開</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="video_thumbnail" label="影片縮圖" min-width="100">
        <template #default="scope">
          <router-link
            class="text-lg text-blue-400 hover:underline hover:text-blue-600 block w-full mb-2 truncate"
            :to="{ name: 'songPractice', params: { id: scope.row.video_id } }"
            target="_blank"
          >
            <img
              :src="scope.row.video_thumbnail"
              alt="video thumbnail"
              class="w-24 h-24 object-cover"
            />
          </router-link>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #header>
          <div class="text-center">
            <el-button type="success" @click="handleAdd">新增</el-button>
          </div>
        </template>

        <template #default="scope">
          <div class="text-center">
            <el-button type="danger" @click="handleDelete(scope.row)"
              >刪除</el-button
            >
            <el-button type="primary" @click="handleEdit(scope.row)"
              >編輯</el-button
            >
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <el-dialog :title="dialogTitle" v-model="dialogVisible" width="80%" top="5vh">
    <div class="h-[80vh] overflow-hidden">
      <el-form
        :model="formData"
        ref="form"
        label-width="80px"
        label-position="left"
        class="h-[90%] overflow-auto"
      >
        <el-form-item label="影片名稱" prop="video_name">
          <el-input v-model="formData.video_name"></el-input>
        </el-form-item>
        <el-form-item label="作者" prop="author">
          <el-input v-model="formData.author"></el-input>
        </el-form-item>
        <el-form-item label="影片ID" prop="video_id">
          <el-input v-model="formData.video_id"></el-input>
        </el-form-item>
        <el-form-item label="影片縮圖" prop="video_thumbnail">
          <el-input v-model="formData.video_thumbnail"></el-input>
        </el-form-item>
        <el-form-item label="影片標籤" prop="tags">
          <el-input
            v-model="formData.tags"
            placeholder="請用逗號分隔"
          ></el-input>
        </el-form-item>
        <el-form-item label="公開" prop="public">
          <el-switch v-model="formData.public"></el-switch>
        </el-form-item>
        <el-form-item label="歌詞" prop="lyrics">
          <el-input
            v-model="formData.lyrics"
            type="textarea"
            rows="10"
          ></el-input>
        </el-form-item>
        <el-form-item label="轉換歌詞" prop="converted_lyrics">
          <el-input
            v-model="formData.converted_lyrics"
            type="textarea"
            rows="10"
            v-loading="convertLoading"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="h-[7%] mt-4 text-right">
        <el-button @click="convert_lyrics">取得轉換歌詞</el-button>
        <el-button type="primary" @click="saveVideo">{{
          isEdit ? "更新" : "新增"
        }}</el-button>
        <el-button @click="dialogVisible = false">取消</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import axios from "@/utils/axios";

const tableData = ref([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const filterText = ref("");
const dialogTitle = computed(() => (isEdit.value ? "編輯歌曲" : "新增歌曲"));
const convertLoading = ref(false);
const form = ref(null);
const formData = ref({
  video_id: "",
  video_name: "",
  author: "",
  video_thumbnail: "",
  tags: "",
  public: true,
  lyrics: "",
  converted_lyrics: "",
});

// 監看formData.video_id，若有變動則自動更新formData.video_thumbnail
watch(
  () => formData.value.video_id,
  (newVal) => {
    if (newVal) {
      formData.value.video_thumbnail = `https://img.youtube.com/vi/${newVal}/hqdefault.jpg`;
    }
  }
);

const filteredTableData = computed(() => {
  if (!filterText.value) {
    return tableData.value;
  }
  const lowerCaseFilter = filterText.value.toLowerCase();
  return tableData.value.filter((item) => {
    return (
      item.video_name.toLowerCase().includes(lowerCaseFilter) ||
      item.author.toLowerCase().includes(lowerCaseFilter) ||
      item.tags?.toLowerCase().includes(lowerCaseFilter)
    );
  });
});

const handleAdd = () => {
  resetForm();
  isEdit.value = false;
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  resetForm();
  axios.get("/get_video/" + row.video_id).then((data) => {
    formData.value = { ...row };
    formData.value.public = data.public === 1;
    formData.value.lyrics = data.lyrics;
    formData.value.converted_lyrics = data.converted_lyrics;
    isEdit.value = true;
    dialogVisible.value = true;
  });
};

const handleDelete = (row) => {
  ElMessageBox.confirm("確定刪除此影片嗎?", "提示", {
    type: "warning",
  })
    .then(() => {
      axios
        .delete("/delete_video/" + row.UID)
        .then((data) => {
          fetchData();
          dialogVisible.value = false;
          ElMessage({
            type: "success",
            message: "刪除成功",
          });
        })
        .catch((err) => {
          console.error(err);
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
        '{"cvt": "$1","ori": "$2"}'
      )
      // 修正最後一個逗號後的換行
      .replace(/},\s+]/g, "},\n  ]")
  );
}

const convert_lyrics = () => {
  convertLoading.value = true;
  axios
    .post("/convert_lyrics", { lyrics: formData.value.lyrics })
    .then((data) => {
      formData.value.converted_lyrics = customStringify(data["data"]);
      ElMessage({
        type: "success",
        message: "轉換成功",
      });
    })
    .catch((err) => {
      console.error(err);
      ElMessage({
        type: "error",
        message: "轉換失敗",
      });
    })
    .finally(() => {
      convertLoading.value = false;
    });
};

const saveVideo = () => {
  let myFromData = JSON.parse(JSON.stringify(formData.value));
  myFromData.converted_lyrics = JSON.parse(myFromData.converted_lyrics);
  axios
    .post("/upsert_video", formData.value)
    .then((data) => {
      fetchData();
      dialogVisible.value = false;
      ElMessage({
        type: "success",
        message: isEdit.value ? "更新成功" : "新增成功",
      });
    })
    .catch((err) => {
      console.error(err);
    });
};

const fetchData = () => {
  axios.get("/get_all_videos").then((data) => {
    tableData.value = data["videos"];
  });
};

const resetForm = () => {
  formData.value = {
    video_id: "",
    video_name: "",
    author: "",
    video_thumbnail: "",
    tags: "",
    lyrics: "",
  };
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped></style>
