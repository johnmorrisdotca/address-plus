// Shared reading and judging of the corpus files under test-data/corpus. The country suites, the
// parse-address parity report and the scripts that mark todo cases all judge a case the same way,
// so the rule lives here once.

import { readdirSync, readFileSync } from "fs";
import { join } from "path";

import { describe, expect, it } from "vitest";

import { australia } from "../../au";
import { germany } from "../../de";
import { spain } from "../../es";
import { france } from "../../fr";
import { unitedKingdom } from "../../gb";
import { italy } from "../../it";
import { netherlands } from "../../nl";
import { newZealand } from "../../nz";
import { parseLocation } from "../../parser";
import type { CountryModule, ParsedAddress, ParseOptions } from "../../types";

// Every field a corpus case can name.
type CorpusField = keyof ParsedAddress;

// One case as it is written in a corpus file.
interface CorpusCase {
  name: string; // Short title, shown as the test name
  description: string; // What shape of address the case stands for
  input: string; // The text handed to parseLocation
  expected: Partial<Record<CorpusField, string | boolean | null>> | null; // null: the parse must fail
  source: string; // Where the shape or the example comes from, with its licence
  options?: ParseOptions; // Options handed to parseLocation with the input, when the case needs them
  ignoreCase?: CorpusField[]; // Fields compared without regard to letter case (free text in shouted input)
  partial?: boolean; // When true, core fields the case does not name are not checked for absence
  todo?: boolean; // The parser gets this case wrong today; the case is registered with it.todo
  todoNote?: string; // One line: what comes out instead
}

// A corpus file: the standard test-file shape, one array of cases per shape group.
interface CorpusFile {
  name: string;
  description: string;
  tests: Record<string, CorpusCase[]>;
}

// A corpus file together with where it was read from.
interface LoadedCorpusFile {
  fileName: string;
  data: CorpusFile;
}

// One way a result differs from what a case expects.
interface FieldMismatch {
  field: string;
  expected: unknown;
  actual: unknown;
}

// The fields every complete case accounts for. A field here that the case does not name must be absent
// from the result, so a parser that invents a prefix or a unit fails as surely as one that loses it.
const CORE_FIELDS: CorpusField[] = [
  "number",
  "prefix",
  "street",
  "type",
  "suffix",
  "secUnitType",
  "secUnitNum",
  "city",
  "state",
  "zip",
  "plus4",
  "country",
];

// Japan's own fields play the part of the core fields in the Japanese corpus. The shared fields a Japanese
// address also fills (state, city, street, number, zip) repeat these, so they are not judged again.
const JAPAN_CORE_FIELDS: CorpusField[] = [
  "postalCode",
  "prefecture",
  "municipality",
  "streetDirections",
  "town",
  "chome",
  "ban",
  "go",
  "building",
  "floor",
  "room",
  "country",
];

// Australia's core fields: the shared ones its addresses fill, with the level, the lot and a building's name.
const AUSTRALIA_CORE_FIELDS: CorpusField[] = [
  "building",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "lot",
  "number",
  "street",
  "type",
  "suffix",
  "city",
  "state",
  "zip",
  "country",
];

// The United Kingdom's core fields: the parts of Royal Mail's Postcode Address File, and the nation the postcode
// delivers to.
const UK_CORE_FIELDS: CorpusField[] = [
  "subBuilding",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "building",
  "number",
  "dependentThoroughfare",
  "street",
  "type",
  "doubleDependentLocality",
  "locality",
  "city",
  "county",
  "bfpo",
  "zip",
  "nation",
  "country",
];

// France's core fields: the lines of La Poste's norm, from who it is care of to the commune, and the department.
const FRANCE_CORE_FIELDS: CorpusField[] = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "staircase",
  "entrance",
  "number",
  "numberExtension",
  "type",
  "street",
  "lieuDit",
  "postalBoxType",
  "postalBoxNum",
  "city",
  "arrondissement",
  "cedex",
  "state",
  "zip",
  "country",
];

// Germany's core fields: the lines above the street, the street and its number, the place and the Land.
const GERMANY_CORE_FIELDS: CorpusField[] = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "street",
  "number",
  "locality",
  "city",
  "state",
  "zip",
  "country",
];

// The Netherlands' core fields: the street and its house number with the addition, a Postbus, the place and the postcode.
const NETHERLANDS_CORE_FIELDS: CorpusField[] = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "street",
  "number",
  "numberExtension",
  "city",
  "zip",
  "country",
];

