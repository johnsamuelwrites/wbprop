# Configuration

This document explains how to configure Wikibase instances, authentication, and caching in WBProp.

## WikibaseConfig Interface

Every Wikibase instance is described by a `WikibaseConfig` object (defined in `src/types/wikibase-config.ts`):

```typescript
interface WikibaseConfig {
  // Required
  id: string                     // Unique identifier (e.g., "wikidata")
  name: string                   // Display name (e.g., "Wikidata")
  sparqlEndpoint: string         // SPARQL endpoint URL

  // Instance metadata
  entityPrefix: string           // Entity URI prefix
  propertyPrefix: string         // Property ID prefix (e.g., "P")
  wikibaseOntology: string       // Wikibase ontology namespace
  labelService: boolean          // Whether wikibase:label SERVICE is available
  supportedFeatures: WikibaseFeatures

  // Optional
  customPrefixes?: Record<string, string>  // Additional SPARQL prefixes
  rateLimit?: RateLimitConfig
  theme?: WikibaseTheme

  // Authentication
  requiresAuthentication?: boolean
  cookieBasedAuth?: boolean
  authUrl?: string
  availabilityNote?: string
}
```

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| `id` | Unique string identifier used internally and in URL parameters | `"wikidata"` |
| `name` | Human-readable name shown in the UI | `"Wikidata"` |
| `sparqlEndpoint` | Full URL of the SPARQL query endpoint | `"https://query.wikidata.org/sparql"` |

### Instance Metadata

| Field | Description | Default |
|-------|-------------|---------|
| `entityPrefix` | Base URI for entities | `"http://www.wikidata.org/entity/"` |
| `propertyPrefix` | Character prefix for property IDs | `"P"` |
| `wikibaseOntology` | Wikibase ontology namespace | `"http://wikiba.se/ontology#"` |
| `labelService` | Whether the instance supports `SERVICE wikibase:label` | `true` |

### Supported Features

```typescript
interface WikibaseFeatures {
  statements: boolean   // wikibase:statements predicate available
  sitelinks: boolean    // Sitelink data available
  qualifiers: boolean   // Statement qualifiers supported
  references: boolean   // Statement references supported
}
```

These flags control which SPARQL query patterns are used. For example, if `statements` is `false`, the property statement count query falls back to a `COUNT()` pattern instead of reading the pre-computed `wikibase:statements` value.

### Custom SPARQL Prefixes

Some instances use non-standard namespace URIs. The `customPrefixes` field adds additional `PREFIX` declarations to all generated queries:

```typescript
// Wikimedia Commons uses different entity URIs
customPrefixes: {
  wd: 'https://commons.wikimedia.org/entity/',
  wdt: 'https://commons.wikimedia.org/prop/direct/',
}
```

Standard prefixes (`rdf:`, `rdfs:`, `schema:`, `bd:`, `wikibase:`, `entity:`) are always included. Wikidata-specific prefixes (`wdt:`, `wd:`) are added automatically only for the `wikidata` instance.

### Rate Limiting

```typescript
interface RateLimitConfig {
  requestsPerMinute: number  // Max requests per minute
  concurrent: number         // Max concurrent requests
}
```

The `concurrent` value controls the SPARQL client's request queue. When the limit is reached, additional requests wait until a slot opens.

| Instance | Concurrent | Per Minute |
|----------|-----------|------------|
| Wikidata | 5 | 60 |
| FactGrid | 3 | 30 |
| Commons  | 5 | 60 |
| Rhizome  | 2 | 30 |

### Theme

```typescript
interface WikibaseTheme {
  primary: string    // Primary hex color
  secondary: string  // Secondary hex color
}
```

Instance themes are reserved for future per-instance UI customization.

## Authentication

### Public Endpoints

Most Wikibase instances (Wikidata, FactGrid, Rhizome) have public SPARQL endpoints that require no authentication. Set `requiresAuthentication` to `false` or omit it.

### Cookie-based OAuth (Wikimedia Commons)

Wikimedia Commons Query Service requires authentication through cookies:

```typescript
{
  requiresAuthentication: true,
  cookieBasedAuth: true,
  authUrl: 'https://commons-query.wikimedia.org/',
  availabilityNote: 'Wikimedia Commons Query Service requires login...',
}
```

**How it works:**

