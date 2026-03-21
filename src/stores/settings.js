// stores/settings.js
import { defineStore } from "pinia";
import { ref } from "vue";

export const useSettingsStore = defineStore(
  "settings",
  () => {
    // --- State ---
    const language = ref("zh-TW");
    const textfall = ref(false);

    return {
      language,
      textfall,
    };
  },
  {
    persist: true,
  },
);
