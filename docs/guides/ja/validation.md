---
title: 確認の結果を使う
section: how-to
order: 5
description: エラーと警告を示し、配達の保証とは区別します。
---

## 必須の項目を選ぶ

```ts
import { validateAddress } from "@johnmorrisdotca/address-plus";
const result=validateAddress("123 Main St",{requirePostalCode:true});
console.log(result.isValid,result.errors.map(finding=>finding.code),result.warnings.length);
```

フォームや取り込みの目的に合わせ、標準の必須項目を使います。エラーは有効性に関係し、警告は不一致の可能性を示しますが、必ず無効になるとは限りません。元の入力と結果のコードを保ち、示した項目を修正できるようにします。郵便番号と地域の確認は、人、建物、配達先の存在の確認ではありません。

## 国の解析結果を確認する

```ts
import { parseFrenchAddress,validateFrenchAddress } from "@johnmorrisdotca/address-plus/fr";
const address=parseFrenchAddress("12 bis rue de la Paix, 75002 Paris");
if(!address) throw new Error("This example did not parse.");
console.log(validateFrenchAddress(address).errors.length===0);
```

国ごとの確認には、その標準の解析結果を渡します。解析の null を確かめてから次に渡します。`validateAddress` は主な入口の入力と設定を受けますが、国の確認も同じ引数とは限りません。入力欄の `options.validation` は標準の設定をすべて使え、公開のイベントは状態と件数を伝えます。[入力欄の扱い](form-field-and-embeds.md)を読めます。
