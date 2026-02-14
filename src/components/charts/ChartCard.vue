<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  icon?: string
  loading?: boolean
  error?: string | null
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
      <!-- Loading State -->
      <div v-if="loading" class="d-flex align-center justify-center" style="height: 200px">
        <v-progress-circular indeterminate color="primary" />
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
</style>
