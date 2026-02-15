import { createApp } from "vue";
import App from "./App.vue";
import { createI18n } from "vue-i18n";
import router from "./router.js";
import ElementPlus from "element-plus";
import vue3GoogleLogin from "vue3-google-login";
import "./style.css";

import TW from "./locales/TW.json";
import EN from "./locales/EN.json";

// 讀取 localStorage 語言設定
let locale = "zh-TW";
try {
  const saved = localStorage.getItem("myGojuon_lang");
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.locale === "en" || parsed.locale === "EN") {
      locale = "en";
    }
  }
} catch (e) {
  // ignore
}

const i18n = createI18n({
  legacy: false,
  locale: locale,
  fallbackLocale: "zh-TW",
  messages: {
    "zh-TW": TW,
    en: EN,
  },
});

const app = createApp(App);
app.use(i18n);
app.use(router);
app.use(ElementPlus);
app.use(vue3GoogleLogin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
});
app.mount("#app");
