import { ref, reactive } from 'vue'

export function useCanvas(props) {
  const canvas = ref(null)
  const canvasContainer = ref(null)
  const canvasWrapper = ref(null)
  const ctx = reactive({ value: null })

  const initCanvas = () => {
    if (!canvasContainer.value || !canvasWrapper.value || !canvas.value) return

    const containerWidth = canvasWrapper.value.offsetWidth
    const containerHeight = canvasWrapper.value.offsetHeight

    canvas.value.width = containerWidth
    canvas.value.height = containerHeight

    ctx.value = canvas.value.getContext('2d')
    ctx.value.lineCap = 'round'
    ctx.value.lineJoin = 'round'

    redrawCanvas()
  }

  const clearCanvas = () => {
    if (!ctx.value || !canvas.value) return
    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
    drawGrid()
    if (props.showExample) {
      drawExampleKana()
    }
  }

  const clearUserDrawing = () => {
    if (!ctx.value || !canvas.value) return
    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
    redrawCanvas()
  }

  const redrawCanvas = () => {
    if (!ctx.value || !canvas.value) return
    drawGrid()
    if (props.showExample) {
      drawExampleKana()
    }
  }

  const drawGrid = () => {
    if (!ctx.value || !canvas.value) return
    ctx.value.save()
    ctx.value.strokeStyle = '#ccc'
    ctx.value.lineWidth = 1

    ctx.value.beginPath()
    ctx.value.moveTo(0, canvas.value.height / 2)
    ctx.value.lineTo(canvas.value.width, canvas.value.height / 2)
    ctx.value.stroke()

    ctx.value.beginPath()
    ctx.value.moveTo(canvas.value.width / 2, 0)
    ctx.value.lineTo(canvas.value.width / 2, canvas.value.height)
    ctx.value.stroke()

    ctx.value.restore()
  }

  const drawExampleKana = () => {
      if (!ctx.value || !canvas.value) return
      ctx.value.save()

      const fontSize = props.currentType === 'yoon'
        ? canvas.value.height * 0.5
        : canvas.value.height * 0.8

      // 使用字體堆疊，從最優先到備用字體
      ctx.value.font = `${fontSize}px "UDDigiKyokasho N-R", "Yu Gothic", "MS Gothic", sans-serif`
      ctx.value.fillStyle = 'rgba(200, 200, 200, 0.5)'
      ctx.value.textAlign = 'center'
      ctx.value.textBaseline = 'middle'
      ctx.value.fillText(props.exampleKana, canvas.value.width / 2, canvas.value.height / 2)
      ctx.value.restore()
  }

  const handleResize = () => {
    initCanvas()
  }

  return {
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
    handleResize
  }
}