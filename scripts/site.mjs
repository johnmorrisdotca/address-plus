// Builds the static demo for GitHub Pages into ./site: the page, written here from the family's shared header and
// footer, with the family's stylesheet, the page's own, its script and words, the library bundled for the browser,
// and the API reference made from the source.
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

import { build } from "tsup";

import { API_CSS, apiOf, apiPage, header, ICON, MEMBER, runExamples } from "./api.mjs";
import {
  FAMILY_EMBED_BUILDER_WORDS,
  FAMILY_SCRIPT,
  familyEmbedBuilder,
  familyFooter,
  familyHead,
  familyUnreviewed,
} from "./family-template.mjs";

const { id } = MEMBER;

// The lines of "Using it": each is run against the built package, and the answer it gives is written after it.
const USES = {
  useImport: `import { parseLocation, validateAddress, formatJapanese } from "@johnmorrisdotca/address-plus";`,
  useParse: `parseLocation("1600 Pennsylvania Ave NW, Washington, DC 20500")?.state`,
  useJapan: `parseLocation("東京都千代田区丸の内１－２－３")?.block`,
  useValidate: `validateAddress("123 Main St, Seattle, NY 98101").warnings[0].code`,
  useFormat: `formatJapanese(parseLocation("〒100-0005 東京都千代田区丸の内1-2-3"), { blockStyle: "markers", multiline: false })`,
  useSame: `isSameAddress(parseLocation("123 Main Street, Anytown, NY 12345"), parseLocation("123 Main St, Anytown, New York 12345"))`,
  usePostal: `getPrefectureFromJapanesePostalCode("530-0001")`,
  useJp: `import { parseJapaneseAddress } from "@johnmorrisdotca/address-plus/jp";`,
  useAuImport: `import { australia } from "@johnmorrisdotca/address-plus/au";`,
  useDeImport: `import { germany } from "@johnmorrisdotca/address-plus/de";`,
  useFrImport: `import { france } from "@johnmorrisdotca/address-plus/fr";`,
  useGbImport: `import { unitedKingdom } from "@johnmorrisdotca/address-plus/gb";`,
  useAu: `parseLocation("3/12 Smith St, Parramatta NSW 2150", { countries: [australia, france, germany, unitedKingdom] })?.secUnitNum`,
  useFr: `parseLocation("12 bis rue de la Paix, 75002 Paris", { countries: [australia, france, germany, unitedKingdom] })?.numberExtension`,
  useDe: `parseLocation("Hauptstraße 12a, 10115 Berlin", { countries: [australia, france, germany, unitedKingdom] })?.number`,
  useGb: `parseLocation("10 Downing St, London SW1A 2AA", { countries: [australia, france, germany, unitedKingdom] })?.nation`,
};

const escape = (text) =>
  String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** An option row: a label and the fields, with the help line the Help switch shows in either language. */
const row = (help, content) =>
  `<div class="fam-row" data-help-en="${escape(help[0])}" data-help-ja="${escape(help[1])}">${content}</div>`;
const field = (name, key, value, { pair = false } = {}) =>
  `${pair ? `<span class="pair">` : ""}<label class="fam-label" for="${name}" data-say="${key}"></label><input id="${name}" class="fam-field" data-testid="${name}" type="text" spellcheck="false" autocomplete="off" autocapitalize="off" autocorrect="off" value="${escape(value)}" />${pair ? "</span>" : ""}`;
const exampleRow = (name, help) =>
  `<div class="fam-seg" role="group" data-say-label="examples" id="${name}-examples" data-testid="${name}-examples" data-help-en="${escape(help[0])}" data-help-ja="${escape(help[1])}"></div>`;
/** A row of choices, exactly one pressed: [{ say, data, value, pressed }]. */
const choices = (name, label, attribute, options) =>
  `<span class="fam-label" data-say="${label}"></span><div class="fam-seg" role="group" data-say-label="${label}" id="${name}" data-testid="${name}">${options
    .map(
      (option) =>
        `<button type="button" data-${attribute}="${option.value}" aria-pressed="${option.pressed === true}" data-say="${option.say}"></button>`,
    )
    .join("")}</div>`;

