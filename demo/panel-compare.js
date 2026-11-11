// The compare panel: two addresses judged to be the same place or not.
import { BRITISH, FRENCH } from "./countries.js";
import { compareAustralianAddresses } from "./lib/au.js";
import { compareBrazilianAddresses } from "./lib/br.js";
import { compareGermanAddresses } from "./lib/de.js";
import { compareSpanishAddresses } from "./lib/es.js";
import { compareFrenchAddresses } from "./lib/fr.js";
import { compareUKAddresses } from "./lib/gb.js";
import { compareIndianAddresses } from "./lib/in.js";
import { compareAddresses, isSameAddress } from "./lib/index.js";
import { compareItalianAddresses } from "./lib/it.js";
import { compareKoreanAddresses } from "./lib/kr.js";
import { compareDutchAddresses } from "./lib/nl.js";
import { compareNewZealandAddresses } from "./lib/nz.js";
import { $, badge, facts, json, note, percent, quote, read, say, show, WITH_MODULES } from "./shared.js";

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
    one.country === two.country && ["AU", "BR", "ES", "IN", "IT", "KR", "NL", "NZ"].includes(one.country)
      ? one.country
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
      ES: "compareSpanishAddresses",
      IT: "compareItalianAddresses",
      NL: "compareDutchAddresses",
      NZ: "compareNewZealandAddresses",
      BR: "compareBrazilianAddresses",
      IN: "compareIndianAddresses",
      KR: "compareKoreanAddresses",
    }[both];
    const compareWith = {
      AU: compareAustralianAddresses,
      DE: compareGermanAddresses,
      FR: compareFrenchAddresses,
      GB: compareUKAddresses,
      ES: compareSpanishAddresses,
      IT: compareItalianAddresses,
      NL: compareDutchAddresses,
      NZ: compareNewZealandAddresses,
      BR: compareBrazilianAddresses,
      IN: compareIndianAddresses,
      KR: compareKoreanAddresses,
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

export { compare };
