---
title: Parse lists and save results
section: how-to
order: 8
description: Keep result order, failed rows and local export formats.
---

## Keep failures in a batch

```ts
import { parseLocationsBatch,parseLocations } from "@johnmorrisdotca/address-plus";
const inputs=["123 Main St, New York, NY 10001", ""];
const batch=parseLocationsBatch(inputs);
console.log(batch.results.length,batch.results[1],batch.errors[0].index,batch.stats.total);
console.log(parseLocations(inputs).length);
```

Batch results keep input order and null for a failed parse, with indexed errors and performance statistics. `stopOnError` changes how much input is processed; preserve the index rather than aligning filtered success rows with the original list. Timing values are measurements of this run and will vary.

## Use the demo’s downloads

The bulk panel combines all seven built-in countries and saves CSV, JSON, text, Markdown and SQL locally. SQL keeps absent values as NULL and numeric-looking postal strings as text; Markdown escapes pipes/backslashes and preserves line breaks. The shared writers and native browser tests retain SQLite execution and round-trip checks. PostgreSQL/MySQL syntax notes remain in the [download reference](../list-downloads.md); MySQL needs the stated SQL mode.

Bulk input remains in the page until you choose to copy or save it. The main tool’s Copy link intentionally encodes panel input; share that link only when you intend to share its text. Builder/embed setup URLs follow a separate rule and omit entered addresses, as described in [the field guide](form-field-and-embeds.md).