/** Under each call: copy the call as code, and copy a link that opens the page with this panel's input in it. */
const shareTools = (name) =>
  `<div class="tools" data-testid="${name}-tools"><button type="button" class="fam-button" data-copy="code" data-panel="${name}" data-testid="${name}-copy-code" data-say="copy_code" data-say-title="copy_code_tip"></button><button type="button" class="fam-button" data-copy="link" data-panel="${name}" data-testid="${name}-copy-link" data-say="copy_link" data-say-title="copy_link_tip"></button><span class="copied fam-muted" data-testid="${name}-copied" aria-live="polite"></span></div>`;

/** A panel: its title and the function it shows, what it does, what to type, the examples, the answer, the call and the JSON. */
const panel = ({
  name,
  code,
  fields,
  help,
  options = "",
  exampleHelp,
  wide = false,
}) => `<section class="fam-panels job${wide ? " wide" : ""}" id="${name}" aria-labelledby="${name}-title" data-testid="${name}-panel">
        <div class="fam-panel">
          <h2 id="${name}-title"><span data-say="${name}_title"></span> <code>${code}</code></h2>
          <p class="blurb" data-say="${name}_blurb"></p>
          ${row(help, fields)}${options}
          ${exampleRow(name, exampleHelp)}
          <div class="answer" id="${name}-answer" data-testid="${name}-answer" aria-live="polite"></div>
          <pre class="call" id="${name}-call" data-testid="${name}-call" aria-label="the call"></pre>
          ${shareTools(name)}
          <details class="fam-fold" data-testid="${name}-fold">
            <summary data-say="json"></summary>
            <pre class="json" id="${name}-json" data-testid="${name}-json"></pre>
          </details>
        </div>
      </section>`;

