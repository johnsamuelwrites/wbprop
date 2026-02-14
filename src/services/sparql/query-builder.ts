import type { WikibaseConfig } from '@/types'

/**
 * Builds parameterized SPARQL queries for different Wikibase instances
 */
export class QueryBuilder {
  constructor(private config: WikibaseConfig) {}

  /**
   * Generate standard prefixes for this Wikibase instance
   */
  private getPrefixes(): string {
    const prefixes = [
      `PREFIX wikibase: <${this.config.wikibaseOntology}>`,
      `PREFIX entity: <${this.config.entityPrefix}>`,
      'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>',
      'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>',
      'PREFIX schema: <http://schema.org/>',
      'PREFIX bd: <http://www.bigdata.com/rdf#>',
    ]

    // Add custom prefixes if defined
    if (this.config.customPrefixes) {
      for (const [prefix, uri] of Object.entries(this.config.customPrefixes)) {
        prefixes.push(`PREFIX ${prefix}: <${uri}>`)
      }
    }

    // Add Wikidata-specific prefixes if this is Wikidata
    if (this.config.id === 'wikidata') {
      prefixes.push('PREFIX wdt: <http://www.wikidata.org/prop/direct/>')
      prefixes.push('PREFIX wd: <http://www.wikidata.org/entity/>')
    }

    return prefixes.join('\n')
  }

  /**
   * Generate optional label service clause
   */
  private getLabelService(autoLanguage = true): string {
    if (!this.config.labelService) {
      return ''
    }

    const langSetting = autoLanguage ? '[AUTO_LANGUAGE],mul,en' : 'en'
    return `SERVICE wikibase:label { bd:serviceParam wikibase:language "${langSetting}". }`
  }

  /**
   * Query: Count properties by datatype
   */
  buildDatatypeQuery(): string {
    return `
${this.getPrefixes()}

SELECT ?datatype (COUNT(DISTINCT ?property) AS ?count)
WHERE {
  ?property rdf:type wikibase:Property;
            wikibase:propertyType ?datatype.
}
GROUP BY ?datatype
ORDER BY DESC(?count)
`.trim()
  }

  /**
   * Query: Count properties by language (top N)
   */
  buildLanguageQuery(limit = 10): string {
    return `
${this.getPrefixes()}

SELECT ?language (COUNT(DISTINCT ?property) AS ?count)
WHERE {
  ?property rdf:type wikibase:Property;
            rdfs:label ?label.
  BIND(LANG(?label) AS ?language)
}
GROUP BY ?language
ORDER BY DESC(?count)
LIMIT ${limit}
`.trim()
  }

  /**
   * Query: Properties by statement count (top N)
   */
  buildPropertyStatementQuery(limit = 15): string {
    if (!this.config.supportedFeatures.statements) {
      // Fallback query if statements predicate not supported
      return `
${this.getPrefixes()}

SELECT ?property ?propertyLabel (COUNT(?statement) AS ?statementCount)
WHERE {
  ?property rdf:type wikibase:Property.
  OPTIONAL { ?item ?property ?statement. }
  ${this.getLabelService()}
}
GROUP BY ?property ?propertyLabel
ORDER BY DESC(?statementCount)
LIMIT ${limit}
`.trim()
    }

    return `
${this.getPrefixes()}

SELECT ?property ?propertyLabel ?statementCount
WHERE {
  ?property rdf:type wikibase:Property;
            wikibase:statements ?statementCount.
  ${this.getLabelService()}
}
ORDER BY DESC(?statementCount)
LIMIT ${limit}
`.trim()
  }

  /**
   * Query: WikiProjects (Wikidata-specific, top N)
   */
  buildWikiProjectQuery(limit = 20): string {
    // WikiProjects are specific to Wikidata (P5008)
    if (this.config.id !== 'wikidata') {
      return this.buildPropertyClassQuery(limit)
    }

    return `
${this.getPrefixes()}

SELECT ?wikiproject ?wikprojectLabel (COUNT(DISTINCT ?property) AS ?count)
WHERE {
  ?property wdt:P5008 ?wikiproject.
  ${this.getLabelService()}
}
GROUP BY ?wikiproject ?wikprojectLabel
ORDER BY DESC(?count)
LIMIT ${limit}
`.trim()
  }

