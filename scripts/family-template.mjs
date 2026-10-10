// family-template.mjs: the header, the footer and the language chooser that every
// johnmorrisdotca package's demo site shares, beside family.css. Copied unchanged into
// each repository (scripts/family-template.mjs); a package never edits it.
//
// It is also the one list of the family: FAMILY (who, in what order), FAMILY_PITCH (a line on each) and
// FAMILY_TEMPLATE_VERSION (the day this text was last changed). The footer reads the list, and so does the
// README's "The family" block, which scripts/family-readme.mjs writes from it. A change here is made in every
// repository at once, with a new version marker, and `family.test.js` (src/ or test/) holds every copy to one
// recorded hash.
//
// A site script uses it at build time:
//
//   import { FAMILY_SCRIPT, familyFooter, familyHead, familyHeader, familyUnreviewed } from "./family-template.mjs";
//
//   const page = `<!doctype html><html lang="en"><head>${familyHead({ id: "kyuubu", title, description })}
//     <link rel="stylesheet" href="family.css" /><link rel="stylesheet" href="site.css" /></head>
//     <body><main>${familyHeader({ id: "kyuubu" })} … ${familyUnreviewed({ id: "kyuubu" })} … ${familyFooter({ id: "kyuubu" })}</main>
//     <script>${FAMILY_SCRIPT}</script><script type="module"> … familyLanguage({ id: "kyuubu", words: WORDS, onChange }) … </script></body></html>`;
//
// The page's own words are a table { en: { pitch, name, nameLink, foot, … }, ja: { … } }; every
// element with data-say="key" is given words[lang][key] as text, never as HTML.
//
// THE HELP SWITCH. The header carries a "Help" / 「説明」 switch beside the cloth patches, a fixed width in
// both languages and no taller than a patch, so that the header wraps and measures the same in both. Off (the
// default), a demo looks as it always did. On, every OPTION ROW shows one short plain line under it,
// saying what the row does and how to use it. A page marks a row with the words for it in both
// languages, and the template does the rest:
//
//   <div class="fam-row" data-help-en="Pick how many dice." data-help-ja="ダイスの数を選びます。">…</div>
//
// - The line is a <p class="fam-help"> the template adds as the row's last child, or right after the
//   element when that is a `.fam-seg` pill (a pill cannot hold a line) or says data-help-after (a
//   container the page's own script fills and walks the children of). It is one full line under the
//   options. It asks for no width of its own, so a row that sits beside others keeps its size, and it
//   takes no room while the switch is off. A page draws nothing itself. Rows a page draws later are
//   found too (a MutationObserver), so a row that is re-rendered keeps its line.
// - Every button inside a marked row that has no title of its own gets the row's line as its hover
//   text, in either state of the switch. A control that deserves its own words says them with
//   data-tip-en / data-tip-ja, which set `title` on any element, marked row or not.
// - The choice is kept on the device (localStorage "johnmorrisdotca.help", one key for the whole family
//   because the demos share an origin) and may be asked for in the address (?help=on or ?help=off).
// - <html data-help="on|off"> says which; a "family-help" event ({ detail: { on } }) fires on each change,
//   for a component that draws its own rows (it keeps its own words and shows its own lines).
// - `familyHelp.refresh()` re-reads the rows now; `familyHelp.on` and `familyHelp.set(true|false)` read and change it.

const OWNER = "johnmorrisdotca";

/** The day this file was last changed, in every repository at once. A test records the file's hash beside it. */
export const FAMILY_TEMPLATE_VERSION = "2026-10-09-embed-builder-words";

/** The packages, in the order the footer lists them. `kana` is the name as it is written in Japanese. */
export const FAMILY = [
  { id: "domino", name: "Domino", kana: "ドミノ" },
  { id: "gunjin", name: "Gunjin", kana: "軍人" },
  { id: "narabe", name: "Narabe", kana: "並べ" },
  { id: "sugoroku", name: "Sugoroku", kana: "双六" },
  { id: "tenka", name: "Tenka", kana: "天下" },
  { id: "hitotsu", name: "Hitotsu", kana: "一つ" },
  { id: "jarajara", name: "Jarajara", kana: "ジャラジャラ" },
  { id: "kumimoji", name: "Kumimoji", kana: "組み文字" },
  { id: "toranpu", name: "Toranpu", kana: "トランプ" },
  { id: "houseki", name: "Houseki", kana: "宝石" },
  { id: "jirai", name: "Jirai", kana: "地雷" },
  { id: "karakuri", name: "Karakuri", kana: "からくり" },
  { id: "kazu", name: "Kazu", kana: "数" },
  { id: "kyuubu", name: "Kyuubu", kana: "キューブ" },
  { id: "meikyuu", name: "Meikyuu", kana: "迷宮" },
  { id: "suido", name: "Suido", kana: "水道" },
  { id: "tobiishi", name: "Tobiishi", kana: "飛び石" },
  { id: "tsunagi", name: "Tsunagi", kana: "繋ぎ" },
  { id: "korokoro", name: "Korokoro", kana: "コロコロ" },
  { id: "tane", name: "Tane", kana: "種" },
  { id: "bushu", name: "Bushu", kana: "部首" },
  { id: "hikidashi", name: "Hikidashi", kana: "引き出し" },
  { id: "kotoba", name: "Kotoba", kana: "言葉" },
  { id: "address-plus", name: "address-plus", kana: "アドレスプラス", repo: "https://github.com/johnmorrisdotca/address-plus", site: "https://johnmorrisdotca.github.io/address-plus/" },
  { id: "chizu", name: "Chizu", kana: "地図" },
  { id: "hata", name: "Hata", kana: "旗" },
  { id: "kuni", name: "Kuni", kana: "国" },
  { id: "rest-in-pieces", name: "REST in Pieces", kana: "レスト・イン・ピーシーズ", repo: "https://github.com/spxis/rest-in-pieces", site: "https://spxis.github.io/rest-in-pieces/" },
];

/** The kinds, in display order, with members alphabetical within each kind. */
export const FAMILY_GROUPS = [
  { id: "board", en: "Games — board", ja: "ボードゲーム", members: ["domino", "gunjin", "narabe", "sugoroku", "tenka"] },
  { id: "cards", en: "Games — cards & tiles", ja: "カードと牌のゲーム", members: ["hitotsu", "jarajara", "kumimoji", "toranpu"] },
  { id: "puzzles", en: "Games — puzzles", ja: "パズルゲーム", members: ["houseki", "jirai", "karakuri", "kazu", "kyuubu", "meikyuu", "suido", "tobiishi", "tsunagi"] },
  { id: "random", en: "Games — dice & random", ja: "ダイスと乱数", members: ["korokoro", "tane"] },
  { id: "language", en: "Language", ja: "ことばと文字", members: ["bushu", "hikidashi", "kotoba"] },
  { id: "geography", en: "Geography & data", ja: "地理とデータ", members: ["address-plus", "chizu", "hata", "kuni"] },
  { id: "developer", en: "Developer tools", ja: "開発ツール", members: ["rest-in-pieces"] },
];

