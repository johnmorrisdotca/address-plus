# Notice

address-plus is MIT licensed (see LICENSE). Its postcode tables are made from other people's open data, which is credited here
as the licences ask. The generated files under `src/constants/` carry the same credits in their headers, and
[docs/COUNTRIES.md](docs/COUNTRIES.md) has the full list of sources, the licence of each, and what is not used and why.

## Postcodes of the Netherlands, Spain, Italy and New Zealand

The licence text was read on 2026-11-11: Creative Commons Attribution 4.0 International
(https://creativecommons.org/licenses/by/4.0/legalcode), Section 3(a). It asks for the creator's name, a copyright notice, a notice
of the licence and of its disclaimer of warranties, a link to the material, a statement that the material was changed, and a statement
that it is licensed under the licence, with a link to it. All of that is below.

- **The Netherlands: the four-digit postcode areas.** Source: CBS (Statistics Netherlands), Postcode4 statistics 2023, published through
  PDOK, https://service.pdok.nl/cbs/postcode4/2023/wfs/v1_0. Licensed under Creative Commons Attribution 4.0 International
  (https://creativecommons.org/licenses/by/4.0/), as the service states in its access constraints on 2026-11-11. Provided as is, with no
  warranty. Changed: only the four-digit numbers of the postcode areas are kept, sorted and packed into a short string; the statistics
  and the shapes are not used.
- **Spain, Italy and New Zealand: the postcodes and the province or region of each.** Source: GeoNames, postal code data,
  https://www.geonames.org/ and https://download.geonames.org/export/zip/. Licensed under Creative Commons Attribution 4.0
  International (https://creativecommons.org/licenses/by/4.0/), as GeoNames states in the readme of the postal code files on
  2026-11-11: "you can use the dump as long as you give credit to geonames". Provided as is, with no warranty of accuracy,
  timeliness or completeness. Changed: only the postcodes and one province or region for each are kept (the one most of a postcode's
  places are in), sorted and packed into short strings; no place name, coordinate or other column is kept. Germany's postcodes come
  from the same files and are credited the same way.
- **The names of the provinces and regions, in English and Japanese.** Source: kuni (https://www.npmjs.com/package/@johnmorrisdotca/kuni),
  MIT, from Unicode CLDR and Wikidata.

The postal services of these four countries (PostNL, Correos, Poste Italiane, NZ Post) own their postcode files and sell them; none is
used. The package says so where it matters: a postcode its list does not have is a warning, not proof that it does not exist.
