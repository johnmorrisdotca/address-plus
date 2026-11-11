// The demo page's own script: one panel for each job the package does. Type in a panel and its answer is written
// as you type, from the package's own functions (bundled into ./lib/index.js when the site is built), in the
// language the header's chooser picks. Everything typed or returned is set as text, never as HTML.
import { setUpExtras } from "./extras.js";
import { copy, linkWith, PANEL_STATE, remember, restore } from "./links.js";
import { clean } from "./panel-clean.js";
import { compare } from "./panel-compare.js";
import { format } from "./panel-format.js";
import { parse } from "./panel-parse.js";
import { postal } from "./panel-postal.js";
import { validate } from "./panel-validate.js";
import { $, badge, facts, fine, json, language, lines, note, quote, say, show, whenLanguageChanges } from "./shared.js";

// ----- the page ---------------------------------------------------------------------------------------------

// Each panel: what draws its answer, its boxes, and its examples, each a label key and the value (or values) it
// puts in the boxes. The postal examples are their own labels.
const PANELS = {
  parse: {
    run: parse,
    inputs: ["parse-input"],
    examples: [
      ["us", "1600 Pennsylvania Ave NW, Washington, DC 20500"],
      ["landmark", "Empire State Building, 350 5th Avenue, New York NY 10118"],
      ["pobox", "PO Box 1234, Springfield, IL 62701"],
      ["corner", "Hollywood Blvd and Vine St, Los Angeles, CA"],
      ["toronto", "100 Queen St W, Toronto, ON M5H 2N2"],
      ["french", "1234 rue Sainte-Catherine O, Montréal, QC H3G 1P1"],
      ["kanji", "〒100-0005 東京都千代田区丸の内1丁目2番3号 サンプルビル5階501号室"],
      ["romaji", "1-2-3 Marunouchi, Chiyoda-ku, Tokyo 100-0005"],
      ["fullwidth", "〒５３０－０００１ 大阪府大阪市北区梅田３－１－１"],
      ["australia", "3/12 Smith St, Parramatta NSW 2150"],
      ["level", "Level 6, 51 Jacobson St, Brisbane QLD 4000"],
      ["france", "12 bis rue de la Paix, 75002 Paris"],
      ["residence", "Résidence Les Lilas, Apt 12, 4 av. des Écoles, 31000 Toulouse"],
      ["germany", "Hauptstraße 12a, 10115 Berlin"],
      ["careof", "c/o Weber, Hinterhaus, 2. OG, Kastanienallee 4b, 10435 Berlin"],
      ["flat", "Flat 2, Rose Court, 14 High St, Kingsbury, London NW9 0AA"],
      ["london", "10 Downing Street, London SW1A 2AA"],
      ["netherlands", "Keizersgracht 123A, 1015 CJ Amsterdam"],
      ["spain", "Calle de Alcalá, 42, 3º B, 28014 Madrid"],
      ["italy", "Via del Corso, 12/A, 00186 Roma RM"],
      ["newzealand", "3/45 Dominion Road, Mount Eden, Auckland 1024"],
      ["india", "Flat 4B, Sunshine Apartments, 12 MG Road, Indiranagar, Bengaluru, Karnataka 560038"],
      ["korea", "(04524) 서울특별시 중구 세종대로 110, 3층 (태평로1가)"],
      ["korealatin", "110 Sejong-daero, Jung-gu, Seoul 04524"],
      ["brazil", "Avenida Paulista, 1578 - Bela Vista, São Paulo - SP, 01310-200"],
    ],
  },
  validate: {
    run: validate,
    inputs: ["validate-input"],
    examples: [
      ["zip", "123 Main St, Seattle, NY 98101"],
      ["province", "100 Queen St W, Vancouver, BC M5H 2N2"],
      ["prefecture", "〒530-0001 東京都千代田区丸の内1-2-3"],
      ["complete", "1600 Pennsylvania Ave NW, Washington, DC 20500"],
      ["japan", "〒100-0005 東京都千代田区丸の内1-2-3"],
      ["short", "123 Main St"],
      ["australia", "1 Main St, Sydney VIC 2000"],
      ["france", "12 rue de la Paix, 75099 Paris"],
      ["germany", "Hauptstraße 12, 10000 Berlin"],
      ["monaco", "Place du Casino, 98000 Monaco"],
      ["jersey", "12 Bath Street, St Helier JE2 4ST"],
      ["netherlands", "Keizersgracht 123, 1000 AA Amsterdam"],
      ["spain", "Calle Mayor 5, 28999 Madrid"],
      ["italy", "Via Roma 12, 20121 Milano RM"],
      ["newzealand", "1 Queen Street, Auckland 9999"],
      ["india", "12 MG Road, Bengaluru, Kerala 560038"],
      ["korea", "부산광역시 중구 중앙대로 100 04524"],
      ["brazil", "Rua Augusta, 100, São Paulo - RJ, 01305-000"],
    ],
  },
  format: {
    run: format,
    inputs: ["format-input"],
    examples: [
      ["japan", "〒100-0005 東京都千代田区丸の内1丁目2番3号 サンプルビル5階501号室"],
      ["romaji", "Umeda 3-1-1, Kita-ku, Osaka-shi, Osaka 530-0001"],
      ["us", "123 Main Street Apt 4, Anytown, NY 12345"],
      ["canada", "100 Queen Street West, Toronto, Ontario M5H 2N2"],
      ["pobox", "PO Box 1234, Springfield, IL 62701"],
      ["australia", "Unit 3/12 Smith Street, Parramatta NSW 2150"],
      ["france", "Chez Mme Martin, Apt 5, 15 bis rue d'Aboukir, BP 12, 69003 Lyon"],
      ["germany", "c/o Weber, Hinterhaus, 2. OG, Kastanienallee 4b, 10435 Berlin"],
      ["uk", "Flat 2, Rose Court, 14 High St, Kingsbury, London NW9 0AA"],
      ["netherlands", "t.a.v. De Vries, Damstraat 1-2, 1012pk Amsterdam"],
      ["spain", "c/ Mayor 5, 3º izda, 28013 Madrid"],
      ["italy", "V.le Monza 12/A, Scala B, Int. 5, 20127 Milano (MI)"],
      ["newzealand", "3/45 Dominion Rd, Mount Eden, Auckland 1024"],
      ["india", "C/o Sharma, Flat 4B, Sunshine Apartments, 12 MG Road, Bengaluru, Karnataka 560038"],
      ["korea", "서울 중구 세종대로 110 3층 (태평로1가) 04524"],
      ["brazil", "Av. Paulista, 1578 - Apto 45 - Bela Vista, São Paulo - SP, 01310200"],
    ],
  },
  compare: {
    run: compare,
    inputs: ["compare-first", "compare-second"],
    examples: [
      ["abbreviations", ["123 Main Street, Anytown, NY 12345", "123 Main St, Anytown, New York 12345"]],
      ["typo", ["123 Main Street, Anytown, NY 12345", "125 Main Street, Anytown, NY 12345"]],
      ["canada", ["100 Queen St W, Toronto, ON M5H 2N2", "100 Queen Street West, Toronto, Ontario M5H2N2"]],
      ["fullwidth", ["東京都千代田区丸の内1丁目2番3号", "東京都千代田区丸の内１－２－３"]],
      ["australia", ["3/12 Smith Street, Parramatta NSW 2150", "Unit 3, 12 Smith St, PARRAMATTA New South Wales 2150"]],
      ["france", ["12 rue de l'Église, 38000 Grenoble", "12 R. DE L EGLISE, 38000 GRENOBLE"]],
      ["germany", ["Müllerstraße 5, 13353 Berlin", "MUELLERSTR. 5, 13353 BERLIN"]],
      ["uk", ["10 Downing Street, London SW1A 2AA", "10 DOWNING ST, LONDON, SW1A2AA"]],
      ["netherlands", ["Keizersgracht 123, 1015 CJ Amsterdam", "KEIZERSGRACHT 123, 1015CJ AMSTERDAM"]],
      ["spain", ["Calle de Alcalá, 42, 28014 Madrid", "C/ Alcala 42, 28014 MADRID"]],
      ["italy", ["Via del Corso 1, 00186 Roma", "V. del Corso, 1, 00186 ROMA"]],
      ["newzealand", ["45 Dominion Road, Auckland 1024", "45 DOMINION RD, AUCKLAND 1024"]],
      ["india", ["12 MG Road, Bengaluru 560038", "12 MG RD, BENGALURU 560 038"]],
      ["korea", ["110 Sejong-daero, Jung-gu, Seoul 04524", "110 SEJONGDAERO, JUNG-GU, SEOUL 04524"]],
      ["brazil", ["Avenida Paulista, 1578, São Paulo - SP, 01310-200", "AV. PAULISTA 1578, SAO PAULO/SP, 01310200"]],
      ["different", ["123 Main St, Springfield, IL 62701", "456 Oak Ave, Portland, OR 97201"]],
    ],
  },
  postal: {
    run: postal,
    inputs: ["postal-input"],
    examples: [
      "98101",
      "10118-0110",
      "M5H 2N2",
      "H3G",
      "100-0005",
      "５３０－０００１",
      "2620",
      "75008",
      "1015 CJ",
      "28014",
      "00186",
      "560038",
      "01310-200",
      "80331",
      "20200",
      "98714",
      "SW1A 2AA",
      "CH5 1AA",
      "JE2 3AB",
      "WA",
      "Quebec",
      "大阪府",
      "Hokkaido",
    ].map((value) => [null, value]),
  },
  clean: {
    run: clean,
    inputs: ["clean-input"],
    examples: [
      ["capitals", "350 FIFTH AVENUE, NEW YORK, NY 10118"],
      ["spaces", "742 evergreen terrace,springfield ,  il 62704"],
      ["canada", "  10 wellington   street , ottawa , on k1a 0a6"],
      ["japan", "〒１００－０００５　東京都千代田区丸の内１－２－３"],
      ["australia", "  3/12  smith st , parramatta  nsw 2150"],
      ["uk", "flat 2 , 14 high st ,  london   nw9 0aa"],
    ],
  },
  japan: {
    run: () => extras.japan(),
    inputs: ["japan-input"],
    examples: [
      ["kyoto", "〒604-8571 京都府京都市中京区寺町通御池上る上本能寺前町488"],
      ["tokyo", "東京都千代田区丸の内一丁目二番三号 サンプルビル五階"],
      ["sapporo", "〒060-0001 北海道札幌市中央区北1条西2丁目"],
      ["romaji", "Sample Bldg 5F, 1-2-3 Marunouchi, Chiyoda-ku, Tokyo 100-0005, Japan"],
      ["rural", "長野県北佐久郡軽井沢町大字軽井沢1323番地1"],
      ["sakai", "大阪府堺市堺区熊野町東3丁1番9号"],
      ["merged", "埼玉県浦和市高砂3-15-1"],
    ],
  },
};

