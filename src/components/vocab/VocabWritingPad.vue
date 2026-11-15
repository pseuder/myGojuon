<template>
  <!-- 鋪滿整個練習頁的手寫層：手指 / 觸控筆 / 滑鼠在任何空白處都能寫，純練習不做辨識 -->
  <!-- 不跟著卡片翻轉，翻面時可直接對照背面答案；輕點會轉交給底下的元素（翻面、發音鈕等） -->
  <div ref="layer" class="ink-layer">
    <canvas
      ref="canvas"
      class="ink-canvas"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
      @pointerleave="onUp"
      @lostpointercapture="onUp"
      @click.stop
    />
  </div>
</template>

<script>
// 偵測到觸控筆後只接受觸控筆，避免手掌壓到畫面畫出線條。
// 放在模組層級：手寫層每換一題都會重建，若存在元件內，換題後手掌先碰到螢幕就會佔住畫筆
let penOnly = false;
</script>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";

// 換題時由外層 key 重建元件即清空，不需額外 prop
// 輕點（幾乎沒移動）不留墨點，改為點擊底下的元素（卡片翻面、發音鈕…），拖曳才是書寫

// 清除鈕由外層顯示（要跟著卡片翻面），這裡只回報目前有沒有筆劃：v-model:has-ink
const emit = defineEmits(["update:hasInk"]);

const PEN_COLOR = "rgba(79, 70, 229, 0.85)";
// 輕點判定：觸控筆很容易畫出極短的筆劃（゛、、），門檻比手指 / 滑鼠嚴格，避免被當成輕點刪掉
const TAP_MOVE_PX = 3;
const TAP_MS = 200;
const PEN_TAP_MOVE_PX = 2;
const PEN_TAP_MS = 250;

const layer = ref(null);
const canvas = ref(null);
let ctx = null;
let dpr = 1;

// 筆劃以 CSS 像素儲存，調整大小時可依比例重畫
const strokes = ref([]); // [{ points: [{x, y, w}] }]
watch(
  () => strokes.value.length > 0,
  (has) => emit("update:hasInk", has),
  { immediate: true },
);
let active = null;
let activePointerId = null;
let activeType = null;
let downAt = 0;
let moved = 0;

const lineWidth = (e) => {
  const base = 6;
  // 觸控筆有壓力感應時依壓力變化粗細；手指 / 滑鼠固定粗細
  if (e.pointerType === "pen" && e.pressure > 0)
    return base * (0.6 + e.pressure * 0.8);
  return base;
};

const pointOf = (e) => {
  const rect = canvas.value.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top, w: lineWidth(e) };
};

const drawSegment = (a, b) => {
  ctx.lineWidth = (a.w + b.w) / 2;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
};

const drawDot = (p) => {
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.w / 2, 0, Math.PI * 2);
  ctx.fill();
};

const drawStroke = (s) => {
  const pts = s.points;
  if (pts.length === 1) return drawDot(pts[0]);
  for (let i = 1; i < pts.length; i++) drawSegment(pts[i - 1], pts[i]);
};

const redraw = () => {
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, canvas.value.clientWidth, canvas.value.clientHeight);
  strokes.value.forEach(drawStroke);
};

// 依實際大小設定畫布解析度（含高解析螢幕），寬度改變時筆劃依比例縮放
let lastWidth = 0;
const resize = () => {
  if (!canvas.value) return;
  const w = canvas.value.clientWidth;
  const h = canvas.value.clientHeight;
  if (!w || !h) return;
  if (lastWidth && lastWidth !== w) {
    const k = w / lastWidth;
    strokes.value.forEach((s) =>
      s.points.forEach((p) => {
        p.x *= k;
      }),
    );
  }
  lastWidth = w;
  dpr = window.devicePixelRatio || 1;
  canvas.value.width = Math.round(w * dpr);
  canvas.value.height = Math.round(h * dpr);
  ctx = canvas.value.getContext("2d");
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = PEN_COLOR;
  ctx.fillStyle = PEN_COLOR;
  redraw();
};

// 指標已經失效時 capture 相關呼叫會丟例外，不能讓它中斷落筆流程
const capture = (id) => {
  try {
    canvas.value.setPointerCapture?.(id);
  } catch {
    /* 指標已失效，沒有 capture 也能畫 */
  }
};
const release = (id) => {
  try {
    canvas.value.releasePointerCapture?.(id);
  } catch {
    /* 指標已失效，不需釋放 */
  }
};

const begin = (e) => {
  capture(e.pointerId);
  activePointerId = e.pointerId;
  activeType = e.pointerType;
  downAt = performance.now();
  moved = 0;
  const p = pointOf(e);
  active = { points: [p] };
  strokes.value.push(active);
  drawDot(p);
};

