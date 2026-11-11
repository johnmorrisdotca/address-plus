// The parse panel: an address read into its fields.
import { BRITISH, FRENCH } from "./countries.js";
import {
  FIELDS_AU,
  FIELDS_BR,
  FIELDS_DE,
  FIELDS_ES,
  FIELDS_FR,
  FIELDS_GB,
  FIELDS_IN,
  FIELDS_IT,
  FIELDS_JAPAN,
  FIELDS_KR,
  FIELDS_NL,
  FIELDS_NZ,
  FIELDS_WEST,
} from "./fields.js";
import { $, countryName, facts, fine, json, nationName, note, quote, read, say, show } from "./shared.js";

// ----- parse ------------------------------------------------------------------------------------------------

// The countries that come with a postcode table and the rules of their addresses.
const FIELDS_BY_COUNTRY = {
  BR: FIELDS_BR,
  ES: FIELDS_ES,
  IN: FIELDS_IN,
  IT: FIELDS_IT,
  KR: FIELDS_KR,
  NL: FIELDS_NL,
  NZ: FIELDS_NZ,
};

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
              : (FIELDS_BY_COUNTRY[address.country] ?? FIELDS_WEST);
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
    `parseLocation(${quote(text)}, { ${country === "auto" ? "" : `country: ${quote(country)}, `}countries: [australia, brazil, france, germany, india, italy, netherlands, newZealand, southKorea, spain, unitedKingdom] })  // ${address === null ? "null" : `{ country: ${quote(address.country)}${lead ? `, … ${quote(lead)}` : ""} }`}`,
  );
}

export { parse };
