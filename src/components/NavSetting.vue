<template>
  <ContactForm :visible="showContactForm" @close="showContactForm = false" />

  <el-popover placement="bottom" :width="233" trigger="hover">
    <div class="flex flex-col gap-2 h-fit">
      <myGoogleLogin />
    </div>
    <template #reference>
      <el-button
        style="font-size: 28px; color: black"
        class="transition-transform hover:scale-110"
        :icon="User"
        circle
        plain
        link
      />
    </template>
  </el-popover>

  <el-popover placement="bottom" :width="200" trigger="hover">
    <div class="flex flex-col gap-2">
      <!-- 切換語言 -->
      <div class="flex items-center gap-2">
        <span class="text-sm shrink-0 w-[88px]">{{ t("language") }}</span>
        <el-switch
          v-model="locale"
          style="
            width: 100% !important;
            --el-switch-on-color: #13ce66;
            --el-switch-off-color: blueviolet;
          "
          width="100%"
          size="large"
          active-value="zh-TW"
          inactive-value="en"
          active-text="中文"
          inactive-text="English"
          inline-prompt
        >
          <template #active-action>
            <span class="custom-active-action"></span>
          </template>
          <template #inactive-action>
            <span class="custom-inactive-action"></span>
          </template>
        </el-switch>
      </div>

      <!-- 文字瀑布 -->
      <!-- <div>
        <div class="flex items-center gap-2">
          <span class="text-sm shrink-0 w-[88px]">{{
            t("text_waterfall")
          }}</span>
          <el-switch
            v-model="settingsStore.textfall"
            @change="handleTextfallChange"
            style="width: 100% !important"
            width="100%"
            size="large"
          />
        </div>
      </div> -->
      <!-- 回饋按鈕 -->
      <div>
        <div class="flex items-center gap-2">
          <el-button
            type="warning"
            :title="t('anonymous_feedback')"
            class="w-full"
            @click="showContactForm = !showContactForm"
          >
            {{ t("anonymous_feedback") }}
          </el-button>
        </div>
      </div>

      <!-- 重置網站 -->
      <div>
        <div class="flex items-center gap-2">
          <el-button type="info" class="w-full" @click="handleResetWebsite">
            {{ t("reset_preference") }}
          </el-button>
        </div>
      </div>
    </div>

    <template #reference>
      <el-button
        style="font-size: 28px; color: black"
        class="transition-transform hover:scale-110"
        :icon="Menu"
        circle
        plain
        link
      />
    </template>
  </el-popover>
</template>

<script setup>
import { ref, watch } from "vue";

import { User, Menu } from "@element-plus/icons-vue";
import ContactForm from "@/components/ContactForm.vue";
import myGoogleLogin from "@/components/myGoogleLogin.vue";

import { useSettingsStore } from "@/stores/index.js";
const settingsStore = useSettingsStore();

import { ElMessageBox } from "element-plus";

import { useI18n } from "vue-i18n";
const { t, locale } = useI18n();

const showContactForm = ref(false);
const showFloatingButton = ref(true);

watch(locale, (newValue) => {
  settingsStore.language = newValue;
  // handleLocaleChange();
});

const handleLocaleChange = () => {
  // 在行動裝置切換語言時重整頁面以免跑版
  const isMobile = /mobile|android|iphone|ipad|ipod|phone|tablet/i.test(
    navigator.userAgent.toLowerCase(),
  );
  const isNarrow = window.innerWidth < 800;

  if (isMobile && isNarrow) {
    setTimeout(() => location.reload(), 500);
  }
};

const handleTextfallChange = (newValue) => {
  settingsStore.textfall = newValue;
};
const handleResetWebsite = () => {
  ElMessageBox.confirm(t("reset_preference_confirm"), t("reset_preference"), {
    confirmButtonText: t("confirm"),
    cancelButtonText: t("cancel"),
    type: "warning",
  }).then(() => {
    localStorage.clear();
    location.reload(true);
  });
};
</script>
