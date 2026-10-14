// docs-site.demo.mjs: the documentation site (scripts/docs-site.mjs) in a real browser, the same file in every package of the
// family, held to one hash by src/docs-site.test.js. `pnpm test:demo` builds the demo and the docs, then runs it with the
// demo's own tests. It serves site/ to the page without a port, and reads which pages there are from the files.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "site");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const id = pkg.name.replace(/^@[^/]+\//, "");
const origin = `http://${id}.test`;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".txt": "text/plain", ".md": "text/markdown" };

/** Every page of the docs, as an address under the site: docs/index.html, docs/ja/api/…. */
const pages = (folder = join(site, "docs")) => (existsSync(folder) ? readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
  const path = join(folder, entry.name);
  if (entry.isDirectory()) return entry.name === "pagefind" ? [] : pages(path);
  return entry.name.endsWith(".html") ? [relative(site, path).split("\\").join("/")] : [];
}) : []);

async function serve(page) {
  if (!existsSync(join(site, "docs", "index.html"))) throw new Error("site/docs is not built: run `pnpm site && pnpm docs:site` first (`pnpm test:demo` does)");
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await page.route(`${origin}/**`, (route) => {
    const { pathname } = new URL(route.request().url());
    const file = join(site, decodeURIComponent(pathname.endsWith("/") ? `${pathname}index.html` : pathname));
    if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
    return route.fulfill({ body: readFileSync(file), contentType: TYPES[file.slice(file.lastIndexOf("."))] ?? "application/octet-stream" });
  });
  return errors;
}

const fits = async (page) => {
  const [scroll, client] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  return scroll <= client;
};

test.describe("the documentation site", () => {
  test("every page fits the screen, has one h1, headings in order, a main, a skip link and its language", async ({ page }, testInfo) => {
    // Every page once, at a phone's width: the narrowest screen is where a page runs wide.
    test.skip(testInfo.project.name !== "chromium-phone", "every page is walked once, at a phone's width");
    const all = pages();
    // Preserve the original minimum, while budgeting 100 ms per page for large resource catalogues.
    test.setTimeout(Math.max(240_000, all.length * 100));
    const errors = await serve(page);
    expect(all.length).toBeGreaterThan(10);
    const wide = [];
    for (const path of all) {
      await page.goto(`${origin}/${path}`);
      if (!(await fits(page))) wide.push(path);
      const shape = await page.evaluate(() => ({
        h1: document.querySelectorAll("h1").length,
        levels: [...document.querySelectorAll("main h1, main h2, main h3, main h4, main h5, main h6")].map((heading) => Number(heading.tagName[1])),
        main: document.querySelectorAll("main").length,
        skip: document.querySelector("body > a.docs-skip")?.getAttribute("href"),
        lang: document.documentElement.lang,
      }));
      expect(shape.h1, `${path}: one h1`).toBe(1);
      expect(shape.main, `${path}: one main`).toBe(1);
      expect(shape.skip, `${path}: a skip link first`).toBe("#content");
      expect(shape.lang, path).toBe(path.startsWith("docs/ja/") ? "ja" : "en");
      shape.levels.forEach((level, at) => { if (at > 0) expect(level, `${path}: heading ${at + 1} skips a level`).toBeLessThanOrEqual(shape.levels[at - 1] + 1); });
    }
    expect(wide, "pages wider than a 390 px screen").toEqual([]);
    expect(errors).toEqual([]);
  });

  test("the skip link is the first thing Tab reaches, and takes focus to the content", async ({ page }, testInfo) => {
    test.skip(testInfo.project.use.hasTouch === true, "a keyboard test");
    await serve(page);
    await page.goto(`${origin}/docs/index.html`);
    await page.keyboard.press("Tab");
    await expect(page.locator("a.docs-skip")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main#content")).toBeFocused();
  });

  test("search finds an export by its name, in English and in Japanese", async ({ page }) => {
    const errors = await serve(page);
    const first = pages().find((path) => /^docs\/api\/(?!main\/)[^/]+\/(?!index)[^/]+\.html$/.test(path));
    const name = first.split("/").pop().replace(/\.html$/, "");
    for (const prefix of ["docs/", "docs/ja/"]) {
      await page.goto(`${origin}/${prefix}search.html?q=${encodeURIComponent(name)}`);
      const result = page.locator("#docs-results li a").first();
      await expect(result).toBeVisible({ timeout: 15_000 });
      await expect(page.locator(`#docs-results li a[href$="/${name}.html"]`).first()).toBeVisible();
      await page.locator(`#docs-results li a[href$="/${name}.html"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`/${prefix}api/.+/${name}\\.html`));
    }
    expect(errors).toEqual([]);
  });

  test("the language links go to the same page in the other language and back", async ({ page }) => {
    await serve(page);
    const path = pages().find((one) => /^docs\/guides\//.test(one));
    await page.goto(`${origin}/${path}`);
    await page.locator('header .lang a[data-lang="ja"]').click();
    await expect(page).toHaveURL(`${origin}/${path.replace("docs/", "docs/ja/")}`);
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    await page.locator('header .lang a[data-lang="en"]').click();
    await expect(page).toHaveURL(`${origin}/${path}`);
  });

  test("every link inside the docs leads to a page that is there", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desk", "the links are read once");
    test.setTimeout(240_000);
    await serve(page);
    const missing = new Set();
    for (const path of pages()) {
      const html = readFileSync(join(site, path), "utf8");
      for (const [, href] of html.matchAll(/ href="([^"#?]+)(?:[#?][^"]*)?"/g)) {
        if (/^(https?:|mailto:|data:)/.test(href)) continue;
        const target = join(site, dirname(path), decodeURIComponent(href));
        if (!existsSync(target)) missing.add(`${path} → ${href}`);
      }
    }
    expect([...missing]).toEqual([]);
  });

  test("api.html keeps its old anchors, each leading to the export's own page", async ({ page }) => {
    await serve(page);
    await page.goto(`${origin}/api.html`);
    const anchors = await page.locator("article[id]").count();
    expect(anchors).toBeGreaterThan(0);
    const link = page.locator("article[id] h3 a").first();
    const href = await link.getAttribute("href");
    await link.click();
    await expect(page).toHaveURL(`${origin}/${href}`);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("llms.txt and llms-full.txt are at the site's root", async () => {
    for (const file of ["llms.txt", "llms-full.txt"]) {
      const text = readFileSync(join(site, file), "utf8");
      expect(text.startsWith("# "), file).toBe(true);
      expect(text.length, file).toBeGreaterThan(200);
    }
  });
});
