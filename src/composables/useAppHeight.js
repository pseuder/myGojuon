// useAppHeight.js
// 把「實際可視高度」寫進 --app-height，讓 html/body/#app 用它當高度。
//
// 為什麼需要它：
// iOS 瀏覽器首次 layout 有機會停在「網址列展開」時的尺寸，而本站 html/body 是
// overflow:hidden、整頁不可捲動，收合網址列後不一定會派發 resize，畫面下方就會
// 空一塊。因此掛載後要主動補量幾次。
//
// 但反過來說，寫錯值比不寫更糟：--app-height 是 inline style，優先級永遠贏過
// CSS 的 100dvh，一旦寫入錯值就會卡住不動。所以這裡的原則是
// 「寧可退回 100dvh，也不要寫入不可信的量測值」：
//   1. 量測不可信（縮放中、鍵盤彈出）就回傳 null，整次跳過
//   2. 連續兩幀量到同一個值才算穩定，避開工具列動畫中的過渡值
//   3. 分頁不可見時量到的是過渡值，直接清掉變數退回 100dvh
//   4. 回到前景（visibilitychange / focus / resume / pageshow）一定重新補量
//   5. 使用者第一次觸控時再補量一次，當作前面全部失效時的自我修復
import { onMounted, onUnmounted } from "vue";

// 補量的時間點（毫秒）。起算點是 Vue mount，要涵蓋工具列收合動畫，以及
// 字型 / YouTube iframe API / Element Plus CSS 在慢速網路下載完造成的重排
const RECHECK_DELAYS = [0, 60, 150, 300, 600, 1000, 1500, 2500, 4000];

// 量到的高度低於 layout viewport 這個比例就視為異常（分頁還沒真正顯示、
// 切分頁動畫中、非預期的鍵盤彈出…），退回 100dvh 比寫入錯值安全
const MIN_RATIO = 0.5;

// 游標在輸入框時，visualViewport 變矮通常是鍵盤造成的，不該跟著縮
const isTypingTarget = () => {
  const el = document.activeElement;
  if (!el) return false;
  return (
    el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable
  );
};

// 回傳可信的可視高度；量測不可信時回傳 null，呼叫端應整次跳過而不是改用別的來源
// （innerHeight 是 layout viewport、vv.height 是 visual viewport，混用會前後不一致）
const measure = () => {
  const vv = window.visualViewport;
  if (!vv) return window.innerHeight || null;
  // 雙指縮放中量到的是縮放後的可視區，不能拿來當版面高度
  if (vv.scale > 1.01) return null;
  // 鍵盤彈出時 visualViewport 會變矮，維持目前高度
  if (isTypingTarget() && vv.height < window.innerHeight) return null;
  return Math.round(vv.height) || null;
};

export function useAppHeight() {
  let timers = [];
  let rafId = null;

  // 清掉變數，讓 CSS 的 100dvh 重新生效
  const reset = () => {
    document.documentElement.style.removeProperty("--app-height");
  };

  const commit = (height) => {
    const root = document.documentElement;
    const next = `${height}px`;
    if (root.style.getPropertyValue("--app-height") === next) return;
    root.style.setProperty("--app-height", next);
  };

  const apply = () => {
    const first = measure();
    if (first === null) return;

    // 連續兩幀量到同一個值才寫入，避開工具列動畫中的過渡值
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      rafId = null;
      const second = measure();
      if (second === null || second !== first) return;

      // 分頁還沒真正顯示、或量到明顯不合理的值，一律退回 100dvh
      if (
        document.visibilityState !== "visible" ||
        second < window.innerHeight * MIN_RATIO
      ) {
        reset();
        return;
      }
      commit(second);
    });
  };

  const clearTimers = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };

  const scheduleRechecks = () => {
    clearTimers();
    timers = RECHECK_DELAYS.map((delay) => setTimeout(apply, delay));
  };

  // 回到前景時工具列可能還在動畫，跑完整輪補量而不是只量一次
  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") scheduleRechecks();
  };

  onMounted(() => {
    apply();
    scheduleRechecks();

    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", scheduleRechecks);
    window.addEventListener("pageshow", scheduleRechecks);
    // iOS Chrome 會凍結／丟棄背景分頁，重開時常常在分頁還沒顯示就跑完 JS，
    // 而且之後不一定會補發 resize 或 pageshow，所以這幾個入口都要接
    window.addEventListener("focus", scheduleRechecks);
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("resume", scheduleRechecks);
    // 最後一道保險：前面全部失效時，使用者第一次觸控就會把高度修回來
    window.addEventListener("pointerdown", apply, { passive: true });
    window.visualViewport?.addEventListener("resize", apply);
    window.visualViewport?.addEventListener("scroll", apply);
  });

  onUnmounted(() => {
    clearTimers();
    if (rafId !== null) cancelAnimationFrame(rafId);

    window.removeEventListener("resize", apply);
    window.removeEventListener("orientationchange", scheduleRechecks);
    window.removeEventListener("pageshow", scheduleRechecks);
    window.removeEventListener("focus", scheduleRechecks);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    document.removeEventListener("resume", scheduleRechecks);
    window.removeEventListener("pointerdown", apply);
    window.visualViewport?.removeEventListener("resize", apply);
    window.visualViewport?.removeEventListener("scroll", apply);
  });
}
