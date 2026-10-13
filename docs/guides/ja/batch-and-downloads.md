---
title: 一覧を解析して保存する
section: how-to
order: 8
description: 結果の順番、失敗した行、端末で作る保存の書式を保ちます。
---

## 一覧の失敗を保つ

```ts
import { parseLocationsBatch,parseLocations } from "@johnmorrisdotca/address-plus";
const inputs=["123 Main St, New York, NY 10001", ""];
const batch=parseLocationsBatch(inputs);
console.log(batch.results.length,batch.results[1],batch.errors[0].index,batch.stats.total);
console.log(parseLocations(inputs).length);
```

一覧の結果は入力の順番と、解析できない場合の null を保ち、番号付きのエラーと実行の統計を返します。`stopOnError` は処理する範囲を変えるため、成功した行だけを元の一覧と同じ番号にせず、番号を保ちます。時間は今回の測定で、実行ごとに変わります。

## デモの保存を使う

一括処理のパネルは7か国を扱い、CSV、JSON、テキスト、Markdown、SQL を端末で保存します。SQL は値がない項目を NULL にし、数字のような郵便番号も文字列に保ちます。Markdown は縦線とバックスラッシュをエスケープし、改行を保ちます。共通の書き出しとブラウザーのテストで、SQLite の実行と往復の確認を保ちます。PostgreSQL と MySQL の書式の説明は元の[保存の説明](../../list-downloads.md)にあり、MySQL は指定の SQL モードが必要です。

一括入力は、コピーや保存を選ぶまでページの中で扱います。主なツールのリンクのコピーは、意図してパネルの入力を含めます。文章を共有する場合に使います。作成画面や埋め込みの設定 URL は別の規則で、入力した住所を含めません。[入力欄の説明](form-field-and-embeds.md)で区別します。
