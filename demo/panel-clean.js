// The clean panel: an address tidied, with each change listed.
import { cleanAddressDetailed, formatCanadaPost, formatJapanese, formatUSPS } from "./lib/index.js";
import { $, facts, json, moduleFormat, quote, read, say, show, yes } from "./shared.js";

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

export { clean };
