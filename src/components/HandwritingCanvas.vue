<template>
  <div class="handwriting-canvas" ref="canvasContainer">
    <div class="mb-2 flex justify-between items-center flex-wrap">
      <el-switch
        v-model="penMode"
        active-text="觸控筆"
        inactive-text="觸控"
        @change="handleModeChange"
      />
      <el-checkbox v-model="showExample" @change="redrawCanvas">
        範例
      </el-checkbox>
      <el-color-picker
        v-model="penColor"
        popper-class="my-color-picker"
        size="medium"
        @change="updatePenStyle"
      />
      <el-select
        v-model="penSize"
        placeholder="筆觸粗細"
        size="small"
        @change="updatePenStyle"
        style="width: 50px"
      >
        <el-option label="細" :value="6" />
        <el-option label="中" :value="8" />
        <el-option label="粗" :value="10" />
      </el-select>

      <el-button
        @click="handleClear"
        type="text"
        style="font-size: 35px; padding: 0; margin: 0; line-height: 1"
        >🧹</el-button
      >
    </div>
    <div class="canvas-wrapper" ref="canvasWrapper">
      <canvas
        ref="canvas"
        @pointerdown="startDrawing"
        @pointermove="draw"
        @pointerup="stopDrawing"
        @pointerout="stopDrawing"
        @touchstart.prevent="handleTouch"
        @touchmove.prevent="handleTouch"
        @touchend.prevent="handleTouch"
        :style="{ cursor: penMode ? 'default' : 'crosshair' }"
      ></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import axios from "axios";
import { ElMessageBox } from "element-plus";

const props = defineProps({
  exampleKana: {
    type: String,
    default: "あ",
  },
});

const emit = defineEmits(["clear", "autoDetect"]);

const canvas = ref(null);
const canvasContainer = ref(null);
let ctx;
let isDrawing = false;
let canvasWidth = 0;
let canvasHeight = 0;
const penColor = ref("#000000");
const penSize = ref(8);

const penMode = ref(true);
const showExample = ref(true);

const canvasWrapper = ref(null);

// 新增: 用於計時器的變量
let drawingTimer = null;

// 新增：用於存儲用戶繪製的路徑
const userPaths = ref([]);

const updatePenStyle = () => {
  if (ctx) {
    ctx.strokeStyle = penColor.value;
    ctx.lineWidth = penSize.value;
  }
};

const initCanvas = () => {
  if (!canvasContainer.value || !canvasWrapper.value) return;

  const containerWidth = canvasWrapper.value.offsetWidth;
  const containerHeight = canvasWrapper.value.offsetHeight;

  canvasWidth = containerWidth;
  canvasHeight = containerHeight;

  canvas.value.width = canvasWidth;
  canvas.value.height = canvasHeight;

  ctx = canvas.value.getContext("2d");
  updatePenStyle();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  redrawCanvas();
};

const redrawCanvas = () => {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  if (showExample.value) {
    drawGrid();
    drawExampleKana();
  }
  // 重繪用戶的繪圖
  drawUserPaths();
};

