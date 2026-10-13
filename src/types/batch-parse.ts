// Batch processing options and result types

import type { ParseOptions } from "./parse-options";
import type { ParsedAddress } from "./parsed-address";
import type { ParsedIntersection } from "./parsed-intersection";

/**
 * Options for the batch parsers: the parse options, plus whether to stop at the first error and whether to include the
 * statistics.
 *
 * @example
 * ```ts
 * import { parseLocationsBatch } from "@johnmorrisdotca/address-plus";
 * import type { BatchParseOptions } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseLocationsBatch(["123 Main St, Anytown, NY 12345"], { country: "US" }).stats.total);
 * // → 1
 * ```
 */
interface BatchParseOptions extends ParseOptions {
  stopOnError?: boolean; // Whether to stop processing on first error (default: false)
  parallel?: boolean; // Process addresses in parallel where possible (default: false)
  chunkSize?: number; // Size of chunks for parallel processing (default: 100)
  includeStats?: boolean; // Include performance statistics in result (default: true)
}

/**
 * One address a batch could not parse: its index, the input and the reason.
 *
 * @example
 * ```ts
 * import { parseLocationsBatch } from "@johnmorrisdotca/address-plus";
 * import type { BatchParseError } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseLocationsBatch([""]).errors[0].index);
 * // → 0
 * ```
 */
interface BatchParseError {
  index: number; // Index of the failed address in the input array
  error: string; // Error message describing what went wrong
  input: string; // Original input that failed to parse
}

/**
 * The counts and timing of a batch: how many were parsed, how many failed, and how long it took.
 *
 * @example
 * ```ts
 * import { parseLocationsBatch } from "@johnmorrisdotca/address-plus";
 * import type { BatchParseStats } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseLocationsBatch(["123 Main St, Anytown, NY 12345", ""]).stats.failed);
 * // → 1
 * ```
 */
interface BatchParseStats {
  total: number; // Total number of addresses processed
  successful: number; // Number of successfully parsed addresses
  failed: number; // Number of failed parsing attempts
  duration: number; // Total processing time in milliseconds
  averagePerAddress: number; // Average processing time per address in milliseconds
  addressesPerSecond: number; // Addresses processed per second
}

/**
 * What a batch parser returns: the results in order, the errors and the statistics.
 *
 * @example
 * ```ts
 * import { parseLocationsBatch } from "@johnmorrisdotca/address-plus";
 * import type { BatchParseResult } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseLocationsBatch(["123 Main St, Anytown, NY 12345"]).results.length);
 * // → 1
 * ```
 */
interface BatchParseResult<T = ParsedAddress | ParsedIntersection> {
  results: (T | null)[]; // Array of parsed results (null for failed parses)
  errors: BatchParseError[]; // Array of errors that occurred during parsing
  stats: BatchParseStats; // Performance and processing statistics
}

export type { BatchParseError, BatchParseOptions, BatchParseResult, BatchParseStats };
