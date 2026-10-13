---
title: Choose parsing rules
section: how-to
order: 2
description: Select a country and preserve the native field names.
---

## Use the intended entry

```ts
import parser,{ parseLocation,parseIntersection } from "@johnmorrisdotca/address-plus";
console.log(parser.parseLocation("100 Queen St W, Toronto, ON M5H 2N2")?.country);
console.log(parseLocation("東京都千代田区丸の内1-2-3",{country:"JP"})?.block);
console.log(parseIntersection("Hollywood Blvd and Vine St, Los Angeles, CA")?.street1);
```

Use a street-address parser for a street address and the intersection parser for intersecting streets. Facility and parenthetical options affect how fields are interpreted; they do not make arbitrary text a known delivery location. The root’s country detection is separate from optional country modules supplied through `countries`.

## Read dynamic snake-case keys

```ts
import { parseLocation } from "@johnmorrisdotca/address-plus";
const result=parseLocation("東京都千代田区丸の内1-2-3",{country:"JP",useSnakeCase:true});
console.log(Reflect.get(result??{},"prefecture_code"));
```

Camel-case keys are the default and are represented by `ParsedAddress`. `useSnakeCase` changes the runtime key names; the existing static interface is not a mapped snake-case type. Read those dynamic keys explicitly or retain camel-case results for typed host code. Null means the input did not parse into the requested shape, not that a delivery lookup failed. [Original component tables](../../README.md#address-components) list the existing fields.
