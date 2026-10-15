---
title: 標準のフォームの入力欄を使う
section: how-to
order: 9
description: 標準のフォームの動きを保ち、設定のメッセージに住所を含めません。
---

## フォームの中に表示する

```ts no-run
import { defineField } from "@johnmorrisdotca/address-plus/element";
defineField();
const field=document.createElement("address-field");
field.setAttribute("name","shipping-address");
field.setAttribute("country","CA");
field.setAttribute("required","");
const form=document.createElement("form");
form.append(field);document.body.append(form);
console.log(form.querySelector("address-field")?.getAttribute("name"));
```

元の値を`name`の名前で送信します。必須項目、フォームの確認、リセット、無効なfieldsetは標準の動きです。ElementInternalsがない場合は通常の入力を使います。`readonly`は値を保ち、disabledは送信しません。確認は既定で有効なので、`validate=false`は明確に指定します。大きさ、幅、テーマ、言語を変えても、文章とフォーカスを保ちます。標準の入力は4,000文字までです。

## 信頼する表示側で結果を読む

```ts no-run
import { AddressField,defineField } from "@johnmorrisdotca/address-plus/element";
defineField();
const field=new AddressField();
field.country="CA";
field.options={validation:{requirePostalCode:true},onChange:current=>console.log(current.address?.country,current.validation?.isValid)};
field.value="100 Queen St W, Toronto, ON M5H 2N2";
document.body.append(field);
console.log(field.checkValidity());
```

端末の中の`value`、`address`、`validation`、`options.onChange`で、信頼する表示側が値を読めます。公開のload・change・errorイベントは国、状態、件数、決まった説明を伝え、住所の項目は含めません。作成画面のコードと設定URLに入力した値は入りません。iframeは親のフォームに送信できないため、送信にはフォームの中の要素を使います。iframeのイベントは送信元の正確なoriginとフレームを確かめます。元の[埋め込みの説明](../../embeds.md)と作成画面で、属性とReact・Vue・Svelte・Angular・HTMLの例を読めます。
