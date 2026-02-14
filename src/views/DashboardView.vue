<script setup lang="ts">
import { computed } from 'vue'
import { useWikibaseStore } from '@/stores/wikibase'
import {
  useDatatypeStats,
  useLanguageStats,
  usePropertyStats,
  useWikiProjectStats,
  usePropertyClassStats,
} from '@/composables/useSparqlQuery'
import ChartCard from '@/components/charts/ChartCard.vue'
import BarChart from '@/components/charts/BarChart.vue'

const wikibaseStore = useWikibaseStore()

const datatypeStats = useDatatypeStats()
const languageStats = useLanguageStats()
const propertyStats = usePropertyStats()
const wikiProjectStats = useWikiProjectStats()
const propertyClassStats = usePropertyClassStats()

const isWikidata = computed(() => wikibaseStore.activeConfig.id === 'wikidata')
</script>

<template>
  <div class="dashboard">
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold">
          {{ wikibaseStore.activeConfig.name }} Properties Dashboard
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis mt-1">
          Explore and visualize properties across the Wikibase instance
        </p>
      </v-col>
    </v-row>

    <v-row>
      <!-- Languages Chart -->
      <v-col cols="12" md="6" lg="4">
        <ChartCard
          title="Languages"
          subtitle="Property labels by language"
          icon="mdi-translate"
          :loading="languageStats.isLoading.value"
          :error="languageStats.error.value"
          @refresh="languageStats.refetch"
        >
          <BarChart
            v-if="languageStats.data.value"
            :data="languageStats.data.value"
            :height="300"
          />
        </ChartCard>
      </v-col>

      <!-- Datatypes Chart -->
      <v-col cols="12" md="6" lg="4">
        <ChartCard
          title="Datatypes"
          subtitle="Properties by datatype"
          icon="mdi-code-tags"
          :loading="datatypeStats.isLoading.value"
          :error="datatypeStats.error.value"
          @refresh="datatypeStats.refetch"
        >
          <BarChart
            v-if="datatypeStats.data.value"
            :data="datatypeStats.data.value"
            :height="300"
          />
        </ChartCard>
      </v-col>

      <!-- Properties Chart -->
      <v-col cols="12" md="6" lg="4">
        <ChartCard
          title="Properties"
          subtitle="Top properties by statement count"
          icon="mdi-format-list-bulleted"
          :loading="propertyStats.isLoading.value"
          :error="propertyStats.error.value"
          @refresh="propertyStats.refetch"
        >
          <BarChart
            v-if="propertyStats.data.value"
            :data="propertyStats.data.value"
            :height="300"
          />
        </ChartCard>
      </v-col>

      <!-- WikiProjects Chart (Wikidata only) -->
      <v-col v-if="isWikidata" cols="12" md="6">
        <ChartCard
          title="WikiProjects"
          subtitle="Properties by WikiProject scope"
          icon="mdi-account-group"
          :loading="wikiProjectStats.isLoading.value"
          :error="wikiProjectStats.error.value"
          @refresh="wikiProjectStats.refetch"
        >
          <BarChart
            v-if="wikiProjectStats.data.value"
            :data="wikiProjectStats.data.value"
            :height="350"
          />
        </ChartCard>
      </v-col>

      <!-- Property Classes Chart -->
      <v-col cols="12" :md="isWikidata ? 6 : 12">
        <ChartCard
          title="Property Classes"
          subtitle="Properties by class/type"
          icon="mdi-shape"
          :loading="propertyClassStats.isLoading.value"
          :error="propertyClassStats.error.value"
          @refresh="propertyClassStats.refetch"
        >
          <BarChart
            v-if="propertyClassStats.data.value"
            :data="propertyClassStats.data.value"
            :height="350"
          />
        </ChartCard>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 16px;
}
</style>