const panels = [
  panel({
    name: "parse",
    code: "parseLocation",
    fields: field("parse-input", "input", "1600 Pennsylvania Ave NW, Washington, DC 20500"),
    help: [
      "Type an address from the US, Canada, Japan, Australia, France, Germany or the UK. Each part of it is shown in its own field.",
      "米国、カナダ、日本、オーストラリア、フランス、ドイツ、イギリスの住所を入力します。住所の各部分が、それぞれの項目に分かれて表示されます。",
    ],
    options: `
          ${row(
            [
              "Which country to read the address as. Detect finds it from the address; any other choice is the country hint, which reads the address as that country's whatever it ends with.",
              "どの国の住所として読むかを選びます。「自動判定」は住所から国を判定します。ほかを選ぶと、住所の書き方にかかわらず、その国の住所として読みます。",
            ],
            choices("parse-country", "parse_country", "country", [
              { say: "parse_auto", value: "auto", pressed: true },
              { say: "parse_us", value: "US", pressed: false },
              { say: "parse_ca", value: "CA", pressed: false },
              { say: "parse_jp", value: "JP", pressed: false },
              { say: "parse_au", value: "AU", pressed: false },
              { say: "parse_fr", value: "FR", pressed: false },
              { say: "parse_de", value: "DE", pressed: false },
              { say: "parse_gb", value: "GB", pressed: false },
            ]),
          )}`,
    exampleHelp: [
      "Fill the box with an example: a street address, a landmark, a PO box, an intersection, Canada in English and French, Japan in Japanese script, in romaji and in full-width digits, Australia with a unit and a level, France with a bis and a residence, Germany with a street and its number, and the UK with a flat and with a postcode alone.",
      "例を入力欄に入れます：番地のある住所、建物名つき、私書箱、交差点、英語とフランス語のカナダの住所、日本語・ローマ字・全角数字の日本の住所、部屋番号や階のあるオーストラリアの住所、枝番や建物名のあるフランスの住所、通り名の後に番地が来るドイツの住所、フラットつきのイギリスの住所と、郵便番号だけのイギリスの住所。",
    ],
  }),
  panel({
    name: "validate",
    code: "validateAddress",
    fields: field("validate-input", "input", "123 Main St, Seattle, NY 98101"),
    help: [
      "Type an address. Whether it is valid, how sure the parser is, and every error and warning are listed.",
      "住所を入力します。有効かどうか、解析の信頼度、エラーと警告をすべて示します。",
    ],
    options: `
          ${row(
            [
              "Strict postal codes: a postal code that belongs to another region, or is in the wrong shape, makes the address invalid instead of raising a warning.",
              "郵便番号の厳密な検査：別の地域の郵便番号や形式の正しくない郵便番号があると、警告にとどまらず、住所が無効と判定されます。",
            ],
            `<span class="fam-label" data-say="options"></span><button type="button" class="fam-button" id="validate-strict" data-testid="validate-strict" aria-pressed="false" data-say="validate_strict"></button>`,
          )}`,
    exampleHelp: [
      "Fill the box with an example: a ZIP code from another state, a Canadian postal code from another province, a Japanese postal code from another prefecture, an Australian postcode from another state, a Jersey postcode, a French postcode La Poste does not list, a German one GeoNames does not list, Monaco, two complete addresses and one that is not.",
      "例を入れます：別の州の ZIP コード、別の州のカナダの郵便番号、別の都道府県の日本の郵便番号、別の州のオーストラリアの郵便番号、ジャージー島の郵便番号、フランスの一覧にない郵便番号、ドイツの一覧にない郵便番号、モナコ、完全な住所が二つ、不完全な住所が一つ。",
    ],
  }),
  panel({
    name: "format",
    code: "formatUSPS · formatCanadaPost · formatJapanese · formatAustraliaPost · formatLaPoste · formatDeutschePost · formatRoyalMail",
    fields: field("format-input", "input", "〒100-0005 東京都千代田区丸の内1丁目2番3号 サンプルビル5階501号室"),
    help: [
      "Type an address. It is written out in its country's postal format.",
      "住所を入力します。その国の郵便の書式で書き直します。",
    ],
    options: `
          ${row(
            [
              "How a Japanese block number is written: 1-2-3, or with its markers, 1丁目2番3号.",
              "日本の番地の書き方：1-2-3 とするか、1丁目2番3号 のように書くかを選びます。",
            ],
            choices("format-style", "format_block", "style", [
              { say: "format_hyphen", value: "hyphen", pressed: false },
              { say: "format_markers", value: "markers", pressed: true },
            ]),
          )}`,
    exampleHelp: [
      "Fill the box with an example: Japan in Japanese script and in romaji, a US address with a unit, a Canadian one, a PO box, Australia with a unit, France with a residence and a box, Germany with a c/o line and a floor, and the UK with a flat.",
      "例を入れます：日本語とローマ字の日本の住所、部屋番号つきの米国の住所、カナダの住所、私書箱、部屋番号つきのオーストラリアの住所、建物名と私書箱のあるフランスの住所、気付と階のあるドイツの住所、フラットつきのイギリスの住所。",
    ],
  }),
  panel({
    name: "compare",
    code: "compareAddresses · isSameAddress · compareAustralianAddresses · compareFrenchAddresses · compareGermanAddresses · compareUKAddresses",
    fields: `${field("compare-first", "compare_first", "123 Main Street, Anytown, NY 12345", { pair: true })}${field("compare-second", "compare_second", "123 Main St, Anytown, New York 12345", { pair: true })}`,
    help: [
      "Type two addresses. They are parsed and compared field by field.",
      "住所を二つ入力します。それぞれ読み取ってから、項目ごとに比べます。",
    ],
    exampleHelp: [
      "Fill both boxes with an example: abbreviations against full names, a typo, Canada, kanji against full-width digits, Australia's 3/12 against Unit 3, France's av. against avenue, Germany's Straße against Str., a UK postcode with and without its space, two different places.",
      "二つの欄に例を入れます：略語と正式名、打ち間違い、カナダの住所、漢字と全角数字、オーストラリアの「3/12」と「Unit 3」、フランスの「av.」と「avenue」、ドイツの「Straße」と「Str.」、空白ありとなしのイギリスの郵便番号、まったく別の場所。",
    ],
  }),
  panel({
    name: "postal",
    code: "getStateFromZip · getPrefectureFromJapanesePostalCode · getStatesForAustralianPostcode · parseFrenchPostcode · parseGermanPostcode · parseUKPostcode",
    fields: field("postal-input", "input", "98101"),
    help: [
      "Type a ZIP code or a postal code or postcode to find its region, or a region's code or name to list its codes.",
      "郵便番号を入力すると地域が、地域のコードか名前を入力するとそこで使われる番号がわかります。",
    ],
    exampleHelp: [
      "Fill the box with an example: US ZIP codes, Canadian postal codes, Japanese postal codes in half-width and full-width digits, an Australian postcode that serves two states, French postcodes in Paris, Corsica and French Polynesia, German postcodes in Berlin and Bavaria, British postcodes in England, Wales and Jersey, then a state, a province and two prefectures.",
      "例を入れます：米国の ZIP コード、カナダの郵便番号、半角と全角の日本の郵便番号、二つの州にまたがるオーストラリアの郵便番号、パリ、コルシカ島、仏領ポリネシアの郵便番号、ベルリンとバイエルンの郵便番号、イングランド、ウェールズ、ジャージー島の郵便番号、そして米国の州、カナダの州、都道府県が二つ。",
    ],
  }),
  panel({
    name: "clean",
    code: "cleanAddressDetailed",
    fields: field("clean-input", "input", "350 FIFTH AVENUE, NEW YORK, NY 10118"),
    help: [
      "Paste an address typed in a hurry. It comes back tidied, with what was changed.",
      "急いで入力したような住所を貼り付けます。整えた住所と、変更点を返します。",
    ],
    options: `
          ${row(
            [
              "How capitals are set in the cleaned address: capital first letters, all capitals, or as typed.",
              "整えた住所の大文字と小文字：語頭だけ大文字、すべて大文字、入力のままから選びます。",
            ],
            choices("clean-case", "clean_case", "case", [
              { say: "clean_title_case", value: "title", pressed: true },
              { say: "clean_upper", value: "upper", pressed: false },
              { say: "clean_asis", value: "none", pressed: false },
            ]),
          )}`,
    exampleHelp: [
      "Fill the box with an example: all capitals, stray spaces in lower case, a Canadian address, a Japanese one in full-width digits.",
      "例を入れます：すべて大文字、小文字で空白の乱れた住所、カナダの住所、全角数字の日本の住所。",
    ],
  }),
  panel({
    name: "japan",
    code: "parseJapaneseAddress · formatJapanese · formatJapaneseEnglish · validateJapaneseAddress",
    fields: field("japan-input", "input", "〒604-8571 京都府京都市中京区寺町通御池上る上本能寺前町488"),
    help: [
      "Type a Japanese address in Japanese script or in romaji. Each part is shown in Japanese beside its reading and romaji from the tables.",
      "日本の住所を、日本語またはローマ字で入力します。各部分を日本語で、データにある読み・ローマ字と並べて表示します。",
    ],
    exampleHelp: [
      "Fill the box with an example: Kyoto's street directions, a Tokyo block in kanji numerals, a Sapporo grid town, romaji in English order, a rural 大字 land lot, Sakai's 丁, and a city merged away in 2001.",
      "例を入れます：京都の通り名、漢数字で書いた東京の番地、札幌の条丁目、英語の順に書いたローマ字、大字の地番、堺市の「丁」、2001年に合併して今はない市。",
    ],
    wide: true,
  }),
];

