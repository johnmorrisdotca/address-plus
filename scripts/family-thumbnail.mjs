/* global Blob, OffscreenCanvas, atob, createImageBitmap, FileReader */
// family-thumbnail.mjs: every package's official pictures of itself, the same file in every package of the family
// (scripts/family-thumbnail.mjs, with its types in scripts/family-thumbnail.d.mts). A package never edits it; the master
// is johnmorrisdotca/.github, family/.
//
// Three files in docs/images, all made from the same drawing by the package's own screenshot script, so a retake of
// the pictures remakes them:
//
//   thumbnail.png       1200×630, light: the social card (og:image, twitter:image, Slack, LinkedIn, iMessage, and
//                       GitHub's social preview, which takes 1200×630)
//   thumbnail-dark.png  1200×630, dark: the README's top picture in a dark theme
//   icon.png            512×512, light: a tight crop of the drawing that still reads at 40 px, with no text (lists,
//                       the package scorecard, the demo's apple-touch-icon)
//
// They are published on GitHub Pages beside the demo at stable addresses, https://<owner>.github.io/<repo>/thumbnail.png,
// thumbnail-dark.png and icon.png, which is what anything outside the repository links to.
//
// A package uses it in four places:
//
//   - its screenshot script: captureDrawing(page, selector) for each scheme, then composeThumbnails({ page, root,
//     light, dark, icon }) writes the three files. scripts/readme-pictures-lib.mjs does this for a `thumbnail` shot.
//   - its site builder: publishThumbnails(root, siteDir) copies the files into the site, and thumbnailHead(pkg) goes
//     in the demo's <head> (og:image, twitter:card summary_large_image, twitter:image, apple-touch-icon). The cards are
//     at their absolute addresses, which link previews need and browsers never fetch; the icon, the one tag a browser
//     does fetch, is relative to the page, so a strict Content-Security-Policy (img-src 'self') allows it.
//   - its README: thumbnailReadmeBlock(pkg, { alt }) is the first thing in it, above the title, a <picture> of the
//     light and dark cards linking to the demo. npm shows the light one.
//   - its family-thumbnail test: thumbnailFaults(root) is empty, and the test records this file's hash.
import { Buffer } from "node:buffer";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * The day this file last changed, in every repository at once (.2, .3 for a second and third change on one day). The
 * family-thumbnail test records the file's hash.
 */
export const FAMILY_THUMBNAIL_VERSION = "2026-11-03.2";

/** The three pictures: their file in docs/images, size in pixels, colour scheme and the most bytes each may take. */
export const THUMBNAILS = [
  { file: "thumbnail.png", width: 1200, height: 630, scheme: "light", budget: 1024 * 1024 },
  { file: "thumbnail-dark.png", width: 1200, height: 630, scheme: "dark", budget: 1024 * 1024 },
  { file: "icon.png", width: 512, height: 512, scheme: "light", budget: 400 * 1024 },
];
export const THUMBNAIL_FILES = THUMBNAILS.map((one) => one.file);

/** The grounds the drawing is laid on, and the colour of the small name. Light is the family's paper; dark its black cloth. */
export const GROUNDS = {
  light: { ground: "#f7f4ec", ink: "#4d5157" },
  dark: { ground: "#1b1d20", ink: "#c9c4b8" },
};

/** A leading thumbnail block of a README: what the README lint skips before it looks for the title. */
export const LEADING_THUMBNAIL =
  /^\s*<p align="center"><a href="[^"]*"><picture>[\s\S]*?<\/picture><\/a><\/p>[ \t]*(?:\n|$)/;

const escapeHtml = (text) =>
  String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The package's GitHub owner and repository, from package.json's `repository` (johnmorrisdotca and the npm name otherwise). */
