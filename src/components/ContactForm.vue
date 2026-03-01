<template>
  <div
    v-if="visible"
    :style="dragStyle"
    class="fixed z-50 w-[90%] max-w-md overflow-hidden rounded-xl border border-blue-200 bg-white shadow-xl shadow-blue-100"
  >
    <!-- 標題列 -->
    <div
      class="flex cursor-grab items-center justify-between border-b border-blue-100 bg-blue-400 px-6 py-4 select-none active:cursor-grabbing"
      @mousedown="startDrag"
    >
      <h3 class="text-xl font-semibold text-white">
        {{ t("anonymous_feedback") }}
      </h3>
      <button
        @click="closeForm"
        class="rounded-full text-blue-200 transition-colors hover:text-white text-2xl"
      >
        &times;
      </button>
    </div>

    <!-- 表單內容 -->
    <form @submit.prevent="submitForm" class="bg-blue-50 px-6 py-5">
      <div class="mb-4">
        <label for="name" class="mb-1 block text-sm font-medium text-black">{{
          t("name")
        }}</label>
        <el-input
          v-model="form.name"
          id="name"
          :placeholder="t('optional')"
          class="contact-input"
        />
      </div>
      <div class="mb-4">
        <label for="email" class="mb-1 block text-sm font-medium text-black">{{
          t("email")
        }}</label>
        <el-input
          v-model="form.email"
          id="email"
          type="email"
          :placeholder="t('optional')"
          class="contact-input"
        />
      </div>
      <div class="mb-5">
        <label
          for="message"
          class="mb-1 block text-sm font-medium text-black"
          >{{ t("message_content") }}</label
        >
        <el-input
          v-model="form.message"
          id="message"
          type="textarea"
          rows="4"
          required
          :placeholder="t('required')"
          class="contact-input"
        />
      </div>
      <div class="flex justify-end gap-2">
        <el-button @click="closeForm" class="contact-btn-cancel">{{
          t("cancel")
        }}</el-button>
        <el-button
          type="primary"
          native-type="submit"
          class="contact-btn-submit"
          >{{ t("submit") }}</el-button
        >
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
import { useApi } from "@/composables/useApi.js";

const { t } = useI18n();
const MYAPI = useApi();

const props = defineProps({ visible: Boolean });
const emit = defineEmits(["close"]);

const form = ref({ name: "", email: "", message: "" });

// 拖曳邏輯
const isDragging = ref(false);
const position = ref({ x: null, y: null });
const dragOffset = ref({ x: 0, y: 0 });

const dragStyle = computed(() => {
  if (position.value.x === null) {
    return { right: "1rem", bottom: "0" };
  }
  return {
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    right: "auto",
    bottom: "auto",
  };
});

const startDrag = (e) => {
  const el = e.currentTarget.closest(".fixed");
  const rect = el.getBoundingClientRect();
  if (position.value.x === null) {
    position.value = { x: rect.left, y: rect.top };
  }
  isDragging.value = true;
  dragOffset.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y,
  };
  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", stopDrag);
};

const onDrag = (e) => {
  if (!isDragging.value) return;
  position.value = {
    x: e.clientX - dragOffset.value.x,
    y: e.clientY - dragOffset.value.y,
  };
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
};

onUnmounted(() => {
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
});

const submitForm = async () => {
  try {
    await MYAPI.post("/question_response", {
      name: form.value.name,
      email: form.value.email,
      message: form.value.message,
    });
    ElMessage.success("訊息已成功送出, 感謝你的回饋！");
    closeForm();
  } catch (error) {
    console.error("Error submitting form:", error);
    ElMessage.error("訊息送出失敗，請稍後再試。");
  }
};

const closeForm = () => {
  form.value = { name: "", email: "", message: "" };
  position.value = { x: null, y: null };
  emit("close");
};
</script>

<style scoped>
/* El-Input 藍色系覆蓋 */
:deep(.contact-input .el-input__wrapper),
:deep(.contact-input .el-textarea__inner) {
  border-color: #bfdbfe;
  background-color: #fff;
  box-shadow: 0 0 0 1px #bfdbfe;
}

:deep(.contact-input .el-input__wrapper:hover),
:deep(.contact-input .el-textarea__inner:hover) {
  border-color: #93c5fd;
  box-shadow: 0 0 0 1px #93c5fd;
}

:deep(.contact-input .el-input__wrapper.is-focus),
:deep(.contact-input .el-textarea__inner:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
  outline: none;
}

/* 取消按鈕 */
:deep(.contact-btn-cancel) {
  border-color: #93c5fd;
  color: #3b82f6;
  background-color: #fff;
}

:deep(.contact-btn-cancel:hover) {
  border-color: #3b82f6;
  color: #2563eb;
  background-color: #eff6ff;
}

/* 送出按鈕 */
:deep(.contact-btn-submit) {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

:deep(.contact-btn-submit:hover) {
  background-color: #2563eb;
  border-color: #2563eb;
}
</style>
