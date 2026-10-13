---
title: 住所を比較して整える
section: how-to
order: 7
description: 正規化した類似度と、配達先の同一性を区別します。
---

## 比較の詳細を調べる

```ts
import { parseLocation,compareAddresses,isSameAddress,cleanAddressDetailed } from "@johnmorrisdotca/address-plus";
const first=parseLocation("123 Main Street, New York, NY 10001");
const second=parseLocation("123 Main St, New York, NY 10001");
if(!first||!second) throw new Error("This example did not parse.");
console.log(isSameAddress(first,second),compareAddresses(first,second).similarity.differences);
console.log(cleanAddressDetailed("742 evergreen terrace,springfield , il 62704").cleanedAddress);
```

比較の設定は、正規化、句読点、曖昧な一致を決めます。記録をまとめるときは違いを読み、類似度を登録された同一の配達先の証明にしません。通りの名前だけでなく、部屋や郵便の地域を保ちます。国ごとの項目には、その国の比較を使います。

## 元の文章を保つ

整える処理は、正規化した表記と標準の詳細を返します。確認や修正が必要な作業では、入力した文章を保ちます。解析に失敗したら、私的な住所を推測した結果で上書きしません。元の[移行の説明](../../MIGRATING_FROM_PARSE_ADDRESS.md)で parse-address との互換性を読めます。
