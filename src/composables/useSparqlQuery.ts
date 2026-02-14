import { ref, watch, type Ref } from 'vue'
import { useWikibaseStore } from '@/stores/wikibase'
import { SparqlClient, QueryBuilder } from '@/services/sparql'
import type { SparqlResults, ChartDataItem } from '@/types'

export interface QueryState<T> {
  data: Ref<T | null>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  refetch: () => Promise<void>
}

/**
 * Composable for executing SPARQL queries with reactive state
 */
export function useSparqlQuery<T>(
  queryFn: (builder: QueryBuilder) => string,
  transformFn: (results: SparqlResults) => T,
  options: { immediate?: boolean; enabled?: (configId: string) => boolean } = { immediate: true }
): QueryState<T> {
  const wikibaseStore = useWikibaseStore()

  const data = ref<T | null>(null) as Ref<T | null>
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isEnabled = () => options.enabled?.(wikibaseStore.activeConfig.id) ?? true

  async function fetchData() {
    if (!isEnabled()) {
      data.value = null
      error.value = null
      isLoading.value = false
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const client = new SparqlClient(wikibaseStore.activeConfig)
      const builder = new QueryBuilder(wikibaseStore.activeConfig)
      const query = queryFn(builder)
      const results = await client.query(query)
      data.value = transformFn(results)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error occurred'
      data.value = null
    } finally {
      isLoading.value = false
    }
  }

  // Refetch when active config changes
  watch(
    () => wikibaseStore.activeConfig.id,
    () => {
      if (options.immediate && isEnabled()) {
        fetchData()
      } else {
        data.value = null
        error.value = null
        isLoading.value = false
      }
    }
  )

  // Initial fetch
  if (options.immediate && isEnabled()) {
    fetchData()
  }

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  }
}

/**
 * Extract the local name from a URI
 */
export function extractLocalName(uri: string): string {
  const hashIndex = uri.lastIndexOf('#')
  const slashIndex = uri.lastIndexOf('/')
  const separator = hashIndex > slashIndex ? hashIndex : slashIndex
  return separator >= 0 ? uri.substring(separator + 1) : uri
}

/**
 * Transform datatype query results to chart data
 */
export function transformDatatypeResults(results: SparqlResults): ChartDataItem[] {
  return results.results.bindings.map((binding) => ({
    label: extractLocalName(binding.datatype?.value ?? 'Unknown'),
    value: parseInt(binding.count?.value ?? '0', 10),
    uri: binding.datatype?.value,
  }))
}

/**
 * Transform language query results to chart data
 */
export function transformLanguageResults(results: SparqlResults): ChartDataItem[] {
  return results.results.bindings.map((binding) => ({
    label: binding.language?.value ?? 'Unknown',
    value: parseInt(binding.count?.value ?? '0', 10),
  }))
}

/**
 * Transform property statement query results to chart data
 */
export function transformPropertyResults(results: SparqlResults): ChartDataItem[] {
  return results.results.bindings.map((binding) => ({
    label: binding.propertyLabel?.value ?? extractLocalName(binding.property?.value ?? ''),
    value: parseInt(binding.statementCount?.value ?? '0', 10),
    uri: binding.property?.value,
  }))
}

/**
 * Transform WikiProject query results to chart data
 */
export function transformWikiProjectResults(results: SparqlResults): ChartDataItem[] {
  return results.results.bindings.map((binding) => ({
    label: binding.wikprojectLabel?.value ?? extractLocalName(binding.wikiproject?.value ?? ''),
    value: parseInt(binding.count?.value ?? '0', 10),
    uri: binding.wikiproject?.value,
  }))
}

/**
 * Transform property class query results to chart data
 */
export function transformPropertyClassResults(results: SparqlResults): ChartDataItem[] {
  return results.results.bindings.map((binding) => ({
    label: binding.propertyLabel?.value ?? extractLocalName(binding.property?.value ?? ''),
    value: parseInt(binding.count?.value ?? '0', 10),
    uri: binding.property?.value,
  }))
}

/**
 * Transform Commons distinct rdf:type list
 */
export function transformCommonsDistinctTypes(results: SparqlResults): string[] {
  return results.results.bindings
    .map((binding) => binding.val?.value ?? '')
    .filter((value) => value.length > 0)
}

/**
 * Hook for datatype statistics
 */
export function useDatatypeStats() {
  return useSparqlQuery(
    (builder) => builder.buildDatatypeQuery(),
    transformDatatypeResults,
    { immediate: true, enabled: (configId) => configId !== 'commons' }
  )
}

/**
 * Hook for language statistics
 */
export function useLanguageStats(limit = 10) {
  return useSparqlQuery(
    (builder) => builder.buildLanguageQuery(limit),
    transformLanguageResults,
    { immediate: true, enabled: (configId) => configId !== 'commons' }
  )
}

/**
 * Hook for property statement statistics
 */
export function usePropertyStats(limit = 15) {
  return useSparqlQuery(
    (builder) => builder.buildPropertyStatementQuery(limit),
    transformPropertyResults,
    { immediate: true, enabled: (configId) => configId !== 'commons' }
  )
}

/**
 * Hook for WikiProject statistics
 */
export function useWikiProjectStats(limit = 20) {
  return useSparqlQuery(
    (builder) => builder.buildWikiProjectQuery(limit),
    transformWikiProjectResults,
    { immediate: true, enabled: (configId) => configId === 'wikidata' }
  )
}

/**
 * Hook for property class statistics
 */
export function usePropertyClassStats(limit = 20) {
  return useSparqlQuery(
    (builder) => builder.buildPropertyClassQuery(limit),
    transformPropertyClassResults,
    { immediate: true, enabled: (configId) => configId !== 'commons' }
  )
}

/**
 * Hook for Commons distinct rdf:type values
 */
export function useCommonsDistinctTypes(limit = 200) {
  return useSparqlQuery(
    (builder) => builder.buildCommonsDistinctTypesQuery(limit),
    transformCommonsDistinctTypes,
    { immediate: true, enabled: (configId) => configId === 'commons' }
  )
}
