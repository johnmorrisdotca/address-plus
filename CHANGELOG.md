# Changelog

All notable changes to this project are written here, in the style of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The project follows [Semantic Versioning](https://semver.org/).

## Unreleased

### Changed

- Group the package family by kind, alphabetize each group, and include the geography packages and REST in Pieces in the shared footer and README.

## 1.6.0 - 2026-10-09

### Added

- France, as a module of its own: `@johnmorrisdotca/address-plus/fr`. `parseFrenchAddress` reads an address the way La Poste lays one out (its specification SP 8855): who it is care of (`Chez`), an apartment or a door, a floor, a staircase, an entrance, the building, residence or zone, the number with its extension (`12 bis`, `12 B`, `12-14`), the type of voie first and in full in `type` (`rue de la Paix` is `Rue` and `de la Paix`; `av.`, `bd`, `chemin`, `rond-point` and thirty more), a lieu-dit, a box (`BP`, `CS`, `TSA`), and the line of the postcode, the commune and its CEDEX or arrondissement; `F-75008` too. The postcode names the department in `state` (Corsica's 20 split at 20200 into `2A` and `2B`, `971` to `976` overseas). `validateFrenchAddress` checks the postcode against the 6,328 in La Poste's base officielle (it skips that for an address with a CEDEX, whose code the base does not list), `formatLaPoste` writes the six lines in capitals without accents or punctuation, and `compareFrenchAddresses` takes `av.` and `avenue`, `St` and `Saint`, accents and hyphens as the same. `isValidFrenchPostcode`, `isKnownFrenchPostcode`, `parseFrenchPostcode`, `getDepartmentFromFrenchPostcode`, `findFrenchDepartment`, the 101 departments with their regions (`FR_DEPARTMENTS`) and the overseas collectivities (`FR_COLLECTIVITIES`) are in it too, with the tables of words (`FR_STREET_TYPES`, `FR_UNIT_TYPES`, `FR_BUILDING_WORDS`, `FR_NUMBER_EXTENSIONS`).
- Monaco and the overseas collectivities (Saint-Pierre-et-Miquelon, Saint-Barthélemy, Saint-Martin, Wallis-et-Futuna, French Polynesia, New Caledonia) are La Poste's too: the French module reads them and reports `country` as `MC`, `PM`, `BL`, `MF`, `WF`, `PF` or `NC`, the way the British module reports `JE`; its validator says so (`OUTSIDE_FRANCE`). The overseas departments are `FR`. `ParsedAddress` gains `numberExtension`, `staircase`, `entrance`, `lieuDit`, `postalBoxType`, `postalBoxNum`, `cedex`, `arrondissement` and `careOf`, and `country` and `ParseOptions.country` the new codes; `FormattedAddress.format` gains `"la-poste"`.
- Pass `france` in the `countries` option and `parseLocation` and `validateAddress` read French addresses beside the others, by the hint (`country: "FR"`, or an overseas department's or collectivity's code) or by detection: the address ends with France, an overseas territory or Monaco, holds a CEDEX or an arrondissement of Paris, Lyon or Marseille, or its last line is a postcode whose number names a department, a collectivity or Monaco and a commune beside a French type of voie, a box or a lieu-dit. A US ZIP code follows its state and a Canadian postal code ends in a digit, so neither is taken for French; a German address, whose postcode comes first too, is not either. Nothing changes without `countries`.
- A French corpus of 196 original cases (`test-data/corpus/fr/`), with libpostal's seven French fixtures written again as original inputs of the same shapes; none is wrong today. `docs/TEST_COVERAGE.md` has its part, `docs/COUNTRIES.md` the detection rules, the fields and the sources.
- The demo reads France in every panel but Clean (which is the core's, and puts a postcode after the commune): examples for a bis and for a residence, a country choice for France on the parse panel, La Poste's format, `compareFrenchAddresses`, a five-digit code in the postal panel read as a US ZIP code and as a French postcode when its number names a department, France in the pasted list and the French corpus in the corpus panel, in English and in Japanese. The pasted list's sample has seventeen lines, and its CSV nine more columns for the French fields.
- The demo reads Germany the same way: a Germany button on the parse panel, examples with a street and with a c/o line and a floor, Deutsche Post's format, `compareGermanAddresses`, a five-digit code in the postal panel read as a German postcode too (and as a French and a US one when each has it), Germany in the pasted list (nineteen lines now) and the German corpus in the corpus panel, in English and in Japanese.
- Germany, as a module of its own: `@johnmorrisdotca/address-plus/de`. `parseGermanAddress` reads an address the way Deutsche Post and DIN 5008 lay one out: who it is care of (`c/o`, `z. Hd.`, `bei`), a part of the building (`Hinterhaus`, `Haus B`), a flat, a floor and its side, the street's whole name as written in `street` (`Hauptstraße`, `Berliner Str.`, `Am Markt`, `Platz der Republik`) with its house number after it in `number` (`12a`, `12-14`), a Postfach or a Packstation, the Ortsteil, the place and the postcode, with the Land's code in `state`; `D-10115` too. `validateGermanAddress` checks the postcode against the 10,813 in GeoNames' list for Germany, `formatDeutschePost` writes the lines with no punctuation at the end of one and a Postfach's number in pairs, and `compareGermanAddresses` takes `Straße`, `Strasse` and `Str.`, umlauts written out and the house number's letter as the same. `isValidGermanPostcode`, `isKnownGermanPostcode`, `parseGermanPostcode`, `getStateFromGermanPostcode`, `findGermanState`, the sixteen Länder with their Japanese names (`DE_STATES`, from kuni) and the tables of words (`DE_STREET_SUFFIXES`, `DE_STREET_OPENERS`, `DE_UNIT_TYPES`, `DE_BUILDING_WORDS`) are in it too. `ParsedAddress` gains `careOf` (France's has the same meaning), `country` and `ParseOptions.country` `DE`, and `FormattedAddress.format` `"deutsche-post"`.
- Pass `germany` in the `countries` option and `parseLocation` and `validateAddress` read German addresses beside the others, by the hint (`country: "DE"`) or by detection: the address ends with Germany or Deutschland, or its last line is a postcode and a place beside a street that ends in a German suffix and is followed by its number, a Postfach or a Packstation. A French street begins with its number, so a French address is not taken for German, nor a German one for French; `Allee der Kosmonauten 8` is German, the French detection leaving it be.
- A German corpus of 151 original cases (`test-data/corpus/de/`), with libpostal's three German fixtures written again as original inputs of the same shapes; none is wrong today. `docs/TEST_COVERAGE.md` has its part.
- `pnpm data:countries` makes Germany's tables too (`--only de`): the postcodes and the Land of each from GeoNames' postal code file (Creative Commons Attribution 4.0), and the Länder from kuni. `/de` is 26 KB (12 KB gzipped), and the 10,813 postcodes 12 KB of it.
- `pnpm data:countries` makes France's tables too (`--only fr` makes them alone): the postcodes from La Poste's Base officielle des codes postaux and the departments, regions and overseas collectivities from INSEE's Code officiel géographique, both Licence Ouverte 2.0. No commune or street name is in the package: the 6,328 postcodes are 7.5 KB, and `/fr` is 27 KB (9 KB gzipped).

## 1.5.0 - 2026-10-09

### Added

- Australia, as a module of its own: `@johnmorrisdotca/address-plus/au`. `parseAustralianAddress` reads an address the way Australia Post and AS4590 lay one out: a unit before a slash (`3/12 Smith St`) or with its type, a level, a lot, a range, a building's name and the twelve postal delivery types (PO Box, GPO Box, Locked Bag, Private Bag, RMB, RSD, RMS, CMB, CMA, CPA, MS, Care PO), then the suburb, the state by code or name and the postcode; street types come back as AS4590's abbreviations. `validateAustralianAddress` checks the postcode against Australia Post's blocks for each state, letting the 14 postcodes that cross a border (from the ABS's Postal Areas, CC BY 4.0) pass with either state. `formatAustraliaPost`, `compareAustralianAddresses`, `looksAustralian`, the postcode lookups and the tables (`AU_STATES`, `AU_POSTCODE_RANGES`, `AU_STREET_TYPES` and the rest) come with it.
- The United Kingdom, as a module of its own: `@johnmorrisdotca/address-plus/gb`. `parseUKAddress` reads the parts of Royal Mail's Postcode Address File (a flat or a named part of a building, a floor, the building's name, the number, a dependent thoroughfare, the thoroughfare with its descriptor in full, the dependent localities, the post town, a county and the postcode wherever it is written), BFPO, GIR 0AA, and Jersey, Guernsey and the Isle of Man (`country` `JE`, `GY`, `IM`). `parseUKPostcode` and `isValidUKPostcode` hold Royal Mail's grammar with the letters each place allows; `getNationFromUKPostcode` gives the nation, district by district across the borders of Wales and Scotland. `validateUKAddress` checks the area, and in Great Britain the district against Ordnance Survey's Code-Point Open (OGL v3). `formatRoyalMail`, `compareUKAddresses`, `looksBritish` and the tables come with it.
- A `countries` option on `parseLocation` and `validateAddress`: hand them `australia` and `unitedKingdom` and they read those addresses beside the US, Canadian and Japanese ones, by the country hint (`country: "AU"`) or each module's own detection. A hint naming a country whose module was not passed throws a `TypeError` saying how to pass it. Without `countries`, nothing changes; the main entry point grows by under 1 KB, and `/au` (16 KB, 7 KB gzipped) and `/gb` (20 KB, 9 KB gzipped) cost only those who import them.
- `docs/COUNTRIES.md`: the country-module design, how an address finds its country (a British postcode and a Canadian one, four digits and a short ZIP code, `3/12` and `4-123`), the fields each country fills, every data source with its licence, and how to add the next country.
- Australian and British corpora, 266 and 190 original cases (`test-data/corpus/au/`, `test-data/corpus/gb/`), with libpostal's 29 British fixtures and its Manx one written again as original addresses of the same shapes. Eight British cases are still wrong, each explained in `docs/TEST_COVERAGE.md`.
- `pnpm data:countries` regenerates the Australian and British tables: the states and nations with their English and Japanese names from kuni (a devDependency; the rows are copied, so the package keeps one runtime dependency), the border postcodes from the ABS, and the postcode districts and their nations from Code-Point Open.
- The demo reads Australian and British addresses in every panel, with examples for each, a country choice on the parse panel, both in the pasted list, and their corpora in the corpus panel.

