// The demo's larger tools: a pasted list saved as CSV, JSON and text; a Japanese address part by part; the test corpus
// run in the browser; links that carry what is typed; copying a call or a link; and cleaning shown step by step.
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, open, tap, type } from "./demo.mjs";

const chip = (page, name, label) =>
  page.locator(at(`${name}-examples`)).getByRole("button", { name: label, exact: true });

/** Press a download button and read the file it saves. */
async function saved(page, testId, testInfo) {
  const waiting = page.waitForEvent("download");
  await tap(page, at(testId), testInfo);
  const download = await waiting;

  return { name: download.suggestedFilename(), text: readFileSync(await download.path(), "utf8") };
}

test("paste a list: the sample is read into a table, counted by country, and saved as CSV, JSON and TXT", async ({
  page,
}, testInfo) => {
  const errors = await open(page);
  const summary = page.locator(at("bulk-summary"));
  await expect(summary).toContainText("18 of 19 read");
  await expect(summary).toContainText("US 4");
  await expect(summary).toContainText("Canada 3");
  await expect(summary).toContainText("Japan 3");
  await expect(summary).toContainText("Australia 2");
  await expect(summary).toContainText("France 2");
  await expect(summary).toContainText("Germany 2");
  await expect(summary).toContainText("UK 2");
  await expect(summary).toContainText("Not read 1");
  const rows = page.locator(`${at("bulk-table")} tbody tr`);
  await expect(rows).toHaveCount(19);
  await expect(rows.nth(1)).toContainText("350 FIFTH AVE");
  await expect(rows.nth(2)).toContainText("POSTAL_REGION_MISMATCH");
  await expect(rows.nth(7)).toContainText("東京都");
  await expect(rows.nth(10)).toContainText("UNIT 3 12 SMITH ST, PARRAMATTA NSW 2150");
  await expect(rows.nth(11)).toContainText("POSTAL_REGION_MISMATCH");
  await expect(rows.nth(12)).toContainText("RESIDENCE LES LILAS");
  await expect(rows.nth(13)).toContainText("75009 PARIS CEDEX 09");
  await expect(rows.nth(14)).toContainText("c/o Weber");
  await expect(rows.nth(15)).toContainText("Am Markt 5");
  await expect(rows.nth(16)).toContainText("Rose Court");
  await expect(rows.nth(17)).toContainText("SW1A 2AA");
  await expect(rows.nth(18)).toContainText("Not an address");

  const csv = await saved(page, "bulk-csv", testInfo);
  expect(csv.name).toBe("addresses.csv");
  // A byte-order mark first, so a spreadsheet reads the Japanese right; trim would take it off, so it is checked first.
  expect(csv.text.startsWith("\ufeff")).toBe(true);
  const csvLines = csv.text.trim().split("\r\n");
  expect(csvLines[0]).toBe(
    "input,country,number,street,unit,city,region,postal,check,formatted,prefecture,municipality,streetDirections,town,chome,ban,go,building,floor,room,floorType,lot,subBuilding,dependentThoroughfare,locality,county,nation,bfpo,careOf,numberExtension,staircase,entrance,lieuDit,postalBoxType,postalBoxNum,cedex,arrondissement",
  );
  expect(csvLines).toHaveLength(20);
  expect(csvLines[1]).toContain(
    '"1600 Pennsylvania Ave NW, Washington, DC 20500",US,1600,Pennsylvania Ave NW,,Washington,DC,20500,OK,',
  );
  expect(csv.text).toContain("千代田区");

  const json = await saved(page, "bulk-json", testInfo);
  expect(json.name).toBe("addresses.json");
  const records = JSON.parse(json.text);
  expect(records).toHaveLength(19);
  expect(records[0].parsed.state).toBe("DC");
  expect(records[2].findings[0].code).toBe("POSTAL_REGION_MISMATCH");
  expect(records[10].parsed.country).toBe("AU");
  expect(records[12].parsed.country).toBe("FR");
  expect(records[13].parsed.cedex).toBe("CEDEX 09");
  expect(records[14].parsed.country).toBe("DE");
  expect(records[14].parsed.careOf).toBe("Weber");
  expect(records[17].parsed.nation).toBe("ENG");
  expect(records[18].parsed).toBeNull();

  const markdown = await saved(page, "bulk-md", testInfo);
  expect(markdown.name).toBe("addresses.md");
  expect(markdown.text.split("\n").filter((line) => line.startsWith("| "))).toHaveLength(21);
  expect(markdown.text).toContain("千代田区");
  const sql = await saved(page, "bulk-sql", testInfo);
  expect(sql.name).toBe("addresses.sql");
  const database = new DatabaseSync(":memory:");
  try {
    database.exec(sql.text);
    expect(database.prepare('SELECT count(*) AS count FROM "addresses"').get().count).toBe(19);
    expect(
      database.prepare("SELECT municipality FROM \"addresses\" WHERE country = 'JP' LIMIT 1").get().municipality,
    ).toContain("千代田区");
    expect(database.prepare('SELECT "input" FROM "addresses" WHERE country IS NULL').get().input).toBe("see attached");
  } finally {
    database.close();
  }

  const txt = await saved(page, "bulk-txt", testInfo);
  expect(txt.name).toBe("addresses.txt");
  const txtLines = txt.text.trim().split("\n");
  expect(txtLines).toHaveLength(19);
  // Canada Post puts two spaces between the province and the postal code.
  expect(txtLines[4]).toBe("100 QUEEN ST W, TORONTO ON  M5H 2N2");
  expect(txtLines[17]).toBe("10 downing Street, LONDON, SW1A 2AA");
  expect(txtLines[18]).toBe("see attached");

  // A new list replaces the table; an empty one says what to do and saves nothing.
  await type(page, "bulk-input", "PO Box 1234, Springfield, IL 62701\n大阪府大阪市北区梅田3-1-1");
  await expect(rows).toHaveCount(2);
  await expect(summary).toContainText("2 of 2 read");
  await tap(page, at("bulk-clear"), testInfo);
  await expect(summary).toContainText("Paste addresses in the box");
  await expect(page.locator(at("bulk-csv"))).toBeDisabled();
  await tap(page, at("bulk-sample"), testInfo);
  await expect(rows).toHaveCount(19);
  await noSidewaysScroll(page);
  expect(errors).toEqual([]);
});

