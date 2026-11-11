// The words of the family's page frame on address-plus's demo pages (kazoku-ui's page-frame), in one place: what each
// page is, in English and Japanese, and the data's credit line with the link to NOTICE.md. scripts/site.mjs writes them
// into the pages; the tests read the same table. The credit line carries what each licence asks for where the data is
// used, word for word as NOTICE.md's "The credit lines" gives it (read at build, so the two cannot disagree).

import { readFileSync, writeFileSync } from "node:fs";

import { pageCreditsHtml, pageHeaderHtml } from "@johnmorrisdotca/kazoku-ui/page-frame";
import { build } from "esbuild";

import { EMBED_CREDITS, NOTICE } from "../demo/credit-sources.js";

export { EMBED_CREDITS, NOTICE };

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

/**
 * The credit lines NOTICE.md gives under "The credit lines", word for word, one for each source: what each licence asks
 * for (the CC BY sources with the licence's address and the change; Ordnance Survey's statement with the Open Government
 * Licence's address; La Poste and INSEE with the day of their data and the Licence Ouverte's address).
 */
export const CREDIT_LINES = (() => {
  const notice = readFileSync(new URL("../NOTICE.md", import.meta.url), "utf8");
  const start = notice.indexOf("## The credit lines");
  const section = notice.slice(start, notice.indexOf("\n## ", start + 1));
  const lines = [...section.matchAll(/((?:^[ \t]*> .*\n)+)/gm)].map((match) =>
    match[1]
      .trim()
      .split("\n")
      .map((line) => line.trim().replace(/^> /, ""))
      .join(" "),
  );
  if (start < 0 || lines.length < 6) throw new Error('NOTICE.md\'s "The credit lines" has fewer than the six sources');
  return lines;
})();

/** The data's credit line on every page: each source's credit, word for word, and the region names. */
export const FRAME_CREDITS = {
  en: `Postcode data: ${CREDIT_LINES.join(" ")} Region names from kuni.`,
  ja: `郵便番号のデータの出典（原文のまま）：${CREDIT_LINES.join(" ")} 地域名はkuniのものです。`,
};

/** A page's <!--frame:header--> and <!--frame:credits--> filled with its frame: what it is, a way home, and the credits. */
export const framed = (html, file) =>
  html
    .replace("<!--frame:header-->", pageHeaderHtml(FRAME_TEXTS[file], { meta: true }))
    .replace("<!--frame:credits-->", pageCreditsHtml(FRAME_CREDITS, { href: NOTICE }));

/** The built embed page's small credit line, in its corner, and the page-frame part it loads, bundled beside the site. */
export async function frameEmbed(file) {
  writeFileSync(
    file,
    readFileSync(file, "utf8").replace(
      "<!--frame:credits-->",
      pageCreditsHtml(EMBED_CREDITS, { href: NOTICE, embed: true }),
    ),
  );
  await build({
    stdin: { contents: 'import "@johnmorrisdotca/kazoku-ui/page-frame/define";\n', resolveDir: process.cwd() },
    outfile: "site/kazoku-page-frame.js",
    bundle: true,
    format: "esm",
    minify: true,
    logLevel: "silent",
  });
}
