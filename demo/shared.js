// What every panel of the demo shares: the page's language and its words, the elements an answer is written with, and the
// way every panel reads an address.
import { BRITISH, COUNTRIES, FRENCH } from "./countries.js";
import { formatAustraliaPost } from "./lib/au.js";
import { formatBrazilianPost } from "./lib/br.js";
import { formatDeutschePost } from "./lib/de.js";
import { formatCorreos } from "./lib/es.js";
import { formatLaPoste } from "./lib/fr.js";
import { formatRoyalMail, GB_NATIONS } from "./lib/gb.js";
import { formatIndiaPost } from "./lib/in.js";
import { parseLocation } from "./lib/index.js";
import { formatPosteItaliane } from "./lib/it.js";
import { formatKoreaPost } from "./lib/kr.js";
import { formatPostNL } from "./lib/nl.js";
import { formatNZPost } from "./lib/nz.js";
import { WORDS } from "./words.js";

const WITH_MODULES =
  "{ countries: [australia, brazil, france, germany, india, italy, netherlands, newZealand, southKorea, spain, unitedKingdom] }";

// The page draws itself again when the language changes; demo.js says how, once it has something to draw.
let redraw = () => {};
const whenLanguageChanges = (draw) => {
  redraw = draw;
};
const language = familyLanguage({ id: "address-plus", words: WORDS, onChange: () => redraw() });
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
/** The post office format of an address read by a country module, or null for the core's countries. */
function moduleFormat(address) {
  if (address?.country === "AU") return { format: formatAustraliaPost(address), call: "formatAustraliaPost" };
  if (FRENCH.has(address?.country)) return { format: formatLaPoste(address), call: "formatLaPoste" };
  if (address?.country === "DE") return { format: formatDeutschePost(address), call: "formatDeutschePost" };
  if (address?.country === "NL") return { format: formatPostNL(address), call: "formatPostNL" };
  if (address?.country === "ES") return { format: formatCorreos(address), call: "formatCorreos" };
  if (address?.country === "IT") return { format: formatPosteItaliane(address), call: "formatPosteItaliane" };
  if (address?.country === "IN") return { format: formatIndiaPost(address), call: "formatIndiaPost" };
  if (address?.country === "KR") return { format: formatKoreaPost(address), call: "formatKoreaPost" };
  if (address?.country === "BR") return { format: formatBrazilianPost(address), call: "formatBrazilianPost" };
  if (address?.country === "NZ") return { format: formatNZPost(address), call: "formatNZPost" };
  if (BRITISH.has(address?.country)) return { format: formatRoyalMail(address), call: "formatRoyalMail" };
  return null;
}

export {
  $,
  badge,
  countryName,
  facts,
  findings,
  fine,
  ja,
  json,
  language,
  lines,
  moduleFormat,
  nationName,
  note,
  percent,
  quote,
  read,
  say,
  show,
  titleCase,
  whenLanguageChanges,
  WITH_MODULES,
  yes,
};
