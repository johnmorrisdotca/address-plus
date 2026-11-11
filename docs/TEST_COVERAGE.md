# Test Coverage: the US, Canadian, Japanese, Australian, French, German, British, Dutch, Spanish, Italian, New Zealand, Indian, Korean and Brazilian Address Corpora

This document says what address shapes the US and Canadian postal authorities define, which of them the
hand-written tests already exercised, what the corpus under `test-data/corpus/` adds, and, last, what the
parser got wrong when the corpus was written and how the fixing pass that followed dealt with each cause.
The Japanese corpus, added after 1.3.0, has a part of its own: see "The Japanese corpus" below. So do the
Australian and British corpora, added after 1.4.0 with the `/au` and `/gb` country modules: see "The Australian
corpus" and "The British corpus". The French and German corpora came with the `/fr` and `/de` modules after 1.5.0: see "The French corpus" and "The German
corpus". How
a country module is chosen for an address is in [COUNTRIES.md](COUNTRIES.md).

## In numbers

| | Cases | Pass today | Todo (wrong today) | Todo before the fixing pass |
| --- | ---: | ---: | ---: | ---: |
| United States (`test-data/corpus/us/`, 14 files) | 1,092 | 1,091 | 1 | 149 |
| Canada (`test-data/corpus/canada/`, 10 files) | 513 | 513 | 0 | 150 |
| Japan (`test-data/corpus/japan/`, 11 files) | 1,118 | 1,105 | 13 | 153 |
| Australia (`test-data/corpus/au/`, 6 files) | 266 | 266 | 0 | 5 |
| United Kingdom (`test-data/corpus/gb/`, 7 files) | 190 | 182 | 8 | 9 |
| France (`test-data/corpus/fr/`, 7 files) | 196 | 196 | 0 | 11 |
| Germany (`test-data/corpus/de/`, 7 files) | 151 | 151 | 0 | 2 |
| Netherlands (`test-data/corpus/nl/`, 1 file) | 22 | 22 | 0 | 0 |
| Spain (`test-data/corpus/es/`, 1 file) | 28 | 28 | 0 | 0 |
| Italy (`test-data/corpus/it/`, 1 file) | 24 | 24 | 0 | 0 |
| New Zealand (`test-data/corpus/nz/`, 1 file) | 20 | 20 | 0 | 0 |
| India (`test-data/corpus/in/`, 1 file) | 22 | 22 | 0 | 0 |
| South Korea (`test-data/corpus/kr/`, 1 file) | 25 | 25 | 0 | 0 |
| Brazil (`test-data/corpus/br/`, 1 file) | 22 | 22 | 0 | 0 |
| Total | 3,689 | 3,667 | 22 | 479 |

Before the corpus, `test-data/` held about 440 address inputs written by hand (the 600 test cases count
the function tests in TypeScript too). They exercised 34 distinct street types, 13 unit designators and
no military, urbanization, private mailbox, trailing-country or province-in-parentheses address at all.

Field by field, over every field value a corpus case names other than `country`:

| | address-plus right | parse-address right |
| --- | ---: | ---: |
| United States (6,715 field values) | 6,714 (99.99%) | 6,350 (94.6%) |
| Canada (3,193 field values) | 3,193 (100%) | 1,215 (38.1%) |
| Japan (6,424 field values) | 6,400 (99.6%) | (parse-address reads no Japanese) |
| Australia (1,623 field values) | 1,623 (100%) | (not compared) |
| United Kingdom (1,141 field values) | 1,124 (98.5%) | (not compared) |
| France (1,157 field values) | 1,157 (100%) | (not compared) |
| Germany (778 field values) | 778 (100%) | (not compared) |

Before the fixing pass the same count gave address-plus 94.7% in the United States, 89.9% in Canada and 95.0% in
Japan.

## How the corpus works

### A case

Every corpus file has the standard test-file shape (`schemas/test-file.json`): a `name`, a `description`
that also states the licence of what the file draws on, and `tests`, one array per shape group. Each case:

```json
{
  "name": "prefix NE",
  "description": "Predirectional NE before the street name",
  "input": "679 NE Magnolia St, Seattle, WA 98101",
  "expected": { "number": "679", "prefix": "NE", "street": "Magnolia", "type": "St", "city": "Seattle", "state": "WA", "zip": "98101", "country": "US" },
  "source": "USPS Publication 28, Postal Addressing Standards (US government work, public domain), predirectional"
}
```

- `expected: null` means `parseLocation` must return `null`.
- A field set to `null` must be absent from the result.
- `ignoreCase` lists fields compared without regard to letter case. It is used only where the input is all
  lowercase or all capitals, for the free-text fields `street`, `city` and `station`; normalized fields
  (`type`, `state`, `prefix`, `secUnitType`) are always compared exactly.
- `partial: true` turns off the absence check below. It is used only where a part of the address has no
  field here (a neighbourhood or county in libpostal's fixtures), where how a part should split is
  unsettled (a numbered concession or sideroad), or where the case asserts only what must not be invented.
  The military, compartment and highway contract cases were partial until those parts had fields.
- `todo: true` with a one-line `todoNote` marks a case the parser gets wrong today. The note says what
  comes out instead, field by field, for example `type: "Crt" (want "Ct")`.

### The judge

`src/__tests__/corpus/corpus-support.ts` holds the one rule every suite uses. Each field the case names must
equal the result's field. And, unless the case is `partial`, each **core field** the case does not name
must be absent from the result: `number`, `prefix`, `street`, `type`, `suffix`, `secUnitType`,
`secUnitNum`, `city`, `state`, `zip`, `plus4`, `country`. A parser that invents a prefix, a unit or a city
fails as surely as one that loses it. Other fields (`unit`, `zipValid`, `place`, `rr`, `station` and the
rest) are checked only when named.

### The suites

- `src/__tests__/corpus/us.test.ts` and `canada.test.ts` read every file in their folder, so a new file
  needs no code. A case is an `it`; a todo case is an `it.todo` whose title carries its note, so the suite
  stays green and every gap is listed in the test output. Each file has one more test, "has no todo case
  that now passes", which fails as soon as the parser fixes a todo case: the flag must come off, so the
  list of gaps never overstates them.
- `src/__tests__/corpus/mark-todo.test.ts` rewrites every todo flag and note from the parser's current
  output. It runs only when asked:
  `CORPUS_MARK=1 pnpm exec vitest run src/__tests__/corpus/mark-todo.test.ts && pnpm exec prettier --write test-data/corpus`.
  Use it after a fix; read the diff, since a case leaving todo is the fix working and a case entering todo
  is a regression.
- `src/__tests__/corpus/parse-address-parity.test.ts` is described under "Parity with parse-address".

### Conventions the expected values follow

Expected values are built from the parts each input is assembled from, never read back from the parser.
Where the library has a documented convention, the corpus follows it:

- `type` is the USPS standard abbreviation in proper case (`St`, `Xing`, `Holw`), in both countries.
  Where USPS Publication 28 Appendix C1 lacks the word, it is Canada Post's abbreviation (`Conc`, `Ch`,
  `Crois`, `Mtée`). Canadian spellings count as the same word (`Centre` is `Ctr`, `Harbour` is `Hbr`).
  This matches the library's existing tests (a Canadian `Trail` is `Trl`). It is a known divergence
  from Canada Post, not a bug: Canada Post writes `Crt`, `Lane`, `Trail` and `Terr` where the library
  writes `Ct`, `Ln`, `Trl` and `Ter`.
- French street types come before the name and are reported the same way (`rue Principale` is type
  `Rue`, street `Principale`). Words both languages share take the English abbreviation (`avenue` is
  `Ave`, `boulevard` is `Blvd`), as the library's own parked cases expect.
- `prefix` and `suffix` are the abbreviation (`N`, `NE`); French `Ouest` is `O`, and the compound French
  directionals are Canada Post's `NO` and `SO`.
- `secUnitType` is the designator's full word in proper case (`Apartment`, `Suite`, `Hangar`), `#` for a
  pound sign, `PO Box` for any spelling of a post office box (Pub 28 standardizes `BOX` alone to
  `PO BOX`) and `CP` for any spelling of the French case postale. French unit words stay French
  (`Appartement`, `Bureau`, `Unité`). A Canadian unit-civic pair with no designator (`4-123 Main St`)
  reports `Unit`.
- A hyphenated leading number is read by country. In a Canadian address (a province, a postal code or
  `country: "CA"` says so) it is Canada Post's unit-civic pair, unit first: `4-123 Main St` and
  `Unit 4-123 Main St` are unit 4 at civic 123, and so is `53-55 Water Street` (unit 53 at 55), which the
  hand-written cases in `canada/basic.json` and `canada/famous-addresses.json` used to read as a range.
  When the address names a unit elsewhere (`53-55 Water St., Suite 400`), the hyphen joins a range and the
  number stays `53-55`. In a US address a hyphenated number such as Queens' `87-11` is one number.
- `number` keeps a fraction (`123 1/2`, per the README) and a letter (`123A`).
- A route-numbered road keeps its qualifier and number in `street` with the road word abbreviated and
  no `type` (`US Hwy 431`, `County Rd 45`), as `parser.ts` does on purpose. A Canadian highway follows
  Canada Post instead: `Hwy 7` is type `Hwy`, street `7`, as for a French type.
- Rural routes report `rr` (the number) and `ruralRoute` (`RR 2`); a highway contract route reports
  `highwayContract` (the number) and `ruralRoute: "HC 68"`; the box on a route is `secUnitType: "Box"`.
  A Canadian site and compartment report `site` and `compartment`. General delivery reports
  `generalDelivery: true` and `street: "General Delivery"`. A Puerto Rico urbanization goes in `locality`.
- A military address reports its delivery line (`PSC 802 Box 74`, `USS Mitscher DDG 57`) in `military`,
  as written, APO, FPO or DPO in `city`, and AA, AE or AP in `state`.
- Postal codes are reported in capitals with one space (`M5H 2N2`); ZIP+4 is split into `zip` and `plus4`.
- `country` is `US` or `CA` whenever a state, province or postal code says so.

## Sources and licences

| Source | Licence | Used for |
| --- | --- | --- |
| USPS Publication 28, Postal Addressing Standards | US government work, public domain | Appendix B (state and territory codes), C1 (street suffixes), C2 (secondary unit designators), and the rules for directionals, numbers, PO boxes, PMB, rural and highway contract routes, general delivery, military and Puerto Rico addresses. Inputs are constructed. |
| Canada Post Addressing Guidelines | Rules described in our own words; nothing copied | Street types in both languages, unit and civic number order, French addresses, postal codes, province symbols, rural routes, site and compartment, general delivery, PO boxes and stations. Every input is constructed. |
| parse-address `test.js` (github.com/hassansin/parse-address) | ISC | The SHAPES of its 65 street-address cases, each written again as an original address (`us/parse-address-shapes.json`), and of its intersection cases (`us/intersections.json` in `test-data/`). No input is copied. Six cases keep a note where address-plus departs from parse-address on purpose, each saying why in its description. |
| Geo::StreetAddress::US `t/01_parser.t` (metacpan.org) | Artistic or GPL | Its shapes only, read to check that every one has an original case here (see "Shapes from parse-address and Geo::StreetAddress::US"); five shapes only it tests became `shape 66` to `shape 70`. No input is copied. |
| libpostal `test/test_parser.c` (github.com/openvenues/libpostal) | MIT | All 40 US street addresses and the 3 Canadian ones, their labelled components converted to this library's fields. libpostal's fixtures also hold 29 British addresses and one Manx one (written again as original addresses of the same shapes for the British corpus, below), 7 French, 3 German and about 20 other countries' handfuls (Austria 8, Colombia 6, Russia 5, the Netherlands, Japan, Spain, Jamaica and others), and none from Australia; this document said once that they held only US and Canadian addresses, which was wrong. Its large training data comes from OpenStreetMap (ODbL) and OpenAddresses and is not used. |

The parity test (below) still runs the `parse-address` npm package live, as a dev dependency. That is fine: it is
ISC licensed, and the test only reads what the package returns for our inputs; none of its test inputs are carried.

## Shapes from parse-address and Geo::StreetAddress::US

