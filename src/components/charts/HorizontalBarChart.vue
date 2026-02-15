<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ChartDataItem } from '@/types'

use([BarChart, TitleComponent, TooltipComponent, GridComponent, CanvasRenderer])

const props = withDefaults(
  defineProps<{
    data: ChartDataItem[]
    height?: number
    barColor?: string
  }>(),
  {
    height: 400,
    barColor: '#3170F3',
  }
)

const emit = defineEmits<{
  (e: 'select', item: ChartDataItem): void
}>()

const sortedData = computed(() =>
  [...props.data].sort((a, b) => a.value - b.value)
)

const option = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: (params: Array<{ name: string; value: number }>) => {
      const p = params[0]
      return `<strong>${p.name}</strong><br/>Count: ${p.value.toLocaleString()}`
    },
    backgroundColor: 'rgba(45, 46, 69, 0.95)',
    borderColor: 'transparent',
    textStyle: { color: '#fff', fontSize: 12 },
  },
  grid: {
    left: '3%',
    right: '8%',
    bottom: '3%',
    top: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'value',
    axisLabel: { color: '#9e9e9e', fontSize: 11 },
    axisLine: { lineStyle: { color: '#424242' } },
    splitLine: { lineStyle: { color: '#333' } },
  },
  yAxis: {
    type: 'category',
    data: sortedData.value.map((d) => d.label),
    axisLabel: {
      color: '#9e9e9e',
      fontSize: 11,
      width: 120,
      overflow: 'truncate',
    },
    axisLine: { lineStyle: { color: '#424242' } },
  },
  series: [
    {
      type: 'bar',
      data: sortedData.value.map((d) => d.value),
      itemStyle: {
        color: props.barColor,
        borderRadius: [0, 4, 4, 0],
      },
      emphasis: {
        itemStyle: {
          color: '#5090FF',
        },
      },
      animationDelay: (idx: number) => idx * 30,
    },
  ],
  animationEasing: 'elasticOut' as const,
}))

function handleClick(params: Record<string, unknown>) {
  const name = params.name as string
  const item = props.data.find((d) => d.label === name)
  if (item) {
    emit('select', item)
  }
}
</script>

<template>
  <v-chart
    :option="option"
    :style="{ height: `${height}px` }"
    autoresize
    @click="handleClick as any"
  />
</template>
