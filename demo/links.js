// Links and copies: what a link to the page holds, and the address bar kept in step with the boxes.
import { BULK_SAMPLE } from "./extras.js";
import { $ } from "./shared.js";

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

export { copy, linkWith, PANEL_STATE, remember, restore };
