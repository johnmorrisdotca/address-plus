// The six panels: each answers its first example, then is typed in and pressed, and read in Japanese.
import { expect, test } from "@playwright/test";

import { apiOf } from "../scripts/api.mjs";

import { at, open, tap, type } from "./demo.mjs";

const answer = (page, name) => page.locator(at(`${name}-answer`));
const call = (page, name) => page.locator(at(`${name}-call`));
const chip = (page, name, label) =>
  page.locator(at(`${name}-examples`)).getByRole("button", { name: label, exact: true });

test("every panel answers its first example as the page opens, with the call that made it", async ({ page }) => {
  const errors = await open(page);
  await expect(answer(page, "parse")).toContainText("Pennsylvania");
  await expect(answer(page, "parse")).toContainText("DC");
  await expect(call(page, "parse")).toContainText(
    'parseLocation("1600 Pennsylvania Ave NW, Washington, DC 20500", { countries: [australia, france, germany, unitedKingdom] })',
  );
  await expect(answer(page, "validate")).toContainText("POSTAL_REGION_MISMATCH");
  await expect(call(page, "validate")).toContainText("validateAddress(");
  await expect(answer(page, "format")).toContainText("東京都千代田区丸の内1丁目2番3号");
  await expect(answer(page, "format")).toContainText("Chiyoda-ku, Tokyo 100-0005, Japan");
  await expect(call(page, "format")).toContainText("formatJapanese(address");
  await expect(answer(page, "compare")).toContainText("exact");
  await expect(call(page, "compare")).toContainText("compareAddresses(parseLocation(");
  await expect(answer(page, "postal")).toContainText("WA · Washington");
  await expect(call(page, "postal")).toContainText('getStateFromZip("98101")  // "WA"');
  await expect(answer(page, "clean")).toContainText("350 Fifth Ave, New York NY 10118");
  await expect(call(page, "clean")).toContainText("cleanAddressDetailed(");
  expect(errors).toEqual([]);
});

test("parse: Japanese in Japanese script, in romaji and in full-width digits, an intersection and a PO box", async ({
  page,
}, testInfo) => {
  const errors = await open(page);
  await tap(page, chip(page, "parse", "Japanese"), testInfo);
  await expect(answer(page, "parse")).toContainText("東京都");
  await expect(answer(page, "parse")).toContainText("千代田区");
  await expect(answer(page, "parse")).toContainText("サンプルビル");
  await expect(answer(page, "parse")).toContainText("501");
  await expect(answer(page, "parse")).toContainText("JP · Japan");
  await tap(page, chip(page, "parse", "Romaji"), testInfo);
  await expect(answer(page, "parse")).toContainText("Marunouchi");
  await expect(answer(page, "parse")).toContainText("13101");
  await tap(page, chip(page, "parse", "Full-width"), testInfo);
  await expect(answer(page, "parse")).toContainText("530-0001");
  await expect(answer(page, "parse")).toContainText("大阪府");
  await expect(answer(page, "parse")).toContainText("3-1-1");
  await tap(page, chip(page, "parse", "Intersection"), testInfo);
  await expect(answer(page, "parse")).toContainText("Hollywood");
  await expect(answer(page, "parse")).toContainText("Vine");
  await tap(page, chip(page, "parse", "PO box"), testInfo);
  await expect(answer(page, "parse")).toContainText("PO Box");
  await expect(answer(page, "parse")).toContainText("1234");
  await type(page, "parse-input", "");
  await expect(answer(page, "parse")).toContainText("Nothing here could be read");
  // The whole result is in the fold.
  await type(page, "parse-input", "100 Queen St W, Toronto, ON M5H 2N2");
  await page.locator(`${at("parse-fold")} summary`).click();
  await expect(page.locator(at("parse-json"))).toContainText('"zip": "M5H 2N2"');
  expect(errors).toEqual([]);
});

test("validate: a ZIP and a Japanese postal code from another region are caught, and strict makes them errors", async ({
  page,
}, testInfo) => {
  const errors = await open(page);
  await expect(answer(page, "validate")).toContainText("ZIP code 98101 belongs to WA, not NY");
  await tap(page, chip(page, "validate", "Another prefecture"), testInfo);
  await expect(answer(page, "validate")).toContainText("POSTAL_REGION_MISMATCH");
  await expect(answer(page, "validate")).toContainText("大阪府");
  await expect(answer(page, "validate").locator(".fam-badge")).toHaveText("Yes");
  await tap(page, page.locator(at("validate-strict")), testInfo);
  await expect(page.locator(at("validate-strict"))).toHaveAttribute("aria-pressed", "true");
  await expect(answer(page, "validate").locator(".fam-badge")).toHaveText("No");
  await expect(call(page, "validate")).toContainText("strictPostalValidation: true");
  await tap(page, chip(page, "validate", "Another province"), testInfo);
  await expect(answer(page, "validate")).toContainText("belongs to ON, not BC");
  await tap(page, chip(page, "validate", "Japan, correct"), testInfo);
  await expect(answer(page, "validate").locator(".fam-badge")).toHaveText("Yes");
  expect(errors).toEqual([]);
});

