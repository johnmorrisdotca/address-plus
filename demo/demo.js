// The demo page's own script: one panel for each job the package does. Type in a panel and its answer is written
// as you type, from the package's own functions (bundled into ./lib/index.js when the site is built), in the
// language the header's chooser picks. Everything typed or returned is set as text, never as HTML.
import { BULK_SAMPLE, setUpExtras } from "./extras.js";
import {
  australia,
  compareAustralianAddresses,
  formatAustraliaPost,
  getStatesForAustralianPostcode,
} from "./lib/au.js";
import {
  compareGermanAddresses,
  DE_STATES,
  formatDeutschePost,
  germany,
  isKnownGermanPostcode,
  parseGermanPostcode,
} from "./lib/de.js";
import {
  compareFrenchAddresses,
  formatLaPoste,
  FR_COLLECTIVITIES,
  FR_DEPARTMENTS,
  france,
  isKnownFrenchPostcode,
  parseFrenchPostcode,
} from "./lib/fr.js";
import {
  compareUKAddresses,
  formatRoyalMail,
  GB_NATIONS,
  GB_POSTCODE_AREAS,
  parseUKPostcode,
  unitedKingdom,
} from "./lib/gb.js";
import {
  cleanAddressDetailed,
  compareAddresses,
  findPrefecture,
  formatCanadaPost,
  formatJapanese,
  formatJapaneseEnglish,
  formatUSPS,
  getPostalPrefixesForPrefecture,
  getPostalPrefixesForProvince,
  getPrefectureFromJapanesePostalCode,
  getProvinceFromPostalCode,
  getStateFromZip,
  getZipPrefixesForState,
  isSameAddress,
  normalizeJapaneseAddressText,
  normalizeRegion,
  parseLocation,
  PROVINCE_EXPANSIONS_EN,
  US_STATE_EXPANSIONS,
  validateAddress,
} from "./lib/index.js";
import { WORDS } from "./words.js";

// Australia, France, Germany and the United Kingdom are modules of their own; every panel hands them to the parser.
const COUNTRIES = [australia, france, germany, unitedKingdom];
const WITH_MODULES = "{ countries: [australia, france, germany, unitedKingdom] }";

// The order the fields of a parsed address are listed in. A Japanese address lists its own fields; the shared
// ones (state, city, street, number, zip) hold the same values again and are left to the JSON.
const FIELDS_WEST = [
  "place",
  "number",
  "fraction",
  "prefix",
  "street",
  "type",
  "suffix",
  "street1",
  "prefix1",
  "type1",
  "suffix1",
  "street2",
  "prefix2",
  "type2",
  "suffix2",
  "secUnitType",
  "secUnitNum",
  "rr",
  "site",
  "station",
  "rpo",
  "locality",
  "city",
  "state",
  "zip",
  "plus4",
  "country",
];
// Germany's fields, in the order a German address is written.
const FIELDS_DE = [
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
];
// France's fields, in the order La Poste writes them.
const FIELDS_FR = [
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
];
// Australia's fields and the United Kingdom's, each in the order its post office writes them.
const FIELDS_AU = [
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
];
const FIELDS_GB = [
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
];
const FIELDS_JAPAN = [
  "postalCode",
  "prefecture",
  "prefectureCode",
  "prefectureRomaji",
  "municipality",
  "municipalityCode",
  "municipalityRomaji",
  "town",
  "chome",
  "ban",
  "go",
  "block",
  "building",
  "floor",
  "room",
  "country",
];

// The shapes the postal panel reads, after full-width characters are made half-width.
const US_ZIP = /^\d{5}(-\d{4})?$/;
const CANADIAN_POSTAL = /^[A-Za-z]\d[A-Za-z]( ?\d[A-Za-z]\d)?$/;
const JAPANESE_POSTAL = /^〒?\s*\d{3}-?\d{4}$/;
const AUSTRALIAN_POSTCODE = /^\d{4}$/;

const language = familyLanguage({ id: "address-plus", words: WORDS, onChange: () => render() });
/** A line of the page in its language, with each `{name}` filled in from `values`. */
const say = (key, values) => {
  const word = WORDS[language.lang][key];
  return typeof word === "string" && values !== undefined
    ? word.replace(/\{(\w+)\}/g, (whole, name) => String(values[name] ?? ""))
    : word;
};
const ja = () => language.lang === "ja";
const $ = (id) => document.getElementById(id);
const quote = (text) => JSON.stringify(text);
const percent = (fraction) => `${Math.round(fraction * 100)}%`;
const yes = (truth) => (truth ? say("yes") : say("no"));
const titleCase = (name) => name.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());

/** A field table: [[label, value, key?], …] written as text. `key` is the field's name in the result, shown under the label. */
function facts(target, pairs) {
  const list = document.createElement("dl");
  list.className = "facts";
  for (const [label, value, key] of pairs) {
    const term = document.createElement("dt");
    term.textContent = label;
    if (key !== undefined) {
      const name = document.createElement("code");
      name.textContent = key;
      term.append(name);
    }
    const detail = document.createElement("dd");
    if (value instanceof Node) detail.append(value);
    else detail.textContent = value;
    list.append(term, detail);
  }
  target.replaceChildren(list);
}

