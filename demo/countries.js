// The country modules the demo hands to the parser, and the country codes each module's addresses carry. One list
// for every panel and tool, so a panel never reads an address the others would read differently.
import { australia } from "./lib/au.js";
import { germany } from "./lib/de.js";
import { france } from "./lib/fr.js";
import { unitedKingdom } from "./lib/gb.js";

// Australia, France, Germany and the United Kingdom are read by their own modules, handed to the parser and the validator.
const COUNTRIES = [australia, france, germany, unitedKingdom];
const BRITISH = new Set(["GB", "JE", "GY", "IM"]);
const FRENCH = new Set(["FR", "MC", "PM", "BL", "MF", "WF", "PF", "NC"]);

export { BRITISH, COUNTRIES, FRENCH };
