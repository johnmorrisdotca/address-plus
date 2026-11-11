// The family's page frame (kazoku-ui's page-frame): every page of the demo says what it is, links home and shows its data's
// credits (with what each licence asks for: the CC BY sources, Ordnance Survey's statement, La Poste and INSEE), without
// opening a menu, on a desk and on a phone, with a title and a description of its own; the embed page has the small
// credit line in its corner.
import { pageProblems } from "@johnmorrisdotca/kazoku-ui/page-frame";
import { expect, test } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import { FRAME_TEXTS, NOTICE } from "../scripts/page-frame.mjs";
import { serve } from "./demo.mjs";

/** Each page, and what says it has finished drawing its map. */
const PAGES = [
  { path: "index.html", ready: 'main[data-ready="true"]' },
  { path: "builder.html", ready: "#bld-stage address-field input" },
];
const EMBEDS = ["embed/"];

test("every page the build wrote has a title, a description, the header and the credit line", () => {
  const pages = readdirSync("site").filter((file) => file.endsWith(".html") && file !== "api.html");
  expect(pages).toEqual(expect.arrayContaining(PAGES.map((one) => one.path)));
  for (const name of pages) expect(pageProblems(readFileSync(`site/${name}`, "utf8")), name).toEqual([]);
  for (const path of EMBEDS)
    expect(pageProblems(readFileSync(`site/${path}index.html`, "utf8"), { embed: true }), path).toEqual([]);
});

for (const lang of ["en", "ja"]) {
  for (const { path, ready } of PAGES) {
    test(`${path} in ${lang} says what it is, links home, and shows its credits`, async ({ page }) => {
      await serve(page);
      await page.goto(`http://address-plus.test/${path}?lang=${lang}`);
      await expect(page.locator(ready)).toHaveCount(1);
      const { name, what } = FRAME_TEXTS[path][lang];
      const header = page.locator("kazoku-page-header");
      await expect(header).toContainText(name);
      await expect(header).toContainText(what);
      await expect(header.getByRole("link").first()).toBeVisible();
      await expect(page).toHaveTitle(lang === "ja" ? `${name}：${what}` : `${name}: ${what}`);
      const credits = page.locator("kazoku-page-credits");
      await expect(credits).toBeVisible();
      for (const source of [
        "Contains OS data © Crown copyright and database right 2026.",
        "Contains Royal Mail data © Royal Mail copyright and database right 2026.",
        "Contains National Statistics data © Crown copyright and database right 2026.",
        "La Poste, Base officielle des codes postaux, last updated on 2026-10-08",
        "INSEE, Code officiel géographique 2026",
        "CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)",
        "Open Government Licence v3.0 (https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/)",
        "Licence Ouverte 2.0 (https://www.etalab.gouv.fr/licence-ouverte-open-licence/)",
        "Changed: only the four-digit postcode numbers are kept",
      ])
        await expect(credits).toContainText(source);
      await expect(credits.getByRole("link")).toHaveAttribute("href", NOTICE);
      // once the page has drawn, nothing runs off the side of it
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
        .toBe(true);
    });
  }
}

for (const path of EMBEDS) {
  test(`${path} has the small credit line in its corner, each source and licence a link, and the credits in a new tab`, async ({
    page,
  }) => {
    await serve(page);
    await page.goto(`http://address-plus.test/${path}?country=US`);
    const credits = page.locator("kazoku-page-credits");
    await expect(credits).toBeVisible();
    await expect(credits).toHaveAttribute("embed", "");
    for (const source of [
      "GeoNames",
      "Australian Bureau of Statistics",
      "CC BY 4.0",
      "Ordnance Survey",
      "Open Government Licence v3.0",
      "La Poste",
      "INSEE",
      "Licence Ouverte 2.0",
    ])
      await expect(credits).toContainText(source);
    // each licence links to its text and each source to its data, in a tab of its own, never taking the frame away
    for (const [name, href] of [
      ["CC BY 4.0", "https://creativecommons.org/licenses/by/4.0/"],
      ["Open Government Licence v3.0", "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"],
      ["Licence Ouverte 2.0", "https://www.etalab.gouv.fr/licence-ouverte-open-licence/"],
      ["GeoNames", "https://www.geonames.org/"],
      ["Ordnance Survey", "https://www.ordnancesurvey.co.uk/products/code-point-open"],
    ])
      await expect(credits.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
    const pieces = credits.locator("[part=credit-link]");
    await expect(pieces).toHaveCount(9);
    for (const link of await pieces.all()) {
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    await expect(credits.locator("[part=link]")).toHaveAttribute("href", NOTICE);
    await expect(credits.locator("[part=link]")).toHaveAttribute("target", "_blank");
  });
}
