# Development Scripts

This directory contains utility scripts for development, debugging, and maintenance.

## Australian, British, French and German Tables

`countries/update-country-data.ts` (`pnpm data:countries`) writes the `*.data.ts` files under `src/constants/au/`,
`src/constants/gb/`, `src/constants/fr/` and `src/constants/de/`: the Australian states and the British nations copied from kuni (a
devDependency), the Australian postcodes that cross a state border from the ABS's Postal Areas allocation file (CC BY
4.0), the British postcode districts and their nations from Ordnance Survey's Code-Point Open (OGL v3), and France's
postcodes from La Poste's Base officielle des codes postaux and its departments, regions and overseas collectivities
from INSEE's Code officiel géographique (both Licence Ouverte 2.0), and Germany's postcodes with their Länder from
GeoNames' postal code file (CC BY 4.0), the Länder's names from kuni. Without arguments it downloads every input (about
38 MB); `--only au,gb,fr,de` makes some countries' tables alone (`--only fr` downloads 1.6 MB and needs no `unzip`), and
`--abs <POA_2021_AUST.xlsx>`, `--codepoint <folder>`, `--laposte <hexasmal.csv>` and `--insee <folder with
v_departement_2026.csv, v_region_2026.csv and v_comer_2026.csv>` and `--geonames <DE.txt>` read copies already on disk.
It needs `unzip` for Australia, Great Britain and Germany. A generated file's header names the day it was made, so run it for a country only when its
source has changed. `docs/COUNTRIES.md` lists every source and its licence.

## Sub-regions Data Pipeline

The `sub-regions/` directory contains a modular TypeScript pipeline for automatically fetching, normalizing, and merging authoritative sub-region data for both the United States and Canada.

### Overview

The pipeline consists of three main scripts:

1. **`fetch-us-sub-regions.ts`** - Queries the US Census Bureau's TIGER/Line Places API
2. **`fetch-ca-sub-regions.ts`** - Pulls from Statistics Canada's Standard Geographical Classification dataset
3. **`update-sub-regions.ts`** - Orchestrates both fetchers, normalizes, deduplicates, and generates output

### Usage

```bash
# Run the complete pipeline
pnpm data:sub-regions
```

### What it does

- **Fetches comprehensive data**: Collects boroughs, parishes, districts, quadrants, and other administrative subdivisions
- **Handles bilingual names**: Processes both English and French names for Canadian sub-regions
- **Validates and deduplicates**: Ensures data quality and removes duplicates with intelligent priority rules
- **Generates optimized output**: Creates TypeScript files with lookup maps and filtered collections for performance
- **Provides statistics**: Reports on data coverage and type distribution

### Output

The pipeline generates `src/constants/sub-regions.data.ts`, which is never edited by hand. It holds the table as two packed texts, `CA_SUB_REGIONS_PACKED` and `US_SUB_REGIONS_PACKED`, one sub-region to a line as `name|parentCity|state|type|alias~alias` (`pack.ts` writes them). `src/constants/sub-regions.ts` unpacks them the first time a lookup asks, once for each country, and offers:

- `allSubRegions()` - every sub-region, Canada first
- `subRegionsOf(country)` - the sub-regions of `"US"` or `"CA"`
- `isSubRegionName(text)` - whether a normalized text is a sub-region's name or one of its aliases

### Data Sources

**US Data:**

- US Census Bureau TIGER/Line Places API
- Covers all 50 states plus DC and territories
- Includes incorporated places and census designated places
- Rate-limited to be respectful to the API

**Canadian Data:**

- Statistics Canada Standard Geographical Classification (primary)
- Hardcoded fallback for major metropolitan areas
- Handles bilingual names and special cases like Montreal arrondissements

### Features

- **Error handling**: Graceful fallbacks and detailed logging
- **Rate limiting**: Respectful API usage with configurable delays
- **Type detection**: Smart pattern matching for administrative types
- **Parent city mapping**: Links sub-regions to major metropolitan areas
- **Validation**: Comprehensive data quality checks
- **ES module compatible**: Uses modern JavaScript standards

### Maintenance

The pipeline should be run periodically to keep sub-region data current:

- **Monthly**: For active development
- **Quarterly**: For stable releases
- **After major census updates**: When new official data is released

### Dependencies

- Node's built-in `fetch` for the HTTP requests to the data APIs, so there is no HTTP dependency
- `pnpm data:sub-regions` runs the TypeScript directly with `node` (Node 24 strips the types), which is why the scripts import each other with the `.ts` extension

## Japanese data

`pnpm data:jp` regenerates the Japanese prefecture, municipality and postal-prefix tables (`src/constants/jp/*.data.ts`) with `scripts/jp/update-jp-data.ts`. Those files are generated and never edited by hand.

## Package and release scripts

- **check-package.mjs** (`pnpm test:package`) - After `pnpm build`, packs the package, installs the tarball in a temporary project and proves that `require`, `import` and the types work for both entry points, and that the `/jp` bundle carries no US street-type tables
- **release.mjs** (`pnpm release <version>`) - Sets the version, moves the changelog's Unreleased entries under it, commits and tags; `node scripts/release.mjs --notes <version>` prints a version's changelog section. Its tests are in **release.test.mjs**

## Other Development Scripts

## Files

- **analyze-json-failures.js** - Analyzes test failures in JSON test data files
- **debug-directional.js** - Debug script for directional address parsing issues
- **debug-patterns.js** - Debug script for address pattern parsing

## Usage

Most scripts can be run directly with Node.js:

```bash
# Analyze test failures
node scripts/analyze-json-failures.js

# Debug directional patterns
node scripts/debug-directional.js

# Debug general patterns
node scripts/debug-patterns.js
```

Note: Some scripts may require the project to be built first (`pnpm build`).
