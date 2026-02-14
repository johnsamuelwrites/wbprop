<script setup lang="ts">
import { ref } from 'vue'
import { useWikibaseStore } from '@/stores/wikibase'
import { SparqlClient, QueryBuilder } from '@/services/sparql'
import type { SparqlResults } from '@/types'

const wikibaseStore = useWikibaseStore()
const searchQuery = ref('')
const loading = ref(false)
const results = ref<Array<{ id: string; label: string; description: string }>>([])
const hasSearched = ref(false)

async function performSearch() {
  if (!searchQuery.value.trim()) return

  loading.value = true
  hasSearched.value = true

  try {
    const client = new SparqlClient(wikibaseStore.activeConfig)
    const builder = new QueryBuilder(wikibaseStore.activeConfig)
    const query = builder.buildPropertySearchQuery(searchQuery.value)
    const response: SparqlResults = await client.query(query)

    results.value = response.results.bindings.map((binding) => ({
      id: extractId(binding.property?.value ?? ''),
      label: binding.propertyLabel?.value ?? '',
      description: binding.propertyDescription?.value ?? '',
    }))
  } catch (error) {
    console.error('Search failed:', error)
    results.value = []
  } finally {
    loading.value = false
  }
}

function extractId(uri: string): string {
  const match = uri.match(/[PQ]\d+$/)
  return match ? match[0] : uri
}
</script>

<template>
  <div class="search-view">
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold">Search Properties</h1>
        <p class="text-subtitle-1 text-medium-emphasis mt-1">
          Find properties in {{ wikibaseStore.activeConfig.name }}
        </p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8" lg="6">
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          label="Search for properties"
          placeholder="e.g., instance of, date of birth"
          variant="outlined"
          clearable
          :loading="loading"
          @keyup.enter="performSearch"
        >
          <template #append>
            <v-btn
              color="primary"
              :loading="loading"
              @click="performSearch"
            >
              Search
            </v-btn>
          </template>
        </v-text-field>
      </v-col>
    </v-row>

    <v-row v-if="hasSearched">
      <v-col cols="12">
        <v-card v-if="results.length > 0">
          <v-list>
            <v-list-item
              v-for="result in results"
              :key="result.id"
              :title="result.label"
              :subtitle="result.description"
            >
              <template #prepend>
                <v-chip size="small" color="primary" variant="tonal" class="mr-3">
                  {{ result.id }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>

        <v-alert v-else type="info" variant="tonal">
          No properties found matching "{{ searchQuery }}".
        </v-alert>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.search-view {
  padding: 16px;
}
</style>
