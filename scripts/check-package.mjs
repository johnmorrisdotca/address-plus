/**
 * Proves the built package works the way a user gets it: `pnpm test:package` (after `pnpm build`).
 *
 * It packs the package, installs the tarball into a temporary project, and checks that
 *   - require() and import of the main entry both work and expose parseLocation;
 *   - the ./jp, ./au, ./gb, ./fr and ./de entries work from both and expose their parsers;
 *   - the types of every entry resolve under the Node16 and bundler module resolutions;
 *   - the ./jp bundle, and every chunk it loads, carries none of the US street-type tables, so a Japan-only user does
 *     not ship them; and the ./au, ./gb, ./fr and ./de bundles carry none of the US, Canadian or Japanese tables, nor each other's.
 *
 * It prints what it proved and exits non-zero on the first failure.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const PACKAGE_NAME = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).name;
// A word only the US street-type tables carry; the Japan entry has no use for it.
const US_ONLY_WORD = "boulevard";
// Words only one table carries: the US street types, the US and Canadian sub-regions, Japan's municipalities,
// Australia's street types, Britain's postcode areas, France's departments and Germany's Länder. A country entry must carry none but its own.
const TABLE_WORDS = {
  us: "trafficway",
  subRegions: "burnaby",
  japan: "千代田区",
  australia: "Anchorage",
  britain: "Galashiels",
  france: "Haute-Garonne",
  germany: "Mecklenburg-Vorpommern",
};
const FORBIDDEN = {
  au: [
    TABLE_WORDS.us,
    TABLE_WORDS.subRegions,
    TABLE_WORDS.japan,
    TABLE_WORDS.britain,
    TABLE_WORDS.france,
    TABLE_WORDS.germany,
  ],
  gb: [
    TABLE_WORDS.us,
    TABLE_WORDS.subRegions,
    TABLE_WORDS.japan,
    TABLE_WORDS.australia,
    TABLE_WORDS.france,
    TABLE_WORDS.germany,
  ],
  fr: [
    TABLE_WORDS.us,
    TABLE_WORDS.subRegions,
    TABLE_WORDS.japan,
    TABLE_WORDS.australia,
    TABLE_WORDS.britain,
    TABLE_WORDS.germany,
  ],
  de: [
    TABLE_WORDS.us,
    TABLE_WORDS.subRegions,
    TABLE_WORDS.japan,
    TABLE_WORDS.australia,
    TABLE_WORDS.britain,
    TABLE_WORDS.france,
  ],
};

const proved = [];

function fail(message) {
  console.error(`test:package FAILED: ${message}`);
  process.exitCode = 1;
  throw new Error(message);
}

function run(command, args, cwd) {
  try {
    return execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    const output = `${error.stdout ?? ""}${error.stderr ?? ""}`.trim();
    return fail(`${command} ${args.join(" ")}\n${output}`);
  }
}

function prove(claim) {
  proved.push(claim);
  console.log(`  ok  ${claim}`);
}

// The relative files a built module loads: static imports, re-exports and require() calls.
function localImports(source) {
  const found = new Set();
  const pattern = /(?:from\s*|import\s*|require\()\s*["'](\.{1,2}\/[^"']+)["']/g;
  for (const match of source.matchAll(pattern)) found.add(match[1]);
  return [...found];
}

// Every file reachable from an entry through relative imports.
function reachableFiles(entry) {
  const seen = new Set();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    for (const target of localImports(readFileSync(file, "utf8"))) queue.push(resolve(dirname(file), target));
  }
  return [...seen];
}

function checkEntry(project, entry, exportName) {
  const specifier = entry === "." ? PACKAGE_NAME : `${PACKAGE_NAME}/${entry.slice(2)}`;
  const esm = run(
    "node",
    [
      "--input-type=module",
      "-e",
      `const m = await import(${JSON.stringify(specifier)}); console.log(typeof m.${exportName});`,
    ],
    project,
  );
  if (esm !== "function") fail(`import("${specifier}") does not expose ${exportName} (got ${esm})`);
  prove(`import("${specifier}") exposes ${exportName}`);

  const cjs = run("node", ["-e", `console.log(typeof require(${JSON.stringify(specifier)}).${exportName});`], project);
  if (cjs !== "function") fail(`require("${specifier}") does not expose ${exportName} (got ${cjs})`);
  prove(`require("${specifier}") exposes ${exportName}`);
}

function checkTypes(project) {
  writeFileSync(
    join(project, "types.ts"),
    [
      `import { parseLocation, type ParsedAddress } from "${PACKAGE_NAME}";`,
      `import { parseJapaneseAddress } from "${PACKAGE_NAME}/jp";`,
      `import { australia, parseAustralianAddress } from "${PACKAGE_NAME}/au";`,
      `import { parseUKAddress, unitedKingdom } from "${PACKAGE_NAME}/gb";`,
      `import { france, parseFrenchAddress } from "${PACKAGE_NAME}/fr";`,
      `import { germany, parseGermanAddress } from "${PACKAGE_NAME}/de";`,
      `import { AddressField, defineField, type AddressFieldOptions } from "${PACKAGE_NAME}/element";`,
      "const fieldOptions: AddressFieldOptions = { parse: { strict: true } };",
      "console.log(typeof AddressField, typeof defineField, fieldOptions.parse?.strict);",
      "",
      "const us: ParsedAddress | null = parseLocation('1600 Pennsylvania Avenue NW, Washington, DC 20500');",
      "const jp = parseJapaneseAddress('東京都千代田区千代田1-1');",
      "const au: ParsedAddress | null = parseAustralianAddress('3/12 Smith St, Parramatta NSW 2150');",
      "const gb: ParsedAddress | null = parseUKAddress('10 Downing Street, London SW1A 2AA');",
      "const fr: ParsedAddress | null = parseFrenchAddress('12 rue de la Paix, 75002 Paris');",
      "const de: ParsedAddress | null = parseGermanAddress('Hauptstraße 12, 10115 Berlin');",
      "const either = parseLocation('10 Downing Street, London SW1A 2AA', { countries: [australia, france, germany, unitedKingdom] });",
      "console.log(us, jp, au, gb, fr, de, either?.country);",
      "",
    ].join("\n"),
  );
  const tsc = join(root, "node_modules", "typescript", "bin", "tsc");
  for (const resolution of ["node16", "bundler"]) {
    const options = resolution === "node16" ? ["--module", "node16"] : ["--module", "esnext"];
    run(
      "node",
      [
        tsc,
        "--noEmit",
        "--strict",
        "--skipLibCheck",
        "--target",
        "es2022",
        ...options,
        "--moduleResolution",
        resolution,
        "types.ts",
      ],
      project,
    );
    prove(`types of every entry point resolve with moduleResolution ${resolution}`);
  }
}

function checkJpBundle(installed) {
  for (const file of ["dist/jp/index.js", "dist/jp/index.cjs"]) {
    const entry = join(installed, file);
    if (!existsSync(entry)) fail(`${file} is missing from the packed package`);
    const files = reachableFiles(entry);
    for (const reached of files) {
      if (readFileSync(reached, "utf8").toLowerCase().includes(US_ONLY_WORD)) {
        fail(
          `${file} carries the US street-type tables: "${US_ONLY_WORD}" appears in ${reached.slice(installed.length + 1)}`,
        );
      }
    }
    prove(`${file} and the ${files.length - 1} file(s) it loads carry no US street-type tables`);
  }
}

function checkCountryBundles(installed) {
  for (const [country, words] of Object.entries(FORBIDDEN)) {
    for (const file of [`dist/${country}/index.js`, `dist/${country}/index.cjs`]) {
      const entry = join(installed, file);
      if (!existsSync(entry)) fail(`${file} is missing from the packed package`);
      const files = reachableFiles(entry);
      for (const reached of files) {
        const text = readFileSync(reached, "utf8");
        const found = words.find((word) => text.includes(word));
        if (found)
          fail(`${file} carries another country's table: "${found}" appears in ${reached.slice(installed.length + 1)}`);
      }
      prove(`${file} and the ${files.length - 1} file(s) it loads carry no other country's tables`);
    }
  }
}

function main() {
  for (const file of [
    "dist/index.js",
    "dist/index.cjs",
    "dist/index.d.ts",
    "dist/jp/index.js",
    "dist/jp/index.cjs",
    "dist/jp/index.d.ts",
    "dist/au/index.js",
    "dist/au/index.cjs",
    "dist/au/index.d.ts",
    "dist/gb/index.js",
    "dist/gb/index.cjs",
    "dist/gb/index.d.ts",
    "dist/fr/index.js",
    "dist/fr/index.cjs",
    "dist/fr/index.d.ts",
    "dist/de/index.js",
    "dist/de/index.cjs",
    "dist/de/index.d.ts",
  ]) {
    if (!existsSync(join(root, file))) fail(`${file} does not exist; run pnpm build first`);
  }

  const scratch = mkdtempSync(join(tmpdir(), "address-plus-package-"));
  try {
    const packs = join(scratch, "packs");
    const project = join(scratch, "project");
    mkdirSync(packs);
    mkdirSync(project);

    console.log("Packing and installing the package in a temporary project");
    run("pnpm", ["pack", "--pack-destination", packs], root);
    const tarball = readdirSync(packs).find((name) => name.endsWith(".tgz"));
    if (!tarball) return fail("pnpm pack produced no tarball");
    writeFileSync(
      join(project, "package.json"),
      JSON.stringify({ name: "check-package", private: true, type: "module" }),
    );
    run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", join(packs, tarball)], project);
    prove(`the packed ${tarball} installs`);

    checkEntry(project, ".", "parseLocation");
    checkEntry(project, "./jp", "parseJapaneseAddress");
    checkEntry(project, "./au", "parseAustralianAddress");
    checkEntry(project, "./gb", "parseUKAddress");
    checkEntry(project, "./fr", "parseFrenchAddress");
    checkEntry(project, "./de", "parseGermanAddress");
    checkEntry(project, "./element", "defineField");
    checkEntry(project, "./element/define", "defineField");
    checkTypes(project);
    checkJpBundle(join(project, "node_modules", ...PACKAGE_NAME.split("/")));
    checkCountryBundles(join(project, "node_modules", ...PACKAGE_NAME.split("/")));
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }

  console.log(`\ntest:package passed: ${proved.length} things proved about the packed package.`);
}

try {
  main();
} catch {
  // fail() has already printed the reason and set the exit code.
}
