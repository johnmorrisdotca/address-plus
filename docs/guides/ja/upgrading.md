---
title: parse-addressから移行する
section: upgrading
order: 12
description: 元の解析の契約を保ち、説明のサイトを使います。
---

## 使っている import を保つ

主な名前付きの export と既定の `parser` を引き続き使えます。元の国と入力欄の入口も標準の API を保ちます。この変更で、版、解析の規則、表の値、国の分離は変えません。新しい `api.html` は個別のページへ進むアンカーの索引で、`docs/api.md` は生成する Markdown の全体の説明として残ります。端末の検索とルートの llms のファイルで、同じパッケージを読めます。

## 互換性を明確に保つ

元の[parse-addressからの移行](../../MIGRATING_FROM_PARSE_ADDRESS.md)と[READMEの移行の説明](../../../README.md#migrating-from-parse-address)を読めます。解析とは別に確認と書式を加え、null を保ち、国のモジュールを明確に選びます。書式や類似度を、登録された配達先の確認にはしません。型付きのコードでは snake-case の項目を明確に読みます。

## 生成する説明を更新する

`docs:make` は元の全体の説明と期待する答えを保ちます。`docs:check` は共通の例を実行し、`docs:legacy-check` は答えと公開の型を確認します。ソースのコメント、国の資料、[変更履歴](../../../CHANGELOG.md)を同じ確認するブランチで保ちます。新しい日本語の説明はリリース前に確認が必要です。
