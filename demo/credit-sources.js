// The postcode data's sources and licences with their addresses (NOTICE.md gives each in full), as kazoku-ui's credit
// pieces, so in a credit line each licence and each source is a link: the embed page's small line (scripts/page-frame.mjs
// writes it at build) and the builder's embed panel (demo/builder.js). A piece is a text or { text, href }.

/** Where every credit is written in full. */
export const NOTICE = "https://github.com/johnmorrisdotca/address-plus/blob/main/NOTICE.md";

const CC_BY = { text: "CC BY 4.0", href: "https://creativecommons.org/licenses/by/4.0/" };
const OGL = {
  text: "Open Government Licence v3.0",
  href: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
};
const LICENCE_OUVERTE = {
  text: "Licence Ouverte 2.0",
  href: "https://www.etalab.gouv.fr/licence-ouverte-open-licence/",
};
const ABS =
  "https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs-edition-3/jul2021-jun2026/access-and-downloads/allocation-files";
const GEONAMES = "https://www.geonames.org/";
const CBS = "https://service.pdok.nl/cbs/postcode4/2023/wfs/v1_0";
const OS = "https://www.ordnancesurvey.co.uk/products/code-point-open";
const LA_POSTE = "https://data.laposte.fr/datasets/laposte-hexasmal";
const INSEE = "https://www.insee.fr/fr/information/8740218";

/** The small credit line in the corner of the embed page: each source by name with its licence. */
export const EMBED_CREDITS = {
  en: [
    "Postcode data: ",
    { text: "GeoNames", href: GEONAMES },
    ", ",
    { text: "CBS", href: CBS },
    " and the ",
    { text: "Australian Bureau of Statistics", href: ABS },
    " (",
    CC_BY,
    "); ",
    { text: "Ordnance Survey", href: OS },
    " and Royal Mail (",
    OGL,
    "); ",
    { text: "La Poste", href: LA_POSTE },
    " and ",
    { text: "INSEE", href: INSEE },
    " (",
    LICENCE_OUVERTE,
    ")",
  ],
  ja: [
    "郵便番号のデータ：",
    { text: "GeoNames", href: GEONAMES },
    "、",
    { text: "CBS", href: CBS },
    "、",
    { text: "オーストラリア統計局", href: ABS },
    "（",
    CC_BY,
    "）、",
    { text: "Ordnance Survey", href: OS },
    "とRoyal Mail（",
    OGL,
    "）、",
    { text: "La Poste", href: LA_POSTE },
    "と",
    { text: "INSEE", href: INSEE },
    "（",
    LICENCE_OUVERTE,
    "）",
  ],
};

/** The builder's credit, for the countries the field reads (US, CA and JP have none to credit), and the link to the rest. */
export const BUILDER_CREDITS = {
  en: [
    "Postcode data: Australia, the ",
    { text: "Australian Bureau of Statistics", href: ABS },
    " (",
    CC_BY,
    "); Great Britain, ",
    { text: "Ordnance Survey", href: OS },
    " and Royal Mail (",
    OGL,
    "); France, ",
    { text: "La Poste", href: LA_POSTE },
    " and ",
    { text: "INSEE", href: INSEE },
    " (",
    LICENCE_OUVERTE,
    "); Germany, ",
    { text: "GeoNames", href: GEONAMES },
    " (",
    CC_BY,
    "). Region names from kuni (Unicode CLDR and Wikidata). Full credit: ",
    { text: "NOTICE.md", href: NOTICE },
  ],
  ja: [
    "郵便番号のデータは、オーストラリアが",
    { text: "オーストラリア統計局", href: ABS },
    "（ABS、",
    CC_BY,
    "）、イギリスが",
    { text: "Ordnance Survey", href: OS },
    "とRoyal Mail（",
    OGL,
    "）、フランスが",
    { text: "La Poste", href: LA_POSTE },
    "と",
    { text: "INSEE", href: INSEE },
    "（",
    LICENCE_OUVERTE,
    "）、ドイツが",
    { text: "GeoNames", href: GEONAMES },
    "（",
    CC_BY,
    "）のものです。地域名はkuni（Unicode CLDRとWikidata）のものです。全文：",
    { text: "NOTICE.md", href: NOTICE },
  ],
};