const bulkHelp = [
  "Paste a list of addresses, one to a line, from the US, Canada, Japan, Australia, France, Germany or the UK, mixed as they come. Each line is parsed, checked and written the post office's way.",
  "住所の一覧を、1行に1件ずつ貼り付けます。米国、カナダ、日本、オーストラリア、フランス、ドイツ、イギリスの住所が混ざっていてもかまいません。1行ずつ解析し、検証して、郵便の書式で書き直します。",
];
const bulkActionsHelp = [
  "Fill the box with a mixed list to try, or empty it.",
  "試しに、国が混ざった住所の一覧を入れるか、入力欄を空にします。",
];
const bulkDownloadHelp = [
  "Save the table: CSV for a spreadsheet, JSON with every field, TXT with one cleaned address per line, Markdown for a note, or SQL for a database. For MySQL SQL imports, enable ANSI_QUOTES and NO_BACKSLASH_ESCAPES first.",
  "表を保存します。表計算ソフト用の CSV、全項目入りの JSON、整えた住所を1行に1件ずつ並べた TXT、メモ用のMarkdown、データベース用のSQLから選べます。MySQLにSQLを読み込む場合は、先にANSI_QUOTESとNO_BACKSLASH_ESCAPESを有効にしてください。",
];

/** Paste a list: every line parsed, checked and formatted, in a table to save as CSV, JSON or text. */
const bulkSection = `<section class="fam-panels job wide" id="bulk" aria-labelledby="bulk-title" data-testid="bulk-panel">
        <div class="fam-panel">
          <h2 id="bulk-title"><span data-say="bulk_title"></span> <code>parseLocation · validateAddress · formatUSPS · formatCanadaPost · formatJapanese · formatAustraliaPost · formatLaPoste · formatDeutschePost · formatRoyalMail</code></h2>
          <p class="blurb" data-say="bulk_blurb"></p>
          ${row(bulkHelp, `<label class="fam-label" for="bulk-input" data-say="bulk_list"></label><textarea id="bulk-input" class="fam-field bulk-input" data-testid="bulk-input" rows="7" spellcheck="false" autocomplete="off" autocapitalize="off" autocorrect="off"></textarea>`)}
          ${row(bulkActionsHelp, `<span class="fam-label" data-say="bulk_try"></span><div class="tools"><button type="button" class="fam-button" data-testid="bulk-sample" data-say="bulk_sample" data-say-title="bulk_sample_tip"></button><button type="button" class="fam-button" data-testid="bulk-clear" data-say="bulk_clear" data-say-title="bulk_clear_tip"></button></div>`)}
          <div class="bulk-summary" id="bulk-summary" data-testid="bulk-summary" aria-live="polite"></div>
          <div class="bulk-wrap" data-testid="bulk-wrap" tabindex="0" data-say-label="bulk_table"><table class="bulk-table" id="bulk-table" data-testid="bulk-table"></table></div>
          ${row(bulkDownloadHelp, `<span class="fam-label" data-say="bulk_save"></span><div class="tools"><button type="button" class="fam-button" data-download="csv" data-testid="bulk-csv" data-say-title="bulk_csv_tip">CSV</button><button type="button" class="fam-button" data-download="json" data-testid="bulk-json" data-say-title="bulk_json_tip">JSON</button><button type="button" class="fam-button" data-download="txt" data-testid="bulk-txt" data-say-title="bulk_txt_tip">TXT</button><button type="button" class="fam-button" data-download="md" data-testid="bulk-md" data-say-title="bulk_md_tip">Markdown</button><button type="button" class="fam-button" data-download="sql" data-testid="bulk-sql" data-say-title="bulk_sql_tip">SQL</button></div>`)}
          <pre class="call" id="bulk-call" data-testid="bulk-call" aria-label="the call"></pre>
        </div>
      </section>`;

