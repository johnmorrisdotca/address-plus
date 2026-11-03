---
title: TypeScript and Node
section: how-to
order: 16
description: Use the package's types, and parse and check an address on a server with no DOM.
---

The package ships its own types, for each entry point. Parsing and validating are pure, so the same call gives the same answer in Node, Deno, Bun, a worker and a browser. This file type-checks, then runs under Node 22.18 or later, which strips the types.

```ts
import { parseLocation, validateAddress, type ParseOptions } from "@johnmorrisdotca/address-plus";

const address = "1600 Pennsylvania Ave NW, Washington, DC 20500";
const options: ParseOptions = { country: "US" };
console.log(parseLocation(address, options)?.state, validateAddress(address).isValid);

// @ts-expect-error "XX" is not a country the parser reads
const unknown: ParseOptions["country"] = "XX";
console.log(unknown);
```

`@ts-expect-error` is there to show that `"XX"` is not a country the parser reads; the compiler refuses it.

## On a server

A server parses and checks an address the same way a browser does: no DOM, no network.

```mjs
import { parseLocation, validateAddress } from "@johnmorrisdotca/address-plus";

// A server parses and checks the same way a browser does: no DOM, no network.
const address = "1600 Pennsylvania Ave NW, Washington, DC 20500";
console.log(parseLocation(address)?.state, validateAddress(address).isValid);
```

See [getting started](getting-started.md) for the first address and [parsing](parsing.md) for the rest.
