# address-plus

`@johnmorrisdotca/address-plus` parses US, Canadian and Japanese addresses, and Australian, French, German and British ones through their country modules. The coding conventions are in [.github/copilot-instructions.md](.github/copilot-instructions.md); this file covers the toolchain, the layout and the release procedure.

## Toolchain

- Node 24 (`.nvmrc`, `engines`) and pnpm 10 (`packageManager`). Always `pnpm`, never npm or yarn.
- TypeScript 5.9, built with tsup 8.5 to ESM and CommonJS with type declarations in `dist/`.
- Vitest 5 for unit tests, `tsd` for the published type definitions.
- ESLint 9 with the flat config in `eslint.config.js` (typescript-eslint's recommended rules), and Prettier with `prettier-plugin-organize-imports` (`.prettierrc.json`, `.prettierignore`). Prettier orders the imports; ESLint does not.
- Style: double quotes, 120 columns, 2 spaces, `//` comments that say why, no emoji anywhere, exports gathered at the end of a file. A name starting with `_` may be unused.
- Every public export has a TSDoc block (`/** */`) with a summary, `@param`, `@returns` and an `@example` ending in `// → <answer>`; `pnpm docs:legacy-check` holds each answer to the built package and checks the blocks reach `dist/*.d.ts`. The API reference (`docs/api.md`, `api.html`) is made from them.

## Commands

| Command                  | What it does                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `pnpm check`             | Everything CI runs, in this order: lint, typecheck, check:size, test, build, docs:check, docs:legacy-check, test:types, schema:validate, test:package, test:readme |
| `pnpm check:size`        | `scripts/check-size.mjs`, the family's copy: no source file under `src/` holds more than 500 lines of code (blank lines, comments, tests and `*.data.ts` are not counted) |
| `pnpm test:readme`       | `scripts/check-readme-examples.mjs`: builds, then runs every `ts`, `js` and `mjs` block of the README against the built package (`no-run` type-checks only, `no-check` skips an excerpt) |
| `pnpm bench`             | Builds, then `scripts/benchmark.mjs`: parse speed over each country's corpus, load time in a fresh process, and the size of every entry point; see [docs/guides/performance.md](docs/guides/performance.md) |
| `pnpm lint`              | ESLint, then `prettier --check .`; `pnpm lint:fix` fixes what it can                                       |
| `pnpm typecheck`         | `tsc -p tsconfig.check.json`: `src/**` including the tests, and `scripts/**/*.ts`                          |
| `pnpm test`              | Vitest, once (`pnpm test:watch` to watch, `pnpm test:coverage` for coverage)                               |
| `pnpm build`             | tsup into `dist/`: `dist/index.*`, `dist/jp/index.*`, `dist/au/index.*`, `dist/de/index.*`, `dist/fr/index.*` and `dist/gb/index.*`              |
| `pnpm test:types`        | `tsd` on `src/__tests__/types.test-d.ts`; needs `dist/index.d.ts`, so build first                          |
| `pnpm schema:validate`   | Validates every JSON file in `test-data/` against the schemas in `schemas/`                                |
| `pnpm test:package`      | `scripts/check-package.mjs`; packs the built package and proves it works as a user installs it             |
| `pnpm docs:legacy-check`        | `scripts/check-docs.mjs`: every export has TSDoc and an example whose answer the built package gives; needs `dist/` |
| `pnpm docs:make`         | Writes `docs/api.md`, the API reference, from the TSDoc                                                    |
| `pnpm data:jp`           | Regenerates the Japanese data tables (documented in `scripts/README.md`)                                   |
| `pnpm data:sub-regions`  | Regenerates `src/constants/sub-regions.data.ts` from the Census and Statistics Canada                      |
| `pnpm data:countries`    | Regenerates the Australian, British, French and German tables from kuni, the ABS, Code-Point Open, La Poste, INSEE and GeoNames (`docs/COUNTRIES.md`) |
| `pnpm release <version>` | Cuts a release (below)                                                                                     |

Run `pnpm check` before every push. It must pass with nothing disabled: do not turn a lint rule off to get green unless the rule is wrong for this repository, and then say why in the commit.

## Layout

- Eight entry points, all built by tsup: `src/index.ts` is the package root, `src/jp/index.ts` is `@johnmorrisdotca/address-plus/jp`, and `src/au/index.ts`, `src/de/index.ts`, `src/fr/index.ts` and `src/gb/index.ts` are the country modules `/au`, `/de`, `/fr` and `/gb`. The `/jp` bundle must not carry the US street-type tables, and `/au`, `/de`, `/fr` and `/gb` must carry none of the US, Canadian or Japanese tables nor each other's; `pnpm test:package` fails if they do. Keep those modules from importing anything that pulls in another country's tables. The main entry point never imports a country module: it takes them in the `countries` option (`src/country/pick.ts`). `docs/COUNTRIES.md` says how to add a country.
- `src/parser.ts` reads the country and the kind of address and hands the text on; `src/parsers/` holds a parser for each kind (military, rural route, PO box, intersection, informal) and `src/parsers/standard/` the US and Canadian street address in stages: `facility.ts` reads the first comma part, `locality-single-line.ts` and `locality-commas.ts` take the city, state and ZIP off the end, `street-line.ts` reads the number, the directionals, the unit and the street type, `finish.ts` writes the result, and `standard-parser.ts` runs them in that order. `src/parsers/standard/patterns.ts` holds the regular expressions those stages build from the tables, made once on first use: build a pattern there, never inside a call, because rebuilding them was four fifths of the time a US address took.
- Japan is `src/jp/`: `parse.ts` detects and starts, `parse-script.ts` and `parse-romaji.ts` read the two ways of writing an address, and `address-parts.ts` holds the block, town and building parts they share. `src/constants/` holds the tables; `src/patterns/` holds every other regular expression; `src/utils/` holds shared helpers; `src/types/` holds the types.
- Every source file holds at most 500 lines of code: `pnpm check:size` fails above that. Split a file that grows by what it does, never by trimming comments. A long table goes in a `*.data.ts` file, which the gate does not count. `demo/*.js` is held to the same by `scripts/demo-size.test.mjs`.
- The demo is `demo/demo.js` (the page: its panels' examples, the example buttons, render and start-up) with one module for each part: `shared.js` (language, words and the elements an answer is written with), `panel-parse.js`, `panel-validate.js`, `panel-format.js`, `panel-compare.js`, `panel-postal.js` and `panel-clean.js`, `fields.js`, `links.js` (the address bar and copy buttons), `extras.js` with its three tools in `extras-japan.js`, `extras-bulk.js` and `extras-corpus.js`, and the words in `words-en.js` and `words-ja.js`. A module the page imports must export every name another imports: only the demo's browser tests (`pnpm test:demo`) catch a missing one.
- Tests are in `src/__tests__/`. Their data is JSON in `test-data/`, one folder per area, validated against `schemas/`. Test-only scripts live in `scripts/*.test.mjs`.
- `scripts/*.js` (the old debug scripts) are not linted; leave them alone.

## Generated data

Files named `*.data.ts` (the Japanese prefectures, municipalities and postal prefixes under `src/constants/jp/`) are written by `pnpm data:jp`, those under `src/constants/au/`, `src/constants/de/`, `src/constants/fr/` and `src/constants/gb/` by `pnpm data:countries`, and `src/constants/sub-regions.data.ts` is written by `pnpm data:sub-regions`. Never edit them by hand: change the generator in `scripts/` and run it again. Prettier ignores `*.data.ts`, so the generator's output does not have to be formatted.

The two big generated tables are written as packed text, not as objects: `municipalities.data.ts` one municipality to a line as `code|name|kana|romaji` and `sub-regions.data.ts` one sub-region to a line as `name|parentCity|state|type|alias~alias`. A small reader unpacks each (`src/constants/jp/unpack-municipalities.ts`, `src/constants/sub-regions.ts`), the sub-regions the first time a lookup asks and the municipalities when the module loads, behind a `/* @__PURE__ */` mark so a bundler can drop them from a build that never reads them. The packing is `scripts/jp/pack.ts` and `scripts/sub-regions/pack.ts`, and the tests in `src/__tests__/japan/packing.test.ts` and `src/__tests__/utilities/sub-regions.test.ts` hold the packed text to its reader. `src/constants/us-street-types.data.ts` is the one `*.data.ts` file kept by hand (USPS Publication 28): it is named so only because the size gate does not count a long table, and it is edited like any source.

## Release procedure

1. Add each change under `## Unreleased` in `CHANGELOG.md` as it lands, in Keep a Changelog style (`### Added`, `### Changed`, `### Fixed`).
2. From a clean `main`, run `pnpm release <version>` (for example `pnpm release 1.2.0`). It refuses a dirty tree, a branch other than `main`, an empty Unreleased section, and a version that is not greater than the current one. Otherwise it sets the version in `package.json`, moves the Unreleased entries under `## <version> - <today>`, commits `chore(release): <version>`, and tags `v<version>`. It pushes nothing.
3. Push the commit and the tag: `git push origin main` then `git push origin v<version>`.
4. The tag starts `.github/workflows/release.yml`, which verifies the tag against `package.json` and the changelog, reruns `pnpm check` (the `ci.yml` workflow), publishes to npm with provenance, and creates the GitHub release with the changelog section as its notes. The npm step publishes with trusted publishing, so there is no token: the package's Trusted Publisher setting on npmjs.com names the `johnmorrisdotca` organization or user, the `address-plus` repository and the `release.yml` workflow filename, with no environment.

Never change the version by hand, and never publish from a laptop: the tag does it.

## Commits

Plain-English messages that say what changed and why. No AI attribution of any kind: no co-author trailer, no "generated with" line, no mention of an assistant.

## Documentation site

`pnpm docs:check` builds and strictly checks imported API/guide examples. `pnpm docs:legacy-check` retains expected-answer and published-declaration checks. `pnpm docs:site` adds the bilingual site, preserved API anchors, local search and llms files after `pnpm site`. `pnpm docs:make` retains the full Markdown reference. The two optional field entries are `/element` and `/element/define`. Shared docs/README files remain unchanged and are excluded from local reformatting because their hashes are checked.

The JP and country writers accept `--docs-only` to refresh stored public-table examples without fetching or changing source data or metadata. Normal data generation continues to own those files.
