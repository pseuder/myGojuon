<template>
  <!-- 疊在單字卡上的手寫層：手指 / 觸控筆 / 滑鼠直接在卡片上寫，純練習不做辨識 -->
  <!-- 放在翻轉層外面，翻面時筆跡不跟著轉，可直接對照背面答案 -->
  <div class="ink-layer">
    <!-- 上方留給學習集名稱與發音鈕，不蓋住 -->
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
        size="small"
        circle
        @click.stop="undo"
      />
      <el-button
        :icon="Delete"
        :title="t('vocab.writing_clear')"
        size="small"
        circle
        style="margin-left: 0"
        @click.stop="clear"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { RefreshLeft, Delete } from "@element-plus/icons-vue";

// 換題時由外層 key 重建元件即清空，不需額外 prop
// 輕點（幾乎沒移動）視為翻面，拖曳才是書寫
const emit = defineEmits(["tap"]);

const { t } = useI18n();

const PEN_COLOR = "rgba(79, 70, 229, 0.85)";
const TAP_MOVE_PX = 6;
const TAP_MS = 350;

const canvas = ref(null);
let ctx = null;
let dpr = 1;

// 筆劃以 CSS 像素儲存，調整大小時可依比例重畫
const strokes = ref([]); // [{ points: [{x, y, w}] }]
let active = null;
let activePointerId = null;
let downAt = 0;
let moved = 0;
// 偵測到觸控筆後只接受觸控筆，避免手掌壓到畫面畫出線條
let penOnly = false;

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
  if (active) return;
  e.preventDefault();
  canvas.value.setPointerCapture?.(e.pointerId);
  activePointerId = e.pointerId;
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

const onUp = (e) => {
  if (!active || e.pointerId !== activePointerId) return;
  const isTap =
    e.type === "pointerup" &&
    moved < TAP_MOVE_PX &&
    performance.now() - downAt < TAP_MS;
  active = null;
  activePointerId = null;
  if (isTap) {
    // 輕點不留墨點，改為翻面
    strokes.value.pop();
    redraw();
    emit("tap");
  }
};

const clear = () => {
  strokes.value = [];
  active = null;
  activePointerId = null;
  redraw();
};

const undo = () => {
  strokes.value.pop();
  redraw();
};

let observer = null;
onMounted(() => {
  resize();
  observer = new ResizeObserver(resize);
  observer.observe(canvas.value);
});
onUnmounted(() => observer?.disconnect());

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
  top: 52px;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: calc(100% - 52px);
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
  display: flex;
  gap: 6px;
  pointer-events: auto;
}
</style>
