// Brazil's postcodes (CEP): the range of the first five digits that each state holds. There is no list of CEPs here: the post
// office's file is sold, and the open list GeoNames has holds only the major ones.
//
// The ranges are the Correios' division of the country by state, checked on 2026-11-11 against the 5,525 CEPs GeoNames lists
// (scripts/countries/postcode-countries.ts fails when one falls outside the range of its state).

// The first five digits of the CEP, as a number: the ranges of each state, from and to.
const BR_RANGES: Readonly<Record<string, readonly (readonly [number, number])[]>> = {
  AC: [[69900, 69999]],
  AL: [[57000, 57999]],
  AM: [
    [69000, 69299],
    [69400, 69899],
  ],
  AP: [[68900, 68999]],
  BA: [[40000, 48999]],
  CE: [[60000, 63999]],
  DF: [
    [70000, 72799],
    [73000, 73699],
  ],
  ES: [[29000, 29999]],
  GO: [
    [72800, 72999],
    [73700, 76799],
  ],
  MA: [[65000, 65999]],
  MG: [[30000, 39999]],
  MS: [[79000, 79999]],
  MT: [[78000, 78899]],
  PA: [[66000, 68899]],
  PB: [[58000, 58999]],
  PE: [[50000, 56999]],
  PI: [[64000, 64999]],
  PR: [[80000, 87999]],
  RJ: [[20000, 28999]],
  RN: [[59000, 59999]],
  RO: [
    [76800, 76999],
    [78900, 78999],
  ],
  RR: [[69300, 69399]],
  RS: [[90000, 99999]],
  SC: [[88000, 89999]],
  SE: [[49000, 49999]],
  SP: [[1000, 19999]],
  TO: [[77000, 77995]],
};

export { BR_RANGES };
