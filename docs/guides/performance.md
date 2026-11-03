---
title: Speed, size and what loads
section: explanation
order: 13
description: What a parse costs, what an import costs and what each entry point carries, with the numbers before and after the speed work.
---

## Know what a parse costs

A US or Canadian address is parsed in about 10 microseconds, over 200 times faster than before. The time went to rebuilding, for every address, the regular expressions made from the street-type, state and directional tables; they are now made once, on first use. The other countries were already fast and are unchanged.

| Corpus (addresses per second, higher is better) | Before | After |
| ----------------------------------------------- | -----: | ----: |
| United States (1,082 addresses)                 |    450 | 109,415 |
| Canada (508 addresses)                          |    460 | 98,921 |
| Japan (1,101 addresses)                         | 73,656 | 82,656 |
| Australia (258 addresses)                       | 237,335 | 263,893 |
| United Kingdom (175 addresses)                  | 203,042 | 198,684 |
| Germany (144 addresses)                         | 198,451 | 178,182 |
| France (186 addresses)                          | 104,799 | 134,949 |

The countries other than the US and Canada differ by what the machine was doing at the time (the two runs were back to back on one laptop; a second pair gave the same picture), not by anything that changed for them. The first parse in a process is slower than the rest, about 20 milliseconds, because the engine compiles each pattern the first time it runs.

## Know what an import costs

| Entry point         | Minified, before | Minified, after | Gzipped, before | Gzipped, after |
| ------------------- | ---------------: | --------------: | --------------: | -------------: |
| `.` (root)          |          597,494 |         431,260 |         105,712 |        101,758 |
| `./jp`              |          332,967 |         242,405 |          60,583 |         57,463 |
| `./au`, `./gb`, `./de`, `./fr` |  unchanged |       unchanged |       unchanged |      unchanged |
| `./element`         |          670,085 |         503,770 |         133,035 |        130,080 |

Bytes, bundled and minified with esbuild and gzipped at level 9, the way `pnpm size` measures them. In a fresh Node process, importing the root takes about 20 milliseconds, down from about 41, and `/jp` about 15, down from about 25.

## Know what loads for what

- The root reads US, Canadian and Japanese addresses from one function, so it carries all three countries' tables. A caller who only reads Japanese addresses can import `/jp`, which does not carry the US street types.
- Australia, France, Germany and the United Kingdom are separate entry points that carry none of the others' tables; the root never imports them, you pass them in `countries`.
- The two largest tables, the Japanese municipalities and the US and Canadian sub-regions, are stored as packed text, one row to a line, which is a fraction of the size of the same rows written as objects. The sub-regions are unpacked the first time a facility's locality is looked up; the Japanese lookup indexes are built the first time a Japanese address is read.
- A bundler can drop the Japanese tables from a build that never reads them, because their unpacking is marked as free of side effects.

Parsing stays synchronous, so a table cannot be fetched when it is needed; splitting the root into one entry point per country would change what `parseLocation` reads, and has not been done.

## Measure it yourself

```sh
pnpm bench
```

`pnpm bench` builds the package and prints parse speed over each country's corpus (`test-data/corpus`), the time a fresh process takes to import an entry point and parse one address, and the size of every entry point. `node scripts/benchmark.mjs --json` prints the same as data.

## Keep it fast

- Build a regular expression from the tables once, in `src/parsers/standard/patterns.ts` or at module level, never inside a function that runs for every address.
- Keep each source file under 500 lines of code (`pnpm check:size`), and each demo script under the same.
- Run `pnpm bench` before and after a change to a parser stage.
