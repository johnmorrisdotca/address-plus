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
});
