# Architecture

This document describes the architecture, data flow, and design patterns used in WBProp.

## Overview

WBProp is a single-page application built with Vue 3 and TypeScript. It connects to SPARQL endpoints of various Wikibase instances to fetch property metadata and present it through interactive charts, tables, and search.

```
┌─────────────┐
│   Browser    │
│  (Vue SPA)   │
└──────┬───────┘
       │ SPARQL over HTTP POST
       ▼
┌─────────────────────────┐
│   Wikibase SPARQL       │
│   Endpoints             │
│  - query.wikidata.org   │
│  - database.factgrid.de │
│  - commons-query...     │
│  - query.artbase...     │
└─────────────────────────┘
```

## Data Flow

The application follows a unidirectional data flow from configuration to visualization:

```
WikibaseConfig (Pinia Store)
        │
        ▼
  QueryBuilder
  (generates parameterized SPARQL)
        │
        ▼
  SparqlClient
  (cache check → dedup → HTTP POST → retry → cache store)
        │
        ▼
  SparqlResults (JSON)
        │
        ▼
  Transform functions
  (binding → ChartDataItem[])
        │
        ▼
  Vue Components
  (BarChart, DonutChart, TreeMap, etc.)
```

### Step-by-step

1. **Configuration**: The Pinia store (`wikibase.ts`) holds the active Wikibase instance configuration. Changes to the active instance trigger reactive updates across all views.

2. **Query Building**: `QueryBuilder` generates SPARQL queries parameterized for the active instance. It handles instance-specific differences such as Wikidata's `wdt:`/`wd:` prefixes, Commons' custom entity prefixes, and feature flags like label service support.

3. **Execution**: `SparqlClient` executes queries with:
   - **Cache lookup** -- checks localStorage-based cache (5-minute TTL) before making network requests
   - **Request deduplication** -- identical in-flight queries share a single promise
   - **Concurrency control** -- queue-based throttling (default: 5 concurrent requests)
   - **Retry with backoff** -- retries on 5xx/429 errors with exponential delay
   - **Cookie-based auth** -- `withCredentials: true` for endpoints requiring authentication

4. **Transformation**: Result bindings are mapped to typed data structures (`ChartDataItem[]`, `string[]`, etc.) by transform functions in `useSparqlQuery.ts`.

5. **Rendering**: Vue components receive the transformed data as props and render interactive visualizations using D3.js or ECharts.

## Module Architecture

### Services Layer

#### SPARQL Client (`src/services/sparql/client.ts`)

The HTTP transport layer for SPARQL queries.

- Creates an Axios instance per Wikibase configuration
- Manages a request queue for concurrency limiting
- Integrates with the cache layer for read-through caching
- Provides `query()` (cached) and `queryFresh()` (bypass cache) methods
- Handles authentication errors with a specific `AuthenticationRequiredError` class

#### Query Builder (`src/services/sparql/query-builder.ts`)

Generates SPARQL queries parameterized for different Wikibase instances.

- Dynamically generates prefix declarations based on instance config
- Conditionally includes the `wikibase:label` SERVICE clause
- Instance-specific query variants (Wikidata WikiProjects, Commons property classes)
- Proper string escaping for search terms

Query methods:

| Method | Description |
|--------|-------------|
| `buildDatatypeQuery()` | Count properties grouped by datatype |
| `buildLanguageQuery(limit)` | Top N languages by property count |
| `buildPropertyStatementQuery(limit)` | Top N properties by statement count |
| `buildWikiProjectQuery(limit)` | WikiProjects (Wikidata P5008) |
| `buildPropertyClassQuery(limit)` | Properties grouped by class |
| `buildPropertySearchQuery(term, limit)` | Full-text search on property labels |
| `buildPropertyDetailQuery(id)` | Single property details |
| `buildAllPropertiesQuery(limit, offset)` | Paginated property listing |
| `buildCommonsDistinctTypesQuery(limit)` | Commons rdf:type values |

#### Cache (`src/services/cache/query-cache.ts`)

localStorage-based query result cache.

- **TTL-based expiration** -- entries expire after 5 minutes (configurable)
- **LRU eviction** -- oldest entries removed when max capacity (100) reached
- **Whitespace normalization** -- consistent cache keys regardless of query formatting
- **Instance scoping** -- entries track their source instance for targeted invalidation
- **Persistence** -- survives page reloads via localStorage serialization

### Composables Layer

#### `useSparqlQuery<T>()` (`src/composables/useSparqlQuery.ts`)

