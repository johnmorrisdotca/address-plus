import { expect, test } from "@playwright/test";

import { open } from "./demo.mjs";

for (const path of ["", "builder.html"]) {
  test(`Docs follows initial and live language on ${path || "the native tools"}`, async ({ page }) => {
    const errors = await open(page, "?lang=ja", path);
    const docs = page.locator('[data-say="pageDocs"]');
    await expect(docs).toHaveText("ドキュメント");
    await expect(docs).toHaveAttribute("href", "docs/ja/index.html");
    await page.locator('button[data-lang="en"]').click();
    await expect(docs).toHaveAttribute("href", "docs/index.html");
    await page.locator('button[data-lang="ja"]').click();
    await docs.click();
    await expect(page).toHaveURL("http://address-plus.test/docs/ja/index.html");
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    expect(errors).toEqual([]);
  });
}
