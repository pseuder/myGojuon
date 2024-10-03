<template>
  <div class="h-full flex flex-col px-4 py-4 gap-4">
    <el-table :data="tableData" style="width: 100%">
      <el-table-column
        prop="video_name"
        label="影片名稱"
        min-width="180"
      ></el-table-column>
      <el-table-column prop="video_thumbnail" label="影片縮圖" min-width="100">
        <template #default="scope">
          <img
            :src="scope.row.video_thumbnail"
            alt="video thumbnail"
            class="w-24 h-24 object-cover"
          />
        </template>
      </el-table-column>
      <el-table-column prop="video_thumbnail" label="歌詞" min-width="180">
        <template #default="scope">
          <el-text class="w-full mb-2" truncated>
            {{ scope.row.lyrics }}
          </el-text>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="180">
        <template #header>
          <div class="text-center">
            <el-button type="warning" @click="handleAdd">新增</el-button>
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

  <el-dialog title="編輯歌曲" v-model="dialogVisible" width="80%">
    <el-form :model="form" ref="form" label-width="80px" label-position="left">
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
      <el-form-item label="歌詞" prop="lyrics">
        <el-input
          v-model="formData.lyrics"
          type="textarea"
          rows="10"
        ></el-input>
      </el-form-item>
    </el-form>
    <div slot="footer" class="text-right">
      <el-button type="primary" @click="update_video">更 新</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="success" @click="add_video">增 加</el-button>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import axios from "@/utils/axios";

const tableData = ref([]);

const dialogVisible = ref(false);

const form = ref(null);
const formData = ref({
  video_id: "",
  video_name: "",
  author: "",
  video_thumbnail: "",
  lyrics: "",
});

const handleAdd = () => {
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  resetForm();
  formData.value = { ...row };
  dialogVisible.value = true;
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

const add_video = () => {
  axios
    .post("/add_video", formData.value)
    .then((data) => {
      fetchData();
      dialogVisible.value = false;
      ElMessage({
        type: "success",
        message: "新增成功",
      });
    })
    .catch((err) => {
      console.error(err);
    });
};

const update_video = () => {
  axios
    .put("/update_video", formData.value)
    .then((data) => {
      fetchData();
      dialogVisible.value = false;
      ElMessage({
        type: "success",
        message: "更新成功",
      });
    })
    .catch((err) => {
      console.error(err);
    });
};

const fetchData = () => {
  axios.get("/get_video").then((data) => {
    tableData.value = data;
  });
};

const resetForm = () => {
  formData.value = {
    video_id: "",
    video_name: "",
    author: "",
    video_thumbnail: "",
    lyrics: "",
  };
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped></style>
