# Countries Beyond the US, Canada and Japan

address-plus reads the US, Canada and Japan from its main entry point. Every other country is a module of its own,
from an entry point of its own, so it costs only the callers who import it. Australia (`/au`) and the United Kingdom
(`/gb`) are the first two, France (`/fr`) the third and Germany (`/de`) the fourth; the Netherlands (`/nl`), Spain (`/es`), Italy (`/it`)
and New Zealand (`/nz`) came after them, with their postcodes and the rules of their addresses and not much more. This document is the design they share, how an address finds
its country, where each country's data comes from and under what licence, and what to do to add the next one.

## The design

A country module is a `CountryModule`: its ISO 3166-1 codes, a detection function, and its parser, validator,
formatter and comparer.

```ts
interface CountryModule {
  code: string; // "AU"
  codes: readonly string[]; // ["GB", "JE", "GY", "IM"] for the British module
  name: string; // "Australia"
  detect(address: string): boolean; // whether the address is surely this country's, with no hint
  parse(address: string, options?: ParseOptions): ParsedAddress | null;
  validate(address: ParsedAddress, options?: ValidationOptions): CountryValidation;
  format(address: ParsedAddress): FormattedAddress;
  compare(first: ParsedAddress, second: ParsedAddress): CountryComparison;
}
```

Each entry point exports its module (`australia`, `unitedKingdom`) and the functions behind it, which can be called
directly (`parseAustralianAddress`, `validateUKAddress`, `formatRoyalMail` and the rest). The main entry point knows
no country module. It takes them in a new option, `countries`, on `parseLocation` and `validateAddress`:

```ts
import { parseLocation, validateAddress } from "@johnmorrisdotca/address-plus";
import { australia } from "@johnmorrisdotca/address-plus/au";
import { germany } from "@johnmorrisdotca/address-plus/de";
import { france } from "@johnmorrisdotca/address-plus/fr";
import { unitedKingdom } from "@johnmorrisdotca/address-plus/gb";

const countries = [australia, france, germany, unitedKingdom];

parseLocation("3/12 Smith St, Parramatta NSW 2150", { countries }); // read as Australian
parseLocation("10 Downing Street, London SW1A 2AA", { countries }); // read as British
parseLocation("12 bis rue de la Paix, 75002 Paris", { countries }); // read as French
parseLocation("Hauptstraße 12a, 10115 Berlin", { countries }); // read as German
parseLocation("100 Queen St W, Toronto, ON M5H 2N2", { countries }); // still Canadian, unchanged
parseLocation("12 Smith St, Parramatta", { country: "AU", countries }); // the hint: always Australian
validateAddress("1 Main St, Sydney VIC 2000", { countries }).warnings[0].code; // "POSTAL_REGION_MISMATCH"
```

What the core does with them is all in `src/country/pick.ts`, about 30 lines:

1. A hint (`country: "AU"`) naming a country the core does not read picks the module whose `codes` include it. If no
   module passed has it, `parseLocation` throws a `TypeError` that says how to pass one. A hint is a decision by the
   caller, so it is never quietly ignored.
2. With no hint (or `"auto"`), each module passed is asked in order whether the address is surely its country's; the
   first that says yes reads it.
3. Otherwise the core reads the address as before: Japan, then the US and Canada.

Without `countries`, nothing changes: every case of the US, Canadian and Japanese corpora (2,723) gives the same
result with all four modules passed as without them (`src/__tests__/countries/detection.test.ts` holds that).

**The hint is the reliable path.** Detection is written to be sure rather than to be clever: it says yes only on
signs that no address of another country carries, and an address without them falls through to the core. A caller
who knows the country (a form with a country field, a list from one country) should pass it.

### Size

Measured by bundling each entry point for the browser, minified, with esbuild:

| Entry point | Before (1.4.0) | After | Gzipped before | Gzipped after |
| --- | ---: | ---: | ---: | ---: |
| `@johnmorrisdotca/address-plus` | 582.5 KB | 583.2 KB | 104.6 KB | 104.9 KB |
| `/jp` | 325.1 KB | 325.1 KB | 61.8 KB | 61.9 KB |
| `/au` | | 16.3 KB | | 7.1 KB |
| `/gb` | | 19.5 KB | | 8.5 KB |
| `/fr` | | 27.6 KB | | 9.0 KB |
| `/de` | | 26.4 KB | | 11.8 KB |
| `/nl` | | 12.8 KB | | 5.3 KB |
| `/es` | | 27.2 KB | | 9.9 KB |
| `/it` | | 26.0 KB | | 8.6 KB |
| `/nz` | | 14.3 KB | | 6.2 KB |
| `/in` | | 38.7 KB | | 14.6 KB |
| `/kr` | | 49.4 KB | | 7.9 KB |
| `/br` | | 12.7 KB | | 5.3 KB |

