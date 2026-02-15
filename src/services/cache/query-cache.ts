import type { SparqlResults } from '@/types'

export interface CacheEntry {
  data: SparqlResults
  timestamp: number
  instanceId: string
}

export interface CacheOptions {
  ttl?: number // milliseconds, default 5 minutes
  maxEntries?: number
  storageKey?: string
}

const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
const DEFAULT_MAX_ENTRIES = 100
const DEFAULT_STORAGE_KEY = 'wbprop-query-cache'

/**
 * Query result cache with localStorage persistence and TTL-based invalidation
 */
export class QueryCache {
  private memoryCache = new Map<string, CacheEntry>()
  private ttl: number
  private maxEntries: number
  private storageKey: string

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl ?? DEFAULT_TTL
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES
    this.storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY
    this.loadFromStorage()
  }

  /**
   * Generate a cache key from instance ID and SPARQL query
   */
  static makeKey(instanceId: string, query: string): string {
    // Normalize whitespace for consistent keys
    const normalized = query.replace(/\s+/g, ' ').trim()
    return `${instanceId}:${normalized}`
  }

  /**
   * Get a cached result if it exists and hasn't expired
   */
  get(key: string): SparqlResults | null {
    const entry = this.memoryCache.get(key)
    if (!entry) return null

    if (this.isExpired(entry)) {
      this.memoryCache.delete(key)
      this.saveToStorage()
      return null
    }

    return entry.data
  }

  /**
   * Store a query result in the cache
   */
  set(key: string, data: SparqlResults, instanceId: string): void {
    // Evict oldest entries if at capacity
    if (this.memoryCache.size >= this.maxEntries) {
      this.evictOldest()
    }

    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      instanceId,
    })

    this.saveToStorage()
  }

  /**
   * Remove all entries for a specific instance
   */
  invalidateInstance(instanceId: string): void {
    for (const [key, entry] of this.memoryCache) {
      if (entry.instanceId === instanceId) {
        this.memoryCache.delete(key)
      }
    }
    this.saveToStorage()
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.memoryCache.clear()
    try {
      localStorage.removeItem(this.storageKey)
    } catch {
      // localStorage not available
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { entries: number; maxEntries: number; ttlMs: number } {
    return {
      entries: this.memoryCache.size,
      maxEntries: this.maxEntries,
      ttlMs: this.ttl,
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.ttl
  }

  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.memoryCache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey)
    }
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.storageKey)
      if (!raw) return

      const entries: Array<[string, CacheEntry]> = JSON.parse(raw)
      const now = Date.now()

      for (const [key, entry] of entries) {
        // Only load non-expired entries
        if (now - entry.timestamp <= this.ttl) {
          this.memoryCache.set(key, entry)
        }
      }
    } catch {
      // Corrupted cache or localStorage unavailable - start fresh
      this.clear()
    }
  }

  private saveToStorage(): void {
    try {
      const entries = Array.from(this.memoryCache.entries())
      localStorage.setItem(this.storageKey, JSON.stringify(entries))
    } catch {
      // localStorage full or unavailable - memory cache still works
    }
  }
}

// Singleton instance for the app
let globalCache: QueryCache | null = null

export function getQueryCache(): QueryCache {
  if (!globalCache) {
    globalCache = new QueryCache()
  }
  return globalCache
}
