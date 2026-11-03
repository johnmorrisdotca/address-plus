// The Help switch in the family header: see the top of scripts/family-template.mjs.
import { expect, test } from "@playwright/test";

import { open } from "./demo.mjs";

// Off, the page is as it was; on, every option row says in one line what it does, in the page's language, and every
// control in it has hover words.
test("Help is off at first, and on it shows a line under each option row, in either language, without resizing an answer", async ({
  page,
}) => {
  const errors = await open(page);
  const lines = page.locator(".fam-help");
  const rows = page.locator("[data-help-en]");
  expect(await rows.count()).toBeGreaterThan(0);
  await expect(page.locator("[data-help-switch]")).toHaveAttribute("aria-pressed", "false");
  await expect(lines.first()).toBeHidden();
  const surface = page.locator('[data-testid="parse-answer"]').first();
  const before = await surface.boundingBox();
  await page.locator("[data-help-switch]").click();
  await expect(page.locator("html")).toHaveAttribute("data-help", "on");
  for (const row of await rows.all()) {
    if (await row.isVisible()) {
      const shown = await row.evaluate((el) => {
        const line =
          el.classList.contains("fam-seg") || el.hasAttribute("data-help-after")
            ? el.nextElementSibling
            : el.querySelector(":scope > .fam-help");
        return (
          line !== null &&
          line.classList.contains("fam-help") &&
          window.getComputedStyle(line).display !== "none" &&
          line.textContent.length > 10
        );
      });
      expect(shown).toBe(true);
    }
    expect(((await row.getAttribute("data-help-en")) ?? "").length).toBeGreaterThan(10);
    expect(((await row.getAttribute("data-help-ja")) ?? "").length).toBeGreaterThan(4);
  }
  const after = await surface.boundingBox();
  // The answer keeps its width (to a fraction of a pixel).
  expect(Math.abs(after.width - before.width)).toBeLessThan(0.5);
  // Every button in an option row says what it does on hover.
  const untitled = await page.evaluate(() =>
    [...document.querySelectorAll("[data-help-en] button")].filter((b) => !b.title).map((b) => b.textContent.trim()),
  );
  expect(untitled).toEqual([]);
  const english = await lines.first().textContent();
  await page.locator('kazoku-language-picker [data-v="ja"]').click();
  await expect(lines.first()).not.toHaveText(english);
  // The choice is kept, and turning it off hides every line again.
  await page.reload();
  await expect(page.locator("[data-help-switch]")).toHaveAttribute("aria-pressed", "true");
  await page.locator("[data-help-switch]").click();
  await expect(lines.first()).toBeHidden();
  expect(errors).toEqual([]);
});
