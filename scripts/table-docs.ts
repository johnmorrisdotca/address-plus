import { readFileSync, writeFileSync } from "node:fs";

const TABLE_ENTRIES: Readonly<Record<string, string>> = {
  JP_MUNICIPALITIES: "jp",
  JP_POSTAL_EXCEPTIONS: "jp",
  JP_POSTAL_PREFIXES: "jp",
  JP_PREFECTURES: "jp",
  AU_CROSS_BORDER_POSTCODES: "au",
  AU_EXTERNAL_TERRITORY_POSTCODES: "au",
  AU_STATES: "au",
  GB_DISTRICT_NATIONS: "gb",
  GB_POSTCODE_DISTRICTS: "gb",
  GB_NATIONS: "gb",
  DE_STATES: "de",
  FR_COLLECTIVITIES: "fr",
  FR_DEPARTMENTS: "fr",
};
const EXAMPLE_FENCE = / \* ```ts\n([\s\S]*?)\n \* ```/g;
const COMMENT_PREFIX = /^ \* ?/;
const ANSWER_PREFIX = "// → ";

export function tableExampleLines(example: string): string[] {
  const names = Object.keys(TABLE_ENTRIES).filter((name) => example.includes(name));
  if (names.length === 0) return [example];
  const grouped = new Map<string, string[]>();
  for (const name of names) {
    const entry = TABLE_ENTRIES[name];
    const group = grouped.get(entry) ?? [];
    group.push(name);
    grouped.set(entry, group);
  }
  return [...grouped]
    .map(([entry, names]) => `import { ${names.join(", ")} } from "@johnmorrisdotca/address-plus/${entry}";`)
    .concat(["", `console.log(${example});`]);
}

export function refreshTableExamples(files: readonly string[]): void {
  let changed = 0;
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    const next = source.replace(EXAMPLE_FENCE, (fence: string, content: string) => {
      const lines = content.split("\n").map((line) => line.replace(COMMENT_PREFIX, ""));
      if (lines.some((line) => line.startsWith("import "))) return fence;
      const answer = lines.pop();
      if (!answer?.startsWith(ANSWER_PREFIX)) throw new Error(`No expected answer in ${file}`);
      return (
        " * ```ts\n" +
        tableExampleLines(lines.join("\n"))
          .concat([answer])
          .map((line) => ` *${line ? " " + line : ""}`)
          .join("\n") +
        "\n * ```"
      );
    });
    if (next !== source) {
      writeFileSync(file, next);
      changed++;
    }
  }
  console.log(`Refreshed examples in ${changed} stored table files; data and source metadata retained.`);
}