export function repositoryOf(pkg) {
  const url = typeof pkg.repository === "string" ? pkg.repository : pkg.repository?.url;
  const found = /github\.com[/:]([^/]+)\/([^/#]+?)(?:\.git)?(?:#.*)?$/.exec(String(url ?? ""));
  if (found) return { owner: found[1], repo: found[2] };
  return { owner: "johnmorrisdotca", repo: String(pkg.name).split("/").pop() };
}

/** Every address of the pictures: the demo, the Pages copies (for links from outside) and the raw copies (for the README). */
export function thumbnailAddresses(pkg) {
  const { owner, repo } = repositoryOf(pkg);
  const site = `https://${owner}.github.io/${repo}/`;
  const raw = `https://raw.githubusercontent.com/${owner}/${repo}/main/docs/images/`;
  return {
    site,
    card: `${site}thumbnail.png`,
    dark: `${site}thumbnail-dark.png`,
    icon: `${site}icon.png`,
    raw: { card: `${raw}thumbnail.png`, dark: `${raw}thumbnail-dark.png`, icon: `${raw}icon.png` },
  };
}

/** The words a reader of the card is given when the picture cannot be seen. */
export const defaultAlt = (pkg) =>
  `${String(pkg.name).split("/").pop()}: ${String(pkg.description ?? "a package of the johnmorrisdotca family").replace(/\.$/, "")}`;

/**
 * The way from a page to the site's root, as thumbnailHead's `base` takes it: "" for a page at the root, "../" for one a
 * folder down, "../../" for two. Anything else (an address, a path from the server's root, a folder name) is refused,
 * because the icon must stay on the page's own site and work wherever Pages puts it (https://<owner>.github.io/<repo>/).
 */
export const RELATIVE_BASE = /^(?:\.\.\/)*$/;

/**
 * The lines the demo's <head> carries for the card and the icon. The card (og:image, twitter:image) is at its absolute
 * Pages address: link previews need that, and a browser never fetches it. The apple-touch-icon is the one tag a browser
 * fetches, so its address is relative to the page, `${base}icon.png` (publishThumbnails puts icon.png at the site's root):
 * a strict Content-Security-Policy (img-src 'self') allows it, and a test that serves the site under a made-up host finds
 * it there. `base` is the way from the page to the site's root ("" for the front page, "../" for a page in docs/ or
 * demo/); `icon: false` leaves the icon out, for a page that keeps its own.
 */
export function thumbnailHead(pkg, { alt = defaultAlt(pkg), base = "", icon = true } = {}) {
  if (typeof base !== "string" || !RELATIVE_BASE.test(base))
    throw new Error(
      `thumbnailHead: base is the way from the page to the site's root ("", "../", "../../"), not ${JSON.stringify(base)}.`,
    );
  const at = thumbnailAddresses(pkg);
  return [
    `<meta property="og:image" content="${at.card}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escapeHtml(alt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:image" content="${at.card}" />`,
    `<meta name="twitter:image:alt" content="${escapeHtml(alt)}" />`,
    ...(icon ? [`<link rel="apple-touch-icon" href="${base}icon.png" />`] : []),
  ].join("\n    ");
}

/** The README's first block: the light and dark cards in a <picture>, linking to the demo. */
export function thumbnailReadmeBlock(pkg, { alt = defaultAlt(pkg) } = {}) {
  const at = thumbnailAddresses(pkg);
  return `<p align="center"><a href="${at.site}"><picture><source media="(prefers-color-scheme: dark)" srcset="${at.raw.dark}"><img src="${at.raw.card}" alt="${escapeHtml(alt)}" width="1200"></picture></a></p>`;
}

/** What is wrong with the top of a README: it opens with thumbnailReadmeBlock's shape, at this package's addresses. */
export function readmeThumbnailFaults(readme, pkg) {
  const at = thumbnailAddresses(pkg);
  const block = LEADING_THUMBNAIL.exec(readme.replace(/\r\n/g, "\n"));
  if (!block)
    return [`The README does not open with its thumbnail: put this above the title:\n${thumbnailReadmeBlock(pkg)}`];
  const faults = [];
  const text = block[0];
  if (!text.includes(`<a href="${at.site}">`))
    faults.push(`The README's thumbnail does not link to the demo, ${at.site}.`);
  if (
    !new RegExp(
      `<source media="\\(prefers-color-scheme: dark\\)" srcset="${at.raw.dark.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">`,
    ).test(text)
  )
    faults.push(`The README's thumbnail has no dark source at ${at.raw.dark}.`);
  if (!text.includes(`src="${at.raw.card}"`)) faults.push(`The README's thumbnail is not ${at.raw.card}.`);
  const alt = /\salt="([^"]*)"/.exec(text)?.[1] ?? "";
  if (alt.trim().length < 20) faults.push("The README's thumbnail has no alt text, or less than a sentence of it.");
  return faults;
}