/** One line of words in the answer's box. `muted` marks it as a no. */
function note(target, text, muted = true) {
  const line = document.createElement("p");
  line.className = muted ? "note fam-muted" : "note";
  line.textContent = text;
  target.replaceChildren(line);
}

/** A line of fine print under what is already in the box. */
function fine(target, text) {
  const line = document.createElement("p");
  line.className = "fam-fine";
  line.textContent = text;
  target.append(line);
}

/** A badge saying yes or no. */
function badge(truth) {
  const mark = document.createElement("span");
  mark.className = "fam-badge";
  mark.dataset.tone = truth ? "good" : "bad";
  mark.textContent = yes(truth);
  return mark;
}

/** Lines of an address as the post office would print them. */
function lines(text) {
  const block = document.createElement("pre");
  block.className = "lines";
  block.textContent = text;
  return block;
}

/** A list of validation findings: each code, its meaning in Japanese when the page is in Japanese, and the library's message. */
function findings(list) {
  if (list.length === 0) return say("none");
  const items = document.createElement("ul");
  items.className = "findings";
  for (const finding of list) {
    const item = document.createElement("li");
    const code = document.createElement("code");
    code.textContent = finding.code;
    item.append(code);
    const meaning = ja() ? say("codes")[finding.code] : undefined;
    if (meaning !== undefined) {
      const said = document.createElement("span");
      said.textContent = meaning;
      item.append(said);
    }
    const message = document.createElement("span");
    message.className = meaning !== undefined ? "fam-muted" : "";
    message.textContent = finding.message;
    item.append(message);
    items.append(item);
  }
  return items;
}

/** The whole result, pretty-printed, in the fold under the panel. */
function json(name, value) {
  $(`${name}-json`).textContent = JSON.stringify(value, null, 2) ?? "undefined";
}

const show = (id, text) => {
  $(id).textContent = text;
};
const countryName = (code) => (code ? `${code} · ${say("country")[code] ?? code}` : "");

/** A nation of the United Kingdom by its code and its name in the page's language (from kuni, through the tables). */
const nationName = (code) => {
  const nation = GB_NATIONS.find((one) => one.code === code);
  return nation ? `${code} · ${ja() ? nation.nameJa : nation.name}` : code;
};

/** An address read the way every panel reads one: with the four country modules, and a country if one is picked. */
const read = (text, country = "auto") =>
  parseLocation(text, country === "auto" ? { countries: COUNTRIES } : { country, countries: COUNTRIES });
const BRITISH = new Set(["GB", "JE", "GY", "IM"]);
const FRENCH = new Set(["FR", "MC", "PM", "BL", "MF", "WF", "PF", "NC"]);
/** The post office format of an address read by a country module, or null for the core's countries. */
function moduleFormat(address) {
  if (address?.country === "AU") return { format: formatAustraliaPost(address), call: "formatAustraliaPost" };
  if (FRENCH.has(address?.country)) return { format: formatLaPoste(address), call: "formatLaPoste" };
  if (address?.country === "DE") return { format: formatDeutschePost(address), call: "formatDeutschePost" };
  if (BRITISH.has(address?.country)) return { format: formatRoyalMail(address), call: "formatRoyalMail" };
  return null;
}

// ----- parse ------------------------------------------------------------------------------------------------

/** The fields of a parsed address as rows of the field table. */
function fieldRows(address) {
  const order =
    address.country === "JP"
      ? FIELDS_JAPAN
      : address.country === "AU"
        ? FIELDS_AU
        : FRENCH.has(address.country)
          ? FIELDS_FR
          : address.country === "DE"
            ? FIELDS_DE
            : BRITISH.has(address.country)
              ? FIELDS_GB
              : FIELDS_WEST;
  const labels = FRENCH.has(address.country)
    ? { ...say("fields"), ...say("fieldsFrance") }
    : address.country === "DE"
      ? { ...say("fields"), ...say("fieldsGermany") }
      : say("fields");
  return order
    .filter((key) => address[key] !== undefined && address[key] !== "")
    .map((key) => [
      labels[key] ?? key,
      key === "country"
        ? countryName(address[key])
        : key === "nation"
          ? nationName(address[key])
          : String(address[key]),
      key,
    ]);
}

function parse() {
  const text = $("parse-input").value;
  const country = $("parse-country").querySelector('[aria-pressed="true"]')?.dataset.country ?? "auto";
  const out = $("parse-answer");
  const address = read(text, country);
  if (address === null) note(out, say("parse_none"));
  else {
    facts(out, fieldRows(address));
    if (address.country === "JP") fine(out, say("parse_shared"));
  }
  json("parse", address);
  const lead =
    address?.country === "JP" ? (address.block ?? address.prefecture) : (address?.street ?? address?.street1);
  show(
    "parse-call",
    `parseLocation(${quote(text)}, { ${country === "auto" ? "" : `country: ${quote(country)}, `}countries: [australia, france, germany, unitedKingdom] })  // ${address === null ? "null" : `{ country: ${quote(address.country)}${lead ? `, … ${quote(lead)}` : ""} }`}`,
  );
}

// ----- validate ---------------------------------------------------------------------------------------------