test("Japan part by part: each part beside its reading, romaji and code, written both ways and checked", async ({
  page,
}, testInfo) => {
  const errors = await open(page);
  const answer = page.locator(at("japan-answer"));
  await expect(answer).toContainText("寺町通御池上る");
  await expect(answer).toContainText("上本能寺前町");
  await expect(answer).toContainText("キョウトシナカギョウク");
  await expect(answer).toContainText("Kyoto-shi Nakagyo-ku");
  await expect(answer).toContainText("26104");
  await expect(answer).toContainText("Delivers to 京都府");
  await expect(answer.locator(".fam-badge")).toHaveText("Yes");
  await tap(page, chip(page, "japan", "Romaji"), testInfo);
  await expect(answer).toContainText("千代田区");
  await expect(answer).toContainText("チヨダク");
  await expect(answer).toContainText("東京都千代田区 Marunouchi 1丁目2番3号");
  await tap(page, chip(page, "japan", "Sakai's 丁"), testInfo);
  await expect(answer).toContainText("3丁目1番9号");
  await tap(page, chip(page, "japan", "A merged city"), testInfo);
  await expect(answer).toContainText("Not in the tables");
  await expect(answer).toContainText("UNRECOGNIZED_MUNICIPALITY");
  await expect(answer.locator(".fam-badge")).toHaveText("No");
  await type(page, "japan-input", "100 Main St, Boston, MA 02110");
  await expect(answer).toContainText("Nothing here names a place in Japan");
  await noSidewaysScroll(page);
  expect(errors).toEqual([]);
});

test("the corpus loads only when asked, runs here, and every case it gets wrong is a known gap", async ({
  page,
}, testInfo) => {
  const errors = await open(page);
  const list = page.locator(`${at("corpus-list")} > li`);
  await expect(list).toHaveCount(0);
  await tap(page, at("corpus-load"), testInfo);
  for (const country of ["us", "canada", "japan"]) {
    await expect(page.locator(at(`corpus-bar-${country}`))).toContainText(/\d+ of \d+ pass/);
  }
  await expect(page.locator(at("corpus-summary"))).toContainText(/\d+ of \d+ pass; \d+ known gaps/);
  await expect(list).toHaveCount(60);
  // Nothing fails that the corpus does not already list as a gap: a regression would show here as "Fails".
  await tap(page, at("corpus-wrong"), testInfo);
  const states = await list.evaluateAll((items) => items.map((item) => item.dataset.state));
  expect(states.length).toBeGreaterThan(0);
  expect(states.every((state) => state === "todo")).toBe(true);
  await tap(page, page.locator(at("corpus-country")).getByRole("button", { name: "US", exact: true }), testInfo);
  await expect(list).toHaveCount(1);
  await expect(list.first()).toContainText("Bowling Green");
  await expect(list.first()).toContainText('type: "Grn"');
  await tap(page, at("corpus-wrong"), testInfo);
  await type(page, "corpus-search", "Pennsylvania Ave NW");
  await expect(list.first()).toContainText("Pennsylvania");
  await expect(list.first()).toHaveAttribute("data-state", "pass");
  await expect(page.locator(at("corpus-count"))).toContainText("matching cases");
  await noSidewaysScroll(page);
  expect(errors).toEqual([]);
});

