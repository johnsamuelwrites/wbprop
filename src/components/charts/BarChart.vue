<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as d3 from 'd3'
import type { ChartDataItem } from '@/types'

const props = withDefaults(
  defineProps<{
    data: ChartDataItem[]
    height?: number
    barColor?: string
    hoverColor?: string
    animated?: boolean
  }>(),
  {
    height: 300,
    barColor: '#3170F3',
    hoverColor: '#5090FF',
    animated: true,
  }
)

const chartContainer = ref<HTMLDivElement | null>(null)
let resizeObserver: ResizeObserver | null = null

function renderChart() {
  if (!chartContainer.value || !props.data.length) return

  // Clear previous chart
  d3.select(chartContainer.value).selectAll('*').remove()

  const container = chartContainer.value
  const width = container.clientWidth
  const height = props.height

  const margin = { top: 20, right: 20, bottom: 60, left: 50 }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom

  // Create SVG
  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Scales
  const x = d3
    .scaleBand()
    .range([0, chartWidth])
    .domain(props.data.map((d) => d.label))
    .padding(0.2)

  const y = d3
    .scaleLinear()
    .range([chartHeight, 0])
    .domain([0, d3.max(props.data, (d) => d.value) ?? 0])
    .nice()

  // X Axis
  svg
    .append('g')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end')
    .style('font-size', '11px')
    .style('fill', '#9e9e9e')

  // Y Axis
  svg
    .append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('.2s')))
    .selectAll('text')
    .style('fill', '#9e9e9e')

  // Style axis lines
  svg.selectAll('.domain, .tick line').style('stroke', '#424242')

  // Tooltip
  const tooltip = d3
    .select(container)
    .append('div')
    .attr('class', 'chart-tooltip')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .style('background-color', 'rgba(45, 46, 69, 0.95)')
    .style('color', '#fff')
    .style('padding', '8px 12px')
    .style('border-radius', '4px')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('z-index', '1000')
    .style('box-shadow', '0 2px 8px rgba(0,0,0,0.3)')

  // Bars
  const bars = svg
    .selectAll('.bar')
    .data(props.data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', (d) => x(d.label) ?? 0)
    .attr('width', x.bandwidth())
    .attr('fill', props.barColor)
    .attr('rx', 4)
    .attr('ry', 4)
    .style('cursor', 'pointer')

  // Animation
  if (props.animated) {
    bars
      .attr('y', chartHeight)
      .attr('height', 0)
      .transition()
      .duration(800)
      .delay((_, i) => i * 50)
      .ease(d3.easeElasticOut.amplitude(1).period(0.5))
      .attr('y', (d) => y(d.value))
      .attr('height', (d) => chartHeight - y(d.value))
  } else {
    bars.attr('y', (d) => y(d.value)).attr('height', (d) => chartHeight - y(d.value))
  }

  // Hover effects
  bars
    .on('mouseover', function (_event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('fill', props.hoverColor)

      tooltip
        .style('visibility', 'visible')
        .html(`<strong>${d.label}</strong><br/>Count: ${d.value.toLocaleString()}`)
    })
    .on('mousemove', function (event: MouseEvent) {
      const [mouseX, mouseY] = d3.pointer(event, container)
      tooltip
        .style('top', `${mouseY - 10}px`)
        .style('left', `${mouseX + 15}px`)
    })
    .on('mouseout', function () {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('fill', props.barColor)

      tooltip.style('visibility', 'hidden')
    })
}

// Handle resize
function handleResize() {
  renderChart()
}

onMounted(() => {
  renderChart()

  // Set up resize observer
  if (chartContainer.value) {
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(chartContainer.value)
  }
})

// Re-render when data changes
watch(
  () => props.data,
  () => renderChart(),
  { deep: true }
)

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div ref="chartContainer" class="bar-chart-container" :style="{ height: `${height}px` }" />
</template>

<style scoped>
.bar-chart-container {
  width: 100%;
  position: relative;
}
</style>
