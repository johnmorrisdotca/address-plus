---
title: 標準の郵便の行に整える
section: how-to
order: 6
description: 解析できた住所を、国の書式で整えます。
---

## 2つの郵便の書式を使う

```ts
import { parseLocation,formatUSPS,formatCanadaPost } from "@johnmorrisdotca/address-plus";
const us=parseLocation("123 Main St Apt 4, New York, NY 10001");
const ca=parseLocation("100 Queen St W, Toronto, ON M5H 2N2");
if(!us||!ca) throw new Error("This example did not parse.");
console.log(formatUSPS(us).lines,formatCanadaPost(ca).lines);
```

書式の結果には行と、1行の表現があります。すべての国を1つの句読点の規則にせず、標準の郵便の書式を選びます。設定は説明した範囲で、配達の行、最後の行、大文字、国の行を決めます。部屋、建物、階、国ごとの番地の追加の項目を解析から保ちます。

## 日本の番地の印を書く

```ts
import { parseJapaneseAddress,formatJapanese,formatJapaneseEnglish } from "@johnmorrisdotca/address-plus/jp";
const address=parseJapaneseAddress("〒100-0005 東京都千代田区丸の内1-2-3");
if(!address) throw new Error("This example did not parse.");
console.log(formatJapanese(address,{blockStyle:"markers",multiline:false}),formatJapaneseEnglish(address,{includeCountry:false}));
```

日本語と日本の住所の英語表記は、別の選択です。書式を整えても、不明な市区町村を修正したり配達を証明したりはしません。元の[書式の基準](../../../README.md#format-standards)と[日本の書式](../../../README.md#formatting)を読めます。
