---
title: Use the native form field
section: how-to
order: 9
description: Keep native form behavior and private values out of setup messages.
---

## Mount inside your form

```ts no-run
import { defineField } from "@johnmorrisdotca/address-plus/element";
defineField();
const field=document.createElement("address-field");
field.setAttribute("name","shipping-address");
field.setAttribute("country","CA");
field.setAttribute("required","");
const form=document.createElement("form");
form.append(field);document.body.append(form);
console.log(form.querySelector("address-field")?.getAttribute("name"));
```

The raw value submits under `name`. Required/native validity, form reset and disabled fieldsets remain native; ElementInternals falls back to an ordinary input where unavailable. `readonly` retains the value; disabled does not submit. `validate=false` is explicit because checks are on by default. Size/width/theme/language changes preserve entered text and focus. The native input permits 4,000 characters.

## Use trusted local getters

```ts no-run
import { AddressField,defineField } from "@johnmorrisdotca/address-plus/element";
defineField();
const field=new AddressField();
field.country="CA";
field.options={validation:{requirePostalCode:true},onChange:current=>console.log(current.address?.country,current.validation?.isValid)};
field.value="100 Queen St W, Toronto, ON M5H 2N2";
document.body.append(field);
console.log(field.checkValidity());
```

Local `value`, `address`, `validation` and `options.onChange` provide trusted access. Public load/change/error events expose country/status/counts or fixed messages, not raw address fields. Builder code and setup URLs omit entered values. An iframe cannot submit into its parent’s form; use the element inside your form for submission. Check exact message origin and frame source when receiving iframe events. See the complete [native embed reference](../embeds.md) and builder for reflected attributes and React/Vue/Svelte/Angular/plain HTML examples.
