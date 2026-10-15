---
title: 解析の規則を選ぶ
section: how-to
order: 2
description: 国を選び、標準の項目名を保ちます。
---

## 目的に合う入口を使う

```ts
import parser,{ parseLocation,parseIntersection } from "@johnmorrisdotca/address-plus";
console.log(parser.parseLocation("100 Queen St W, Toronto, ON M5H 2N2")?.country);
console.log(parseLocation("東京都千代田区丸の内1-2-3",{country:"JP"})?.block);
console.log(parseIntersection("Hollywood Blvd and Vine St, Los Angeles, CA")?.street1);
```

番地の住所には住所の解析、交差点には交差点の解析を使います。施設名や括弧の設定は項目の読み方を変えますが、任意の文章を確認済みの配達先にはしません。主な入口の国の判定と、`countries`に渡す追加の国のモジュールを区別します。

## 動的なsnake-caseの項目を読む

```ts
import { parseLocation } from "@johnmorrisdotca/address-plus";
const result=parseLocation("東京都千代田区丸の内1-2-3",{country:"JP",useSnakeCase:true});
console.log(Reflect.get(result??{},"prefecture_code"));
```

既定はcamel-caseで、`ParsedAddress`の型が表します。`useSnakeCase`は実際の項目名を変えますが、元の型はsnake-caseに対応した別の型にはなりません。動的な項目を明確に読むか、型付きの表示側ではcamel-caseを保ちます。nullは指定した形で解析できなかった意味で、配達の検索に失敗した意味ではありません。元の[項目の表](../../../README.md#address-components)を読めます。
