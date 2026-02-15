<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ChartDataItem } from '@/types'

use([PieChart, TitleComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = withDefaults(
  defineProps<{
    data: ChartDataItem[]
    height?: number
    showLegend?: boolean
  }>(),
  {
    height: 350,
    showLegend: true,
  }
)

const emit = defineEmits<{
  (e: 'select', item: ChartDataItem): void
}>()

const option = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)',
    backgroundColor: 'rgba(45, 46, 69, 0.95)',
    borderColor: 'transparent',
    textStyle: { color: '#fff', fontSize: 12 },
  },
  legend: props.showLegend
    ? {
        type: 'scroll',
        orient: 'vertical',
        right: 10,
        top: 20,
        bottom: 20,
        textStyle: { color: '#9e9e9e', fontSize: 11 },
        pageTextStyle: { color: '#9e9e9e' },
      }
    : undefined,
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      center: props.showLegend ? ['35%', '50%'] : ['50%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 6,
        borderColor: '#28293D',
        borderWidth: 2,
      },
      label: {
        show: false,
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold',
          color: '#fff',
        },
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
      data: props.data.map((item) => ({
        name: item.label,
        value: item.value,
      })),
    },
  ],
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