function validate() {
  const text = $("validate-input").value;
  const strict = $("validate-strict").getAttribute("aria-pressed") === "true";
  const out = $("validate-answer");
  const result = validateAddress(text, { countries: COUNTRIES, ...(strict ? { strictPostalValidation: true } : {}) });
  const pairs = [
    [say("validate_valid"), badge(result.isValid), "isValid"],
    [say("validate_confidence"), percent(result.confidence), "confidence"],
    [say("validate_completeness"), percent(result.completeness), "completeness"],
  ];
  if (result.parsedAddress?.country) pairs.push([say("validate_country"), countryName(result.parsedAddress.country)]);
  pairs.push(
    [say("validate_errors"), findings(result.errors), "errors"],
    [say("validate_warnings"), findings(result.warnings), "warnings"],
  );
  if (result.suggestions.length > 0)
    pairs.push([say("validate_suggestions"), result.suggestions.join(" "), "suggestions"]);
  facts(out, pairs);
  json("validate", result);
  const first = result.errors[0] ?? result.warnings[0];
  show(
    "validate-call",
    `validateAddress(${quote(text)}, { countries: [australia, france, germany, unitedKingdom]${strict ? ", strictPostalValidation: true" : ""} })  // { isValid: ${result.isValid}${first ? `, ${result.errors.length > 0 ? "errors" : "warnings"}: [${quote(first.code)}${result.errors.length + result.warnings.length > 1 ? ", …" : ""}]` : ""} }`,
  );
}

// ----- format -----------------------------------------------------------------------------------------------

function format() {
  const text = $("format-input").value;
  const blockStyle = $("format-style").querySelector('[aria-pressed="true"]')?.dataset.style ?? "hyphen";
  const out = $("format-answer");
  const address = read(text);
  if (address === null) {
    note(out, say("format_none"));
    json("format", null);
    show("format-call", `parseLocation(${quote(text)}, ${WITH_MODULES})  // null`);
    return;
  }
  const byModule = moduleFormat(address);
  if (byModule) {
    const { format: formatted, call } = byModule;
    facts(out, [
      [
        say(
          {
            formatAustraliaPost: "format_australia",
            formatLaPoste: "format_france",
            formatDeutschePost: "format_germany",
            formatRoyalMail: "format_royal",
          }[call],
        ),
        lines(formatted.lines.join("\n")),
        "lines",
      ],
      [say("format_single"), formatted.singleLine, "singleLine"],
    ]);
    json("format", formatted);
    show(
      "format-call",
      `${call}(parseLocation(${quote(text)}, ${WITH_MODULES})).lines  // ${JSON.stringify(formatted.lines)}`,
    );
    return;
  }
  if (address.country === "JP") {
    const japanese = formatJapanese(address, { blockStyle });
    const english = formatJapaneseEnglish(address);
    facts(out, [
      [say("format_japanese"), lines(japanese), "formatJapanese"],
      [say("format_english"), lines(english), "formatJapaneseEnglish"],
    ]);
    json("format", { formatJapanese: japanese, formatJapaneseEnglish: english });
    show(
      "format-call",
      `const address = parseLocation(${quote(text)});\nformatJapanese(address${blockStyle === "markers" ? `, { blockStyle: "markers" }` : ""})  // ${quote(japanese)}\nformatJapaneseEnglish(address)  // ${quote(english)}`,
    );
    return;
  }
  const canadian = address.country === "CA";
  const formatted = canadian ? formatCanadaPost(address) : formatUSPS(address);
  const called = canadian ? "formatCanadaPost" : "formatUSPS";
  facts(out, [
    [say(canadian ? "format_canada" : "format_usps"), lines(formatted.lines.join("\n")), "lines"],
    [say("format_single"), formatted.singleLine, "singleLine"],
  ]);
  if (address.country === undefined) fine(out, say("format_guess"));
  json("format", formatted);
  show("format-call", `${called}(parseLocation(${quote(text)})).lines  // ${JSON.stringify(formatted.lines)}`);
}

// ----- compare ----------------------------------------------------------------------------------------------

