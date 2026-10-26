<template>
  <div class="flex h-full flex-col gap-4 overflow-y-auto px-4 py-4">
    <h1 class="text-2xl font-bold text-indigo-700">{{ t("tools.title") }}</h1>

    <!-- 之後新增小工具：在 tools 陣列加一筆即可 -->
    <el-tabs v-model="activeTool">
      <el-tab-pane
        v-for="tool in tools"
        :key="tool.name"
        :name="tool.name"
        :label="t(tool.label)"
      >
        <!-- <p class="mb-4 text-gray-600">{{ t(tool.description) }}</p> -->
        <component :is="tool.component" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import JapaneseConverter from "@/components/tools/JapaneseConverter.vue";

const { t } = useI18n();

const tools = [
  {
    name: "converter",
    label: "tools.converter",
    description: "tools.converter_description",
    component: JapaneseConverter,
  },
];

const activeTool = ref(tools[0].name);

onMounted(() => {
  document.title = `${t("tools.title")} - ${t("site_title")}`;
});
</script>
