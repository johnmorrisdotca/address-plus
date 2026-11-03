// The demo's Japan tool: a Japanese address taken apart, each part beside its reading, romaji and code.
// Everything typed or returned is set as text, never as HTML.
import { cell } from "./dom.js";
import {
  findMunicipalityByCode,
  findPrefecture,
  formatJapanese,
  formatJapaneseEnglish,
  getPrefectureFromJapanesePostalCode,
  parseLocation,
  validateJapaneseAddress,
} from "./lib/index.js";

/** Set up the Japan tool. `kit` is what demo.js shares: words, helpers and the page's state. */
function setUpJapan(kit) {
  const { $, say, facts, note, badge, quote, show, json } = kit;

  /** One row of the parts table: the part, as written, its reading, its romaji and its code. */
  function partRow(label, key, written, reading = "", romaji = "", code = "") {
    const row = document.createElement("tr");
    const head = cell("th", label);
    head.scope = "row";
    head.append(cell("code", key));
    const columns = [
      [written, "written", "japan_written"],
      [reading, "reading", "japan_reading"],
      [romaji, "romaji", "japan_romaji"],
      [code, "code", "japan_code"],
    ];
    // Each value carries its column's name, which a phone shows beside it when the table is laid out as cards.
    row.append(
      head,
      ...columns.map(([value, className, label]) => {
        const element = cell("td", value, className);
        element.dataset.label = say(label);
        if (!value) element.dataset.empty = "true";
        return element;
      }),
    );
    return row;
  }

  function japan() {
    const text = $("japan-input").value;
    const out = $("japan-answer");
    const address = parseLocation(text, { country: "JP" });
    if (address === null) {
      note(out, say("japan_none"));
      json("japan", null);
      show("japan-call", `parseJapaneseAddress(${quote(text)})  // null`);
      return;
    }
    const parts = say("japan_parts");
    const table = document.createElement("table");
    table.className = "parts";
    const headings = document.createElement("tr");
    for (const key of ["japan_part", "japan_written", "japan_reading", "japan_romaji", "japan_code"]) {
      const heading = cell("th", say(key));
      heading.scope = "col";
      headings.append(heading);
    }
    const head = document.createElement("thead");
    head.append(headings);
    const body = document.createElement("tbody");
    if (address.postalCode) {
      const delivered = findPrefecture(getPrefectureFromJapanesePostalCode(address.postalCode) ?? "");
      body.append(
        partRow(
          parts.postalCode,
          "postalCode",
          `〒${address.postalCode}`,
          "",
          "",
          delivered ? say("japan_delivers", { name: delivered.name }) : say("japan_unknown"),
        ),
      );
    }
    const prefecture = address.prefectureCode ? findPrefecture(address.prefectureCode) : null;
    if (address.prefecture) {
      body.append(
        partRow(
          parts.prefecture,
          "prefecture",
          address.prefecture,
          prefecture?.kana,
          prefecture?.romaji,
          address.prefectureCode,
        ),
      );
    }
    const municipality = address.municipalityCode ? findMunicipalityByCode(address.municipalityCode) : null;
    if (address.municipality) {
      body.append(
        partRow(
          parts.municipality,
          "municipality",
          address.municipality,
          municipality?.kana,
          municipality?.romaji,
          address.municipalityCode ?? say("japan_unknown"),
        ),
      );
    }
    if (address.streetDirections)
      body.append(partRow(parts.streetDirections, "streetDirections", address.streetDirections));
    if (address.town) body.append(partRow(parts.town, "town", address.town));
    if (address.block) {
      const markers = [
        address.chome && `${address.chome}丁目`,
        address.ban && `${address.ban}番`,
        address.go && `${address.go}号`,
      ]
        .filter(Boolean)
        .join("");
      const english = [
        address.chome && `chome ${address.chome}`,
        address.ban && `ban ${address.ban}`,
        address.go && `go ${address.go}`,
      ]
        .filter(Boolean)
        .join(", ");
      body.append(partRow(parts.block, "block", address.block, markers, english));
    }
    if (address.building) body.append(partRow(parts.building, "building", address.building));
    if (address.floor)
      body.append(
        partRow(
          parts.floor,
          "floor",
          address.floor.startsWith("B") ? `地下${address.floor.slice(1)}階` : `${address.floor}階`,
          "",
          `${address.floor}F`,
        ),
      );
    if (address.room) body.append(partRow(parts.room, "room", `${address.room}号室`, "", `Room ${address.room}`));
    table.append(head, body);
    const wrap = document.createElement("div");
    wrap.className = "parts-wrap";
    wrap.append(table);

    const japanese = formatJapanese(address, { blockStyle: "markers" });
    const english = formatJapaneseEnglish(address);
    const check = validateJapaneseAddress(address);
    const findings = [...check.errors, ...check.warnings];
    const verdict = document.createElement("span");
    verdict.className = "verdict";
    verdict.append(badge(findings.length === 0));
    for (const finding of findings)
      verdict.append(cell("code", finding.code), cell("span", finding.message, "fam-muted"));
    out.replaceChildren(wrap);
    const rest = document.createElement("div");
    facts(rest, [
      [say("japan_japanese"), kit.lines(japanese), "formatJapanese"],
      [say("japan_english"), kit.lines(english), "formatJapaneseEnglish"],
      [say("japan_check"), verdict, "validateJapaneseAddress"],
    ]);
    out.append(...rest.childNodes);
    json("japan", address);
    show(
      "japan-call",
      `const address = parseJapaneseAddress(${quote(text)});\nformatJapanese(address, { blockStyle: "markers" })  // ${quote(japanese)}\nformatJapaneseEnglish(address)  // ${quote(english)}`,
    );
  }

  return { japan };
}

export { setUpJapan };