function compare() {
  const first = $("compare-first").value;
  const second = $("compare-second").value;
  const out = $("compare-answer");
  const one = read(first);
  const two = read(second);
  const called = `compareAddresses(parseLocation(${quote(first)}), parseLocation(${quote(second)}))`;
  if (one === null || two === null) {
    note(out, say("compare_none"));
    json("compare", null);
    show("compare-call", `parseLocation(${quote(one === null ? first : second)}, ${WITH_MODULES})  // null`);
    return;
  }
  // Two Australian, French, German or British addresses are compared by their own module, which knows their forms.
  const both =
    one.country === "AU" && two.country === "AU"
      ? "AU"
      : FRENCH.has(one.country) && FRENCH.has(two.country)
        ? "FR"
        : one.country === "DE" && two.country === "DE"
          ? "DE"
          : BRITISH.has(one.country) && BRITISH.has(two.country)
            ? "GB"
            : null;
  if (both) {
    const call = {
      AU: "compareAustralianAddresses",
      DE: "compareGermanAddresses",
      FR: "compareFrenchAddresses",
      GB: "compareUKAddresses",
    }[both];
    const compareWith = {
      AU: compareAustralianAddresses,
      DE: compareGermanAddresses,
      FR: compareFrenchAddresses,
      GB: compareUKAddresses,
    }[both];
    const result = compareWith(one, two);
    const pairs = [[say("compare_same"), badge(result.isSame), "isSame"]];
    if (result.differences.length > 0) {
      const items = document.createElement("ul");
      items.className = "findings";
      for (const difference of result.differences) {
        const item = document.createElement("li");
        const field = document.createElement("code");
        field.textContent = difference.field;
        const said = document.createElement("span");
        said.textContent = `${quote(difference.first ?? "")} · ${quote(difference.second ?? "")}`;
        item.append(field, said);
        items.append(item);
      }
      pairs.push([say("compare_differences"), items, "differences"]);
    } else pairs.push([say("compare_differences"), say("none"), "differences"]);
    facts(out, pairs);
    json("compare", result);
    show(
      "compare-call",
      `${call}(parseLocation(${quote(first)}, ${WITH_MODULES}), parseLocation(${quote(second)}, ${WITH_MODULES}))\n  // { isSame: ${result.isSame}${result.differences.length > 0 ? `, differences: [${result.differences.map((one) => quote(one.field)).join(", ")}]` : ""} }`,
    );
    return;
  }
  const result = compareAddresses(one, two);
  const same = isSameAddress(one, two);
  const { details, differences } = result.similarity;
  const pairs = [
    [say("compare_same"), badge(same), "isSame"],
    [say("compare_match"), say("matches")[result.matchType] ?? result.matchType, "matchType"],
    [say("compare_score"), percent(result.similarity.score), "score"],
    [say("compare_street"), percent(details.streetScore), "streetScore"],
    [say("compare_city"), percent(details.cityScore), "cityScore"],
    [say("compare_state"), percent(details.stateScore), "stateScore"],
    [say("compare_postal"), percent(details.postalScore), "postalScore"],
  ];
  if (differences.length > 0) {
    const items = document.createElement("ul");
    items.className = "findings";
    for (const difference of differences) {
      const item = document.createElement("li");
      const field = document.createElement("code");
      field.textContent = difference.field;
      const said = document.createElement("span");
      said.textContent = `${quote(difference.value1 ?? "")} · ${quote(difference.value2 ?? "")}`;
      const kind = document.createElement("span");
      kind.className = "fam-muted";
      kind.textContent = say("differences")[difference.type] ?? difference.type;
      item.append(field, said, kind);
      items.append(item);
    }
    pairs.push([say("compare_differences"), items, "differences"]);
  }
  facts(out, pairs);
  json("compare", { isSame: result.isSame, matchType: result.matchType, similarity: result.similarity });
  show(
    "compare-call",
    `${called}\n  // { isSame: ${result.isSame}, matchType: ${quote(result.matchType)} }\nisSameAddress(one, two)  // ${same}`,
  );
}

// ----- postal -----------------------------------------------------------------------------------------------

/** A list of postal prefixes as one line of text, with how many there are. */
function prefixes(list) {
  const wrap = document.createElement("span");
  wrap.className = "prefixes";
  const count = document.createElement("span");
  count.className = "fam-muted";
  count.textContent = say("postal_count", { count: list.length });
  const codes = document.createElement("span");
  codes.className = "fam-notation";
  codes.textContent = list.join(", ");
  wrap.append(count, codes);
  return wrap;
}

const stateName = (code) => titleCase(US_STATE_EXPANSIONS[code.toLowerCase()] ?? code);
const provinceName = (code) => titleCase(PROVINCE_EXPANSIONS_EN[code.toLowerCase()] ?? code);
/** Where a French postcode belongs, by its place: a department and its region, a collectivity, Monaco. */
function frenchPlace(postcode) {
  const department = FR_DEPARTMENTS.find((one) => one.code === postcode.place);
  if (department) return { name: `${department.code} · ${department.name}`, region: department.region };
  const collectivity = FR_COLLECTIVITIES.find((one) => one.code === postcode.place);
  if (collectivity) return { name: countryName(collectivity.country) };

  return { name: countryName(postcode.country) };
}
const prefectureName = (prefecture) => `${prefecture.code} · ${prefecture.name} (${prefecture.romaji})`;