const onDown = (e) => {
  if (e.pointerType === "pen") penOnly = true;
  else if (penOnly && e.pointerType === "touch") return;
  if (e.pointerType === "mouse" && e.button !== 0) return;
  if (active) {
    // 書寫中的第二根手指 / 手掌不理會；觸控筆落下則一律由觸控筆接手
    if (e.pointerType !== "pen") return;
    release(activePointerId);
    // 上一筆是手掌 / 手指佔住的就丟掉；上一筆也是觸控筆代表它的結束事件漏掉了
    // （系統手勢、切換 App 等），保留已畫的部分，直接開始新的一筆，否則之後每一筆都畫不出來
    if (activeType !== "pen") {
      strokes.value.splice(strokes.value.indexOf(active), 1);
      redraw();
    }
    active = null;
  }
  e.preventDefault();
  begin(e);
};

const onMove = (e) => {
  if (!active) {
    // 筆劃被系統取消（pointercancel）或落筆事件漏掉，但觸控筆其實還壓在畫面上移動：
    // 接著開始新的一筆，不要讓後半段沒有線。懸停時 buttons 為 0，不會誤觸發
    if (e.pointerType !== "pen" || !(e.buttons & 1)) return;
    penOnly = true;
    begin(e);
  }
  if (e.pointerId !== activePointerId) return;
  e.preventDefault();
  // 合併事件可取得更密的取樣點，線條較平滑
  const events = e.getCoalescedEvents?.() || [];
  for (const ev of events.length ? events : [e]) {
    const p = pointOf(ev);
    const first = active.points[0];
    const last = active.points[active.points.length - 1];
    if (Math.abs(p.x - last.x) < 0.5 && Math.abs(p.y - last.y) < 0.5) continue;
    moved = Math.max(moved, Math.hypot(p.x - first.x, p.y - first.y));
    active.points.push(p);
    drawSegment(last, p);
  }
};

// 把輕點轉交給手寫層底下的元素
const forwardTap = (x, y) => {
  layer.value.style.display = "none";
  const target = document.elementFromPoint(x, y);
  layer.value.style.display = "";
  target?.dispatchEvent(
    new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
    }),
  );
};

const onUp = (e) => {
  if (!active || e.pointerId !== activePointerId) return;
  // 很快的短筆劃可能只收到一兩個 pointermove，放開點也要算進去，否則距離被低估而誤判成輕點
  if (e.type === "pointerup") {
    const p = pointOf(e);
    const first = active.points[0];
    const last = active.points[active.points.length - 1];
    if (Math.abs(p.x - last.x) >= 0.5 || Math.abs(p.y - last.y) >= 0.5) {
      moved = Math.max(moved, Math.hypot(p.x - first.x, p.y - first.y));
      active.points.push(p);
      drawSegment(last, p);
    }
  }
  const isPen = activeType === "pen";
  const isTap =
    e.type === "pointerup" &&
    moved < (isPen ? PEN_TAP_MOVE_PX : TAP_MOVE_PX) &&
    performance.now() - downAt < (isPen ? PEN_TAP_MS : TAP_MS);
  active = null;
  activePointerId = null;
  activeType = null;
  if (isTap) {
    // 輕點不留墨點，改為點擊底下的元素
    strokes.value.pop();
    redraw();
    forwardTap(e.clientX, e.clientY);
  }
};

const clear = () => {
  strokes.value = [];
  active = null;
  activePointerId = null;
  activeType = null;
  redraw();
};

// iPadOS 的「隨手寫」等系統手勢會對觸控筆送出 pointercancel 讓筆劃中斷，
// 只靠 CSS touch-action 擋不住，要在 touch 事件上 preventDefault（必須是非 passive 監聽）
const blockTouch = (e) => e.preventDefault();
const TOUCH_EVENTS = ["touchstart", "touchmove"];

let observer = null;
onMounted(() => {
  resize();
  observer = new ResizeObserver(resize);
  observer.observe(canvas.value);
  TOUCH_EVENTS.forEach((type) =>
    canvas.value.addEventListener(type, blockTouch, { passive: false }),
  );
});
onUnmounted(() => {
  emit("update:hasInk", false);
  observer?.disconnect();
  TOUCH_EVENTS.forEach((type) =>
    canvas.value?.removeEventListener(type, blockTouch),
  );
});

defineExpose({ clear });
</script>

<style scoped>
.ink-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}
.ink-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  /* 禁止瀏覽器把觸控當成捲動 / 縮放，手指才能寫字 */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
</style>
