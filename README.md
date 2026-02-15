# wbprop

Everything about Wikibase properties.

Repository: https://github.com/johnsamuelwrites/wbprop

## Overview

`wbprop` is a Vue + TypeScript dashboard for exploring and comparing properties across multiple Wikibase instances.

The app includes:
- Property dashboards and statistics
- Property search with autocomplete
- Multi-instance configuration (preset + custom instances)
- SPARQL query caching, retry, and request deduplication
- Wikimedia Commons OAuth-aware access support

## Wikibase Instance Support

One of the main goals of `wbprop` is to work across many Wikibase deployments, not only Wikidata.

### Preset instances

The app ships with built-in presets in `src/config/presets.ts`:
- Wikidata
- FactGrid
- Wikimedia Commons
- Rhizome

### Add custom instances from the UI

In **Settings -> Wikibase Instances**, use **Add Instance** and provide:
- `Instance ID` (unique key, such as `my-wikibase`)
- `Display Name`
- `SPARQL Endpoint URL`

Custom instances are saved in browser local storage and persist across reloads.

### Select an active instance

You can switch the active instance in Settings. The selected instance is stored locally and used by search, statistics, and other query views.

You can also preselect an instance with a URL query parameter:
- `?instance=wikidata`
- `?instance=factgrid`
- `?instance=my-wikibase`

### Wikimedia Commons authentication

Wikimedia Commons Query Service requires authenticated access.
`wbprop` supports cookie-based OAuth flows for Commons and can surface login-required states when needed.

## Add a New Preset (Developer)

If you want to make a Wikibase instance available for all users by default:

1. Add a `WikibaseConfig` in `src/config/presets.ts`.
2. Include it in `PRESET_CONFIGS`.
3. Provide at least:
   - `id`
   - `name`
   - `sparqlEndpoint`
4. Optionally define:
   - `entityPrefix`, `propertyPrefix`, `customPrefixes`
   - `rateLimit` (`requestsPerMinute`, `concurrent`)
   - `requiresAuthentication`, `cookieBasedAuth`, `authUrl`, `availabilityNote`

See `src/types/wikibase-config.ts` for the full config contract.

## Development

### Requirements

- Node.js `20.19.0` recommended (CI uses Node `20.19.0`)
- npm

### Run locally

1. Install dependencies:
   `npm install`
2. Start the dev server:
   `npm run dev`
3. Build for production:
   `npm run build`
4. Run unit tests:
   `npm test`
5. Run E2E tests:
   `npm run test:e2e`

## Notes

- Query results are cached (TTL-based) in local storage to reduce repeated requests.
- The app uses hash-based routing, making static hosting (including GitHub Pages) straightforward.