### Fixed

- `docs/TEST_COVERAGE.md` said libpostal's parser fixtures hold only US and Canadian addresses. They also hold 29 British ones, 7 French, 3 German and a few from about twenty other countries, and none from Australia.

## 1.4.0 - 2026-10-09

### Added

- A Japanese address corpus of 1,118 cases (`test-data/corpus/japan/`): 837 of the real addresses in Geolonia's normalize-japanese-addresses tests (MIT), its 38 normaliser shapes, and original cases for kanji and full-width numerals, sixteen kinds of dash, postal codes, buildings, 大字 and 郡, Kyoto's street directions, Hokkaido's grids, the twenty designated cities, Tokyo's 23 wards, romaji and unknown places. `docs/TEST_COVERAGE.md` describes it.
- TSDoc on every export, in the published type definitions, so an editor shows on hover what each function, table and type is, its parameters, what it returns (and what `null` or `undefined` means), and an example with its answer. `pnpm docs:check` runs every example against the built package. The API reference (`docs/api.md`) now lists the parameters and return value too.
- `docs/MIGRATING_FROM_PARSE_ADDRESS.md`: moving from parse-address, with every call and field mapped, the answers that differ on purpose shown side by side, and a before and after.
- `streetDirections` on a Japanese address: Kyoto's street directions (`寺町通御池上る`), apart from the town they lead to (`上本能寺前町`). `formatJapanese` and `formatJapaneseEnglish` write them back before the town.

