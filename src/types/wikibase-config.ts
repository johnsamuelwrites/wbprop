/**
 * Configuration for a Wikibase instance
 */
export interface WikibaseConfig {
  /** Unique identifier for this configuration */
  id: string

  /** Display name (e.g., "Wikidata", "FactGrid") */
  name: string

  /** SPARQL endpoint URL */
  sparqlEndpoint: string

  /** Entity URI prefix (e.g., "http://www.wikidata.org/entity/") */
  entityPrefix: string

  /** Property prefix (e.g., "P" for Wikidata properties like P31) */
  propertyPrefix: string

  /** Wikibase ontology namespace */
  wikibaseOntology: string

  /** Whether the wikibase:label service is available */
  labelService: boolean

  /** Supported features for this instance */
  supportedFeatures: WikibaseFeatures

  /** Custom SPARQL prefixes for this instance */
  customPrefixes?: Record<string, string>

  /** Rate limiting configuration */
  rateLimit?: RateLimitConfig

  /** Theme customization for this instance */
  theme?: WikibaseTheme
}

export interface WikibaseFeatures {
  /** Support for wikibase:statements predicate */
  statements: boolean

  /** Sitelinks available */
  sitelinks: boolean

  /** Qualifier support */
  qualifiers: boolean

  /** Reference support */
  references: boolean
}

export interface RateLimitConfig {
  /** Maximum requests per minute */
  requestsPerMinute: number

  /** Maximum concurrent requests */
  concurrent: number
}

export interface WikibaseTheme {
  /** Primary color for this instance */
  primary: string

  /** Secondary color */
  secondary: string
}

/**
 * Create a minimal WikibaseConfig with defaults
 */
export function createWikibaseConfig(
  partial: Partial<WikibaseConfig> & Pick<WikibaseConfig, 'id' | 'name' | 'sparqlEndpoint'>
): WikibaseConfig {
  return {
    entityPrefix: 'http://www.wikidata.org/entity/',
    propertyPrefix: 'P',
    wikibaseOntology: 'http://wikiba.se/ontology#',
    labelService: true,
    supportedFeatures: {
      statements: true,
      sitelinks: true,
      qualifiers: true,
      references: true,
    },
    ...partial,
  }
}
