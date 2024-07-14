import { ref } from 'vue'

export function useDrawing(canvas, penMode, penColor, penSize, ctx) {
  const isDrawing = ref(false)
  const userPaths = ref([])

  const clearUserPaths = () => {
    userPaths.value = []
  }

  const startDrawing = (event) => {
    if (penMode.value && event.pointerType !== 'pen') return
    if (!penMode.value && event.pointerType !== 'touch' && event.pointerType !== 'mouse') return

    isDrawing.value = true
    const rect = canvas.value.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    userPaths.value.push([{ x, y }])
    
    ctx.value.beginPath()
    ctx.value.moveTo(x, y)
    updatePenStyle()
  }

  const draw = (event) => {
    if (!isDrawing.value) return
    if (penMode.value && event.pointerType !== 'pen') return
    if (!penMode.value && event.pointerType !== 'touch' && event.pointerType !== 'mouse') return

    const rect = canvas.value.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    userPaths.value[userPaths.value.length - 1].push({ x, y })

    ctx.value.lineTo(x, y)
    ctx.value.stroke()
  }

  const stopDrawing = () => {
    isDrawing.value = false
    ctx.value.beginPath()
  }

  const drawUserPaths = () => {
    if (!ctx.value) return
    ctx.value.save()
    updatePenStyle()

    userPaths.value.forEach(path => {
      if (path.length > 0) {
        ctx.value.beginPath()
        ctx.value.moveTo(path[0].x, path[0].y)
        path.slice(1).forEach(point => ctx.value.lineTo(point.x, point.y))
        ctx.value.stroke()
      }
    })

    ctx.value.restore()
  }

  const updatePenStyle = () => {
    if (!ctx.value) return
    ctx.value.strokeStyle = penColor.value
    ctx.value.lineWidth = penSize.value
    ctx.value.lineCap = 'round'
    ctx.value.lineJoin = 'round'
  }

  return {
    isDrawing,
    userPaths,
    startDrawing,
    draw,
    stopDrawing,
    drawUserPaths,
    clearUserPaths
  }
}