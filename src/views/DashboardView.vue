<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWikibaseStore } from '@/stores/wikibase'
import {
  useDatatypeStats,
  useLanguageStats,
  usePropertyStats,
  useWikiProjectStats,
  usePropertyClassStats,
  useCommonsDistinctTypes,
} from '@/composables/useSparqlQuery'
import ChartCard from '@/components/charts/ChartCard.vue'
import BarChart from '@/components/charts/BarChart.vue'

const wikibaseStore = useWikibaseStore()

const datatypeStats = useDatatypeStats()
const languageStats = useLanguageStats()
const propertyStats = usePropertyStats()
const wikiProjectStats = useWikiProjectStats()
const propertyClassStats = usePropertyClassStats()
const commonsDistinctTypes = useCommonsDistinctTypes()
const commonsTypeSearch = ref('')

const isWikidata = computed(() => wikibaseStore.activeConfig.id === 'wikidata')
const isCommons = computed(() => wikibaseStore.activeConfig.id === 'commons')
const availabilityNote = computed(() => wikibaseStore.activeConfig.availabilityNote)
const requiresAuth = computed(() => wikibaseStore.activeConfig.requiresAuthentication)
const authUrl = computed(() => wikibaseStore.activeConfig.authUrl)
const cookieBasedAuth = computed(() => wikibaseStore.activeConfig.cookieBasedAuth)
const commonsFilteredTypes = computed(() => {
  const values = commonsDistinctTypes.data.value ?? []
  const query = commonsTypeSearch.value.trim().toLowerCase()
  if (!query) {
    return values
  }
  return values.filter((value) => value.toLowerCase().includes(query))
})

function openAuthPage() {
  if (authUrl.value) {
    window.open(authUrl.value, '_blank')
  }
}
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

    <v-row v-if="requiresAuth && cookieBasedAuth" class="mb-2">
      <v-col cols="12">
        <v-alert type="info" variant="tonal">
          <div class="d-flex align-center">
            <div class="flex-grow-1">
              <strong>{{ wikibaseStore.activeConfig.name }}</strong> requires authentication.
              Login with your Wikimedia account to access the SPARQL endpoint.
              After logging in, refresh this page.
            </div>
            <v-btn
              v-if="authUrl"
              color="primary"
              variant="flat"
              class="ml-4"
              prepend-icon="mdi-login"
              @click="openAuthPage"
            >
              Login
            </v-btn>
          </div>
        </v-alert>
      </v-col>
    </v-row>

    <v-row v-else-if="availabilityNote" class="mb-2">
      <v-col cols="12">
        <v-alert type="warning" variant="tonal">
          {{ availabilityNote }}
        </v-alert>
      </v-col>
    </v-row>

    <v-row v-if="isCommons">
      <v-col cols="12">
        <v-card class="types-card">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-format-list-bulleted-type" class="mr-2" size="small" />
            Distinct RDF Types
            <v-chip
              size="small"
              color="primary"
              variant="tonal"
              class="ml-3"
            >
              {{ commonsFilteredTypes.length }} / {{ commonsDistinctTypes.data.value?.length ?? 0 }}
            </v-chip>
            <v-spacer />
            <v-btn
              icon="mdi-refresh"
              variant="text"
              size="small"
              :loading="commonsDistinctTypes.isLoading.value"
              @click="commonsDistinctTypes.refetch"
            />
          </v-card-title>

          <v-card-subtitle>
            SELECT DISTINCT ?val WHERE { ?item rdf:type ?val. }
          </v-card-subtitle>

          <v-card-text>
            <v-text-field
              v-model="commonsTypeSearch"
              label="Filter types"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              class="mb-3"
            />

            <div v-if="commonsDistinctTypes.isLoading.value" class="d-flex justify-center py-10">
              <v-progress-circular indeterminate color="primary" />
            </div>

            <v-alert
              v-else-if="commonsDistinctTypes.error.value"
              type="error"
              variant="tonal"
              class="mb-2"
            >
              {{ commonsDistinctTypes.error.value }}
            </v-alert>

            <div v-else class="types-scroll">
              <v-list density="compact" lines="one">
                <v-list-item
                  v-for="(typeValue, index) in commonsFilteredTypes"
                  :key="typeValue"
                  :title="typeValue"
                >
                  <template #prepend>
                    <v-chip size="x-small" variant="outlined" class="mr-3">
                      {{ index + 1 }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-else>
      <!-- Languages Chart -->
      <v-col cols="12" md="6" lg="4">
        <ChartCard
          title="Languages"
          subtitle="Property labels by language"
          icon="mdi-translate"
          :loading="languageStats.isLoading.value"
          :error="languageStats.error.value"
          :export-data="languageStats.data.value ?? undefined"
          export-filename="languages"
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
          :export-data="datatypeStats.data.value ?? undefined"
          export-filename="datatypes"
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
          :export-data="propertyStats.data.value ?? undefined"
          export-filename="properties"
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
          :export-data="wikiProjectStats.data.value ?? undefined"
          export-filename="wikiprojects"
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
          :export-data="propertyClassStats.data.value ?? undefined"
          export-filename="property-classes"
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

.types-card {
  height: 100%;
}

.types-scroll {
  max-height: 540px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
}
</style>
