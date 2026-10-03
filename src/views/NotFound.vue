<template>
  <div
    class="flex h-full flex-col items-center justify-center gap-6 px-4 py-20 text-center"
  >
    <h1 class="text-5xl font-bold text-indigo-700">404</h1>
    <p class="text-xl text-gray-700">{{ t("page_not_found") }}</p>
    <p class="text-gray-500">{{ t("page_not_found_desc") }}</p>
    <router-link
      to="/"
      class="rounded-lg bg-indigo-600 px-6 py-3 text-lg text-white transition duration-300 hover:bg-indigo-700"
    >
      {{ t("back_to_home") }}
    </router-link>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

onMounted(() => {
  document.title = `404 | ${t("meta.title")}`;
});
</script>