/**
 * One line on each package, for the README's "The family" block: lower case, no full stop, no number that can
 * fall behind the code. Kept apart from FAMILY so that a package's own test can still match a member's row
 * whole.
 */
export const FAMILY_PITCH = {
  korokoro: "dice, with notation, exact odds, real sounds and the dice of many games",
  kyuubu: "a turning cube for the browser, 2×2 to 7×7, with record solves to replay",
  hitotsu: "a colour-card shedding game for two to eight, with the house rules people play",
  toranpu: "a deck of playing cards, card games with computer players, and solitaires",
  tane: "seeded random numbers and daily seeds, the same in every browser and on every server",
  narabe: "one rules engine for abstract board games, from gomoku and Reversi to Go and checkers",
  tenka: "world conquest for two to six, on a map of the real world",
  kumimoji: "a crossword tile race, in English and Japanese kana",
  tsunagi: "a line-joining logic puzzle whose every level has exactly one answer",
  jarajara: "mahjong tiles drawn as SVG, stacked layouts, and the matching solitaire Awase",
  suido: "a pipe puzzle: turn the pieces until the water reaches every drain",
  domino: "dominoes and Mexican Train",
  kotoba: "word lists and word-game rules in English, French, German and Japanese",
  sugoroku: "backgammon and its variants, with the doubling cube and match play",
  kazu: "grid number puzzles: Sudoku and its variants, Futoshiki and Skyscrapers",
  meikyuu: "mazes on squares, hexagons, triangles and circles, made from a seed and drawn through with a finger or the mouse",
  hikidashi: "a drawer of small Japanese text tools: era dates, kanji numerals, readings and sentence difficulty",
  chizu: "maps of the world and of countries' regions, in English and Japanese, with a quiz and callouts",
  bushu: "find a kanji by the parts it is made of",
  tobiishi: "peg solitaire with nine boards and seeded solvable challenges",
  jirai: "minesweeper on shaped grids with verified no-guess boards",
  gunjin: "five hidden-rank strategy games with pass-the-device play",
  karakuri: "eight hyper-casual puzzle games, some of them physics: draw a shield, pull pins, cut ropes, slide blocks, pour tubes",
  houseki: "gem and stone matching puzzles: falling triplets, stone collapse, colour chains and gem swap",
  "address-plus": "parse and format addresses in the United States, Canada, Japan, Australia and the United Kingdom",
  "hata": "country and regional flags as SVG, at their true proportions and keyed by ISO code",
  "kuni": "countries and their regions, with ISO codes and names in English and Japanese",
  "rest-in-pieces": "seeded test data and REST APIs for frontend development, with latency and error drills",
};

/** Japanese pitches for the new geography and developer members; awaiting native review. */
export const FAMILY_PITCH_JA = {
  "address-plus": "アメリカ、カナダ、日本、オーストラリア、イギリスの住所を解析・整形",
  "hata": "国と行政区画の旗を、実際の縦横比のSVGで収録。ISOコードで引けます",
  "kuni": "世界の国と行政区画を、ISOコードと英語・日本語の名称つきで収録",
  "rest-in-pieces": "フロントエンド開発向けの、シード値で固定できるテストデータとREST API（遅延・エラーの再現つき）",
};

/**
 * THE CLOTHS A TABLE MAY BE LAID IN, the same five itsutsu.com's boards offer: green (the family's own,
 * and the default), blue, red, black, and wood. Each is the felt's colour, its deep edge, and the ink
 * written on it. Chosen on the patches in every demo's header (`familyCloth`), kept in the address
 * (`?cloth=`) and on this device for every demo of the family, since they are one site.
 */
export const FAMILY_CLOTHS = {
  green: { felt: "#2f5d4a", deep: "#1f4135", ink: "#f3efe4" },
  blue: { felt: "#2865a6", deep: "#1a4677", ink: "#f3efe4" },
  red: { felt: "#a3342e", deep: "#7a231f", ink: "#f3efe4" },
  black: { felt: "#2f3236", deep: "#1b1d20", ink: "#ece8dc" },
  wood: { felt: "#e2ba7a", deep: "#c4954f", ink: "#2b1d0e" },
};

/** The words the shared header and footer say themselves, in both languages. A page's own table is laid over these. */
export const FAMILY_WORDS = {
  en: { family: "The family:", licence: "MIT", help: "Help", helpTip: "Show a short note under each option, saying what it does", cloth: "Table cloth", cloth_green: "Green", cloth_blue: "Blue", cloth_red: "Red", cloth_black: "Black", cloth_wood: "Wood", ...Object.fromEntries(FAMILY_GROUPS.map((group) => [`family_${group.id}`, group.en])) },
  ja: { family: "ファミリー：", licence: "MIT", help: "説明", helpTip: "各項目の下に、その使い方を短く表示します", cloth: "テーブルの色", cloth_green: "緑", cloth_blue: "青", cloth_red: "赤", cloth_black: "黒", cloth_wood: "木目", ...Object.fromEntries(FAMILY_GROUPS.map((group) => [`family_${group.id}`, group.ja])) },
};

const escape = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const member = (id) => {
  const found = FAMILY.find((one) => one.id === id);
  if (found === undefined) throw new Error(`${id} is not in the family`);
  return found;
};
export const familyRepo = (id) => member(id).repo ?? `https://github.com/${OWNER}/${id}`;
const repo = familyRepo;
export const familySite = (id) => member(id).site ?? `https://${OWNER}.github.io/${id}/`;
const site = familySite;
const npm = (id) => `https://www.npmjs.com/package/@${OWNER}/${id}`;

/** The lines of <head> every site shares: charset, viewport, title, description, theme colour, Open Graph. The page adds its icon and its stylesheets. */
export function familyHead({ id, title, description, ogTitle, ogDescription }) {
  member(id);
  return [
    `<meta charset="utf-8" />`,
    `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />`,
    `<title>${escape(title)}</title>`,
    `<meta name="description" content="${escape(description)}" />`,
    `<meta name="theme-color" content="#2f5d4a" />`,
    `<meta property="og:title" content="${escape(ogTitle ?? title)}" />`,
    `<meta property="og:description" content="${escape(ogDescription ?? description)}" />`,
  ].join("\n    ");
}

/**
 * The header: the name with its kana, the pitch (data-say="pitch"), a line on the name
 * (data-say="name", and a link to the README's "The name", data-say="nameLink"), the
 * "English · 日本語" chooser, the cloth patches, the Help switch, and the GitHub and npm pills. `links` adds pills before those
 * two: [{ href, say }] where `say` is a key in the page's words.
 */
