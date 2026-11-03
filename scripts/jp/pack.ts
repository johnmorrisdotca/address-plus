// The packed form of the municipality table, written to src/constants/jp/municipalities.data.ts and read back by
// src/constants/jp/unpack-municipalities.ts. One municipality to a line, fields split by "|":
//   code|name|kana|romaji
// The prefecture is the first two digits of the code (a JIS X 0402 code starts with its prefecture's code), so a row
// that breaks that is refused here rather than read wrongly later.

interface PackedMunicipality {
  code: string;
  prefecture: string;
  name: string;
  kana: string;
  romaji: string;
}

// Characters that are structure to the reader, or would end the template literal the text is written in.
const FORBIDDEN = /[|\n`\\$]/;

/** One municipality as a row of the packed text. */
const packMunicipality = (row: PackedMunicipality): string => {
  const fields = [row.code, row.name, row.kana, row.romaji];
  if (row.prefecture !== row.code.slice(0, 2)) {
    throw new Error(`Municipality ${row.code} is in prefecture ${row.prefecture}, which its code does not start with`);
  }
  if (fields.some((field) => FORBIDDEN.test(field))) {
    throw new Error(`Municipality ${JSON.stringify(row)} holds a separator or a template-literal character`);
  }

  return fields.join("|");
};

/** The packed text of the municipalities, in the order given, starting with a line break so the first row is a line. */
const packMunicipalities = (rows: readonly PackedMunicipality[]): string =>
  `\n${rows.map(packMunicipality).join("\n")}`;

export { packMunicipalities, packMunicipality };
export type { PackedMunicipality };