function postal() {
  const typed = $("postal-input").value.trim();
  // Full-width digits, letters and hyphens are read as their half-width forms, as the parser reads them.
  const text = normalizeJapaneseAddressText(typed);
  const out = $("postal-answer");
  const kinds = say("postal_kinds");
  let called = "";
  let answer = null;
  const british = parseUKPostcode(text);
  if (AUSTRALIAN_POSTCODE.test(text)) {
    const states = getStatesForAustralianPostcode(text);
    called = `getStatesForAustralianPostcode(${quote(text)})  // ${JSON.stringify(states)}`;
    answer = states;
    facts(out, [
      [say("postal_kind"), kinds.au],
      [say("postal_region"), states.length > 0 ? states.join(" · ") : say("postal_unknown")],
    ]);
  } else if (british) {
    called = `parseUKPostcode(${quote(text)})  // { postcode: ${quote(british.postcode)}, country: ${quote(british.country)}${british.nation ? `, nation: ${quote(british.nation)}` : ""} }`;
    answer = british;
    const area = GB_POSTCODE_AREAS[british.area];
    facts(out, [
      [say("postal_kind"), kinds.gb],
      [say("postal_region"), british.nation ? nationName(british.nation) : countryName(british.country)],
      [say("postal_area"), area ? `${british.area} · ${area.name}` : british.area],
      [say("postal_district"), british.district],
    ]);
  } else if (US_ZIP.test(text)) {
    const state = getStateFromZip(text);
    called = `getStateFromZip(${quote(text)})  // ${quote(state)}`;
    answer = state;
    const rows = [];
    // A five-digit code that La Poste's list or GeoNames' list has is a French or a German postcode too: every reading is shown.
    const five = /^\d{5}$/.test(text);
    const french = five && isKnownFrenchPostcode(text) ? parseFrenchPostcode(text) : null;
    const german = five && isKnownGermanPostcode(text) ? parseGermanPostcode(text) : null;
    if (state || (!french && !german)) {
      rows.push(
        [say("postal_kind"), kinds.zip],
        [say("postal_region"), state ? `${state} · ${stateName(state)}` : say("postal_unknown")],
      );
    }
    if (french) {
      const where = frenchPlace(french);
      called += `\nparseFrenchPostcode(${quote(text)})  // { place: ${quote(french.place)}, country: ${quote(french.country)} }`;
      answer = { ...(state ? { state } : {}), france: french };
      rows.push([say("postal_kind"), kinds.fr], [say("postal_region"), where.name]);
      if (where.region) rows.push([say("postal_france_region"), where.region]);
    }
    if (german) {
      const land = DE_STATES.find((one) => one.code === german.state);
      called += `\nparseGermanPostcode(${quote(text)})  // { state: ${quote(german.state)} }`;
      answer =
        answer !== null && typeof answer === "object"
          ? { ...answer, germany: german }
          : { ...(state ? { state } : {}), germany: german };
      rows.push(
        [say("postal_kind"), kinds.de],
        [say("postal_land"), land ? `${land.code} · ${ja() ? land.nameJa : land.name}` : say("postal_unknown")],
      );
    }
    facts(out, rows);
  } else if (CANADIAN_POSTAL.test(text)) {
    const province = getProvinceFromPostalCode(text.toUpperCase());
    called = `getProvinceFromPostalCode(${quote(text.toUpperCase())})  // ${quote(province)}`;
    answer = province;
    facts(out, [
      [say("postal_kind"), kinds.ca],
      [say("postal_region"), province ? `${province} · ${provinceName(province)}` : say("postal_unknown")],
    ]);
  } else if (JAPANESE_POSTAL.test(text)) {
    const code = text.replace(/[〒\s]/g, "");
    const prefecture = getPrefectureFromJapanesePostalCode(code);
    called = `getPrefectureFromJapanesePostalCode(${quote(code)})  // ${quote(prefecture)}`;
    answer = prefecture;
    const found = prefecture ? findPrefecture(prefecture) : null;
    facts(out, [
      [say("postal_kind"), kinds.jp],
      [say("postal_region"), found ? prefectureName(found) : say("postal_unknown")],
    ]);
  } else {
    // A region by its code or name. A prefecture is tried first: the US and Canadian names are matched loosely,
    // and would read Osaka as Alaska.
    const prefecture = text === "" ? null : findPrefecture(text);
    const region = prefecture === null && text !== "" ? normalizeRegion(text) : null;
    if (prefecture !== null) {
      const list = getPostalPrefixesForPrefecture(prefecture.code);
      called = `getPostalPrefixesForPrefecture(${quote(prefecture.code)})  // [${list.slice(0, 3).map(quote).join(", ")}${list.length > 3 ? ", …" : ""}]`;
      answer = list;
      facts(out, [
        [say("postal_kind"), kinds.prefecture],
        [say("postal_region"), prefectureName(prefecture)],
        [say("postal_prefixes"), prefixes(list)],
      ]);
    } else if (region !== null) {
      const american = region.country === "US";
      const list = american ? getZipPrefixesForState(region.abbr) : getPostalPrefixesForProvince(region.abbr);
      called = `${american ? "getZipPrefixesForState" : "getPostalPrefixesForProvince"}(${quote(region.abbr)})  // [${list.slice(0, 3).map(quote).join(", ")}${list.length > 3 ? ", …" : ""}]`;
      answer = list;
      facts(out, [
        [say("postal_kind"), american ? kinds.state : kinds.province],
        [say("postal_region"), `${region.abbr} · ${american ? stateName(region.abbr) : provinceName(region.abbr)}`],
        [say("postal_prefixes"), prefixes(list)],
      ]);
    } else {
      note(out, say("postal_none"));
      called = `findPrefecture(${quote(text)}) ?? normalizeRegion(${quote(text)})  // null`;
    }
  }
  json("postal", answer);
  show("postal-call", called);
}

// ----- clean ------------------------------------------------------------------------------------------------

