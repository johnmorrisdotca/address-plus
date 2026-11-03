// What the locality stage of the standard parser reads and returns.

import type { ParseOptions } from "../../types";

// The parts of a standard address that the locality stage works out. A stage takes the state read so far and returns
// the state with the parts it found; it never changes the one it was given.
interface Locality {
  zipPart: string; // The ZIP or postal code as written, or an empty string
  statePart: string; // The state or province as written, or an empty string
  cityPart: string; // The city as written, or an empty string
  addressPart: string; // The part of the text that holds the street
  isGeneralDelivery: boolean; // Whether the address is a General Delivery one
}

// What a locality stage reads of the address around the part it is working on.
interface LocalityContext {
  commaParts: readonly string[]; // The address split at its commas, with a unit part set aside already
  addressStartIndex: number; // The comma part the street is in
  excludedPartIndices: ReadonlySet<number>; // Comma parts that are not the city: a unit, a route, a facility
  options: ParseOptions;
  countryHint?: "US" | "CA"; // The country the input preparation read, when it did
}

export type { Locality, LocalityContext };