  /**
   * Query: Properties by class (top N)
   */
  buildPropertyClassQuery(limit = 20): string {
    if (this.config.id === 'wikidata') {
      // Wikidata-specific query using P1963 (property for this type)
      return `
${this.getPrefixes()}

SELECT ?property ?propertyLabel (COUNT(DISTINCT ?item) AS ?count)
WHERE {
  {
    ?property wdt:P1963 ?item.
  }
  UNION
  {
    ?item wdt:P31/wdt:P279* ?class.
    ?property wdt:P1963 ?class.
  }
  ${this.getLabelService()}
}
GROUP BY ?property ?propertyLabel
ORDER BY DESC(?count)
LIMIT ${limit}
`.trim()
    }

    if (this.config.id === 'commons') {
      return `
${this.getPrefixes()}

SELECT ?property ?propertyLabel (COUNT(DISTINCT ?item) AS ?count)
WHERE {
  ?item ?predicate ?value.
  FILTER(STRSTARTS(STR(?item), "https://commons.wikimedia.org/entity/M"))
  FILTER(STRSTARTS(STR(?predicate), "https://commons.wikimedia.org/prop/direct/"))
  BIND(
    IRI(
      REPLACE(
        STR(?predicate),
        "^https://commons.wikimedia.org/prop/direct/",
        "https://commons.wikimedia.org/entity/"
      )
    ) AS ?property
  )
  ${this.getLabelService()}
}
GROUP BY ?property ?propertyLabel
ORDER BY DESC(?count)
LIMIT ${limit}
`.trim()
    }

    // Generic query for other Wikibase instances
    return `
${this.getPrefixes()}

SELECT ?property ?propertyLabel (COUNT(DISTINCT ?item) AS ?count)
WHERE {
  ?item ?prop ?value.
  ?property wikibase:directClaim ?prop.
  ${this.getLabelService()}
}
GROUP BY ?property ?propertyLabel
ORDER BY DESC(?count)
LIMIT ${limit}
`.trim()
  }

  /**
   * Query: Search properties by label
   */
  buildPropertySearchQuery(searchTerm: string, limit = 50): string {
    const escapedTerm = searchTerm.replace(/"/g, '\\"')

    return `
${this.getPrefixes()}

SELECT DISTINCT ?property ?propertyLabel ?propertyDescription
WHERE {
  ?property rdf:type wikibase:Property;
            rdfs:label ?label.
  FILTER(CONTAINS(LCASE(?label), LCASE("${escapedTerm}")))
  ${this.getLabelService()}
}
LIMIT ${limit}
`.trim()
  }

  /**
   * Query: Get property details by ID
   */
  buildPropertyDetailQuery(propertyId: string): string {
    return `
${this.getPrefixes()}

SELECT ?property ?propertyLabel ?propertyDescription ?datatype ?statementCount
WHERE {
  BIND(entity:${propertyId} AS ?property)
  ?property rdf:type wikibase:Property.
  OPTIONAL { ?property wikibase:propertyType ?datatype. }
  ${this.config.supportedFeatures.statements ? 'OPTIONAL { ?property wikibase:statements ?statementCount. }' : ''}
  ${this.getLabelService()}
}
`.trim()
  }

  /**
   * Query: All properties with basic info
   */
  buildAllPropertiesQuery(limit = 1000, offset = 0): string {
    return `
${this.getPrefixes()}

SELECT ?property ?propertyLabel ?datatype
WHERE {
  ?property rdf:type wikibase:Property.
  OPTIONAL { ?property wikibase:propertyType ?datatype. }
  ${this.getLabelService()}
}
ORDER BY ?property
LIMIT ${limit}
OFFSET ${offset}
`.trim()
  }

  /**
   * Query (Commons): list distinct rdf:type values
   */
  buildCommonsDistinctTypesQuery(limit = 200): string {
    return `
${this.getPrefixes()}

SELECT DISTINCT ?val
WHERE {
  ?item rdf:type ?val.
}
LIMIT ${limit}
`.trim()
  }

}

/**
 * Create a query builder for a given configuration
 */
export function createQueryBuilder(config: WikibaseConfig): QueryBuilder {
  return new QueryBuilder(config)
}