function clean() {
  const text = $("clean-input").value;
  const standardizeCase = $("clean-case").querySelector('[aria-pressed="true"]')?.dataset.case ?? "title";
  const out = $("clean-answer");
  const result = cleanAddressDetailed(text, { standardizeCase });
  // Typed, then cleaned, then as the post office writes it: the three side by side.
  const parsed = read(result.cleanedAddress);
  let postalLine = say("clean_no_postal");
  let postalCall = "";
  const byModule = moduleFormat(parsed);
  if (byModule) {
    postalLine = byModule.format.lines.join(" / ");
    postalCall = byModule.call;
  } else if (parsed?.country === "JP") {
    postalLine = formatJapanese(parsed, { multiline: false });
    postalCall = "formatJapanese";
  } else if (parsed?.country === "CA") {
    postalLine = formatCanadaPost(parsed).singleLine;
    postalCall = "formatCanadaPost";
  } else if (parsed !== null) {
    postalLine = formatUSPS(parsed).lines.join(" / ");
    postalCall = "formatUSPS";
  }
  const chain = document.createElement("ol");
  chain.className = "chain";
  chain.dataset.testid = "clean-chain";
  for (const [label, value] of [
    [say("clean_typed"), text],
    [say("clean_cleaned"), result.cleanedAddress],
    [
      postalCall === "" ? say("clean_postal") : say("clean_postal_as", { format: say(`clean_formats`)[postalCall] }),
      postalLine,
    ],
  ]) {
    const step = document.createElement("li");
    const name = document.createElement("span");
    name.className = "step";
    name.textContent = label;
    const shown = document.createElement("span");
    shown.className = "value";
    shown.textContent = value;
    step.append(name, shown);
    chain.append(step);
  }
  facts(out, [
    [say("clean_steps"), chain],
    [say("clean_modified"), yes(result.wasModified), "wasModified"],
    [say("clean_changes"), result.changes.length === 0 ? say("none") : result.changes.join(" · "), "changes"],
  ]);
  json("clean", result);
  show(
    "clean-call",
    `cleanAddressDetailed(${quote(text)}, { standardizeCase: ${quote(standardizeCase)} }).cleanedAddress\n  // ${quote(result.cleanedAddress)}`,
  );
}

// ----- the page ---------------------------------------------------------------------------------------------

