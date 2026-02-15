import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryCache } from '../../src/services/cache/query-cache'
import type { SparqlResults } from '../../src/types'

const mockResults: SparqlResults = {
  head: { vars: ['x'] },
  results: {
    bindings: [
      { x: { type: 'literal', value: 'test' } },
    ],
  },
}

const mockResults2: SparqlResults = {
  head: { vars: ['y'] },
  results: {
    bindings: [
      { y: { type: 'literal', value: 'other' } },
    ],
  },
}

describe('QueryCache', () => {
  let cache: QueryCache

  beforeEach(() => {
    // Use a unique storage key per test and short TTL
    cache = new QueryCache({
      storageKey: `test-cache-${Math.random()}`,
      ttl: 5000,
      maxEntries: 5,
    })
  })

  it('should generate consistent cache keys', () => {
    const key1 = QueryCache.makeKey('wikidata', 'SELECT ?x WHERE { ?x ?y ?z }')
    const key2 = QueryCache.makeKey('wikidata', 'SELECT  ?x  WHERE  {  ?x  ?y  ?z  }')
    expect(key1).toBe(key2)
  })

  it('should generate different keys for different instances', () => {
    const key1 = QueryCache.makeKey('wikidata', 'SELECT ?x')
    const key2 = QueryCache.makeKey('factgrid', 'SELECT ?x')
    expect(key1).not.toBe(key2)
  })

  it('should store and retrieve cached results', () => {
    const key = QueryCache.makeKey('wikidata', 'SELECT ?x')
    cache.set(key, mockResults, 'wikidata')

    const result = cache.get(key)
    expect(result).toEqual(mockResults)
  })

  it('should return null for missing entries', () => {
    const result = cache.get('nonexistent-key')
    expect(result).toBeNull()
  })

  it('should expire entries after TTL', () => {
    vi.useFakeTimers()

    const shortCache = new QueryCache({
      storageKey: `test-ttl-${Math.random()}`,
      ttl: 1000,
    })

    const key = QueryCache.makeKey('wikidata', 'SELECT ?x')
    shortCache.set(key, mockResults, 'wikidata')

    // Still valid
    expect(shortCache.get(key)).toEqual(mockResults)

    // Advance past TTL
    vi.advanceTimersByTime(1500)
    expect(shortCache.get(key)).toBeNull()

    vi.useRealTimers()
  })

  it('should evict oldest entries when at max capacity', () => {
    vi.useFakeTimers()

    const smallCache = new QueryCache({
      storageKey: `test-evict-${Math.random()}`,
      ttl: 60000,
      maxEntries: 2,
    })

    const key1 = QueryCache.makeKey('wikidata', 'query1')
    smallCache.set(key1, mockResults, 'wikidata')

    vi.advanceTimersByTime(100)

    const key2 = QueryCache.makeKey('wikidata', 'query2')
    smallCache.set(key2, mockResults2, 'wikidata')

    vi.advanceTimersByTime(100)

    // Adding a third should evict the oldest (key1)
    const key3 = QueryCache.makeKey('wikidata', 'query3')
    smallCache.set(key3, mockResults, 'wikidata')

    expect(smallCache.get(key1)).toBeNull()
    expect(smallCache.get(key2)).toEqual(mockResults2)
    expect(smallCache.get(key3)).toEqual(mockResults)

    vi.useRealTimers()
  })

  it('should invalidate all entries for a specific instance', () => {
    const key1 = QueryCache.makeKey('wikidata', 'query1')
    const key2 = QueryCache.makeKey('wikidata', 'query2')
    const key3 = QueryCache.makeKey('factgrid', 'query1')

    cache.set(key1, mockResults, 'wikidata')
    cache.set(key2, mockResults2, 'wikidata')
    cache.set(key3, mockResults, 'factgrid')

    cache.invalidateInstance('wikidata')

    expect(cache.get(key1)).toBeNull()
    expect(cache.get(key2)).toBeNull()
    expect(cache.get(key3)).toEqual(mockResults)
  })

  it('should clear all entries', () => {
    const key = QueryCache.makeKey('wikidata', 'query1')
    cache.set(key, mockResults, 'wikidata')

    cache.clear()

    expect(cache.get(key)).toBeNull()
    expect(cache.getStats().entries).toBe(0)
  })

  it('should report correct stats', () => {
    expect(cache.getStats().entries).toBe(0)
    expect(cache.getStats().maxEntries).toBe(5)
    expect(cache.getStats().ttlMs).toBe(5000)

    const key = QueryCache.makeKey('wikidata', 'query1')
    cache.set(key, mockResults, 'wikidata')

    expect(cache.getStats().entries).toBe(1)
  })

  it('should normalize whitespace in cache keys', () => {
    const key1 = QueryCache.makeKey('wikidata', 'SELECT\n  ?x\n  WHERE\n  { ?x ?y ?z }')
    const key2 = QueryCache.makeKey('wikidata', 'SELECT ?x WHERE { ?x ?y ?z }')
    expect(key1).toBe(key2)
  })
})
