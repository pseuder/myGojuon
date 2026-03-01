<template>
  <div class="mr-2 flex h-full w-full items-center gap-4 overflow-hidden">
    <template v-if="authStore.isLoggedIn">
      <div class="flex items-center">
        <el-popover
          placement="bottom"
          :width="100"
          trigger="click"
          popper-class="logout-popover"
        >
          <template #reference>
            <div
              class="w-20 cursor-pointer truncate text-blue-400 hover:text-blue-600"
            >
              {{ authStore.userName }}
            </div>
          </template>
          <div class="flex flex-col items-center gap-2">
            <div>{{ t("left_points") }}: {{ authStore.userPoint }}</div>

            <el-button
              @click="handleLogout"
              type="danger"
              plain
              size="small"
              class="w-full"
            >
              {{ t("logout") }}
            </el-button>
          </div>
        </el-popover>
      </div>
    </template>
    <template v-else>
      <GoogleLogin :callback="handleLoginCallback" prompt />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";

/*-- i18n --*/
import { useI18n } from "vue-i18n";
const { t } = useI18n();

/*-- store --*/
import { useAuthStore } from "@/stores/index.js";
const authStore = useAuthStore();
const handleLoginCallback = async (response) => {
  try {
    authStore.login(response.credential);
    ElMessage.success(t("login_success"));
  } catch (error) {
    if (error && error.message) {
      // 無法連接至伺服器
      if (error.message.includes("Failed to fetch")) {
        ElMessage.error(t("server_error"));
        return;
      }
    } else {
      // 伺服器回傳錯誤
      console.error("login_fail:", error);
      ElMessage.error(t("login_fail"));
    }
  }
};

const handleLogout = () => {
  authStore.logout();
  ElMessage.success(t("logout_success"));
};

onMounted(() => {
  // 嘗試根據localStorage獲取使用者訊息
  authStore.fetchCurrentUser();
});
</script>
