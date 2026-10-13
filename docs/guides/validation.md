---
title: Validate with findings
section: how-to
order: 5
description: Keep errors and warnings visible without promising delivery.
---

## Choose required fields

```ts
import { validateAddress } from "@johnmorrisdotca/address-plus";
const result=validateAddress("123 Main St",{requirePostalCode:true});
console.log(result.isValid,result.errors.map(finding=>finding.code),result.warnings.length);
```

Use the native validation requirements for your form or import job. Errors affect validity; warnings identify possible inconsistencies without necessarily making the address invalid. Keep finding codes alongside the original input so a user can correct the indicated field. A postal/region check does not confirm that a person, building or delivery point exists.

## Validate country-parsed data

```ts
import { parseFrenchAddress,validateFrenchAddress } from "@johnmorrisdotca/address-plus/fr";
const address=parseFrenchAddress("12 bis rue de la Paix, 75002 Paris");
if(!address) throw new Error("This example did not parse.");
console.log(validateFrenchAddress(address).errors.length===0);
```

Country validators take their native parsed shape. Narrow a nullable parser result before passing it on. `validateAddress` accepts the documented root input and options; do not assume the country-specific validator has the same argument shape. For fields, `options.validation` retains every native validation option while public events report status/counts. See [field privacy](form-field-and-embeds.md).
