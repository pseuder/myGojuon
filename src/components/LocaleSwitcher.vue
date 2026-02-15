<template>
  <el-popover placement="bottom" :width="150" trigger="click">
    <el-menu
      class="user-select-none"
      :default-active="currentLocale"
      @select="handleSelect"
    >
      <el-menu-item index="zh-TW">中文</el-menu-item>
      <el-menu-item index="en">English</el-menu-item>
    </el-menu>

    <template #reference>
      <img
        title="language"
        src="/images/language.svg"
        alt="language"
        class="h-10 w-10 cursor-pointer transition-transform hover:scale-110"
      />
    </template>
  </el-popover>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { locale } = useI18n();
const currentLocale = computed(() => locale.value);

const emit = defineEmits(["update:locale"]);

const handleSelect = (lang) => {
  locale.value = lang;
  localStorage.setItem("myGojuon_lang", JSON.stringify({ locale: lang }));
  emit("update:locale", lang);

  const isMobile = /mobile|android|iphone|ipad|ipod|phone|tablet/i.test(
    navigator.userAgent.toLowerCase()
  );
  const isNarrow = window.innerWidth < 800;

  if (isMobile && isNarrow) {
    setTimeout(() => location.reload(), 500);
  }
};
</script>