The main entry point grows by 0.7 KB (the option and the picker); France added nothing to it. `/au`, `/gb`, `/fr` and `/de`
carry none of the US, Canadian or Japanese tables, nor each other's; `pnpm test:package` proves it on the packed
package. `/fr`'s 6,328 postcodes are 7.5 KB of text (1.4 KB gzipped) and `/de`'s 10,813 are 12 KB, packed as steps in base 36 and
unpacked the first time a postcode is looked up. The four later countries are packed the same way: `/nl`'s 4,070 four-digit areas
are 4.1 KB of text, `/es`'s 11,150 postcodes 11.6 KB, `/it`'s 4,736 postcodes 5.3 KB and `/nz`'s 1,737 postcodes 1.9 KB, `/in`'s 19,238 PIN codes 24 KB and `/kr`'s 34,249 postcodes 35 KB, each with the runs
of postcodes that share a province, region or state beside it (Spain's 52 runs, Italy's 143, New Zealand's 142, India's 93, Korea's 17). Brazil has no
table of postcodes: 27 states' ranges of the first five digits, written by hand, are 1 KB.

## How an address finds its country

| Country | Detected, with no hint, when the address | Never claimed |
| --- | --- | --- |
| Australia | ends with `Australia`, or with a state (code or name) and a four-digit postcode inside some state's block | a postcode alone; `WA` with a postcode outside Western Australia's block |
| United Kingdom | ends with the United Kingdom, a nation, Jersey, Guernsey or the Isle of Man; or holds `BFPO` and a number, or `GIR 0AA`; or holds, in its last two parts, a postcode in Royal Mail's grammar whose area Royal Mail uses | an outward code alone |
| France | ends with France, an overseas department, Monaco or an overseas collectivity; or holds `CEDEX` beside a five-digit code; or names an arrondissement of Paris, Lyon or Marseille; or its last line is a postcode whose number names a department, a collectivity or Monaco and a commune (`75008 Paris`) while the address has a French type of voie (`rue`, `avenue`, `chemin`) at the start of a street, a `BP`, a `TSA` or a `lieu-dit` | a five-digit code that follows a US state (`NY 10036`); a postcode and commune with no French sign (`10115 Berlin`); a number that names no department (`96000`, `99999`) |
| Germany | ends with Germany or Deutschland (or `DE`, `BRD`); or its last line is a five-digit postcode and a place (`10115 Berlin`, `D-10115 Berlin`) while the address has a street that ends in a German suffix (`Hauptstraße`, `Kastanienallee`, `Am Markt`, `Platz der Republik`) followed by its house number, or a `Postfach` or a `Packstation` | a five-digit code that follows a US state; a street that begins with its number; a postcode with nothing German beside it (`75002 Paris`); a four-digit code (Austria's and Switzerland's) |
| Netherlands | ends with the Netherlands, Nederland or Holland (or `NL`); or its last line begins with four digits and two letters, not SA, SD or SS, and a place (`1015 CJ Amsterdam`) | four digits alone; a line with a digit after the place |
| Spain | ends with Spain or España (or `ES`); or its last line is a five-digit postcode and a place while a part begins with a Spanish street's type (`Calle`, `C/`, `Avenida`, `Paseo`, `Plaza`, `Carrer`, `Rúa`) or is an Apartado de Correos, with no state's code before the postcode | a postcode alone; `Calle Ocho, Miami, FL 33135` |
| Italy | ends with Italy or Italia (or `IT`); or its last line is a five-digit postcode and a place while a part begins with an Italian street's type (`Via`, `Viale`, `Corso`, `Piazza`, `Largo`) or is a Casella Postale, with no state's code before the postcode | a postcode alone |
| New Zealand | ends with New Zealand or Aotearoa (or `NZ`); or ends with a place and a postcode the list has beside `Private Bag`, a rural delivery (`RD 2`) or Aotearoa | a place and four digits alone, which is how Australia and others write a postcode |
| India | ends with India (or `IN`); or ends with a PIN code after the word `PIN`; or after the name of a state or union territory with a PIN code the list has | six digits alone, which China, Russia and others write too |
| South Korea | ends with South Korea, Korea or 대한민국; or is in Hangul with a province's name, or a road and its number; or is in Latin letters with a road (`-ro`, `-daero`, `-gil`), a province's name and a listed postcode before the end | a five-digit postcode alone |
| Brazil | ends with Brazil or Brasil (or `BR`); or ends with a CEP written with its hyphen (`01310-200`) in a state's range | eight digits with no hyphen; a ZIP+4 (four digits after the hyphen) |
| Japan (core) | is in Japanese script, ends with Japan, or names a prefecture beside a Japanese postal code or a romaji designator | an address that only mentions a Japanese place |
| US and Canada (core) | everything else, by the state or province and the ZIP or postal code | |

The cases that look alike, and why they cannot be confused:

- **A British postcode and a Canadian postal code.** Both may start with a letter, a digit and a letter (`W1A`, `M5V`).
  A Canadian code ends in a digit (`M5V 1A1`: letter, digit, letter, digit, letter, digit); a British inward code is a
  digit and two letters (`0AX`). No string is both, so detection needs no guess.
- **An Australian postcode and a US ZIP code.** Four digits are not a ZIP code, but a ZIP code typed short is four
  digits. A state code before them decides it: `NSW`, `VIC`, `QLD`, `TAS`, `SA`, `NT` and `ACT` are not US states, so
  any Australian postcode after them is Australian. `WA` is also Washington's code, so after `WA` the postcode must be
  one of Western Australia's (6000 to 6999): `Seattle, WA 9810` stays American. `NT` is also Canada's Northwest
  Territories, whose postal codes are letters and digits, never four digits.
- **Australia's `3/12 Smith St` and Canada's `4-123 Main St`.** Both put a unit before the number, Australia with a
  slash and Canada with a hyphen, and in Australia a hyphen joins a range (`12-14`). The country is decided first, by
  the end of the address, and each country's parser reads its own form; the slash alone decides nothing, since a US
  address may hold a fraction (`123 1/2 Main St`).
- **A French postcode and a US ZIP code.** Both are five digits, and the module's hint is the only sure way to tell a
  bare one. With no hint, a ZIP code is told by where it stands: it follows its state (`Seattle, WA 98101`) and ends the
  address, while a French code comes first on the last line and a commune follows it (`75008 Paris`). That shape alone is
  not enough, since a German address has it too (`10115 Berlin`): detection also asks for a code whose number names a
  department (a code La Poste does not list, `75099`, still counts, so that a typo in a French address is read as French
  and flagged by the validator) and a French sign beside it, a type of voie at the start of a street, a box, a lieu-dit, a
  CEDEX or the country at the end. `100 Avenue of the Americas, New York, NY 10036` has the shape of a French street
  (`Avenue`) and a code that names a department (10 is the Aube) but a state before the code and no commune after it, so
  it stays American.
- **A German postcode and a French one.** Both are five digits, first on the last line, with the place after. The
  streets tell them apart: a German street ends in a suffix and is followed by its number (`Hauptstraße 12`, `Am Markt 5`),
  a French one begins with its number and a type of voie (`12 rue de la Paix`). The one type both languages share, `Allee`
  (German) and `allée` (French), is French only with its number first or its accent; `Allee der Kosmonauten 8, 10115 Berlin`
  is German. The detection suite holds each country's corpus away from the other's module.
- **Monaco, the overseas departments and the collectivities.** Monaco (postcode 98000) and the overseas collectivities
  (97500, 97133, 97150, 98600, 987xx, 988xx) are addressed by La Poste in the same way and have postcodes in the same
  base. The French module reads them and reports `country` as `MC`, `PM`, `BL`, `MF`, `WF`, `PF` or `NC`, the way the
  British module reports `JE`; its validator says so (`OUTSIDE_FRANCE`). The overseas departments (971 to 974 and 976)
  are French regions, so their country is `FR` and their `state` is their three-digit code.
- **Jersey, Guernsey and the Isle of Man.** They use Royal Mail's postcodes (`JE2 3AB`) but are not part of the United
  Kingdom: the British module reads them and reports `country` as `JE`, `GY` or `IM`, with no nation, and its validator
  says so (`OUTSIDE_UK`).

## Subdivisions: from kuni, copied when the tables are made

Australia's states and territories and the United Kingdom's four nations, with their ISO 3166-2 codes and names in
English and Japanese, come from kuni (`@johnmorrisdotca/kuni` 1.1.0). kuni is a pinned **devDependency**:
`pnpm data:countries` copies the twelve rows into `src/constants/au/states.data.ts` and
`src/constants/gb/nations.data.ts`. The alternative, importing kuni inside the `/au` and `/gb` entries, would have
made it a runtime dependency for everyone who installs the package, to read twelve rows that change once a decade.
The package keeps its one runtime dependency (`fast-levenshtein`).

Germany's sixteen Länder, with their ISO 3166-2 codes and names in English and Japanese, are kuni's, copied like Australia's
states. France's departments, regions and overseas collectivities are not kuni's: kuni 1.1.0 has France's regions and the
overseas territories as a whole, but not the 101 departments a postcode's first digits name. They come from INSEE's
Code officiel géographique, so `pnpm data:countries` reads two sources for France where it reads kuni for the other two.

Spain's 52 provinces (the fifty and Ceuta and Melilla, by their ISO 3166-2 codes without `ES-`), Italy's 107 provinces and other second-level
divisions (by their sigla, Aosta by `AO`, which ISO gives no province) and New Zealand's 17 regions are kuni's too, with their names in
English and Japanese, copied to `src/constants/es/regions.data.ts`, `it/regions.data.ts` and `nz/regions.data.ts`. Asturias, which
kuni has no Japanese name for as a province, takes the community's. The Netherlands has no region table: CBS's list says which
four-digit postcode areas exist and nothing of the province. India's 36 states and union territories, South Korea's 17 provinces and
metropolitan cities and Brazil's 27 states are kuni's too (`in/regions.data.ts`, `kr/regions.data.ts`, `br/regions.data.ts`). The names
Korean addresses write for them (`서울특별시`, `서울`, `경기도`) are facts, written by hand in `src/constants/kr/names.ts`.

## Data sources and licences

Every table is either generated by `pnpm data:countries` (`scripts/countries/update-country-data.ts`, which downloads
its inputs) or written by hand from rules described in our own words.

| Data | Source | Licence | Where |
| --- | --- | --- | --- |
| Australian states and British nations, English and Japanese names | kuni 1.1.0, from Unicode CLDR and Wikidata | MIT | `src/constants/au/states.data.ts`, `src/constants/gb/nations.data.ts` (generated) |
| Australia Post's blocks of postcodes for each state | Australia Post's allocation (NSW 1000 to 1999 for boxes and large receivers, 2000 to 2599, 2619 to 2899, 2921 to 2999; ACT 0200 to 0299, 2600 to 2618, 2900 to 2920; VIC 3000 to 3999, 8000 to 8999; QLD 4000 to 4999, 9000 to 9999; SA, WA and TAS their thousands; NT 0800 to 0999) | A fact, written by hand | `src/constants/au/index.ts` |
| Australian postcodes that cross a state border, and the external territories' | Australian Bureau of Statistics, Australian Statistical Geography Standard (ASGS) Edition 3, July 2021 to June 2026, Postal Areas allocation file `POA_2021_AUST.xlsx` | CC BY 4.0. Attribution: "Source: Australian Bureau of Statistics, ASGS Edition 3, Postal Areas, CC BY 4.0", kept in the generated file's header | `src/constants/au/cross-border.data.ts` (generated) |
| Australian street, unit, level and postal delivery types | AS4590 (Interchange of client information), as Australia Post's Address Presentation Standard uses it | The codes are facts; the lists are written in our own words | `src/constants/au/words.ts` |
| British postcode districts, and the nation of each area and border district | Ordnance Survey, Code-Point Open (July 2026 release) | Open Government Licence v3.0. Attribution, kept in the generated file's header: "Contains OS data © Crown copyright and database right 2026. Contains Royal Mail data © Royal Mail copyright and database right 2026. Contains National Statistics data © Crown copyright and database right 2026." | `src/constants/gb/districts.data.ts` (generated) |
| Royal Mail's postcode grammar, its postcode areas and the towns they are named for | Royal Mail, through the UPU's addressing sheet for the United Kingdom | The grammar and the list are facts, written in our own words | `src/constants/gb/index.ts` |
| British thoroughfare descriptors and counties | Royal Mail's addressing guidance; the former postal, ceremonial and traditional counties | Written in our own words | `src/constants/gb/words.ts` |
| Every German postcode GeoNames lists (10,813) and the Land each is in | GeoNames, postal code data for Germany (`DE.txt`), https://download.geonames.org/export/zip/ | Creative Commons Attribution 4.0, by GeoNames' own statement in its readme. Attribution, kept in the generated file's header: GeoNames | `src/constants/de/postcodes.data.ts` (generated) |
| The sixteen Länder, English and Japanese names | kuni 1.1.0, from Unicode CLDR and Wikidata | MIT | `src/constants/de/states.data.ts` (generated) |
| The layout of a German address: the care-of line, the street before its house number, the postcode and the place, no punctuation at a line's end, a Postfach's number in pairs | Deutsche Post's addressing guidance and DIN 5008 as Deutsche Post and others describe them | Rules described in our own words. DIN 5008 itself is DIN's and sold by it: it has not been read, and nothing here is taken from it | `src/de/format.ts` |
| German street suffixes, openers, flat, floor and building words | Common usage and Deutsche Post's guidance | Written in our own words | `src/constants/de/words.ts` |
| Every French postcode (6,328, France, the overseas departments and collectivities, Monaco) | La Poste, Base officielle des codes postaux (`laposte-hexasmal`, updated 8 October 2026), https://data.laposte.fr/datasets/laposte-hexasmal | Licence Ouverte 2.0 (Etalab). Attribution, kept in the generated file's header: the producer, La Poste, and the dataset's name | `src/constants/fr/postcodes.data.ts` (generated) |
| France's 101 departments, their regions, and the overseas collectivities with postcodes | INSEE, Code officiel géographique 2026 (`v_departement_2026`, `v_region_2026`, `v_comer_2026`), https://www.insee.fr/fr/information/8740218 | Licence Ouverte 2.0 (Etalab). Attribution, kept in the generated file's header: INSEE | `src/constants/fr/departments.data.ts` (generated) |
| The layout of a French address: the six lines and what goes on each, and the types of voie La Poste allows abbreviated | La Poste, SP 8855 volume 2, "Adressage des plis" (version 1.9, a public technical specification that follows the norm NF Z10-011) | The layout and the list of abbreviations are facts, written in our own words. The norm NF Z10-011 is AFNOR's and sold by it: it has not been read, and nothing here is taken from it | `src/fr/format.ts`, `src/constants/fr/words.ts` |
| French types of voie in full, apartment, floor and building words, Roman numerals, overseas names | La Poste's addressing guidance and common usage | Written in our own words | `src/constants/fr/words.ts` |

| Every four-digit postcode area of the Netherlands (4,070) | CBS (Statistics Netherlands), Postcode4 statistics 2023, through PDOK's web feature service, https://service.pdok.nl/cbs/postcode4/2023/wfs/v1_0 | Creative Commons Attribution 4.0, by the service's own statement (`AccessConstraints`). Read 2026-11-11. Attribution, kept in the generated file's header and in `NOTICE.md`: CBS and the dataset's name; the digits only are kept, packed | `src/constants/nl/postcodes.data.ts` (generated) |
| Every postcode GeoNames lists for Spain (11,150), and the province each is in | GeoNames, postal code data for Spain (`ES.txt`), https://download.geonames.org/export/zip/ | Creative Commons Attribution 4.0, by GeoNames' own statement in its readme. Read 2026-11-11. Attribution, kept in the generated file's header and in `NOTICE.md`: GeoNames. The province is the one most of the places of a postcode's first two digits are in | `src/constants/es/postcodes.data.ts` (generated) |
| The provinces of Spain, Italy's provinces, New Zealand's regions, English and Japanese names | kuni 1.1.0, from Unicode CLDR and Wikidata | MIT | `src/constants/es/regions.data.ts`, `it/regions.data.ts`, `nz/regions.data.ts` (generated) |
| Every postcode GeoNames lists for Italy (4,736), and the province each is in | GeoNames, postal code data for Italy (`IT.txt`) | Creative Commons Attribution 4.0, as above. Read 2026-11-11. Nine postcodes have places in more than one province and take the one most are in | `src/constants/it/postcodes.data.ts` (generated) |
| Every postcode GeoNames lists for New Zealand (1,737), and the region each is in | GeoNames, postal code data for New Zealand (`NZ.txt`) | Creative Commons Attribution 4.0, as above. Read 2026-11-11. 27 postcodes have no region in the file | `src/constants/nz/postcodes.data.ts` (generated) |
| The layout of a Dutch, Spanish, Italian and New Zealand address: the order of the lines, where the number and the postcode stand, the floor and door words, the types of street | PostNL's, Correos', Poste Italiane's and NZ Post's addressing guidance, and common usage | Rules and word lists, written in our own words; no guidance document is copied | `src/constants/nl/`, `src/nl/rules.ts`, `src/es/rules.ts`, `src/it/rules.ts`, `src/nz/rules.ts` |

The licence text read for the three CC BY rows is Creative Commons Attribution 4.0 International, Section 3(a): keep the creator's name,
the copyright and licence notices and a link to the material, say that it was modified, and say that it is licensed under the
licence with a link to it. The package's `NOTICE.md` does all of that for each source, and ships in the npm package. The CC BY licence lets
the rest of the package stay MIT, since Section 3(a)(4) only asks that the licence applied to adapted material not stop a recipient from
complying with it.

| Every PIN code GeoNames lists for India (19,238), and the state each is in | GeoNames, postal code data for India (`IN.txt`) | Creative Commons Attribution 4.0, as above. Read 2026-11-11. GeoNames' states are those of its last update, so Ladakh's PIN codes are in Jammu and Kashmir's | `src/constants/in/postcodes.data.ts` (generated) |
| Every postcode GeoNames lists for South Korea (34,249), and the province of each | GeoNames, postal code data for South Korea (`KR.txt`); provinces from kuni | Creative Commons Attribution 4.0, as above. Read 2026-11-11 | `src/constants/kr/postcodes.data.ts` (generated) |
| The range of CEPs of each Brazilian state | The Correios' division of the country by the first five digits of the CEP, written by hand | A fact. Checked on 2026-11-11 against the 5,525 CEPs GeoNames lists, none of which is kept: the generator fails when one falls outside the range of its state (a first check found Rondônia's second range, 78900 to 78999) | `src/constants/br/ranges.ts` |
| The names of the provinces in Korean | Official names and common short forms | Facts, written by hand | `src/constants/kr/names.ts` |
| The layout of an Indian, Korean and Brazilian address | India Post's, Korea Post's and the Correios' addressing guidance, and common usage | Rules and word lists written in our own words; nothing copied | `src/in/rules.ts`, `src/kr/rules.ts`, `src/br/rules.ts` |

