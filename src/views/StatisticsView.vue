<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWikibaseStore } from '@/stores/wikibase'
import {
  useDatatypeStats,
  useLanguageStats,
  usePropertyStats,
  usePropertyClassStats,
} from '@/composables/useSparqlQuery'
import ChartCard from '@/components/charts/ChartCard.vue'
import BarChart from '@/components/charts/BarChart.vue'
import DonutChart from '@/components/charts/DonutChart.vue'
import TreeMapChart from '@/components/charts/TreeMapChart.vue'
import HorizontalBarChart from '@/components/charts/HorizontalBarChart.vue'
import type { ChartDataItem } from '@/types'

const wikibaseStore = useWikibaseStore()
const isCommons = computed(() => wikibaseStore.activeConfig.id === 'commons')

const datatypeStats = useDatatypeStats()
const languageStats = useLanguageStats(20)
const propertyStats = usePropertyStats(30)
const propertyClassStats = usePropertyClassStats(30)

// Chart type toggles
type ChartType = 'bar' | 'donut' | 'treemap' | 'horizontal'

const datatypeChartType = ref<ChartType>('donut')
const languageChartType = ref<ChartType>('horizontal')
const propertyChartType = ref<ChartType>('bar')
const classChartType = ref<ChartType>('treemap')

const chartTypeOptions: Array<{ value: ChartType; icon: string; label: string }> = [
  { value: 'bar', icon: 'mdi-chart-bar', label: 'Bar Chart' },
  { value: 'horizontal', icon: 'mdi-chart-bar-stacked', label: 'Horizontal Bar' },
  { value: 'donut', icon: 'mdi-chart-donut', label: 'Donut Chart' },
  { value: 'treemap', icon: 'mdi-chart-tree', label: 'Treemap' },
]

// Selected item for drill-down panel
const selectedItem = ref<ChartDataItem | null>(null)

function handleChartSelect(item: ChartDataItem) {
  selectedItem.value = item
}

function clearSelection() {
  selectedItem.value = null
}
</script>

