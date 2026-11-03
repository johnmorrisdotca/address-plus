// benchmark.mjs: how fast the built package parses, how long it takes to load, and how big each entry point is.
//
//   pnpm build && node scripts/benchmark.mjs [--json] [--rounds 7]
//
// Parse speed: every input of a country's corpus (test-data/corpus/<country>/*.json, the cases that must parse) is
// handed to parseLocation, as the corpus tests hand it, with the module and hint the country needs. A pass over the
// whole set is timed, the first passes are thrown away as warm-up, and the median of the rest is reported as
// addresses per second. Load time: a fresh `node` imports the entry and parses one address, a number of times, and
// the median is reported. Size: each entry point minified and gzipped the way `pnpm size` measures it.
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { measureBundles } from "./docs-site.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const corpusRoot = join(root, "test-data", "corpus");
const args = process.argv.slice(2);
const asJson = args.includes("--json");
const roundsAt = args.indexOf("--rounds");
const ROUNDS = roundsAt >= 0 ? Number(args[roundsAt + 1]) : 7;
const WARMUP_PASSES = 3;
const MIN_PASS_MS = 150;

// Corpus folder, label, and for a country module the export and the hint that select it from the root's parseLocation.
const COUNTRIES = [
  { folder: "us", label: "United States", hint: undefined },
  { folder: "canada", label: "Canada", hint: undefined },
  { folder: "japan", label: "Japan", hint: undefined },
  { folder: "au", label: "Australia", hint: "AU", module: "australia" },
  { folder: "gb", label: "United Kingdom", hint: "GB", module: "unitedKingdom" },
  { folder: "de", label: "Germany", hint: "DE", module: "germany" },
  { folder: "fr", label: "France", hint: "FR", module: "france" },
];

// The cases of a country's corpus that must parse, as { input, options } with the options each case names.
function casesOf(folder) {
  const folderPath = join(corpusRoot, folder);
  const cases = [];
  for (const file of readdirSync(folderPath)
    .filter((name) => name.endsWith(".json"))
    .sort()) {
    const data = JSON.parse(readFileSync(join(folderPath, file), "utf8"));
    for (const group of Object.values(data.tests ?? {})) {
      for (const one of group) {
        if (one.expected === null || one.todo) continue;
        cases.push({ input: one.input, options: one.options ?? {} });
      }
    }
  }
  return cases;
}

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

/** Addresses per second for one country's corpus. */
async function parseSpeed(country, parseLocation) {
  const cases = casesOf(country.folder);
  let extra = {};
  if (country.module) {
    const module = (await import(pathToFileURL(join(root, `dist/${country.folder}/index.js`)).href))[country.module];
    extra = { country: country.hint, countries: [module] };
  }
  const pass = () => {
    for (const one of cases) parseLocation(one.input, { ...extra, ...one.options });
  };
  for (let index = 0; index < WARMUP_PASSES; index++) pass();
  const samples = [];
  for (let round = 0; round < ROUNDS; round++) {
    let passes = 0;
    const started = performance.now();
    while (performance.now() - started < MIN_PASS_MS) {
      pass();
      passes++;
    }
    samples.push((cases.length * passes) / ((performance.now() - started) / 1000));
  }
  return { cases: cases.length, perSecond: Math.round(median(samples)) };
}

// A fresh process imports the entry and parses one address; the milliseconds it took to import, and to parse.
const LOAD_PROBE = `
const started = performance.now();
const module = await import(process.argv[1]);
const imported = performance.now() - started;
const parse = module.parseLocation ?? module.parseJapaneseAddress;
const first = performance.now();
parse(process.argv[2]);
console.log(JSON.stringify({ imported, firstParse: performance.now() - first }));
`;

function loadTime(entry, sample) {
  const imported = [];
  const first = [];
  for (let run = 0; run < ROUNDS; run++) {
    const out = spawnSync(
      process.execPath,
      ["--input-type=module", "-e", LOAD_PROBE, pathToFileURL(join(root, entry)).href, sample],
      { encoding: "utf8" },
    );
    if (out.status !== 0) throw new Error(`${entry}: ${out.stderr}`);
    const one = JSON.parse(out.stdout);
    imported.push(one.imported);
    first.push(one.firstParse);
  }
  return { importMs: Number(median(imported).toFixed(1)), firstParseMs: Number(median(first).toFixed(1)) };
}

const { parseLocation } = await import(pathToFileURL(join(root, "dist/index.js")).href);
const speeds = {};
for (const country of COUNTRIES) {
  speeds[country.label] = await parseSpeed(country, parseLocation);
}

const loads = {
  ".": loadTime("dist/index.js", "1600 Pennsylvania Ave NW, Washington, DC 20500"),
  "./jp": loadTime("dist/jp/index.js", "東京都千代田区丸の内1丁目2番3号"),
};
const sizes = (await measureBundles(root)).entries;

if (asJson) {
  console.log(JSON.stringify({ node: process.version, rounds: ROUNDS, speeds, loads, sizes }, null, 2));
} else {
  console.log(`node ${process.version}, median of ${ROUNDS} rounds\n`);
  console.log("Parse speed (addresses per second over the country's corpus)");
  for (const [label, speed] of Object.entries(speeds)) {
    console.log(`  ${label.padEnd(16)} ${String(speed.perSecond).padStart(9)}  (${speed.cases} addresses)`);
  }
  console.log("\nLoad time in a fresh process (ms)");
  for (const [entry, load] of Object.entries(loads)) {
    console.log(
      `  ${entry.padEnd(16)} import ${String(load.importMs).padStart(6)}   first parse ${String(load.firstParseMs).padStart(6)}`,
    );
  }
  console.log("\nSize (bytes, bundled and minified / gzip level 9)");
  for (const [entry, size] of Object.entries(sizes)) {
    console.log(`  ${entry.padEnd(16)} ${String(size.minified).padStart(8)} / ${String(size.gzip).padStart(7)}`);
  }
}
