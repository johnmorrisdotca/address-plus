---
title: 通常の HTML と CDN
section: how-to
order: 13
description: jsDelivr や unpkg の script タグ1つで、通常のページに住所の入力欄を載せます。
---

ビルドは要りません。`element/define` を読み込むと `<address-field>` のタグが登録されます。CDN の script タグで読み込めば、タグが、入力された住所を読み取る入力欄を自分で描きます。`validate` を付けると、住所が有効かどうかも表示します。パーサーも国ごとの表もパッケージのファイルに入っているので、ほかに読み込むものはありません。

## jsDelivr

jsDelivr はパッケージのファイルをそのまま配るので、アドレスはビルド済みのファイルです。

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>address-plus from jsDelivr</title>
    <script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/address-plus@1/dist/element-define.js"></script>
  </head>
  <body>
    <address-field country="US" label="Shipping address" value="1600 Pennsylvania Ave NW, Washington, DC 20500" validate></address-field>
  </body>
</html>
```

## unpkg

unpkg もパッケージのファイルをそのまま配ります。`?module` を付けると、ファイルの中の import をブラウザ用に書き換えてくれます。

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>address-plus from unpkg</title>
    <script type="module" src="https://unpkg.com/@johnmorrisdotca/address-plus@1/dist/element-define.js?module"></script>
  </head>
  <body>
    <address-field country="US" label="Shipping address" value="1600 Pennsylvania Ave NW, Washington, DC 20500" validate></address-field>
  </body>
</html>
```

## 注意

- `<script type="module">` を使います。普通の script では `import` できません。
- ページを変えたくないときは、アドレスにメジャーバージョンを書きます (`@johnmorrisdotca/address-plus@1`)。
- 属性は [標準のフォーム入力欄](form-field-and-embeds.md) にあります。何も表示されないときは、[困ったとき](troubleshooting.md) を見てください。
