import { describe, expect, it } from "vitest";

import testData from "../../../test-data/utilities/address-formatting.json";
import type { ParsedAddress } from "../../types";
import { formatAddress, formatCanadaPost, formatUSPS, getAddressAbbreviations } from "../../utils/address-formatting";
import type { FormattingTestCase } from "../types/formatting-cases";

// Extract test cases from new structure
const allTests = testData.tests ? Object.values(testData.tests).flat() : [];
const formatAddressTests = testData.tests?.formatAddress || allTests;
const formatUSPSTests = testData.tests?.formatUSPS || [];
const formatCanadaPostTests = testData.tests?.formatCanadaPost || [];
const getAddressAbbreviationsTests = testData.tests?.getAddressAbbreviations || [];
const edgeCasesTests = testData.tests?.edgeCases || [];

describe("Address Formatting API", () => {
  describe("formatAddress", () => {
    formatAddressTests.forEach((testCase: FormattingTestCase, index: number) => {
      it(`should ${testCase.description} (test ${index + 1})`, () => {
        const result = formatAddress(testCase.input as ParsedAddress, testCase.options);

        if (testCase.expected.lines) {
          expect(result.lines).toEqual(testCase.expected.lines);
        }

        if (testCase.expected.singleLine) {
          expect(result.singleLine).toBe(testCase.expected.singleLine);
        }

        if (testCase.expected.format) {
          expect(result.format).toBe(testCase.expected.format);
        }

        if (testCase.expected.shouldNotContain) {
          expect(result.lines.join(" ")).not.toContain(testCase.expected.shouldNotContain);
        }

        if (testCase.expected.shouldContain) {
          expect(result.lines.join(" ")).toContain(testCase.expected.shouldContain);
        }

        if (testCase.expected.regex) {
          expect(result.lines.join(" ")).toMatch(new RegExp(testCase.expected.regex));
        }
      });
    });
  });

  describe("formatUSPS", () => {
    formatUSPSTests.forEach((testCase: FormattingTestCase, index: number) => {
      it(`should ${testCase.description} (test ${index + 1})`, () => {
        const result = formatUSPS(testCase.input as ParsedAddress, testCase.options);

        if (testCase.expected.lines) {
          expect(result.lines).toEqual(testCase.expected.lines);
        }

        if (testCase.expected.format) {
          expect(result.format).toBe(testCase.expected.format);
        }
      });
    });
  });

  describe("formatCanadaPost", () => {
    formatCanadaPostTests.forEach((testCase: FormattingTestCase, index: number) => {
      it(`should ${testCase.description} (test ${index + 1})`, () => {
        const result = formatCanadaPost(testCase.input as ParsedAddress, testCase.options);

        if (testCase.expected.lines) {
          expect(result.lines).toEqual(testCase.expected.lines);
        }

        if (testCase.expected.format) {
          expect(result.format).toBe(testCase.expected.format);
        }

        if (testCase.expected.country) {
          expect(result.country).toBe(testCase.expected.country);
        }

        if (testCase.expected.regex) {
          expect(result.lines.join(" ")).toMatch(new RegExp(testCase.expected.regex));
        }
      });
    });
  });

  describe("getAddressAbbreviations", () => {
    getAddressAbbreviationsTests.forEach((testCase: FormattingTestCase, index: number) => {
      it(`should ${testCase.description} (test ${index + 1})`, () => {
        const result = getAddressAbbreviations();

        if (testCase.expected.hasProperties) {
          testCase.expected.hasProperties.forEach((prop: string) => {
            expect(result).toHaveProperty(prop);
          });
        }

        if (testCase.expected.streetTypes) {
          Object.keys(testCase.expected.streetTypes).forEach((key) => {
            expect((result.streetTypes as Record<string, unknown>)[key]).toBe(testCase.expected.streetTypes![key]);
          });
        }

        if (testCase.expected.directions) {
          Object.keys(testCase.expected.directions).forEach((key) => {
            expect((result.directions as Record<string, unknown>)[key]).toBe(testCase.expected.directions![key]);
          });
        }

        if (testCase.expected.states) {
          Object.keys(testCase.expected.states).forEach((key) => {
            expect((result.states as Record<string, unknown>)[key]).toBe(testCase.expected.states![key]);
          });
        }

        if (testCase.expected.provinces) {
          Object.keys(testCase.expected.provinces).forEach((key) => {
            expect((result.provinces as Record<string, unknown>)[key]).toBe(testCase.expected.provinces![key]);
          });
        }

        if (testCase.expected.unitTypes) {
          Object.keys(testCase.expected.unitTypes).forEach((key) => {
            expect((result.unitTypes as Record<string, unknown>)[key]).toBe(testCase.expected.unitTypes![key]);
          });
        }
      });
    });
  });

  describe("Edge Cases", () => {
    edgeCasesTests.forEach((testCase: FormattingTestCase, index: number) => {
      it(`should ${testCase.description} (test ${index + 1})`, () => {
        const result = formatAddress(testCase.input as ParsedAddress, testCase.options);

        if (testCase.expected.lines) {
          expect(result.lines).toEqual(testCase.expected.lines);
        }

        if (testCase.expected.singleLine !== undefined) {
          expect(result.singleLine).toBe(testCase.expected.singleLine);
        }
      });
    });
  });
});