test("a link carries what is typed and the options, and opens the page with them", async ({ page }) => {
  const errors = await open(
    page,
    `?parse=${encodeURIComponent("PO Box 1234, Springfield, IL 62701")}&strict=1&block=hyphen&japan=${encodeURIComponent("〒060-0001 北海道札幌市中央区北1条西2丁目")}`,
  );
  await expect(page.locator(at("parse-input"))).toHaveValue("PO Box 1234, Springfield, IL 62701");
  await expect(page.locator(at("parse-answer"))).toContainText("PO Box");
  await expect(page.locator(at("validate-strict"))).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(`${at("format-style")} [data-style="hyphen"]`)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(at("japan-answer"))).toContainText("北1条西");
  // Typing keeps the address bar in step; a box put back to its first value leaves the address.
  await type(page, "clean-input", "1 main st, anytown, ny 12345");
  await expect.poll(() => new URL(page.url()).searchParams.get("clean")).toBe("1 main st, anytown, ny 12345");
  await type(page, "clean-input", "350 FIFTH AVENUE, NEW YORK, NY 10118");
  await expect.poll(() => new URL(page.url()).searchParams.has("clean")).toBe(false);
  expect(errors).toEqual([]);
});

test("copy code copies the call, and copy link a link to that panel with its input", async ({ page }, testInfo) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  const errors = await open(page, "", "", { secure: true });
  await type(page, "postal-input", "M5H 2N2");
  await tap(page, at("postal-copy-code"), testInfo);
  await expect(page.locator(at("postal-copied"))).toHaveText("The code is copied.");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    await page.locator(at("postal-call")).textContent(),
  );
  await tap(page, at("postal-copy-link"), testInfo);
  await expect(page.locator(at("postal-copied"))).toHaveText("The link is copied.");
  const link = new URL(await page.evaluate(() => navigator.clipboard.readText()));
  expect(link.searchParams.get("postal")).toBe("M5H 2N2");
  expect(link.searchParams.has("parse")).toBe(false);
  expect(link.hash).toBe("#postal");
  // The link opens the page with the panel as it was.
  await page.goto(link.toString());
  await page.waitForSelector('main[data-ready="true"]');
  await expect(page.locator(at("postal-answer"))).toContainText("ON · Ontario");
  expect(errors).toEqual([]);
});

test("clean shows the address typed, cleaned, then as its post office writes it", async ({ page }, testInfo) => {
  const errors = await open(page);
  const answer = page.locator(at("clean-answer"));
  await expect(answer).toContainText("350 FIFTH AVENUE, NEW YORK, NY 10118");
  await expect(answer).toContainText("350 Fifth Ave, New York NY 10118");
  await expect(answer).toContainText("As USPS writes it");
  await expect(answer).toContainText("350 FIFTH AVE / NEW YORK NY 10118");
  await tap(page, chip(page, "clean", "Canada"), testInfo);
  await expect(answer).toContainText("As Canada Post writes it");
  await tap(page, chip(page, "clean", "Japan"), testInfo);
  await expect(answer).toContainText("As Japan Post writes it");
  await expect(answer).toContainText("〒100-0005 東京都千代田区丸の内1-2-3");
  await expect(answer).not.toContainText("13 100-0005");
  expect(errors).toEqual([]);
});

test("the new tools speak Japanese with the page", async ({ page }, testInfo) => {
  const errors = await open(page, "?lang=ja");
  await expect(page.locator(at("bulk-summary"))).toContainText("19件中18件を読み取り");
  await expect(page.locator(at("japan-panel"))).toContainText("日本の住所を部分ごとに");
  await expect(page.locator(at("japan-answer"))).toContainText("配達先：京都府");
  await expect(page.locator(at("parse-copy-code"))).toHaveText("コードをコピー");
  await tap(page, at("corpus-load"), testInfo);
  await expect(page.locator(at("corpus-summary"))).toContainText("件が合格");
  expect(errors).toEqual([]);
});
