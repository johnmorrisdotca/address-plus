// The Netherlands, Spain, Italy and New Zealand in the demo: every panel but Clean reads them through their modules, the parse
// panel's country choice is the hint, the postal panel reads their postcodes, and the corpus panel runs their corpora; in
// English and in Japanese, at a phone's width.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, open, tap, type } from "./demo.mjs";

const answer = (page, name) => page.locator(at(`${name}-answer`));
const call = (page, name) => page.locator(at(`${name}-call`));
const chip = (page, name, label) =>
  page.locator(at(`${name}-examples`)).getByRole("button", { name: label, exact: true });
const choice = (page, id, label) => page.locator(at(id)).getByRole("button", { name: label, exact: true });

test("parse: the four by their examples, and the country choice as the hint", async ({ page }, testInfo) => {
  const errors = await open(page);
  await tap(page, chip(page, "parse", "Netherlands, an addition"), testInfo);
  await expect(answer(page, "parse")).toContainText("NL · Netherlands");
  await expect(answer(page, "parse")).toContainText("Keizersgracht");
  await expect(answer(page, "parse")).toContainText("1015 CJ");
  await tap(page, chip(page, "parse", "Spain, a floor and a door"), testInfo);
  await expect(answer(page, "parse")).toContainText("ES · Spain");
  await expect(answer(page, "parse")).toContainText("Calle de Alcalá");
  await tap(page, chip(page, "parse", "Italy, a letter"), testInfo);
  await expect(answer(page, "parse")).toContainText("IT · Italy");
  await expect(answer(page, "parse")).toContainText("Via del Corso");
  await expect(answer(page, "parse")).toContainText("RM");
  await tap(page, chip(page, "parse", "New Zealand, a unit"), testInfo);
  await expect(answer(page, "parse")).toContainText("NZ · New Zealand");
  await expect(answer(page, "parse")).toContainText("Dominion Road");
  await expect(answer(page, "parse")).toContainText("AUK");

  // With no postcode, nothing says Spain until the country is chosen.
  await type(page, "parse-input", "Calle Mayor 5, Madrid");
  await expect(answer(page, "parse")).not.toContainText("ES · Spain");
  await tap(page, choice(page, "parse-country", "Spain"), testInfo);
  await expect(answer(page, "parse")).toContainText("ES · Spain");
  await expect(call(page, "parse")).toContainText('country: "ES"');
  await expect(page).toHaveURL(/country=ES/);
  await noSidewaysScroll(page);
  expect(errors).toEqual([]);
});

test("validate, format, compare and postal read the four", async ({ page }, testInfo) => {
  const errors = await open(page);
  await tap(page, chip(page, "validate", "A Dutch postcode CBS does not list"), testInfo);
  await expect(answer(page, "validate")).toContainText("UNRECOGNIZED_POSTAL_CODE");
  await tap(page, chip(page, "validate", "A province that is not the postcode's"), testInfo);
  await expect(answer(page, "validate")).toContainText("POSTAL_REGION_MISMATCH");

  await tap(page, chip(page, "format", "Netherlands"), testInfo);
  await expect(answer(page, "format")).toContainText("PostNL");
  await expect(answer(page, "format")).toContainText("Damstraat 1-2");
  await expect(call(page, "format")).toContainText("formatPostNL(");
  await tap(page, chip(page, "format", "Italy"), testInfo);
  await expect(answer(page, "format")).toContainText("Poste Italiane");
  await expect(answer(page, "format")).toContainText("20127 Milano MI");
  await tap(page, chip(page, "format", "Spain"), testInfo);
  await expect(answer(page, "format")).toContainText("3º izda");
  await tap(page, chip(page, "format", "New Zealand"), testInfo);
  await expect(answer(page, "format")).toContainText("Mount Eden");

  await tap(page, chip(page, "compare", "Calle and C/"), testInfo);
  await expect(answer(page, "compare").locator(".fam-badge")).toHaveText("Yes");
  await expect(call(page, "compare")).toContainText("compareSpanishAddresses(");

  await tap(page, chip(page, "postal", "1015 CJ"), testInfo);
  await expect(answer(page, "postal")).toContainText("Dutch postcode");
  await tap(page, chip(page, "postal", "28014"), testInfo);
  await expect(answer(page, "postal")).toContainText("Spanish postcode");
  await expect(answer(page, "postal")).toContainText("M · Madrid Province");
  await expect(call(page, "postal")).toContainText("parseSpanishPostcode(");
  await tap(page, chip(page, "postal", "00186"), testInfo);
  await expect(answer(page, "postal")).toContainText("RM · Rome");
  await noSidewaysScroll(page);
  expect(errors).toEqual([]);
});

