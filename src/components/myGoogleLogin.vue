<template>
  <div class="flex h-full w-full items-center overflow-hidden">
    <template v-if="authStore.isLoggedIn">
      <div class="flex w-full flex-col gap-2">
        <div
          class="w-full cursor-pointer truncate text-blue-400 hover:text-blue-600"
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
      <GoogleLogin :callback="handleLoginCallback" class="w-full" prompt />
    </template>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { ElMessage } from "element-plus";

/*-- i18n --*/
import { useI18n } from "vue-i18n";
const { t } = useI18n();

/*-- store --*/
import { useAuthStore, usePlaylistStore } from "@/stores/index.js";
const authStore = useAuthStore();
const playlistStore = usePlaylistStore();

const handleLoginCallback = async (response) => {
  try {
    await authStore.login(response.credential);
    await playlistStore.fetchPlaylists();
    ElMessage.success(t("login_success"));
  } catch (error) {
    console.log(error);
    if (error.message === "Network Error") {
      ElMessage.error(t("network_error"));
    } else {
      ElMessage.error(t("unexpect_error"));
    }
  }
};

const handleLogout = () => {
  authStore.logout();
  ElMessage.success(t("logout_success"));
};

onMounted(async () => {
  const debugJwt = import.meta.env.VITE_DEBUG_JWT;
  if (debugJwt) {
    await authStore.debugLogin(debugJwt);
    await playlistStore.fetchPlaylists();
    return;
  }
  // 嘗試根據localStorage獲取使用者訊息
  let res = await authStore.fetchCurrentUser();

  if (res) {
    await playlistStore.fetchPlaylists();
  }
});
</script>
