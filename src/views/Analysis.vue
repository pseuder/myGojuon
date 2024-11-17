<template>
  <div class="w-full h-[80vh] flex flex-col px-4 py-4 gap-4">
    <!-- 搜尋框 -->
    <div>
      <el-input
        v-model="searchUserId"
        placeholder="搜尋使用者ID"
        class="w-60"
        clearable
        @change="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 表格 -->
    <el-table :data="paginatedData" style="width: 100%">
      <el-table-column prop="user_id" label="ID" />
      <el-table-column prop="username" label="使用者名稱" min-width="100" />
      <el-table-column prop="learningModule" label="學習模組" />
      <el-table-column prop="learningMethod" label="學習方式" min-width="120" />
      <el-table-column prop="learningItem" label="學習項目" min-width="150">
        <template #default="scope">
          <span v-if="scope.row.learningMethod === 'get_video'">{{
            scope.row.video_name
          }}</span>
          <span v-else>{{ scope.row.learningItem }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="correctness" label="正確性" />
      <el-table-column prop="duration" label="耗時" />
      <el-table-column prop="ip_address" label="IP" min-width="120" />
      <el-table-column label="建立" min-width="200">
        <template #default="scope">
          {{ formatDate(scope.row.created_at) }}
        </template>
      </el-table-column>
    </el-table>

    <!-- 分頁 -->
    <div class="flex justify-center mt-4">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="filteredData.length"
        layout="total, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search } from "@element-plus/icons-vue";
import axios from "@/utils/axios";

// 數據相關
const tableData = ref([]);
const searchUserId = ref("");
const currentPage = ref(1);
const pageSize = ref(50);

// 日期格式化函數
const formatDate = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = date.getUTCHours();
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  // 處理上午/下午
  const period = hours >= 12 ? "下午" : "上午";
  const hours12 = hours % 12 || 12; // 轉換為12小時制

  return `${year}-${month}-${day} ${period}${hours12}:${minutes}:${seconds}`;
};

// 過濾後的數據
const filteredData = computed(() => {
  if (!searchUserId.value) {
    return tableData.value;
  }
  return tableData.value.filter((item) =>
    item.user_id
      .toString()
      .toLowerCase()
      .includes(searchUserId.value.toLowerCase())
  );
});

// 分頁後的數據
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredData.value.slice(start, end);
});

// 處理搜尋
const handleSearch = () => {
  currentPage.value = 1; // 重置為第一頁
};

// 處理分頁大小變化
const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
};

// 處理頁碼變化
const handleCurrentChange = (val) => {
  currentPage.value = val;
};

// 獲取數據
const fetchData = () => {
  axios.get("/fetch_all_user_activity").then((data) => {
    tableData.value = data;
  });
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.el-pagination {
  justify-content: center;
  margin-top: 20px;
}
</style>