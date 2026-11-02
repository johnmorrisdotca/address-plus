/* global Blob, OffscreenCanvas, atob, createImageBitmap, FileReader */
// The shared part of `pnpm screenshots:readme` (johnmorrisdotca/.github, README-STANDARD.md): the same file in every package.
// A package's scripts/readme-pictures.mjs lists its shots and how each is set up; this file serves the built demo (site/) to
// Chromium without a port, opens each shot at each size and in each colour scheme, crops to the element a shot names, converts to
// WebP, checks the size budget, writes docs/images/<subject>-<desk|phone>-<light|dark>.webp and removes any picture that is no
// longer made. Nothing is fetched from the live site, and nothing waits on a clock: a shot's `ready` says what to wait for.
//
//   import { takePictures } from "./readme-pictures-lib.mjs";
//   await takePictures({ shots: [{ subject: "hero", views: ["desk", "phone"], prepare: async (page, { view }) => {...}, ready: "#board svg" }] });
import { Buffer } from "node:buffer";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

export const VIEWS = {
  desk: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, hasTouch: false, isMobile: false },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true },
};
export const SCHEMES = ["light", "dark"];
export const QUALITY = 0.82;
export const BUDGET_DESK = 200 * 1024;
export const BUDGET_OTHER = 120 * 1024;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".md": "text/markdown" };

/** Convert a PNG to lossy WebP with the browser's own encoder, so that no tool is needed beyond Playwright. */
async function toWebp(page, png) {
  const encoded = await page.evaluate(async ({ base64, quality }) => {
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    canvas.getContext("2d").drawImage(bitmap, 0, 0);
    const blob = await canvas.convertToBlob({ type: "image/webp", quality });
    const reader = new FileReader();
    const done = new Promise((resolve) => { reader.onloadend = () => resolve(String(reader.result).split(",")[1]); });
    reader.readAsDataURL(blob);
    return done;
  }, { base64: png.toString("base64"), quality: QUALITY });
  return Buffer.from(encoded, "base64");
}

/**
 * Take the pictures.
 * @param {object} options
 * @param {{ subject: string, views?: ("desk"|"phone")[], schemes?: ("light"|"dark")[], lang?: string, url?: string, target?: string,
 *   prepare?: (page: import("@playwright/test").Page, state: { view: string, scheme: string }) => Promise<void>,
 *   ready?: string, scale?: number, height?: number, fullPage?: boolean }[]} options.shots `target` is a selector to crop to (the viewport otherwise);
 *   `ready` a selector that is present when the page is drawn; `url` the path and query to open (default `/`); `scale` overrides the
 *   device scale factor and `height` the desk viewport's height for this shot.
 * @param {string} [options.root] the package's folder (default: the folder above this script)
 * @param {string} [options.site] the built demo's folder inside it (default `site`)
 * @param {string[]} [options.only] subjects to take (the others are left as they are, and nothing is removed)
 * A shot may also have `init`, a function run in the page before it loads (to keep a level, say), and `state`, a plain object it
 * is given beside `view` and `scheme`; `init` is serialised, so it may use nothing from the script's own scope.
 */
export async function takePictures({ shots, root = join(dirname(fileURLToPath(import.meta.url)), ".."), site = "site", only }) {
  const name = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).name.split("/")[1];
  const siteDir = join(root, site);
  const out = join(root, "docs", "images");
  if (!existsSync(join(siteDir, "index.html"))) throw new Error(`${site}/ is not built: run \`pnpm screenshots:readme\` (it builds the demo first)`);
  mkdirSync(out, { recursive: true });
  const host = `http://${name}.test`;
  const browser = await chromium.launch();
  const written = [];
  const failures = [];
  try {
    for (const shot of shots) {
      if (only && !only.includes(shot.subject)) continue;
      for (const view of shot.views ?? ["desk"]) {
        for (const scheme of shot.schemes ?? SCHEMES) {
          const geometry = VIEWS[view];
          const context = await browser.newContext({ ...geometry, viewport: { ...geometry.viewport, height: view === "desk" ? (shot.height ?? geometry.viewport.height) : geometry.viewport.height }, deviceScaleFactor: shot.scale ?? geometry.deviceScaleFactor, colorScheme: scheme, reducedMotion: "reduce", locale: "en-US", timezoneId: "UTC" });
          const page = await context.newPage();
          await page.route(`${host}/**`, (route) => {
            const { pathname } = new URL(route.request().url());
            const asked = join(siteDir, pathname === "/" ? "index.html" : decodeURIComponent(pathname).slice(1));
            const file = existsSync(asked) && statSync(asked).isDirectory() ? join(asked, "index.html") : asked;
            if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
            return route.fulfill({ body: readFileSync(file), contentType: TYPES[extname(file)] ?? "application/octet-stream" });
          });
          try {
            if (shot.init) await page.addInitScript(shot.init, { view, scheme, ...shot.state });
            await page.goto(`${host}${shot.url ?? `/?lang=${shot.lang ?? "en"}`}`);
            if (shot.ready) await page.waitForSelector(shot.ready);
            if (shot.prepare) await shot.prepare(page, { view, scheme });
            await page.mouse.move(0, 0);
            const png = shot.target ? await page.locator(shot.target).first().screenshot({ animations: "disabled" }) : await page.screenshot({ animations: "disabled", fullPage: shot.fullPage ?? false });
            const webp = await toWebp(page, png);
            const file = `${shot.subject}-${view}-${scheme}.webp`;
            const budget = view === "desk" ? BUDGET_DESK : BUDGET_OTHER;
            if (webp.length > budget) failures.push(`${file} is ${Math.round(webp.length / 1024)} KB; the budget is ${budget / 1024} KB`);
            writeFileSync(join(out, file), webp);
            written.push({ file, bytes: webp.length });
            console.log(`${file.padEnd(36)} ${String(Math.round(webp.length / 1024)).padStart(4)} KB`);
          } catch (error) {
            failures.push(`${shot.subject} ${view} ${scheme}: ${error.message.split("\n")[0]}`);
          } finally {
            await context.close();
          }
        }
      }
    }
  } finally {
    await browser.close();
  }
  if (!only) {
    const made = new Set(written.map((picture) => picture.file));
    for (const file of readdirSync(out)) if (!made.has(file) && !file.startsWith(".")) { rmSync(join(out, file)); console.log(`removed ${file}: no shot makes it`); }
  }
  const total = written.reduce((sum, picture) => sum + picture.bytes, 0);
  console.log(`${written.length} pictures, ${(total / 1024).toFixed(0)} KB in docs/images`);
  if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
}
