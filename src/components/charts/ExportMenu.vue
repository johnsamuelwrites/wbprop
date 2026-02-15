<script setup lang="ts">
import type { ChartDataItem } from '@/types'
import { exportToCsv } from '@/composables/useChartExport'

const props = defineProps<{
  data: ChartDataItem[]
  filename: string
}>()

function handleCsvExport() {
  exportToCsv(props.data, props.filename)
}
</script>

<template>
  <v-menu>
    <template #activator="{ props: menuProps }">
      <v-btn
        icon="mdi-download"
        variant="text"
        size="small"
        v-bind="menuProps"
      />
    </template>
    <v-list density="compact">
      <v-list-item
        prepend-icon="mdi-file-delimited"
        title="Export CSV"
        @click="handleCsvExport"
      />
    </v-list>
  </v-menu>
</template>
