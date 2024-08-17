import { ref, reactive } from 'vue'

export function usePen() {
  const penMode = ref(true)
  const penColor = ref('#000000')
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