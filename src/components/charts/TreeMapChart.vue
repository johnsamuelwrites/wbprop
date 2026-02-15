<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { TreemapChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ChartDataItem } from '@/types'

use([TreemapChart, TitleComponent, TooltipComponent, CanvasRenderer])

const props = withDefaults(
  defineProps<{
    data: ChartDataItem[]
    height?: number
  }>(),
  {
    height: 400,
  }
)

const emit = defineEmits<{
  (e: 'select', item: ChartDataItem): void
}>()

const option = computed(() => ({
  tooltip: {
    formatter: (info: { name: string; value: number }) => {
      return `<strong>${info.name}</strong><br/>Count: ${info.value.toLocaleString()}`
    },
    backgroundColor: 'rgba(45, 46, 69, 0.95)',
    borderColor: 'transparent',
    textStyle: { color: '#fff', fontSize: 12 },
  },
  series: [
    {
      type: 'treemap',
      data: props.data.map((item) => ({
        name: item.label,
        value: item.value,
      })),
      roam: false,
      nodeClick: 'link',
      breadcrumb: {
        show: true,
        itemStyle: {
          color: '#2D2E45',
          borderColor: '#424361',
          textStyle: { color: '#9e9e9e' },
        },
      },
      levels: [
        {
          itemStyle: {
            borderColor: '#28293D',
            borderWidth: 2,
            gapWidth: 2,
          },
          upperLabel: { show: false },
        },
        {
          itemStyle: {
            borderColor: '#424361',
            borderWidth: 1,
            gapWidth: 1,
          },
        },
      ],
      label: {
        show: true,
        formatter: '{b}',
        fontSize: 12,
        color: '#fff',
      },
      itemStyle: {
        borderRadius: 4,
      },
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