// Spain's core fields: the street and its number, the staircase, the floor and the door, the place, the province in
// brackets, the province's code and the postcode.
const SPAIN_CORE_FIELDS: CorpusField[] = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "staircase",
  "entrance",
  "street",
  "number",
  "locality",
  "city",
  "county",
  "state",
  "zip",
  "country",
];

// Italy's core fields: the street and its civic number with its letter, the staircase, the floor and the flat, the
// frazione, the place, the province's sigla and the postcode.
const ITALY_CORE_FIELDS: CorpusField[] = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "staircase",
  "street",
  "number",
  "numberExtension",
  "locality",
  "city",
  "state",
  "zip",
  "country",
];

// New Zealand's core fields: the unit and the level, the street's number and name, the suburb, the city, the region and
// the postcode.
const NEW_ZEALAND_CORE_FIELDS: CorpusField[] = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "number",
  "street",
  "locality",
  "city",
  "state",
  "zip",
  "country",
];

// The core fields each corpus folder is judged by.
const CORE_FIELDS_BY_COUNTRY: Readonly<Record<string, CorpusField[]>> = {
  au: AUSTRALIA_CORE_FIELDS,
  canada: CORE_FIELDS,
  de: GERMANY_CORE_FIELDS,
  es: SPAIN_CORE_FIELDS,
  fr: FRANCE_CORE_FIELDS,
  gb: UK_CORE_FIELDS,
  it: ITALY_CORE_FIELDS,
  japan: JAPAN_CORE_FIELDS,
  nl: NETHERLANDS_CORE_FIELDS,
  nz: NEW_ZEALAND_CORE_FIELDS,
  us: CORE_FIELDS,
};

// The country modules every case of a module's folder is read with, and the hint each folder gives: a case in au/ is
// read as parseLocation(input, { country: "AU", countries }), the reliable path. Whether the same addresses are told
// apart with no hint is the detection suite's question (src/__tests__/countries/detection.test.ts).
const COUNTRY_MODULES: readonly CountryModule[] = [
  australia,
  france,
  germany,
  italy,
  netherlands,
  newZealand,
  spain,
  unitedKingdom,
];
const MODULE_HINTS: Readonly<Record<string, ParseOptions["country"]>> = {
  au: "AU",
  de: "DE",
  es: "ES",
  fr: "FR",
  gb: "GB",
  it: "IT",
  nl: "NL",
  nz: "NZ",
};

const CORPUS_ROOT: string = join(__dirname, "../../../test-data/corpus");

// Read every corpus file of one country, in a stable order.
function loadCorpus(country: string): LoadedCorpusFile[] {
  const folder: string = join(CORPUS_ROOT, country);
  const fileNames: string[] = readdirSync(folder)
    .filter((fileName: string) => fileName.endsWith(".json"))
    .sort();

  return fileNames.map((fileName: string) => ({
    data: JSON.parse(readFileSync(join(folder, fileName), "utf-8")) as CorpusFile,
    fileName,
  }));
}

// Every case of one country, flattened.
function allCases(country: string): CorpusCase[] {
  return loadCorpus(country).flatMap((file: LoadedCorpusFile) => Object.values(file.data.tests).flat());
}

// A missing field and a field set to undefined or null all mean "not there".
function isAbsent(value: unknown): boolean {
  return value === undefined || value === null;
}

function sameValue(expected: unknown, actual: unknown, ignoreCase: boolean): boolean {
  if (ignoreCase && typeof expected === "string" && typeof actual === "string") {
    return expected.toLowerCase() === actual.toLowerCase();
  }

  return expected === actual;
}

