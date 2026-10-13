---
title: 郵便番号の地域を調べる
section: how-to
order: 4
description: 形式、収録データ、地域との対応を区別します。
---

## 収録された地域を読む

```ts
import { getStateFromZip,getProvinceFromPostalCode } from "@johnmorrisdotca/address-plus";
import { getPrefectureFromJapanesePostalCode } from "@johnmorrisdotca/address-plus/jp";
import { getStatesForAustralianPostcode } from "@johnmorrisdotca/address-plus/au";
console.log(getStateFromZip("98101"),getProvinceFromPostalCode("M5H 2N2"),getPrefectureFromJapanesePostalCode("530-0001"));
console.log(getStatesForAustralianPostcode("2618"));
```

番号には、形式が有効、表に収録済み、複数の地域に対応、表では不明という違いがあります。境界を越える配達のデータには、複数の地域を返す検索を使います。曖昧な結果や値がない結果を、推測した地域で置き換えません。先頭の番号の表は検索の助けで、すべての配達先の一覧ではありません。

## 国の郵便番号を調べる

```ts
import { parseUKPostcode } from "@johnmorrisdotca/address-plus/gb";
import { parseGermanPostcode } from "@johnmorrisdotca/address-plus/de";
import { parseFrenchPostcode } from "@johnmorrisdotca/address-plus/fr";
console.log(parseUKPostcode("ec1a1bb"),parseGermanPostcode("10115"),parseFrenchPostcode("75002"));
```

正規化と収録データの確認は国ごとです。先頭の0を文字列として保ち、郵便番号を数値にしません。元の[郵便の説明](../../../README.md#zip-code--postal-code-handling)には形式、確認の項目、地域の検索があります。個別の API のページで、null と undefined の正確な意味を読めます。