- The demo page: a "Paste a list" panel that parses, checks and formats a list of addresses and saves it as CSV, JSON or TXT; "Japan, part by part", each part of a Japanese address beside its reading, romaji and code; the test corpus, loaded on request and run in the browser; a "Copy code" and a "Copy link" under every panel, with the page's state kept in its address; and cleaning shown step by step, ending in the post office's format.

### Changed

- Two numbers straight after a Japanese town are ban and go, not chome and ban: `寿町2-31` is 2番31号, and `丸の内1-2` now gives ban 1 and go 2 where it gave chome 1 and ban 2. A chome written as such (`1丁目2-3`) is unchanged, as are three numbers. In Geolonia's test set 899 of 907 such pairs are ban and go. The same in romaji (`58-9 Shirakaba-cho`).
- Three numbers after a town named with 大字 or 字, or whose first number is 100 or more, are ban, go and a room.
- A Kyoto town written with its street directions (`寺町通御池上る上本能寺前町`) now has the town `上本能寺前町`; the directions are in `streetDirections`.
- `Urawa-shi` and other romaji names of a city merged away are no longer taken for the ward that kept the name (浦和区); they stay unidentified, as in Japanese script.

### Fixed

- Japanese: 丁 for 丁目 (`3丁1番9号`); a town named with 番町 or 番丁 (`和歌山市7番町`, `学校町通1番町`); a room after a further dash (`6番23-2`, `1番2-403号`); a lettered go (`14-イ22`); kanji numerals before a dash (`四-2-27`, `一-二-三`) or 号室 (`一〇一号室`); `二階堂` read as a town, not a second floor; the dashes `─`, `━`, `⁃` and `˗`.
- Japanese: spaces inside a municipality (`京都市 下京区`, `上北郡 横浜町`) or a town (`藤橋町 亥`); 巿 typed for 市; `ヶ`, `驒`, `﨑` and `髙` written for `ケ`, `騨`, `崎` and `高` in a municipality's name; a short prefecture before a city (`千葉市川市`); a ward with only its prefecture (`大阪府北区`); a prefecture alone without its designator (`東京`).
- Romaji Japanese: an address on several lines, in Japanese order without commas (`Tokyo-to Chiyoda-ku Marunouchi 1-2-3`), with 〒 before it, or with `Chiyoda City` and no `-ku`; a misspelt prefecture after the municipality is no longer read as the building.
- A US address whose street number matches a prefecture's JIS code (`Fl 34`) is no longer taken for a Japanese one.
- `cleanAddress` and `cleanAddressDetailed` write a Japanese address the way Japan Post asks, on one line (`〒100-0005 東京都千代田区丸の内1-2-3`), where they gave a mangled US-style line (`1-2-3 丸の内, 千代田区 13 100-0005`).
- `parseIntersection` takes the whole city after the second street when there is no comma: `Main St and Pine St Tacoma WA` gives the city `Tacoma`, not `St Tacoma`, and `Salt Lake City` keeps all three words.

