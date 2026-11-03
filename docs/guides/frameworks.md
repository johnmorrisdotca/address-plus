---
title: In React, Vue, Svelte and Angular
section: how-to
order: 15
description: Use the address field element in React, Vue, Svelte and Angular, with the import that keeps a server render working.
---

`<address-field>` is a web component, so every framework can use it. Two things apply everywhere:

1. **Import the entry that registers the tag** (`@johnmorrisdotca/address-plus/element/define`). It is safe to import on a server, where it registers nothing; the field is drawn in the browser.
2. **Tell the framework the tag exists.** React needs a type for it, Vue a compiler option, Angular a schema. Svelte needs nothing.

## React

`ShippingAddress.tsx`; React 19 passes attributes through to a custom element.

```tsx
import "@johnmorrisdotca/address-plus/element/define";

export function ShippingAddress({ country = "US" }: { country?: string }) {
  return <address-field country={country} label="Shipping address" value="1600 Pennsylvania Ave NW, Washington, DC 20500" validate />;
}
```

With TypeScript, tell React the tag exists (a file such as `address-field.d.ts`):

```ts no-run
import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "address-field": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { country?: string; label?: string; name?: string; value?: string; lang?: string; theme?: string; size?: string; required?: boolean; disabled?: boolean; readonly?: boolean; validate?: boolean };
    }
  }
}
```

Mount it as usual. The component renders to a string on a server (`renderToString`), as the package's tests check: the tag is there, the field is drawn in the browser.

```tsx
import { createRoot } from "react-dom/client";
import { ShippingAddress } from "./ShippingAddress";

createRoot(document.getElementById("root")!).render(<ShippingAddress />);
```

## Vue

```vue
<script setup lang="ts">
import "@johnmorrisdotca/address-plus/element/define";

withDefaults(defineProps<{ country?: string }>(), { country: "US" });
</script>

<template>
  <address-field :country="country" label="Shipping address" value="1600 Pennsylvania Ave NW, Washington, DC 20500" validate></address-field>
</template>
```

Tell Vue's compiler that `address-field` is a custom element, in `main.ts`:

```ts no-check
import { createApp } from "vue";
import ShippingAddress from "./ShippingAddress.vue";

const app = createApp(ShippingAddress);
app.config.compilerOptions.isCustomElement = (tag) => tag === "address-field";
app.mount("#app");
```

With Vite, the same option goes in `vue({ template: { compilerOptions: { isCustomElement: (tag) => tag === "address-field" } } })`.

## Svelte

```svelte
<script lang="ts">
  import "@johnmorrisdotca/address-plus/element/define";

  let { country = "US" }: { country?: string } = $props();
</script>

<address-field {country} label="Shipping address" value="1600 Pennsylvania Ave NW, Washington, DC 20500" validate></address-field>
```

```ts no-check
import { mount } from "svelte";
import ShippingAddress from "./ShippingAddress.svelte";

mount(ShippingAddress, { target: document.getElementById("app")! });
```

## Angular

Standalone, with `CUSTOM_ELEMENTS_SCHEMA` so the template may hold an unknown tag. Bind an attribute with `[attr.country]`, since the element reads attributes:

```ts no-check
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from "@angular/core";
import "@johnmorrisdotca/address-plus/element/define";

@Component({
  selector: "app-shipping-address",
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<address-field [attr.country]="country" label="Shipping address" value="1600 Pennsylvania Ave NW, Washington, DC 20500" validate></address-field>`,
})
export class ShippingAddressComponent {
  @Input() country = "US";
}
```

```ts no-check
import "@angular/compiler";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideZonelessChangeDetection } from "@angular/core";
import { ShippingAddressComponent } from "./shipping-address.component";

void bootstrapApplication(ShippingAddressComponent, { providers: [provideZonelessChangeDetection()] });
```

## Next.js, Nuxt, SvelteKit

They render on a server first, and the import above is safe there, so the components work unchanged. In Next.js's App Router the component file starts with `"use client"`.
