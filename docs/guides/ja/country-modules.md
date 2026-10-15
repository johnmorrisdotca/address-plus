---
title: 国のモジュールを加える
section: how-to
order: 3
description: 表示側で必要な国の表だけをimportします。
---

## 追加のモジュールを渡す

```ts
import { parseLocation } from "@johnmorrisdotca/address-plus";
import { australia } from "@johnmorrisdotca/address-plus/au";
import { unitedKingdom } from "@johnmorrisdotca/address-plus/gb";
import { france } from "@johnmorrisdotca/address-plus/fr";
import { germany } from "@johnmorrisdotca/address-plus/de";
const countries=[australia,unitedKingdom,france,germany];
console.log(parseLocation("3/12 Smith St, Parramatta NSW 2150",{countries,country:"AU"})?.secUnitNum);
console.log(parseLocation("10 Downing St, London SW1A 2AA",{countries,country:"GB"})?.nation);
console.log(parseLocation("12 bis rue de la Paix, 75002 Paris",{countries,country:"FR"})?.numberExtension);
console.log(parseLocation("Hauptstraße 12a, 10115 Berlin",{countries,country:"DE"})?.number);
```

AU、GB、FR、DEは必要なときに加えます。主な入口は自動では読み込まず、それぞれの国のビルドに別の国の表は入りません。各モジュールは、標準の解析、確認、書式、比較、郵便のデータを持ちます。フランスの海外地域や英国王室属領は元の国のコードを保ち、推測で主な国のコードにまとめません。

## 日本の入力を端末の中で扱う

```ts
import { parseJapaneseAddress } from "@johnmorrisdotca/address-plus/jp";
console.log(parseJapaneseAddress("〒100-0005 東京都千代田区丸の内1丁目2番3号")?.municipalityCode);
```

日本の解析には、元の都道府県、市区町村、郵便の表を使います。全角の数字と、説明した日本語・ローマ字の形を扱えます。元の[国の設計](../../COUNTRIES.md)、[日本の詳細](../../../README.md#japanese-addresses)、[国ごとの例](../../../README.md#australian-french-german-and-british-addresses)を保っています。
