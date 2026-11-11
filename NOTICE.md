# Notice

address-plus is MIT licensed (see LICENSE). Its postcode tables are made from other people's open data, which is credited here
as the licences ask: GeoNames and CBS (CC BY 4.0), the Australian Bureau of Statistics (CC BY 4.0), Ordnance Survey and Royal Mail
(Open Government Licence v3.0), and La Poste and INSEE (Licence Ouverte 2.0). The generated files under `src/constants/` carry the same credits in their headers, and
[docs/COUNTRIES.md](docs/COUNTRIES.md) has the full list of sources, the licence of each, and what is not used and why.

## The credit lines

Each source's credit as a line, the form the demo pages show word for word (they read it from here) and the form to copy
when you take the data from this package. The sections below give each in full.

> GeoNames, postal code data, https://www.geonames.org/, licensed under CC BY 4.0
> (https://creativecommons.org/licenses/by/4.0/). Changed: only the postcodes and one province or region for each are
> kept, sorted and packed.

> CBS (Statistics Netherlands), Postcode4 statistics 2023, https://service.pdok.nl/cbs/postcode4/2023/wfs/v1_0, licensed
> under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Changed: only the four-digit postcode numbers are kept,
> sorted and packed.

> Source: Australian Bureau of Statistics, ASGS Edition 3, Postal Areas, CC BY 4.0
> (https://creativecommons.org/licenses/by/4.0/). Changed: only the postcodes that cross a state border, and the external
> territories', are kept.

> Contains OS data © Crown copyright and database right 2026. Contains Royal Mail data © Royal Mail copyright and
> database right 2026. Contains National Statistics data © Crown copyright and database right 2026. Licensed under the
> Open Government Licence v3.0 (https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).

> La Poste, Base officielle des codes postaux, last updated on 2026-10-08, under the Licence Ouverte 2.0
> (https://www.etalab.gouv.fr/licence-ouverte-open-licence/).

> INSEE, Code officiel géographique 2026 (the state on 2026-01-01), under the Licence Ouverte 2.0
> (https://www.etalab.gouv.fr/licence-ouverte-open-licence/).

## Postcodes of the Netherlands, Spain, Italy, New Zealand, India, South Korea and Brazil

The licence text was read on 2026-11-11: Creative Commons Attribution 4.0 International
(https://creativecommons.org/licenses/by/4.0/legalcode), Section 3(a). It asks for the creator's name, a copyright notice, a notice
of the licence and of its disclaimer of warranties, a link to the material, a statement that the material was changed, and a statement
that it is licensed under the licence, with a link to it. All of that is below.

- **The Netherlands: the four-digit postcode areas.** Source: CBS (Statistics Netherlands), Postcode4 statistics 2023, published through
  PDOK, https://service.pdok.nl/cbs/postcode4/2023/wfs/v1_0. Licensed under Creative Commons Attribution 4.0 International
  (https://creativecommons.org/licenses/by/4.0/), as the service states in its access constraints on 2026-11-11. Provided as is, with no
  warranty. Changed: only the four-digit numbers of the postcode areas are kept, sorted and packed into a short string; the statistics
  and the shapes are not used.
- **Spain, Italy, New Zealand, India and South Korea: the postcodes and the province, region or state of each.** Source: GeoNames, postal code data,
  https://www.geonames.org/ and https://download.geonames.org/export/zip/. Licensed under Creative Commons Attribution 4.0
  International (https://creativecommons.org/licenses/by/4.0/), as GeoNames states in the readme of the postal code files on
  2026-11-11: "you can use the dump as long as you give credit to geonames". Provided as is, with no warranty of accuracy,
  timeliness or completeness. Changed: only the postcodes and one province or region for each are kept (the one most of a postcode's
  places are in), sorted and packed into short strings; no place name, coordinate or other column is kept. Germany's postcodes come
  from the same files and are credited the same way.
- **Brazil: the ranges of CEPs by state.** Written by hand from the division of the country by state that the Correios publish, a fact, and
  checked on 2026-11-11 against the 5,525 CEPs GeoNames lists (none of which is shipped). No list of CEPs is used.
- **The names of the provinces, regions and states, in English and Japanese.** Source: kuni (https://www.npmjs.com/package/@johnmorrisdotca/kuni),
  MIT, from Unicode CLDR and Wikidata.

The postal services of these four countries (PostNL, Correos, Poste Italiane, NZ Post) own their postcode files and sell them; none is
used. The package says so where it matters: a postcode its list does not have is a warning, not proof that it does not exist.

## Australia: the postcodes that cross a state border, and the external territories'

Source: Australian Bureau of Statistics, Australian Statistical Geography Standard (ASGS) Edition 3, July 2021 - June 2026, Postal
Areas allocation file `POA_2021_AUST.xlsx`,
https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs-edition-3/jul2021-jun2026/access-and-downloads/allocation-files.
© Commonwealth of Australia. Licensed under Creative Commons Attribution 4.0 International
(https://creativecommons.org/licenses/by/4.0/), as the ABS's copyright page states
(https://www.abs.gov.au/website-privacy-copyright-and-disclaimer, read on 2026-11-11); the licence's Section 3(a), quoted above, is
met here. Provided as is, with no warranty. Changed: only the postcodes whose area lies in more than one state or territory, and the
external territories' postcodes, are kept, each with its states; the rest of the file is not used.

Attribution: "Source: Australian Bureau of Statistics, ASGS Edition 3, Postal Areas, CC BY 4.0".

## Great Britain: the postcode districts and the nation each lies in

Source: Ordnance Survey, Code-Point Open (July 2026 release), https://www.ordnancesurvey.co.uk/products/code-point-open. Licensed under
the Open Government Licence v3.0 (https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/, read on 2026-11-11),
which asks the user to acknowledge the source with the attribution statement the provider gives and, where possible, to link to the
licence. Ordnance Survey's statement for Code-Point Open:

> Contains OS data © Crown copyright and database right 2026. Contains Royal Mail data © Royal Mail copyright and database right 2026.
> Contains National Statistics data © Crown copyright and database right 2026.

Changed: only the postcode districts and the nation each lies in are kept; the postcodes, the points and the other columns are not.

## France: the postcodes, the departments and their regions

Both are under the Licence Ouverte / Open Licence 2.0 (Etalab, https://www.etalab.gouv.fr/licence-ouverte-open-licence/; its text, read
on 2026-11-11 at https://github.com/etalab/licence-ouverte), which asks the user to name the source, at least the producer, and the date
the information was last updated. Naming them implies no endorsement by La Poste, INSEE or any public body.

- **The postcodes of France, the overseas departments and collectivities, and Monaco.** Source: La Poste, Base officielle des codes
  postaux, https://data.laposte.fr/datasets/laposte-hexasmal, last updated on 2026-10-08. Changed: only the postcodes are kept, sorted
  and packed into a short string; the communes and the other columns are not.
- **The 101 departments, their regions and the overseas collectivities with postcodes.** Source: INSEE, Code officiel géographique
  2026 (the state on 2026-01-01), https://www.insee.fr/fr/information/8740218. Changed: only each department's code, name and region,
  and the collectivities' codes and names, are kept.
