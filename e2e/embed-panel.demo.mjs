// The builder's code section is kazoku-ui's <kazoku-embed-panel>, and it holds everything the code section held before:
// the nine ways a page is made, Copy, "Copy a link to this field" and "Start again", and adds the embed
// page, the guide and the credit. The builder's preview and its choices stay the package's, so the panel shows neither.
import { expect, test } from "@playwright/test";
import { serve } from "./demo.mjs";

const TABS = [
  "Custom element",
  "iframe",
  "ES module",
  "React 19",
  "Vue",
  "Svelte",
  "Angular",
  "Plain HTML",
  "iframe URL",
];
const panel = (page) => page.getByTestId("bld-embed");

test("the code section is the embed panel, with every item it had and the guide, the embed page and the credit", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await serve(page);
  await page.goto("http://address-plus.test/builder.html?lang=en");
  await expect(page.locator("#bld-stage address-field input")).toBeVisible();
  // the nine tabs, by their names, and the code of the one chosen
  await expect(panel(page).getByRole("tab")).toHaveText(TABS);
  await expect(panel(page).locator("[part=code]")).toContainText("<address-field");
  // Copy, the two buttons of the builder in the panel's actions, and nothing of the old section left
  await expect(panel(page).locator("[part=copy]")).toBeVisible();
  await expect(panel(page).getByTestId("bld-link")).toHaveText("Copy a link to this field");
  await expect(panel(page).getByTestId("bld-reset")).toHaveText("Start again");
  await expect(page.locator("#bld-code, #bld-formats, #bld-copy")).toHaveCount(0);
  // what the panel adds: the note, the embed page with the choices, the guide and the credit
  await expect(panel(page).locator("[part=note]")).toHaveText(
    "Only choices that differ from the defaults are included in the code.",
  );
  await expect(panel(page).locator("[part=open]")).toHaveAttribute("href", /embed\//);
  await expect(panel(page).locator("[part=docs]")).toHaveAttribute("href", "docs/guides/form-field-and-embeds.html");
  await expect(panel(page).locator("[part=credits]")).toContainText("Australian Bureau of Statistics");
  for (const source of ["Ordnance Survey and Royal Mail", "La Poste and INSEE", "GeoNames", "NOTICE.md"])
    await expect(panel(page).locator("[part=credits]")).toContainText(source);
  // the preview and the size are the builder's own
  await expect(panel(page).locator("[part=preview]")).toBeHidden();
  await expect(panel(page).locator("[part=size]")).toBeHidden();
  // a tab chosen in the panel is the builder's format, kept in the address
  await panel(page).getByRole("tab", { name: "Vue", exact: true }).click();
  await expect(panel(page).locator("[part=code]")).toContainText("<script setup>");
  await expect(page).toHaveURL(/show=vue/);
  // in Japanese: the tabs, the note, the builder's buttons, the guide and the credit
  await page.locator('kazoku-language-picker [data-v="ja"]').click();
  await expect(panel(page).getByRole("tab").first()).toHaveText("カスタム要素");
  await expect(panel(page).locator("[part=note]")).toHaveText("初期値と異なる選択だけがコードに含まれます。");
  await expect(panel(page).getByTestId("bld-link")).toHaveText("この入力欄へのリンクをコピー");
  await expect(panel(page).locator("[part=docs]")).toHaveAttribute("href", "docs/ja/guides/form-field-and-embeds.html");
  await expect(panel(page).locator("[part=credits]")).toContainText(
    "郵便番号のデータは、オーストラリアがオーストラリア統計局（ABS、CC BY 4.0）、イギリスがOrdnance SurveyとRoyal Mail（Open Government Licence v3.0）、フランスがLa PosteとINSEE（Licence Ouverte 2.0）、ドイツがGeoNames（CC BY 4.0）のものです。地域名はkuni（Unicode CLDRとWikidata）のものです。全文：https://github.com/johnmorrisdotca/address-plus/blob/main/NOTICE.md",
  );
  expect(errors).toEqual([]);
});

test("the panel's tab follows the address, and Start again sets the choices back and keeps the tab", async ({
  page,
}) => {
  await serve(page);
  await page.goto("http://address-plus.test/builder.html?lang=en#show=react");
  const react = panel(page).getByRole("tab", { name: "React 19", exact: true });
  await expect(react).toHaveAttribute("aria-selected", "true");
  await expect(panel(page).locator("[part=code]")).toContainText("export function Example()");
  await panel(page).getByTestId("bld-reset").click();
  await expect(react).toHaveAttribute("aria-selected", "true");
  await expect(panel(page).locator("[part=code]")).toContainText("<address-field");
});

test("a page opened in Japanese gives the panel its Japanese tabs, note, buttons, guide and credit", async ({
  page,
}) => {
  await serve(page);
  await page.goto("http://address-plus.test/builder.html?lang=ja");
  await expect(page.locator("#bld-stage address-field input")).toBeVisible();
  await expect(panel(page).getByRole("tab").first()).toHaveText("カスタム要素");
  await expect(panel(page).locator("[part=note]")).toHaveText("初期値と異なる選択だけがコードに含まれます。");
  await expect(panel(page).getByTestId("bld-link")).toHaveText("この入力欄へのリンクをコピー");
  await expect(panel(page).locator("[part=docs]")).toHaveAttribute("href", "docs/ja/guides/form-field-and-embeds.html");
  await expect(panel(page).locator("[part=credits]")).toContainText(
    "郵便番号のデータは、オーストラリアがオーストラリア統計局（ABS、CC BY 4.0）、イギリスがOrdnance SurveyとRoyal Mail（Open Government Licence v3.0）、フランスがLa PosteとINSEE（Licence Ouverte 2.0）、ドイツがGeoNames（CC BY 4.0）のものです。地域名はkuni（Unicode CLDRとWikidata）のものです。全文：https://github.com/johnmorrisdotca/address-plus/blob/main/NOTICE.md",
  );
});
