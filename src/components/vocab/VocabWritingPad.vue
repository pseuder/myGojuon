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
      @click.stop
    />
    <div v-if="strokes.length" class="ink-tools">
      <el-button
        :icon="RefreshLeft"
        :title="t('vocab.writing_undo')"
        size="large"
        circle
        @click.stop="undo"
      />
      <el-button
        :icon="Delete"
        :title="t('vocab.writing_clear')"
        size="large"
        circle
        style="margin-left: 0"
        @click.stop="clear"
      />
    </div>
  </div>
</template>

<script>
// 偵測到觸控筆後只接受觸控筆，避免手掌壓到畫面畫出線條。
// 放在模組層級：手寫層每換一題都會重建，若存在元件內，換題後手掌先碰到螢幕就會佔住畫筆
let penOnly = false;
</script>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { RefreshLeft, Delete } from "@element-plus/icons-vue";

// 換題時由外層 key 重建元件即清空，不需額外 prop
// 輕點（幾乎沒移動）不留墨點，改為點擊底下的元素（卡片翻面、發音鈕…），拖曳才是書寫

const { t } = useI18n();

const PEN_COLOR = "rgba(79, 70, 229, 0.85)";
// 輕點判定（移動距離、按住時間）
const TAP_MOVE_PX = 6;
const TAP_MS = 350;
// 觸控筆點下去常會滑動幾 px，在空白處放寬門檻，點起來和手指一樣容易；
// 但緊鄰既有筆跡時多半是在補短筆劃（゛、、），維持嚴格門檻避免被當成輕點刪掉
const PEN_TAP_MOVE_PX = 12;
const PEN_TAP_MS = 350;
const PEN_TAP_STRICT_MOVE_PX = 2;
const PEN_TAP_STRICT_MS = 250;
const NEAR_INK_PX = 48;

const layer = ref(null);
const canvas = ref(null);
let ctx = null;
let dpr = 1;

// 筆劃以 CSS 像素儲存，調整大小時可依比例重畫
const strokes = ref([]); // [{ points: [{x, y, w}] }]
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

const onDown = (e) => {
  if (e.pointerType === "pen") penOnly = true;
  else if (penOnly && e.pointerType === "touch") return;
  if (e.pointerType === "mouse" && e.button !== 0) return;
  if (active) {
    // 手掌 / 手指先碰到螢幕佔住畫筆時，觸控筆落下就丟掉那一筆、由觸控筆接手
    if (e.pointerType !== "pen" || activeType === "pen") return;
    canvas.value.releasePointerCapture?.(activePointerId);
    strokes.value.splice(strokes.value.indexOf(active), 1);
    active = null;
    redraw();
  }
  e.preventDefault();
  canvas.value.setPointerCapture?.(e.pointerId);
  activePointerId = e.pointerId;
  activeType = e.pointerType;
  downAt = performance.now();
  moved = 0;
  const p = pointOf(e);
  active = { points: [p] };
  strokes.value.push(active);
  drawDot(p);
};

const onMove = (e) => {
  if (!active || e.pointerId !== activePointerId) return;
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

// 這一筆的起點是否緊鄰其他筆跡
const nearInk = (stroke) => {
  const { x, y } = stroke.points[0];
  return strokes.value.some(
    (s) =>
      s !== stroke &&
      s.points.some((p) => Math.hypot(p.x - x, p.y - y) < NEAR_INK_PX),
  );
};

const tapLimits = (stroke) => {
  if (activeType !== "pen") return [TAP_MOVE_PX, TAP_MS];
  return nearInk(stroke)
    ? [PEN_TAP_STRICT_MOVE_PX, PEN_TAP_STRICT_MS]
    : [PEN_TAP_MOVE_PX, PEN_TAP_MS];
};

const onUp = (e) => {
  if (!active || e.pointerId !== activePointerId) return;
  const [maxMove, maxMs] = tapLimits(active);
  const isTap =
    e.type === "pointerup" &&
    moved < maxMove &&
    performance.now() - downAt < maxMs;
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

const undo = () => {
  strokes.value.pop();
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
.ink-tools {
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 1;
  display: flex;
  gap: 10px;
  pointer-events: auto;
}
/* 平板上用手指 / 觸控筆點按，按鈕與圖示放大一點 */
.ink-tools :deep(.el-button) {
  width: 44px;
  height: 44px;
  font-size: 20px;
}
</style>
