// Test case shapes for validation.

import type { ValidationOptions } from "../../types";

interface ValidationTestCase {
  name: string;
  description?: string;
  input: string;
  expected: {
    isValid?: boolean;
    confidence?: number;
    confidenceGreaterThan?: number;
    completeness?: number;
    completenessGreaterThan?: number;
    completenessLessThan?: number;
    errorCodes?: string[];
    errorsLength?: number;
    errorsLengthGreaterThan?: number;
    warningsLengthGreaterThan?: number;
    parsedAddress?: Record<string, unknown>;
    parsedAddressNull?: boolean;
    firstErrorCode?: string;
    suggestionsLengthGreaterThan?: number;
    suggestionContains?: string;
  };
  options?: ValidationOptions;
}

interface IsValidTestCase {
  name: string;
  description?: string;
  input?: string | string[];
  expected?: boolean | boolean[];
  tests?: Array<{
    input: string;
    expected: boolean;
    options?: ValidationOptions;
  }>;
}

interface GetValidationErrorsTestCase {
  name: string;
  description?: string;
  input: string;
  expected: {
    errorsLengthGreaterThan?: number;
    allSeverityTypes?: string[];
    errorSeverityCount?: number;
    warningSeverityCount?: number;
    length?: number;
    errorCodes?: string[];
    errorsLength?: number;
    firstErrorCode?: string;
    errorMessages?: string[];
    hasErrors?: boolean;
    hasWarnings?: boolean;
    warningsLengthGreaterThan?: number;
    suggestionsLengthGreaterThan?: number;
    suggestionContains?: string;
  };
  options?: ValidationOptions;
}

interface ConfidenceScoringTestCase {
  name: string;
  description?: string;
  inputs?: {
    complete?: string;
    incomplete?: string;
    identical?: string[];
    different?: string[];
  };
  input?: string;
  expected: {
    confidenceComparison?: string;
    confidencesEqual?: boolean;
    confidencesDifferent?: boolean;
    confidence?: number | { min: number; max: number };
    confidenceGreaterThan?: number;
    completeness?: number | { min: number; max: number };
    completenessGreaterThan?: number;
    completenessLessThan?: number;
    isValid?: boolean;
    firstErrorCode?: string;
  };
  options?: ValidationOptions;
}

export type { ConfidenceScoringTestCase, GetValidationErrorsTestCase, IsValidTestCase, ValidationTestCase };
