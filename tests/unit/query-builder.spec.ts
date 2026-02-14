import { describe, it, expect } from 'vitest'
import { QueryBuilder } from '../../src/services/sparql/query-builder'
import { WIKIDATA_CONFIG, FACTGRID_CONFIG } from '../../src/config/presets'

describe('QueryBuilder', () => {
  describe('Wikidata configuration', () => {
    const builder = new QueryBuilder(WIKIDATA_CONFIG)

    it('generates correct prefixes for Wikidata', () => {
      const query = builder.buildDatatypeQuery()
      expect(query).toContain('PREFIX wikibase: <http://wikiba.se/ontology#>')
      expect(query).toContain('PREFIX wdt: <http://www.wikidata.org/prop/direct/>')
    })

    it('builds datatype query correctly', () => {
      const query = builder.buildDatatypeQuery()
      expect(query).toContain('SELECT ?datatype (COUNT(DISTINCT ?property) AS ?count)')
      expect(query).toContain('wikibase:propertyType ?datatype')
      expect(query).toContain('GROUP BY ?datatype')
    })

    it('builds language query with limit', () => {
      const query = builder.buildLanguageQuery(5)
      expect(query).toContain('LIMIT 5')
      expect(query).toContain('BIND(LANG(?label) AS ?language)')
    })

    it('builds property statement query', () => {
      const query = builder.buildPropertyStatementQuery(10)
      expect(query).toContain('wikibase:statements ?statementCount')
      expect(query).toContain('LIMIT 10')
    })

    it('builds WikiProject query for Wikidata', () => {
      const query = builder.buildWikiProjectQuery()
      expect(query).toContain('wdt:P5008')
    })

    it('builds property class query with Wikidata-specific properties', () => {
      const query = builder.buildPropertyClassQuery()
      expect(query).toContain('wdt:P1963')
    })

    it('includes label service when supported', () => {
      const query = builder.buildPropertyStatementQuery()
      expect(query).toContain('SERVICE wikibase:label')
      expect(query).toContain('[AUTO_LANGUAGE]')
    })
  })

  describe('FactGrid configuration', () => {
    const builder = new QueryBuilder(FACTGRID_CONFIG)

    it('uses FactGrid entity prefix', () => {
      const query = builder.buildDatatypeQuery()
      expect(query).toContain('PREFIX entity: <https://database.factgrid.de/entity/>')
    })

    it('does not include Wikidata-specific prefixes', () => {
      const query = builder.buildDatatypeQuery()
      expect(query).not.toContain('wdt:')
      expect(query).not.toContain('wd:')
    })

    it('falls back to generic property class query', () => {
      const query = builder.buildPropertyClassQuery()
      expect(query).not.toContain('wdt:P1963')
    })
  })

  describe('search functionality', () => {
    const builder = new QueryBuilder(WIKIDATA_CONFIG)

    it('escapes search terms properly', () => {
      const query = builder.buildPropertySearchQuery('test "value"')
      expect(query).toContain('test \\"value\\"')
    })

    it('uses FILTER with CONTAINS for search', () => {
      const query = builder.buildPropertySearchQuery('instance')
      expect(query).toContain('FILTER(CONTAINS(LCASE(?label), LCASE("instance")))')
    })
  })

  describe('property detail query', () => {
    const builder = new QueryBuilder(WIKIDATA_CONFIG)

    it('binds specific property ID', () => {
      const query = builder.buildPropertyDetailQuery('P31')
      expect(query).toContain('BIND(entity:P31 AS ?property)')
    })
  })
})
