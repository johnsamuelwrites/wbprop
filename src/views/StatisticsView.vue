<script setup lang="ts">
import { useWikibaseStore } from '@/stores/wikibase'

const wikibaseStore = useWikibaseStore()
</script>

<template>
  <div class="statistics-view">
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold">Statistics</h1>
        <p class="text-subtitle-1 text-medium-emphasis mt-1">
          Detailed statistics for {{ wikibaseStore.activeConfig.name }}
        </p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-alert type="info" variant="tonal">
          <v-alert-title>Coming Soon</v-alert-title>
          Advanced statistics and analytics features are under development.
          This will include trends over time, comparison tools, and detailed breakdowns.
        </v-alert>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.statistics-view {
  padding: 16px;
}
</style>
