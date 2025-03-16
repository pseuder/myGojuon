import { createApp } from "vue";
import App from "./App.vue";
import { createI18n } from "vue-i18n";
import router from "./router";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import { createManager } from "@vue-youtube/core";
import vue3GoogleLogin from "vue3-google-login";
import "./style.css";

import TW from "./locales/TW.json";
import CN from "./locales/CN.json";
import HK from "./locales/HK.json";
import EN from "./locales/EN.json";
import MY from "./locales/MY.json";
import VN from "./locales/VN.json";

// 偵測瀏覽器語系
const browserLanguage = navigator.language || navigator.userLanguage;
const languageMap = {
  tw: "TW",
  "zh-tw": "TW",
  "zh-hant": "TW",
  cn: "CN",
  "zh-cn": "CN",
  "zh-hans": "CN",
  hk: "HK",
  "zh-hk": "HK",
  en: "EN",
  "en-us": "EN",
  "en-gb": "EN",
  en: "EN",
  my: "MY",
  ms: "MY",
  "ms-my": "MY",
  vn: "VN",
  "vi-vn": "VN",
  vi: "VN",
};
// let locale = languageMap[browserLanguage] || "TW";
let locale = "TW";

// 先嘗試讀取 localStorage 的設定
// if (localStorage.getItem("myGojuon")) {
//   const { locale: savedLocale } = JSON.parse(localStorage.getItem("myGojuon"));
//   if (languageMap[savedLocale.toLowerCase()]) {
//     locale = savedLocale;
//   }
// } else if (navigator.languages) {
//   for (const lang of navigator.languages) {
//     if (languageMap[lang.toLowerCase()]) {
//       locale = languageMap[lang.toLowerCase()];
//       localStorage.setItem("myGojuon", JSON.stringify({ locale }));

//       break;
//     }
//   }
// }
const i18n = createI18n({
  locale: locale,
  fallbackLocale: "TW", // fallback locale 設定為 TW
  messages: {
    TW,
    CN,
    HK,
    EN,
    MY,
    VN,
  },
});


const app = createApp(App);
app.use(i18n);
app.use(router);
app.use(ElementPlus);
app.use(createManager());
app.use(vue3GoogleLogin, {
  clientId:
    "314080941126-4t3fosnf64q4jcqe3lltftq1melsguq8.apps.googleusercontent.com",
});
app.mount("#app");
