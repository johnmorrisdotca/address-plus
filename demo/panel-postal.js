// The postal panel: what a ZIP code, a postal code or a postcode says of where it delivers.
import { getStatesForAustralianPostcode } from "./lib/au.js";
import { DE_STATES, isKnownGermanPostcode, parseGermanPostcode } from "./lib/de.js";
import { ES_PROVINCES, isKnownSpanishPostcode, parseSpanishPostcode } from "./lib/es.js";
import { FR_COLLECTIVITIES, FR_DEPARTMENTS, isKnownFrenchPostcode, parseFrenchPostcode } from "./lib/fr.js";
import { GB_POSTCODE_AREAS, parseUKPostcode } from "./lib/gb.js";
import {
  findPrefecture,
  getPostalPrefixesForPrefecture,
  getPostalPrefixesForProvince,
  getPrefectureFromJapanesePostalCode,
  getProvinceFromPostalCode,
  getStateFromZip,
  getZipPrefixesForState,
  normalizeJapaneseAddressText,
  normalizeRegion,
  PROVINCE_EXPANSIONS_EN,
  US_STATE_EXPANSIONS,
} from "./lib/index.js";
import { isKnownItalianPostcode, IT_PROVINCES, parseItalianPostcode } from "./lib/it.js";
import { parseDutchPostcode } from "./lib/nl.js";
import { isKnownNewZealandPostcode, NZ_REGIONS, parseNewZealandPostcode } from "./lib/nz.js";
import { $, countryName, facts, ja, json, nationName, note, quote, say, show, titleCase } from "./shared.js";

// The shapes the postal panel reads, after full-width characters are made half-width.
const US_ZIP = /^\d{5}(-\d{4})?$/;
const CANADIAN_POSTAL = /^[A-Za-z]\d[A-Za-z]( ?\d[A-Za-z]\d)?$/;
const JAPANESE_POSTAL = /^〒?\s*\d{3}-?\d{4}$/;
const AUSTRALIAN_POSTCODE = /^\d{4}$/;
const DUTCH_POSTCODE = /^[1-9]\d{3}\s?[A-Za-z]{2}$/;

/** A region of a country's table as the page writes it: its code and its name in the page's language. */
const regionOf = (table, code) => {
  const region = table.find((one) => one.code === code);
  return region ? `${region.code} · ${ja() ? region.nameJa : region.name}` : say("postal_unknown");
};

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
    const rows = [
      [say("postal_kind"), kinds.au],
      [say("postal_region"), states.length > 0 ? states.join(" · ") : say("postal_unknown")],
    ];
    // Four digits that GeoNames' list for New Zealand has are a New Zealand postcode too.
    if (isKnownNewZealandPostcode(text)) {
      const zealand = parseNewZealandPostcode(text);
      called += `\nparseNewZealandPostcode(${quote(text)})  // { region: ${quote(zealand.region ?? null)} }`;
      answer = { states, newZealand: zealand };
      rows.push([say("postal_kind"), kinds.nz], [say("postal_region"), regionOf(NZ_REGIONS, zealand.region)]);
    }
    facts(out, rows);
  } else if (DUTCH_POSTCODE.test(text)) {
    const dutch = parseDutchPostcode(text);
    called = `parseDutchPostcode(${quote(text)})  // { postcode: ${quote(dutch.postcode)}, known: ${dutch.known} }`;
    answer = dutch;
    facts(out, [
      [say("postal_kind"), kinds.nl],
      [say("postal_region"), dutch.known ? dutch.postcode : say("postal_unknown")],
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
    const spanish = five && isKnownSpanishPostcode(text) ? parseSpanishPostcode(text) : null;
    const italian = five && isKnownItalianPostcode(text) ? parseItalianPostcode(text) : null;
    if (state || (!french && !german && !spanish && !italian)) {
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
    for (const [found, name, table, kind, label] of [
      [spanish, "parseSpanishPostcode", ES_PROVINCES, kinds.es, "spain"],
      [italian, "parseItalianPostcode", IT_PROVINCES, kinds.it, "italy"],
    ]) {
      if (!found) continue;
      called += `\n${name}(${quote(text)})  // { region: ${quote(found.region ?? null)} }`;
      answer =
        answer !== null && typeof answer === "object"
          ? { ...answer, [label]: found }
          : { ...(state ? { state } : {}), [label]: found };
      rows.push([say("postal_kind"), kind], [say("postal_region"), regionOf(table, found.region)]);
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

export { postal };