<template>
  <div class="statistics-view">
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold">Statistics</h1>
        <p class="text-subtitle-1 text-medium-emphasis mt-1">
          Advanced visualizations for {{ wikibaseStore.activeConfig.name }} properties
        </p>
      </v-col>
    </v-row>

    <v-row v-if="isCommons" class="mb-2">
      <v-col cols="12">
        <v-alert type="info" variant="tonal">
          Statistics charts are not yet available for Wikimedia Commons.
          Use the Dashboard to explore Commons RDF types.
        </v-alert>
      </v-col>
    </v-row>

    <template v-else>
      <!-- Drill-down panel -->
      <v-row v-if="selectedItem">
        <v-col cols="12">
          <v-alert type="info" variant="tonal" closable @click:close="clearSelection">
            <div class="d-flex align-center">
              <div>
                <strong>Selected:</strong> {{ selectedItem.label }}
                &mdash; Count: {{ selectedItem.value.toLocaleString() }}
                <span v-if="selectedItem.uri" class="text-medium-emphasis ml-2">
                  ({{ selectedItem.uri }})
                </span>
              </div>
            </div>
          </v-alert>
        </v-col>
      </v-row>

      <!-- Datatypes - Donut -->
      <v-row>
        <v-col cols="12" md="6">
          <ChartCard
            title="Datatypes Distribution"
            subtitle="Properties grouped by datatype"
            icon="mdi-code-tags"
            :loading="datatypeStats.isLoading.value"
            :error="datatypeStats.error.value"
            :export-data="datatypeStats.data.value ?? undefined"
            export-filename="datatypes"
            @refresh="datatypeStats.refetch"
          >
            <template #default>
              <div class="d-flex justify-end mb-2">
                <v-btn-toggle v-model="datatypeChartType" density="compact" mandatory>
                  <v-btn
                    v-for="opt in chartTypeOptions"
                    :key="opt.value"
                    :value="opt.value"
                    :icon="opt.icon"
                    size="small"
                  />
                </v-btn-toggle>
              </div>

              <BarChart
                v-if="datatypeChartType === 'bar' && datatypeStats.data.value"
                :data="datatypeStats.data.value"
                :height="350"
              />
              <DonutChart
                v-else-if="datatypeChartType === 'donut' && datatypeStats.data.value"
                :data="datatypeStats.data.value"
                :height="350"
                @select="handleChartSelect"
              />
              <TreeMapChart
                v-else-if="datatypeChartType === 'treemap' && datatypeStats.data.value"
                :data="datatypeStats.data.value"
                :height="350"
                @select="handleChartSelect"
              />
              <HorizontalBarChart
                v-else-if="datatypeChartType === 'horizontal' && datatypeStats.data.value"
                :data="datatypeStats.data.value"
                :height="350"
                @select="handleChartSelect"
              />
            </template>
          </ChartCard>
        </v-col>

        <!-- Languages - Horizontal Bar -->
        <v-col cols="12" md="6">
          <ChartCard
            title="Language Coverage"
            subtitle="Top 20 languages by property label count"
            icon="mdi-translate"
            :loading="languageStats.isLoading.value"
            :error="languageStats.error.value"
            :export-data="languageStats.data.value ?? undefined"
            export-filename="languages"
            @refresh="languageStats.refetch"
          >
            <template #default>
              <div class="d-flex justify-end mb-2">
                <v-btn-toggle v-model="languageChartType" density="compact" mandatory>
                  <v-btn
                    v-for="opt in chartTypeOptions"
                    :key="opt.value"
                    :value="opt.value"
                    :icon="opt.icon"
                    size="small"
                  />
                </v-btn-toggle>
              </div>

              <BarChart
                v-if="languageChartType === 'bar' && languageStats.data.value"
                :data="languageStats.data.value"
                :height="350"
                bar-color="#4CAF50"
              />
              <DonutChart
                v-else-if="languageChartType === 'donut' && languageStats.data.value"
                :data="languageStats.data.value"
                :height="350"
                @select="handleChartSelect"
              />
              <TreeMapChart
                v-else-if="languageChartType === 'treemap' && languageStats.data.value"
                :data="languageStats.data.value"
                :height="350"
                @select="handleChartSelect"
              />
              <HorizontalBarChart
                v-else-if="languageChartType === 'horizontal' && languageStats.data.value"
                :data="languageStats.data.value"
                :height="350"
                bar-color="#4CAF50"
                @select="handleChartSelect"
              />
            </template>
          </ChartCard>
        </v-col>
      </v-row>

      <!-- Properties - Bar Chart -->
      <v-row>
        <v-col cols="12" md="6">
          <ChartCard
            title="Top Properties"
            subtitle="Top 30 properties by statement count"
            icon="mdi-format-list-bulleted"
            :loading="propertyStats.isLoading.value"
            :error="propertyStats.error.value"
            :export-data="propertyStats.data.value ?? undefined"
            export-filename="properties"
            @refresh="propertyStats.refetch"
          >
            <template #default>
              <div class="d-flex justify-end mb-2">
                <v-btn-toggle v-model="propertyChartType" density="compact" mandatory>
                  <v-btn
                    v-for="opt in chartTypeOptions"
                    :key="opt.value"
                    :value="opt.value"
                    :icon="opt.icon"
                    size="small"
                  />
                </v-btn-toggle>
              </div>

              <BarChart
                v-if="propertyChartType === 'bar' && propertyStats.data.value"
                :data="propertyStats.data.value"
                :height="400"
                bar-color="#FF9800"
              />
              <DonutChart
                v-else-if="propertyChartType === 'donut' && propertyStats.data.value"
                :data="propertyStats.data.value"
                :height="400"
                @select="handleChartSelect"
              />
              <TreeMapChart
                v-else-if="propertyChartType === 'treemap' && propertyStats.data.value"
                :data="propertyStats.data.value"
                :height="400"
                @select="handleChartSelect"
              />
              <HorizontalBarChart
                v-else-if="propertyChartType === 'horizontal' && propertyStats.data.value"
                :data="propertyStats.data.value"
                :height="400"
                bar-color="#FF9800"
                @select="handleChartSelect"
              />
            </template>
          </ChartCard>
        </v-col>

        <!-- Property Classes - Treemap -->
        <v-col cols="12" md="6">
          <ChartCard
            title="Property Classes"
            subtitle="Top 30 property classes by usage"
            icon="mdi-shape"
            :loading="propertyClassStats.isLoading.value"
            :error="propertyClassStats.error.value"
            :export-data="propertyClassStats.data.value ?? undefined"
            export-filename="property-classes"
            @refresh="propertyClassStats.refetch"
          >
            <template #default>
              <div class="d-flex justify-end mb-2">
                <v-btn-toggle v-model="classChartType" density="compact" mandatory>
                  <v-btn
                    v-for="opt in chartTypeOptions"
                    :key="opt.value"
                    :value="opt.value"
                    :icon="opt.icon"
                    size="small"
                  />
                </v-btn-toggle>
              </div>

              <BarChart
                v-if="classChartType === 'bar' && propertyClassStats.data.value"
                :data="propertyClassStats.data.value"
                :height="400"
                bar-color="#9C27B0"
              />
              <DonutChart
                v-else-if="classChartType === 'donut' && propertyClassStats.data.value"
                :data="propertyClassStats.data.value"
                :height="400"
                @select="handleChartSelect"
              />
              <TreeMapChart
                v-else-if="classChartType === 'treemap' && propertyClassStats.data.value"
                :data="propertyClassStats.data.value"
                :height="400"
                @select="handleChartSelect"
              />
              <HorizontalBarChart
                v-else-if="classChartType === 'horizontal' && propertyClassStats.data.value"
                :data="propertyClassStats.data.value"
                :height="400"
                bar-color="#9C27B0"
                @select="handleChartSelect"
              />
            </template>
          </ChartCard>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<style scoped>
.statistics-view {
  padding: 16px;
}
</style>
