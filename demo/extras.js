// The demo's larger tools, beside the six panels in demo.js: a list pasted whole and saved as CSV, JSON, text, Markdown or SQL; a
// Japanese address taken apart, each part beside its reading and romaji; and the test corpus, fetched only when asked
// for and run in this browser. Everything typed or returned is set as text, never as HTML.
import { toMarkdown, toSql } from "./downloads.js";
import { australia, formatAustraliaPost } from "./lib/au.js";
import { formatDeutschePost, germany } from "./lib/de.js";
import { formatLaPoste, france } from "./lib/fr.js";
import { formatRoyalMail, unitedKingdom } from "./lib/gb.js";
import {
  findMunicipalityByCode,
  findPrefecture,
  formatCanadaPost,
  formatJapanese,
  formatJapaneseEnglish,
  formatUSPS,
  getPrefectureFromJapanesePostalCode,
  parseLocation,
  validateAddress,
  validateJapaneseAddress,
} from "./lib/index.js";

// Australia, France, Germany and the United Kingdom are read by their own modules, handed to the parser and the validator.
const COUNTRIES = [australia, france, germany, unitedKingdom];
const BRITISH = new Set(["GB", "JE", "GY", "IM"]);
const FRENCH = new Set(["FR", "MC", "PM", "BL", "MF", "WF", "PF", "NC"]);

// The most lines the list reads at once, so a paste of a whole file cannot stall the page.
const BULK_LIMIT = 500;
// The most corpus cases listed at once; the filters narrow the rest.
const CORPUS_SHOWN = 60;
// The fields a corpus case is judged on when it does not name them, as src/__tests__/corpus/corpus-support.ts does.
const CORE = {
  us: [
    "number",
    "prefix",
    "street",
    "type",
    "suffix",
    "secUnitType",
    "secUnitNum",
    "city",
    "state",
    "zip",
    "plus4",
    "country",
  ],
  japan: [
    "postalCode",
    "prefecture",
    "municipality",
    "streetDirections",
    "town",
    "chome",
    "ban",
    "go",
    "building",
    "floor",
    "room",
    "country",
  ],
  au: [
    "building",
    "secUnitType",
    "secUnitNum",
    "floorType",
    "floor",
    "lot",
    "number",
    "street",
    "type",
    "suffix",
    "city",
    "state",
    "zip",
    "country",
  ],
  fr: [
    "careOf",
    "building",
    "secUnitType",
    "secUnitNum",
    "floorType",
    "floor",
    "staircase",
    "entrance",
    "number",
    "numberExtension",
    "type",
    "street",
    "lieuDit",
    "postalBoxType",
    "postalBoxNum",
    "city",
    "arrondissement",
    "cedex",
    "state",
    "zip",
    "country",
  ],
  de: [
    "careOf",
    "building",
    "secUnitType",
    "secUnitNum",
    "floorType",
    "floor",
    "street",
    "number",
    "locality",
    "city",
    "state",
    "zip",
    "country",
  ],
  gb: [
    "subBuilding",
    "secUnitType",
    "secUnitNum",
    "floorType",
    "floor",
    "building",
    "number",
    "dependentThoroughfare",
    "street",
    "type",
    "doubleDependentLocality",
    "locality",
    "city",
    "county",
    "bfpo",
    "zip",
    "nation",
    "country",
  ],
};
CORE.canada = CORE.us;

// A mixed list for the "try" button: tidy and untidy, seven countries, one line that is not an address.
export const BULK_SAMPLE = [
  "1600 Pennsylvania Ave NW, Washington, DC 20500",
  "350 FIFTH AVENUE, NEW YORK, NY 10118",
  "123 Main St Apt 4, Seattle, NY 98101",
  "PO Box 1234, Springfield, IL 62701",
  "100 Queen St W, Toronto, ON M5H 2N2",
  "1234 rue Sainte-Catherine O, Montréal, QC H3G 1P1",
  "4-123 Main St, Vancouver BC V5Y 1V4",
  "〒100-0005 東京都千代田区丸の内1丁目2番3号 サンプルビル5階",
  "1-2-3 Marunouchi, Chiyoda-ku, Tokyo 100-0005, Japan",
  "〒530-0001 東京都千代田区丸の内1-2-3",
  "3/12 Smith St, Parramatta NSW 2150",
  "LEVEL 6 51 JACOBSON ST, BRISBANE VIC 4000",
  "Résidence Les Lilas, Apt 12, 4 bis av. des Écoles, 31000 Toulouse",
  "15 BOULEVARD HAUSSMANN, 75009 PARIS CEDEX 09",
  "c/o Weber, Hinterhaus, Kastanienallee 4 b, 10435 Berlin",
  "Am Markt 5, 01067 Dresden",
  "Flat 2, Rose Court, 14 High St, Kingsbury, London NW9 0AA",
  "10 downing street, london sw1a2aa",
  "see attached",
].join("\n");

