---
title: Compare and clean addresses
section: how-to
order: 7
description: Separate normalized similarity from delivery identity.
---

## Inspect comparison details

```ts
import { parseLocation,compareAddresses,isSameAddress,cleanAddressDetailed } from "@johnmorrisdotca/address-plus";
const first=parseLocation("123 Main Street, New York, NY 10001");
const second=parseLocation("123 Main St, New York, NY 10001");
if(!first||!second) throw new Error("This example did not parse.");
console.log(isSameAddress(first,second),compareAddresses(first,second).similarity.differences);
console.log(cleanAddressDetailed("742 evergreen terrace,springfield , il 62704").cleanedAddress);
```

Comparison options govern normalization, punctuation and fuzzy matching. Inspect differences when deciding whether to combine records; a similarity score is not a registry-backed identity. Keep apartment/unit and postal-region fields rather than matching only a street label. Use country comparison helpers for country-specific fields.

## Retain original text

Cleaning provides a normalized rendering and native details. Preserve the submitted text when your workflow needs audit or correction. Do not overwrite private addresses with a guessed result after a parse failure. The original [migration guide](../MIGRATING_FROM_PARSE_ADDRESS.md) describes compatibility with parse-address.