## 1.3.0 - 2026-10-09

### Added

- `docs/TEST_COVERAGE.md` lists every shape of address that parse-address's and Geo::StreetAddress::US's test suites exercise, each with an original case in the corpus that covers it. The corpus no longer carries any input of those suites: their 65 street-address cases are rewritten as original addresses of the same shapes (`test-data/corpus/us/parse-address-shapes.json`), five shapes only the Perl module tests are added, and the intersection cases use original streets.

### Changed

- In a Canadian address a hyphenated leading number is Canada Post's unit and civic number, unit first: `4-123 Main St`, `Unit 4-123 Main St` and `53-55 Water Street` are unit 4 at 123 and unit 53 at 55. In a US address a hyphenated number such as Queens' `87-11` stays whole, and so does a Canadian one when the address names a unit elsewhere.
- New fields on `ParsedAddress`: `military` (the military delivery line, such as `PSC 802 Box 74`, with APO, FPO or DPO as the city and AA, AE or AP as the state), `compartment` (a Canadian site's compartment) and `highwayContract` (a highway contract route's number).
- `formatAddress` and `cleanAddress` write the unit after the street; `formatCanadaPost` joins it to the civic number, unit first (`4-123 MAIN ST`).
- A type written before the name is a type only in Canada and Puerto Rico; elsewhere it is part of the name (`Avenue of the Americas`).
- Street names keep the letters they were written with when mixed case (`O'Farrell`, `De La Vina`), and a lowercase French particle stays lowercase (`rue des Jardins` gives `des Jardins`).
- Case postale is reported as `CP`, and Box and POB as `PO Box`.

### Fixed

