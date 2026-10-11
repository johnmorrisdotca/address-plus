# Bulk address downloads

The demo adds Markdown and SQL beside its existing CSV/JSON downloads. The same flattened columns as CSV, including the seven-country fields; missing values are NULL in SQL. Existing CSV, JSON and text output is unchanged. Downloads stay local; no server or account is used.

Markdown is a GitHub table with a header and numeric alignment. Pipes and backslashes are escaped; line breaks become `<br>`. SQL creates the `addresses` table and inserts one row per record. Identifiers are double-quoted; single quotes in strings are doubled; absent values are NULL. Numbers use INTEGER or REAL, text uses TEXT, and booleans use 1/0. Numeric-looking strings remain text so leading zeros survive.

The file runs in SQLite and PostgreSQL. For MySQL, first enable `ANSI_QUOTES,NO_BACKSLASH_ESCAPES`; the file itself carries this reminder. SQLite execution and Markdown round trips are tested, including 東京, quotes, pipes, newlines and missing values. `demo/downloads.js` and its test are copied byte-identically from the family's existing writer, not separate implementations.

## 日本語

デモには、CSVとJSONに加えて、MarkdownとSQLの保存ボタンがあります。MarkdownはREADMEやメモ用の表です。縦線とバックスラッシュをエスケープし、改行を`<br>`にします。SQLは`addresses`テーブルを作り、1件につき1行を追加します。値がない項目はNULLです。引用符を含む文字列や東京のような日本語も保存できます。

SQLiteとPostgreSQLで読み込めます。MySQLでは、先に`ANSI_QUOTES,NO_BACKSLASH_ESCAPES`を有効にしてください。ダウンロードはこの端末で作られ、サーバーに送信しません。従来のCSV、JSON、テキストの出力は変わりません。
