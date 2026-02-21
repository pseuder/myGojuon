<template>
  <div class="select-none" ref="canvasContainer">
    <div class="flex grow gap-2" v-if="showExample">
      <span class="shrink-0">{{ t("example_size") }}</span>
      <el-slider v-model="learningStore.writing_exampleScale" />
    </div>
    <div class="my-2 flex items-center justify-end gap-2">
      <div v-if="selectedSound.type">
        <el-tag type="info">{{
          t(selectedSound.type ? selectedSound.type : "")
        }}</el-tag>
      </div>

      <div class="grow">
        <el-tooltip placement="bottom">
          <template #content>
            <p style="white-space: pre-line">{{ t("supports_stylus") }}</p>
          </template>
          <span id="pen-info" title="">？</span>
        </el-tooltip>
      </div>

      <div class="flex items-center gap-6">
        <div class="relative h-10 w-10" :style="{ color: penColor }">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1182.000000 1280.000000"
            class="h-10 w-10 cursor-pointer"
          >
            <g
              transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
              fill="currentColor"
              stroke="currentColor"
            >
              <path
                d="M6135 11194 c-1192 -76 -2249 -543 -3088 -1364 -762 -745 -1247 -1695 -1396 -2737 -38 -261 -46 -384 -45 -698 0 -443 38 -760 139 -1165 89 -351 181 -602 350 -945 185 -376 364 -652 636 -980 118 -143 461 -481 616 -608 711 -581 1539 -940 2440 -1057 312 -41 690 -50 798 -20 182 51 328 143 434 275 130 161 191 350 177 555 -12 197 -68 325 -219 505 -67 80 -137 216 -163 320 -25 96 -25 285 0 380 63 243 225 437 449 540 149 68 141 67 887 75 371 4 686 10 700 13 14 4 70 13 125 22 536 84 1050 351 1447 752 324 327 539 688 672 1133 108 360 133 810 70 1265 -186 1335 -1066 2512 -2379 3180 -582 296 -1185 471 -1865 540 -147 15 -654 27 -785 19z m-840 -1094 c272 -86 474 -296 547 -568 28 -109 28 -287 -1 -397 -74 -281 -295 -502 -576 -576 -114 -30 -280 -30 -394 0 -277 73 -484 271 -571 546 -28 90 -38 267 -20 368 54 313 301 570 614 642 94 22 312 14 401 -15z m2603 15 c315 -66 567 -325 622 -642 18 -101 8 -278 -20 -368 -87 -275 -294 -473 -571 -546 -114 -30 -280 -30 -394 0 -281 74 -502 295 -576 576 -30 112 -30 289 0 399 79 297 323 527 622 585 71 14 242 12 317 -4z m-4308 -2126 c177 -28 313 -100 445 -233 133 -134 200 -272 225 -464 32 -245 -61 -496 -247 -673 -98 -94 -201 -151 -340 -191 -102 -29 -304 -31 -403 -4 -362 99 -600 408 -600 775 0 165 42 311 127 439 175 263 486 401 793 351z m5958 -19 c348 -98 582 -408 582 -770 0 -165 -39 -297 -126 -433 -250 -387 -770 -483 -1146 -210 -122 88 -238 250 -286 399 -88 271 -20 577 175 785 123 130 271 213 438 245 96 19 269 11 363 -16z"
              />
            </g>
          </svg>
          <el-color-picker
            v-model="penColor"
            :predefine="predefinedColors"
            class="absolute inset-0 opacity-0"
          />
        </div>

        <el-button
          @click="handleClear"
          link
          class="m-0 p-0 text-[35px] leading-none"
        >
          <img
            src="/images/broom.png"
            alt=""
            class="h-10 w-10 cursor-pointer"
            :class="{ 'rotate-animation': isRotating }"
          />
        </el-button>

        <div v-if="showChangeSoundButtons" class="flex items-center gap-4">
          <img
            src="/images/arrow-circle-left-solid.svg"
            alt="上一個"
            class="h-10 w-10 cursor-pointer"
            @click="handleChangeSound('prev')"
          />
          <img
            src="/images/arrow-circle-right-solid.svg"
            alt="下一個"
            class="h-10 w-10 cursor-pointer"
            @click="handleChangeSound('next')"
          />
        </div>
      </div>
    </div>
    <div class="canvas-wrapper" ref="canvasWrapper">
      <canvas
        ref="canvas"
        @pointerdown="handlePointerDown"
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
import { useCanvas } from "@/composables/useCanvas.js";
import { usePen } from "@/composables/usePen.js";
import { useDrawing } from "@/composables/useDrawing.js";

/*-- store --*/
import { storeToRefs } from "pinia";
import { useLearningStore } from "@/stores/learning.js";
const learningStore = useLearningStore();
const { writing_exampleScale } = storeToRefs(learningStore);

/*-- i18n --*/
import { useI18n } from "vue-i18n";
const { t } = useI18n();

/*-- Prop --*/
const props = defineProps({
  exampleKana: { type: String, default: "あ" },
  showExample: { type: Boolean, default: true },
  currentType: { type: String, default: "hiragana" },
  learningModule: { type: String, default: "" },
  showChangeSoundButtons: { type: Boolean, default: true },
  selectedSound: {
    type: Object,
    default: () => ({ kana: "", romaji: "", evo: "", type: "" }),
  },
});

/*-- Emit --*/
const emit = defineEmits(["imageRecognition", "changeSound"]);

/*-- Composable --*/
const {
  canvas,
  canvasContainer,
  canvasWrapper,
  ctx,
  initCanvas,
  clearCanvas,
  clearUserDrawing,
  redrawCanvas,
} = useCanvas(props, writing_exampleScale);

const { penMode, penColor, penSize } = usePen();

const {
  isDrawing,
  userPaths,
  startDrawing,
  draw,
  stopDrawing,
  drawUserPaths,
  clearUserPaths,
} = useDrawing(canvas, penMode, penColor, penSize, ctx);

watch(
  () => props.exampleKana,
  () => {
    clearCanvas();
    clearUserPaths();
  },
);

watch(
  () => penColor,
  () => {
    console.log(penColor.value);
    learningStore.pen_color = penColor.value;
  },
  { deep: true },
);

watch(
  () => learningStore.writing_exampleScale,
  () => {
    redrawCanvas();
  },
);

watch(
  userPaths,
  () => {
    redrawCanvas();
    drawUserPaths();
  },
  { deep: true },
);

const predefinedColors = [
  "#000000",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFA500",
  "#800080",
  "#808080",
];

const handleChangeSound = (direction) => {
  emit("changeSound", direction);
};

const handlePointerDown = (event) => {
  if (event.pointerType === "pen") penMode.value = true;
  startDrawing(event);
};

const isRotating = ref(false);

const handleClear = () => {
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

const handleAIRecognition = async () => {
  const imageBlob = await generateCanvasImage();
  emit("imageRecognition", imageBlob);
};

onMounted(() => {
  initCanvas();
  window.addEventListener("resize", () => initCanvas());
});

onUnmounted(() => {
  window.removeEventListener("resize", () => initCanvas());
});

defineExpose({ clearCanvas, handleAIRecognition });
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
