import { describe, expect, it } from "vitest";

import testData from "../../../test-data/utilities/clean-address.json";
import { cleanAddress, cleanAddressDetailed } from "../../utils/clean-address";
import type {
  AdditionalTestCase,
  CleanAddressDetailedTestCase,
  CleanAddressTestCase,
  EdgeCaseTestCase,
  FormatSpecificTestCase,
} from "../types/utility-cases";

// Extract test cases from new structure
const allTests = testData.tests ? Object.values(testData.tests).flat() : [];
const cleanAddressTests = testData.tests?.cleanAddress || allTests;
const cleanAddressDetailedTests = testData.tests?.cleanAddressDetailed || [];
const formatSpecificTests = testData.tests?.formatSpecific || [];
const edgeCasesTests = testData.tests?.edgeCases || [];
const additionalTests = testData.tests?.additionalTests || [];

describe("Clean Address API", () => {
  describe("cleanAddress", () => {
    cleanAddressTests.forEach(({ name, input, expected, options }: CleanAddressTestCase) => {
      it(`should handle ${name}`, () => {
        const result = cleanAddress(input, options);
        expect(result).toBe(expected);
      });
    });
  });

  describe("cleanAddressDetailed", () => {
    cleanAddressDetailedTests.forEach(({ name, input, expected, options }: CleanAddressDetailedTestCase) => {
      it(`should ${name}`, () => {
        const result = cleanAddressDetailed(input, options);

        if (expected.cleaned !== undefined) {
          expect(result.cleanedAddress).toBe(expected.cleaned);
        }

        if (expected.cleanedAddress !== undefined) {
          expect(result.cleanedAddress).toBe(expected.cleanedAddress);
        }

        if (expected.changes) {
          expected.changes.forEach((change: string) => {
            expect(result.changes.some((c: string) => c.includes(change))).toBe(true);
          });
        }
      });
    });
  });

  describe("Format Specific", () => {
    formatSpecificTests.forEach(({ name, input, expected, expectContains, options }: FormatSpecificTestCase) => {
      it(`should ${name}`, () => {
        const result = cleanAddress(input, options);

        if (expected) {
          expect(result).toBe(expected);
        }

        if (expectContains) {
          expectContains.forEach((expectedText: string) => {
            expect(result).toContain(expectedText);
          });
        }
      });
    });
  });

  describe("Edge Cases", () => {
    edgeCasesTests.forEach(({ name, input, expected, options }: EdgeCaseTestCase) => {
      it(`should handle ${name}`, () => {
        const result = cleanAddress(input, options);
        expect(result).toBe(expected);
      });
    });
  });

  describe("Additional Tests", () => {
    additionalTests.forEach(({ name, input, expected }: AdditionalTestCase) => {
      it(`should handle ${name}`, () => {
        const result = cleanAddress(input);
        expect(result).toBe(expected);
      });
    });
  });
});
