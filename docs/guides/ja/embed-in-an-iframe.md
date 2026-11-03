---
title: iframe で住所の入力欄を埋め込む
section: how-to
order: 17
description: スクリプトを使えないページでも、デモの埋め込みページを iframe で載せて住所の入力欄を表示します。
---

スクリプトを使えないサイトでも、デモの埋め込みページを iframe で載せれば住所を入力してもらえます。自分でコードを書く必要はありません。アドレスで、国 (`country`。`auto` もあります)、ラベル (`label`)、フォームでの名前 (`name`)、言語 (`lang`)、テーマ (`theme`)、大きさ (`size`)、そしてオン・オフの `required`、`disabled`、`readonly`、`validate` を選びます。キーは `<address-field>` の属性名と同じです。

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>address-plus in an iframe</title>
  </head>
  <body>
    <iframe
      src="https://johnmorrisdotca.github.io/address-plus/embed/?country=US&label=Shipping%20address&validate"
      title="A US address field"
      width="420"
      height="120"
      loading="lazy"
      style="border: 0"
    ></iframe>
  </body>
</html>
```

このページは入力欄を1つ描くだけで、何も保存せず、ほかの場所から何も読み込みません。入力した住所は iframe の中にとどまります。まわりのページに届くのは、入力欄が変わったことと住所が有効かどうか (`address-plus-change`) だけで、住所そのものは届きません。[ビルダー](https://johnmorrisdotca.github.io/address-plus/builder.html) は、選んだ入力欄についてこの iframe とほかの形式のコードを書いてくれます。
