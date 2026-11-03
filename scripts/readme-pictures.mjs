// Takes the pictures the README shows, from the built demo in `site/`: `pnpm screenshots:readme` (builds the demo,
// then runs this). The family's standard is in johnmorrisdotca/.github (README-STANDARD.md); the shared part is
// readme-pictures-lib.mjs. The page is served to a browser without a port, never fetched from the live site, and the
// same each run: every panel starts from its own example, and motion is reduced. It waits on the page saying it is
// ready, never on a clock. Output: docs/images/<subject>-<desk|phone>-<light|dark>.webp.
import { takePictures } from "./readme-pictures-lib.mjs";

const READY = 'main[data-ready="true"]';

await takePictures({
  shots: [
    ...["parse", "validate", "format", "compare"].map((subject) => ({
      subject,
      views: ["desk"],
      url: "/?lang=en&help=off",
      ready: READY,
      target: `[data-testid="${subject}-panel"]`,
    })),
    // From the top of the page, so the header, the language chooser, the cloth patches and the first panels show.
    {
      subject: "hero",
      views: ["desk"],
      url: "/?lang=en&help=off",
      ready: READY,
      height: 1100,
      async prepare(page) {
        await page.evaluate(() => window.scrollTo(0, 0));
      },
    },
    {
      subject: "hero",
      views: ["phone"],
      url: "/?lang=ja&help=off",
      target: '[data-testid="parse-panel"]',
      scale: 1,
      ready: READY,
      async prepare(page) {
        await page.locator('[data-testid="parse-examples"] button').nth(6).click();
      },
    },
  ],
  // The family's thumbnail, dark thumbnail and icon (scripts/family-thumbnail.mjs): six addresses typed into the Format
  // panel, each laid out as its post office asks (Japan, the US, Canada, France, Germany and the UK), on address
  // labels; the icon is the French label with its lines drawn as bars, so it carries no text.
  thumbnail: {
    url: "/?lang=en&help=off",
    ready: READY,
    target: "#thumbnail-stage",
    icon: { target: "#thumbnail-icon" },
    label: "address-plus アドレスプラス",
    async prepare(page) {
      const formatted = [];
      for (const example of ["Japan", "US with a unit", "Canada", "France", "Germany", "UK"]) {
        await page.locator('[data-testid="format-examples"] button', { hasText: new RegExp(`^${example}$`) }).click();
        formatted.push(await page.locator('[data-testid="format-answer"] .lines').first().innerText());
      }
      await page.evaluate((addresses) => {
        const label = (body) =>
          `<div style="background:var(--surface);border:1px solid var(--rule);border-left:10px solid var(--felt);border-radius:14px;padding:22px 28px;box-shadow:0 2px 6px rgba(0,0,0,.12)">${body}</div>`;
        const text = (lines) =>
          `<div style="font-size:22px;line-height:1.45;font-weight:600;color:var(--ink);white-space:pre">${lines.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</div>`;
        const bars = (lines) =>
          `<div style="display:flex;flex-direction:column;gap:22px;padding:10px 0">${lines
            .split("\n")
            .map(
              (line, at) =>
                `<div style="height:36px;border-radius:18px;width:${Math.max(4, line.length) * 22}px;background:${at === 0 ? "var(--accent)" : "var(--ink)"}"></div>`,
            )
            .join("")}</div>`;
        const font = getComputedStyle(document.querySelector('[data-testid="format-answer"] .lines')).fontFamily;
        document.body.replaceChildren();
        document.body.insertAdjacentHTML(
          "beforeend",
          `<div id="thumbnail-stage" style="display:grid;grid-template-columns:repeat(3,max-content);gap:24px;align-items:start;padding:12px;width:max-content;font-family:${font.replace(/"/g, "'")}">${addresses.map((lines) => label(text(lines))).join("")}</div>` +
            `<div id="thumbnail-icon" style="padding:12px;width:max-content">${label(bars(addresses[3]))}</div>`,
        );
      }, formatted);
    },
  },
});
