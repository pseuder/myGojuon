<template>
  <div class="h-full flex flex-col px-4 py-4 gap-4">
    <el-table :data="tableData" style="width: 100%">
      <el-table-column prop="user_id" label="user_id" min-width="100" />
      <el-table-column prop="learningModule" label="learningModule" min-width="100" />
      <el-table-column prop="learningType" label="learningType" min-width="100" />
      <el-table-column prop="learningModule" label="learningModule" min-width="100" />
      <el-table-column prop="learningKana" label="learningKana" min-width="100" />
      <el-table-column prop="duration" label="duration" min-width="100" />
      <el-table-column prop="ip_address" label="ip_address" min-width="100" />
      <el-table-column prop="created_at" label="created_at" min-width="100" />
    </el-table>
  </div>


</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import axios from "@/utils/axios";

const tableData = ref([]);


const fetchData = () => {
  axios.get("/fetch_all_user_activity").then((data) => {
    tableData.value = data;
  });
};


onMounted(() => {
  fetchData();
});
</script>

<style scoped></style>
