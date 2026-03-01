// useTextWaterfall.js
import { ref, watch, onMounted } from "vue";
import fiftySoundsData from "@/data/fifty-sounds.json";

const TEXT_COUNT = 100;

const textArray = fiftySoundsData.hiragana
  .map((item) => item.kana)
  .concat(fiftySoundsData.katakana.map((item) => item.kana));

const isDesktopDevice = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    "android",
    "webos",
    "iphone",
    "ipad",
    "ipod",
    "blackberry",
    "windows phone",
  ];
  return !mobileKeywords.some((keyword) => userAgent.includes(keyword));
};

export function useTextWaterfall(textContainer, enabled) {
  function createTextWaterfall() {
    if (!textContainer.value) return;
    let count = 0;
    function createTextElement() {
      if (count < TEXT_COUNT) {
        const textEl = document.createElement("div");
        textEl.classList.add("falling-text");
        textEl.innerText =
          textArray[Math.floor(Math.random() * textArray.length)];
        const startX = Math.random() * window.innerWidth;
        textEl.style.left = `${startX}px`;
        const randomTop = -(Math.random() * 300 + 100);
        textEl.style.top = `${randomTop}px`;
        const duration = 3 + Math.random() * 5;
        const delay = Math.random() * 5;
        textEl.style.animationDuration = `${duration}s`;
        textEl.style.animationDelay = `${delay}s`;
        const fontSize = 16 + Math.random() * 30;
        textEl.style.fontSize = `${fontSize}px`;
        textContainer.value.appendChild(textEl);
        count++;
        requestAnimationFrame(createTextElement);
      }
    }
    requestAnimationFrame(createTextElement);
  }

  function clearTextWaterfall() {
    if (!textContainer.value) return;
    textContainer.value.innerHTML = "";
  }

  onMounted(() => {
    if (isDesktopDevice() && enabled.value) {
      createTextWaterfall();
    }
  });

  watch(enabled, (newValue) => {
    if (!isDesktopDevice()) return;
    if (newValue) {
      createTextWaterfall();
    } else {
      clearTextWaterfall();
    }
  });

  return { createTextWaterfall, clearTextWaterfall };
}
