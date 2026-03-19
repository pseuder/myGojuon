<template>
  <div class="flex h-full w-full items-center overflow-hidden">
    <template v-if="authStore.isLoggedIn">
      <div class="w-full flex flex-col gap-2">
        <div
          class="w-20 cursor-pointer truncate text-blue-400 hover:text-blue-600"
        >
          {{ authStore.userName }}
        </div>
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
