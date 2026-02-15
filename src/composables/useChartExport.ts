import type { ChartDataItem } from '@/types'

/**
 * Export chart data as CSV
 */
export function exportToCsv(data: ChartDataItem[], filename: string): void {
  const header = 'Label,Value,URI\n'
  const rows = data
    .map((item) => {
      const label = `"${item.label.replace(/"/g, '""')}"`
      const uri = item.uri ? `"${item.uri}"` : ''
      return `${label},${item.value},${uri}`
    })
    .join('\n')

  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `${filename}.csv`)
}

/**
 * Export an ECharts instance as PNG
 */
export function exportEChartToPng(
  chartInstance: { getDataURL: (opts: object) => string },
  filename: string
): void {
  const url = chartInstance.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: '#28293D',
  })
  downloadDataUrl(url, `${filename}.png`)
}

/**
 * Export an ECharts instance as SVG
 */
export function exportEChartToSvg(
  chartInstance: { getDataURL: (opts: object) => string },
  filename: string
): void {
  const url = chartInstance.getDataURL({
    type: 'svg',
    pixelRatio: 2,
    backgroundColor: '#28293D',
  })
  downloadDataUrl(url, `${filename}.svg`)
}

/**
 * Export a D3 chart container as PNG via canvas
 */
export function exportSvgToPng(svgElement: SVGSVGElement, filename: string): void {
  const svgData = new XMLSerializer().serializeToString(svgElement)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const img = new Image()
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  img.onload = () => {
    canvas.width = img.width * 2
    canvas.height = img.height * 2
    ctx.scale(2, 2)
    ctx.fillStyle = '#28293D'
    ctx.fillRect(0, 0, img.width, img.height)
    ctx.drawImage(img, 0, 0)
    URL.revokeObjectURL(url)

    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `${filename}.png`)
    })
  }

  img.src = url
}

function downloadBlob(blob: Blob, filename: string): void {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

function downloadDataUrl(url: string, filename: string): void {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
}
