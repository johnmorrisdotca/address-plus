import { parseLocation, validateAddress, type ParseOptions } from "@johnmorrisdotca/address-plus";

const address = "1600 Pennsylvania Ave NW, Washington, DC 20500";
const options: ParseOptions = { country: "US" };
console.log(parseLocation(address, options)?.state, validateAddress(address).isValid);

// @ts-expect-error "XX" is not a country the parser reads
const unknown: ParseOptions["country"] = "XX";
console.log(unknown);