/** Set up the three tools. `kit` is what demo.js shares: words, helpers and the page's state. */
export function setUpExtras(kit) {
  const { $, say, facts, note, fine, badge, quote, show, json } = kit;
  const cell = (tag, text, className) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text ?? "";
    return element;
  };

  // ----- Japan, part by part ------------------------------------------------------------------------------------

  /** One row of the parts table: the part, as written, its reading, its romaji and its code. */
  function partRow(label, key, written, reading = "", romaji = "", code = "") {
    const row = document.createElement("tr");
    const head = cell("th", label);
    head.scope = "row";
    head.append(cell("code", key));
    const columns = [
      [written, "written", "japan_written"],
      [reading, "reading", "japan_reading"],
      [romaji, "romaji", "japan_romaji"],
      [code, "code", "japan_code"],
    ];
    // Each value carries its column's name, which a phone shows beside it when the table is laid out as cards.
    row.append(
      head,
      ...columns.map(([value, className, label]) => {
        const element = cell("td", value, className);
        element.dataset.label = say(label);
        if (!value) element.dataset.empty = "true";
        return element;
      }),
    );
    return row;
  }

  function japan() {
    const text = $("japan-input").value;
    const out = $("japan-answer");
    const address = parseLocation(text, { country: "JP" });
    if (address === null) {
      note(out, say("japan_none"));
      json("japan", null);
      show("japan-call", `parseJapaneseAddress(${quote(text)})  // null`);
      return;
    }
    const parts = say("japan_parts");
    const table = document.createElement("table");
    table.className = "parts";
    const headings = document.createElement("tr");
    for (const key of ["japan_part", "japan_written", "japan_reading", "japan_romaji", "japan_code"]) {
      const heading = cell("th", say(key));
      heading.scope = "col";
      headings.append(heading);
    }
    const head = document.createElement("thead");
    head.append(headings);
    const body = document.createElement("tbody");
    if (address.postalCode) {
      const delivered = findPrefecture(getPrefectureFromJapanesePostalCode(address.postalCode) ?? "");
      body.append(
        partRow(
          parts.postalCode,
          "postalCode",
          `〒${address.postalCode}`,
          "",
          "",
          delivered ? say("japan_delivers", { name: delivered.name }) : say("japan_unknown"),
        ),
      );
    }
    const prefecture = address.prefectureCode ? findPrefecture(address.prefectureCode) : null;
    if (address.prefecture) {
      body.append(
        partRow(
          parts.prefecture,
          "prefecture",
          address.prefecture,
          prefecture?.kana,
          prefecture?.romaji,
          address.prefectureCode,
        ),
      );
    }
    const municipality = address.municipalityCode ? findMunicipalityByCode(address.municipalityCode) : null;
    if (address.municipality) {
      body.append(
        partRow(
          parts.municipality,
          "municipality",
          address.municipality,
          municipality?.kana,
          municipality?.romaji,
          address.municipalityCode ?? say("japan_unknown"),
        ),
      );
    }
    if (address.streetDirections)
      body.append(partRow(parts.streetDirections, "streetDirections", address.streetDirections));
    if (address.town) body.append(partRow(parts.town, "town", address.town));
    if (address.block) {
      const markers = [
        address.chome && `${address.chome}丁目`,
        address.ban && `${address.ban}番`,
        address.go && `${address.go}号`,
      ]
        .filter(Boolean)
        .join("");
      const english = [
        address.chome && `chome ${address.chome}`,
        address.ban && `ban ${address.ban}`,
        address.go && `go ${address.go}`,
      ]
        .filter(Boolean)
        .join(", ");
      body.append(partRow(parts.block, "block", address.block, markers, english));
    }
    if (address.building) body.append(partRow(parts.building, "building", address.building));
    if (address.floor)
      body.append(
        partRow(
          parts.floor,
          "floor",
          address.floor.startsWith("B") ? `地下${address.floor.slice(1)}階` : `${address.floor}階`,
          "",
          `${address.floor}F`,
        ),
      );
    if (address.room) body.append(partRow(parts.room, "room", `${address.room}号室`, "", `Room ${address.room}`));
    table.append(head, body);
    const wrap = document.createElement("div");
    wrap.className = "parts-wrap";
    wrap.append(table);

    const japanese = formatJapanese(address, { blockStyle: "markers" });
    const english = formatJapaneseEnglish(address);
    const check = validateJapaneseAddress(address);
    const findings = [...check.errors, ...check.warnings];
    const verdict = document.createElement("span");
    verdict.className = "verdict";
    verdict.append(badge(findings.length === 0));
    for (const finding of findings)
      verdict.append(cell("code", finding.code), cell("span", finding.message, "fam-muted"));
    out.replaceChildren(wrap);
    const rest = document.createElement("div");
    facts(rest, [
      [say("japan_japanese"), kit.lines(japanese), "formatJapanese"],
      [say("japan_english"), kit.lines(english), "formatJapaneseEnglish"],
      [say("japan_check"), verdict, "validateJapaneseAddress"],
    ]);
    out.append(...rest.childNodes);
    json("japan", address);
    show(
      "japan-call",
      `const address = parseJapaneseAddress(${quote(text)});\nformatJapanese(address, { blockStyle: "markers" })  // ${quote(japanese)}\nformatJapaneseEnglish(address)  // ${quote(english)}`,
    );
  }

  // ----- Paste a list ------------------------------------------------------------------------------------------

  /** One line of the list, read, checked and written the post office's way. */
  function readLine(input) {
    const parsed = parseLocation(input, { countries: COUNTRIES });
    if (parsed === null) return { input, parsed: null, findings: [], formatted: "" };
    const findings =
      parsed.country === "JP"
        ? (() => {
            const check = validateJapaneseAddress(parsed);
            return [...check.errors, ...check.warnings];
          })()
        : (() => {
            const check = validateAddress(input, { countries: COUNTRIES });
            return [...check.errors, ...check.warnings];
          })();
    let formatted;
    if (parsed.country === "AU") formatted = formatAustraliaPost(parsed).lines.join(", ");
    else if (parsed.country === "DE") formatted = formatDeutschePost(parsed).lines.join(", ");
    else if (FRENCH.has(parsed.country)) formatted = formatLaPoste(parsed).lines.join(", ");
    else if (BRITISH.has(parsed.country)) formatted = formatRoyalMail(parsed).lines.join(", ");
    else if (parsed.country === "JP") formatted = formatJapanese(parsed, { multiline: false });
    else if (parsed.country === "CA") formatted = formatCanadaPost(parsed).lines.join(", ");
    else formatted = formatUSPS(parsed).lines.join(", ");
    return { input, parsed, findings, formatted };
  }

  /** The columns of the table and the CSV, each with how it is read from a line's result. */
  const unitOf = (parsed) => [parsed.secUnitType, parsed.secUnitNum].filter(Boolean).join(" ");
  const streetOf = (parsed) =>
    parsed.country === "JP"
      ? [parsed.streetDirections, parsed.town].filter(Boolean).join("")
      : [parsed.prefix, parsed.street, parsed.type, parsed.suffix].filter(Boolean).join(" ");
  const regionOf = (parsed) => (parsed.country === "JP" ? parsed.prefecture : (parsed.state ?? parsed.nation));
  const COLUMNS = [
    ["input", (row) => row.input],
    ["country", (row) => row.parsed?.country ?? ""],
    ["number", (row) => row.parsed?.number ?? ""],
    ["street", (row) => (row.parsed ? streetOf(row.parsed) : "")],
    [
      "unit",
      (row) =>
        row.parsed
          ? row.parsed.country === "JP"
            ? [row.parsed.building, row.parsed.floor && `${row.parsed.floor}F`, row.parsed.room]
                .filter(Boolean)
                .join(" ")
            : unitOf(row.parsed)
          : "",
    ],
    ["city", (row) => row.parsed?.city ?? ""],
    ["region", (row) => (row.parsed ? (regionOf(row.parsed) ?? "") : "")],
    ["postal", (row) => [row.parsed?.zip, row.parsed?.plus4].filter(Boolean).join("-")],
    [
      "check",
      (row) =>
        row.parsed === null
          ? ""
          : row.findings.length === 0
            ? "OK"
            : row.findings.map((finding) => finding.code).join(" "),
    ],
    ["formatted", (row) => row.formatted],
  ];
  let bulkRows = [];

  function bulk() {
    const lines = $("bulk-input")
      .value.split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const taken = lines.slice(0, BULK_LIMIT);
    bulkRows = taken.map(readLine);
    const summary = $("bulk-summary");
    const table = $("bulk-table");
    if (bulkRows.length === 0) {
      note(summary, say("bulk_empty"));
      table.replaceChildren();
      show("bulk-call", "parseLocations([])  // []");
      setDownloads(false);
      return;
    }
    // The summary: how many were read, by country, and how many hold together, with a bar for the shares.
    // A line read without a country (a street alone) is read, but counted apart from those a country was found for.
    const counts = { US: 0, CA: 0, JP: 0, AU: 0, FR: 0, DE: 0, GB: 0, other: 0, none: 0 };
    let clean = 0;
    for (const row of bulkRows) {
      const country = row.parsed?.country;
      counts[
        row.parsed === null ? "none" : BRITISH.has(country) ? "GB" : FRENCH.has(country) ? "FR" : (country ?? "other")
      ] += 1;
      if (row.parsed && row.findings.length === 0) clean += 1;
    }
    const read = bulkRows.length - counts.none;
    const bar = document.createElement("div");
    bar.className = "share-bar";
    bar.setAttribute("role", "img");
    bar.setAttribute(
      "aria-label",
      Object.entries(counts)
        .filter(([, count]) => count > 0)
        .map(([key, count]) => `${say("bulk_kinds")[key]} ${count}`)
        .join(", "),
    );
    for (const [key, count] of Object.entries(counts)) {
      if (count === 0) continue;
      const piece = document.createElement("span");
      piece.dataset.kind = key;
      piece.style.flexGrow = String(count);
      piece.title = `${say("bulk_kinds")[key]}: ${count}`;
      bar.append(piece);
    }
    const legend = document.createElement("ul");
    legend.className = "legend";
    for (const [key, count] of Object.entries(counts)) {
      if (count === 0 && key === "other") continue;
      const item = document.createElement("li");
      item.dataset.kind = key;
      item.textContent = `${say("bulk_kinds")[key]} ${count}`;
      legend.append(item);
    }
    const headline = cell("p", say("bulk_summary", { read, total: bulkRows.length, clean }), "headline");
    summary.replaceChildren(headline, bar, legend);
    if (lines.length > BULK_LIMIT) fine(summary, say("bulk_limit", { limit: BULK_LIMIT }));

    // The table.
    const names = say("bulk_cols");
    const head = document.createElement("thead");
    const headings = document.createElement("tr");
    headings.append(cell("th", "#"));
    for (const [key] of COLUMNS) headings.append(cell("th", names[key]));
    head.append(headings);
    const body = document.createElement("tbody");
    bulkRows.forEach((row, index) => {
      const line = document.createElement("tr");
      line.dataset.state = row.parsed === null ? "none" : row.findings.length === 0 ? "good" : "warn";
      line.append(cell("td", String(index + 1), "n"));
      for (const [key, read] of COLUMNS) {
        const value = read(row);
        const element = cell("td", key === "check" && row.parsed === null ? say("bulk_unread") : value, key);
        if (key === "check" && row.parsed !== null) element.dataset.tone = row.findings.length === 0 ? "good" : "bad";
        line.append(element);
      }
      body.append(line);
    });
    table.replaceChildren(head, body);
    show(
      "bulk-call",
      `lines.map((line) => parseLocation(line, { countries: [australia, france, germany, unitedKingdom] })?.country ?? null)\n  // ${JSON.stringify(bulkRows.map((row) => row.parsed?.country ?? null))}`,
    );
    setDownloads(true);
  }

  function setDownloads(enabled) {
    for (const button of document.querySelectorAll("[data-download]")) button.disabled = !enabled;
  }

  /** A CSV field, quoted when it holds a comma, a quote or a line break. */
  const csvField = (value) => {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  // The CSV has every column of the table, then the Japanese fields, then Australia's, France's, Germany's and the UK's own,
  // so one file serves every country.
  const JAPAN_COLUMNS = [
    "prefecture",
    "municipality",
    "streetDirections",
    "town",
    "chome",
    "ban",
    "go",
    "building",
    "floor",
    "room",
    "floorType",
    "lot",
    "subBuilding",
    "dependentThoroughfare",
    "locality",
    "county",
    "nation",
    "bfpo",
    "careOf",
    "numberExtension",
    "staircase",
    "entrance",
    "lieuDit",
    "postalBoxType",
    "postalBoxNum",
    "cedex",
    "arrondissement",
  ];

  /** The file a download button saves: its name, its type and its text. */
  function fileOf(kind) {
    if (kind === "md" || kind === "sql") {
      const columns = [...COLUMNS.map(([key]) => key), ...JAPAN_COLUMNS];
      const records = bulkRows.map((row) =>
        Object.fromEntries([
          ...COLUMNS.map(([key, read]) => [key, read(row) === "" ? null : read(row)]),
          ...JAPAN_COLUMNS.map((key) => [key, row.parsed?.[key] ?? null]),
        ]),
      );
      return {
        name: `addresses.${kind === "md" ? "md" : "sql"}`,
        type: kind === "md" ? "text/markdown" : "application/sql",
        text: kind === "md" ? toMarkdown(columns, records) : toSql("addresses", columns, records),
      };
    }
    if (kind === "csv") {
      const header = [...COLUMNS.map(([key]) => key), ...JAPAN_COLUMNS].map(csvField).join(",");
      const body = bulkRows.map((row) =>
        [...COLUMNS.map(([, read]) => read(row)), ...JAPAN_COLUMNS.map((key) => row.parsed?.[key] ?? "")]
          .map(csvField)
          .join(","),
      );
      // A byte-order mark, so a spreadsheet opens the Japanese as Japanese.
      return { name: "addresses.csv", type: "text/csv", text: `\ufeff${[header, ...body].join("\r\n")}\r\n` };
    }
    if (kind === "json") {
      const records = bulkRows.map((row) => ({
        input: row.input,
        parsed: row.parsed,
        findings: row.findings.map(({ code, field, message, severity }) => ({ code, field, message, severity })),
        formatted: row.formatted || null,
      }));
      return { name: "addresses.json", type: "application/json", text: `${JSON.stringify(records, null, 2)}\n` };
    }
    // One cleaned address per line, the line as it was typed where it could not be read.
    const text = bulkRows.map((row) => row.formatted || row.input).join("\n");
    return { name: "addresses.txt", type: "text/plain", text: `${text}\n` };
  }

  function download(kind) {
    const { name, type, text } = fileOf(kind);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  $("bulk-input").addEventListener("input", () => {
    bulk();
    kit.remember();
  });
  document.querySelector('[data-testid="bulk-sample"]').addEventListener("click", () => {
    $("bulk-input").value = BULK_SAMPLE;
    bulk();
    kit.remember();
  });
  document.querySelector('[data-testid="bulk-clear"]').addEventListener("click", () => {
    $("bulk-input").value = "";
    bulk();
    kit.remember();
  });
  for (const button of document.querySelectorAll("[data-download]")) {
    button.addEventListener("click", () => download(button.dataset.download));
  }

  // ----- The corpus --------------------------------------------------------------------------------------------

  let corpus = null; // [{ …case, result, passes }], once loaded
  const filters = { country: "all", wrong: false, search: "" };

  const absent = (value) => value === undefined || value === null;
  /** Whether a result is what a case expects, by the rule the package's own corpus suites use. */
  function passes(testCase, result) {
    if (testCase.expected === null) return result === null;
    if (result === null) return false;
    const loose = new Set(testCase.ignoreCase ?? []);
    for (const [field, want] of Object.entries(testCase.expected)) {
      const got = result[field];
      if (absent(want)) {
        if (!absent(got)) return false;
      } else if (loose.has(field) && typeof want === "string" && typeof got === "string") {
        if (want.toLowerCase() !== got.toLowerCase()) return false;
      } else if (want !== got) return false;
    }
    if (!testCase.partial) {
      for (const field of CORE[testCase.country]) {
        if (!(field in testCase.expected) && !absent(result[field])) return false;
      }
    }
    return true;
  }

  async function loadCorpus() {
    const button = document.querySelector('[data-testid="corpus-load"]');
    button.disabled = true;
    button.textContent = say("corpus_loading");
    try {
      const response = await fetch("corpus.json");
      if (!response.ok) throw new Error(String(response.status));
      const cases = await response.json();
      corpus = cases.map((testCase) => {
        // Every case is read with the country modules, as the package's own suites read them.
        const result = parseLocation(testCase.input, { ...testCase.options, countries: COUNTRIES });
        return { ...testCase, result, passes: passes(testCase, result) };
      });
      button.hidden = true;
      document.querySelector('[data-testid="corpus-filters"]').hidden = false;
      corpusView();
    } catch {
      button.disabled = false;
      button.textContent = say("corpus_load");
      note(document.querySelector('[data-testid="corpus-summary"]'), say("corpus_failed"));
    }
  }

  function corpusSummary() {
    const summary = document.querySelector('[data-testid="corpus-summary"]');
    const rows = document.createElement("div");
    rows.className = "corpus-bars";
    for (const country of ["us", "canada", "japan", "au", "fr", "de", "gb"]) {
      const cases = corpus.filter((one) => one.country === country);
      const passing = cases.filter((one) => one.passes).length;
      const line = document.createElement("div");
      line.className = "corpus-bar";
      line.setAttribute("data-testid", `corpus-bar-${country}`);
      const label = cell("span", say(`corpus_${country}`), "label");
      const meter = document.createElement("span");
      meter.className = "meter";
      meter.setAttribute("role", "img");
      meter.setAttribute("aria-label", say("corpus_bar", { pass: passing, total: cases.length }));
      const fill = document.createElement("span");
      fill.style.width = `${((passing / cases.length) * 100).toFixed(2)}%`;
      meter.append(fill);
      const figures = cell("span", say("corpus_bar", { pass: passing, total: cases.length }), "figures");
      line.append(label, meter, figures);
      rows.append(line);
    }
    const total = corpus.length;
    const passing = corpus.filter((one) => one.passes).length;
    summary.replaceChildren(
      cell("p", say("corpus_headline", { pass: passing, total, wrong: total - passing }), "headline"),
      rows,
    );
  }

  /** What a result has of the fields a case names, for showing beside what it expects. */
  const shownOf = (testCase, result) => {
    if (result === null) return say("corpus_null");
    const keys = testCase.expected ? Object.keys(testCase.expected) : Object.keys(result);
    const picked = Object.fromEntries(keys.map((key) => [key, result[key] ?? null]));
    return JSON.stringify(picked);
  };

  function corpusView() {
    if (corpus === null) return;
    corpusSummary();
    const needle = filters.search.trim().toLowerCase();
    const matching = corpus.filter(
      (one) =>
        (filters.country === "all" || one.country === filters.country) &&
        (!filters.wrong || !one.passes) &&
        (needle === "" || one.input.toLowerCase().includes(needle) || one.name.toLowerCase().includes(needle)),
    );
    const list = document.querySelector('[data-testid="corpus-list"]');
    list.replaceChildren(
      ...matching.slice(0, CORPUS_SHOWN).map((one) => {
        const item = document.createElement("li");
        item.dataset.state = one.passes ? "pass" : one.todo ? "todo" : "fail";
        const top = document.createElement("div");
        top.className = "case-top";
        const mark = cell(
          "span",
          say(one.passes ? "corpus_case_pass" : one.todo ? "corpus_case_todo" : "corpus_case_fail"),
          "fam-badge",
        );
        mark.dataset.tone = one.passes ? "good" : "bad";
        top.append(
          mark,
          cell("span", `${say(`corpus_${one.country}`)} · ${one.file} · ${one.group} · ${one.name}`, "fam-muted where"),
        );
        const input = cell("code", one.input, "input");
        const detail = document.createElement("dl");
        detail.className = "case-detail";
        detail.append(
          cell("dt", say("corpus_expected")),
          cell("dd", one.expected === null ? say("corpus_null") : JSON.stringify(one.expected)),
        );
        detail.append(cell("dt", say("corpus_got")), cell("dd", shownOf(one, one.result)));
        if (!one.passes && one.todoNote) detail.append(cell("dt", say("corpus_note")), cell("dd", one.todoNote));
        item.append(top, input, detail);
        return item;
      }),
    );
    document.querySelector('[data-testid="corpus-count"]').textContent = say("corpus_count", {
      shown: Math.min(CORPUS_SHOWN, matching.length),
      matching: matching.length,
    });
  }

  document.querySelector('[data-testid="corpus-load"]').addEventListener("click", loadCorpus);
  kit.choices("corpus-country", () => {
    filters.country = $("corpus-country").querySelector('[aria-pressed="true"]')?.dataset.country ?? "all";
    corpusView();
  });
  $("corpus-wrong").addEventListener("click", (event) => {
    const button = event.currentTarget;
    filters.wrong = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(filters.wrong));
    corpusView();
  });
  $("corpus-search").addEventListener("input", () => {
    filters.search = $("corpus-search").value;
    corpusView();
  });

  return {
    japan,
    bulk,
    corpusView,
    // What a share link holds for the list: the lines, while they are short enough for an address bar.
    bulkState: () => $("bulk-input").value,
  };
}
