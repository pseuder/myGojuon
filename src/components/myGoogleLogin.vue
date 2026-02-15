<template>
  <div class="mr-2 flex h-full w-full items-center gap-4 overflow-hidden">
    <template v-if="isLogin && user">
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
              {{ user.name }}
            </div>
          </template>
          <div class="flex flex-col items-center gap-2">
            <div>{{ t("left_points") }}: ∞</div>
            <div class="flex items-center gap-2">
              <span class="text-sm">{{ t("text_waterfall") }}</span>
              <el-switch
                :model-value="textWaterfallEnabled"
                @update:model-value="handleTextWaterfallToggle"
              />
            </div>
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
import { decodeCredential } from "vue3-google-login";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { useAuth } from "@/composables/useAuth.js";
import { useApi } from "@/composables/useApi.js";

const { t } = useI18n();
const { user, isLogin, setLoginInfo, logout } = useAuth();
const myAPI = useApi();

const props = defineProps({
  textWaterfallEnabled: { type: Boolean, required: true },
});
const emit = defineEmits(["update:textWaterfallEnabled"]);

const handleTextWaterfallToggle = (value) => {
  emit("update:textWaterfallEnabled", value);
};

const handleLoginCallback = async (response) => {
  const userData = decodeCredential(response.credential);
  const { name, email, picture, sub } = userData;

  try {
    const res = await myAPI.post("/login", { email, name, picture, sub });
    setLoginInfo(res.data.token, { email, name, picture, sub });
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
  logout();
  ElMessage.success(t("logout_success"));
};
</script>
