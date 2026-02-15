import type { WikibaseConfig } from '@/types'

/**
 * Wikidata - The main Wikimedia knowledge base
 */
export const WIKIDATA_CONFIG: WikibaseConfig = {
  id: 'wikidata',
  name: 'Wikidata',
  sparqlEndpoint: 'https://query.wikidata.org/sparql',
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
  rateLimit: {
    requestsPerMinute: 60,
    concurrent: 5,
  },
  theme: {
    primary: '#006699',
    secondary: '#339966',
  },
}

/**
 * FactGrid - Historical research database
 */
export const FACTGRID_CONFIG: WikibaseConfig = {
  id: 'factgrid',
  name: 'FactGrid',
  sparqlEndpoint: 'https://database.factgrid.de/sparql',
  entityPrefix: 'https://database.factgrid.de/entity/',
  propertyPrefix: 'P',
  wikibaseOntology: 'http://wikiba.se/ontology#',
  labelService: true,
  supportedFeatures: {
    statements: true,
    sitelinks: false,
    qualifiers: true,
    references: true,
  },
  rateLimit: {
    requestsPerMinute: 30,
    concurrent: 3,
  },
  theme: {
    primary: '#8B4513',
    secondary: '#D2691E',
  },
}

/**
 * Wikimedia Commons structured data
 * Uses cookie-based OAuth: wcqsOauth (long-lived) and wcqsSession (JWT, auto-refreshed via 307)
 */
export const COMMONS_CONFIG: WikibaseConfig = {
  id: 'commons',
  name: 'Wikimedia Commons',
  sparqlEndpoint: 'https://commons-query.wikimedia.org/sparql',
  entityPrefix: 'https://commons.wikimedia.org/entity/',
  propertyPrefix: 'P',
  wikibaseOntology: 'http://wikiba.se/ontology#',
  labelService: true,
  supportedFeatures: {
    statements: true,
    sitelinks: false,
    qualifiers: true,
    references: true,
  },
  customPrefixes: {
    wd: 'https://commons.wikimedia.org/entity/',
    wdt: 'https://commons.wikimedia.org/prop/direct/',
  },
  rateLimit: {
    requestsPerMinute: 60,
    concurrent: 5,
  },
  // Commons uses cookie-based OAuth - browser will include cookies automatically
  requiresAuthentication: true,
  cookieBasedAuth: true,
  authUrl: 'https://commons-query.wikimedia.org/',
  availabilityNote: 'Wikimedia Commons Query Service requires login. Click "Login" to authenticate with your Wikimedia account.',
  theme: {
    primary: '#006699',
    secondary: '#339966',
  },
}

/**
 * Rhizome - Digital preservation Wikibase
 */
export const RHIZOME_CONFIG: WikibaseConfig = {
  id: 'rhizome',
  name: 'Rhizome',
  sparqlEndpoint: 'https://query.artbase.rhizome.org/proxy/wdqs/bigdata/namespace/wdq/sparql',
  entityPrefix: 'https://artbase.rhizome.org/entity/',
  propertyPrefix: 'P',
  wikibaseOntology: 'http://wikiba.se/ontology#',
  labelService: true,
  supportedFeatures: {
    statements: true,
    sitelinks: false,
    qualifiers: true,
    references: true,
  },
  rateLimit: {
    requestsPerMinute: 30,
    concurrent: 2,
  },
}

/**
 * John Samuel - Personal Wikibase Cloud instance
 */
export const JOHNSAMUEL_CONFIG: WikibaseConfig = {
  id: 'johnsamuel',
  name: 'John Samuel',
  sparqlEndpoint: 'https://jsamwrites.wikibase.cloud/query/sparql',
  entityPrefix: 'https://jsamwrites.wikibase.cloud/entity/',
  propertyPrefix: 'P',
  wikibaseOntology: 'http://wikiba.se/ontology#',
  labelService: true,
  supportedFeatures: {
    statements: true,
    sitelinks: false,
    qualifiers: true,
    references: true,
  },
  rateLimit: {
    requestsPerMinute: 30,
    concurrent: 3,
  },
}

/**
 * All preset configurations
 */
export const PRESET_CONFIGS: WikibaseConfig[] = [
  WIKIDATA_CONFIG,
  FACTGRID_CONFIG,
  COMMONS_CONFIG,
  RHIZOME_CONFIG,
  JOHNSAMUEL_CONFIG,
]

/**
 * Get a preset configuration by ID
 */
export function getPresetConfig(id: string): WikibaseConfig | undefined {
  return PRESET_CONFIGS.find((config) => config.id === id)
}
