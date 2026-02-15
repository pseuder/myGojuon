<template>
  <div
    v-if="visible"
    class="fixed right-4 bottom-24 z-50 w-[90%] max-w-md rounded-lg bg-white p-6 shadow-lg"
  >
    <div class="flex items-center justify-between">
      <h3 class="text-xl font-semibold text-gray-800">
        {{ t("online_message") }}
      </h3>
      <button @click="closeForm" class="text-gray-500 hover:text-gray-700">
        &times;
      </button>
    </div>
    <form @submit.prevent="submitForm" class="mt-4">
      <div class="mb-4">
        <label for="name" class="block text-sm font-medium text-gray-700">{{ t("name") }}</label>
        <el-input v-model="form.name" id="name" :placeholder="t('optional')" />
      </div>
      <div class="mb-4">
        <label for="email" class="block text-sm font-medium text-gray-700">{{ t("email") }}</label>
        <el-input v-model="form.email" id="email" type="email" :placeholder="t('optional')" />
      </div>
      <div class="mb-4">
        <label for="message" class="block text-sm font-medium text-gray-700">{{ t("message_content") }}</label>
        <el-input v-model="form.message" id="message" type="textarea" rows="4" required :placeholder="t('required')" />
      </div>
      <div class="text-right">
        <el-button @click="closeForm">{{ t("cancel") }}</el-button>
        <el-button type="primary" native-type="submit">{{ t("submit") }}</el-button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
import { useApi } from "@/composables/useApi.js";

const { t } = useI18n();
const MYAPI = useApi();

const props = defineProps({ visible: Boolean });
const emit = defineEmits(["close"]);

const form = ref({ name: "", email: "", message: "" });

const submitForm = async () => {
  try {
    await MYAPI.post("/question_response", {
      name: form.value.name,
      email: form.value.email,
      message: form.value.message,
    });
    ElMessage.success("訊息已成功送出, 感謝你的留言！");
    closeForm();
  } catch (error) {
    console.error("Error submitting form:", error);
    ElMessage.error("訊息送出失敗，請稍後再試。");
  }
};

const closeForm = () => {
  form.value = { name: "", email: "", message: "" };
  emit("close");
};
</script>
