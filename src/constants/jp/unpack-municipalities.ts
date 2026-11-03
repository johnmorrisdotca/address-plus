// Reads the municipality table back from the packed text in municipalities.data.ts: one municipality to a line as
// code|name|kana|romaji, the prefecture being the first two digits of the code (scripts/jp/pack.ts writes it).

import type { JapaneseMunicipality } from "../../types/japan";

// The municipalities a packed text holds, in its order.
function unpackMunicipalities(packed: string): JapaneseMunicipality[] {
  const municipalities: JapaneseMunicipality[] = [];
  for (const row of packed.split("\n")) {
    if (row === "") continue;
    const [code, name, kana, romaji] = row.split("|");
    municipalities.push({ code, prefecture: code.slice(0, 2), name, kana, romaji });
  }

  return municipalities;
}

export { unpackMunicipalities };
