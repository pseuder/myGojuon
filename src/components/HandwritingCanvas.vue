<template>
  <div class="" ref="canvasContainer">
    <div class="flex justify-between items-center my-2">
      <el-switch v-model="penMode" active-text="觸控筆" inactive-text="觸控" @change="handleModeChange" />

      <!-- <el-select
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
      </el-select> -->
      <el-button @click="handleClear" type="text" style="font-size: 35px; padding: 0; margin: 0; line-height: 1">
        <img src="/images/broom.png" alt="" class="w-10 h-10 cursor-pointer"
          :class="{ 'rotate-animation': isRotating }" />
      </el-button>
    </div>
    <div class="canvas-wrapper" ref="canvasWrapper">
      <canvas ref="canvas" @pointerdown="startDrawing" @pointermove="draw" @pointerup="stopDrawing"
        @pointerout="stopDrawing" @touchstart.prevent="handleTouch" @touchmove.prevent="handleTouch"
        @touchend.prevent="handleTouch" :style="{ cursor: penMode ? 'default' : 'crosshair' }"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useCanvas } from "@/composables/useCanvas";
import { usePen } from "@/composables/usePen";
import { useDrawing } from "@/composables/useDrawing";
import axios, { isTokenExpired } from "@/utils/axios";

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
  learningModule: {
    type: String,
    default: "",
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
  getDrawingDuration,
} = useDrawing(canvas, penMode, penColor, penSize, ctx, handleDrawingStop);

const isSending = ref(false);
const isRotating = ref(false);

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

    const response = await axios.post("/predict", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    emit("autoDetect", response);
  } catch (error) {
    console.error("Error sending image to backend:", error);
  } finally {
    isSending.value = false;
  }
};

const handleClear = () => {
  debugger;
  if (!isRotating.value) {
    isRotating.value = true;
    setTimeout(() => {
      isRotating.value = false;
    }, 500);
  }
  clearUserDrawing();
  clearUserPaths();
};

const handleTouch = (event) => {
  event.preventDefault();
};

async function handleDrawingStop(duration) {
  try {
    // 這裡可以添加其他你想要傳送到後端的信息

    const dataToSend = {
      duration: duration,
      learningType: props.currentType,
      learningKana: props.exampleKana,
      learningModule: props.learningModule,
    };


    // 發送數據到後端
    let token_expired = isTokenExpired();
    if (!token_expired) {
      axios
        .post("/record_activity", dataToSend)
        .catch((error) => {
          console.error("Error recording activity:", error);
        });
    }
  } catch (error) {
    console.error("Error recording activity:", error);
  }
}

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
canvas {
  width: 100%;
  aspect-ratio: 1 / 1;
  touch-action: none;
}

@keyframes rotateLeftRight {
  0% {
    transform: rotate(0deg);
  }

  50% {
    transform: rotate(-45deg);
  }

  100% {
    transform: rotate(0deg);
  }
}

.rotate-animation {
  animation: rotateLeftRight 0.5s ease;
}
</style>