// Compare one parse result with what a case expects. An empty list means the case passes. The core fields
// are the US and Canadian ones unless a folder's are given (coreFieldsOf).
function judgeCase(
  testCase: CorpusCase,
  result: ParsedAddress | null,
  coreFields: CorpusField[] = CORE_FIELDS,
): FieldMismatch[] {
  if (testCase.expected === null) {
    return result === null ? [] : [{ actual: result, expected: null, field: "(result)" }];
  }
  if (result === null) {
    return [{ actual: null, expected: testCase.expected, field: "(result)" }];
  }

  const mismatches: FieldMismatch[] = [];
  const ignoreCase: Set<CorpusField> = new Set(testCase.ignoreCase ?? []);
  const actualFields: Record<string, unknown> = result as Record<string, unknown>;

  for (const [field, expectedValue] of Object.entries(testCase.expected)) {
    const actualValue: unknown = actualFields[field];
    const matches: boolean = isAbsent(expectedValue)
      ? isAbsent(actualValue)
      : sameValue(expectedValue, actualValue, ignoreCase.has(field as CorpusField));

    if (!matches) {
      mismatches.push({ actual: actualValue, expected: expectedValue, field });
    }
  }

  if (!testCase.partial) {
    for (const field of coreFields) {
      if (!(field in testCase.expected) && !isAbsent(actualFields[field])) {
        mismatches.push({ actual: actualFields[field], expected: undefined, field });
      }
    }
  }

  return mismatches;
}

// The core fields a corpus folder is judged by.
function coreFieldsOf(country: string): CorpusField[] {
  return CORE_FIELDS_BY_COUNTRY[country] ?? CORE_FIELDS;
}

// Parse a case's input the way every corpus suite does. A case of a module's folder is read through parseLocation with
// the module and the folder's hint.
function parseCase(testCase: CorpusCase, country?: string): ParsedAddress | null {
  const hint = country === undefined ? undefined : MODULE_HINTS[country];
  if (hint) {
    return parseLocation(testCase.input, { country: hint, countries: COUNTRY_MODULES, ...testCase.options });
  }

  return testCase.options ? parseLocation(testCase.input, testCase.options) : parseLocation(testCase.input);
}

// One line saying what came out instead, for a todo note or a failure message.
function describeMismatches(mismatches: FieldMismatch[]): string {
  return mismatches
    .map((mismatch: FieldMismatch) => {
      if (mismatch.field === "(result)") {
        return mismatch.actual === null ? "parse returned null" : `parse returned ${JSON.stringify(mismatch.actual)}`;
      }

      return `${mismatch.field}: ${JSON.stringify(mismatch.actual) ?? "absent"} (want ${JSON.stringify(mismatch.expected) ?? "absent"})`;
    })
    .join("; ");
}

// Register one country's corpus: a describe block per file and per shape group, an it per case. A case
// marked todo goes through it.todo, so the suite stays green and the gap is listed in the output. One
// more test per file fails when a todo case has started to pass, so the flag is cleared as the parser
// improves and the list of gaps never overstates them.
function registerCorpusSuite(country: string, title: string): void {
  const coreFields: CorpusField[] = coreFieldsOf(country);

  describe(title, () => {
    for (const file of loadCorpus(country)) {
      describe(`${file.fileName}: ${file.data.name}`, () => {
        for (const [groupName, cases] of Object.entries(file.data.tests)) {
          describe(groupName, () => {
            for (const testCase of cases) {
              if (testCase.todo) {
                it.todo(`${testCase.name} [${testCase.input}] gives ${testCase.todoNote ?? "a wrong result"}`);
                continue;
              }
              it(`${testCase.name} [${testCase.input}]`, () => {
                const mismatches: FieldMismatch[] = judgeCase(testCase, parseCase(testCase, country), coreFields);

                expect(mismatches, describeMismatches(mismatches)).toEqual([]);
              });
            }
          });
        }

        it("has no todo case that now passes", () => {
          const nowPassing: string[] = Object.values(file.data.tests)
            .flat()
            .filter(
              (testCase: CorpusCase) =>
                testCase.todo && judgeCase(testCase, parseCase(testCase, country), coreFields).length === 0,
            )
            .map((testCase: CorpusCase) => testCase.name);

          expect(nowPassing, "these cases pass now; remove their todo flag").toEqual([]);
        });
      });
    }
  });
}

export {
  allCases,
  AUSTRALIA_CORE_FIELDS,
  CORE_FIELDS,
  coreFieldsOf,
  COUNTRY_MODULES,
  describeMismatches,
  FRANCE_CORE_FIELDS,
  GERMANY_CORE_FIELDS,
  ITALY_CORE_FIELDS,
  JAPAN_CORE_FIELDS,
  judgeCase,
  loadCorpus,
  NETHERLANDS_CORE_FIELDS,
  NEW_ZEALAND_CORE_FIELDS,
  parseCase,
  registerCorpusSuite,
  SPAIN_CORE_FIELDS,
  UK_CORE_FIELDS,
};
export type { CorpusCase, CorpusField, CorpusFile, FieldMismatch, LoadedCorpusFile };
