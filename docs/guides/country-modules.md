---
title: Add country modules
section: how-to
order: 3
description: Import only the optional country tables your host needs.
---

## Supply optional modules

```ts
import { parseLocation } from "@johnmorrisdotca/address-plus";
import { australia } from "@johnmorrisdotca/address-plus/au";
import { unitedKingdom } from "@johnmorrisdotca/address-plus/gb";
import { france } from "@johnmorrisdotca/address-plus/fr";
import { germany } from "@johnmorrisdotca/address-plus/de";
const countries=[australia,unitedKingdom,france,germany];
console.log(parseLocation("3/12 Smith St, Parramatta NSW 2150",{countries,country:"AU"})?.secUnitNum);
console.log(parseLocation("10 Downing St, London SW1A 2AA",{countries,country:"GB"})?.nation);
console.log(parseLocation("12 bis rue de la Paix, 75002 Paris",{countries,country:"FR"})?.numberExtension);
console.log(parseLocation("Hauptstraße 12a, 10115 Berlin",{countries,country:"DE"})?.number);
```

AU, GB, FR and DE are opt-in modules. The root never imports them automatically; individual country bundles exclude the other country tables. Each module supplies native parsing, validation, formatting, comparison and known postal data. French overseas choices and British Crown dependencies retain their documented country codes; do not collapse them into a guessed main-country code.

## Keep Japanese input local

```ts
import { parseJapaneseAddress } from "@johnmorrisdotca/address-plus/jp";
console.log(parseJapaneseAddress("〒100-0005 東京都千代田区丸の内1丁目2番3号")?.municipalityCode);
```

Japanese parsing uses the retained prefecture, municipality and postal tables. Normalization accepts full-width digits and documented Japanese/romaji forms. The original [country-module design](../COUNTRIES.md), [Japanese README detail](../../README.md#japanese-addresses) and [country recipes](../../README.md#australian-french-german-and-british-addresses) are preserved.