// Each panel: what draws its answer, its boxes, and its examples, each a label key and the value (or values) it
// puts in the boxes. The postal examples are their own labels.
const PANELS = {
  parse: {
    run: parse,
    inputs: ["parse-input"],
    examples: [
      ["us", "1600 Pennsylvania Ave NW, Washington, DC 20500"],
      ["landmark", "Empire State Building, 350 5th Avenue, New York NY 10118"],
      ["pobox", "PO Box 1234, Springfield, IL 62701"],
      ["corner", "Hollywood Blvd and Vine St, Los Angeles, CA"],
      ["toronto", "100 Queen St W, Toronto, ON M5H 2N2"],
      ["french", "1234 rue Sainte-Catherine O, Montréal, QC H3G 1P1"],
      ["kanji", "〒100-0005 東京都千代田区丸の内1丁目2番3号 サンプルビル5階501号室"],
      ["romaji", "1-2-3 Marunouchi, Chiyoda-ku, Tokyo 100-0005"],
      ["fullwidth", "〒５３０－０００１ 大阪府大阪市北区梅田３－１－１"],
      ["australia", "3/12 Smith St, Parramatta NSW 2150"],
      ["level", "Level 6, 51 Jacobson St, Brisbane QLD 4000"],
      ["france", "12 bis rue de la Paix, 75002 Paris"],
      ["residence", "Résidence Les Lilas, Apt 12, 4 av. des Écoles, 31000 Toulouse"],
      ["germany", "Hauptstraße 12a, 10115 Berlin"],
      ["careof", "c/o Weber, Hinterhaus, 2. OG, Kastanienallee 4b, 10435 Berlin"],
      ["flat", "Flat 2, Rose Court, 14 High St, Kingsbury, London NW9 0AA"],
      ["london", "10 Downing Street, London SW1A 2AA"],
    ],
  },
  validate: {
    run: validate,
    inputs: ["validate-input"],
    examples: [
      ["zip", "123 Main St, Seattle, NY 98101"],
      ["province", "100 Queen St W, Vancouver, BC M5H 2N2"],
      ["prefecture", "〒530-0001 東京都千代田区丸の内1-2-3"],
      ["complete", "1600 Pennsylvania Ave NW, Washington, DC 20500"],
      ["japan", "〒100-0005 東京都千代田区丸の内1-2-3"],
      ["short", "123 Main St"],
      ["australia", "1 Main St, Sydney VIC 2000"],
      ["france", "12 rue de la Paix, 75099 Paris"],
      ["germany", "Hauptstraße 12, 10000 Berlin"],
      ["monaco", "Place du Casino, 98000 Monaco"],
      ["jersey", "12 Bath Street, St Helier JE2 4ST"],
    ],
  },
  format: {
    run: format,
    inputs: ["format-input"],
    examples: [
      ["japan", "〒100-0005 東京都千代田区丸の内1丁目2番3号 サンプルビル5階501号室"],
      ["romaji", "Umeda 3-1-1, Kita-ku, Osaka-shi, Osaka 530-0001"],
      ["us", "123 Main Street Apt 4, Anytown, NY 12345"],
      ["canada", "100 Queen Street West, Toronto, Ontario M5H 2N2"],
      ["pobox", "PO Box 1234, Springfield, IL 62701"],
      ["australia", "Unit 3/12 Smith Street, Parramatta NSW 2150"],
      ["france", "Chez Mme Martin, Apt 5, 15 bis rue d'Aboukir, BP 12, 69003 Lyon"],
      ["germany", "c/o Weber, Hinterhaus, 2. OG, Kastanienallee 4b, 10435 Berlin"],
      ["uk", "Flat 2, Rose Court, 14 High St, Kingsbury, London NW9 0AA"],
    ],
  },
  compare: {
    run: compare,
    inputs: ["compare-first", "compare-second"],
    examples: [
      ["abbreviations", ["123 Main Street, Anytown, NY 12345", "123 Main St, Anytown, New York 12345"]],
      ["typo", ["123 Main Street, Anytown, NY 12345", "125 Main Street, Anytown, NY 12345"]],
      ["canada", ["100 Queen St W, Toronto, ON M5H 2N2", "100 Queen Street West, Toronto, Ontario M5H2N2"]],
      ["fullwidth", ["東京都千代田区丸の内1丁目2番3号", "東京都千代田区丸の内１－２－３"]],
      ["australia", ["3/12 Smith Street, Parramatta NSW 2150", "Unit 3, 12 Smith St, PARRAMATTA New South Wales 2150"]],
      ["france", ["12 rue de l'Église, 38000 Grenoble", "12 R. DE L EGLISE, 38000 GRENOBLE"]],
      ["germany", ["Müllerstraße 5, 13353 Berlin", "MUELLERSTR. 5, 13353 BERLIN"]],
      ["uk", ["10 Downing Street, London SW1A 2AA", "10 DOWNING ST, LONDON, SW1A2AA"]],
      ["different", ["123 Main St, Springfield, IL 62701", "456 Oak Ave, Portland, OR 97201"]],
    ],
  },
  postal: {
    run: postal,
    inputs: ["postal-input"],
    examples: [
      "98101",
      "10118-0110",
      "M5H 2N2",
      "H3G",
      "100-0005",
      "５３０－０００１",
      "2620",
      "75008",
      "80331",
      "20200",
      "98714",
      "SW1A 2AA",
      "CH5 1AA",
      "JE2 3AB",
      "WA",
      "Quebec",
      "大阪府",
      "Hokkaido",
    ].map((value) => [null, value]),
  },
  clean: {
    run: clean,
    inputs: ["clean-input"],
    examples: [
      ["capitals", "350 FIFTH AVENUE, NEW YORK, NY 10118"],
      ["spaces", "742 evergreen terrace,springfield ,  il 62704"],
      ["canada", "  10 wellington   street , ottawa , on k1a 0a6"],
      ["japan", "〒１００－０００５　東京都千代田区丸の内１－２－３"],
      ["australia", "  3/12  smith st , parramatta  nsw 2150"],
      ["uk", "flat 2 , 14 high st ,  london   nw9 0aa"],
    ],
  },
  japan: {
    run: () => extras.japan(),
    inputs: ["japan-input"],
    examples: [
      ["kyoto", "〒604-8571 京都府京都市中京区寺町通御池上る上本能寺前町488"],
      ["tokyo", "東京都千代田区丸の内一丁目二番三号 サンプルビル五階"],
      ["sapporo", "〒060-0001 北海道札幌市中央区北1条西2丁目"],
      ["romaji", "Sample Bldg 5F, 1-2-3 Marunouchi, Chiyoda-ku, Tokyo 100-0005, Japan"],
      ["rural", "長野県北佐久郡軽井沢町大字軽井沢1323番地1"],
      ["sakai", "大阪府堺市堺区熊野町東3丁1番9号"],
      ["merged", "埼玉県浦和市高砂3-15-1"],
    ],
  },
};

/** The example buttons, labelled in the page's language; each holds the full address as its hover text. */
function fillExamples() {
  for (const [name, panel] of Object.entries(PANELS)) {
    const labels = say("chips")[name] ?? {};
    $(`${name}-examples`).replaceChildren(
      ...panel.examples.map(([key, example]) => {
        const values = [].concat(example);
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = key === null ? values[0] : (labels[key] ?? key);
        button.title = values.join("\n");
        button.dataset.value = values.join("|");
        button.addEventListener("click", () => {
          panel.inputs.forEach((id, index) => {
            $(id).value = values[index];
          });
          panel.run();
          press();
          remember();
        });
        return button;
      }),
    );
  }
  press();
}

/** The example that is on show is the one pressed. */
function press() {
  for (const [name, panel] of Object.entries(PANELS)) {
    const now = panel.inputs.map((id) => $(id).value).join("|");
    $(`${name}-examples`)
      .querySelectorAll("button")
      .forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.value === now)));
  }
}

/** A row of choices of which exactly one is pressed: pressing one redraws its panel. */
function choices(id, run) {
  const row = $(id);
  row.querySelectorAll("button").forEach((button) =>
    button.addEventListener("click", () => {
      row.querySelectorAll("button").forEach((other) => other.setAttribute("aria-pressed", String(other === button)));
      run();
    }),
  );
}

