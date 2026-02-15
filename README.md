# WBProp

Everything about Wikibase properties.

A modern dashboard for exploring, searching, and visualizing properties across any [Wikibase](https://wikiba.se/) instance.

WBProp is inspired by [WDProp](https://github.com/nickvdp/wdprop) (Wikidata-specific) and extends the concept to support **any Wikibase instance** through a configurable, multi-instance architecture.

Repository: https://github.com/johnsamuelwrites/wbprop

## Features

- **Multi-instance support** -- switch between Wikidata, FactGrid, Wikimedia Commons, Rhizome, or add your own Wikibase instances
- **Interactive dashboard** -- overview charts for datatypes, languages, top properties, WikiProjects, and property classes
- **Advanced statistics** -- bar charts, horizontal bars, donut charts, and treemap visualizations with drill-down selection
- **Property search** -- full-text search with debounced autocomplete suggestions
- **Property browser** -- paginated table of all properties with datatype information
- **Data export** -- export charts and data as CSV, PNG, or SVG
- **Query caching** -- localStorage-based cache with TTL invalidation and request deduplication
- **Dark theme** -- full dark mode support via Vuetify
- **Responsive design** -- works on desktop and mobile
- **Wikimedia Commons OAuth** -- cookie-based authentication for the Commons SPARQL endpoint

## Wikibase Instance Support

One of the main goals of WBProp is to work across many Wikibase deployments, not only Wikidata.

### Preset Instances

The app ships with built-in presets (defined in `src/config/presets.ts`):

| Instance | Endpoint | Authentication |
|----------|----------|----------------|
| [Wikidata](https://www.wikidata.org/) | `query.wikidata.org` | None |
| [FactGrid](https://database.factgrid.de/) | `database.factgrid.de` | None |
| [Wikimedia Commons](https://commons.wikimedia.org/) | `commons-query.wikimedia.org` | Cookie-based OAuth |
| [Rhizome](https://artbase.rhizome.org/) | `query.artbase.rhizome.org` | None |
| [John Samuel](https://jsamwrites.wikibase.cloud/) | `jsamwrites.wikibase.cloud` | None |

### Add Custom Instances from the UI

In **Settings > Wikibase Instances**, use **Add Instance** and provide:

- **Instance ID** -- unique key, such as `my-wikibase`
- **Display Name** -- shown in the navigation and headers
- **SPARQL Endpoint URL** -- the SPARQL query endpoint

Custom instances are saved in browser localStorage and persist across reloads.

### Select an Active Instance

You can switch the active instance in the Settings page. The selected instance is stored locally and used by all views (dashboard, search, statistics, properties).

You can also preselect an instance with a URL query parameter:

```
?instance=wikidata
?instance=factgrid
?instance=my-wikibase
```

### Wikimedia Commons Authentication

Wikimedia Commons Query Service requires authenticated access. Authentication is managed through two cookies:

- **`wcqsOauth`** -- a long-lived cookie for authentication
- **`wcqsSession`** -- a short-lived JWT cookie, auto-refreshed via 307 redirect

WBProp makes requests with `withCredentials: true` so the browser includes these cookies automatically. If not authenticated, users see a Login button that redirects to the Commons login page.

See [docs/configuration.md](docs/configuration.md) for more details on authentication.

## Tech Stack

- **Framework**: [Vue 3](https://vuejs.org/) with Composition API
- **Language**: [TypeScript](https://www.typescriptlang.org/) (strict mode)
- **Build Tool**: [Vite](https://vite.dev/)
- **UI Library**: [Vuetify 3](https://vuetifyjs.com/) (Material Design)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Routing**: [Vue Router 4](https://router.vuejs.org/) (hash history)
- **Charts**: [ECharts 5](https://echarts.apache.org/) (via [vue-echarts](https://github.com/ecomfe/vue-echarts)) + [D3.js 7](https://d3js.org/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Testing**: [Vitest](https://vitest.dev/) (unit) + [Playwright](https://playwright.dev/) (e2e)
- **Linting**: [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20.19+ or 22.12+
- npm 9+

### Installation

```bash
git clone https://github.com/johnsamuelwrites/wbprop.git
cd wbprop
npm install
```

### Development

```bash
npm run dev
```

Opens the app at [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
```

Output is generated in the `dist/` directory. The build uses automatic code splitting for optimal loading performance:

| Chunk | Contents | Purpose |
|-------|----------|---------|
| `vue-vendor` | Vue, Vue Router, Pinia | Core framework |
| `vuetify-vendor` | Vuetify | UI components |
| `echarts-core` | ECharts renderer, vue-echarts | Chart engine |
| `echarts-charts` | ECharts chart types and components | Chart modules |
| `d3-vendor` | D3.js | Bar chart visualization |

### Preview

```bash
npm run preview
```

### Testing

```bash
# Run unit tests
npm test

# Run unit tests with UI
npm run test:ui

# Run end-to-end tests
npm run test:e2e
```

### Linting and Formatting

```bash
npm run lint
npm run format
```

## Project Structure

```
src/
  components/
    charts/
      BarChart.vue            # D3.js bar chart with staggered animations
      ChartCard.vue           # Reusable chart container with skeleton loading
      DonutChart.vue          # ECharts pie/donut chart
      ExportMenu.vue          # CSV download button
      HorizontalBarChart.vue  # ECharts horizontal bar chart
      TreeMapChart.vue        # ECharts treemap visualization
  composables/
    useChartExport.ts         # CSV, PNG, SVG export utilities
    useSparqlQuery.ts         # Reactive SPARQL query hooks with caching
  config/
    presets.ts                # Preset Wikibase instance configurations
  router/
    index.ts                  # Vue Router with lazy-loaded routes
  services/
    cache/
      query-cache.ts          # localStorage cache with TTL and LRU eviction
    sparql/
      client.ts               # HTTP client with retry, dedup, caching
      query-builder.ts        # Parameterized SPARQL query generator
  stores/
    wikibase.ts               # Pinia store for instance config management
  types/
    wikibase-config.ts        # WikibaseConfig and related interfaces
    sparql-results.ts         # SPARQL JSON results format types
  views/
    DashboardView.vue         # Main overview with chart cards
    PropertiesView.vue        # Paginated property table
    SearchView.vue            # Property search with autocomplete
    SettingsView.vue          # Instance management, theme, cache
    StatisticsView.vue        # Advanced charts with type switching
tests/
  unit/
    query-builder.spec.ts     # QueryBuilder unit tests
    query-cache.spec.ts       # QueryCache unit tests
```

## Add a New Preset (Developer)

If you want to make a Wikibase instance available for all users by default:

1. Add a `WikibaseConfig` object in `src/config/presets.ts`
2. Include it in the `PRESET_CONFIGS` array
3. Provide at least: `id`, `name`, `sparqlEndpoint`
4. Optionally define:
   - `entityPrefix`, `propertyPrefix`, `customPrefixes`
   - `labelService` (whether `wikibase:label` SERVICE is available)
   - `supportedFeatures` (statements, sitelinks, qualifiers, references)
   - `rateLimit` (`requestsPerMinute`, `concurrent`)
   - `requiresAuthentication`, `cookieBasedAuth`, `authUrl`, `availabilityNote`

See `src/types/wikibase-config.ts` for the full configuration interface and [docs/configuration.md](docs/configuration.md) for detailed documentation.

## Documentation

- [Architecture](docs/architecture.md) -- data flow, design patterns, and module overview
- [Configuration](docs/configuration.md) -- Wikibase instance configuration, authentication, and caching
- [Contributing](docs/contributing.md) -- development guidelines, coding conventions, and testing

## Deployment

The project includes a GitHub Actions workflow (`.github/workflows/main.yml`) that automatically builds and deploys to GitHub Pages on push to the `master` branch.

The app uses `createWebHashHistory` for routing and `base: './'` in the Vite config, making it compatible with GitHub Pages and other static hosting without additional server configuration.

## Notes

- Query results are cached in localStorage with a 5-minute TTL to reduce repeated SPARQL requests
- Identical concurrent queries are deduplicated (only one network request is made)
- The refresh button on each chart bypasses the cache and fetches fresh data
- The app uses hash-based routing, making static hosting straightforward

## License

[GPL-3.0-or-later](https://www.gnu.org/licenses/gpl-3.0.html)

## Author

[John Samuel](https://github.com/johnsamuelwrites)