test("format: the parsed country picks USPS, Canada Post or the Japanese forms, and the block style is chosen", async ({
  page,
}, testInfo) => {
  const errors = await open(page);
  await tap(page, page.locator(at("format-style")).getByRole("button", { name: "1-2-3" }), testInfo);
  await expect(answer(page, "format")).toContainText("東京都千代田区丸の内1-2-3");
  await expect(call(page, "format")).not.toContainText("markers");
  await tap(page, chip(page, "format", "US with a unit"), testInfo);
  await expect(answer(page, "format")).toContainText("USPS");
  await expect(answer(page, "format")).toContainText("123 MAIN ST APT 4");
  await expect(call(page, "format")).toContainText("formatUSPS(");
  await tap(page, chip(page, "format", "Canada"), testInfo);
  await expect(answer(page, "format")).toContainText("Canada Post");
  await expect(answer(page, "format")).toContainText("100 QUEEN ST W");
  await expect(call(page, "format")).toContainText("formatCanadaPost(");
  await tap(page, chip(page, "format", "Japan in romaji"), testInfo);
  await expect(answer(page, "format")).toContainText("3-1-1 Umeda, Kita-ku, Osaka-shi, Osaka 530-0001, Japan");
  await expect(answer(page, "format")).toContainText("大阪府大阪市北区 Umeda 3-1-1");
  expect(errors).toEqual([]);
});

test("compare: abbreviations are the same address, a typo is pointed out, two places are not the same", async ({
  page,
}, testInfo) => {
  const errors = await open(page);
  await expect(answer(page, "compare").locator(".fam-badge")).toHaveText("Yes");
  await tap(page, chip(page, "compare", "A typo"), testInfo);
  await expect(answer(page, "compare")).toContainText("possible typo");
  await expect(answer(page, "compare")).toContainText('"125"');
  await tap(page, chip(page, "compare", "Full-width"), testInfo);
  await expect(page.locator(at("compare-second"))).toHaveValue("東京都千代田区丸の内１－２－３");
  await expect(answer(page, "compare").locator(".fam-badge")).toHaveText("Yes");
  await tap(page, chip(page, "compare", "Different"), testInfo);
  await expect(answer(page, "compare").locator(".fam-badge")).toHaveText("No");
  await expect(answer(page, "compare")).toContainText("none");
  await type(page, "compare-second", "");
  await expect(answer(page, "compare")).toContainText("could not be read");
  expect(errors).toEqual([]);
});

test("postal: a code finds its region in each country, and a region lists its codes", async ({ page }, testInfo) => {
  const errors = await open(page);
  await tap(page, chip(page, "postal", "M5H 2N2"), testInfo);
  await expect(answer(page, "postal")).toContainText("ON · Ontario");
  await tap(page, chip(page, "postal", "100-0005"), testInfo);
  await expect(answer(page, "postal")).toContainText("13 · 東京都 (Tokyo-to)");
  await tap(page, chip(page, "postal", "５３０－０００１"), testInfo);
  await expect(answer(page, "postal")).toContainText("27 · 大阪府 (Osaka-fu)");
  await expect(call(page, "postal")).toContainText('getPrefectureFromJapanesePostalCode("530-0001")');
  await tap(page, chip(page, "postal", "WA"), testInfo);
  await expect(answer(page, "postal")).toContainText("980, 981");
  await expect(call(page, "postal")).toContainText('getZipPrefixesForState("WA")');
  await tap(page, chip(page, "postal", "Quebec"), testInfo);
  await expect(answer(page, "postal")).toContainText("QC · Quebec");
  await expect(call(page, "postal")).toContainText("getPostalPrefixesForProvince");
  await tap(page, chip(page, "postal", "大阪府"), testInfo);
  await expect(answer(page, "postal")).toContainText("530");
  await expect(call(page, "postal")).toContainText('getPostalPrefixesForPrefecture("27")');
  await type(page, "postal-input", "nowhere at all 0");
  await expect(answer(page, "postal")).toContainText("Not a postal code or a region");
  expect(errors).toEqual([]);
});

test("clean: the address is tidied in the case chosen, and the changes are listed", async ({ page }, testInfo) => {
  const errors = await open(page);
  await tap(page, page.locator(at("clean-case")).getByRole("button", { name: "CAPITALS" }), testInfo);
  await expect(answer(page, "clean")).toContainText("350 FIFTH AVE, NEW YORK NY 10118");
  await expect(call(page, "clean")).toContainText('standardizeCase: "upper"');
  await tap(page, chip(page, "clean", "Stray spaces"), testInfo);
  await expect(answer(page, "clean")).toContainText("742 EVERGREEN TER, SPRINGFIELD IL 62704");
  await expect(answer(page, "clean")).toContainText("Applied upper case standardization");
  expect(errors).toEqual([]);
});