/** The example buttons, labelled in the page's language; each holds the full address as its hover text. */
function fillExamples() {
  for (const [name, panel] of Object.entries(PANELS)) {
    const labels = say("chips")[name] ?? {};
    $(`${name}-examples`).replaceChildren(
      ...panel.examples.map(([key, example]) => {
        const values = [].concat(example);
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = key === null ? values[0] : (labels[key] ?? key);
        button.title = values.join("\n");
        button.dataset.value = values.join("|");
        button.addEventListener("click", () => {
          panel.inputs.forEach((id, index) => {
            $(id).value = values[index];
          });
          panel.run();
          press();
          remember();
        });
        return button;
      }),
    );
  }
  press();
}

/** The example that is on show is the one pressed. */
function press() {
  for (const [name, panel] of Object.entries(PANELS)) {
    const now = panel.inputs.map((id) => $(id).value).join("|");
    $(`${name}-examples`)
      .querySelectorAll("button")
      .forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.value === now)));
  }
}

/** A row of choices of which exactly one is pressed: pressing one redraws its panel. */
function choices(id, run) {
  const row = $(id);
  row.querySelectorAll("button").forEach((button) =>
    button.addEventListener("click", () => {
      row.querySelectorAll("button").forEach((other) => other.setAttribute("aria-pressed", String(other === button)));
      run();
    }),
  );
}

