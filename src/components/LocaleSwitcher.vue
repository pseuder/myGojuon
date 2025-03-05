// LocaleSwitcher.vue
<template>
  <el-popover placement="bottom" :width="150" trigger="click">
    <el-menu
      class="user-select-none"
      :default-active="currentLocale"
      @select="handleSelect"
    >
      <el-menu-item :index="LOCALE_TW">繁體中文</el-menu-item>
      <el-menu-item :index="LOCALE_CN">简体中文</el-menu-item>
      <el-menu-item :index="LOCALE_HK">香港粵語</el-menu-item>
      <el-menu-item :index="LOCALE_EN">English</el-menu-item>
      <el-menu-item :index="LOCALE_MY">Melayu</el-menu-item>
      <el-menu-item :index="LOCALE_VN">Tiếng Việt</el-menu-item>
    </el-menu>

    <template #reference>
      <img
        title="language"
        src="/images/language.svg"
        alt="language"
        class="w-10 h-10 cursor-pointer transition-transform hover:scale-110"
      />
    </template>
  </el-popover>
</template>

<script setup>
import { computed, defineEmits } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();
const currentLocale = computed(() => locale.value);

const LOCALE_TW = 'TW';
const LOCALE_CN = 'CN';
const LOCALE_HK = 'HK';
const LOCALE_EN = 'EN';
const LOCALE_MY = 'MY';
const LOCALE_VN = 'VN';


const emit = defineEmits(['update:locale']);

const handleSelect = (lang) => {
  locale.value = lang;
  localStorage.setItem("myGojuon", JSON.stringify({ locale: lang }));
  emit('update:locale', lang);
};
</script>