- Every USPS secondary unit designator is read (DEPT, HNGR, KEY, PIER, SLIP, SPC, STOP, TRLR and the rest), with a period, `#` or `No.` before its value, as are the French app., appartement, bureau and unité; HNGR is Hangar.
- A trailing USA, United States or Canada no longer stops the city, state and ZIP being read.
- Rural routes (RR, R.R., Rural Route, RFD), highway contract routes (HC, Star Route) and Canadian site and compartment addresses are read.
- A Canadian unit and civic number joined by a hyphen are split into the unit and the number.
- Street types: CT is Ct, Pk is Park, Landng, Villge, Exten, Crnrs, Cross and Harbour map to the USPS words, Canada Post's Circuit, Cul-de-sac and Diversion are known in full, Est is Estate outside Canada, and French Nord-Ouest and Sud-Ouest are NO and SO.
- A unit in a comma part of its own is read as the unit, not as the city.
- Street names are no longer lowercased and re-capitalized (O'farrell, D'youville, Des Jardins).
- APO, FPO and DPO addresses are read.
- French types with a period (av., boul., ch., crois., imp.) and carré, cours, rond-point, allée, quai, parc, pointe and île are read.
- Canada Post's comma after a French civic number (`275, rue Notre-Dame Est`) is read, and an accented city no longer hides a state: the "al" ending Montréal was read as Alabama, because `\b` treated accented letters as word breaks.
- A city with no comma before it is found after the street (`1600 Amphitheatre Pkwy Mountain View CA`, `8605 Sycamore St Salt Lake City UT`).
- A directional that is the whole street name (North St, Northwest Hwy) is the name, not a predirectional.
- A civic number with a letter (`123A`, `2455-B`) is read as the number.
- Post office box variants: Box alone, POB, case postale, STN, a PO box's ZIP+4, GD and poste restante.
- A province in parentheses (`Montréal (Québec)`) is read as the province.
- A unit written on the line above the street is read as the unit.
- Street suffixes that are also unit words (Key, Trailer, Front, Gate) are read as the type when no value follows.
- A comma between the state and the ZIP no longer makes the state the city.
- `Avenue A`, `Avenue of the Americas` and `Old Post Office Rd` keep their whole names.
- PQ, Que., NF, Nfld. and Île-du-Prince-Édouard are read as provinces.
- Smaller faults: a place's name before the number, a Puerto Rico urbanization (now `locality`), runs of spaces, PMB, numbers spelled out, semicolons and a spaced dash as separators, number-first floors, D.C. with periods, a Canadian highway's direction, a unit after a grid street, FL after General Delivery, `N/A`, quotes round the address, a street with no number and a county read as the city.
- `cleanAddressDetailed` and `formatAddress` no longer put the unit before the number ("Apartment 4 123 Main St").
- Title case no longer damages postal codes, directionals and PO Box ("M5h 2n2", "Nw", "Po Box"), nor turns "de la" into DE LA.
- `normalizeRegion` no longer fuzzy-matches loosely (Osaka gave AK, Tokyo OH, Kyoto CO): the whole input must be close to a whole name, and a Japanese prefecture's name never matches.
- `getZipPrefixesForState` and `getPostalPrefixesForProvince` accept a name ("New York", "Quebec").

## 1.2.0 - 2026-10-09

### Added

- Japanese addresses: `parseLocation` recognises an address written in Japanese (`〒100-0005 東京都千代田区丸の内1丁目2番3号 サンプルビル5階`) or in romaji (`1-2-3 Marunouchi, Chiyoda-ku, Tokyo 100-0005, Japan`) and reads it into the postal code, prefecture, municipality, town, chome, ban, go, building, floor and room, with the prefecture's and municipality's JIS codes and romaji. US and Canadian addresses that only mention a Japanese place, such as `100 Tokyo Ave`, are still read as US and Canadian.
- `country: "JP"` in the parse and validation options, to skip the detection and read an address as Japanese.
- The shared fields are filled for a Japanese address too (state, city, street, number, zip, place), so formatting, comparison and validation treat it like any other address.
- Full-width digits and letters, every kind of dash, kanji numerals (一丁目二番三号), `1の2の3`, a postal code with or without its hyphen, and 日本 or Japan at either end are all read; kanji numerals that belong to a name, such as 三番町 or 麻布十番, are left alone.
- The twenty designated cities can be named without their ward (大阪市, Sapporo), and towns and villages without their district (当別町 for 石狩郡当別町).
- `parseJapaneseAddress`, `looksJapanese`, `normalizeJapaneseAddressText` and `kanjiNumeralsToDigits`.
- `formatJapanese` writes an address in Japanese order, as on an envelope, with the block as `1-2-3` or `1丁目2番3号` (`12番地3` for a land lot in a 大字 town); `formatJapaneseEnglish` writes it in English order.
- `validateAddress` checks a Japanese address against the tables: `POSTAL_REGION_MISMATCH` when the postal code delivers to another prefecture, `MUNICIPALITY_PREFECTURE_MISMATCH`, `UNRECOGNIZED_MUNICIPALITY`, `AMBIGUOUS_MUNICIPALITY` (such as 府中市, in Tokyo and in Hiroshima), `UNRECOGNIZED_POSTAL_CODE` and `INVALID_POSTAL_FORMAT`; `validateJapaneseAddress` runs those checks on a parsed address.
- Lookups over the 47 prefectures, the 1,894 municipalities and the postal codes: `findPrefecture`, `findMunicipalitiesByName`, `findMunicipalitiesByRomaji`, `findMunicipalityByCode`, `municipalitiesOf`, `getPrefectureFromJapanesePostalCode`, `getPostalPrefixesForPrefecture`, and the tables themselves.
- A second entry point, `@johnmorrisdotca/address-plus/jp`, for the Japanese module on its own.
- `pnpm data:jp` regenerates the Japanese tables from Geolonia's address data and Japan Post's postal file.
