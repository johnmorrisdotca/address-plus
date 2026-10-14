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
export const FAMILY_TEMPLATE_VERSION = "2026-10-15b";

/** The packages, in the order the footer lists them. `kana` is the name as it is written in Japanese. */
export const FAMILY = [
  { id: "korokoro", name: "Korokoro", kana: "コロコロ" },
  { id: "kyuubu", name: "Kyuubu", kana: "キューブ" },
  { id: "hitotsu", name: "Hitotsu", kana: "一つ" },
  { id: "toranpu", name: "Toranpu", kana: "トランプ" },
  { id: "tane", name: "Tane", kana: "種" },
  { id: "narabe", name: "Narabe", kana: "並べ" },
  { id: "tenka", name: "Tenka", kana: "天下" },
  { id: "kumimoji", name: "Kumimoji", kana: "組み文字" },
  { id: "tsunagi", name: "Tsunagi", kana: "繋ぎ" },
  { id: "jarajara", name: "Jarajara", kana: "ジャラジャラ" },
  { id: "suido", name: "Suido", kana: "水道" },
  { id: "domino", name: "Domino", kana: "ドミノ" },
  { id: "kotoba", name: "Kotoba", kana: "言葉" },
  { id: "sugoroku", name: "Sugoroku", kana: "双六" },
  { id: "kazu", name: "Kazu", kana: "数" },
  { id: "meikyuu", name: "Meikyuu", kana: "迷宮" },
  { id: "hikidashi", name: "Hikidashi", kana: "引き出し" },
  { id: "chizu", name: "Chizu", kana: "地図" },
  { id: "bushu", name: "Bushu", kana: "部首" },
  { id: "tobiishi", name: "Tobiishi", kana: "飛び石" },
  { id: "jirai", name: "Jirai", kana: "地雷" },
  { id: "gunjin", name: "Gunjin", kana: "軍人" },
  { id: "karakuri", name: "Karakuri", kana: "からくり" },
  { id: "houseki", name: "Houseki", kana: "宝石" },
  { id: "kyogijo-stadiums", name: "Kyogijo Stadiums", kana: "競技場" },
  { id: "taisen-brackets", name: "Taisen Brackets", kana: "対戦" },
];

/**
 * The packages of FAMILY that are not on npm yet. Such a package's header has no npm pill, its footer says so in
 * place of the install line, and the README's line on it ends "Not on npm yet." Take the id out the day it is published.
 */
export const FAMILY_NOT_ON_NPM = [];

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
  "kyogijo-stadiums": "sports fields, rinks, courts and ballparks drawn to scale as SVG, with each team and the score on them",
  "taisen-brackets": "a sport-agnostic tournament bracket, drawn as SVG, from a list of ties",
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
  en: { family: "The family:", licence: "MIT", help: "Help", helpTip: "Show a short note under each option, saying what it does", cloth: "Table cloth", cloth_green: "Green", cloth_blue: "Blue", cloth_red: "Red", cloth_black: "Black", cloth_wood: "Wood" },
  ja: { family: "姉妹パッケージ:", licence: "MIT", help: "説明", helpTip: "各項目の下に、その使い方を短く表示します", cloth: "テーブルの色", cloth_green: "緑", cloth_blue: "青", cloth_red: "赤", cloth_black: "黒", cloth_wood: "木目" },
};

const escape = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const member = (id) => {
  const found = FAMILY.find((one) => one.id === id);
  if (found === undefined) throw new Error(`${id} is not in the family`);
  return found;
};
const repo = (id) => `https://github.com/${OWNER}/${id}`;
const site = (id) => `https://${OWNER}.github.io/${id}/`;
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
  const onNpm = !FAMILY_NOT_ON_NPM.includes(id);
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
${onNpm ? `          <a href="${npm(id)}">npm</a>\n` : ""}        </nav>
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
  const onNpm = !FAMILY_NOT_ON_NPM.includes(id);
  const links = FAMILY.map((one) => `<a href="${site(one.id)}"${one.id === id ? ` aria-current="page"` : ""}>${one.name}</a>`).join("");
  return `<footer>
        <span data-say="foot"></span>
        <span>${onNpm ? `<code>npm install @${OWNER}/${id}</code>` : "Not on npm yet"} · <a href="${repo(id)}/blob/main/LICENSE" data-say="licence"></a> © John Morris</span>
        <span class="family"><span data-say="family"></span>${links}<a href="https://itsutsu.com">itsutsu.com</a></span>
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
  var asked = new URLSearchParams(location.search).get("help");
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
  var asked = new URLSearchParams(location.search).get("cloth");
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
      var query = new URLSearchParams(location.search);
      if (name === "green") query.delete("cloth"); else query.set("cloth", name);
      var search = query.toString();
      history.replaceState(history.state, "", location.pathname + (search ? "?" + search : "") + location.hash);
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
  var asked = new URLSearchParams(location.search).get("lang");
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
