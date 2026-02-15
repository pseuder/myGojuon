import { ref, reactive } from 'vue'

// ============================================================
// Constants
// ============================================================
const STORAGE_KEYS = {
  PEN_COLOR: 'handwriting_penColor',
}

const DEFAULT_VALUES = {
  PEN_COLOR: '#000000',
}

export function usePen() {
  const penMode = ref(false)

  // 從 localStorage 讀取畫筆顏色設定，預設為黑色
  const savedPenColor = true
    ? localStorage.getItem(STORAGE_KEYS.PEN_COLOR)
    : null
  const penColor = ref(savedPenColor || DEFAULT_VALUES.PEN_COLOR)

  const penSize = ref(10)
  const penSizeOptions = reactive([
    { label: '細', value: 6 },
    { label: '中', value: 8 },
    { label: '粗', value: 10 }
  ])

  const updatePenStyle = () => {
    // This function will be called in the main component
  }

  const handleModeChange = () => {
    // This function will be called in the main component
  }

  const updateTouchAction = () => {
    // This function will be called in the main component
  }

  return {
    penMode,
    penColor,
    penSize,
    penSizeOptions,
    updatePenStyle,
    handleModeChange,
    updateTouchAction
  }
}
