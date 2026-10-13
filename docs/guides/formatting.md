---
title: Format native postal lines
section: how-to
order: 6
description: Use country-specific formats after a successful parse.
---

## Format two postal layouts

```ts
import { parseLocation,formatUSPS,formatCanadaPost } from "@johnmorrisdotca/address-plus";
const us=parseLocation("123 Main St Apt 4, New York, NY 10001");
const ca=parseLocation("100 Queen St W, Toronto, ON M5H 2N2");
if(!us||!ca) throw new Error("This example did not parse.");
console.log(formatUSPS(us).lines,formatCanadaPost(ca).lines);
```

Formatters return structured lines and a single-line representation. Choose the native postal formatter rather than inventing one punctuation rule for every country. Options decide delivery/last lines, upper case or country lines where documented. Preserve unit, building, floor and country-specific number-extension fields through parsing.

## Write Japanese markers

```ts
import { parseJapaneseAddress,formatJapanese,formatJapaneseEnglish } from "@johnmorrisdotca/address-plus/jp";
const address=parseJapaneseAddress("〒100-0005 東京都千代田区丸の内1-2-3");
if(!address) throw new Error("This example did not parse.");
console.log(formatJapanese(address,{blockStyle:"markers",multiline:false}),formatJapaneseEnglish(address,{includeCountry:false}));
```

Japanese and Japanese-English formatting are separate choices. Formatting a parsed address does not repair an unknown municipality or prove delivery. The original [format standards](../../README.md#format-standards) and [Japanese formatting](../../README.md#formatting) remain available.
