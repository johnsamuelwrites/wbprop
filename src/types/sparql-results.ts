/**
 * Standard SPARQL JSON results format
 * https://www.w3.org/TR/sparql11-results-json/
 */
export interface SparqlResults {
  head: {
    vars: string[]
    link?: string[]
  }
  results: {
    bindings: SparqlBinding[]
  }
}

export interface SparqlBinding {
  [variable: string]: SparqlValue
}

export interface SparqlValue {
  type: 'uri' | 'literal' | 'bnode' | 'typed-literal'
  value: string
  'xml:lang'?: string
  datatype?: string
}

/**
 * Parsed chart data for visualizations
 */
export interface ChartDataItem {
  label: string
  value: number
  uri?: string
  color?: string
}

/**
 * Property data with details
 */
export interface PropertyData {
  id: string
  label: string
  description?: string
  datatype?: string
  statementCount?: number
  aliases?: string[]
}

/**
 * Language statistics
 */
export interface LanguageStats {
  language: string
  languageCode: string
  propertyCount: number
}

/**
 * Datatype statistics
 */
export interface DatatypeStats {
  datatype: string
  datatypeLabel: string
  count: number
}

/**
 * WikiProject statistics
 */
export interface WikiProjectStats {
  project: string
  projectLabel: string
  propertyCount: number
}

/**
 * Property class statistics
 */
export interface PropertyClassStats {
  propertyClass: string
  classLabel: string
  count: number
}
