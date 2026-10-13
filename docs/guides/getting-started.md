---
title: Getting started
section: tutorial
order: 1
description: Parse locally and inspect a nullable result.
---

## Parse a small address

```ts
import { parseLocation } from "@johnmorrisdotca/address-plus";
const address=parseLocation("123 Main St, New York, NY 10001");
if(!address) throw new Error("This example did not parse.");
console.log(address.number,address.street,address.state,address.zip);
```

The root entry parses US, Canadian and Japanese input. Its result is structured data or null; parsing alone is not validation or a delivery guarantee. Install the package, import a function and keep your own input alongside the result if you need to show a correction. Core calls do not send the address to a service.

## Add the next operation

```ts
import { validateAddress } from "@johnmorrisdotca/address-plus";
const checked=validateAddress("123 Main St, Seattle, NY 98101");
console.log(checked.isValid,checked.warnings.map(finding=>finding.code));
```

A known postal-region mismatch can be a warning while the shape remains valid. Continue with [validation](validation.md), [formatting](formatting.md), [country modules](country-modules.md) or [a form field](form-field-and-embeds.md). The original eight entry points and default parser object remain available.
