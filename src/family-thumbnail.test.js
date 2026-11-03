// The family's thumbnails (johnmorrisdotca/.github, family/family-thumbnail.mjs): this package has its card, its dark
// card and its icon at their sizes, its README opens with the card, and its demo carries og:image and publishes the
// three on Pages. The same file in every package that tests with Vitest (family-thumbnail.test.ts for node:test).
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  FAMILY_THUMBNAIL_VERSION,
  pngSize,
  thumbnailFaults,
  thumbnailHead,
  thumbnailReadmeBlock,
} from "../scripts/family-thumbnail.mjs";

const sha = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
/** The hash of scripts/family-thumbnail.mjs, recorded each time the family changes it. */
const HASH = "36ef086cc2a0144e3b0d7aa26177d1de085e4d8791f283a89a18e2cee5fb3613";

/** The bytes of a PNG header saying a size: enough for pngSize, not a picture. */
const header = (width, height) => {
  const bytes = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes, 0);
  bytes.write("IHDR", 12, "ascii");
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
};

/** A package folder with what a test names: pictures of given sizes, a README, a site builder. */
const sample = ({
  sizes = { "thumbnail.png": [1200, 630], "thumbnail-dark.png": [1200, 630], "icon.png": [512, 512] },
  readme,
  site = "thumbnailHead(pkg); publishThumbnails(root, out);",
} = {}) => {
  const root = mkdtempSync(join(tmpdir(), "thumbnail-"));
  const pkg = {
    name: "@johnmorrisdotca/sample",
    description: "Samples drawn as SVG.",
    repository: { url: "git+https://github.com/johnmorrisdotca/sample.git" },
  };
  writeFileSync(join(root, "package.json"), JSON.stringify(pkg));
  mkdirSync(join(root, "docs", "images"), { recursive: true });
  for (const [file, [width, height]] of Object.entries(sizes))
    writeFileSync(join(root, "docs", "images", file), header(width, height));
  writeFileSync(join(root, "README.md"), readme ?? `${thumbnailReadmeBlock(pkg)}\n\n# Sample\n`);
  mkdirSync(join(root, "scripts"));
  writeFileSync(join(root, "scripts", "site.mjs"), site);
  return root;
};

describe("this package's thumbnails", () => {
  it("keeps the family's thumbnail file", () => {
    expect(FAMILY_THUMBNAIL_VERSION).toBe("2026-11-03");
    expect(sha("scripts/family-thumbnail.mjs")).toBe(HASH);
  });

  it("has the card, the dark card and the icon, a README that opens with the card, and a demo that carries and publishes them", () => {
    expect(thumbnailFaults(".")).toEqual([]);
  });
});

describe("the thumbnail checks catch what they are for", () => {
  it("passes a package that keeps the convention", () => {
    expect(thumbnailFaults(sample())).toEqual([]);
  });

  it("refuses a missing picture and one of the wrong size", () => {
    const faults = thumbnailFaults(sample({ sizes: { "thumbnail.png": [1280, 640], "icon.png": [512, 512] } })).join(
      "\n",
    );
    expect(faults).toMatch(/thumbnail\.png is 1280×640; it is 1200×630/);
    expect(faults).toMatch(/thumbnail-dark\.png does not exist/);
  });

  it("refuses a demo with no og:image and a site build that does not publish the pictures", () => {
    const faults = thumbnailFaults(sample({ site: "// nothing" })).join("\n");
    expect(faults).toMatch(/no og:image/);
    expect(faults).toMatch(/does not publish the thumbnails/);
  });

  it("refuses a README that does not open with the card", () => {
    expect(thumbnailFaults(sample({ readme: "# Sample\n" })).join("\n")).toMatch(/does not open with its thumbnail/);
  });

  it("reads a PNG's size and writes the head's tags at the Pages address", () => {
    expect(pngSize(header(1200, 630))).toEqual({ width: 1200, height: 630 });
    expect(pngSize(Buffer.from("not a png at all, not at all"))).toBeNull();
    const head = thumbnailHead({ name: "@johnmorrisdotca/sample", repository: "https://github.com/spxis/sample" });
    expect(head).toContain('<meta property="og:image" content="https://spxis.github.io/sample/thumbnail.png" />');
    expect(head).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(head).toContain('<meta name="twitter:image" content="https://spxis.github.io/sample/thumbnail.png" />');
  });
});
