<template>
  <div class="handwriting-canvas" ref="canvasContainer">
    <div class="mb-2 flex justify-between items-center flex-wrap">
      <el-switch
        v-model="penMode"
        active-text="觸控筆"
        inactive-text="觸控"
        @change="handleModeChange"
      />
      <!-- <el-color-picker
        v-model="penColor"
        popper-class="my-color-picker"
        size="medium"
        @change="updatePenStyle"
      /> -->
      <el-select
        v-model="penSize"
        placeholder="筆觸粗細"
        size="small"
        @change="updatePenStyle"
        style="width: 50px"
      >
        <el-option
          v-for="option in penSizeOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
      <el-button
        @click="handleClear"
        type="text"
        style="font-size: 35px; padding: 0; margin: 0; line-height: 1"
      >
        🧹
      </el-button>
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
import { useCanvas } from "@/composables/useCanvas";
import { usePen } from "@/composables/usePen";
import { useDrawing } from "@/composables/useDrawing";
import axios from "axios";

const props = defineProps({
  exampleKana: {
    type: String,
    default: "あ",
  },
  showExample: {
    type: Boolean,
    default: true,
  },
  currentType: {
    type: String,
    default: "hiragana",
  },
});

const emit = defineEmits(["autoDetect"]);

const {
  canvas,
  canvasContainer,
  canvasWrapper,
  ctx,
  initCanvas,
  clearCanvas,
  clearUserDrawing,
  redrawCanvas,
  drawGrid,
  drawExampleKana,
  handleResize,
} = useCanvas(props);

const {
  penMode,
  penColor,
  penSize,
  penSizeOptions,
  updatePenStyle,
  handleModeChange,
  updateTouchAction,
} = usePen(ctx);

const {
  isDrawing,
  userPaths,
  startDrawing,
  draw,
  stopDrawing,
  drawUserPaths,
  clearUserPaths,
} = useDrawing(canvas, penMode, penColor, penSize, ctx);

const isSending = ref(false);

const generateCanvasImage = async () => {
  const offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = canvas.value.width;
  offscreenCanvas.height = canvas.value.height;
  const offscreenCtx = offscreenCanvas.getContext("2d");

  offscreenCtx.fillStyle = "white";
  offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

  offscreenCtx.strokeStyle = penColor.value;
  offscreenCtx.lineWidth = penSize.value;
  offscreenCtx.lineCap = "round";
  offscreenCtx.lineJoin = "round";

  userPaths.value.forEach((path) => {
    if (path.length > 0) {
      offscreenCtx.beginPath();
      offscreenCtx.moveTo(path[0].x, path[0].y);
      path.slice(1).forEach((point) => offscreenCtx.lineTo(point.x, point.y));
      offscreenCtx.stroke();
    }
  });

  return new Promise((resolve) => offscreenCanvas.toBlob(resolve, "image/png"));
};

const sendCanvasImageToBackend = async () => {
  try {
    isSending.value = true;
    const imageBlob = await generateCanvasImage();
    const formData = new FormData();
    formData.append("char_type", props.currentType);
    formData.append("image", imageBlob, "handwriting.png");

    const response = await axios.post(
      "https://cs_prod.chainsea.com.tw:9641/predict",
      // "http://192.168.31.62:5000/predict",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    console.log("Image sent successfully:", response.data);
    emit("autoDetect", response.data);
  } catch (error) {
    console.error("Error sending image to backend:", error);
  } finally {
    isSending.value = false;
  }
};

const handleClear = () => {
  clearUserDrawing();
  clearUserPaths();
};

const handleTouch = (event) => {
  event.preventDefault();
};

onMounted(() => {
  initCanvas();
  window.addEventListener("resize", handleResize);
  updateTouchAction();
});

watch(
  () => props.exampleKana,
  () => {
    clearCanvas();
    clearUserPaths();
  }
);
watch(() => props.showExample, redrawCanvas);

// 確保在每次繪製後重新繪製用戶路徑
watch(
  userPaths,
  () => {
    redrawCanvas();
    drawUserPaths();
  },
  { deep: true }
);

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

defineExpose({ clearCanvas, sendCanvasImageToBackend, isSending });
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