const corpusFilterHelp = [
  "Narrow the list: one country's cases, only the cases the parser still gets wrong, or the cases whose input holds what you type.",
  "一覧を絞り込みます。国ごと、まだ正しく読めない例だけ、または入力した文字を含む例だけを表示できます。",
];

/** The test corpus, fetched only when asked for, every case run in this browser against what it expects. */
const corpusSection = `<section class="fam-panels job wide" id="corpus" aria-labelledby="corpus-title" data-testid="corpus-panel">
        <div class="fam-panel">
          <h2 id="corpus-title"><span data-say="corpus_title"></span> <code>test-data/corpus</code></h2>
          <p class="blurb" data-say="corpus_blurb"></p>
          <div class="tools"><button type="button" class="fam-button" data-primary="true" data-testid="corpus-load" data-say="corpus_load"></button></div>
          <div class="corpus-summary" data-testid="corpus-summary" aria-live="polite"></div>
          <div class="corpus-filters" data-testid="corpus-filters" hidden>
            ${row(
              corpusFilterHelp,
              `${choices("corpus-country", "corpus_country", "country", [
                { say: "corpus_all", value: "all", pressed: true },
                { say: "corpus_us", value: "us", pressed: false },
                { say: "corpus_canada", value: "canada", pressed: false },
                { say: "corpus_japan", value: "japan", pressed: false },
                { say: "corpus_au", value: "au", pressed: false },
                { say: "corpus_fr", value: "fr", pressed: false },
                { say: "corpus_de", value: "de", pressed: false },
                { say: "corpus_gb", value: "gb", pressed: false },
              ])}<button type="button" class="fam-button" id="corpus-wrong" data-testid="corpus-wrong" aria-pressed="false" data-say="corpus_wrong" data-say-title="corpus_wrong_tip"></button>${field("corpus-search", "corpus_search", "")}`,
            )}
          </div>
          <p class="fam-fine" data-testid="corpus-count" aria-live="polite"></p>
          <ol class="corpus-list" data-testid="corpus-list"></ol>
        </div>
      </section>`;