test("an example fills the box, is shown pressed, and the answer follows", async ({ page }, testInfo) => {
  await open(page);
  await tap(page, chip(page, "parse", "Toronto"), testInfo);
  await expect(page.locator(at("parse-input"))).toHaveValue("100 Queen St W, Toronto, ON M5H 2N2");
  await expect(chip(page, "parse", "Toronto")).toHaveAttribute("aria-pressed", "true");
  await expect(chip(page, "parse", "Washington, DC")).toHaveAttribute("aria-pressed", "false");
  await expect(answer(page, "parse")).toContainText("CA · Canada");
  await type(page, "parse-input", "100 Queen St W, Toronto, ON");
  await expect(chip(page, "parse", "Toronto")).toHaveAttribute("aria-pressed", "false");
});

test("in Japanese the labels, the examples and the answers are Japanese, and switching back restores English", async ({
  page,
}) => {
  const errors = await open(page);
  const parseTitle = page.locator("#parse-title");
  await expect(parseTitle).toContainText("Parse");
  await page.locator('[data-lang="ja"]').click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(parseTitle).toContainText("住所の解析");
  await expect(page.locator("#validate-title")).toContainText("住所の検証");
  await expect(answer(page, "parse")).toContainText("通り名");
  await expect(answer(page, "validate")).toContainText("郵便番号が、別の州や都道府県のものです。");
  await expect(answer(page, "compare")).toContainText("完全一致");
  await expect(chip(page, "parse", "ローマ字")).toBeVisible();
  await expect(page.locator("#unreviewed")).toBeVisible();
  await page.locator('[data-lang="en"]').click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(parseTitle).toContainText("Parse");
  await expect(answer(page, "parse")).toContainText("Street");
  await expect(answer(page, "compare")).toContainText("exact");
  await expect(chip(page, "parse", "Romaji")).toBeVisible();
  await expect(page.locator("#unreviewed")).toBeHidden();
  expect(errors).toEqual([]);
});

test("a Japanese example parses in Japanese, and the choice of language is kept", async ({ page }, testInfo) => {
  const errors = await open(page);
  await page.locator('[data-lang="ja"]').click();
  await tap(page, chip(page, "parse", "日本語"), testInfo);
  await expect(answer(page, "parse")).toContainText("都道府県");
  await expect(answer(page, "parse")).toContainText("東京都");
  await expect(answer(page, "parse")).toContainText("町域");
  await expect(answer(page, "parse")).toContainText("丸の内");
  await expect(answer(page, "parse")).toContainText("JP · 日本");
  await page.reload();
  await page.waitForSelector('main[data-ready="true"]');
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  expect(errors).toEqual([]);
});

test("a hostile paste is shown as text and never as markup", async ({ page }) => {
  const errors = await open(page);
  await type(
    page,
    "parse-input",
    "<img src=x onerror=alert(1)>123 Main St, Anytown, NY 12345<script>alert(1)</script>",
  );
  await type(page, "clean-input", "<b>350 FIFTH AVENUE</b>, NEW YORK, NY 10118");
  await type(page, "compare-first", "<i>123 Main St</i>, Anytown, NY 12345");
  expect(await page.locator("main img, main script, main b, main i").count()).toBe(0);
  expect(errors).toEqual([]);
});

test("the API index keeps function anchors and leads to checked examples in both languages", async ({ page }) => {
  const errors = await open(page, "", "api.html");
  await expect(page.locator("#main-parseLocation h3 a")).toHaveText("parseLocation");
  const bare = apiOf().flatMap((entry) =>
    entry.exports
      .filter((item) => item.kind === "function" && !item.example)
      .map((item) => `${entry.entry}:${item.name}`),
  );
  expect(bare).toEqual([]);
  await page.locator("#jp-parseJapaneseAddress h3 a").click();
  await expect(page.locator("main pre[data-lang=ts]")).toContainText("東京都");
  await expect(page.locator("main .docs-output")).toContainText("1-2-3");
  await page.goto("http://address-plus.test/api.html");
  await page.locator("#main-parseLocation h3 a").click();
  await expect(page.locator("main")).toContainText("parseLocation(address: string");
  await expect(page.locator("main pre").first()).toContainText("@johnmorrisdotca/address-plus");
  await expect(page.locator("main .docs-output")).toContainText("number");
  await page.locator('header .lang a[data-lang="ja"]').click();
  await expect(page.getByRole("link", { name: "デモ", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "デモ", exact: true }).click();
  await expect(page.locator('[data-testid="parse-panel"]')).toBeVisible();
  expect(errors).toEqual([]);
});
