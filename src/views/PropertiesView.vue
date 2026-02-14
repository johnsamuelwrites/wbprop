<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWikibaseStore } from '@/stores/wikibase'
import { SparqlClient, QueryBuilder } from '@/services/sparql'
import type { SparqlResults } from '@/types'

const wikibaseStore = useWikibaseStore()
const search = ref('')
const loading = ref(false)
const properties = ref<Array<{ id: string; label: string; datatype: string }>>([])
const page = ref(1)
const itemsPerPage = ref(25)

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Label', key: 'label', sortable: true },
  { title: 'Datatype', key: 'datatype', sortable: true },
]

async function loadProperties() {
  loading.value = true
  try {
    const client = new SparqlClient(wikibaseStore.activeConfig)
    const builder = new QueryBuilder(wikibaseStore.activeConfig)
    const offset = (page.value - 1) * itemsPerPage.value
    const query = builder.buildAllPropertiesQuery(itemsPerPage.value, offset)
    const results: SparqlResults = await client.query(query)

    properties.value = results.results.bindings.map((binding) => ({
      id: extractId(binding.property?.value ?? ''),
      label: binding.propertyLabel?.value ?? '',
      datatype: extractLocalName(binding.datatype?.value ?? ''),
    }))
  } catch (error) {
    console.error('Failed to load properties:', error)
  } finally {
    loading.value = false
  }
}

function extractId(uri: string): string {
  const match = uri.match(/[PQ]\d+$/)
  return match ? match[0] : uri
}

function extractLocalName(uri: string): string {
  const hashIndex = uri.lastIndexOf('#')
  const slashIndex = uri.lastIndexOf('/')
  const separator = hashIndex > slashIndex ? hashIndex : slashIndex
  return separator >= 0 ? uri.substring(separator + 1) : uri
}

const filteredProperties = computed(() => {
  if (!search.value) return properties.value
  const searchLower = search.value.toLowerCase()
  return properties.value.filter(
    (p) =>
      p.id.toLowerCase().includes(searchLower) ||
      p.label.toLowerCase().includes(searchLower)
  )
})

// Initial load
loadProperties()
</script>

<template>
  <div class="properties-view">
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold">Properties</h1>
        <p class="text-subtitle-1 text-medium-emphasis mt-1">
          Browse all properties in {{ wikibaseStore.activeConfig.name }}
        </p>
      </v-col>
    </v-row>

    <v-card>
      <v-card-title class="d-flex align-center">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search properties"
          single-line
          hide-details
          density="compact"
          variant="outlined"
          class="mr-4"
          style="max-width: 400px"
        />
        <v-spacer />
        <v-btn
          icon="mdi-refresh"
          variant="text"
          :loading="loading"
          @click="loadProperties"
        />
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="filteredProperties"
        :loading="loading"
        :items-per-page="itemsPerPage"
        class="elevation-0"
      >
        <template #item.id="{ item }">
          <v-chip size="small" color="primary" variant="tonal">
            {{ item.id }}
          </v-chip>
        </template>
        <template #item.datatype="{ item }">
          <v-chip size="small" variant="outlined">
            {{ item.datatype || 'Unknown' }}
          </v-chip>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<style scoped>
.properties-view {
  padding: 16px;
}
</style>