/** A PNG's width and height from its header, or null when the bytes are not a PNG. */
export function pngSize(bytes) {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (
    bytes.length < 24 ||
    signature.some((byte, index) => bytes[index] !== byte) ||
    bytes.toString("ascii", 12, 16) !== "IHDR"
  )
    return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

/** The package's folder and the repository's (they differ in a monorepo, where docs/site.json says `repositoryRoot`). */
function folders(root) {
  const config = join(root, "docs", "site.json");
  const repositoryRoot = existsSync(config)
    ? resolve(root, JSON.parse(readFileSync(config, "utf8")).repositoryRoot ?? ".")
    : resolve(root);
  return { root: resolve(root), repositoryRoot, images: join(repositoryRoot, "docs", "images") };
}

/** The files that build the demo's pages: scripts/site*.{mjs,js,ts}, and the HTML of demo/ and the package's own folder. */
function siteSources(root) {
  const out = [];
  const scripts = join(root, "scripts");
  if (existsSync(scripts))
    for (const file of readdirSync(scripts)) if (/^site.*\.(mjs|js|ts)$/.test(file)) out.push(join(scripts, file));
  for (const folder of [join(root, "demo"), root]) {
    if (!existsSync(folder) || !statSync(folder).isDirectory()) continue;
    for (const file of readdirSync(folder)) if (file.endsWith(".html")) out.push(join(folder, file));
  }
  return out;
}

/** Everything wrong with a package's thumbnails: the files and their sizes, the README's top, and the demo's head and publishing. */
export function thumbnailFaults(root = ".") {
  const where = folders(root);
  const pkg = JSON.parse(readFileSync(join(where.root, "package.json"), "utf8"));
  const faults = [];
  for (const one of THUMBNAILS) {
    const path = join(where.images, one.file);
    if (!existsSync(path)) {
      faults.push(
        `docs/images/${one.file} does not exist: retake the pictures (the package's screenshot script makes it).`,
      );
      continue;
    }
    const bytes = readFileSync(path);
    const size = pngSize(bytes);
    if (!size) {
      faults.push(`docs/images/${one.file} is not a PNG.`);
      continue;
    }
    if (size.width !== one.width || size.height !== one.height)
      faults.push(`docs/images/${one.file} is ${size.width}×${size.height}; it is ${one.width}×${one.height}.`);
    if (bytes.length > one.budget)
      faults.push(
        `docs/images/${one.file} is ${Math.round(bytes.length / 1024)} KB; the budget for it is ${one.budget / 1024} KB.`,
      );
  }
  faults.push(...readmeThumbnailFaults(readFileSync(join(where.repositoryRoot, "README.md"), "utf8"), pkg));
  const sources = siteSources(where.root).map((path) => readFileSync(path, "utf8"));
  const card = thumbnailAddresses(pkg).card;
  if (
    !sources.some((text) => text.includes("thumbnailHead(") || text.includes(`property="og:image" content="${card}"`))
  )
    faults.push(
      `The demo's <head> has no og:image: put thumbnailHead(pkg) in it (scripts/site.*), or write the tags into its HTML.`,
    );
  if (!sources.some((text) => text.includes("publishThumbnails(")))
    faults.push(
      "The site build does not publish the thumbnails beside the demo: call publishThumbnails(root, siteDir) in scripts/site.*.",
    );
  return faults;
}

/**
 * Copy the three pictures into the built site, where Pages serves them at <site>/thumbnail.png and so on. One that is not
 * made yet is named and left out, so that the first retake (which builds the site before it takes any picture) can run;
 * the family-thumbnail test fails until all three are there.
 */
export function publishThumbnails(root, siteDir) {
  const where = folders(root);
  mkdirSync(siteDir, { recursive: true });
  for (const file of THUMBNAIL_FILES) {
    const from = join(where.images, file);
    if (existsSync(from)) copyFileSync(from, join(siteDir, file));
    else console.warn(`publishThumbnails: docs/images/${file} is not made yet; retake the pictures`);
  }
}

/**
 * The drawing alone, as a PNG with a transparent ground: every ancestor of the element is made transparent, everything
 * beside it is hidden, and the element is taken with no page background, with `margin` CSS pixels around it so that a shadow is not cut off (the
 * margins are trimmed again where nothing is drawn). `clear` makes the element's own background transparent too.
 * `page` is a Playwright page; nothing here imports Playwright.
 */
export async function captureDrawing(page, selector, { clear = false, margin = 32 } = {}) {
  const target = page.locator(selector).first();
  await target.waitFor();
  await target.scrollIntoViewIfNeeded();
  await target.evaluate((element, clearOwn) => {
    // Nothing but the drawing shows: the ancestors keep their layout and lose their grounds, shadows and decorations,
    // and everything beside the drawing at every level is hidden (it keeps its room, so nothing moves).
    for (let node = element; node.parentElement; node = node.parentElement) {
      const parent = node.parentElement;
      parent.style.setProperty("background", "transparent", "important");
      parent.style.setProperty("box-shadow", "none", "important");
      parent.setAttribute("data-thumbnail-ancestor", "");
      for (const sibling of parent.children)
        if (sibling !== node && !["STYLE", "SCRIPT", "LINK"].includes(sibling.tagName))
          sibling.style.setProperty("visibility", "hidden", "important");
    }
    const style = document.createElement("style");
    style.textContent =
      "[data-thumbnail-ancestor]::before, [data-thumbnail-ancestor]::after { visibility: hidden !important; }";
    document.head.append(style);
    if (clearOwn) element.style.setProperty("background", "transparent", "important");
  }, clear);
  const box = await target.boundingBox();
  const x = Math.max(0, box.x - margin);
  const y = Math.max(0, box.y - margin);
  return page.screenshot({
    omitBackground: true,
    animations: "disabled",
    clip: { x, y, width: box.x + box.width + margin - x, height: box.y + box.height + margin - y },
  });
}

/**
 * Lay a drawing on a ground of a given size, in the browser's own canvas (no tool beyond the browser): transparent
 * margins are trimmed, the drawing is fitted inside the padding and centred, and the small name, if any, sits at the
 * bottom left. Returns PNG bytes.
 */
export async function composeOne(page, drawing, { width, height, scheme, label = "", pad = 56, grow = 1.5 }) {
  const { ground, ink } = GROUNDS[scheme];
  const encoded = await page.evaluate(
    async ({ base64, width, height, ground, ink, label, pad, grow }) => {
      const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
      const probe = new OffscreenCanvas(bitmap.width, bitmap.height);
      const probing = probe.getContext("2d");
      probing.drawImage(bitmap, 0, 0);
      const { data } = probing.getImageData(0, 0, bitmap.width, bitmap.height);
      let left = bitmap.width;
      let top = bitmap.height;
      let right = -1;
      let bottom = -1;
      for (let y = 0; y < bitmap.height; y += 1) {
        for (let x = 0; x < bitmap.width; x += 1) {
          if (data[(y * bitmap.width + x) * 4 + 3] > 8) {
            if (x < left) left = x;
            if (x > right) right = x;
            if (y < top) top = y;
            if (y > bottom) bottom = y;
          }
        }
      }
      if (right < 0) {
        left = 0;
        top = 0;
        right = bitmap.width - 1;
        bottom = bitmap.height - 1;
      }
      const cropWidth = right - left + 1;
      const cropHeight = bottom - top + 1;
      const labelSize = label ? Math.round(height / 28) : 0;
      const areaWidth = width - pad * 2;
      const areaHeight = height - pad * 2 - (label ? labelSize * 1.6 : 0);
      const scale = Math.min(areaWidth / cropWidth, areaHeight / cropHeight, grow);
      const drawWidth = cropWidth * scale;
      const drawHeight = cropHeight * scale;
      const canvas = new OffscreenCanvas(width, height);
      const context = canvas.getContext("2d");
      context.fillStyle = ground;
      context.fillRect(0, 0, width, height);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(
        bitmap,
        left,
        top,
        cropWidth,
        cropHeight,
        (width - drawWidth) / 2,
        pad + (areaHeight - drawHeight) / 2,
        drawWidth,
        drawHeight,
      );
      if (label) {
        context.fillStyle = ink;
        context.font = `600 ${labelSize}px system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif`;
        context.textBaseline = "alphabetic";
        context.fillText(label, pad, height - pad * 0.75);
      }
      const blob = await canvas.convertToBlob({ type: "image/png" });
      const reader = new FileReader();
      const done = new Promise((finish) => {
        reader.onloadend = () => finish(String(reader.result).split(",")[1]);
      });
      reader.readAsDataURL(blob);
      return done;
    },
    { base64: Buffer.from(drawing).toString("base64"), width, height, ground, ink, label, pad, grow },
  );
  return Buffer.from(encoded, "base64");
}

/**
 * Write the three pictures to docs/images from the drawings taken in each scheme: `light` and `dark` for the cards,
 * `icon` (a tighter drawing, light) for the icon, `light` when it is not given. `label` is the small name on the cards
 * (the package's name; none on the icon). Returns [{ file, bytes }].
 */
export async function composeThumbnails({
  page,
  root = ".",
  light,
  dark,
  icon = light,
  label = "",
  pad,
  iconPad = 28,
  grow,
}) {
  const where = folders(root);
  mkdirSync(where.images, { recursive: true });
  const written = [];
  for (const one of THUMBNAILS) {
    const isIcon = one.file === "icon.png";
    const drawing = isIcon ? icon : one.scheme === "dark" ? dark : light;
    const png = await composeOne(page, drawing, {
      width: one.width,
      height: one.height,
      scheme: one.scheme,
      label: isIcon ? "" : label,
      pad: isIcon ? iconPad : pad,
      grow: isIcon ? 4 : grow,
    });
    writeFileSync(join(where.images, one.file), png);
    written.push({ file: one.file, bytes: png.length });
  }
  return written;
}