The primary data-fetching composable. Provides reactive query state with automatic refetch on configuration changes.

```typescript
const { data, isLoading, error, refetch } = useSparqlQuery(
  (builder) => builder.buildDatatypeQuery(),
  transformDatatypeResults,
  { immediate: true, enabled: (configId) => configId !== 'commons' }
)
```

- **Generic**: Accepts a query builder function and a transform function
- **Reactive**: Auto-refetches when the active Wikibase instance changes
- **Conditional**: `enabled` callback controls per-instance activation
- **Cache-aware**: Normal fetches use cache; `refetch()` bypasses it

Specialized hooks wrap `useSparqlQuery` with predefined queries and transforms:

- `useDatatypeStats()` -- disabled for Commons
- `useLanguageStats(limit)` -- disabled for Commons
- `usePropertyStats(limit)` -- disabled for Commons
- `useWikiProjectStats(limit)` -- Wikidata only
- `usePropertyClassStats(limit)` -- disabled for Commons
- `useCommonsDistinctTypes(limit)` -- Commons only

#### `useChartExport` (`src/composables/useChartExport.ts`)

Utilities for exporting chart data:

- **CSV** -- generates comma-separated values with proper quoting
- **PNG** -- renders ECharts to canvas at 2x resolution
- **SVG** -- exports ECharts vector graphics

### State Management

#### Wikibase Store (`src/stores/wikibase.ts`)

Pinia store managing Wikibase instance configuration:

- **Presets** -- built-in configurations loaded from `config/presets.ts`
- **Custom configs** -- user-added instances persisted in localStorage
- **Active config** -- currently selected instance (persisted)
- **URL initialization** -- reads `?instance=` parameter on load

### Views

| View | Route | Description |
|------|-------|-------------|
| `DashboardView` | `/` | Overview with 5 chart cards (datatypes, languages, properties, WikiProjects, classes). Shows Commons-specific RDF types list when Commons is selected. |
| `PropertiesView` | `/properties` | Paginated table of all properties with ID, label, and datatype columns. |
| `StatisticsView` | `/statistics` | Advanced visualization with chart type switching (bar, horizontal, donut, treemap) and drill-down selection panels. |
| `SearchView` | `/search` | Full-text property search with debounced autocomplete dropdown and clickable results. |
| `SettingsView` | `/settings` | Theme toggle, instance management (add/remove/select), and cache management (stats, clear). |

### Chart Components

| Component | Library | Use |
|-----------|---------|-----|
| `BarChart` | D3.js | Vertical bars with staggered animation, tooltips, responsive resize |
| `DonutChart` | ECharts | Pie/donut with hover emphasis and label formatting |
| `HorizontalBarChart` | ECharts | Horizontal bars with elastic animation |
| `TreeMapChart` | ECharts | Treemap with drill-down and breadcrumb navigation |
| `ChartCard` | Vuetify | Container providing title, skeleton loading, error states, and export menu |
| `ExportMenu` | Vuetify | CSV download button |

## Routing

All routes use lazy loading via dynamic `import()`:

```typescript
component: () => import('@/views/DashboardView.vue')
```

Hash-based history (`createWebHashHistory`) ensures compatibility with static hosting (GitHub Pages).

## Code Splitting

Vite is configured with manual chunks to optimize bundle splitting:

```typescript
manualChunks: {
  'vue-vendor':     ['vue', 'vue-router', 'pinia'],
  'vuetify-vendor': ['vuetify'],
  'echarts-core':   ['echarts/core', 'echarts/renderers', 'vue-echarts'],
  'echarts-charts': ['echarts/charts', 'echarts/components'],
  'd3-vendor':      ['d3'],
}
```

This ensures that large libraries (ECharts, D3, Vuetify) are loaded as separate cached chunks rather than bundled into a single file.

## Type System

The project uses TypeScript strict mode with two core type families:

- **`WikibaseConfig`** -- describes a Wikibase instance (endpoint, prefixes, features, auth)
- **`SparqlResults`** -- W3C SPARQL JSON results format with typed bindings
- **`ChartDataItem`** -- normalized chart data with label, value, optional URI and color

All SPARQL query results flow through transform functions that convert raw bindings to typed application data.

## Error Handling

- **Network errors** -- displayed in chart cards with retry buttons
- **Authentication errors** -- `AuthenticationRequiredError` triggers login prompts for cookie-based auth endpoints
- **SPARQL errors** -- HTTP 400 errors are normalized with descriptive messages
- **Rate limiting** -- HTTP 429 responses trigger retry with exponential backoff
