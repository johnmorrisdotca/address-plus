// The demo's list tool: a list pasted whole, each line read, checked and written the post office's way, and saved
// as CSV, JSON, text, Markdown or SQL. Everything typed or returned is set as text, never as HTML.
import { BRITISH, COUNTRIES, FRENCH } from "./countries.js";
import { cell } from "./dom.js";
import { toMarkdown, toSql } from "./downloads.js";
import { formatAustraliaPost } from "./lib/au.js";
import { formatDeutschePost } from "./lib/de.js";
import { formatCorreos } from "./lib/es.js";
import { formatLaPoste } from "./lib/fr.js";
import { formatRoyalMail } from "./lib/gb.js";
import {
  formatCanadaPost,
  formatJapanese,
  formatUSPS,
  parseLocation,
  validateAddress,
  validateJapaneseAddress,
} from "./lib/index.js";
import { formatPosteItaliane } from "./lib/it.js";
import { formatPostNL } from "./lib/nl.js";
import { formatNZPost } from "./lib/nz.js";

// The most lines the list reads at once, so a paste of a whole file cannot stall the page.
const BULK_LIMIT = 500;

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

/** Set up the list tool. `kit` is what demo.js shares: words, helpers and the page's state. */
function setUpBulk(kit) {
  const { $, say, note, fine, show } = kit;

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
    else if (parsed.country === "NL") formatted = formatPostNL(parsed).lines.join(", ");
    else if (parsed.country === "ES") formatted = formatCorreos(parsed).lines.join(", ");
    else if (parsed.country === "IT") formatted = formatPosteItaliane(parsed).lines.join(", ");
    else if (parsed.country === "NZ") formatted = formatNZPost(parsed).lines.join(", ");
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
    const counts = { US: 0, CA: 0, JP: 0, AU: 0, FR: 0, DE: 0, GB: 0, NL: 0, ES: 0, IT: 0, NZ: 0, other: 0, none: 0 };
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
      `lines.map((line) => parseLocation(line, { countries: [australia, france, germany, italy, netherlands, newZealand, spain, unitedKingdom] })?.country ?? null)\n  // ${JSON.stringify(bulkRows.map((row) => row.parsed?.country ?? null))}`,
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

  return {
    bulk,
    // What a share link holds for the list: the lines, while they are short enough for an address bar.
    bulkState: () => $("bulk-input").value,
  };
}

export { setUpBulk };
