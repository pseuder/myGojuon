// useAppHeight.js
// 把「實際可視高度」寫進 --app-height，讓 html/body/#app 用它當高度。
//
// 為什麼不能只靠 CSS 的 100dvh：
// iOS Safari 首次 layout 有機會停在「網址列展開」時的尺寸，而本站 html/body 是
// overflow:hidden、整頁不可捲動，收合網址列後 Safari 不一定會派發 resize，畫面
// 下方就會空一塊，直到使用者點一下網址列才重新量測。因此掛載後要主動補量幾次。
import { onMounted, onUnmounted } from "vue";

// 掛載後補量的時間點（毫秒），涵蓋網址列收合動畫結束前後
const RECHECK_DELAYS = [0, 60, 150, 300, 600, 1000, 1500];

// 游標在輸入框時，visualViewport 變矮通常是鍵盤造成的，不該跟著縮
const isTypingTarget = () => {
  const el = document.activeElement;
  if (!el) return false;
  return (
    el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable
  );
};

const measure = () => {
  const vv = window.visualViewport;
  if (!vv) return window.innerHeight;
  // 鍵盤彈出或雙指縮放時 visualViewport 會變矮，這兩種情況維持 innerHeight
  if (vv.scale > 1 || (isTypingTarget() && vv.height < window.innerHeight)) {
    return window.innerHeight;
  }
  return Math.round(vv.height);
};

export function useAppHeight() {
  let timers = [];

  const apply = () => {
    const height = measure();
    if (!height) return;
    const root = document.documentElement;
    const next = `${height}px`;
    if (root.style.getPropertyValue("--app-height") === next) return;
    root.style.setProperty("--app-height", next);
  };

  const clearTimers = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };

  const scheduleRechecks = () => {
    clearTimers();
    timers = RECHECK_DELAYS.map((delay) => setTimeout(apply, delay));
  };

  onMounted(() => {
    apply();
    scheduleRechecks();
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", scheduleRechecks);
    window.addEventListener("pageshow", scheduleRechecks);
    window.visualViewport?.addEventListener("resize", apply);
    window.visualViewport?.addEventListener("scroll", apply);
  });

  onUnmounted(() => {
    clearTimers();
    window.removeEventListener("resize", apply);
    window.removeEventListener("orientationchange", scheduleRechecks);
    window.removeEventListener("pageshow", scheduleRechecks);
    window.visualViewport?.removeEventListener("resize", apply);
    window.visualViewport?.removeEventListener("scroll", apply);
  });
}
