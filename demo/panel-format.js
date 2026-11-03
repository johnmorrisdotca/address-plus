// The format panel: an address written the way the post office prints it.
import { formatCanadaPost, formatJapanese, formatJapaneseEnglish, formatUSPS } from "./lib/index.js";
import { $, facts, fine, json, lines, moduleFormat, note, quote, read, say, show, WITH_MODULES } from "./shared.js";

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

export { format };
