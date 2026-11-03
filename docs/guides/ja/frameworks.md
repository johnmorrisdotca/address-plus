---
title: React・Vue・Svelte・Angular で使う
section: how-to
order: 15
description: React、Vue、Svelte、Angular で住所の入力欄の要素を使います。サーバーでの描画でも動く import の仕方も説明します。
---

`<address-field>` は Web コンポーネントなので、どのフレームワークでも使えます。共通のことが2つあります。

1. **タグを登録するエントリー** (`@johnmorrisdotca/address-plus/element/define`) を import します。サーバーで import しても何も登録しないので安全です。入力欄はブラウザで描かれます。
2. **フレームワークにそのタグがあることを伝えます。** React は型、Vue はコンパイラーのオプション、Angular はスキーマが要ります。Svelte は何も要りません。

## React

`ShippingAddress.tsx` です。React 19 は属性をそのままカスタム要素に渡します。

```tsx
import "@johnmorrisdotca/address-plus/element/define";

export function ShippingAddress({ country = "US" }: { country?: string }) {
  return <address-field country={country} label="Shipping address" value="1600 Pennsylvania Ave NW, Washington, DC 20500" validate />;
}
```

TypeScript では、React にそのタグがあることを教えます (`address-field.d.ts` のようなファイル)。

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

いつもどおりにマウントします。コンポーネントはサーバーでも文字列に描画できます (`renderToString`)。パッケージのテストで確かめています。タグは出力され、入力欄はブラウザで描かれます。

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

Vue のコンパイラーに、`address-field` のタグはカスタム要素だと伝えます (`main.ts`)。

```ts no-check
import { createApp } from "vue";
import ShippingAddress from "./ShippingAddress.vue";

const app = createApp(ShippingAddress);
app.config.compilerOptions.isCustomElement = (tag) => tag === "address-field";
app.mount("#app");
```

Vite では、同じオプションを `vue({ template: { compilerOptions: { isCustomElement: (tag) => tag === "address-field" } } })` に書きます。

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

スタンドアロンで、テンプレートに未知のタグを書けるよう `CUSTOM_ELEMENTS_SCHEMA` を付けます。要素は属性を読むので、属性は `[attr.country]` で結びます。

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

どれも先にサーバーで描画しますが、上の import はサーバーでも安全なので、コンポーネントはそのまま動きます。Next.js の App Router では、コンポーネントのファイルの先頭に `"use client"` を書きます。