The parse-address package's own test suite is the compatibility bar for this library, and many of its cases trace
back to the Perl module Geo::StreetAddress::US, which is distributed under the Artistic License or the GPL. No
input of that lineage is carried here. Only the shapes are taken: what each case exercises (a glued grid number, a
unit with no commas, a type spelled out, a ZIP+4 with a space) was listed, and every shape then got an original
input, with its own street names, house numbers and towns, in `us/parse-address-shapes.json`. The table says which
suite exercises each shape and which of our cases covers it.

parse-address's suite has 75 cases (65 street addresses and 10 intersections), which come to 70 distinct shapes.
Geo::StreetAddress::US's suite has 46 cases (38 street addresses and 8 intersections) and 5 inputs that must not
parse, which come to 51 shapes. Together they are 75 distinct shapes, and every one has at least one
original case here.
Its option that drops a redundant street type (`County Road 43`) is a setting, not a shape of input; the inputs it
is tested on are shapes 37 and 38.

| Shape | parse-address | Geo::StreetAddress::US | Our case(s) |
| --- | --- | --- | --- |
| Number, street, highway type, ZIP only (no city, state or commas) | yes | yes | shape 01 |
| The same with a comma before the ZIP | yes | yes | shape 02 |
| Abbreviated suffix directional, comma, ZIP only | yes | yes | shape 03 |
| Highway and suffix directional spelled out, comma, ZIP only | yes | yes | shape 04 |
| Prefix directional, full highway word, city and state, no ZIP | yes | yes | shape 05 |
| The same with a Suite unit between commas | yes | yes | shape 06 |
| Unit with no commas around it, comma only before the state | yes | yes | shape 07 |
| Extra comma between the state and the ZIP | yes | yes | shape 08 |
| No punctuation at all: prefix directional, city, state, ZIP | yes | yes | shape 09 |
| Suffix directional, no commas, city and state | yes | yes | shape 10 |
| Suffix directional followed by a comma, city and state | yes | yes | shape 11 |
| Comma, then a lone directional letter joined to the city | yes | yes | shape 12 |
| Comma, then a full direction word joined to the city | yes | yes | shape 13 |
| Abbreviated type, city and state, no commas | yes | yes | shape 14 |
| Street with no type, two-word city | yes | yes | shape 15 |
| Two-word street name, commas, city, state, ZIP | yes | yes | shape 16 |
| Two-word street name, no commas | yes | yes | shape 17 |
| A route named State Highway with a number | yes | yes | shape 18 |
| Type abbreviated with a period (Ave.) | yes | yes | shape 19 |
| Type spelled out (Avenue) | yes | yes | shape 20 |
| Grid address with directionals glued to the numbers (48S 400E) | yes | yes | shape 21 |
| Grid address with spaced directionals and a pound-sign unit | yes | yes | shape 22 |
| Grid address with an Apt unit of letter and digits | yes | yes | shape 23 |
| A direction word as the street name | yes | yes | shape 24 |
| Prefix directional written with periods (S.E.) | yes | yes | shape 25 |
| Fractional house number | yes | yes | shape 26 |
| Lowercase lone letter after the comma, joined to the city | yes | yes | shape 27 |
| State spelled out in full, no comma before the city | yes | yes | shape 28 |
| ZIP+4 with a hyphen | yes | yes | shape 29 |
| ZIP+4 run together as nine digits | yes | yes | shape 30 |
| ZIP+4 with a space | yes |  | shape 31 |
| No house number, ZIP+4 with a space | yes |  | shape 32 |
| A unit word with no number (lobby) before the ZIP | yes | yes | shape 33 |
| The same wrapped in parentheses | yes | yes | shape 34 |
| Pound-sign unit written before the house number | yes | yes | shape 35 |
| Unit designator glued to its number and written first (lt42) | yes | yes | shape 36 |
| Numbered county road | yes | yes | shape 37 |
| Numbered county highway in capitals with a letter glued to the number (60E) | yes | yes | shape 38 |
| House number, directional with a period, street only | yes | yes | shape 39 |
| Whole address in single quotes, comma before an abbreviated suite | yes | yes | shape 40 |
| Row as the street type | yes |  | shape 41 |
| Post office box spelled out in words | yes |  | shape 42 |
| Post office box with periods | yes |  | shape 43 |
| Post office box run together (POBox) | yes |  | shape 44 |
| Wisconsin grid number with commas | yes |  | shape 45 |
| Wisconsin grid number without commas | yes |  | shape 46 |
| Wisconsin grid number in lowercase | yes |  | shape 47 |
| Street type Common or Cmn (full word and abbreviation), two-word street name | yes |  | shape 48, shape 49 |
| Street type Commons or Cmns (plural, full word and abbreviation) | yes |  | shape 50, shape 51 |
| Street type Crossroad or Xrd (full word and abbreviation) | yes |  | shape 52, shape 53 |
| Street type Crossroads or Xrds (plural, full word and abbreviation) | yes |  | shape 54, shape 55 |
| Street type Fall (singular) | yes |  | shape 56 |
| Street type Falls or Fls (full word and abbreviation) | yes |  | shape 57, shape 58 |
| Street type Land | yes |  | shape 59 |
| Two-word street name with Mall as the type | yes |  | shape 60 |
| Two-word street name with Mews as the type | yes |  | shape 61 |
| Pass as the type, state spelled out as two words | yes |  | shape 62 |
| Rue as an English street type | yes |  | shape 63 |
| Run as the street type | yes |  | shape 64 |
| Wall as the street type | yes |  | shape 65 |
| A town but no state and no ZIP (no state may be invented) |  | yes | shape 66 |
| Two capital letters that are not a state code (no state may be taken) |  | yes | shape 67 |
| No house number, street and a plain five-digit ZIP |  | yes | shape 68 |
| House number led by a letter (E412) |  | yes | shape 69 |
| House number with a directional letter glued after it (412E) |  | yes | shape 70 |
| Ampersand, no types, no comma before the city (intersection) | yes | yes | intersections.json: `Larch & Bellamy Baton Rouge LA` |
| Ampersand, no types, comma before the city (intersection) | yes | yes | intersections.json: `Larch & Bellamy, Baton Rouge LA` |
| "and" between two typed streets, city and state (intersection) | yes | yes | intersections.json: `Larch St and Bellamy St Baton Rouge LA` |
| "and" between two typed streets, no city or state (intersection) | yes |  | intersections.json: `Larch St and Bellamy St` |
| Ampersand between two typed streets, city and state (intersection) | yes | yes | intersections.json: `Larch St & Bellamy St Baton Rouge LA` |
| One plural type shared by both streets (Sts) (intersection) | yes | yes | intersections.json: `Larch and Bellamy Sts Baton Rouge LA` |
| Shared plural type with a period (Sts.), ampersand (intersection) | yes | yes | intersections.json: `Larch & Bellamy Sts. Baton Rouge LA` |
| Shared plural type with a period, no city or state (intersection) | yes |  | intersections.json: `Larch and Bellamy Sts.` |
| Shared plural type spelled out (Streets) (intersection) | yes | yes | intersections.json: `Larch & Bellamy Streets Baton Rouge LA` |
| Two different full types (Avenue and Street) (intersection) | yes | yes | intersections.json: `Larch Avenue and Bellamy Street Baton Rouge LA` |

Shape cases are in `us/parse-address-shapes.json` (names like `shape 07`); the intersection shapes are in
`test-data/us/intersections.json`, because the corpus suites run `parseLocation` only and `parseIntersection` has its
own suite.

## Gap analysis: United States

The authority is USPS Publication 28. "Before" counts the hand-written inputs in `test-data/` (us, core,
canada and todo) that show the shape; the last column gives the todo cases now and, in brackets, when the
corpus was written, before the fixing pass.

