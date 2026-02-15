<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useWikibaseStore } from '@/stores/wikibase'
import { SparqlClient, QueryBuilder } from '@/services/sparql'
import type { SparqlResults } from '@/types'

interface SearchResult {
  id: string
  label: string
  description: string
  uri: string
}

const wikibaseStore = useWikibaseStore()
const searchQuery = ref('')
const loading = ref(false)
const results = ref<SearchResult[]>([])
const suggestions = ref<SearchResult[]>([])
const suggestionsLoading = ref(false)
const hasSearched = ref(false)
const searchError = ref<string | null>(null)

// Debounced autocomplete
let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(searchQuery, (newVal) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (!newVal || newVal.trim().length < 2) {
    suggestions.value = []
    return
  }
  debounceTimer = setTimeout(() => fetchSuggestions(newVal.trim()), 300)
})

async function fetchSuggestions(term: string) {
  suggestionsLoading.value = true
  try {
    const client = new SparqlClient(wikibaseStore.activeConfig)
    const builder = new QueryBuilder(wikibaseStore.activeConfig)
    const query = builder.buildPropertySearchQuery(term, 8)
    const response: SparqlResults = await client.query(query)

    suggestions.value = response.results.bindings.map((binding) => ({
      id: extractId(binding.property?.value ?? ''),
      label: binding.propertyLabel?.value ?? '',
      description: binding.propertyDescription?.value ?? '',
      uri: binding.property?.value ?? '',
    }))
  } catch {
    suggestions.value = []
  } finally {
    suggestionsLoading.value = false
  }
}

async function performSearch() {
  if (!searchQuery.value.trim()) return

  loading.value = true
  hasSearched.value = true
  searchError.value = null
  suggestions.value = []

  try {
    const client = new SparqlClient(wikibaseStore.activeConfig)
    const builder = new QueryBuilder(wikibaseStore.activeConfig)
    const query = builder.buildPropertySearchQuery(searchQuery.value, 50)
    const response: SparqlResults = await client.query(query)

    results.value = response.results.bindings.map((binding) => ({
      id: extractId(binding.property?.value ?? ''),
      label: binding.propertyLabel?.value ?? '',
      description: binding.propertyDescription?.value ?? '',
      uri: binding.property?.value ?? '',
    }))
  } catch (error) {
    searchError.value = error instanceof Error ? error.message : 'Search failed'
    results.value = []
  } finally {
    loading.value = false
  }
}

function selectSuggestion(suggestion: SearchResult) {
  searchQuery.value = suggestion.label
  suggestions.value = []
  performSearch()
}

function extractId(uri: string): string {
  const match = uri.match(/[PQ]\d+$/)
  return match ? match[0] : uri
}

function openEntityPage(result: SearchResult) {
  if (result.uri) {
    window.open(result.uri, '_blank')
  }
}

const resultCount = computed(() => results.value.length)
const showSuggestions = computed(() =>
  suggestions.value.length > 0 && searchQuery.value.trim().length >= 2
)
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
        <div class="search-container">
          <v-text-field
            v-model="searchQuery"
            prepend-inner-icon="mdi-magnify"
            label="Search for properties"
            placeholder="e.g., instance of, date of birth"
            variant="outlined"
            clearable
            :loading="loading || suggestionsLoading"
            autocomplete="off"
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

          <!-- Autocomplete suggestions dropdown -->
          <v-card
            v-if="showSuggestions"
            class="suggestions-dropdown"
            elevation="8"
          >
            <v-list density="compact">
              <v-list-item
                v-for="suggestion in suggestions"
                :key="suggestion.id"
                @click="selectSuggestion(suggestion)"
              >
                <template #prepend>
                  <v-chip size="x-small" color="primary" variant="tonal" class="mr-2">
                    {{ suggestion.id }}
                  </v-chip>
                </template>
                <v-list-item-title>{{ suggestion.label }}</v-list-item-title>
                <v-list-item-subtitle v-if="suggestion.description">
                  {{ suggestion.description }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card>
        </div>
      </v-col>
    </v-row>

    <!-- Error State -->
    <v-row v-if="searchError">
      <v-col cols="12">
        <v-alert type="error" variant="tonal" closable @click:close="searchError = null">
          {{ searchError }}
        </v-alert>
      </v-col>
    </v-row>

    <!-- Results -->
    <v-row v-if="hasSearched && !searchError">
      <v-col cols="12">
        <div v-if="loading" class="d-flex flex-column ga-3">
          <v-skeleton-loader
            v-for="i in 5"
            :key="i"
            type="list-item-two-line"
          />
        </div>

        <template v-else>
          <div v-if="resultCount > 0" class="mb-3">
            <v-chip size="small" color="primary" variant="tonal">
              {{ resultCount }} {{ resultCount === 1 ? 'result' : 'results' }}
            </v-chip>
          </div>

          <v-card v-if="resultCount > 0">
            <v-list>
              <v-list-item
                v-for="result in results"
                :key="result.id"
                :title="result.label"
                :subtitle="result.description"
                @click="openEntityPage(result)"
              >
                <template #prepend>
                  <v-chip size="small" color="primary" variant="tonal" class="mr-3">
                    {{ result.id }}
                  </v-chip>
                </template>
                <template #append>
                  <v-icon size="small" color="medium-emphasis">mdi-open-in-new</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-card>

          <v-alert v-else type="info" variant="tonal">
            No properties found matching "{{ searchQuery }}".
          </v-alert>
        </template>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.search-view {
  padding: 16px;
}

.search-container {
  position: relative;
}

.suggestions-dropdown {
  position: absolute;
  top: 56px;
  left: 0;
  right: 80px;
  z-index: 100;
  max-height: 320px;
  overflow-y: auto;
}
</style>