test("the list reads the four, and the corpus panel runs their corpora, none of it wrong", async ({
  page,
}, testInfo) => {
  const errors = await open(page);
  await tap(page, at("corpus-load"), testInfo);
  await expect(page.locator(at("corpus-bar-nl"))).toContainText("22 of 22 pass");
  await expect(page.locator(at("corpus-bar-es"))).toContainText("28 of 28 pass");
  await expect(page.locator(at("corpus-bar-it"))).toContainText("24 of 24 pass");
  await expect(page.locator(at("corpus-bar-nz"))).toContainText("20 of 20 pass");
  await tap(page, choice(page, "corpus-country", "Italy"), testInfo);
  await tap(page, at("corpus-wrong"), testInfo);
  await expect(page.locator(at("corpus-list"))).not.toContainText("Fails");
  await noSidewaysScroll(page);
  expect(errors).toEqual([]);
});

test("the four speak Japanese with the page", async ({ page }, testInfo) => {
  const errors = await open(page, "?lang=ja");
  await tap(page, chip(page, "parse", "スペイン（階と部屋）"), testInfo);
  await expect(answer(page, "parse")).toContainText("ES · スペイン");
  await tap(page, chip(page, "postal", "28014"), testInfo);
  await expect(answer(page, "postal")).toContainText("スペインの郵便番号");
  await expect(answer(page, "postal")).toContainText("マドリード県");
  await noSidewaysScroll(page);
  expect(errors).toEqual([]);
});

test("India, South Korea and Brazil: parse, validate, format, compare, postal and the corpora", async ({
  page,
}, testInfo) => {
  const errors = await open(page);
  await tap(page, chip(page, "parse", "India, a flat and a state"), testInfo);
  await expect(answer(page, "parse")).toContainText("IN · India");
  await expect(answer(page, "parse")).toContainText("MG Road");
  await expect(answer(page, "parse")).toContainText("560038");
  await tap(page, chip(page, "parse", "South Korea, in Hangul"), testInfo);
  await expect(answer(page, "parse")).toContainText("KR · South Korea");
  await expect(answer(page, "parse")).toContainText("세종대로");
  await tap(page, chip(page, "parse", "South Korea, in Latin letters"), testInfo);
  await expect(answer(page, "parse")).toContainText("Sejong-daero");
  await tap(page, chip(page, "parse", "Brazil, a bairro"), testInfo);
  await expect(answer(page, "parse")).toContainText("BR · Brazil");
  await expect(answer(page, "parse")).toContainText("Bela Vista");

  await tap(page, chip(page, "validate", "A state that is not the PIN's"), testInfo);
  await expect(answer(page, "validate")).toContainText("POSTAL_REGION_MISMATCH");
  await tap(page, chip(page, "validate", "A state that is not the CEP's"), testInfo);
  await expect(answer(page, "validate")).toContainText("POSTAL_REGION_MISMATCH");

  await tap(page, chip(page, "format", "India"), testInfo);
  await expect(answer(page, "format")).toContainText("India Post");
  await tap(page, chip(page, "format", "South Korea"), testInfo);
  await expect(answer(page, "format")).toContainText("서울특별시 중구 세종대로 110, 3층 (태평로1가)");
  await tap(page, chip(page, "format", "Brazil"), testInfo);
  await expect(answer(page, "format")).toContainText("01310-200 São Paulo SP");

  await tap(page, chip(page, "compare", "Av. and Avenida, and a CEP with no hyphen"), testInfo);
  await expect(answer(page, "compare").locator(".fam-badge")).toHaveText("Yes");

  await tap(page, chip(page, "postal", "560038"), testInfo);
  await expect(answer(page, "postal")).toContainText("Indian PIN code");
  await expect(answer(page, "postal")).toContainText("KA · Karnataka");
  await tap(page, chip(page, "postal", "01310-200"), testInfo);
  await expect(answer(page, "postal")).toContainText("Brazilian CEP");
  await expect(answer(page, "postal")).toContainText("SP · São Paulo");

  await tap(page, at("corpus-load"), testInfo);
  await expect(page.locator(at("corpus-bar-in"))).toContainText("22 of 22 pass");
  await expect(page.locator(at("corpus-bar-kr"))).toContainText("25 of 25 pass");
  await expect(page.locator(at("corpus-bar-br"))).toContainText("22 of 22 pass");
  await noSidewaysScroll(page);
  expect(errors).toEqual([]);
});