export function familyHeader({ id, links = [] }) {
  const { name, kana } = member(id);
  return `<header>
        <div class="intro">
          <h1>${name}<span lang="ja">${kana}</span></h1>
          <p data-say="pitch"></p>
          <p class="name"><span data-say="name"></span> <a href="${repo(id)}#the-name" data-say="nameLink"></a></p>
        </div>
        <nav>
          <div class="lang" role="group" aria-label="Language / 言語">
            <button type="button" data-lang="en" lang="en">English</button>
            <button type="button" data-lang="ja" lang="ja">日本語</button>
          </div>${links.map((link) => `\n          <a href="${escape(link.href)}" data-say="${escape(link.say)}"></a>`).join("")}
          <div class="cloth" role="radiogroup" data-say-label="cloth" style="display:inline-flex;gap:0;align-items:center">${Object.entries(FAMILY_CLOTHS)
            .map(([name, cloth]) => `<button type="button" role="radio" data-cloth="${name}" data-say-label="cloth_${name}" style="width:44px;height:44px;min-width:44px;padding:8px;border:0;border-radius:12px;cursor:pointer;background:radial-gradient(120% 90% at 30% 20%, ${cloth.felt} 0%, ${cloth.deep} 100%) content-box;box-shadow:inset 0 0 0 8px transparent"></button>`)
            .join("")}</div>
          <button type="button" class="fam-button" data-help-switch aria-pressed="false" data-say="help" data-say-title="helpTip" style="min-width:68px"></button>
          <a href="${repo(id)}">GitHub</a>
          <a href="${npm(id)}">npm</a>
        </nav>
      </header>`;
}

/** The line shown only in Japanese: that the Japanese has not yet been read by a native reader, with the way to correct it. */
export function familyUnreviewed({ id }) {
  member(id);
  return `<p class="unreviewed" id="unreviewed" lang="ja" hidden>この日本語は、まだ日本語を母語とする方の確認を受けていません。<a href="${repo(id)}/issues/new?template=fix-a-translation.md">訂正を歓迎します</a>。</p>`;
}

/** The footer: the page's own note (data-say="foot"), the install line and the licence, and the family, each by its demo site, this package marked as the one being read. */
export function familyFooter({ id }) {
  member(id);
  const groups = FAMILY_GROUPS.map((group) => {
    const links = group.members.map((memberId) => {
      const one = member(memberId);
      const pitch = FAMILY_PITCH_JA[one.id] === undefined ? "" : ` data-tip-en="${escape(FAMILY_PITCH[one.id])}" data-tip-ja="${escape(FAMILY_PITCH_JA[one.id])}"`;
      return `<a href="${site(one.id)}"${one.id === id ? ` aria-current="page"` : ""}${pitch}>${escape(one.name)}</a>`;
    }).join("");
    return `<span class="family-group" style="display:flex;flex-wrap:wrap;align-items:center;gap:0 4px;flex:1 1 100%;min-width:0"><strong data-say="family_${group.id}">${escape(group.en)}</strong>${links}</span>`;
  }).join("");
  return `<footer>
        <span data-say="foot"></span>
        <span><code>npm install @${OWNER}/${id}</code> · <a href="${repo(id)}/blob/main/LICENSE" data-say="licence"></a> © John Morris</span>
        <span class="family"><span data-say="family"></span>${groups}<a href="https://itsutsu.com">itsutsu.com</a></span>
      </footer>`;
}

/**
 * The chooser's behaviour, as the source of a classic script that defines `familyLanguage`.
 * The address first (?lang=ja or ?lang=en), then what this device chose, then the browser's
 * language. `familyLanguage({ id, words, onChange })` fills every [data-say], sets <html lang>,
 * presses the right button, shows the not-yet-reviewed line in Japanese only, and returns
 * { lang, asked, say(), set(lang) }. `onChange(lang)` runs after each switch, not on the first fill.
 * [data-say-label] sets aria-label, [data-say-placeholder] sets placeholder and [data-say-title] sets title, the same way.
 * Each switch of language also re-reads the rows marked for the Help switch (see the top of this file).
 */
