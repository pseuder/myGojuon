<template>
  <div
    class="flex h-[90vh] w-full flex-col gap-4 px-4 py-4"
    style="width: 99vw !important; left: 10px; position: fixed"
  >
    <el-switch
      v-model="isSpecialSearch"
      active-text="特殊搜尋"
      inactive-text="一般搜尋"
      active-color="#13ce66"
      inactive-color="#ff4949"
      class="w-1/4"
      @change="fetchData"
    />

    <!-- 表格 -->
    <el-table
      :data="tableData"
      style="width: 100%; border-radius: 12px"
      highlight-current-row
      v-loading="loading"
    >
      <!-- 新增的按鈕欄位 -->
      <el-table-column label="操作" width="100">
        <template #default="scope">
          <el-button
            type="primary"
            size="small"
            @click="showUserDetail(scope.row)"
          >
            詳情
          </el-button>
        </template>
      </el-table-column>
      <el-table-column prop="user_name" label="使用者名稱" min-width="100" />
      <el-table-column
        prop="user_email"
        label="使用者電子郵件"
        min-width="150"
      />
      <el-table-column prop="country" label="國家" min-width="80" />
      <el-table-column prop="city" label="城市" min-width="80" />
      <el-table-column prop="source_char" label="來源字元" min-width="50" />
      <el-table-column prop="recognized_char" label="辨識字元" min-width="50" />
      <el-table-column prop="correctness" label="正確率" min-width="50" />
      <el-table-column prop="created_at" label="建立時間" min-width="150" />

      <!-- 根據首次建立和建立計算使用天數 -->
      <el-table-column label="使用天數" min-width="100">
        <template #default="scope">
          {{
            Math.floor(
              (new Date(scope.row.created_at) -
                new Date(scope.row.min_created_at)) /
                (1000 * 60 * 60 * 24),
            )
          }}
        </template>
      </el-table-column>
    </el-table>

    <!-- 分頁 -->
    <div class="mt-4 flex justify-center">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 30, 50, 100]"
        :total="totalCount"
        layout="sizes, total, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="w-full overflow-auto"
      />
    </div>

    <!-- 使用者詳情對話框 -->
    <el-dialog
      v-model="dialogVisible"
      title="使用者活動詳情"
      width="80%"
      class="user-detail-dialog"
    >
      <div style="width: 100%; height: 80vh">
        <el-table
          :data="userDetailData"
          style="width: 100%; height: 80vh"
          highlight-current-row
        >
          <el-table-column prop="username" label="使用者名稱" min-width="100" />
          <el-table-column prop="learningModule" label="學習模組" />
          <el-table-column
            prop="learningMethod"
            label="學習方式"
            min-width="120"
          />

          <el-table-column
            prop="learningItem"
            label="學習項目"
            min-width="120"
          />

          <el-table-column prop="country" label="國家" min-width="100" />
          <el-table-column prop="city" label="城市" min-width="100" />
          <el-table-column label="建立" min-width="200">
            <template #default="scope">
              {{ formatDate(scope.row.created_at) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useApi } from "@/composables/useApi.js";
import { useRouter } from "vue-router";
const MYAPI = useApi();
const router = useRouter();

const tableData = ref([]);
const currentPage = ref(1);
const pageSize = ref(30);
const dialogVisible = ref(false);
const userDetailData = ref([]);
const totalCount = ref(0);
const loading = ref(false);
const isSpecialSearch = ref(false);

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = date.getUTCHours();
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  const period = hours >= 12 ? "下午" : "上午";
  const hours12 = hours % 12 || 12;
  return `${year}-${month}-${day} ${period}${hours12}:${minutes}:${seconds}`;
};

const showUserDetail = async (row) => {
  try {
    // 使用user_id+ip_address查詢使用者詳情
    const response = await MYAPI.get("/get_recognition_activity", {
      user_id: row.user_id,
      ip_address: row.ip_address,
    });
    userDetailData.value = response.data;
    dialogVisible.value = true;
  } catch (error) {
    ElMessage.error("獲取使用者詳情失敗");
  }
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
  fetchData(); // 頁面大小改變時重新載入資料
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchData(); // 當前頁面改變時重新載入資料
};

const fetchData = async () => {
  try {
    loading.value = true;

    const params = {
      currentPage: currentPage.value,
      pageSize: pageSize.value,
      isSpecialSearch: isSpecialSearch.value,
    };

    const response = await MYAPI.get("/get_recognition_activity", params);
    tableData.value = response.data;

    // 僅在初始化或搜尋時獲取總數
    totalCount.value = 0;

    loading.value = false;
  } catch (error) {
    ElMessage.error("獲取資料失敗");
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style>
@reference "tailwindcss";
.el-pagination {
  justify-content: center;
  margin-top: 20px;
}

.user-detail-dialog {
  height: 95vh;
  margin-top: 10vh !important;
}

.user-detail-dialog {
  height: calc(95vh - 120px);
  overflow: hidden;
}
</style>