What is not used, and why:

- **G-NAF** (the Geocoded National Address File), Australia's open address list: its end-user licence forbids using it
  to generate or compile addresses for sending mail, which is close enough to what this library is used for that
  nothing here comes from it.
- **Australia Post's postcode products**: they are Australia Post's, under its own terms. The Australian Bureau of
  Statistics' Postal Areas are used instead; they approximate Australia Post's postcodes by mesh blocks, so a state holding only
  a sliver of a postcode's area is listed too, which errs towards accepting an address rather than refusing one.
- **Royal Mail's Postcode Address File (PAF)**: licensed and paid for. Nothing here comes from it; the parser follows
  the PAF's shape, which Royal Mail publishes.
- **The ONS Postcode Directory (ONSPD)**: it would supply Northern Ireland's districts, which Code-Point Open leaves
  out, but its Northern Ireland postcodes (BT) may be used commercially only under a separate licence from Land &
  Property Services Northern Ireland, and its other data asks for the attribution "Contains OS data © Crown copyright
  and database right; Contains Royal Mail data © Royal Mail copyright and database right; Source: Office for National
  Statistics licensed under the Open Government Licence v.3.0". An MIT package cannot pass on the BT terms, so none of
  it is used: a BT postcode is known to be Northern Ireland's by its area, and its district is not checked.