1. The SPARQL client sets `withCredentials: true` on the Axios instance
2. The browser automatically includes cookies with each request
3. Two cookies manage the session:
   - **`wcqsOauth`** -- long-lived authentication cookie
   - **`wcqsSession`** -- short-lived JWT cookie, automatically refreshed via HTTP 307 redirect
4. If the user is not authenticated, the SPARQL endpoint returns 401/403
5. WBProp catches this as `AuthenticationRequiredError` and shows a Login button
6. Clicking Login opens the `authUrl` in a new tab for the user to authenticate
7. After authentication, the user returns and queries work with the new cookies

**Authentication logic in the client:**

- If `requiresAuthentication` is `true` AND `cookieBasedAuth` is `false`: queries are **blocked entirely** (the endpoint requires auth that the browser cannot provide)
- If `requiresAuthentication` is `true` AND `cookieBasedAuth` is `true`: queries are **attempted** and the browser sends cookies; auth failures surface as login prompts

### Adding an Authenticated Instance

To add a new instance that requires authentication:

1. Set `requiresAuthentication: true`
2. If the endpoint uses cookies (like Commons), set `cookieBasedAuth: true`
3. Set `authUrl` to the login/OAuth page URL
4. Optionally set `availabilityNote` for the message shown to unauthenticated users

## Caching

### Query Cache

SPARQL query results are cached in localStorage to reduce network requests and improve responsiveness.

**Default settings:**

| Setting | Value |
|---------|-------|
| TTL | 5 minutes |
| Max entries | 100 |
| Storage key | `wbprop-query-cache` |

**Cache behavior:**

- On `query()`: cache is checked first; if a valid (non-expired) entry exists, it is returned immediately
- On `queryFresh()`: cache is bypassed and a fresh network request is made; the result is still cached
- On refresh button click: `queryFresh()` is used to bypass the cache
- On instance switch: queries are re-executed (cached results for the new instance may still be available)

**Cache key generation:**

Keys are formed from `{instanceId}:{normalizedQuery}` where whitespace in the SPARQL query is normalized. This means reformatted queries hit the same cache entry.

**Cache invalidation:**

- **TTL expiry** -- entries older than 5 minutes are evicted on access
- **Instance invalidation** -- `cache.invalidateInstance(id)` removes all entries for a specific instance
- **Manual clear** -- Settings page provides a "Clear Cache" button
- **LRU eviction** -- when the cache reaches max capacity, the oldest entry is removed

### Request Deduplication

If multiple components request the same query simultaneously (e.g., during initial page load), only one network request is made. All callers receive the same promise and result.

This is implemented via a module-level `Map<string, Promise<SparqlResults>>` that tracks in-flight requests by cache key.

### Managing the Cache

In the **Settings** page:

- View the current number of cached queries and the TTL duration
- Click **Clear Cache** to remove all cached entries
- Click the refresh icon to update the displayed statistics

## Instance Store

Instance configuration is managed by a Pinia store (`src/stores/wikibase.ts`):

**localStorage keys:**

| Key | Purpose |
|-----|---------|
| `wbprop-active-instance` | ID of the currently selected instance |
| `wbprop-custom-configs` | JSON array of user-added instance configurations |
| `wbprop-query-cache` | Serialized cache entries |

**URL parameter:**

On load, the store reads `?instance=<id>` from the URL and switches to that instance if it exists. This allows sharing links that pre-select a specific Wikibase.

## Adding a New Preset Instance

To add a new built-in Wikibase instance:

1. Define a `WikibaseConfig` constant in `src/config/presets.ts`:

```typescript
export const MY_WIKIBASE_CONFIG: WikibaseConfig = {
  id: 'my-wikibase',
  name: 'My Wikibase',
  sparqlEndpoint: 'https://my-wikibase.org/query/sparql',
  entityPrefix: 'https://my-wikibase.org/entity/',
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
```

2. Add it to the `PRESET_CONFIGS` array:

```typescript
export const PRESET_CONFIGS: WikibaseConfig[] = [
  WIKIDATA_CONFIG,
  FACTGRID_CONFIG,
  COMMONS_CONFIG,
  RHIZOME_CONFIG,
  MY_WIKIBASE_CONFIG,  // Add here
]
```

3. If the instance uses non-standard prefixes, SPARQL patterns, or authentication, you may also need to update `QueryBuilder` to handle instance-specific query logic.

## Environment

The application does not use environment variables at runtime. All configuration is either:

- Hardcoded in presets (`src/config/presets.ts`)
- User-configured via the Settings UI (persisted in localStorage)
- Passed via URL parameters