/** The page, from the panels and the lines of "Using it" with their answers. */
function page(uses) {
  return `<!doctype html>
<html lang="en">
  <head>
    ${familyHead({
      id,
      title: "address-plus アドレスプラス — US and Canadian address parser",
      description:
        "Try address-plus in your browser: a TypeScript address parser for the US, Canada and Japan, with Australia, France, Germany and the UK as modules of their own. Parse an address into its fields, validate it (a ZIP code, postal code or postcode from another state, province or prefecture is caught), write it out the USPS, Canada Post, Japanese, Australia Post, La Poste, Deutsche Post or Royal Mail way, compare two addresses, find the region of a postal code, and clean up a messy one. Free and open source, in English and Japanese.",
      ogTitle: "address-plus アドレスプラス — US and Canadian address parser",
      ogDescription:
        "Parse, validate, format and compare addresses from the US, Canada, Japan, Australia, France, Germany and the UK, including Japanese script, romaji and full-width digits. One small dependency.",
    })}
    <link rel="icon" href="${ICON}" />
    <link rel="stylesheet" href="family.css" />
    <link rel="stylesheet" href="address-plus.css" />
  </head>
  <body>
    <main>
      ${header({
        id,
        links: [
          { href: "docs/index.html", say: "pageDocs" },
          { href: "api.html", say: "pageApi" },
          { href: "builder.html", say: "pageBuilder" },
        ],
      })}
      <div class="jobs">
      ${panels.slice(0, 6).join("\n      ")}
      ${bulkSection}
      ${panels.slice(6).join("\n      ")}
      ${corpusSection}
      </div>
      ${familyUnreviewed({ id })}
      <section class="more" aria-labelledby="more-title">
        <h2 id="more-title" data-say="moreTitle"></h2>
        <p data-say="moreText"></p>
        <ul class="uses">
          ${uses.map((line) => `<li><code>${escape(line)}</code></li>`).join("\n          ")}
        </ul>
      </section>
      ${familyFooter({ id })}
    </main>
    <script>${FAMILY_SCRIPT}</script>
    <script type="module" src="demo.js"></script>
  </body>
</html>
`;
}

const api = apiOf();
const runnable = Object.fromEntries(Object.entries(USES).filter(([, code]) => !code.startsWith("import ")));
const examples = await runExamples(api, runnable);
const uses = Object.entries(USES).map(([key, code]) =>
  code.startsWith("import ") ? code : `${code}  // ${examples[key].result}`,
);

