// The Netherlands' postcodes: four digits and two letters (PostNL's shape), and whether CBS's list of four-digit postcode
// areas has the digits.

import { postcodeLookups } from "../../country/postcode-lookups";
import { NL_POSTCODES_PACKED } from "./postcodes.data";

// The first digit is never nought; the letters never begin SA, SD or SS, and the postcode may be written with no space.
const NL_POSTCODE_SHAPE = /^[1-9]\d{3}\s?(?!SA|SD|SS)[A-Z]{2}$/i;

// "1015cj" as "1015 CJ".
const normalize = (postcode: string): string =>
  postcode
    .replace(/\s+/g, "")
    .replace(/^(\d{4})/, "$1 ")
    .toUpperCase();

const lookups = postcodeLookups({ shape: NL_POSTCODE_SHAPE, length: 4, packed: NL_POSTCODES_PACKED, normalize });

export { lookups as dutchPostcodes, NL_POSTCODE_SHAPE, normalize as normalizeDutchPostcode };
