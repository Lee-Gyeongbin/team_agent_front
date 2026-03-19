import type { VisualizationChartType } from '~/types/chat'

const CHART_FULLSCREEN_CLASS = 'has-fullscreen-chart'

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value)
}

const niceNumber = (range: number, round: boolean) => {
  if (!isFiniteNumber(range) || range <= 0) return 1

  const exponent = Math.floor(Math.log10(range))
  const fraction = range / Math.pow(10, exponent)
  let niceFraction: number

  if (round) {
    if (fraction < 1.5) niceFraction = 1
    else if (fraction < 3) niceFraction = 2
    else if (fraction < 7) niceFraction = 5
    else niceFraction = 10
  } else {
    if (fraction <= 1) niceFraction = 1
    else if (fraction <= 2) niceFraction = 2
    else if (fraction <= 5) niceFraction = 5
    else niceFraction = 10
  }

  return niceFraction * Math.pow(10, exponent)
}

export const calculateChartScale = (
  values: number[],
  paddingRatio = 0.1,
  allowNegative = true,
): { min: number; max: number; stepSize: number } => {
  const validValues = values.filter(isFiniteNumber)
  if (validValues.length === 0) {
    return { min: 0, max: 100, stepSize: 20 }
  }

  let minValue = Math.min(...validValues)
  let maxValue = Math.max(...validValues)

  if (minValue === maxValue) {
    const base = minValue === 0 ? 1 : Math.abs(minValue) * 0.1
    minValue -= base
    maxValue += base
  }

  const range = Math.max(maxValue - minValue, 1)
  const paddedMin = minValue - range * paddingRatio
  const paddedMax = maxValue + range * paddingRatio

  const niceRange = niceNumber(paddedMax - paddedMin, false)
  const rawStep = niceNumber(niceRange / 5, true)
  const stepSize = rawStep < 1 ? Number(rawStep.toFixed(1)) : Math.round(rawStep)
  const normalizedStepSize = stepSize > 0 ? stepSize : 1

  let niceMin = Math.floor(paddedMin / normalizedStepSize) * normalizedStepSize
  let niceMax = Math.ceil(paddedMax / normalizedStepSize) * normalizedStepSize

  if (!allowNegative) {
    niceMin = Math.max(0, niceMin)
  }
  if (niceMax <= niceMin) {
    niceMax = niceMin + normalizedStepSize
  }

  return {
    min: Number(niceMin.toFixed(2)),
    max: Number(niceMax.toFixed(2)),
    stepSize: normalizedStepSize,
  }
}

export const buildChartCaptureFileName = (chartType: VisualizationChartType) => {
  const now = new Date()
  const datePart = now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_')
  return `chart_${chartType}_${datePart}.png`
}

export const captureChartCanvasAsPng = (canvas: HTMLCanvasElement, fileNamePrefix: VisualizationChartType) => {
  if (!canvas.width || !canvas.height) return false

  const tempCanvas = document.createElement('canvas')
  const tempContext = tempCanvas.getContext('2d')
  if (!tempContext) return false

  tempCanvas.width = canvas.width
  tempCanvas.height = canvas.height

  tempContext.fillStyle = '#ffffff'
  tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
  tempContext.drawImage(canvas, 0, 0)

  const link = document.createElement('a')
  link.download = buildChartCaptureFileName(fileNamePrefix)
  link.href = tempCanvas.toDataURL('image/png')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  return true
}

export const toggleBodyChartFullscreen = (isFullscreen: boolean) => {
  if (typeof document === 'undefined') return
  if (isFullscreen) {
    document.body.classList.add(CHART_FULLSCREEN_CLASS)
    return
  }
  document.body.classList.remove(CHART_FULLSCREEN_CLASS)
}

export const clearBodyChartFullscreen = () => {
  if (typeof document === 'undefined') return
  document.body.classList.remove(CHART_FULLSCREEN_CLASS)
}