export const FAMILY_SCRIPT = `var familyHelp = (function familyHelpSwitch() {
  var KEY = "johnmorrisdotca.help";
  var STYLE = ".fam-help{display:none;flex:1 1 100%;grid-column:1/-1;width:0;min-width:100%;margin:0;font-size:.8rem;line-height:1.35;font-weight:400;letter-spacing:0;text-transform:none;text-align:left;color:var(--muted)}html[data-help=on] .fam-help{display:block}.fam-felt .fam-help{color:inherit;opacity:.85}";
  var style = document.createElement("style");
  style.id = "family-help-style";
  style.textContent = STYLE;
  document.head.appendChild(style);
  var root = document.documentElement;
  var asked = new globalThis.URLSearchParams(location.search).get("help");
  var kept = null;
  try { kept = localStorage.getItem(KEY); } catch (error) { /* A browser that keeps nothing starts with Help off. */ }
  var state = { on: asked === "on" || asked === "1" ? true : asked === "off" || asked === "0" ? false : kept === "on" };
  var japanese = function () { return root.lang === "ja"; };
  // The words of an element in the page's language, the other language's when this one has none.
  var words = function (el, name) {
    var en = el.getAttribute("data-" + name + "-en");
    var ja = el.getAttribute("data-" + name + "-ja");
    return japanese() ? (ja !== null ? ja : en) : (en !== null ? en : ja);
  };
  var nearestRow = function (el) { return el.closest("[data-help-en],[data-help-ja]"); };
  var refresh = function () {
    document.querySelectorAll("[data-help-en],[data-help-ja]").forEach(function (row) {
      var text = words(row, "help");
      var line = null;
      // A segmented choice is a pill, so its line goes under it; so does a container a page's own script fills
      // and counts the children of, which says data-help-after. Any other row holds its line as its last child.
      var under = row.classList.contains("fam-seg") || row.hasAttribute("data-help-after");
      if (under) {
        if (row.nextElementSibling !== null && row.nextElementSibling.classList.contains("fam-help")) line = row.nextElementSibling;
      } else {
        for (var at = 0; at < row.children.length; at += 1) if (row.children[at].classList.contains("fam-help")) line = row.children[at];
      }
      if (line === null) {
        line = document.createElement("p");
        line.className = "fam-help";
        if (under) row.insertAdjacentElement("afterend", line); else row.appendChild(line);
      }
      if (line.textContent !== text) line.textContent = text;
      // Every button of the row says what the row does on hover, unless it has words of its own.
      row.querySelectorAll("button, [role=button]").forEach(function (button) {
        if (nearestRow(button) !== row || button.hasAttribute("data-tip-en") || button.hasAttribute("data-tip-ja")) return;
        if (button.hasAttribute("title") && !button.hasAttribute("data-help-title")) return;
        if (button.getAttribute("title") !== text) button.setAttribute("title", text);
        button.setAttribute("data-help-title", "");
      });
    });
    document.querySelectorAll("[data-tip-en],[data-tip-ja]").forEach(function (el) {
      var text = words(el, "tip");
      if (el.getAttribute("title") !== text) el.setAttribute("title", text);
    });
  };
  var pending = false;
  new MutationObserver(function () {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; refresh(); });
  }).observe(document.body, { childList: true, subtree: true });
  var show = function (on, keep) {
    state.on = on;
    root.dataset.help = on ? "on" : "off";
    document.querySelectorAll("[data-help-switch]").forEach(function (button) { button.setAttribute("aria-pressed", String(on)); });
    if (keep) {
      try { localStorage.setItem(KEY, on ? "on" : "off"); } catch (error) { /* Not remembered; still shown. */ }
    }
    document.dispatchEvent(new CustomEvent("family-help", { detail: { on: on } }));
  };
  document.querySelectorAll("[data-help-switch]").forEach(function (button) {
    button.addEventListener("click", function () { show(!state.on, true); });
  });
  state.refresh = refresh;
  state.set = function (on) { show(Boolean(on), true); };
  show(state.on, false);
  refresh();
  return state;
})();
(function familyCloth() {
  var CLOTHS = ${JSON.stringify(FAMILY_CLOTHS)};
  var KEY = "johnmorrisdotca.cloth";
  var asked = new globalThis.URLSearchParams(location.search).get("cloth");
  var kept = null;
  try { kept = localStorage.getItem(KEY); } catch (error) { /* A browser that keeps nothing starts on green. */ }
  var wear = function (name, keep) {
    if (!(name in CLOTHS)) name = "green";
    var cloth = CLOTHS[name];
    var root = document.documentElement.style;
    root.setProperty("--felt", cloth.felt);
    root.setProperty("--felt-deep", cloth.deep);
    root.setProperty("--felt-ink", cloth.ink);
    document.documentElement.dataset.cloth = name;
    document.querySelectorAll("[data-cloth]").forEach(function (patch) {
      if (patch === document.documentElement) return;
      var chosen = patch.dataset.cloth === name;
      patch.setAttribute("aria-checked", String(chosen));
      // The patch is the middle 28 pixels of a 44-pixel button: the chosen one is ringed close round it.
      patch.style.outline = chosen ? "2px solid currentColor" : "none";
      patch.style.outlineOffset = "-5px";
    });
    if (keep) {
      try { localStorage.setItem(KEY, name); } catch (error) { /* Not remembered; still worn. */ }
      var query = new globalThis.URLSearchParams(location.search);
      if (name === "green") query.delete("cloth"); else query.set("cloth", name);
      var search = query.toString();
      globalThis.history.replaceState(history.state, "", location.pathname + (search ? "?" + search : "") + location.hash);
    }
    document.dispatchEvent(new CustomEvent("family-cloth", { detail: { cloth: name, colours: cloth } }));
  };
  document.querySelectorAll("button[data-cloth]").forEach(function (patch) {
    patch.addEventListener("click", function () { wear(patch.dataset.cloth, true); });
  });
  wear(asked !== null ? asked : kept !== null ? kept : "green", false);
})();
function familyLanguage(options) {
  var SHARED = ${JSON.stringify(FAMILY_WORDS)};
  var KEY = options.id + ".page.lang";
  var asked = new globalThis.URLSearchParams(location.search).get("lang");
  if (asked !== "ja" && asked !== "en") asked = null;
  var kept = null;
  try { kept = localStorage.getItem(KEY); } catch (error) { /* A browser that keeps nothing follows its own language. */ }
  var pick = function (tag) { return String(tag).toLowerCase().indexOf("ja") === 0 ? "ja" : "en"; };
  var state = { lang: asked !== null ? asked : kept === "ja" || kept === "en" ? kept : pick(navigator.language), asked: asked };
  var word = function (key) {
    var own = options.words[state.lang] || {};
    return key in own ? own[key] : SHARED[state.lang][key];
  };
  state.word = word;
  state.say = function () {
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-say]").forEach(function (el) { var text = word(el.dataset.say); if (text !== undefined) el.textContent = text; });
    document.querySelectorAll("[data-say-label]").forEach(function (el) { var text = word(el.dataset.sayLabel); if (text !== undefined) el.setAttribute("aria-label", text); });
    document.querySelectorAll("[data-say-placeholder]").forEach(function (el) { var text = word(el.dataset.sayPlaceholder); if (text !== undefined) el.setAttribute("placeholder", text); });
    document.querySelectorAll("[data-say-title]").forEach(function (el) { var text = word(el.dataset.sayTitle); if (text !== undefined) el.setAttribute("title", text); });
    familyHelp.refresh();
    document.querySelectorAll("[data-lang]").forEach(function (button) { button.setAttribute("aria-pressed", String(button.dataset.lang === state.lang)); });
    var note = document.getElementById("unreviewed");
    if (note !== null) note.hidden = state.lang !== "ja";
  };
  state.set = function (lang) {
    state.lang = lang === "ja" ? "ja" : "en";
    try { localStorage.setItem(KEY, state.lang); } catch (error) { /* Not remembered; still switched. */ }
    state.say();
    if (typeof options.onChange === "function") options.onChange(state.lang);
  };
  document.querySelectorAll("[data-lang]").forEach(function (button) {
    button.addEventListener("click", function () { state.set(button.dataset.lang); });
  });
  state.say();
  return state;
}`;

/**
 * The shared embed builder. A package supplies its option list, groups, makers,
 * version and words; rendering a live preview remains the package's job.
 * This function is self-contained so a site can emit it as a browser module.
 */
export const FAMILY_EMBED_BUILDER_WORDS = {
  "en": {
    "pitch": "Choose settings, preview the embed, and copy the code for your page.",
    "previewTitle": "Preview",
    "makerLabel": "What to build",
    "notSet": "Not set",
    "on": "On",
    "off": "Off",
    "reset": "Reset",
    "startAgain": "Start again",
    "copy": "Copy code",
    "copied": "Copied.",
    "copyLink": "Copy a link to this setup",
    "linkCopied": "The link is copied.",
    "codeTitle": "The code",
    "codeText": "Choose how to embed this on your page.",
    "onlyDifferent": "Only choices that differ from the defaults are included in the code.",
    "defaultIs": "Default: {value}"
  },
  "ja": {
    "pitch": "設定を選んでプレビューを確認し、ページに埋め込むコードをコピーできます。",
    "previewTitle": "プレビュー",
    "makerLabel": "作るもの",
    "notSet": "指定なし",
    "on": "オン",
    "off": "オフ",
    "reset": "元に戻す",
    "startAgain": "最初からやり直す",
    "copy": "コードをコピー",
    "copied": "コピーしました。",
    "copyLink": "この設定へのリンクをコピー",
    "linkCopied": "リンクをコピーしました。",
    "codeTitle": "コード",
    "codeText": "ページへの埋め込み方法を選びます。",
    "onlyDifferent": "初期値と異なる選択だけがコードに含まれます。",
    "defaultIs": "初期値：{value}"
  }
};

