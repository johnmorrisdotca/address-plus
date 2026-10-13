---
title: はじめに
section: tutorial
order: 1
description: 端末の中で解析し、結果がない場合も調べます。
---

## 小さい住所を解析する

```ts
import { parseLocation } from "@johnmorrisdotca/address-plus";
const address=parseLocation("123 Main St, New York, NY 10001");
if(!address) throw new Error("This example did not parse.");
console.log(address.number,address.street,address.state,address.zip);
```

主な入口は米国、カナダ、日本の入力を解析します。結果は構造化したデータか null です。解析だけでは確認や配達の保証になりません。パッケージをインストールし、関数を import します。修正を表示する場合は、結果と一緒に元の入力も保ちます。基本の呼び出しは住所をサービスに送りません。

## 次の処理を加える

```ts
import { validateAddress } from "@johnmorrisdotca/address-plus";
const checked=validateAddress("123 Main St, Seattle, NY 98101");
console.log(checked.isValid,checked.warnings.map(finding=>finding.code));
```

郵便番号と地域の不一致は、形が有効でも警告になることがあります。[確認](validation.md)、[書式](formatting.md)、[国のモジュール](country-modules.md)、[フォームの入力欄](form-field-and-embeds.md)へ進めます。元の8つの入口と、既定の解析のオブジェクトを引き続き使えます。