- **Deutsche Post's postcode directory and the postcodes' places.** The directory (PLZ) with its places is Deutsche Post's
  product, under its own terms, and none of it is used. GeoNames' list is: it has 10,813 postcodes, among them those of
  large firms (its place names for some are the firms' own), and where a postcode's places are in two Länder it takes the
  Land most of them are in (32 postcodes have places in more than one). The list is not Deutsche Post's and is not
  complete or current to the day, so the validator calls an unknown postcode a warning. The place names are not shipped:
  only the postcodes and their Länder.
- **OpenStreetMap, OpenGeoDB and the Bundesamt für Kartographie und Geodäsie's postcode areas.** The first two are ODbL or
  carry ODbL data; the last has its own terms. None is used.
- **The postal services' own lists for the Netherlands, Spain, Italy and New Zealand.** None is open data. PostNL's postcode
  file is sold under a licence; Correos owns Spain's postcode database and its reuse (CartoCiudad's, for one) is by agreement, with
  its own terms; Poste Italiane says the full CAP database cannot be downloaded because it holds the rights, and sells it; NZ Post's
  Postcode Network File is bought under a licence. GeoNames' lists (CC BY 4.0) are used for Spain, Italy and New Zealand where none
  of these is open, as for Germany. The Netherlands' list is the open one CBS publishes. The Dutch BAG (the address register, CC0)
  has every postcode and house number, but at 9 million rows is far too large to ship; nothing of it is used.