rmSync("site", { recursive: true, force: true });
mkdirSync("site", { recursive: true });
cpSync("demo", "site", { recursive: true });
// The browser gets the whole library as one ES module (fast-levenshtein, which is CommonJS, and hikidashi bundled in),
// and each country module as one of its own.
await build({
  config: false,
  entry: {
    index: "src/index.ts",
    element: "src/element.ts",
    "element-define": "src/element-define.ts",
    au: "src/au/index.ts",
    de: "src/de/index.ts",
    fr: "src/fr/index.ts",
    gb: "src/gb/index.ts",
  },
  format: ["esm"],
  platform: "browser",
  target: "es2022",
  splitting: true,
  noExternal: [/.*/],
  outDir: "site/lib",
  dts: false,
  sourcemap: false,
  minify: true,
  clean: true,
  silent: true,
});
writeFileSync("site/index.html", page(uses));
// The corpus, for the page's corpus browser: every case with what it is checked on, and nothing else (no sources or
// descriptions), fetched by the page only when asked for.
// A case of a country module's folder carries the hint its suite reads it with; the page adds the modules.
const HINTS = { au: "AU", de: "DE", fr: "FR", gb: "GB" };
const corpus = ["us", "canada", "japan", "au", "fr", "de", "gb"].flatMap((country) =>
  readdirSync(`test-data/corpus/${country}`)
    .filter((file) => file.endsWith(".json") && file !== "parity.json")
    .sort()
    .flatMap((file) => {
      const data = JSON.parse(readFileSync(`test-data/corpus/${country}/${file}`, "utf8"));
      return Object.entries(data.tests).flatMap(([group, cases]) =>
        cases.map((one) => ({
          country,
          file: file.replace(/\.json$/, ""),
          group,
          name: one.name,
          input: one.input,
          expected: one.expected,
          ...(one.options || HINTS[country]
            ? { options: { ...(HINTS[country] ? { country: HINTS[country] } : {}), ...one.options } }
            : {}),
          ...(one.partial ? { partial: true } : {}),
          ...(one.ignoreCase ? { ignoreCase: one.ignoreCase } : {}),
          ...(one.todo ? { todo: true, todoNote: one.todoNote } : {}),
        })),
      );
    }),
);
writeFileSync("site/corpus.json", JSON.stringify(corpus));
// The API reference, made from the source: every export of every entry point, each function with an example.
writeFileSync("site/api.css", API_CSS);
writeFileSync("site/api.html", apiPage({ api, examples }));
console.log("site/ is ready: serve it, or let the Pages workflow publish it.");

const packageInfo = JSON.parse(readFileSync("package.json", "utf8"));
writeFileSync("site/field-version.js", `export const PACKAGE_VERSION = ${JSON.stringify(packageInfo.version)};\n`);
writeFileSync(
  "site/family-embed-builder.js",
  `export const FAMILY_EMBED_BUILDER_WORDS = ${JSON.stringify(FAMILY_EMBED_BUILDER_WORDS)};\nexport ${familyEmbedBuilder.toString()};\n`,
);
const builderParts = {
  builderHead: familyHead({
    id,
    title: "address-plus アドレスプラス — US and Canadian address parser · Build a form field embed",
    description: "Choose a country and copy a private address input for a form.",
  }),
  builderHeader: header({
    id,
    links: [
      { href: "./", say: "toGallery" },
      { href: "docs/index.html", say: "pageDocs" },
      { href: "api.html", say: "pageApi" },
    ],
  }),
  unreviewed: familyUnreviewed({ id }),
  footer: familyFooter({ id }),
  script: `<script>${FAMILY_SCRIPT}</script>`,
};
writeFileSync(
  "site/builder.html",
  readFileSync("demo/builder.html", "utf8").replace(/<!-- family:([A-Za-z]+) -->/g, (_match, key) => builderParts[key]),
);
cpSync("demo/embed", "site/embed", { recursive: true });
for (const file of ["builder.js", "builder.css"]) cpSync(`demo/${file}`, `site/${file}`);
