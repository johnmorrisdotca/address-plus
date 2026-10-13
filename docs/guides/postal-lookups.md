---
title: Look up postal regions
section: how-to
order: 4
description: Distinguish syntax, known data and region membership.
---

## Read known regions

```ts
import { getStateFromZip,getProvinceFromPostalCode } from "@johnmorrisdotca/address-plus";
import { getPrefectureFromJapanesePostalCode } from "@johnmorrisdotca/address-plus/jp";
import { getStatesForAustralianPostcode } from "@johnmorrisdotca/address-plus/au";
console.log(getStateFromZip("98101"),getProvinceFromPostalCode("M5H 2N2"),getPrefectureFromJapanesePostalCode("530-0001"));
console.log(getStatesForAustralianPostcode("2618"));
```

A code may be syntactically valid, present in stored data, associated with more than one region, or unknown to the table. Use plural lookups where the native data represents cross-border delivery. Do not replace an ambiguous or absent result with a guessed region. Postal-prefix tables are a lookup aid rather than a list of every delivery point.

## Inspect a country postcode

```ts
import { parseUKPostcode } from "@johnmorrisdotca/address-plus/gb";
import { parseGermanPostcode } from "@johnmorrisdotca/address-plus/de";
import { parseFrenchPostcode } from "@johnmorrisdotca/address-plus/fr";
console.log(parseUKPostcode("ec1a1bb"),parseGermanPostcode("10115"),parseFrenchPostcode("75002"));
```

Normalization and known-data checks remain country-specific. Preserve leading zeros in strings; a postal code is not a number. The original [postal reference](../../README.md#zip-code--postal-code-handling) includes format standards, validation fields and lookup tables. Public reference pages state each function’s exact null/undefined behavior.
