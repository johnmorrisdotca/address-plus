// The demo's corpus tool: the test corpus, fetched only when asked for and run in this browser, each case listed with
// what it expects and what the package gave. Everything typed or returned is set as text, never as HTML.
import { COUNTRIES } from "./countries.js";
import { cell } from "./dom.js";
import { parseLocation } from "./lib/index.js";

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
CORE.nl = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "street",
  "number",
  "numberExtension",
  "city",
  "zip",
  "country",
];
CORE.es = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "staircase",
  "entrance",
  "street",
  "number",
  "locality",
  "city",
  "county",
  "state",
  "zip",
  "country",
];
CORE.it = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "staircase",
  "street",
  "number",
  "numberExtension",
  "locality",
  "city",
  "state",
  "zip",
  "country",
];
CORE.nz = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "number",
  "street",
  "locality",
  "city",
  "state",
  "zip",
  "country",
];

/** Set up the corpus tool. `kit` is what demo.js shares: words, helpers and the page's state. */
function setUpCorpus(kit) {
  const { $, say, note } = kit;

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
    for (const country of ["us", "canada", "japan", "au", "fr", "de", "gb", "nl", "es", "it", "nz"]) {
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

  return { corpusView };
}

export { setUpCorpus };
