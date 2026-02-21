import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { createI18n } from "vue-i18n";
import ElementPlus from "element-plus";
import vue3GoogleLogin from "vue3-google-login";

import "./style.css";

/* APP */
import App from "./App.vue";
const app = createApp(App);

/* router */
import router from "./router.js";
app.use(router);

/* Pinia 全域管理 */
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);

/* i18n */
import TW from "./locales/TW.json";
import EN from "./locales/EN.json";
// 讀取 store 語言設定
import { useSettingsStore } from "@/stores/settings";
const settingsStore = useSettingsStore();
const locale = settingsStore.language;
const i18n = createI18n({
  legacy: false,
  locale: locale,
  fallbackLocale: "zh-TW",
  messages: {
    "zh-TW": TW,
    en: EN,
  },
});
app.use(i18n);

/* 第三方套件 */
app.use(ElementPlus);
app.use(vue3GoogleLogin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
});

/* Mount */
app.mount("#app");
