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
import { netherlands } from "@johnmorrisdotca/address-plus/nl";
import { spain } from "@johnmorrisdotca/address-plus/es";
import { italy } from "@johnmorrisdotca/address-plus/it";
import { newZealand } from "@johnmorrisdotca/address-plus/nz";
import { india } from "@johnmorrisdotca/address-plus/in";
import { southKorea } from "@johnmorrisdotca/address-plus/kr";
import { brazil } from "@johnmorrisdotca/address-plus/br";
const countries=[australia,unitedKingdom,france,germany,netherlands,spain,italy,newZealand,india,southKorea,brazil];
console.log(parseLocation("3/12 Smith St, Parramatta NSW 2150",{countries,country:"AU"})?.secUnitNum);
console.log(parseLocation("10 Downing St, London SW1A 2AA",{countries,country:"GB"})?.nation);
console.log(parseLocation("12 bis rue de la Paix, 75002 Paris",{countries,country:"FR"})?.numberExtension);
console.log(parseLocation("Hauptstraße 12a, 10115 Berlin",{countries,country:"DE"})?.number);
console.log(parseLocation("Keizersgracht 123A, 1015 CJ Amsterdam",{countries,country:"NL"})?.numberExtension);
console.log(parseLocation("Calle de Alcalá, 42, 28014 Madrid",{countries,country:"ES"})?.state);
console.log(parseLocation("Via del Corso, 12/A, 00186 Roma",{countries,country:"IT"})?.state);
console.log(parseLocation("3/45 Dominion Road, Auckland 1024",{countries,country:"NZ"})?.state);
console.log(parseLocation("12 MG Road, Bengaluru, Karnataka 560038",{countries,country:"IN"})?.state);
console.log(parseLocation("서울특별시 중구 세종대로 110",{countries,country:"KR"})?.number);
console.log(parseLocation("Rua Augusta, 100, São Paulo - SP, 01305-000",{countries,country:"BR"})?.state);
```

AU, GB, FR, DE, NL, ES, IT, NZ, IN, KR and BR are opt-in modules. The root never imports them automatically; individual country bundles exclude the other country tables. Each module supplies native parsing, validation, formatting, comparison and known postal data. NL, ES, IT, NZ, IN and KR read their postcodes from a list of their own (the Netherlands' from CBS, the others from GeoNames, both CC BY 4.0, credited in `NOTICE.md`); a postcode the list does not have is a warning, never proof that it does not exist. BR has no list: its CEP is told to a state by a range. French overseas choices and British Crown dependencies retain their documented country codes; do not collapse them into a guessed main-country code.

## Keep Japanese input local

```ts
import { parseJapaneseAddress } from "@johnmorrisdotca/address-plus/jp";
console.log(parseJapaneseAddress("〒100-0005 東京都千代田区丸の内1丁目2番3号")?.municipalityCode);
```

Japanese parsing uses the retained prefecture, municipality and postal tables. Normalization accepts full-width digits and documented Japanese/romaji forms. The original [country-module design](../COUNTRIES.md), [Japanese README detail](../../README.md#japanese-addresses) and [country recipes](../../README.md#australian-french-german-and-british-addresses) are preserved.
