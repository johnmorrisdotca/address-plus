import { parseLocation, validateAddress } from "@johnmorrisdotca/address-plus";

// A server parses and checks the same way a browser does: no DOM, no network.
const address = "1600 Pennsylvania Ave NW, Washington, DC 20500";
console.log(parseLocation(address)?.state, validateAddress(address).isValid);