function render() {
  document
    .querySelector('[data-say="pageDocs"]')
    ?.setAttribute("href", language.lang === "ja" ? "docs/ja/index.html" : "docs/index.html");
  language.say();
  fillExamples();
  for (const panel of Object.values(PANELS)) panel.run();
  extras.bulk();
  extras.corpusView();
}

for (const button of document.querySelectorAll("[data-copy]")) {
  button.addEventListener("click", async () => {
    const panel = button.dataset.panel;
    const what = button.dataset.copy;
    const text = what === "code" ? $(`${panel}-call`).textContent : linkWith(PANEL_STATE[panel], `#${panel}`);
    const done = await copy(text);
    const said = document.querySelector(`[data-testid="${panel}-copied"]`);
    said.textContent = done ? say(what === "code" ? "copied_code" : "copied_link") : say("copy_failed");
    said.dataset.copied = what;
    clearTimeout(said.timer);
    said.timer = setTimeout(() => {
      said.textContent = "";
    }, 2500);
  });
}

for (const panel of Object.values(PANELS)) {
  for (const id of panel.inputs) {
    $(id).addEventListener("input", () => {
      panel.run();
      press();
      remember();
    });
  }
}
$("validate-strict").addEventListener("click", (event) => {
  const button = event.currentTarget;
  button.setAttribute("aria-pressed", String(button.getAttribute("aria-pressed") !== "true"));
  validate();
  remember();
});
choices("parse-country", () => {
  parse();
  remember();
});
choices("format-style", () => {
  format();
  remember();
});
choices("clean-case", () => {
  clean();
  remember();
});

const extras = setUpExtras({
  $,
  say,
  facts,
  note,
  fine,
  badge,
  lines,
  quote,
  show,
  json,
  choices,
  remember,
});
whenLanguageChanges(render);
restore();
render();
document.querySelector("main").dataset.ready = "true";