export function familyEmbedBuilder(config) {
  const japaneseChoices = {"small": "小", "medium": "中", "large": "大", "auto": "自動", "light": "明るい", "dark": "暗い", "en": "英語", "ja": "日本語", "fr": "フランス語", "on": "オン", "off": "オフ", "none": "なし", "standard": "標準", "paper": "紙", "stickerless": "ステッカーレス", "focus": "フォーカス中", "page": "ページ全体", "fast": "速い", "normal": "標準", "slow": "遅い", "green": "緑", "blue": "青", "red": "赤", "black": "黒", "wood": "木", "own": "本来の縦横比", "round": "丸", "plain": "シンプル", "four-colour": "4色", "english": "イギリス式", "realistic": "写実的", "classic-red": "クラシック（赤）", "classic-blue": "クラシック（青）", "ink-dots": "水玉", "rank": "数字順", "suit": "スート順", "face": "絵札順", "front": "先頭", "end": "末尾", "dealt": "配られた順", "kind": "種類順", "code": "コード順", "one": "1つだけ", "jade": "翡翠", "bamboo": "竹", "ink": "墨", "jarajara": "ジャラジャラ", "riichi": "リーチ麻雀", "riichi-black": "リーチ麻雀（黒）", "marble": "マーブル", "bright": "鮮やか", "colour-blind": "色覚に配慮", "soft": "やわらかい", "classic": "通常", "portals": "ワープ", "colours": "色", "numbers": "数字", "marbles": "玉", "lines": "線", "clockwise": "時計回り", "anticlockwise": "反時計回り", "world": "世界", "water": "水域", "all": "すべて", "place": "答えを入れる", "show": "表示", "count": "数える", "easy": "やさしい", "hard": "むずかしい"};
  const displayChoice = (option, lang, value) => option.choiceLabels?.[lang]?.[value] ?? (lang === "ja" ? option.id === "level" && value === "medium" ? "ふつう" : japaneseChoices[value] : undefined) ?? value;
  const titleFor = (settings) => String(globalThis.document?.documentElement?.lang ?? settings.lang ?? "en").startsWith("ja") ? config.titleJa ?? config.title ?? "埋め込み" : config.title ?? "Embed";
  const { packageName, major, site, makers, options = [], groups = {}, leftOut = {} } = config;
  if (!packageName || !/^\d+$/.test(String(major))) throw new Error("An embed builder needs a package name and npm major");
  const cdn = `https://cdn.jsdelivr.net/npm/${packageName}@${major}/dist/element-define.js`;
  const formats = config.formats ?? {
    element: { label: { en: "Custom element", ja: "カスタム要素" }, language: "html" },
    image: { label: { en: "Image", ja: "画像" }, language: "html" },
    iframe: { label: { en: "iframe", ja: "iframe" }, language: "html" },
    module: { label: { en: "ES module", ja: "ESモジュール" }, language: "js" },
    react: { label: { en: "React 19", ja: "React 19" }, language: "tsx" },
    vue: { label: { en: "Vue", ja: "Vue" }, language: "vue" },
    svelte: { label: { en: "Svelte", ja: "Svelte" }, language: "svelte" },
    angular: { label: { en: "Angular", ja: "Angular" }, language: "ts" },
    html: { label: { en: "Plain HTML", ja: "HTML" }, language: "html" },
    url: { label: { en: "iframe URL", ja: "iframe URL" }, language: "text" },
  };
  const quote = (text) => JSON.stringify(String(text)).replaceAll("<", "\\u003c");
  const plain = (value) => typeof value === "string" ? quote(value) : String(value);
  const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const specFor = (maker) => {
    if (!Object.hasOwn(makers, maker)) throw new Error(`Unknown embed maker: ${maker}`);
    return makers[maker];
  };
  const required = (maker, id) => (specFor(maker).required ?? []).includes(id);
  const standing = (option, value) => {
    if (value === undefined || value === null || value === "") return true;
    if (option.default === undefined) return false;
    if (option.kind === "number") return Number(value) === Number(option.default);
    if (option.kind === "boolean") return Boolean(value) === Boolean(option.default);
    return String(value).toLowerCase() === String(option.default).toLowerCase();
  };
  const converted = (option, raw, maker) => {
    if (option.kind === "number") return Number((Number(raw) * (option.factor?.[maker] ?? 1)).toFixed(6));
    if (option.kind === "boolean") return Boolean(raw);
    if (option.choices?.every((choice) => /^[0-9.]+$/.test(choice))) return Number(raw);
    return raw;
  };
  function entriesFor(list, settings, maker) {
    const spec = specFor(maker);
    const out = [];
    for (const option of list) {
      const name = option.names[spec.names];
      if (name === undefined || standing(option, settings[option.id]) && !required(maker, option.id)) continue;
      const raw = settings[option.id] === undefined || settings[option.id] === "" ? option.default : settings[option.id];
      if (raw !== undefined) out.push({ id: option.id, name, value: converted(option, raw, maker), option });
    }
    return out;
  }
  function attributesFor(list, settings, maker) {
    const spec = specFor(maker);
    const out = [];
    for (const option of list) {
      const name = option.names[spec.element];
      if (name === undefined || standing(option, settings[option.id]) && !required(maker, option.id)) continue;
      const raw = settings[option.id] === undefined || settings[option.id] === "" ? option.default : settings[option.id];
      if (raw !== undefined) out.push([name, option.kind === "boolean" ? raw ? "" : "false" : String(raw)]);
    }
    return out;
  }
  const attr = ([name, value]) => value === "" ? ` ${name}` : ` ${name}="${escape(value)}"`;
  const tagOf = (spec, attributes, indent = "") => {
    const text = `<${spec.tag}${attributes.map(attr).join("")}></${spec.tag}>`;
    if (text.length + indent.length <= 80 || attributes.length < 3) return text;
    return `<${spec.tag}\n${attributes.map((one) => `${indent}  ${attr(one).trim()}`).join("\n")}\n${indent}></${spec.tag}>`;
  };
  const literal = (lines, indent = "") => {
    const one = `{ ${lines.join(", ")} }`;
    return one.length + indent.length <= 78 ? one : `{\n${lines.map((line) => `${indent}  ${line},`).join("\n")}\n${indent}}`;
  };
  function embedAddress(list, settings, maker) {
    const spec = specFor(maker);
    if (!spec.embed) return null;
    const pairs = attributesFor(list, settings, maker).map(([name, value]) => {
      const option = list.find((one) => one.names[spec.element] === name);
      return [name, option?.kind === "boolean" ? value === "" ? "1" : "0" : value];
    });
    const query = pairs.map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value).replaceAll("%20", "+").replaceAll("%27", "'")}`).join("&");
    return `${spec.embed}${query ? `${spec.parameters === "hash" ? "#" : "?"}${query}` : ""}`;
  }
  function frameSide(maker, settings) {
    const spec = specFor(maker);
    return typeof spec.width === "function" ? spec.width(settings) : spec.width ?? 360;
  }
  function codeFor(maker, format, list, settings) {
    const spec = specFor(maker);
    if (!spec.formats.includes(format)) return null;
    const call = entriesFor(list, settings, maker);
    const attrs = spec.element === undefined ? [] : attributesFor(list, settings, maker);
    const context = { maker, format, list, settings, call, attrs, spec, packageName, cdn, site, quote, plain, literal, tagOf, embedAddress, frameSide };
    const custom = config.code?.(context);
    if (custom !== undefined) return custom;
    const tag = tagOf(spec, attrs);
    const define = `import "${packageName}/element/define";`;
    if (format === "element" || format === "html") return `<script type="module" src="${cdn}"></script>\n${tag}`;
    if (format === "image") {
      const src = spec.image?.(settings);
      return src ? `<img src="${escape(src)}" alt="${escape(settings.label ?? titleFor(settings))}" />` : null;
    }
    if (format === "iframe" || format === "url") {
      const address = embedAddress(list, settings, maker);
      if (address === null) return null;
      const src = new globalThis.URL(address, site).href;
      if (format === "url") return src;
      const width = frameSide(maker, settings);
      const height = typeof spec.height === "function" ? spec.height(settings) : spec.height ?? width;
      return `<iframe src="${escape(src)}" title="${escape(titleFor(settings))}" width="${width}" height="${height}" style="border:0;max-width:100%" loading="lazy"></iframe>`;
    }
    if (format === "react") {
      const props = attrs.map(([name, value]) => {
        const option = list.find((one) => one.names[spec.element] === name);
        if (value === "") return name;
        if (value === "false" && option?.kind === "boolean") return `${name}={false}`;
        if (/^-?\d+(\.\d+)?$/.test(value) && option?.kind === "number") return `${name}={${value}}`;
        return /["\\<&>\r\n\t]/.test(value) ? `${name}={${quote(value)}}` : `${name}=${quote(value)}`;
      });
      const line = `<${spec.tag} ${props.join(" ")} />`;
      const body = line.length > 64 ? `(\n    <${spec.tag}\n${props.map((one) => `      ${one}`).join("\n")}\n    />\n  )` : line;
      return `// React 19 sets a custom element's properties, which write its attributes.\n${define}\n\nexport function ${config.component ?? "Example"}() {\n  return ${body};\n}`;
    }
    if (format === "vue") return `<script setup>\n${define}\n// In vite.config: vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith(${quote(spec.prefix ?? `${spec.tag.split("-")[0]}-`)}) } } })\n</script>\n\n<template>\n  ${tagOf(spec, attrs, "  ")}\n</template>`;
    if (format === "svelte") return `<script>\n  ${define}\n</script>\n\n${tagOf(spec, attrs)}`;
    if (format === "angular") return `import { CUSTOM_ELEMENTS_SCHEMA, Component } from "@angular/core";\n${define}\n\n@Component({\n  selector: ${quote(config.selector ?? "app-example")},\n  schemas: [CUSTOM_ELEMENTS_SCHEMA],\n  template: \`${tagOf(spec, attrs, "    ").replaceAll("\\", "\\\\").replaceAll("`", "\\`").replaceAll("${", "\\${")}\`,\n})\nexport class ${config.component ?? "Example"}Component {}`;
    if (format === "module") return `${define}\n\nconst element = globalThis.document.createElement(${quote(spec.tag)});\n${attrs.map(([name, value]) => `element.setAttribute(${quote(name)}, ${quote(value)});`).join("\n")}\ndocument.body.append(element);`;
    return null;
  }
  function toAddress(maker, list, settings) {
    const pairs = [["make", maker]];
    for (const option of list) {
      const value = settings[option.id];
      if (standing(option, value) && !required(maker, option.id) || value === undefined || value === "") continue;
      pairs.push([option.id, typeof value === "boolean" ? value ? "1" : "0" : String(value)]);
    }
    return pairs.map(([name, value]) => `${name}=${encodeURIComponent(value).replaceAll("%20", "+")}`).join("&");
  }
  function fromAddress(text, list) {
    const query = new globalThis.URLSearchParams(text.replace(/^[#?]/, ""));
    const asked = query.get("make");
    const maker = Object.hasOwn(makers, asked) ? asked : config.defaultMaker ?? Object.keys(makers)[0];
    const settings = {};
    for (const option of list) {
      if (!query.has(option.id)) continue;
      const raw = query.get(option.id);
      if (option.kind === "boolean") settings[option.id] = raw === "1" || raw === "true";
      else if (option.kind === "number") {
        const number = Number(raw);
        if (raw !== "" && Number.isFinite(number)) settings[option.id] = option.range ? Math.max(option.range.min, Math.min(option.range.max, number)) : number;
      } else if (option.kind === "choice") {
        if (option.choices.includes(raw)) settings[option.id] = raw;
      } else settings[option.id] = raw;
    }
    return { maker, settings };
  }
  function validateCoverage(declared) {
    const missing = [];
    for (const [kind, names] of Object.entries(declared)) {
      const listed = new Set(options.flatMap((option) => option.names[kind] === undefined ? [] : [option.names[kind].split(".")[0]]));
      for (const name of names) {
        if (listed.has(name)) continue;
        const reason = leftOut[`${kind}.${name}`];
        if (typeof reason !== "string" || reason.trim().length === 0) missing.push(`${kind}.${name}`);
      }
    }
    if (missing.length) throw new Error(`Embed options need rows or reasons: ${missing.join(", ")}`);
    return true;
  }
  /** Restore a copied setup from schema defaults; starter choices apply only on a fresh visit. */
  function restoreState(address, initial = {}, list = options) {
    const asked = fromAddress(address, list);
    const linked = new globalThis.URLSearchParams(String(address ?? "").replace(/^#/, "")).has("make");
    return { maker: asked.maker, settings: { ...(linked ? {} : initial[asked.maker]), ...asked.settings } };
  }

  const api = { makers, formats, options, groups, leftOut, cdn, entriesFor, attributesFor, embedAddress, frameSide, codeFor, toAddress, fromAddress, restoreState, validateCoverage,
    allCode: (maker, list, settings) => Object.fromEntries(specFor(maker).formats.map((format) => [format, codeFor(maker, format, list, settings)])),
    liveFor: (maker, list, settings) => ({ call: entriesFor(list, settings, maker), attrs: specFor(maker).element === undefined ? [] : attributesFor(list, settings, maker) }),
  };
  function mount({ words, language = globalThis.familyLanguage, renderPreview,
    initial = {}, colourDefault = (option) => option.default ?? "#000000", classPrefix = "family-bld" } = {}) {
  if (typeof language !== "function" || typeof renderPreview !== "function") throw new Error("A builder needs a language helper and live preview renderer");
    const $ = (id) => globalThis.document.getElementById(id);

    const WORDS = { en: { ...FAMILY_EMBED_BUILDER_WORDS.en, ...words.en }, ja: { ...FAMILY_EMBED_BUILDER_WORDS.ja, ...words.ja } };
    const START = initial;
    const optionList = api.options;
    const optionGroups = api.groups;
    const makerList = api.makers;
    const formatList = api.formats;
    const { codeFor, toAddress } = api;
    const asked = restoreState(globalThis.location.hash, START, optionList);
    let maker = asked.maker;
    let settings = asked.settings;
    let format = new globalThis.URLSearchParams(globalThis.location.hash.replace(/^#/, "")).get("show") ?? "";
    let preview = null;
    let previewKey = "";
    let typing = 0;

    const page = language({ id: config.id, words: WORDS, onChange: () => draw() });
    const say = (key, values = {}) => Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), WORDS[page.lang]?.[key] ?? page.word(key) ?? key);

    const spec = () => makerList[maker];
    /** Whether a choice is there for the way of making a preview chosen. */
    const applies = (option) => option.names[spec().names] !== undefined || (spec().element !== undefined && option.names[spec().element] !== undefined);
    const valueOf = (option) => settings[option.id] ?? option.default;
    const unit = (option) => config.unit?.(option) ?? option.unit ?? "";

    function drawPreview() {
      const stage = $("bld-stage");
      const state = api.liveFor(maker, optionList, settings);
      const key = JSON.stringify([maker, state.call.map(({ name, value }) => [name, value]), state.attrs]);
      if (key === previewKey) return;
      previewKey = key;
      preview?.destroy?.();
      stage.dataset.maker = maker;
      stage.replaceChildren();
      const note = $("bld-note");
      note.textContent = "";
      preview = renderPreview({ stage, maker, settings, call: state.call, attrs: state.attrs, note, say });
    }

    function drawCode() {
      const formats = spec().formats;
      if (!formats.includes(format)) format = formats[0];
      const tabs = $("bld-formats");
      tabs.replaceChildren(
        ...formats.map((name) => {
          const tab = globalThis.document.createElement("button");
          tab.type = "button";
          tab.setAttribute("role", "tab");
          tab.id = `bld-tab-${name}`;
          tab.dataset.format = name;
          tab.setAttribute("aria-controls", "bld-panel");
          tab.setAttribute("aria-selected", String(name === format));
          tab.tabIndex = name === format ? 0 : -1;
          tab.textContent = formatList[name].label[page.lang];
          tab.addEventListener("click", () => {
            format = name;
            drawCode();
            keepAddress();
            // The tabs were drawn again, so the focus is put back on the one now chosen.
            $(`bld-tab-${format}`).focus();
          });
          tab.addEventListener("keydown", (event) => {
            const at = formats.indexOf(format);
            const to = event.key === "ArrowRight" ? Math.min(formats.length - 1, at + 1) : event.key === "ArrowLeft" ? Math.max(0, at - 1) : event.key === "Home" ? 0 : event.key === "End" ? formats.length - 1 : null;
            if (to === null) return;
            event.preventDefault();
            format = formats[to];
            drawCode();
            keepAddress();
            $(`bld-tab-${format}`).focus();
          });
          return tab;
        }),
      );
      refreshCode();
    }

    function refreshCode() {
      $("bld-panel").setAttribute("aria-labelledby", `bld-tab-${format}`);
      $("bld-code").textContent = codeFor(maker, format, optionList, settings) ?? "";
      $("bld-copy").disabled = $("bld-code").textContent === "";
      $("bld-code").dataset.format = format;
      $("bld-code").dataset.language = formatList[format].language;
    }

    function keepAddress() {
      globalThis.history.replaceState(null, "", `#${toAddress(maker, optionList, settings)}&show=${format}`);
    }

    /** Something was chosen: the preview, the code and the address follow. Text being typed waits a moment for the next key. */
    function changed(slowly = false) {
      const now = () => {
        drawPreview();
        drawCode();
        keepAddress();
      };
      globalThis.clearTimeout(typing);
      if (slowly) typing = globalThis.setTimeout(now, 200);
      else now();
    }

    /* ----- the controls, one for each choice the package offers ----- */

    function setValue(option, value, slowly = false) {
      if (value === undefined || value === "") delete settings[option.id];
      else settings[option.id] = value;
      keepAddress();
      changed(slowly);
    }

    const labelFor = (option, control) => {
      const label = globalThis.document.createElement("label");
      label.textContent = option.say[page.lang].label;
      label.htmlFor = control.id;
      return label;
    };
    const helpFor = (option) => {
      const line = globalThis.document.createElement("p");
      line.className = "fam-fine";
      line.textContent = option.say[page.lang].help;
      if (option.default !== undefined && option.kind !== "moves") {
        const shown = option.kind === "boolean" ? say(option.default ? "on" : "off") : `${option.default}${unit(option)}`;
        line.textContent += ` ${say("defaultIs", { value: shown })}`;
      }
      return line;
    };

    function segmented(option, values, labelOf) {
      const group = globalThis.document.createElement("div");
      group.className = "fam-seg";
      group.id = `opt-${option.id}`;
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", option.say[page.lang].label);
      const shown = () => String(settings[option.id] ?? "");
      const made = [];
      for (const value of values) {
        const button = globalThis.document.createElement("button");
        button.type = "button";
        button.dataset.value = value;
        button.textContent = labelOf(value);
        const pressed = () => (value === "" ? settings[option.id] === undefined && option.default === undefined : shown() === value || (settings[option.id] === undefined && String(option.default) === value));
        button.setAttribute("aria-pressed", String(pressed()));
        button.addEventListener("click", () => {
          setValue(option, value === "" ? undefined : option.kind === "number" ? Number(value) : value);
          for (const other of made) other.setAttribute("aria-pressed", String(other.dataset.value === value));
        });
        made.push(button);
        group.append(button);
      }
      return group;
    }

    function control(option) {
      const box = globalThis.document.createElement("div");
      box.className = `${classPrefix}-option`;
      box.dataset.testid = `opt-${option.id}`;
      box.dataset.option = option.id;
      const name = option.say[page.lang].label;
      let main;
      if (option.kind === "boolean") {
        main = globalThis.document.createElement("button");
        main.type = "button";
        main.className = "fam-button";
        main.id = `opt-${option.id}`;
        const draw = () => {
          main.setAttribute("aria-pressed", String(Boolean(valueOf(option))));
          main.textContent = `${name}${page.lang === "ja" ? "：" : ": "}${say(valueOf(option) ? "on" : "off")}`;
        };
        draw();
        main.addEventListener("click", () => {
          setValue(option, !valueOf(option));
          draw();
        });
        box.append(main, helpFor(option));
        return box;
      }
      if (option.kind === "choice" && option.control === "select") {
        main = globalThis.document.createElement("select");
        main.className = "fam-field";
        main.id = `opt-${option.id}`;
        for (const value of option.choices) {
          const item = globalThis.document.createElement("option");
          item.value = value;
          item.textContent = displayChoice(option, page.lang, value);
          main.append(item);
        }
        main.value = String(valueOf(option) ?? "");
        main.addEventListener("change", () => setValue(option, main.value));
        box.append(labelFor(option, main), main, helpFor(option));
        return box;
      }
      if (option.kind === "choice") {
        const values = [...(option.default === undefined ? [""] : []), ...option.choices];
        main = segmented(option, values, (value) => (value === "" ? say("notSet") : displayChoice(option, page.lang, value)));
        const heading = globalThis.document.createElement("span");
        heading.className = "fam-label";
        heading.id = `opt-${option.id}-label`;
        heading.textContent = name;
        main.setAttribute("aria-labelledby", heading.id);
        main.removeAttribute("aria-label");
        box.append(heading, main, helpFor(option));
        return box;
      }
      if (option.kind === "number") {
        const { min, max, step } = option.range;
        if ((max - min) / step <= 6) {
          main = segmented(option, Array.from({ length: Math.round((max - min) / step) + 1 }, (_, at) => String(min + at * step)), (value) => value);
          const heading = globalThis.document.createElement("span");
          heading.className = "fam-label";
          heading.id = `opt-${option.id}-label`;
          heading.textContent = name;
          main.setAttribute("aria-labelledby", heading.id);
          main.removeAttribute("aria-label");
          box.append(heading, main, helpFor(option));
          return box;
        }
        const row = globalThis.document.createElement("div");
        row.className = `${classPrefix}-number`;
        const number = globalThis.document.createElement("input");
        number.type = "number";
        number.className = "fam-field";
        number.id = `opt-${option.id}`;
        Object.assign(number, { min, max, step });
        number.value = settings[option.id] === undefined ? "" : String(settings[option.id]);
        number.placeholder = option.default === undefined ? say("notSet") : String(option.default);
        const range = globalThis.document.createElement("input");
        range.type = "range";
        Object.assign(range, { min, max, step });
        range.value = String(valueOf(option) ?? min);
        range.setAttribute("aria-label", name);
        range.addEventListener("input", () => {
          number.value = range.value;
          setValue(option, Number(range.value));
        });
        number.addEventListener("input", () => {
          const parsed = Number(number.value);
          if (number.value === "") setValue(option, undefined, true);
          else if (Number.isFinite(parsed)) {
            range.value = number.value;
            setValue(option, Math.max(min, Math.min(max, parsed)), true);
          }
        });
        row.append(number, range);
        box.append(labelFor(option, number), row, helpFor(option));
        return box;
      }
      if (option.kind === "colour") {
        const row = globalThis.document.createElement("div");
        row.className = `${classPrefix}-colour`;
        const input = globalThis.document.createElement("input");
        input.type = "color";
        input.id = `opt-${option.id}`;
        const fallback = () => colourDefault(option);
        input.value = settings[option.id] ?? fallback();
        const clear = globalThis.document.createElement("button");
        clear.type = "button";
        clear.className = "fam-button";
        clear.textContent = say("reset");
        clear.hidden = settings[option.id] === undefined;
        input.addEventListener("input", () => {
          setValue(option, input.value);
          clear.hidden = false;
        });
        clear.addEventListener("click", () => {
          setValue(option, undefined);
          input.value = fallback();
          clear.hidden = true;
        });
        row.append(input, clear);
        box.append(labelFor(option, input), row, helpFor(option));
        return box;
      }
      const field = globalThis.document.createElement(option.kind === "moves" ? "textarea" : "input");
      field.className = "fam-field";
      field.id = `opt-${option.id}`;
      if (option.kind === "moves") {
        field.rows = 2;
        field.dataset.mono = "true";
        field.spellcheck = false;
        field.autocapitalize = "off";
      }
      field.value = settings[option.id] ?? (option.kind === "moves" ? option.default : "");
      field.addEventListener("input", () => setValue(option, field.value, true));
      box.append(labelFor(option, field), field, helpFor(option));
      return box;
    }

    function drawControls() {
      const groups = $("bld-groups");
      const order = Object.keys(optionGroups);
      const made = [];
      for (const group of order) {
        const options = optionList.filter((option) => option.group === group && applies(option));
        if (options.length === 0) continue;
        const details = globalThis.document.createElement("details");
        details.className = `fam-panel ${classPrefix}-group`;
        details.open = true;
        details.dataset.group = group;
        const summary = globalThis.document.createElement("summary");
        summary.textContent = optionGroups[group][page.lang];
        const body = globalThis.document.createElement("div");
        body.className = `${classPrefix}-options`;
        const faces = options.filter((option) => option.kind === "colour");
        for (const option of options.filter((one) => one.kind !== "colour")) body.append(control(option));
        if (faces.length > 0) {
          const grid = globalThis.document.createElement("div");
          grid.className = `${classPrefix}-colours`;
          for (const option of faces) grid.append(control(option));
          body.append(grid);
        }
        details.append(summary, body);
        made.push(details);
      }
      groups.replaceChildren(...made);
    }

    function draw() {
      for (const button of $("bld-makers").children) button.setAttribute("aria-pressed", String(button.dataset.maker === maker));
      $("bld-maker-says").textContent = say(spec().description);
      drawControls();
      previewKey = "";
      changed();
    }

    for (const button of $("bld-makers").children) {
      button.addEventListener("click", () => {
        maker = button.dataset.maker;
        settings = { ...START[maker], ...settings };
        draw();
      });
    }
    $("bld-reset").addEventListener("click", () => {
      settings = { ...START[maker] };
      draw();
    });

    const copy = async (text, into, word) => {
      try {
        await globalThis.navigator.clipboard.writeText(text);
        into.textContent = say(word);
      } catch {
        into.textContent = "";
      }
    };
    $("bld-copy").addEventListener("click", () => { changed(); if ($("bld-code").textContent !== "") void copy($("bld-code").textContent, $("bld-code-copied"), "copied"); });
    $("bld-link").addEventListener("click", () => { keepAddress(); void copy(globalThis.location.href, $("bld-copied"), "linkCopied"); });

    draw();
    globalThis.document.documentElement.dataset.ready = "true";

    return { get maker() { return maker; }, get settings() { return { ...settings }; },
      draw, refreshCode, destroy() { globalThis.clearTimeout(typing); preview?.destroy?.(); },
    };

  }
  api.mount = mount;
  return api;
}