function render() {
  document
    .querySelector('[data-say="pageDocs"]')
    ?.setAttribute("href", language.lang === "ja" ? "docs/ja/index.html" : "docs/index.html");
  language.say();
  fillExamples();
  for (const panel of Object.values(PANELS)) panel.run();
  extras.bulk();
  extras.corpusView();
}

// ----- links and copies -------------------------------------------------------------------------------------

// What a link to the page holds: each box by its own name in the address, and each option. A box or option at its
// first value is left out, so a link says only what was changed. The list goes in only while it is short enough
// for an address bar.
const BOXES = {
  parse: "parse-input",
  validate: "validate-input",
  format: "format-input",
  first: "compare-first",
  second: "compare-second",
  postal: "postal-input",
  clean: "clean-input",
  japan: "japan-input",
  list: "bulk-input",
};
const LONGEST_LIST_IN_A_LINK = 1500;
const OPTIONS = {
  strict: {
    read: () => ($("validate-strict").getAttribute("aria-pressed") === "true" ? "1" : ""),
    write: (value) => $("validate-strict").setAttribute("aria-pressed", String(value === "1")),
  },
  block: chosen("format-style", "style"),
  country: chosen("parse-country", "country"),
  case: chosen("clean-case", "case"),
};
// The names each panel's link carries.
const PANEL_STATE = {
  parse: ["parse", "country"],
  validate: ["validate", "strict"],
  format: ["format", "block"],
  compare: ["first", "second"],
  postal: ["postal"],
  clean: ["clean", "case"],
  japan: ["japan"],
};

/** An option set by a row of choices: which one is pressed. */
function chosen(id, attribute) {
  return {
    read: () => $(id).querySelector('[aria-pressed="true"]')?.dataset[attribute] ?? "",
    write: (value) => {
      const buttons = [...$(id).querySelectorAll("button")];
      if (!buttons.some((button) => button.dataset[attribute] === value)) return;
      for (const button of buttons) button.setAttribute("aria-pressed", String(button.dataset[attribute] === value));
    },
  };
}

// The list starts with a mixed sample in it, so the table has something to show.
$("bulk-input").value = BULK_SAMPLE;
const valueOf = (name) => (name in BOXES ? $(BOXES[name]).value : OPTIONS[name].read());
const FIRST = Object.fromEntries([...Object.keys(BOXES), ...Object.keys(OPTIONS)].map((name) => [name, valueOf(name)]));

/** The page's address with the given names set from what is on the page now. */
function linkWith(names, hash = "") {
  const url = new URL(window.location.href);
  for (const name of [...Object.keys(BOXES), ...Object.keys(OPTIONS)]) url.searchParams.delete(name);
  for (const name of names) {
    const value = valueOf(name);
    if (value === FIRST[name]) continue;
    if (name === "list" && value.length > LONGEST_LIST_IN_A_LINK) continue;
    url.searchParams.set(name, value);
  }
  url.hash = hash;
  return url.toString();
}

/** Keep the address bar in step with the page, so a reload or a copied address opens it as it is. */
function remember() {
  window.history.replaceState(
    null,
    "",
    linkWith([...Object.keys(BOXES), ...Object.keys(OPTIONS)], window.location.hash),
  );
}

/** Fill the page from its address: ?parse=…, ?strict=1 and the rest. */
function restore() {
  const params = new URL(window.location.href).searchParams;
  for (const [name, id] of Object.entries(BOXES)) if (params.has(name)) $(id).value = params.get(name);
  for (const [name, option] of Object.entries(OPTIONS)) if (params.has(name)) option.write(params.get(name));
}

/** Copy text, with the older way for a browser that will not let a page write to the clipboard. */
async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    const done = document.execCommand("copy");
    area.remove();
    return done;
  }
}

for (const button of document.querySelectorAll("[data-copy]")) {
  button.addEventListener("click", async () => {
    const panel = button.dataset.panel;
    const what = button.dataset.copy;
    const text = what === "code" ? $(`${panel}-call`).textContent : linkWith(PANEL_STATE[panel], `#${panel}`);
    const done = await copy(text);
    const said = document.querySelector(`[data-testid="${panel}-copied"]`);
    said.textContent = done ? say(what === "code" ? "copied_code" : "copied_link") : say("copy_failed");
    said.dataset.copied = what;
    clearTimeout(said.timer);
    said.timer = setTimeout(() => {
      said.textContent = "";
    }, 2500);
  });
}

for (const panel of Object.values(PANELS)) {
  for (const id of panel.inputs) {
    $(id).addEventListener("input", () => {
      panel.run();
      press();
      remember();
    });
  }
}
$("validate-strict").addEventListener("click", (event) => {
  const button = event.currentTarget;
  button.setAttribute("aria-pressed", String(button.getAttribute("aria-pressed") !== "true"));
  validate();
  remember();
});
choices("parse-country", () => {
  parse();
  remember();
});
choices("format-style", () => {
  format();
  remember();
});
choices("clean-case", () => {
  clean();
  remember();
});

const extras = setUpExtras({
  $,
  say,
  facts,
  note,
  fine,
  badge,
  lines,
  quote,
  show,
  json,
  choices,
  remember,
});
restore();
render();
document.querySelector("main").dataset.ready = "true";
