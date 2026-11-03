---
title: TypeScript と Node
section: how-to
order: 16
description: パッケージの型を使います。DOM のないサーバーでも、住所を解析して検証できます。
---

パッケージは、エントリーポイントごとに自分の型を持っています。解析も検証も純粋なので、Node でも Deno でも Bun でもワーカーでもブラウザでも、同じ呼び出しは同じ答えを返します。このファイルは型を検査したあと、型を取り除いてくれる Node 22.18 以降でそのまま実行します。

```ts
import { parseLocation, validateAddress, type ParseOptions } from "@johnmorrisdotca/address-plus";

const address = "1600 Pennsylvania Ave NW, Washington, DC 20500";
const options: ParseOptions = { country: "US" };
console.log(parseLocation(address, options)?.state, validateAddress(address).isValid);

// @ts-expect-error "XX" is not a country the parser reads
const unknown: ParseOptions["country"] = "XX";
console.log(unknown);
```

`@ts-expect-error` は、`"XX"` がパーサーが読む国ではなく、コンパイラが断ることを示すためのものです。

## サーバーで

サーバーでも、ブラウザと同じように住所を解析して検証できます。DOM もネットワークも使いません。

```mjs
import { parseLocation, validateAddress } from "@johnmorrisdotca/address-plus";

// A server parses and checks the same way a browser does: no DOM, no network.
const address = "1600 Pennsylvania Ave NW, Washington, DC 20500";
console.log(parseLocation(address)?.state, validateAddress(address).isValid);
```

最初の住所は [はじめに](getting-started.md)、そのほかは [解析](parsing.md) を見てください。
