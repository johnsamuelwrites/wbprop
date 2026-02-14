import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { WikibaseConfig } from '@/types'
import { PRESET_CONFIGS, WIKIDATA_CONFIG } from '@/config/presets'

const STORAGE_KEY_ACTIVE = 'wbprop-active-instance'
const STORAGE_KEY_CUSTOM = 'wbprop-custom-configs'

export const useWikibaseStore = defineStore('wikibase', () => {
  // State
  const activeConfigId = ref<string>(loadActiveConfigId())
  const customConfigs = ref<WikibaseConfig[]>(loadCustomConfigs())
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const allConfigs = computed<WikibaseConfig[]>(() => [
    ...PRESET_CONFIGS,
    ...customConfigs.value,
  ])

  const activeConfig = computed<WikibaseConfig>(() => {
    const config = allConfigs.value.find((c) => c.id === activeConfigId.value)
    return config ?? WIKIDATA_CONFIG
  })

  const sparqlEndpoint = computed(() => activeConfig.value.sparqlEndpoint)

  // Actions
  function setActiveConfig(configId: string) {
    const config = allConfigs.value.find((c) => c.id === configId)
    if (config) {
      activeConfigId.value = configId
      localStorage.setItem(STORAGE_KEY_ACTIVE, configId)
    }
  }

  function addCustomConfig(config: WikibaseConfig) {
    // Ensure unique ID
    const existingIndex = customConfigs.value.findIndex((c) => c.id === config.id)
    if (existingIndex >= 0) {
      customConfigs.value[existingIndex] = config
    } else {
      customConfigs.value.push(config)
    }
    saveCustomConfigs()
  }

  function removeCustomConfig(configId: string) {
    const index = customConfigs.value.findIndex((c) => c.id === configId)
    if (index >= 0) {
      customConfigs.value.splice(index, 1)
      saveCustomConfigs()

      // If this was the active config, switch to Wikidata
      if (activeConfigId.value === configId) {
        setActiveConfig('wikidata')
      }
    }
  }

  function saveCustomConfigs() {
    localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(customConfigs.value))
  }

  // Initialize from URL parameters if present
  function initFromUrl() {
    const urlParams = new URLSearchParams(window.location.search)
    const instanceParam = urlParams.get('instance')
    if (instanceParam) {
      const config = allConfigs.value.find((c) => c.id === instanceParam)
      if (config) {
        setActiveConfig(instanceParam)
      }
    }
  }

  // Load helpers
  function loadActiveConfigId(): string {
    return localStorage.getItem(STORAGE_KEY_ACTIVE) ?? 'wikidata'
  }

  function loadCustomConfigs(): WikibaseConfig[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOM)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  // Initialize
  initFromUrl()

  return {
    // State
    activeConfigId,
    customConfigs,
    isLoading,
    error,

    // Getters
    allConfigs,
    activeConfig,
    sparqlEndpoint,

    // Actions
    setActiveConfig,
    addCustomConfig,
    removeCustomConfig,
    initFromUrl,
  }
})
