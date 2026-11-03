import { describe, expect, it } from "vitest";

import testData from "../../../test-data/utilities/address-comparison.json";
import type { ParsedAddress } from "../../types";
import { compareAddresses, getAddressSimilarity, isSameAddress } from "../../utils/address-comparison";
import type { ComparisonEdgeCaseTestCase, ComparisonTestCase } from "../types/comparison-cases";

// Extract test cases from new structure
const allTests = testData.tests ? Object.values(testData.tests).flat() : [];
const compareAddressesTests = testData.tests?.compareAddresses || allTests;
const edgeCasesTests = testData.tests?.edgeCases || [];

describe("Address Comparison API", () => {
  describe("compareAddresses", () => {
    compareAddressesTests.forEach((testCase: ComparisonTestCase, index: number) => {
      it(`should ${testCase.description} (test ${index + 1})`, () => {
        const result = compareAddresses(
          testCase.input.address1 as ParsedAddress,
          testCase.input.address2 as ParsedAddress,
        );

        expect(result.isSame).toBe(testCase.expected.isSame);
        expect(result.similarity.score).toBeCloseTo(testCase.expected.similarity, 1);
      });
    });
  });

  describe("isSameAddress", () => {
    compareAddressesTests.forEach((testCase: ComparisonTestCase, index: number) => {
      it(`should ${testCase.description} (test ${index + 1})`, () => {
        const result = isSameAddress(
          testCase.input.address1 as ParsedAddress,
          testCase.input.address2 as ParsedAddress,
        );
        expect(result).toBe(testCase.expected.isSame);
      });
    });
  });

  describe("getAddressSimilarity", () => {
    compareAddressesTests.forEach((testCase: ComparisonTestCase, index: number) => {
      it(`should ${testCase.description} (test ${index + 1})`, () => {
        const result = getAddressSimilarity(
          testCase.input.address1 as ParsedAddress,
          testCase.input.address2 as ParsedAddress,
        );
        expect(result.score).toBeCloseTo(testCase.expected.similarity, 1);
      });
    });
  });

  describe("Edge Cases", () => {
    edgeCasesTests.forEach((testCase: ComparisonEdgeCaseTestCase, index: number) => {
      it(`should ${testCase.description} (test ${index + 1})`, () => {
        const result = compareAddresses(
          testCase.input.address1 as ParsedAddress,
          testCase.input.address2 as ParsedAddress,
          testCase.input.options,
        );

        if (testCase.expected.isSame !== undefined) {
          expect(result.isSame).toBe(testCase.expected.isSame);
        }

        if (testCase.expected.similarity !== undefined) {
          expect(result.similarity.score).toBeCloseTo(testCase.expected.similarity, 1);
        }

        if (testCase.expected.similarityLessThan !== undefined) {
          expect(result.similarity.score).toBeLessThan(testCase.expected.similarityLessThan);
        }

        if (testCase.expected.comparison?.score !== undefined) {
          expect(result.similarity.score).toBe(testCase.expected.comparison.score);
        }
      });
    });
  });
});
