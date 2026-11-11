// The country modules the demo hands to the parser, and the country codes each module's addresses carry. One list
// for every panel and tool, so a panel never reads an address the others would read differently.
import { australia } from "./lib/au.js";
import { brazil } from "./lib/br.js";
import { germany } from "./lib/de.js";
import { spain } from "./lib/es.js";
import { france } from "./lib/fr.js";
import { unitedKingdom } from "./lib/gb.js";
import { india } from "./lib/in.js";
import { italy } from "./lib/it.js";
import { southKorea } from "./lib/kr.js";
import { netherlands } from "./lib/nl.js";
import { newZealand } from "./lib/nz.js";

// Australia, France, Germany, Italy, the Netherlands, New Zealand, Spain and the United Kingdom are read by their own modules,
// handed to the parser and the validator.
const COUNTRIES = [
  australia,
  brazil,
  france,
  germany,
  india,
  italy,
  netherlands,
  newZealand,
  southKorea,
  spain,
  unitedKingdom,
];
const BRITISH = new Set(["GB", "JE", "GY", "IM"]);
const FRENCH = new Set(["FR", "MC", "PM", "BL", "MF", "WF", "PF", "NC"]);

export { BRITISH, COUNTRIES, FRENCH };
