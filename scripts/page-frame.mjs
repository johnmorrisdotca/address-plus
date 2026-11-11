// The words of the family's page frame on address-plus's demo pages (kazoku-ui's page-frame), in one place: what each
// page is, in English and Japanese, and the data's credit line with the link to NOTICE.md. scripts/site.mjs writes them
// into the pages; the tests read the same table. The credit line carries what each licence asks for where the data is
// used: the CC BY sources by name, Ordnance Survey's own statement word for word as NOTICE.md quotes it (read at build,
// so the two cannot disagree), and the producers of the French data (Licence Ouverte 2.0).

import { readFileSync } from "node:fs";

/** Where every credit is written in full. */
export const NOTICE = "https://github.com/johnmorrisdotca/address-plus/blob/main/NOTICE.md";

export const INDEX_DESCRIPTION =
  "Try address-plus in your browser: a TypeScript address parser for the US, Canada and Japan, with Australia, France, Germany and the UK as modules of their own. Parse an address into its fields, validate it (a ZIP code, postal code or postcode from another state, province or prefecture is caught), write it out the USPS, Canada Post, Japanese, Australia Post, La Poste, Deutsche Post or Royal Mail way, compare two addresses, find the region of a postal code, and clean up a messy one. Free and open source, in English and Japanese.";
export const BUILDER_DESCRIPTION = "Choose a country and copy a private address input for a form.";

/** What each page is: its header line, its title and its description, in both languages. */
export const FRAME_TEXTS = {
  "index.html": {
    en: {
      name: "address-plus アドレスプラス",
      what: "parse, check and format addresses",
      description: INDEX_DESCRIPTION,
    },
    ja: {
      name: "アドレスプラス address-plus",
      what: "住所の解析・検証・書式化",
      description:
        "米国、カナダ、日本、オーストラリア、フランス、ドイツ、イギリスの住所を解析・検証・書式化・比較するTypeScriptパッケージです。どのパネルも、入力するとすぐに結果が表示されます。無料のオープンソースで、英語と日本語に対応しています。",
    },
  },
  "builder.html": {
    en: { name: "address-plus アドレスプラス", what: "form field builder", description: BUILDER_DESCRIPTION },
    ja: {
      name: "アドレスプラス address-plus",
      what: "住所の入力欄の埋め込みコードを作る",
      description:
        "国を選び、フォームの入力欄をプレビューで確認して、埋め込むコードをコピーできます。入力した住所は入力欄の中だけで扱います。",
    },
  },
};

/** Ordnance Survey's attribution statement for Code-Point Open, word for word as NOTICE.md quotes it. */
const OS_STATEMENT = (() => {
  const notice = readFileSync(new URL("../NOTICE.md", import.meta.url), "utf8");
  const quote = [...notice.matchAll(/((?:^[ \t]*> .*\n)+)/gm)]
    .map((match) =>
      match[1]
        .trim()
        .split("\n")
        .map((line) => line.trim().replace(/^> /, ""))
        .join(" "),
    )
    .find((text) => text.startsWith("Contains OS data"));
  if (quote === undefined) throw new Error("NOTICE.md quotes no Ordnance Survey statement");
  return quote;
})();

/** The data's credit line on every page, with what each licence asks for. */
export const FRAME_CREDITS = {
  en: `Postcode data: GeoNames, CBS (Statistics Netherlands) and the Australian Bureau of Statistics (CC BY 4.0); Ordnance Survey and Royal Mail (Open Government Licence v3.0): ${OS_STATEMENT} La Poste and INSEE (Licence Ouverte 2.0). Region names from kuni.`,
  ja: `郵便番号のデータは、GeoNames、CBS（オランダ統計局）、オーストラリア統計局（ABS）のもの（CC BY 4.0）、Ordnance SurveyとRoyal Mailのもの（Open Government Licence v3.0。原文のまま：${OS_STATEMENT}）、La PosteとINSEEのもの（Licence Ouverte 2.0）です。地域名はkuniのものです。`,
};

/** The small credit line in the corner of the embed page, linking the full credit. */
export const EMBED_CREDITS = {
  en: "Postcode data: GeoNames, CBS, ABS, OS, Royal Mail, La Poste and INSEE",
  ja: "郵便番号のデータ：GeoNames、CBS、ABS、OS、Royal Mail、La Poste、INSEE",
};
