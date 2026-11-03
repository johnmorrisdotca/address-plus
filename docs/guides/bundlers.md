---
title: Vite and webpack
section: how-to
order: 14
description: Install the package and import the address field element in a Vite or webpack project.
---

Install it.

```sh
npm install @johnmorrisdotca/address-plus
# or: pnpm add @johnmorrisdotca/address-plus
# or: yarn add @johnmorrisdotca/address-plus
```

Everything is an ES module with its own entry point, so a bundler keeps only what you import: `@johnmorrisdotca/address-plus` (the parser, validator and formatter for the US, Canada and Japan), a module for each other country (`/au`, `/de`, `/fr`, `/gb`, `/jp`), `/element` and `/element/define`, which registers `<address-field>` once.

## Vite

The page.

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

The script. Vite builds this entry with no configuration.

```ts no-run
import "@johnmorrisdotca/address-plus/element/define";

const field = document.querySelector("address-field")!;
field.addEventListener("address-plus-change", (event) => console.log((event as CustomEvent<{ valid: boolean }>).detail.valid));
```

## webpack

The entry.

```js no-run
import "@johnmorrisdotca/address-plus/element/define";

const field = document.createElement("address-field");
field.setAttribute("country", "US");
field.setAttribute("label", "Shipping address");
field.setAttribute("value", "1600 Pennsylvania Ave NW, Washington, DC 20500");
field.setAttribute("validate", "");
document.body.append(field);
```

`webpack.config.mjs`. webpack 5 needs nothing special for a package with `exports`.

```mjs no-run
import { fileURLToPath } from "node:url";

export default {
  mode: "production",
  entry: "./src/index.js",
  output: { path: fileURLToPath(new URL("./dist", import.meta.url)), filename: "main.js" },
};
```

Run `npx webpack` and load the `dist/main.js` it makes from a page.

## Other tools

Anything that reads `exports` in `package.json` works the same way: Rollup, esbuild, Parcel, Bun, Deno (`npm:@johnmorrisdotca/address-plus/element/define`). The only entry with a side effect is `element/define`, which `package.json` says in `sideEffects`.
