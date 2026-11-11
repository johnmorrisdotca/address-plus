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
import { netherlands } from "@johnmorrisdotca/address-plus/nl";
import { spain } from "@johnmorrisdotca/address-plus/es";
import { italy } from "@johnmorrisdotca/address-plus/it";
import { newZealand } from "@johnmorrisdotca/address-plus/nz";
import { india } from "@johnmorrisdotca/address-plus/in";
import { southKorea } from "@johnmorrisdotca/address-plus/kr";
import { brazil } from "@johnmorrisdotca/address-plus/br";
const countries=[australia,unitedKingdom,france,germany,netherlands,spain,italy,newZealand,india,southKorea,brazil];
console.log(parseLocation("3/12 Smith St, Parramatta NSW 2150",{countries,country:"AU"})?.secUnitNum);
console.log(parseLocation("10 Downing St, London SW1A 2AA",{countries,country:"GB"})?.nation);
console.log(parseLocation("12 bis rue de la Paix, 75002 Paris",{countries,country:"FR"})?.numberExtension);
console.log(parseLocation("Hauptstraße 12a, 10115 Berlin",{countries,country:"DE"})?.number);
console.log(parseLocation("Keizersgracht 123A, 1015 CJ Amsterdam",{countries,country:"NL"})?.numberExtension);
console.log(parseLocation("Calle de Alcalá, 42, 28014 Madrid",{countries,country:"ES"})?.state);
console.log(parseLocation("Via del Corso, 12/A, 00186 Roma",{countries,country:"IT"})?.state);
console.log(parseLocation("3/45 Dominion Road, Auckland 1024",{countries,country:"NZ"})?.state);
console.log(parseLocation("12 MG Road, Bengaluru, Karnataka 560038",{countries,country:"IN"})?.state);
console.log(parseLocation("서울특별시 중구 세종대로 110",{countries,country:"KR"})?.number);
console.log(parseLocation("Rua Augusta, 100, São Paulo - SP, 01305-000",{countries,country:"BR"})?.state);
```

AU、GB、FR、DE、NL、ES、IT、NZ、IN、KR、BRは必要なときに加えます。主な入口は自動では読み込まず、それぞれの国のビルドに別の国の表は入りません。各モジュールは、標準の解析、確認、書式、比較、郵便のデータを持ちます。NL、ES、IT、NZ、IN、KRの郵便番号は、それぞれの国の一覧（オランダはCBS、ほかの国はGeoNames。どちらもCC BY 4.0で、NOTICE.mdに出典を記載）で調べます。一覧にない番号は警告であり、存在しない証拠ではありません。BRには番号の一覧がなく、CEPは範囲によって州に結びつけます。フランスの海外地域や英国王室属領は元の国のコードを保ち、推測で主な国のコードにまとめません。

## 日本の入力を端末の中で扱う

```ts
import { parseJapaneseAddress } from "@johnmorrisdotca/address-plus/jp";
console.log(parseJapaneseAddress("〒100-0005 東京都千代田区丸の内1丁目2番3号")?.municipalityCode);
```

日本の解析には、元の都道府県、市区町村、郵便の表を使います。全角の数字と、説明した日本語・ローマ字の形を扱えます。元の[国の設計](../../COUNTRIES.md)、[日本の詳細](../../../README.md#japanese-addresses)、[国ごとの例](../../../README.md#australian-french-german-and-british-addresses)を保っています。
