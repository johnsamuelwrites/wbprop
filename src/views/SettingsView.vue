<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWikibaseStore } from '@/stores/wikibase'
import { useTheme } from 'vuetify'
import { createWikibaseConfig } from '@/types'
import { PRESET_CONFIGS } from '@/config/presets'
import { getQueryCache } from '@/services/cache'

const wikibaseStore = useWikibaseStore()
const theme = useTheme()

// Form state for adding custom instance
const showAddDialog = ref(false)
const newInstance = ref({
  id: '',
  name: '',
  sparqlEndpoint: '',
})

const isDarkTheme = computed({
  get: () => theme.global.current.value.dark,
  set: (value: boolean) => {
    theme.global.name.value = value ? 'dark' : 'light'
  },
})

function addCustomInstance() {
  if (!newInstance.value.id || !newInstance.value.name || !newInstance.value.sparqlEndpoint) {
    return
  }

  const config = createWikibaseConfig({
    id: newInstance.value.id,
    name: newInstance.value.name,
    sparqlEndpoint: newInstance.value.sparqlEndpoint,
  })

  wikibaseStore.addCustomConfig(config)
  showAddDialog.value = false
  newInstance.value = { id: '', name: '', sparqlEndpoint: '' }
}

function removeInstance(configId: string) {
  wikibaseStore.removeCustomConfig(configId)
}

function isPreset(configId: string): boolean {
  return PRESET_CONFIGS.some((c) => c.id === configId)
}

// Cache management
const cache = getQueryCache()
const cacheStats = ref(cache.getStats())
const cacheCleared = ref(false)

function clearCache() {
  cache.clear()
  cacheStats.value = cache.getStats()
  cacheCleared.value = true
  setTimeout(() => { cacheCleared.value = false }, 3000)
}

function refreshCacheStats() {
  cacheStats.value = cache.getStats()
}
</script>

<template>
  <div class="settings-view">
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold">Settings</h1>
        <p class="text-subtitle-1 text-medium-emphasis mt-1">
          Configure WBProp and manage Wikibase instances
        </p>
      </v-col>
    </v-row>

    <!-- Theme Settings -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon icon="mdi-palette" class="mr-2" />
            Appearance
          </v-card-title>
          <v-card-text>
            <v-switch
              v-model="isDarkTheme"
              label="Dark Theme"
              color="primary"
              hide-details
            />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-cached" class="mr-2" />
            Query Cache
            <v-spacer />
            <v-btn
              icon="mdi-refresh"
              variant="text"
              size="small"
              @click="refreshCacheStats"
            />
          </v-card-title>
          <v-card-text>
            <div class="d-flex align-center mb-3">
              <span class="text-medium-emphasis">
                {{ cacheStats.entries }} cached {{ cacheStats.entries === 1 ? 'query' : 'queries' }}
              </span>
              <v-chip size="x-small" variant="tonal" class="ml-2">
                TTL: {{ Math.round(cacheStats.ttlMs / 60000) }}min
              </v-chip>
            </div>
            <v-btn
              color="warning"
              variant="tonal"
              size="small"
              prepend-icon="mdi-delete-sweep"
              @click="clearCache"
            >
              Clear Cache
            </v-btn>
            <v-alert
              v-if="cacheCleared"
              type="success"
              variant="tonal"
              density="compact"
              class="mt-3"
            >
              Cache cleared successfully
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Wikibase Instances -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-database" class="mr-2" />
            Wikibase Instances
            <v-spacer />
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="showAddDialog = true"
            >
              Add Instance
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="config in wikibaseStore.allConfigs"
                :key="config.id"
                :title="config.name"
                :subtitle="config.sparqlEndpoint"
              >
                <template #prepend>
                  <v-avatar color="primary" size="40">
                    <span class="text-uppercase">{{ config.name.charAt(0) }}</span>
                  </v-avatar>
                </template>
                <template #append>
                  <v-chip
                    v-if="config.requiresAuthentication"
                    color="warning"
                    size="small"
                    class="mr-2"
                    prepend-icon="mdi-lock"
                  >
                    OAuth Required
                  </v-chip>
                  <v-chip
                    v-if="config.id === wikibaseStore.activeConfig.id"
                    color="success"
                    size="small"
                    class="mr-2"
                  >
                    Active
                  </v-chip>
                  <v-btn
                    v-if="config.id !== wikibaseStore.activeConfig.id"
                    variant="text"
                    color="primary"
                    size="small"
                    @click="wikibaseStore.setActiveConfig(config.id)"
                  >
                    Select
                  </v-btn>
                  <v-btn
                    v-if="!isPreset(config.id)"
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    size="small"
                    @click="removeInstance(config.id)"
                  />
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Add Instance Dialog -->
    <v-dialog v-model="showAddDialog" max-width="500">
      <v-card>
        <v-card-title>Add Custom Wikibase Instance</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newInstance.id"
            label="Instance ID"
            placeholder="e.g., my-wikibase"
            variant="outlined"
            density="compact"
            class="mb-3"
          />
          <v-text-field
            v-model="newInstance.name"
            label="Display Name"
            placeholder="e.g., My Wikibase"
            variant="outlined"
            density="compact"
            class="mb-3"
          />
          <v-text-field
            v-model="newInstance.sparqlEndpoint"
            label="SPARQL Endpoint URL"
            placeholder="e.g., https://my-wikibase.org/sparql"
            variant="outlined"
            density="compact"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showAddDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="addCustomInstance">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.settings-view {
  padding: 16px;
}
</style>
