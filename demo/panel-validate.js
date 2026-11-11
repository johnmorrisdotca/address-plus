// The validate panel: an address checked, with what is wrong with it and how sure the package is.
import { COUNTRIES } from "./countries.js";
import { validateAddress } from "./lib/index.js";
import { $, badge, countryName, facts, findings, json, percent, quote, say, show } from "./shared.js";

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
    `validateAddress(${quote(text)}, { countries: [australia, brazil, france, germany, india, italy, netherlands, newZealand, southKorea, spain, unitedKingdom]${strict ? ", strictPostalValidation: true" : ""} })  // { isValid: ${result.isValid}${first ? `, ${result.errors.length > 0 ? "errors" : "warnings"}: [${quote(first.code)}${result.errors.length + result.warnings.length > 1 ? ", …" : ""}]` : ""} }`,
  );
}

export { validate };
