// family-readme.mjs: writes the README's "The family" block from the one list of the family in
// family-template.mjs, so that every package's README says the same thing and none of them is typed by hand.
// Copied unchanged into each repository (scripts/family-readme.mjs); a package never edits it.
//
//   node scripts/family-readme.mjs           rewrite the block in README.md
//   node scripts/family-readme.mjs --check   exit 1, and say so, when README.md's block is not the written one
//
// The block sits between two markers, under the README's own "The family" heading:
//
//   <!-- family:start (…) -->  …  <!-- family:end -->
//
// Which package is reading is package.json's name, so each README says "is one of nineteen" about itself.
import { readFileSync, writeFileSync } from "node:fs";
import { URL, fileURLToPath } from "node:url";
import process from "node:process";
import { FAMILY, FAMILY_GROUPS, FAMILY_PITCH, familyRepo, familySite } from "./family-template.mjs";

const OWNER = "johnmorrisdotca";
export const FAMILY_BLOCK_START = "<!-- family:start (made by scripts/family-readme.mjs from scripts/family-template.mjs; change those, not this) -->";
export const FAMILY_BLOCK_END = "<!-- family:end -->";

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "twenty-one", "twenty-two", "twenty-three", "twenty-four", "twenty-five", "twenty-six", "twenty-seven", "twenty-eight"];
const numberWord = (n) => {
  const word = NUMBER_WORDS[n];
  if (word === undefined) throw new Error(`family-readme.mjs has no word for ${n} packages: add it to NUMBER_WORDS`);
  return word;
};

/** The block for the package `id`: markers included, no trailing newline. */
export function familyReadmeBlock(id) {
  const own = FAMILY.find((one) => one.id === id);
  if (own === undefined) throw new Error(`${id} is not in the family`);
  const lines = FAMILY_GROUPS.flatMap((group) => [
    `**${group.en}**`,
    "",
    ...group.members.map((memberId) => {
      const one = FAMILY.find((entry) => entry.id === memberId);
      const pitch = FAMILY_PITCH[one.id];
      if (pitch === undefined) throw new Error(`${one.id} has no line in FAMILY_PITCH`);
      return `- [${one.name}](${familyRepo(one.id)}) (${one.kana}): ${pitch}. [Demo](${familySite(one.id)}).`;
    }),
    "",
  ]);
  const count = numberWord(FAMILY.length);
  return [
    FAMILY_BLOCK_START,
    `${own.name} is one of ${count} packages, each made for the same site, each at`,
    `[github.com/${OWNER}](https://github.com/${OWNER}) or [github.com/spxis](https://github.com/spxis). The code of every one is MIT.`,
    "",
    ...lines,
    "",
    `**This package is ${own.name}.** The demos of all ${count} share one header and footer, so each links the rest.`,
    FAMILY_BLOCK_END,
  ].join("\n");
}

/** The README text with the block between the markers replaced, or `null` when it has no markers. */
export function withFamilyBlock(readme, id) {
  const start = readme.indexOf("<!-- family:start");
  const end = readme.indexOf(FAMILY_BLOCK_END);
  if (start < 0 || end < start) return null;
  return readme.slice(0, start) + familyReadmeBlock(id) + readme.slice(end + FAMILY_BLOCK_END.length);
}

/** The block as a README holds it now, markers included, or `null`. */
export function familyBlockOf(readme) {
  const start = readme.indexOf("<!-- family:start");
  const end = readme.indexOf(FAMILY_BLOCK_END);
  return start < 0 || end < start ? null : readme.slice(start, end + FAMILY_BLOCK_END.length);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const readmeUrl = new URL("../README.md", import.meta.url);
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const id = pkg.name === "rest-in-pieces-workspace" ? "rest-in-pieces" : pkg.name.replace(/^@[^/]+\//, "");
  const readme = readFileSync(readmeUrl, "utf8");
  const next = withFamilyBlock(readme, id);
  if (next === null) {
    console.error(`README.md has no ${FAMILY_BLOCK_START.slice(0, 18)} … ${FAMILY_BLOCK_END} markers under "The family"`);
    process.exit(1);
  }
  if (process.argv.includes("--check")) {
    if (next !== readme) {
      console.error("README.md's family block is not the one scripts/family-readme.mjs writes: run `pnpm family:readme`");
      process.exit(1);
    }
  } else if (next !== readme) {
    writeFileSync(readmeUrl, next);
    console.log("README.md: the family block is rewritten.");
  }
}