- **India Post's file and data.gov.in's All India Pincode Directory.** The directory is published under India's Government Open
  Data Licence, but data.gov.in could not be reached on 2026-11-11 (the connection was refused), so its licence text was not read and
  none of it is used. GeoNames' list, whose licence text was read, is used instead. Korea Post's postal-code file (the open
  data portal's) and the Correios' CEP file (sold) are not used for the same reason of terms not read or not open.
- **GeoNames' place names for the four.** Only the postcodes and the province or region are kept, as for Germany. GeoNames' Dutch
  file has the first four digits only (and the provinces), Brazil's has the major postcodes only: not used.
- **La Poste's commune names and its CEDEX codes.** The base lists 39,193 lines, one for each commune and each
  postcode it has, with the commune's name. Only the postcodes are kept here (6,328 of them, 7.5 KB), so the validator
  can say whether a postcode is in use and which department it belongs to but not whether the commune written beside it
  is the one that postcode serves: measured, the 35,624 pairs of a postcode and its commune's label are 656 KB of text and 230 KB gzipped, for every user of the package whether they import `/fr` or not (npm installs the whole package), and out of date within months. The base
  has no CEDEX codes (those are in La Poste's other files, which are not open data), so the validator does not look a
  postcode up when the address has a CEDEX.
- **A postcode's department by the communes that share it.** A few postcodes serve a commune across a department's
  border (three in the metropolis: 01590 serves communes of the Jura as well as the Ain, and 94390 serves Paray-Vieille-Poste, in the Essonne); the department
  reported is the one the number names, the rule La Poste's own codes follow. Overseas, where it matters (97133 is
  Saint-Barthélemy, 97150 Saint-Martin, 98000 Monaco), the exceptions are generated from the base.
- **The Base Adresse Nationale (BAN), OpenStreetMap and OpenAddresses.** The BAN is open (Licence Ouverte 2.0) but lists
  every address of France, tens of millions, which is a street gazetteer and not a table for a parser to carry; the
  other two are ODbL or a mix of licences. None is used, and no street name of France is in the package.
- **A list of every British postcode.** Measured: Code-Point Open's 1,749,109 postcodes, packed as one bit per possible
  unit in each of their 10,875 sectors, are 776 KB of text and 304 KB gzipped. That would let a validator say whether a
  postcode exists, not only whether its district does. It is not shipped: npm installs the whole package, so every
  user would download it whether they import it or not, and it would be out of date within a month. It would fit a
  separate package, if wanted.

## What the country modules do not reach

`cleanAddress`, `cleanAddressDetailed` and the fuzzy comparer `compareAddresses` are the core's, and they read the US,
Canadian and Japanese shapes: the cleaner puts a postcode after the commune, as a US address has it, which turns
`12 rue de la paix, 75002 paris` into `12 Rue De La Paix, Paris 75002`, and is no longer a French address. A French
address is compared with `compareFrenchAddresses`, and written with `formatLaPoste`. The demo's Clean panel has no French
example for that reason.

## The fields each country fills

The shared fields keep their meaning in every country: `number`, `street`, `type`, `secUnitType`, `secUnitNum`,
`city`, `state`, `zip`, `zipValid`, `country`.

| Field | Australia | United Kingdom | France | Germany |
| --- | --- | --- | --- | --- |
| `number` | street number: `12`, `12A`, `12-14` | building number: `10`, `22B`, `100-106` | the street number: `12`, `12-14` | the house number after the street: `12`, `12A`, `12-14`, `12/14` |
| `street`, `type` | `Smith`, `St` (AS4590's abbreviation, in proper case) | `High`, `Street` (the descriptor in full, as Royal Mail writes it) | `de la Paix`, `Rue` (the type in full, first in French; the name keeps its words as written) | `street` the whole name as written (`Hauptstraße`, `Berliner Str.`, `Am Markt`); no `type`, since the suffix is part of the name |
| `suffix` | `N`, `NE`, `EX`, `UP` (AS4590's street suffixes) | |  |  |
| `secUnitType`, `secUnitNum` | `Unit 3` (from `3/12` too), `Shop 5`; or a postal delivery, `PO Box 37`, `Locked Bag 801`, `Care PO` | `Flat 2`, `Flat 2/1`, `Studio J`; or `PO Box 111` | `Appartement 12`, `Porte 3`, `Bureau 21` | `Wohnung 12`, `Büro 21`; `Postfach 123456` (digits run together), `Packstation 123` |
| `floorType`, `floor` | `Level` and `6`, `Ground Floor` | `Floor` and `4`, `Ground Floor` | `Étage` and `3`, `Rez-de-chaussée` | `Obergeschoss` and `2` (from `2. OG`), `Erdgeschoss`, `Etage`, `Dachgeschoss` |
| `lot` | `12` in `Lot 12 Smith Rd` | |  |  |
| `building` | a building's name on a line of its own | the building's name, or an organisation's | a residence, a building, a tower, a zone: `Résidence Les Lilas`, `Zone industrielle Nord`; and any name before the street that is none of these | `Hinterhaus`, `Haus B`, `Block C`, and any name before the street that is none of these (a firm's) |
| `subBuilding` | | a named part of a building: `Basement Flat` |  |  |
| `dependentThoroughfare` | | `Seastone Cottages` in `1A Seastone Cottages, Station Road` |  |  |
| `locality`, `doubleDependentLocality` | | the dependent locality and the one above it |  | the Ortsteil (`OT Gohlis`) |
| `city` | the suburb or town | the post town | the commune: `Paris`, `Lyon` | the place: `Berlin`, `Frankfurt am Main`, `Halle (Saale)` |
| `county` | | a county, when written |  |  |
| `state` | `NSW` | | the department's code: `75`, `2A`, `971`; absent for Monaco and the collectivities | the Land's code from the postcode: `BE`, `BY`, `NW` |
| `nation` | | `ENG`, `SCT`, `WLS` or `NIR`, from the postcode |  |  |
| `zip` | `2150` | `SW1A 2AA` (capitals, one space) | `75002` | `10115` |
| `bfpo` | | `105` in `BFPO 105` |  |  |
| `country` | `AU` | `GB`, or `JE`, `GY`, `IM` | `FR`, or `MC`, `PM`, `BL`, `MF`, `WF`, `PF`, `NC` | `DE` |

France fills nine fields of its own beside these (`FrenchAddressFields`): `numberExtension` (`bis`, `ter`, `quater`, or the
B of `12 B`), `staircase`, `entrance`, `lieuDit`, `postalBoxType` (`BP`, `CS`, `TSA`) with `postalBoxNum`, `cedex`
(`CEDEX 09`, or `CEDEX`), `arrondissement` (the number: 8 for `Paris 8e`) and `careOf` (the "chez" line). A `lieuDit` is
also what La Poste's fifth line holds when it names the commune a box or a hamlet is in.

Germany fills one field of its own beside the shared ones, `careOf` (the `c/o`, `z. Hd.` or `bei` line; France's has the same
name and meaning). A German address has no type of street apart from the name and puts the house number after the street,
so `type` is absent and `number` follows `street` in the parser's results.

### The Netherlands, Spain, Italy, New Zealand, India and Brazil

(South Korea reads its addresses with a parser of its own, in Hangul and in Latin letters; see below.) These six share their parser, validator and comparer (`src/country/postcode-country.ts`); a country gives its postcode's shape, its lookups
and the few rules of its own (`src/<code>/rules.ts`), and writes its own formatter. The shared fields keep their meaning:

| Field | Netherlands | Spain | Italy | New Zealand | India | Brazil |
| --- | --- | --- | --- | --- | --- | --- |
| `number` | the house number: `123` | the number: `42`, `12-14`, `S/N` | the civic number: `12`, `12-14`, `SNC` | the number: `45`, `12A`, `12-14` | the house number: `12`, `45/3` | the number: `1578`, `S/N` |
| `numberExtension` | the addition: `A`, `2`, `III`, `bis`, `hs` | | the letter or sub-number after a slash, `bis`: `A` in `12/A` | |  |  |
| `street` | the name as written: `Keizersgracht` | the name with its type as written: `Calle de Alcalá`, `C/ Mayor` | the name with its type as written: `Via del Corso` | the name with its type: `Dominion Road` | the name as written: `MG Road` | the name with its type: `Avenida Paulista` |
| `secUnitType`, `secUnitNum` | `Postbus` and its number | `Puerta` and `B` (the door); `Apartado de Correos`; `Local` | `Interno` and `5`; `Casella Postale` | `Unit` and `3` (from `3/45` too), `Flat`, `Shop`; `PO Box`, `Private Bag`, `RD` | `Flat 4B`, `Shop`, `Plot 7`; `Post Box` | `Apto 45`, `Sala 12`, `Casa`; `Caixa Postal` |
| `floorType`, `floor` | | `Piso` and `3` (from `3º`), `Bajo`, `Entresuelo`, `Ático` | `Piano` and `3` | `Level` and `5` | `Floor` and `3` | `Andar` and `5` |
| `staircase`, `entrance` | | `Escalera` and `Portal`: `2`, `B` | `Scala`: `B` | |  |  |
| `building` | a name above the street | a name above the street | `Palazzo Rossi`, a name above the street | a name above the street | a name above the street | `Bloco B`, a torre |
| `locality` | | | the frazione | the suburb | the area: `Indiranagar` | the bairro: `Bela Vista` |
| `city` | the place | the place | the place | the city | the city | the city |
| `county` | | the province written in brackets or after the place | | |  |  |
| `state` | | the province's code from the postcode: `M`, `B`, `SE` | the sigla as written, or from the postcode: `RM` | the region's code from the postcode: `AUK`, `WGN` | the state's code as written, or from the PIN: `KA` | the state's code as written, or from the CEP: `SP` |
| `zip` | `1015 CJ` (capitals, one space) | `28014` | `00186` | `1010` | `560038` (no space) | `01310-200` (with its hyphen) |
| `careOf` | `t.a.v.` | `A/A` | `c/o`, `presso` | `C/-`, `c/o` | `C/o`, `S/o`, `D/o` | `A/C` |
| `country` | `NL` | `ES` | `IT` | `NZ` | `IN` | `BR` |

The validator reports the same codes for each, as Germany's does (`INVALID_POSTAL_FORMAT`, `UNRECOGNIZED_POSTAL_CODE`,
`MISSING_POSTAL_CODE`, `MISSING_CITY`, `MISSING_STREET_NUMBER`), and `POSTAL_REGION_MISMATCH` where a region is written beside the
postcode (Italy's sigla). A postcode the list does not have is a warning, and an error with `strictPostalValidation`. A Dutch Postbus
is not looked up, since its postcode is none of an area's. India also fills `place`, a landmark (`Near City Mall`), and Brazil's "known" means a
state's range holds the CEP, since there is no list.

### South Korea

Korea reads Hangul from the province down (`서울특별시 중구 세종대로 110, 3층 (태평로1가)`) and Latin letters from the number up (`110 Sejong-daero,
Jung-gu, Seoul 04524`), with the postcode first, in brackets, or last. The fields mean the same in both: `state` the province's code from kuni
(`11` for Seoul), `city` the district (`중구`, or `수원시 영통구`, large to small in both scripts), `street` the road as written, `number` the building
number on the road (or the lot number of an older address), `locality` the dong, ri or eup, `building` a building's name or block, `floorType` and
`floor` (`층` or `Floor`), `secUnitType` and `secUnitNum` (`호` or `Unit`) and `zip`. The formatter writes Hangul from the province down on one
line with the postcode on its own, and Latin letters from the unit up, each district on a line of its own. The two countries that put the number before the street (New Zealand)
or write the unit as `3/45` read it as the unit's.

## Adding a country

1. Write its types in `src/types/<country>.ts` (its own fields, its subdivisions) and add its fields to `ParsedAddress`
   and its codes to `ParseOptions.country` and `ParsedAddress.country`.
2. Put its tables in `src/constants/<code>/`, generated by `pnpm data:countries` where they come from data (with the
   source and licence in the generated file's header), by hand where they are rules.
3. Write `src/<code>/`: `parse.ts`, `validate.ts`, `format.ts`, `compare.ts`, and `index.ts` exporting the module and
   everything a caller needs. Import nothing from the core's parser or tables; `src/country/shared.ts` holds what the
   modules share.
4. Write `detect` to say yes only on signs no other country's address carries, and add a row to the table above with
   what it never claims.
5. Add the entry to `tsup.config.ts` and `package.json`'s `exports`, and to the lists in `scripts/check-package.mjs`
   (with a word only its tables carry) and `scripts/check-docs.mjs`.
6. Write its corpus under `test-data/corpus/<code>/`, its core fields and hint in
   `src/__tests__/corpus/corpus-support.ts`, and its suite beside `australia.test.ts`; the detection suite then holds it
   to the US, Canadian and Japanese corpora.
7. Document it: a section in `docs/TEST_COVERAGE.md`, a row in each table here, a short section in the README, the
   changelog, and the demo's country choices and examples.

The survey that chose Australia and the United Kingdom first named France and Germany next. Germany came fourth with nothing new but its data (GeoNames, for the Länder of the postcodes), and the address's own shape: the
number after the street, a street's type inside its name, and no unit abbreviation common enough to ignore. France came
third, with the changes it needed from the template above: a third entry point, a second source of tables (INSEE beside kuni), a
validator that skips the base for an address with a CEDEX, and territories with country codes of their own.