| Shape (Pub 28) | Before | Corpus file and group | Cases | Todo now (before the fix) |
| --- | ---: | --- | ---: | ---: |
| Every primary street suffix (Appendix C1), in full | 34 types in all | `street-suffixes` fullWord | 206 | 0 (2) |
| Every standard suffix abbreviation | (included above) | `street-suffixes` abbreviation | 186 | 0 (3) |
| Common suffix spellings C1 maps (AV, BOULV, STR, HIWAY) | few | `street-suffixes` variantSpelling | 30 | 0 (0) |
| Predirectionals, 8 directions, abbreviated, in full, dotted | some | `directionals` prefix | 24 | 0 (0) |
| Postdirectionals, 8 directions, with and without a comma | some | `directionals` suffix | 24 | 0 (0) |
| Pre- and postdirectional together | 0 | `directionals` prefixAndSuffix | 4 | 0 (0) |
| Directional word as the street name (North St) | 1 | `directionals` directionalAsName | 11 | 0 (6) |
| Every secondary unit designator (Appendix C2), abbreviated | 13 designators | `secondary-units` abbreviated | 24 | 0 (8) |
| Designators in full | | `secondary-units` fullWord | 16 | 0 (4) |
| Designator after a comma | | `secondary-units` afterComma | 24 | 0 (17) |
| `#` as the designator | few | `secondary-units` poundSign | 4 | 0 (0) |
| Unit variants (Apt #, Apt., lettered, Florida FL) and unit first | few | `secondary-units` variants | 14 | 0 (5) |
| Fractional numbers | 2 | `primary-numbers` fractions | 5 | 0 (0) |
| Numbers with a letter (123A) | 0 | `primary-numbers` lettered | 4 | 0 (4) |
| Number ranges (912-914) | few | `primary-numbers` ranges | 3 | 0 (0) |
| Queens and Hawaii hyphenated numbers | 2 | `primary-numbers` hyphenated | 6 | 0 (0) |
| Utah grid (48 S 400 E) | 6 | `primary-numbers` grid | 6 | 0 (0) |
| Wisconsin grid (W204N11912) | 5 | `primary-numbers` wisconsinGrid | 5 | 0 (0) |
| Numbers spelled out (One Microsoft Way) | few | `primary-numbers` written | 3 | 0 (3) |
| Ordinal and spelled-out numbered streets | some | `street-names` ordinal | 22 | 0 (0) |
| Bare-number streets (83 St) | 0 | `street-names` numeric | 4 | 0 (0) |
| Route-numbered roads (US Hwy 431, County Rd 45) | 6 | `street-names` routeNumbered | 6 | 0 (0) |
| Suffix words used as the name (Park Ave, Court St) | few | `street-names` suffixWordAsName | 8 | 0 (0) |
| Streets with no suffix (Broadway, Avenue A) | few | `street-names` noSuffix | 5 | 1 (3) |
| Names of several words, apostrophes, St. for Saint | some | `street-names` multiword | 10 | 0 (3) |
| PO Box spellings (P.O., Post Office Box, POBox, Box, POB) | 9 | `po-box-and-rural` poBox | 12 | 0 (3) |
| Private mailbox (PMB) | 0 | `po-box-and-rural` privateMailbox | 3 | 0 (3) |
| Rural route (RR, R.R., Rural Route, RFD) | 4 | `po-box-and-rural` ruralRoute | 7 | 0 (7) |
| Highway contract route (HC, Star Route) | 1 | `po-box-and-rural` highwayContract | 4 | 0 (4) |
| General delivery | 5 | `po-box-and-rural` generalDelivery | 6 | 0 (1) |
| Military: APO, FPO, DPO with AA, AE, AP | 0 | `military` | 14 | 0 (14) |
| Puerto Rico urbanizations and Spanish-order streets | 0 | `territories` puertoRico | 7 | 0 (4) |
| Guam, Virgin Islands, American Samoa, Northern Marianas, freely associated states | 0 | `territories` islands | 11 | 0 (1) |
| Every state, DC and territory by code, by name, without commas | most codes | `states` | 168 | 0 (2) |
| ZIP, ZIP+4 with hyphen, run together, with spaces; leading zeros | 30 with hyphen | `zip-codes` | 18 | 0 (1) |
| Lowercase and capitals | 10 lowercase, 0 capitals | `formatting` letterCase | 16 | 0 (0) |
| Punctuation variants | some | `formatting` punctuation | 6 | 0 (2) |
| No commas, extra spaces | some | `formatting` spacing | 16 | 0 (4) |
| Multiline (LF and CRLF), unit on its own line | 4 | `formatting` multiline | 19 | 0 (1) |
| Trailing country (USA, United States, U.S.A.) | 0 | `formatting` trailingCountry | 12 | 0 (11) |
| parse-address's and Geo::StreetAddress::US's shapes, original inputs | 23 in compatibility.json | `parse-address-shapes` | 70 | 0 (8) |
| libpostal's US fixtures | 0 | `libpostal-fixtures` | 40 | 0 (23) |
| Inputs that are not addresses | 7 | `null-cases` | 9 | 0 (1) |

Not covered, on purpose: intersections (`parseIntersection` has its own suite), strict mode and postal
validation (their own suites), and addresses with a recipient or attention line, which Pub 28 places above
the delivery address and this parser does not model.

## Gap analysis: Canada

The authority is Canada Post's Addressing Guidelines.

| Shape (Canada Post) | Before | Corpus file and group | Cases | Todo now (before the fix) |
| --- | ---: | --- | ---: | ---: |
| English street types in full (116 types) | a dozen | `street-types` english | 116 | 0 (7) |
| English types by Canada Post's abbreviation | few | `street-types` englishAbbreviation | 48 | 0 (6) |
| French street types before the name (29 types) | Rue, Ch, Place, Promenade, Square | `street-types` french | 29 | 0 (20) |
| French types abbreviated (av., boul., ch., crois., imp.) | 1 | `street-types` frenchAbbreviation | 5 | 0 (5) |
| Civic number with a letter or a half (123A, 123 1/2) | 0 | `civic-numbers` civicSuffix | 6 | 0 (3) |
| Unit before the civic number (4-123, Unit 4-123, #4-123, Apt 4, ...) | 0 (`53-55 Water Street` there was expected to be a range; it is now unit 53 at 55) | `civic-numbers` unitBeforeCivic | 24 | 0 (24) |
| Unit after the street, with and without a comma | some | `civic-numbers` unitAfterStreet | 18 | 0 (3) |
| French comma after the civic number (123, rue Principale) | 4 | `french` civicNumberComma | 24 | 0 (17) |
| Province in parentheses (Montréal (Québec)) | 0 | `french` provinceInParentheses | 7 | 0 (7) |
| French directionals (Est, Ouest, Nord-Ouest, O.) | few | `french` directionals | 10 | 0 (2) |
| French unit words (app., appartement, bureau, unité) | 2 | `french` units | 8 | 0 (8) |
| Saint abbreviated (St-Laurent, Ste-Foy) | few | `french` saints | 4 | 0 (0) |
| Postal code with and without the space, lowercase, hyphen, province run in | 4 unspaced | `postal-codes` formats | 9 | 0 (1) |
| Every first letter Canada Post assigns, rural codes | some | `postal-codes` firstLetter | 20 | 0 (0) |
| X codes split between NT and NU, and with no province | 7 X codes | `postal-codes` northwestTerritoriesAndNunavut | 8 | 0 (0) |
| Every province and territory by code | most | `provinces` code | 13 | 0 (0) |
| By English name | some | `provinces` englishName | 13 | 0 (0) |
| By French name | 0 | `provinces` frenchName | 7 | 0 (1) |
| Without commas | some | `provinces` noCommas | 13 | 0 (2) |
| Old and informal abbreviations (PQ, Que., NF, P.E.I.) | 0 | `provinces` alternative | 17 | 0 (4) |
| Rural routes (RR 2, R.R. 2, civic on a rural route) | 4 | `rural-and-postal` ruralRoute | 7 | 0 (7) |
| Site and compartment | 1 | `rural-and-postal` siteAndCompartment | 3 | 0 (3) |
| General delivery, GD, poste restante | 5 | `rural-and-postal` generalDelivery | 5 | 0 (2) |
| PO Box and CP with station, succursale, RPO | 8 | `rural-and-postal` postOfficeBox | 10 | 0 (4) |
| Numbered highways and Quebec routes | some | `highways-and-concessions` highways | 7 | 0 (4) |
| Concession and lot, lines, numbered rural roads | 0 | `highways-and-concessions` ruralRoads | 10 | 0 (1) |
| Lowercase and capitals | few | `formatting` letterCase | 16 | 0 (0) |
| No commas, postal code unspaced | some | `formatting` spacing | 16 | 0 (2) |
| Canada Post's printed block, two lines | few | `formatting` multiline | 16 | 0 (0) |
| Trailing Canada, after a comma and on its own line | 0 | `formatting` trailingCountry | 16 | 0 (16) |
| libpostal's Canadian fixtures | 0 | `libpostal-fixtures` | 3 | 0 (1) |
| Inputs that are not addresses | 7 | `null-cases` | 5 | 0 (0) |

## Parity with parse-address

`parse-address-parity.test.ts` runs every corpus input through `parse-address` and through `parseLocation`
and compares the eleven fields both report, on a common spelling (case folded, `Apt` and `Apartment` the
same unit). The figures are in `test-data/corpus/parity.json` and in the test's title:

- **Raw parity: 7,568 of 9,923 fields agree (76.3%)**, and 979 of 1,605 inputs agree on every field
  (before the fixing pass: 7,326 of 9,772, 75.0%, and 904 inputs). This is reported, not held: a field
  both parsers got wrong in the same way and address-plus now gets right lowers it.
- **Compatibility: of the 7,565 field values parse-address gets right, address-plus also gets all 7,565
  right (100%)**; before the fixing pass it was 7,282 of 7,563 (96.3%). This is the gate. It may only
  rise; after an improvement, record it with
  `CORPUS_PARITY_RECORD=1 pnpm exec vitest run src/__tests__/corpus/parse-address-parity.test.ts`.

There are no drop-in regressions left: no field value parse-address gets right that address-plus does not.
The 283 there were when the corpus was written (secondary units DEPT, HNGR, KEY, PIER, SLIP, SPC, STOP and
TRLR and units after a comma, a trailing country, semicolons and a unit on the line above, libpostal's
venue-name and floor-first lines, the parse-address shapes, directional words used as the street name, PMB,
POB and PO Box ZIP+4) are all fixed.

## What the parser got wrong, and how each cause was fixed

The causes below are the brief the corpus left for the fixing pass, kept as the record of what was wrong.
The fixing pass took them in order; every one is fixed but part of cause 19, and 298 of the 299 todo cases
now assert. The table says how; the sections after it are the brief as it was written.

| Cause | Cases | Status | The fix |
| --- | ---: | --- | --- |
| 1. Unit designators missing | 32 | Fixed | Every Pub 28 designator, with `.`, `#` or `No.` before the value, and the French unit words (`UNIT_TYPE_KEYWORDS`, `src/patterns/address-patterns.ts`); HNGR is Hangar |
| 2. Trailing country | 28 | Fixed | Removed before parsing, and kept as the country (`src/utils/prepare-input.ts`) |
| 3. Rural and highway contract routes | 22 | Fixed | A parser of their own (`src/parsers/rural-route-parser.ts`), and an RR after a street or in a part of its own; new fields `highwayContract` and `compartment` |
| 4. Canadian unit-civic pair | 22 | Fixed | Split in a Canadian address only (see the conventions); a US hyphenated number stays whole |
| 5. Street type tables | 18 | Fixed | A USPS abbreviation stays itself; Canadian spellings map to the USPS word; Canada Post's own types known in full; Est is Estate outside Canada; NO and SO |
| 6. A unit in a comma part of its own | 16 | Fixed | Set aside before the city is chosen, with no-number designators and number-first floors |
| 7. Names re-cased | 15 | Fixed | A mixed-case word is kept as written; a lowercase particle stays lowercase (`src/utils/capitalization.ts`) |
| 8. APO, FPO and DPO | 14 | Fixed | A parser of its own (`src/parsers/military-parser.ts`); new field `military` |
| 9. French types with a period, missing types | 14 | Fixed | A type may end in a period; carré, cours, rond-point, allée, quai, parc, pointe and île added |
| 10. French civic number and comma; `\b` and accents | 13 | Fixed | The comma is dropped before parsing; word edges are Unicode lookarounds everywhere a state, city or type is matched (`src/patterns/word-boundary.ts`) |
| 11. City with no comma before it | 12 | Fixed | The street ends at its first type that a city can follow (`src/utils/split-city.ts`) |
| 12. Directional as the street name | 8 | Fixed | A directional followed only by a type is the name |
| 13. Number with a trailing letter | 8 | Fixed | `123A`, `2455-B`; a trailing N, S, E or W is still a directional (`412E`) |
| 14. PO box variants | 8 | Fixed | Box and POB are PO Box, case postale is CP, STN is a station, ZIP+4 split; GD and poste restante are general delivery |
| 15. Province in parentheses | 8 | Fixed | Rewritten as the code before parsing |
| 16. Unit before the street line | 6 | Fixed | Moved after the street before parsing |
| 17. Types that are also unit words | 6 | Fixed | A designator is a unit only with a value, or, with none, after a street type |
| 18. Comma between state and ZIP | 5 | Fixed | Joined before parsing |
| 19. A type or unit word inside a name | 5 | 4 fixed, 1 left | Outside Canada and Puerto Rico a type before the name is part of it (`Avenue A`, `Avenue of the Americas`); a unit needs a value, so `Old Post Office Rd` is a street. `1 Bowling Green` is left: see below |
| 20. Province spellings | 5 | Fixed | PQ, Que., NF and Nfld. added; accents no longer break the match |
| Smaller causes | 34 | Fixed | A place's name before the number; urbanization in `locality`; runs of spaces; PMB; numbers spelled out; semicolons and a spaced dash; number-first floors; D.C. with periods; Canadian highways with a direction; a unit after a grid street; FL after General Delivery; `N/A`; quotes; a street with no number; a county part |

### What is still wrong

`1 Bowling Green, New York, NY 10004` gives street `Bowling`, type `Grn`, where the corpus wants the whole
`Bowling Green` with no type. Green is a Publication 28 suffix, and nothing in the address tells this
street from `12 Maple Green`; telling them apart needs a list of named streets, which this library does
not carry. The case stays todo.

Each todo case below was counted once, under its first cause in this list; a case can suffer from more than
one. Counts are cases (US + Canada). Inputs are quoted exactly; outputs leave out `zipValid`, `unit` and
`country`. The pointers said where the behaviour lived, as a starting point only.

### 1. Secondary unit designators missing from the unit pattern: 32 (US 26, CA 6)

`UNIT_TYPE_KEYWORDS` in `src/patterns/address-patterns.ts` lacks DEPT, HNGR, KEY, PIER, SLIP, SPC/SPACE,
STOP and TRLR/TRAILER, though `SECONDARY_UNIT_TYPES` knows most of them; it also lacks the French app.,
appartement, bureau and unité, and does not accept a period (`Apt.`), `Apt #` or `Apt No.`. The unit then
stays inside the street. `SECONDARY_UNIT_TYPES` spells HNGR as `Hanger` (USPS: Hangar).

- `7055 Sycamore St Dept 2, Boston, MA 02108` gives street `Sycamore St Dept 2`, no type, no unit.
- `444 South 5th St Apt. 3A Brooklyn, N.Y. 11211` gives street `5th St Apt. 3A Brooklyn`.
- `123 Main St Apt #456 Oakland CA 94789` gives street `Main St Apt`, unit `#` `456`.

### 2. A trailing country stops the last line being read: 28 (US 12, CA 16)

Nothing removes `USA`, `United States`, `U.S.A.` or `Canada` from the end, so the last comma part holds no
ZIP and everything after the street becomes the city.

- `742 Evergreen Ter, Springfield, IL 62704, USA` gives city `Springfield, IL 62704, USA`, no state or ZIP.
- `301 Front St W\nToronto ON  M5V 2T6\nCANADA` gives city `Toronto ON  M5V 2T6, CANADA`.
- `123 Main St, Springfield, IL 62701\nUnited States of America` gives city `Springfield, IL 62701, United States of America`.

### 3. Rural route and highway contract addresses not recognised: 22 (US 11, CA 11)

RR, R.R., Rural Route, RFD, HC, Highway Contract, Star Route and SITE/COMP are not parsed; `rr`,
`ruralRoute` and `site` exist on `ParsedAddress` but only the PO box parser fills `rr`, and only after a box.

- `RR 2 Box 152, Fargo, ND 58102` gives street `RR 2 Box 152`.
- `1234 River Rd RR 2, Lakefield ON K0L 2H0` gives street `Rd Rr 2`, type `Riv`.
- `Site 6 Comp 10 RR 8, Millarville AB T0L 1K0` gives no `site` and no `rr`.

### 4. Canadian unit-civic pair not split: 22 (CA 22)

Canada Post writes the unit first, joined by a hyphen (`4-123 Main St`). The parser reads `4-123` as a
number range, and with a designator (`Unit 4-123`) moves the designator to `place`.

- `4-123 Main St, Toronto ON M5H 2N2` gives number `4-123`, no unit.
- `Unit 4-123 Main St, Toronto ON M5H 2N2` gives number `123`, place `Unit 4`, no unit.
- `Apt 4, 123 Main St, Toronto ON M5H 2N2` gives street `4`, city `123 Main St`.

See the open question on ranges below: `canada/basic.json` expects `53-55 Water Street` to be a range.

### 5. Street type table gaps and inconsistencies: 18 (US 3, CA 15)

`normalizeStreetType` (`src/utils/street-type-normalizer.ts`) maps a word through the US table, then the
Canadian one, so the same type comes out differently by spelling: `Park` gives `Park` but `Pk` gives `Pk`
(also `Landng`, `Villge`, `Exten`, `Crnrs`, `Cross`, `Harbr`). Uppercase `CT` comes out `Crt`. Canada Post's
Circuit, Cul-de-sac and Diversion are known only abbreviated; croissant, terrasse and cercle get English
forms; the suffix EST (Estate) is read as the directional E; French Nord-Ouest and Sud-Ouest give `NW` and
`SW`, not Canada Post's `NO` and `SO`.

- `4090 Magnolia Ct, Anchorage, AK 99501` gives type `Crt`.
- `5074 Willow Est, Atlanta, GA 30303` gives suffix `E`, no type.
- `2354 Cedarvale Pk, London, ON N6A 4L9` gives type `Pk` where `Cedarvale Park` gives `Park`.

### 6. A unit in a comma part of its own: 16 (US 12, CA 4)

A designator with no number (BSMT, FRNT, LBBY, LOWR, OFC, PH, REAR, SIDE, UPPR) in its own comma part is
dropped; before a Canadian postal code, the comma part before the last is taken as the city
unconditionally, so a unit there becomes the city; a floor written number first is not a unit.

- `5707 Hawthorne St, Bsmt, Austin, TX 78701` gives no unit.
- `123 Main St, Unit 4, Toronto ON M5H 2N2` gives city `Unit 4`.
- `Planned Parenthood, 44 Court St, 6th Floor, Brooklyn 11201` gives city `6th Floor`, state `BROOKLYN`.

### 7. Street and place names re-cased: 15 (US 2, CA 13)

`capitalizeStreetName` capitalizes French particles that Canada Post keeps in lowercase, and lowercases
letters after an apostrophe.

- `2 rue des Jardins, Québec QC G1R 4S9` gives street `Des Jardins`.
- `900 place d'Youville, Québec QC G1R 3P7` gives street `D'youville`.
- `1 O'Farrell St, San Francisco, CA 94108` gives street `O'farrell`.

### 8. APO, FPO and DPO not recognised: 14 (US 14)

AA, AE and AP are not state codes, and APO, FPO and DPO are not read as the city.

- `PSC 802 Box 74, APO AE 09499` gives street `PSC 802 Box 74`, state `APO AE`, no city.
- `Unit 2050 Box 4190, APO AP 96278` gives unit `Unit 2050`, street `Box 4190`, state `APO AP`.
- `USS George Washington CVN 73, FPO AP 96616` gives state `FPO AP`, no city.

### 9. French street types: abbreviations with a period and missing types: 14 (CA 14)

`av.`, `boul.`, `ch.`, `crois.` and `imp.` are not recognised with their period, and carré, cours,
rond-point, allée, quai, parc, pointe and île are not in the tables at all; the type then stays in the street.

- `1100 boul. René-Lévesque O., Montréal QC H3B 4N4` gives street `boul. René-Lévesque`, no type.
- `4745 carré Sainte-Catherine, Montréal QC H2Y 1C6` gives street `carré Sainte-Catherine`.
- `1744 quai de la Montagne, Trois-Rivières QC G9A 5H3` gives street `quai de la Montagne`.

### 10. French civic number followed by a comma: 13 (CA 13)

Canada Post's French form puts a comma after the civic number. The parser splits on it, so the number
becomes the street and the street the city. With an accented city it also finds the state AL (next item).

- `275, rue Notre-Dame Est, Montréal QC H2Y 1C6` gives street `275`, city `rue Notre-Dame Est`, state `AL`.
- `2, rue des Jardins, Québec QC G1R 4S9` gives street `2`, city `rue des Jardins`.
- `1, promenade Sussex, Ottawa ON K1A 0A2` gives street `1`, city `promenade Sussex`.

Hidden inside this and the next items: **accented letters break word boundaries.** `\b` in the state
patterns treats `é` as a non-word character, so the `al` at the end of `Montréal` is read as Alabama
(7 corpus cases come out with state `AL`), and `CITY_PATTERNS` in `src/patterns/location-patterns.ts`
match `[A-Za-z]` only, so `Québec` and `Montréal` cannot be found as a city without a comma.

### 11. City with no comma before it: 12 (US 7, CA 5)

Without a comma the city is found by `CITY_PATTERNS` (one or two ASCII words), so a city of three words,
with an accent, an apostrophe or a suffix word is swallowed by the street, or a unit before it is.

- `1600 Amphitheatre Pkwy Mountain View CA 94043` gives street `Amphitheatre Pkwy Mountain`, type `Vw`.
- `1005 N Gravenstein Hwy Suite 500 Sebastopol, CA` gives street `Gravenstein Hwy Suite 500 Sebastopol`.
- `3127 Birchwood St Québec QC G1R 4S9` gives street `Birchwood St Québec`.

### 12. A directional word that is the whole street name: 8 (US 8)

Pub 28 treats a directional that is the only word before the suffix as the street name. The parser takes
it as a predirectional and the suffix as the street.

- `100 South St, Philadelphia, PA` gives prefix `S`, street `St` (parse-address gets this right).
- `1663 Northwest Hwy, Nashville, TN 37219` gives prefix `NW`, street `Hwy`.
- `1011 South Dr, Indiana, Pennsylvania 15705` gives prefix `S`, street `Dr`.

### 13. Civic number with a trailing letter: 8 (US 5, CA 3)

`123A`, `2455-B` and `4A-123` are not read as numbers; the number pattern accepts `\w\d+\w\d+` (the
Wisconsin form) but not a number followed by one letter.

- `123A Maple Ave, Seattle, WA 98101` gives street `123a Maple`, no number.
- `2455-B W BENCH RD OTHELLO WA 99344` gives street `2455-B W Bench`.
- `123A Main St, Toronto ON M5H 2N2` gives street `123a Main`.

### 14. Post office box variants: 8 (US 3, CA 5)

`Box` alone stays `Box` and `case postale` stays `Case Postale`; `POB` is unknown; a PO box's ZIP+4 is
not split; `STN` and `Stn` are not read as a station; `GD` and `poste restante` are not general delivery.

- `PO Box 1, Seattle, WA 98103-0001` gives zip `98103-0001`, no plus4.
- `PO BOX 4001 STN A\nTORONTO ON  M5W 1H8` gives city `STN A\nTORONTO ON`, no station or state.
- `Poste restante, Gatineau QC J8X 3Y9` gives street `Poste restante`, no general delivery.

### 15. Province in parentheses: 8 (CA 8)

The traditional French form `Montréal (Québec)` is not read; the parentheses stay in the city and, for
Montréal, the state comes out AL.

- `275 rue Notre-Dame Est, Montréal (Québec) H2Y 1C6` gives city `Montréal (Québec)`, state `AL`.
- `25 rue Laurier, Gatineau (Québec) J8X 3Y9` gives city `Gatineau (Québec)`.
- `110 avenue Laurier Ouest, Ottawa (Ontario) K1P 1J1` gives street `Laurier Ouest`, no suffix.

### 16. Unit written before the street line: 6 (US 3, CA 3)

- `Apt 4B, 1582 Elm St, Nashville, TN 37219` gives street `4B`, no number.
- `Apt 4\n123 Main St\nSpringfield, IL 62701` gives street `4`.
- `Apt 4, 123 Main St, Vancouver BC V5Y 1V4` gives street `4`, city `123 Main St`.

### 17. Street suffixes that are also unit words: 6 (US 3, CA 3)

KEY, TRAILER (TRLR), FRONT and GATE are suffixes in Pub 28 or Canada Post's list; after a street name and
before a comma they are read as units.

- `4993 Magnolia Key, Anchorage, AK 99501` gives unit `Key`, no type.
- `3081 Birchwood Gate, Ottawa ON K1P 1J1` gives unit `Gate`.

### 18. A comma between state and ZIP: 5 (US 4, CA 1)

- `1400 West Transport Road, Fayetteville, AR, 72704` gives city `AR`, no state.
- `10 Amelia Village Circle, Fernandina Beach, FL, 32034` gives unit `Floor`, no city or state.
- `1486 Bay St, Toronto ON, M5H 2N2` gives city `Toronto ON`.

### 19. A suffix or unit word inside a name: 5 (US 5)

- `100 Avenue A, New York, NY 10009` gives type `Ave`, street `A`.
- `1 Bowling Green, New York, NY 10004` gives street `Bowling`, type `Grn`.
- `77 Old Post Office Rd, Bristol, VT 05443` gives street `Old Post`, unit `Office` `Rd`.

### 20. Province spellings not recognised: 5 (CA 5)

`Île-du-Prince-Édouard`, `PQ`, `Que.`, `NF` and `Nfld.` come out as written, in capitals.

- `759 Water St, Québec, PQ G1R 4S9` gives state `PQ`.
- `4604 Frontenac St, Charlottetown, Île-du-Prince-Édouard C1A 4B7` gives state `ÎLE-DU-PRINCE-ÉDOUARD`.

### Smaller causes

| Cause | Cases | Example and what comes out |
| --- | ---: | --- |
| A place name before the number with no comma | 4 | `Barboncino 781 Franklin Ave Crown Heights Brooklyn NYC NY 11216 USA` gives street `Barboncino 781 Franklin Ave Crown Heights Brooklyn NYC NY 11216`, city `USA` |
| Puerto Rico urbanization goes to `place`, not `locality` | 4 | `URB Las Gladiolas, 150 Calle A, San Juan, PR 00926` gives place `URB Las Gladiolas` |
| Runs of spaces kept inside the street | 3 | `  4059  Mt  Lee  Dr ,  Hollywood ,  CA   90068  ` gives street `Mt  Lee` |
| Private mailbox (PMB) not a unit | 3 | `123 Willow St PMB 456, Denver, CO 80202` gives street `Willow St PMB 456` |
| Number spelled out | 3 | `One Microsoft Way, Redmond, WA 98052` gives place `One Microsoft Way`, street `Redmond` |
| Semicolons or a dash as separators | 2 | `123 Main Street; Springfield; IL 62701` gives street `Main Street; Springfield;` |
| Floor written number first | 2 | `30 W 26th St 6th Fl` gives street `26th St 6th`, state `FL` |
| State with periods loses the city | 2 | `1600 Pennsylvania Ave NW, Washington D.C. 20500` gives no city |
| Numbered highway with a directional | 2 | `1234 Hwy 7 E, Peterborough ON K9J 6X3` gives street `7 E`, no suffix |
| Utah grid address with a unit | 1 | `550 S 400 E #3206, Salt Lake City UT 84111` gives no unit (the author's parked case) |
| FL read as a floor after General Delivery | 1 | `General Delivery, Tampa FL 33602` gives unit `Floor` `33602` |
| Other single cases | 7 | `321 S. Washington` gives street `S.`, state `WA`; `30 w 26 st` gives suffix `ST`; `N/A` parses to street `N/A`; `'45 Quaker Ave, Ste 105'` keeps the quotes; `Canal Rd, Deltona FL` loses city and state; `4411 Stone Way North Seattle, King County, WA 98103` takes the county as the city; `Lot 12, Concession 4, Smiths Falls ON K7A 4S5` gives city `Concession 4` |

## Questions the fixing pass settled

1. **A Canadian `53-55`.** Canada Post's reading: unit 53 at civic 55, in a Canadian address, unless the
   address names a unit elsewhere. `canada/basic.json` and `canada/famous-addresses.json` were changed to
   it. See the conventions above.
2. **Canada Post or USPS abbreviations for Canadian types.** USPS, as the library always had them; Canada
   Post's `Crt`, `Lane`, `Trail` and `Terr` are a known divergence, noted in the conventions.
3. **Fields for parts with none.** `military` holds the military delivery line, `compartment` a site's
   compartment and `highwayContract` a highway contract route's number; a Puerto Rico urbanization stays
   in `locality`.
4. **Existing hand-written cases that held the old output.** Corrected to the right output wherever a
   fix changed them: among others `1005 N Gravenstein Hwy Suite 500 Sebastopol, CA` (street
   `Gravenstein`, unit `Suite 500`, city `Sebastopol`), `123 Maple Rochester, New York` (street `Maple`,
   city `Rochester`), `456 Rue Saint-Jacques Montréal QC` (street `Saint-Jacques`, city `Montréal`),
   `100 South St` (the street South), the rural route and highway contract cases, and the cleaning and
   formatting cases that wrote the unit before the number.

## The Japanese corpus

The corpus under `test-data/corpus/japan/` was written after 1.3.0, the same way: cases first, with what the
parser got wrong marked todo, then a fixing pass. It runs through `parseLocation`, as a user calls it, and the
Japanese module's own suites (`src/__tests__/japan/`) still test the formatters, validation and lookups.

### How a Japanese case is judged

The case shape and the judge are the ones above. The core fields are Japan's own, since the shared fields a
Japanese address fills (`state`, `city`, `street`, `number`, `zip`) only repeat them: `postalCode`, `prefecture`,
`municipality`, `streetDirections`, `town`, `chome`, `ban`, `go`, `building`, `floor`, `room` and `country`. A
case may also name `municipalityCode` (set to `null` when the municipality must not be identified), and may carry
`options` for `parseLocation`, which the US and Canadian cases never need.

### Conventions the expected values follow

- `prefecture` and `municipality` are the official names from the tables (Geolonia 住所データ), with the district
  for a town or village in one (`北佐久郡軽井沢町`), whatever form the input wrote them in: without the district,
  in romaji, with `ヶ` for `ケ` or an old form of a kanji (`飛驒市` is `飛騨市`). A municipality the tables do not
  know (an old city since merged away, a made-up name) is kept as written, with no code.
- `town` is kept as written, folded to one width, with its chome taken off. The library has no table of towns, so
  where Geolonia rewrites a town to its official spelling (`大字` added or dropped, `舟` for `船`, `澤` for `沢`),
  the corpus keeps the input's spelling and says so in the case's description. `大字`, `字` and `小字` stay in the
  town (`大字芝字宮根`), and a `小字` written straight after the town with no number is part of it (`西丹波町三五十`).
  Spaces inside a town are dropped (`藤橋町 亥` is `藤橋町亥`). A Hokkaido grid town keeps its `条` and direction
  (`北1条西`, `6条通`), and its `丁目` is the chome.
- Numbers are ASCII digits, whatever was written: full-width, kanji (`二十三`, `一〇一` read digit by digit), any
  of the dashes listed under `numerals-and-dashes`, `の` or `ノ`.
- The block: `chome`, `ban` and `go`, from the markers when they are written (`1丁目2番3号`, `2番地3`, Sakai's `3丁`
  for `3丁目`). Three hyphenated numbers are chome, ban and go; a fourth is the `room`, as is a number after a
  further dash (`6番23-2`). A pair is ban and go (`寿町2-31` is 2番31号): see cause 1 below. A go may lead with a
  letter (`14-イ22`, `14-A22`).
- Kyoto's street directions (`寺町通御池上る`) are reported in `streetDirections`, and the town after them is the
  `town`.
- What follows the block is the `building`, with its `floor` (`5`, `B1` for `地下1階` or `B1F`) and `room`
  (`501号室`, `501号` after a building, `#202`, or a number after a space) taken out.
- A romaji address keeps its town and building in romaji (`Marunouchi`, `Sample Bldg`), since the tables have no
  romaji for towns; its prefecture and municipality come back in kanji from the tables.

### Sources and licences

| Source | Licence | Used for |
| --- | --- | --- |
| Geolonia normalize-japanese-addresses, `test/addresses/addresses.csv` (github.com/geolonia/normalize-japanese-addresses, commit 4e694d6, checked 2026-10-09) | MIT, Copyright 2020 Geolonia Inc.; the notice is kept beside the files in `test-data/corpus/japan/LICENSE-geolonia.txt` | `geolonia-addresses.json`: 837 of its 7,191 real addresses, converted to this library's fields. Every tenth row in file order (704), every row Geolonia annotated with a note (48, their notes rendered in English in each description), and every row whose town is written otherwise than its official form or whose block carries a room (85). Ten rows are left out, each named with its reason in the conversion: what follows the town is not an address (`以下未定`, two buildings each with its own lot) or the town is not written at all. The inputs are Geolonia's; each case's source names its line. |
| Geolonia normalize-japanese-addresses, `test/main/main.test.ts` (same commit) | MIT | `geolonia-normalize.json`: the 38 inputs of their own shape tests (levels, 豊洲 written seven ways, lettered numbers, 藤橋町亥, old kanji, 小字), with this library's reading of each. |
| Geolonia 住所データ (github.com/geolonia/japanese-addresses), already the source of the tables (`pnpm data:jp`) | MIT | The official names of prefectures and municipalities every expected value uses. |
| Japan Post's guidance on writing an address (郵便番号・住所の書き方), the residence indication system (住居表示, Act on Residence Indication, 1962), and Kyoto City's explanation of its street-name addresses | Rules described in our own words; nothing copied | The shapes of the 243 original cases in the other nine files. Every input there is constructed: real towns, mostly city and ward offices, with made-up buildings (`サンプルビル`). |

The whole of Geolonia's file was also run through the converter once, outside the suite, as a check on the sample:
before the fixing pass 6,369 of the 7,059 rows it could convert came out right, and after it 7,028 (99.6%). Most of
the 31 left are the converter's own limits (a remainder such as `（Ａ棟），１６－１６（Ｂ棟）` it does not split, and
Geolonia's test file writing `鎌ケ谷市` where its own table has `鎌ヶ谷市`), not the parser's.

### Gap analysis

Before the corpus, `test-data/japan/` held about 70 hand-written parse inputs and the 1,000 generated records from
REST in Pieces, all written with the markers. The last column gives the todo cases now and, in brackets, when the
corpus was written.

| File | Group | What it covers | Cases | Todo now (before the fix) |
| --- | --- | --- | ---: | ---: |
| `geolonia-addresses` | sample | Every tenth of Geolonia's real addresses | 704 | 0 (56) |
| `geolonia-addresses` | notedByGeolonia | The rows Geolonia annotated: misspellings, 巿, spaces, 町 left out, Kyoto, buildings | 48 | 4 (18) |
| `geolonia-addresses` | writtenDifferently | Towns written otherwise than officially, rooms after the block | 85 | 5 (13) |
| `geolonia-normalize` | levels | Prefecture only, municipality only, made-up names, no place | 6 | 0 (0) |
| `geolonia-normalize` | toyosu | One block written eight ways | 8 | 0 (1) |
| `geolonia-normalize` | letteredNumbers | `14-イ22`, `14-A22`, `一四━Ａ二二` | 3 | 0 (3) |
| `geolonia-normalize` | nanao | A 小字, kanji numbers, spaces, no prefecture | 5 | 0 (3) |
| `geolonia-normalize` | textForms | NFKD input, a numeral inside a town, a lone number | 4 | 2 (2) |
| `geolonia-normalize` | oldKanji | 亞, 澤, 麩, 驒, さき | 10 | 0 (1) |
| `geolonia-normalize` | koaza | 小字 in kanji numerals | 2 | 0 (0) |
| `numerals-and-dashes` | kanjiNumerals | 一丁目二番三号, 十, 千二百三十四番地, 一〇一号室, numerals in names | 14 | 0 (4) |
| `numerals-and-dashes` | widths | Full-width and half-width digits, letters, spaces and katakana | 8 | 0 (0) |
| `numerals-and-dashes` | dashes | Sixteen dashes, ー between full-width digits, の, ノ | 19 | 0 (4) |
| `numerals-and-dashes` | markers | 丁目, 番, 番地, 号, 番地の, 丁, four numbers, a lettered go | 14 | 0 (5) |
| `postal-codes` | marked | 〒 with and without hyphen, widths, ー, at the end, alone, on its own line | 12 | 0 (0) |
| `postal-codes` | unmarked | No 〒, 郵便番号, 日本 first | 7 | 0 (0) |
| `buildings` | floors | 階, F, 地下, B1F, a number in a name, kanji floors | 10 | 0 (0) |
| `buildings` | rooms | 号室, 号, #, a fourth number, full-width | 9 | 0 (0) |
| `rural-and-districts` | oaza | 大字, 字, 小字, land lots | 9 | 0 (0) |
| `rural-and-districts` | districts | 郡 written or not, 府中町 against 府中市, a space after 郡 | 8 | 0 (2) |
| `kyoto-directions` | directions | 上る, 上ル, 上がる, 下る, 下ル, 東入, 西入, 東入ル, 西入る, 下立売通, town first | 15 | 0 (14) |
| `hokkaido-grid` | jo | 札幌's 条 and 丁目, 旭川's 条通, 帯広, romaji `1-jo` | 11 | 0 (0) |
| `designated-cities` | wards | All twenty designated cities with a ward | 20 | 1 (8) |
| `designated-cities` | withoutPrefecture | Five of them without the prefecture | 5 | 0 (1) |
| `designated-cities` | cityAlone | A city alone, a ward with only its prefecture, a space before the ward | 6 | 0 (3) |
| `tokyo-wards` | wards | All 23 wards | 23 | 0 (1) |
| `tokyo-wards` | withoutPrefecture | Five without 東京都 | 5 | 0 (0) |
| `tokyo-wards` | shortPrefecture | 東京 without 都, 日本 at the end | 2 | 0 (0) |
| `romaji` | englishOrder | Block first, chome as a word, macrons, case, lines, 〒 | 14 | 0 (2) |
| `romaji` | designators | -ku, -shi, -cho, -machi, -gun, City, Prefecture, -to | 12 | 0 (3) |
| `romaji` | japaneseOrder | Prefecture first, with and without commas | 2 | 0 (1) |
| `unknown-and-not-addresses` | oldNames | 浦和市, 清水市, 保谷市, Urawa-shi, 驒, ケ, 巿 | 7 | 0 (5) |
| `unknown-and-not-addresses` | misspelt | A made-up city and town, 東京部, 東京 alone, Tokio, 府中市 | 6 | 1 (3) |
| `unknown-and-not-addresses` | notAddresses | A greeting, 日本, kana, a US street named Tokyo, Tokyo, Japan | 5 | 0 (0) |

### What the parser got wrong, and how each cause was fixed

Each todo case was counted once, under its first cause in this list; a case can suffer from more than one (`藤橋町 亥 45-1` has a space in its town and a pair after it, and is counted under the pair).

| Cause | Cases | Status | The fix |
| --- | ---: | --- | --- |
| 1. A pair of numbers after a town without chome read as chome and ban (`寿町2-31` gave 2丁目31番) | 76 | Fixed | A bare pair is ban and go. Of the 907 addresses in Geolonia's file that end in a bare pair after the town, 899 are ban and go: a person in a town of chome writes all three numbers. A chome written as such is kept. The same in romaji (`58-9 Shirakaba-cho`). Three numbers in a 大字 town or with a first number of 100 or more are ban, go and a room. |
| 2. Kyoto street directions read as part of the town | 19 | Fixed | A new field, `streetDirections`, takes the locator up to its last direction (上る, 上ル, 上がる, 下る, 下ル, 東入, 西入, with or without る or ル); the town follows it, or comes before it and ends in 町. Only in Kyoto prefecture. `formatJapanese` and `formatJapaneseEnglish` write the directions back before the town. |
| 3. The town's own chome is needed | 10 | Left | See below. |
| 4. A space inside the municipality (`京都市 下京区`, `上北郡 横浜町`) | 6 | Fixed | The municipality is matched as if the spaces were not there, when that takes in more |
| 5. Kanji numerals not read before a dash (`四-2-27`), before 号室 (`一〇一号室`), or 階 read in `二階堂` | 6 | 5 fixed, 1 left | A numeral before a dash or 号室 is a number; 階 followed by a kanji is a name. `串本千二百三十四`, a number in kanji at the end with no marker, is left: see below |
| 6. 丁 written for 丁目 (Sakai's `3丁1番9号`) | 5 | Fixed | 丁 followed by a number, a dash or the end is a chome |
| 7. Look-alike or old characters in a municipality (巿, 驒, ケ for ヶ) | 4 | Fixed | 巿 (U+5DFF) becomes 市; ヶ, ヵ, 驒, 﨑 and 髙 are folded when municipality names are matched, never in what is returned (no two municipalities meet when folded) |
| 8. A town whose name holds a number and 番 (`和歌山市7番町`, `学校町通1番町`) | 4 | Fixed | 番 followed by 町 or 丁 does not start the block |
| 9. Dashes not read as dashes (─, ━, ⁃, ˗) | 4 | Fixed | Added to the dashes read between numbers |
| 10. Lettered numbers (`14-イ22`) | 4 | Fixed | A go may lead with a Latin or katakana letter |
| 11. Spaces inside the town (`藤橋町 亥`) | 1 | Fixed | Spaces between two letters of Japanese script in a town are dropped |
| 12. Separators left after the block (`6番23-2`, `1-4-1-レジデンス`) | 3 | Fixed | A number after a further dash is the room; a dash before a building is dropped |
| 13. A prefecture written short or misspelt (`千葉市川市`, `東京部`, `東京` alone) | 3 | 2 fixed, 1 left | With no prefecture in full, the reading that takes in more wins: 千葉 and 市川市 over 千葉市; a short prefecture alone is the prefecture. `東京部` (部 for 都) is left |
| 14. Romaji shapes | 6 | Fixed | Lines are parts; a prefecture, district, city or ward designator ends a part (`Tokyo-to Chiyoda-ku Marunouchi 1-2-3`); 〒 before romaji leaves it romaji; `Chiyoda City` makes an address Japanese; `Urawa-shi` is not taken for the ward 浦和区; a misspelt prefecture after the municipality is not a building. A JIS code in a street number (`Fl 34`) no longer makes a US address look Japanese |
| 15. A ward written with only its prefecture (`大阪府北区`) | 1 | Fixed | The ward of the city named like the prefecture, before any 北区 elsewhere |
| 16. Hamamatsu's 2024 wards | 1 | Left | See below |

### What is still wrong

Thirteen cases stay todo, for three reasons.

- **The town's own chome (10).** `東京都文京区小石川1` and `新潟県長岡市東坂之上町3` end in a lone number that
  Geolonia reads as the chome, because its table says those towns have chome; `岩手県花巻市12丁目704` is a town
  whose own name is 十二丁目; and `菅生ケ丘1-15-1`, `皇山町41-19-10` and `井田中ノ町41-25-2` are three numbers in towns
  with no chome. Telling these apart needs a table of every town that has chome. Geolonia's data has one (22,062
  towns), but it is about 230 KB of text, as large again as the municipality table, so it is not bundled; an
  opt-in table would be a separate entry point, a decision for a later version.
- **Hamamatsu's 2024 wards (1).** `浜松市中央区`, `浜名区` and `天竜区` date from 1 January 2024, and Geolonia's data,
  checked again on 2026-10-09, still lists the old seven wards. The README says so; the case passes when the data
  does.
- **Two inputs with nothing to go on (2).** `串本町串本千二百三十四` writes a land lot in kanji with no marker, and
  `東京部千代田区` misspells the prefecture's designator. Reading either would mean guessing at text that is just as
  often part of a name.

### Intersections

`parseIntersection` is not in the corpus, which runs `parseLocation`, and has its own suite
(`test-data/us/intersections.json`). Seven cases were added there for a gap found alongside: with no comma, the
city was the one or two words before the state, so `Main St and Pine St Tacoma WA` gave the city `St Tacoma` and
`Salt Lake City` lost a word. The second street now ends at its type, as a street address's does.

## The Australian corpus

The corpus under `test-data/corpus/au/` was written after 1.4.0 with the Australian module (`/au`). Unlike the others,
the parser came first: it was written from Australia Post's guidelines and AS4590, then the corpus was written from
the same rules without reading its output, and run. Five cases came out wrong; all five were fixed.

### How an Australian case is judged

The case shape and the judge are the ones above. Each case is read as a user with the module reads it:
`parseLocation(input, { country: "AU", countries: [australia, unitedKingdom] })`, the hint being the reliable path.
Whether the same address is recognised with no hint is the detection suite's question
(`src/__tests__/countries/detection.test.ts`): every case that ends with a state and an Australian postcode is, and no
US, Canadian or Japanese case is taken for Australian. The core fields are `building`, `secUnitType`, `secUnitNum`,
`floorType`, `floor`, `lot`, `number`, `street`, `type`, `suffix`, `city`, `state`, `zip` and `country`.

### Conventions the expected values follow

- `type` is AS4590's abbreviation in proper case (`St`, `Pde`, `Cres`, `Bvd`), whichever way it was written (`Parade`,
  `Boulevarde`, `Crs`, `Terr`). A street that is only `The` and a type, or a type alone (`The Esplanade`, `Broadway`),
  has no type: the whole is its name.
- `suffix` is AS4590's street suffix code (`N`, `NE`, `EX`, `UP`), and only when a comma or the end follows it. With no
  comma, a direction after the type starts the suburb (`100 Miller St North Sydney` is in North Sydney): suburbs named
  so are far more common than street suffixes.
- `secUnitType` is the unit type's word (`Unit`, `Apartment`, `Shop`, `Suite`) from AS4590's code or word (`U`, `Apt`,
  `Ste`); a unit before a slash with no type (`3/12`) is a `Unit`. A postal delivery is reported in Australia Post's
  form (`PO Box`, `GPO Box`, `Locked Bag`, `RMB`, `Care PO`) with its number in `secUnitNum`.
- `floorType` is the level type in words (`Level`, `Floor`, `Ground Floor`, `Lower Ground Floor`, `Basement`,
  `Mezzanine`), from AS4590's codes too (`L6`, `LG`, `B2`); `floor` its number.
- `city` is the suburb or town as written; `state` the state's code, whether written as a code, a name or with full
  stops (`N.S.W.`); `zip` the four digits.
- The edges of each block of postcodes are tested with a placeholder address in the state's capital: only the
  postcode's block matters to them.

### Sources and licences

| Source | Licence | Used for |
| --- | --- | --- |
| Australia Post's addressing guidelines and AS4590 (Interchange of client information), the codes of which the Address Presentation Standard uses | Rules and codes described in our own words; nothing copied | Every shape: street types and suffixes, unit, level and postal delivery types, the layout of the last line. Every input is constructed: real suburbs and postcodes, invented numbers and streets. |
| The UPU's addressing sheet for Australia, from Australia Post | Shapes only | Six cases are written in the shapes it shows (a level and number on one line, an RMB, a Locked Bag); the addresses are made up. |
| Australian Bureau of Statistics, ASGS Edition 3, Postal Areas | CC BY 4.0 | Which postcodes cross a border, for the `acrossBorders` group; the same data the validator reads. |

libpostal's fixtures hold no Australian address, so none is converted.

### Gap analysis

Before the module, address-plus read no Australian address: `parseLocation` gives `3/12 Smith St, Parramatta NSW 2150`
the number `3/12` and the city `Parramatta NSW 2150`, with no state, postcode or country, as it still does without the
module.

| File | Group | What it covers | Cases | Todo now (before the fix) |
| --- | --- | --- | ---: | ---: |
| `street-addresses` | numbers | A number, a letter, a range, a comma after it, a rural number | 7 | 0 (0) |
| `street-addresses` | layout | Commas or none, lines, two spaces, capitals, lower case, Australia, suburbs ending or starting in a street-type word | 20 | 0 (1) |
| `street-addresses` | streetTypes | 46 street types written in full | 46 | 0 (0) |
| `street-addresses` | abbreviations | 26 ways of writing them short | 26 | 0 (0) |
| `street-addresses` | suffixes | North, West, E, Extension, Upper, North East; a direction starting the suburb | 8 | 0 (0) |
| `units-and-levels` | slash | `3/12`, `3A/12`, `B/7`, a range, spaces, `Unit 3/12`, `U3/12`, `Flat 2/7` | 11 | 0 (0) |
| `units-and-levels` | unitTypes | Unit four ways, 19 more of AS4590's unit types (with Apt and Ste), a decimal suite | 26 | 0 (0) |
| `units-and-levels` | levels | Level, L, Floor, 3rd Floor, Ground, Basement, B2, LG, UG, Mezzanine | 13 | 0 (0) |
| `units-and-levels` | combined | A suite on a level, a building and a level, a shop in a centre | 6 | 0 (1) |
| `postal-delivery` | boxes | PO Box written six ways, GPO Box, a box-only postcode | 10 | 0 (0) |
| `postal-delivery` | bags | Locked Bag, Locked Mail Bag, Private Bag | 5 | 0 (0) |
| `postal-delivery` | rural | RMB, RMB on a highway, RSD, RMS, CMB, CMA, CPA, MS, Care PO, C/- Post Office | 12 | 0 (1) |
| `lots-and-roads` | lots | Lot 12 with and without a comma, a lettered lot, a lot on a highway | 5 | 0 (0) |
| `lots-and-roads` | roads | Highways, a road named for a mount, a suburb starting with Lane | 5 | 0 (2) |
| `states-and-postcodes` | codes | Every state by its code | 8 | 0 (0) |
| `states-and-postcodes` | names | Every state by its name | 8 | 0 (0) |
| `states-and-postcodes` | forms | Vic, Qld, Tas, N.S.W., W.A., a suburb named Victoria Park | 6 | 0 (0) |
| `states-and-postcodes` | blockEdges | The first and last postcode of every block | 24 | 0 (0) |
| `states-and-postcodes` | acrossBorders | Postcodes serving two states, the external territories | 7 | 0 (0) |
| `states-and-postcodes` | leftOut | No state, no postcode, neither, no suburb, the last line alone | 5 | 0 (0) |
| `null-cases` | notAnAddress | Words, a city, a state or a number alone | 8 | 0 (0) |

### What the parser got wrong, and how each cause was fixed

| Cause | Cases | Status | The fix |
| --- | ---: | --- | --- |
| 1. With no comma, a suburb whose first word is also a street type (`7 Main St Mount Druitt`, `88 River Rd Lane Cove`, `Mount Macedon Rd Mount Macedon`) | 3 | Fixed | A run of street-type words is one type (`Beach Park Rd`) unless it reaches a type that always ends a street (`St`, `Rd`, `Ave`, `Hwy` and eleven others), after which the suburb begins |
| 2. `C/- Post Office` not read as Care PO | 1 | Fixed | A postal delivery with no number is taken when it is any spelling of Care PO, not only one starting `Care` |
| 3. A building's name ending in a street-type word (`The Rocks Centre`) read as a street, then rewritten | 1 | Fixed | A part with no number before a part that holds the street is a building's name |

One convention was settled while writing the corpus rather than by a failing case: with no comma, a direction after
the street type (`100 Miller St North Sydney`) starts the suburb rather than being a suffix; with a comma it is the
suffix.

### What is still wrong

Nothing in the corpus. Not in it, and not read: corner addresses (`Cnr George and King Sts`), which are written
several ways and name two streets; and a suburb, with no comma, after a street with no type.

## The British corpus

The corpus under `test-data/corpus/gb/` was written after 1.4.0 with the British module (`/gb`), the same way as the
Australian one: the parser first, from Royal Mail's rules, then the corpus from the same rules, then a fixing pass.
Nine cases came out wrong; one was fixed, and eight are left, each for a reason below.

### How a British case is judged

Each case is read with `parseLocation(input, { country: "GB", countries: [australia, unitedKingdom] })`. The core
fields are the parts of Royal Mail's Postcode Address File and what the postcode tells: `subBuilding`, `secUnitType`,
`secUnitNum`, `floorType`, `floor`, `building`, `number`, `dependentThoroughfare`, `street`, `type`,
`doubleDependentLocality`, `locality`, `city`, `county`, `bfpo`, `zip`, `nation` and `country`. Every case with a
postcode in Royal Mail's grammar is also recognised with no hint, and no US, Canadian or Japanese case is taken for
British (the detection suite).

### Conventions the expected values follow

- `type` is the thoroughfare's descriptor in full (`Street`, `Road`, `Gardens`), as Royal Mail writes it, whichever way
  it was written (`St`, `Rd.`, `Gdns`); `street` is the rest. A street with no descriptor among the 69 the parser knows
  has no type (`Kingsway`, `Marygate`); `The` and a descriptor is a name (`The Green`, `The Blvd` as `The Boulevard`).
- `zip` is the postcode in capitals with one space; `zipValid` says whether it follows the grammar (an area Royal Mail
  does not use, `AA1 1AA`, still follows it). `nation` is the nation the postcode delivers to, from Code-Point Open, or
  for Northern Ireland from its area; with no postcode, the nation written at the end.
- `country` is `GB`, or `JE`, `GY` or `IM` for a postcode or a name of a Crown Dependency.
- A building's name that holds its number, before a thoroughfare (`14C Kingsley Tower, Elm Walk`), is the building's
  name, as the Postcode Address File keeps it; a number before a dependent thoroughfare (`2A Mill Cottages, Church
  Road`) is the number.
- `city` is the post town as written; a county after it is the `county`, never the town, and a town that shares a
  county's name (Durham) is the town.

### Sources and licences

| Source | Licence | Used for |
| --- | --- | --- |
| Royal Mail's addressing rules: the Postcode Address File's parts and the postcode format | Rules described in our own words; nothing copied | Every shape. Every input is constructed: real towns and postcode districts, invented numbers, streets and inward codes. |
| The UPU's addressing sheet for the United Kingdom, from Royal Mail | Shapes only | `paf-shapes.json`: one original address for each combination of parts Royal Mail's examples show. |
| libpostal `test/test_parser.c`, `test_gb_parses` and `test_im_parses` | MIT code; the inputs are third-party addresses | `libpostal-shapes.json`: all 29 British fixtures and the Manx one, each written again as an original address of the same shape (the same parts, order and punctuation, other names, numbers and inward codes), as parse-address's were. Each case's source names the fixture's line. |
| Ordnance Survey Code-Point Open | OGL v3 (contains Royal Mail data) | The nations the `nations` group expects, as the module reads them. |

### Gap analysis

Before the module, address-plus read no British address: `parseLocation` gives `10 Downing Street, London SW1A 2AA`
the type `St` and the city `London SW1A 2AA`, with no postcode or country, as it still does without the module.

| File | Group | What it covers | Cases | Todo now (before the fix) |
| --- | --- | --- | ---: | ---: |
| `postcodes` | formats | The six formats and GIR 0AA | 7 | 1 (1) |
| `postcodes` | writing | No space, lower case, two spaces, on its own line, before the town, after the street, no commas | 8 | 0 (0) |
| `postcodes` | notPostcodes | A first letter Q, C in the inward code, an area not in use | 3 | 0 (0) |
| `postcodes` | forces | BFPO with and without a space | 2 | 0 (0) |
| `postcodes` | crownDependencies | Jersey, Guernsey, the Isle of Man, Channel Islands written | 5 | 0 (0) |
| `postcodes` | nations | Northern Ireland, Scotland, Wales, districts on and across the borders | 8 | 0 (0) |
| `paf-shapes` | shapes | Each combination of PAF parts Royal Mail shows | 9 | 3 (3) |
| `sub-buildings` | numbered | Flat, Apartment, Apt, Unit, Studio, Suite, Maisonette, Glasgow's 2/1, Edinburgh's 1F2 | 13 | 0 (0) |
| `sub-buildings` | named | Basement, Ground Floor, Top Floor and Garden Flat | 4 | 0 (0) |
| `sub-buildings` | floors | 2nd Floor, Floor 3, Ground Floor, a studio on a floor | 4 | 0 (0) |
| `thoroughfares` | descriptors | 34 descriptors in full | 34 | 0 (0) |
| `thoroughfares` | abbreviations | 18 ways of writing them short | 18 | 0 (0) |
| `thoroughfares` | noDescriptor | Kingsway, The Strand, Broadway, The Green, The Blvd, Marygate | 6 | 0 (0) |
| `thoroughfares` | names | St at the start, Upper Street, High Street, a hyphen | 4 | 0 (0) |
| `thoroughfares` | numbers | A letter, a range, nought, a comma, thousands | 5 | 0 (0) |
| `localities-and-counties` | localities | A dependent locality, two, a London district | 3 | 0 (0) |
| `localities-and-counties` | counties | Ten counties in full and short, a town named like a county | 11 | 0 (0) |
| `localities-and-counties` | countries | UK, U.K., United Kingdom, Great Britain, a nation, a nation with no postcode, a town alone | 9 | 0 (0) |
| `libpostal-shapes` | shapes | libpostal's 29 British fixtures and its Manx one | 30 | 0 (2) |
| `null-cases` | notAnAddress | Words, a town or an outward code alone | 7 | 0 (0) |

### What the parser got wrong, and how each cause was fixed

| Cause | Cases | Status | The fix |
| --- | ---: | --- | --- |
| 1. A dependent locality read as a thoroughfare (`Leigh Hill`, `Lower Stanton`) | 3 | Left | See below |
| 2. A name run into the street with no comma (`Sovereign Retail Park Lottbridge Drove`, a whole address with no comma) | 3 | Left | See below |
| 3. A lone organisation's name before the town read as a street (`Girobank, Bootle`) | 1 | Left | See below |
| 4. A numbered building's name before a street with no descriptor (`8 Market Place Shopping Centre, Bondgate`) | 1 | Left | See below |
| 5. A building number with a minus sign (`-2 Abbey Road`, as libpostal writes one) | 1 | Fixed | The minus sign is kept with the number |

### What is still wrong

Eight cases stay todo, for one reason underneath: without Royal Mail's Postcode Address File, which is licensed and
not used, a name's part is known only from its words and its place.

- **A locality that looks like a thoroughfare (3).** `The Grange, Leigh Hill, REIGATE` names a dependent locality that
  ends in `Hill`, a thoroughfare descriptor, and `3 Lower Stanton, Chew Magna` numbers a double dependent locality as a
  street would be numbered. Royal Mail's own examples have both shapes; only its file tells them from a street.
- **A name run into the street (3).** With no comma, where a building's name ends and the street begins
  (`Sovereign Retail Park Lottbridge Drove`), or a locality and the post town (`Hoxton London`), is a guess.
- **A lone name before the town (1).** `Castle Head, Hinckley` is a street and `Girobank, Bootle` an organisation; the
  parser reads a lone name with no descriptor as a street, which libpostal's fixtures have more of.
- **A numbered building before a street with no descriptor (1).** `8 Market Place Shopping Centre, Bondgate`: the
  parser takes the numbered part for the street, since `Bondgate` has no descriptor to mark it as one.

## The French corpus

The corpus under `test-data/corpus/fr/` was written after 1.5.0 with the French module (`/fr`), the way the Australian and
British ones were: the parser first, from La Poste's rules, then the corpus from the same rules, then a fixing pass.
Eleven cases came out wrong when they were first run; every one was fixed, and none is left.

### How a French case is judged

Each case is read with `parseLocation(input, { country: "FR", countries: [australia, france, unitedKingdom] })`. The
core fields are the lines of La Poste's layout and what the postcode tells: `careOf`, `building`, `secUnitType`,
`secUnitNum`, `floorType`, `floor`, `staircase`, `entrance`, `number`, `numberExtension`, `type`, `street`, `lieuDit`,
`postalBoxType`, `postalBoxNum`, `city`, `arrondissement`, `cedex`, `state`, `zip` and `country`. A core field a case
does not name must be absent. Every case that ends with a country, holds a CEDEX or an arrondissement, or has a last line
of a postcode that names a department and a commune beside a French street, a box or a lieu-dit is also recognised with no hint,
and no US, Canadian, Japanese, Australian or British case is taken for French (the detection suite): 95% of the
French corpus is, the rest being addresses with no sign of their own (`12 Grande Rue, 25000 Besançon`).

### Conventions the expected values follow

- `type` is the type of voie in full, in French, with its accent (`Rue`, `Allée`, `Chaussée`, `Rond-point`), however it
  was written (`r.`, `av`, `Bd.`, `allee`); `street` is the name that follows it, in the case it was written in
  (`de la Paix`, `HAUSSMANN`). A street whose first word is no type (`Grande Rue`, `Le Vieux Port`) has no `type`.
- `numberExtension` is `bis`, `ter`, `quater` in lower case, or a letter in capitals; `number` keeps a range (`12-14`).
- `zip` is five digits; `state` is the department the number names (`75`, `2A` for Corsica's 20000 to 20199 and `2B` from
  20200, `971` overseas). A postcode of Monaco or of an overseas collectivity has no `state`, and the country is `MC`, `PM`,
  `BL`, `MF`, `WF`, `PF` or `NC`; the overseas departments and Saint-Barthélemy's and Saint-Martin's postcodes (which
  begin 971) are told apart by La Poste's base.
- `city` is the commune as written; the arrondissement of Paris, Lyon or Marseille written after it, or before it
  (`9e arrondissement Paris`), is the `arrondissement`, a number, and not part of the commune. A `CEDEX` is written
  `CEDEX 09` or `CEDEX` and is not part of the commune.
- A line above the street that is no delivery point, box or lieu-dit is the `building` (a residence, a tower, a zone,
  a company's name); after the street, it is the `lieuDit`, which is also where La Poste's fifth line puts the commune a
  box is in.
- A commune alone, or a commune and a country (`Annecy`, `Lille, France`), is not an address with a street: the first reads
  as none and the second as a commune with a country, as libpostal's fixtures have both.

### Sources and licences

| Source | Licence | Used for |
| --- | --- | --- |
| La Poste's addressing guidance and its specification SP 8855 (volume 2, "Adressage des plis"): the lines of an address and the types of voie it abbreviates | Rules described in our own words; nothing copied | Every shape. Every input is constructed: real communes with their real postcodes, invented numbers, streets and names. |
| libpostal `test/test_parser.c`, `test_fr_parses` | MIT code; the inputs are third-party addresses | `libpostal-shapes.json`: all seven French fixtures, each written again as an original input of the same shape (the same parts, order and punctuation, another commune). Each case's source names the fixture. |
| La Poste, Base officielle des codes postaux | Licence Ouverte 2.0 | The communes and postcodes the cases use, each checked against the base. |
| INSEE, Code officiel géographique | Licence Ouverte 2.0 | The departments the postcodes belong to, and the overseas collectivities. |

### Gap analysis

Before the module, address-plus read no French address: `parseLocation` gives `12 rue de la Paix, 75002 Paris` the
street `rue de la Paix`, the city `Paris` and the ZIP code `75002`, with no type, no state and no country, as it still does
without the module.

| File | Group | What it covers | Cases | Todo now (before the fix) |
| --- | --- | --- | ---: | ---: |
| `street-addresses` | types | 28 types of voie in full | 28 | 0 (0) |
| `street-addresses` | abbreviations | 17 ways of writing them short | 17 | 0 (0) |
| `street-addresses` | numbers | bis, ter, quater, a letter, glued or spaced, a range, N°, no number | 15 | 0 (0) |
| `street-addresses` | names | Apostrophes, a date in the name, capitals, no comma, a street with no type, line breaks, St for Saint | 15 | 0 (0) |
| `delivery-points` | apartments | Apt, Appartement, Appt., App, Porte, Bureau, n° | 8 | 0 (0) |
| `delivery-points` | floors | 3e, 3ème, 1er, Étage 2, Rez-de-chaussée, RDC, staircases and entrances | 11 | 0 (1) |
| `delivery-points` | buildings | Résidence, Bâtiment, Bât., Immeuble, Tour, Pavillon, a zone, a shopping centre, an entrance, a name before the street, a name run into the street | 14 | 0 (0) |
| `delivery-points` | careOf | Chez, c/o, the six lines of the specification together | 5 | 0 (0) |
| `postcodes-and-communes` | postcodeLine | With and without a comma, F- and FR-, the country after, on lines of its own, no postcode, no commune | 14 | 0 (2) |
| `postcodes-and-communes` | cedex | CEDEX with a number, without, with a box and with the country | 6 | 0 (0) |
| `postcodes-and-communes` | arrondissements | Paris, Lyon and Marseille, and a number that is not one | 7 | 0 (0) |
| `lieux-dits-and-boxes` | lieuxDits | After the street, before it, written, abbreviated, alone | 9 | 0 (2) |
| `lieux-dits-and-boxes` | boxes | BP, B.P., boîte postale, CS, TSA, with a street and a company, a five-digit box number, a box and the commune it is in | 11 | 0 (2) |
| `overseas` | departments | Guadeloupe, Martinique, Guyane, La Réunion, Mayotte, with the territory written after | 8 | 0 (1) |
| `overseas` | collectivities | Polynésie française, Nouvelle-Calédonie, Wallis-et-Futuna, Saint-Pierre-et-Miquelon, Saint-Barthélemy, Saint-Martin, Monaco | 10 | 0 (1) |
| `overseas` | corsica | 2A and 2B, and the border at 20200 | 4 | 0 (0) |
| `libpostal-shapes` | shapes | libpostal's seven French fixtures | 7 | 0 (2) |
| `null-cases` | notAnAddress | Nothing, a greeting, a sentence, a name, a commune | 7 | 0 (0) |

The "before the fix" figures count the cases that failed when they were first run: nine on the first run and two more
(the lieux-dits written before the street) when those cases were added. Seven causes lie under the eleven cases.

### What the parser got wrong, and how each cause was fixed

| Cause | Cases | Status | The fix |
| --- | ---: | --- | --- |
| 1. `F-75002` and `FR-75002`: the hyphen stopped the postcode being found | 2 | Fixed | Only a digit before the five digits rules them out |
| 2. `Fort-de-France` read as a commune `Fort-de-` and the country `France` | 1 | Fixed | France is not a country after a hyphen or after `de`, `la` or `le` |
| 3. `Boîte postale` with its accent not read as a box | 1 | Fixed | The box words match with and without the accent |
| 4. A company's name above a box read as a lieu-dit | 1 | Fixed | With a box and no street, the other lines are the building's |
| 5. A commune alone beside a country (`Lille, France`, `Papeete, Polynésie française`) | 3 | Fixed | A lone last part is the commune when a country is written |
| 6. `Rez-de-chaussée` capitalised into `Rez de chaussée` | 1 | Fixed | The ground floor's name is written, not derived |
| 7. A lieu-dit named before the street (`LD Les Prés`, `Lieu-dit Les Prés, 4 chemin du Moulin`) | 2 | Fixed | A line before the street that names a lieu-dit is the `lieuDit`, not the building |

The detection rule for a French address went through the same corpus: with a street and a postcode alone it recognised
87% of it, and with the boxes, the lieux-dits, the arrondissements and the letter extensions added 95%. The 5% it leaves are
the addresses with no sign but a postcode and a commune, and those with no commune at all.

### What is still wrong

Nothing in the corpus. What the parser cannot do without the commune and street lists it does not carry:

- **A name run into the street with no number between.** `Résidence du Parc rue Pasteur` with no comma reads the whole
  as the building's name: a number is the only mark of where the street begins, and without one a name and a type of voie
  cannot be told from a street called `Résidence du Parc`.
- **A street with a type in the middle.** `Grande Rue`, `Vieille Route de Gap` and `La Rue du Port` have no type of voie
  at their start, so the type is not taken and the street keeps the whole name, as `Le Vieux Port` does.
- **A commune and its postcode that do not belong together.** The base is not carried with its communes, so
  `75002 Lyon` is read as it is written.
- **The recipient.** A person's or a company's name above the address (La Poste's first line) is the `building`, since
  it comes before the street and is none of the other lines.

## The German corpus

The corpus under `test-data/corpus/de/` was written after the French one with the German module (`/de`), the same way:
the parser first, from Deutsche Post's rules and DIN 5008's layout as they are described publicly, then the corpus from the
same rules, then a fixing pass. Two cases came out wrong when they were first run; both were fixed, and none is left.

### How a German case is judged

Each case is read with `parseLocation(input, { country: "DE", countries: [australia, france, germany, unitedKingdom] })`.
The core fields are `careOf`, `building`, `secUnitType`, `secUnitNum`, `floorType`, `floor`, `street`, `number`, `locality`,
`city`, `state` (the Land the postcode is in) and `zip`, and `country`; a core field a case does not name must be absent.
Every case that ends with a country, or has a street that ends in a German suffix and its number with a postcode first on
the last line, or a Postfach, is also recognised with no hint (95% of the corpus is), and no case of any other country's
corpus is taken for German (the detection suite), nor a German case for French, Australian or British.

### Conventions the expected values follow

- `street` is the whole name of the street as it was written, suffix and all (`Hauptstraße`, `Hauptstrasse`, `Hauptstr.`,
  `Berliner Straße`, `Am Markt`, `Platz der Republik`): in German the type is part of the name, so there is no `type`.
- `number` is the house number with its letter in capitals (`12A`) or its range (`12-14`, `12/14`), spaces taken out; a
  number before the street (`12 Hauptstraße`) is the same number.
- A `Postfach`, a `Packstation` and a `Postfiliale` are the `secUnitType`, with the number (run together) in `secUnitNum`.
- A floor's number and kind are `floor` and `floorType` in full (`2` and `Obergeschoss` for `2. OG`); its side (`links`) is a
  `Wohnung` with that `secUnitNum` when no flat is named, and kept in the `building` beside a flat's number.
- `state` is the Land the postcode is in, from GeoNames' list; every postcode in the corpus is in it.
- `city` is the place as written, with its hyphen, brackets or river (`Halle (Saale)`, `Berlin-Mitte`); an Ortsteil is the
  `locality`, whether it follows `OT` after the place or has a line of its own after the street.
- A line above the street that is none of the others is the `building`, a firm's name among them; with a Postfach and no
  street it is the `building` too.

### Sources and licences

| Source | Licence | Used for |
| --- | --- | --- |
| Deutsche Post's addressing guidance and DIN 5008's layout | Rules described in our own words; nothing copied | Every shape. Every input is constructed: real places with real postcodes, invented streets, numbers and names. |
| libpostal `test/test_parser.c`, `test_de_parses` | MIT code; the inputs are third-party addresses | `libpostal-shapes.json`: all three German fixtures, each written again as an original input of the same shape. |
| GeoNames, postal code data for Germany | Creative Commons Attribution 4.0 | The postcodes and Länder the cases use, each checked against the list. |

### Gap analysis

Before the module, address-plus read no German address: `parseLocation` gives `Hauptstraße 12, 10115 Berlin` the street
`Hauptstraße 12`, the city `10115 Berlin`, and no postcode or country, as it still does without the module.

| File | Group | What it covers | Cases | Todo now (before the fix) |
| --- | --- | --- | ---: | ---: |
| `street-addresses` | suffixes | 20 suffixes, abbreviated, written with ss, and standing alone (Am Markt, Alter Hof) | 20 | 0 (0) |
| `street-addresses` | separateType | An adjective and a type, a name with no suffix | 5 | 0 (1) |
| `street-addresses` | prepositions | Am, An der, Auf dem, Im, Zum, Zur, Unter den, Bei der, Platz der, Straße des | 11 | 0 (0) |
| `street-addresses` | names | Hyphens, a title, umlauts and ue, capitals, a saint, line breaks, no comma | 10 | 0 (0) |
| `street-addresses` | numbers | A letter, a range, a slash, Nr., Hausnummer, four digits, none, first | 11 | 0 (0) |
| `delivery-points` | careOf | c/o, z. Hd., zu Händen, bei, and Bei der as a street | 6 | 0 (0) |
| `delivery-points` | flats | Wohnung, Whg., App., Zimmer, Büro, EG, OG, Etage, DG, UG, a side, a side beside a flat | 16 | 0 (0) |
| `delivery-points` | buildings | Hinterhaus, Haus B, a block, a firm, a name run into the street, everything together | 10 | 0 (0) |
| `postcodes-and-places` | postcodeLine | D- and DE-, the country after, lines of their own, hyphens, brackets, an Ortsteil, no postcode, no place | 21 | 0 (0) |
| `postfach-and-packstation` | boxes | Postfach in pairs, short, five digits, Nr., Pf., Packstation, Postfiliale, under a firm | 9 | 1 (1) |
| `lands` | capitals | One postcode in each of the sixteen Länder | 16 | 0 (0) |
| `lands` | borders | Six postcodes along the Länder's borders | 6 | 0 (0) |
| `libpostal-shapes` | shapes | libpostal's three German fixtures | 3 | 0 (0) |
| `null-cases` | notAnAddress | Nothing, a greeting, a sentence, a name, a place | 7 | 0 (0) |

### What the parser got wrong, and how each cause was fixed

| Cause | Cases | Status | The fix |
| --- | ---: | --- | --- |
| 1. A firm's name above a Postfach read as the locality | 1 | Fixed | With a box and no street, the other lines are the building's |
| 2. A name of an adjective and a noun with no suffix (`Große Bleiche`) | 1 | Fixed | The adjectives that begin a street's name (`Große`, `Kleine`, `Lange`, `Hohe`, `Breite`, `Schmale`, with `Alte` and `Neue`) are openers |

Beside the corpus, one detection case went wrong: `Allee der Kosmonauten 8, 10115 Berlin`, which begins with the French
type `Allee` written without its accent, was taken for French. The French detection now leaves a part that begins `Allee` and
ends in a number to Germany.

### What is still wrong

Nothing in the corpus. What the parser cannot do without a street list, which it does not carry:

- **A street of two words with no suffix, whose first word is no opener** (`Kurzes Eck 5`) is read as the street `Eck` and a
  building `Kurzes`: the first word begins a street's name only when it is a preposition or one of the adjectives the
  module knows (`Am`, `Alte`, `Große`). A street that is one word with no suffix (`Brunnen 3`) is read right.
- **Where a firm's name ends and the street begins with no comma.** `Hofgarten Brauerei Lindenallee 12` is read at the last
  word that ends with a suffix, or at the word before a type standing alone (`Kleiner Wall 3`): right for the streets
  that look like streets, and the same guess as above for the ones that do not.
- **A Bundesland written in the address.** Germans seldom write it, and the module does not read one: `state` is the Land the
  postcode is in.
- **Austria and Switzerland**, whose streets and numbers look German but whose postcodes are four digits, are not read.

## The Dutch, Spanish, Italian, New Zealand, Indian, Korean and Brazilian corpora

The four countries that came after Germany with their postcode tables (`/nl`, `/es`, `/it`, `/nz`) have one file each under
`test-data/corpus/nl/`, `es/`, `it/` and `nz/`, in groups by shape: the street and its number, the flats and floors, the line of
the postcode, the delivery lines (a box, a care-of line, a building) and the texts that are no address. Every case is original,
written from each postal service's public addressing guidance as described in our own words; nothing is copied. They are small
beside Germany's (94 cases for the four, against 151): the shapes are fewer, and each is held by a case. None went wrong when first
run that was not fixed on the spot (a street that ended in `dam`, which made `Amsterdam` a street; a care-of line `C/-`), and none is left todo.

Each case is read with `parseLocation(input, { country: <code>, countries: [...all eight modules] })`. The core fields of each
country are in `src/__tests__/corpus/corpus-support.ts`; a field a case does not name must be absent. With no hint, 17 of the 19
Dutch cases, 24 of the 25 Spanish, all 21 Italian and 4 of the 18 New Zealand ones are told, and the rest are left to the hint: a
New Zealand address is told only by its country at the end or by a Private Bag or a rural delivery, since four digits after a place
are written by Australia and others too. No case of any other corpus (the US, Canadian, Japanese, Australian, British, French,
German, and each other of the four) is claimed by any of the four (`src/__tests__/countries/detection.test.ts`), and the 2,723
US, Canadian and Japanese cases still give the same result with all eight modules handed in as with none.

The Indian, Korean and Brazilian corpora (22, 25 and 22 cases, one file each under `test-data/corpus/in/`, `kr/` and `br/`) are written the same
way, and each is read with its own module and hint. Korea's has Hangul and Latin cases in groups (road addresses, floors and units, the older
lot-number form, the postcode first or last, Latin letters); with no hint the Hangul cases and the Latin ones with a road, a province and a listed
postcode are told. Brazil's states are told from the CEP's range, checked against the 5,525 CEPs GeoNames lists. Two parsing faults were fixed
while writing them (a number on its own read as the city when the CEP stood alone; a state's name before the PIN read as the street's neighbour),
and none is left todo. No case of another corpus is claimed by any of the seven.

What the four do not read: the rest of the Netherlands' postcode (the two letters are not looked up, since CBS's list holds the
four digits), Dutch addresses with the house number before the street (`123 Keizersgracht`), Spanish addresses in two lines with
the province on the second, Italian addresses with the province written out, and New Zealand rural addresses with a locality
name in place of a street. Each is a case for a later corpus.

## Not done here

- Intersections are not in the corpus (above), nor are strict mode and postal validation, which have suites of
  their own.
- Australian corner addresses (`Cnr George and King Sts`) are not read, and so not in the corpus.