const drawGrid = () => {
  ctx.save();
  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(0, canvasHeight / 2);
  ctx.lineTo(canvasWidth, canvasHeight / 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(canvasWidth / 2, 0);
  ctx.lineTo(canvasWidth / 2, canvasHeight);
  ctx.stroke();

  ctx.restore();
};

const drawExampleKana = () => {
  ctx.save();
  ctx.font = `${canvasHeight * 0.8}px serif`;
  ctx.fillStyle = "rgba(200, 200, 200, 0.5)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(props.exampleKana, canvasWidth / 2, canvasHeight / 2);
  ctx.restore();
};

// 新增：繪製用戶路徑的函數
const drawUserPaths = () => {
  ctx.save();
  ctx.strokeStyle = penColor.value;
  ctx.lineWidth = penSize.value;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  userPaths.value.forEach((path) => {
    if (path.length > 0) {
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
    }
  });

  ctx.restore();
};

const startDrawing = (event) => {
  if (penMode.value && event.pointerType !== "pen") return;
  if (
    !penMode.value &&
    event.pointerType !== "touch" &&
    event.pointerType !== "mouse"
  )
    return;

  isDrawing = true;
  updatePenStyle();

  const rect = canvas.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  userPaths.value.push([{ x, y }]);

  ctx.beginPath();
  ctx.moveTo(x, y);

  // 清除之前的計時器
  if (drawingTimer) {
    clearTimeout(drawingTimer);
  }
};

const draw = (event) => {
  if (!isDrawing) return;

  if (penMode.value && event.pointerType !== "pen") return;
  if (
    !penMode.value &&
    event.pointerType !== "touch" &&
    event.pointerType !== "mouse"
  )
    return;

  const rect = canvas.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  userPaths.value[userPaths.value.length - 1].push({ x, y });

  ctx.lineTo(x, y);
  ctx.stroke();

  // 每次繪製時重置計時器
  if (drawingTimer) {
    clearTimeout(drawingTimer);
  }
};

const stopDrawing = () => {
  isDrawing = false;
  ctx.beginPath();

  // 設置2秒後自動發送圖像的計時器
  // drawingTimer = setTimeout(async () => {
  //   await sendCanvasImageToBackend();
  // }, 500);
};

const generateCanvasImage = () => {
  // 創建一個新的離屏 canvas
  const offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = canvasWidth;
  offscreenCanvas.height = canvasHeight;
  const offscreenCtx = offscreenCanvas.getContext("2d");

  // 設置白色背景
  offscreenCtx.fillStyle = "white";
  offscreenCtx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 只繪製用戶的筆跡
  offscreenCtx.strokeStyle = penColor.value;
  offscreenCtx.lineWidth = penSize.value;
  offscreenCtx.lineCap = "round";
  offscreenCtx.lineJoin = "round";

  userPaths.value.forEach((path) => {
    if (path.length > 0) {
      offscreenCtx.beginPath();
      offscreenCtx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        offscreenCtx.lineTo(path[i].x, path[i].y);
      }
      offscreenCtx.stroke();
    }
  });

  // 將 canvas 轉換為 Blob 對象
  return new Promise((resolve) => {
    offscreenCanvas.toBlob(resolve, "image/png");
  });
};

const sendCanvasImageToBackend = async () => {
  try {
    const imageBlob = await generateCanvasImage();
    const formData = new FormData();
    formData.append("image", imageBlob, "handwriting.png");

    const response = await axios.post(
      "https://cs_prod.chainsea.com.tw:9641/predict",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("Image sent successfully:", response.data);

    const res = response.data;

    // 如果有返回結果，則觸發 autoDetect 事件
    if (res && res.confidence > 0.8) {
      emit("autoDetect", res.predicted_hiragana);
    }
  } catch (error) {
    console.error("Error sending image to backend:", error);
  }
};

const handleClear = () => {
  clearCanvas();
};

const handleModeChange = () => {
  clearCanvas();
  updateTouchAction();
};

const handleTouch = (event) => {
  event.preventDefault();
};

const updateTouchAction = () => {
  canvas.value.style.touchAction = penMode.value ? "none" : "pinch-zoom";
};

const handleResize = () => {
  initCanvas();
};

watch(() => props.exampleKana, redrawCanvas);

onMounted(() => {
  initCanvas();
  window.addEventListener("resize", handleResize);
  updateTouchAction();
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  // 確保在組件卸載時清除計時器
  if (drawingTimer) {
    clearTimeout(drawingTimer);
  }
});
const clearCanvas = () => {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  userPaths.value = []; // 清除保存的路徑
  if (showExample.value) {
    drawGrid();
    drawExampleKana();
  }
};

defineExpose({ clearCanvas, sendCanvasImageToBackend });
</script>

<style scoped>
.handwriting-canvas {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  touch-action: none;
}
</style>
