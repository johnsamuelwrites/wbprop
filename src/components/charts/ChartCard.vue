<script setup lang="ts">
import type { ChartDataItem } from '@/types'
import ExportMenu from './ExportMenu.vue'

defineProps<{
  title: string
  subtitle?: string
  icon?: string
  loading?: boolean
  error?: string | null
  exportData?: ChartDataItem[]
  exportFilename?: string
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()
</script>

<template>
  <v-card class="chart-card" height="100%">
    <v-card-title class="d-flex align-center">
      <v-icon v-if="icon" :icon="icon" class="mr-2" size="small" />
      {{ title }}
      <v-spacer />
      <ExportMenu
        v-if="exportData && exportData.length > 0 && exportFilename"
        :data="exportData"
        :filename="exportFilename"
      />
      <v-btn
        icon="mdi-refresh"
        variant="text"
        size="small"
        :loading="loading"
        @click="emit('refresh')"
      />
    </v-card-title>

    <v-card-subtitle v-if="subtitle">
      {{ subtitle }}
    </v-card-subtitle>

    <v-card-text class="chart-content">
      <!-- Skeleton Loading State -->
      <div v-if="loading" class="skeleton-container">
        <div class="skeleton-bars">
          <v-skeleton-loader type="text" class="mb-2" />
          <div class="d-flex align-end ga-1 skeleton-bar-group">
            <v-skeleton-loader
              v-for="i in 8"
              :key="i"
              type="image"
              class="skeleton-bar"
              :style="{ height: `${30 + Math.random() * 70}%` }"
            />
          </div>
          <v-skeleton-loader type="text" class="mt-2" />
        </div>
      </div>

      <!-- Error State -->
      <v-alert
        v-else-if="error"
        type="error"
        variant="tonal"
        class="ma-2"
      >
        {{ error }}
        <template #append>
          <v-btn
            variant="text"
            size="small"
            @click="emit('refresh')"
          >
            Retry
          </v-btn>
        </template>
      </v-alert>

      <!-- Chart Content -->
      <slot v-else />
    </v-card-text>
  </v-card>
</template>

<style scoped>
.chart-card {
  display: flex;
  flex-direction: column;
}

.chart-content {
  flex: 1;
  min-height: 200px;
}

.skeleton-container {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.skeleton-bars {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.skeleton-bar-group {
  flex: 1;
  align-items: flex-end;
}

.skeleton-bar {
  flex: 1;
  min-width: 0;
  border-radius: 4px 4px 0 0;
}
</style>
