---
title: Vite と webpack
section: how-to
order: 14
description: パッケージをインストールし、Vite や webpack のプロジェクトで住所の入力欄の要素を import します。
---

インストールします。

```sh
npm install @johnmorrisdotca/address-plus
# or: pnpm add @johnmorrisdotca/address-plus
# or: yarn add @johnmorrisdotca/address-plus
```

どれも ES モジュールで、エントリーポイントごとに分かれているので、バンドラーは import したものだけを残します。`@johnmorrisdotca/address-plus` (米国・カナダ・日本のパーサー、検証、整形)、ほかの国ごとのモジュール (`/au`、`/de`、`/fr`、`/gb`、`/jp`)、`/element`、そして `<address-field>` を一度だけ登録する `/element/define` があります。

## Vite

ページです。

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>address-plus with Vite</title>
  </head>
  <body>
    <address-field country="US" label="Shipping address" value="1600 Pennsylvania Ave NW, Washington, DC 20500" validate></address-field>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
```

スクリプトです。Vite は設定なしでこのエントリーをビルドします。

```ts no-run
import "@johnmorrisdotca/address-plus/element/define";

const field = document.querySelector("address-field")!;
field.addEventListener("address-plus-change", (event) => console.log((event as CustomEvent<{ valid: boolean }>).detail.valid));
```

## webpack

エントリーです。

```js no-run
import "@johnmorrisdotca/address-plus/element/define";

const field = document.createElement("address-field");
field.setAttribute("country", "US");
field.setAttribute("label", "Shipping address");
field.setAttribute("value", "1600 Pennsylvania Ave NW, Washington, DC 20500");
field.setAttribute("validate", "");
document.body.append(field);
```

`webpack.config.mjs` です。`exports` を持つパッケージに、webpack 5 は特別な設定を要りません。

```mjs no-run
import { fileURLToPath } from "node:url";

export default {
  mode: "production",
  entry: "./src/index.js",
  output: { path: fileURLToPath(new URL("./dist", import.meta.url)), filename: "main.js" },
};
```

`npx webpack` を実行し、できた `dist/main.js` をページから読み込みます。

## ほかのツール

`package.json` の `exports` を読むツールなら同じように使えます。Rollup、esbuild、Parcel、Bun、Deno (`npm:@johnmorrisdotca/address-plus/element/define`) などです。副作用があるエントリーは `element/define` だけで、`package.json` の `sideEffects` にそう書いてあります。
