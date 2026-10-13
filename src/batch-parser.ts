// Batch address parsing functions for processing multiple addresses efficiently

import { parseAddress, parseInformalAddress, parseIntersection, parseLocation } from "./parser";
import type {
  BatchParseError,
  BatchParseOptions,
  BatchParseResult,
  ParsedAddress,
  ParsedIntersection,
  ParseOptions,
} from "./types";

// Core batch processing function that handles the common logic
function processBatch<T>(
  addresses: string[],
  parseFunction: (address: string, options?: ParseOptions) => T | null,
  options: BatchParseOptions = {},
): BatchParseResult<T> {
  const startTime = Date.now();
  const results: (T | null)[] = [];
  const errors: BatchParseError[] = [];

  // The batch-only options are taken out so the parser itself never sees them.
  const {
    stopOnError = false,
    parallel: _parallel,
    chunkSize: _chunkSize,
    includeStats: _includeStats,
    ...parseOptions
  } = options;

  // For now, implement synchronous processing
  // TODO: Add parallel processing support for large batches
  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];

    try {
      const result = parseFunction(address, parseOptions);
      results.push(result);

      // Track parsing failures (when parser returns null)
      if (result === null) {
        errors.push({
          index: i,
          error: "Address parsing returned null - invalid or unparseable format",
          input: address,
        });

        // Stop processing if stopOnError is enabled and we have an error
        if (stopOnError) {
          break;
        }
      }
    } catch (error) {
      // Track actual exceptions
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({
        index: i,
        error: `Parsing exception: ${errorMessage}`,
        input: address,
      });

      results.push(null);

      // Stop processing if stopOnError is enabled
      if (stopOnError) {
        break;
      }
    }
  }

  const endTime = Date.now();
  const duration = endTime - startTime;
  const successful = results.filter((r) => r !== null).length;
  const failed = results.length - successful;

  const stats = {
    total: addresses.length,
    successful,
    failed,
    duration,
    averagePerAddress: addresses.length > 0 ? duration / addresses.length : 0,
    addressesPerSecond: duration > 0 ? (addresses.length / duration) * 1000 : 0,
  };

  return {
    results,
    errors,
    stats,
  };
}

/**
 * Parses many addresses with `parseLocation`, in order.
 *
 * @param addresses - The addresses, one string each.
 * @param options - How to parse every one of them (see `ParseOptions`).
 * @returns One result per address, in the same order: the parts, or `null` where an address could not be read.
 * @example
 * ```ts
 * import { parseLocations } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseLocations(["100 Queen St W, Toronto, ON M5H 2N2", "大阪府大阪市北区梅田3-1-1"]).map((one) => one?.country));
 * // → ["CA","JP"]
 * ```
 */
function parseLocations(addresses: string[], options?: ParseOptions): (ParsedAddress | null)[] {
  const batchOptions: BatchParseOptions = {
    ...options,
    includeStats: false,
  };
  const result = processBatch(addresses, parseLocation, batchOptions);
  return result.results as (ParsedAddress | null)[];
}

/**
 * Parses many street addresses with `parseAddress`, in order.
 *
 * @param addresses - The addresses, one string each.
 * @param options - How to parse every one of them (see `ParseOptions`).
 * @returns One result per address, in the same order, `null` where an address could not be read.
 * @example
 * ```ts
 * import { parseAddresses } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseAddresses(["10 Main St, Anytown, NY 12345", "PO Box 12, Springfield, IL 62701"]).map((one) => one?.city));
 * // → ["Anytown","Springfield"]
 * ```
 */
function parseAddresses(addresses: string[], options?: ParseOptions): (ParsedAddress | null)[] {
  const batchOptions: BatchParseOptions = {
    ...options,
    includeStats: false,
  };
  const result = processBatch(addresses, parseAddress, batchOptions);
  return result.results as (ParsedAddress | null)[];
}

/**
 * Parses many loosely written addresses with `parseInformalAddress`, in order.
 *
 * @param addresses - The addresses, one string each.
 * @param options - How to parse every one of them (see `ParseOptions`).
 * @returns One result per address, in the same order, `null` where nothing could be read.
 * @example
 * ```ts
 * import { parseInformalAddresses } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseInformalAddresses(["Downtown near City Hall, Springfield IL 62701"]).map((one) => one?.zip));
 * // → ["62701"]
 * ```
 */
function parseInformalAddresses(addresses: string[], options?: ParseOptions): (ParsedAddress | null)[] {
  const batchOptions: BatchParseOptions = {
    ...options,
    includeStats: false,
  };
  const result = processBatch(addresses, parseInformalAddress, batchOptions);
  return result.results as (ParsedAddress | null)[];
}

/**
 * Parses many intersections with `parseIntersection`, in order.
 *
 * @param addresses - The intersections, one string each.
 * @param options - How to parse every one of them (see `ParseOptions`).
 * @returns One result per intersection, in the same order, `null` where one could not be read.
 * @example
 * ```ts
 * import { parseIntersections } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseIntersections(["Yonge St and Bloor St, Toronto, ON"]).map((one) => one?.street2));
 * // → ["Bloor"]
 * ```
 */
function parseIntersections(addresses: string[], options?: ParseOptions): (ParsedIntersection | null)[] {
  const batchOptions: BatchParseOptions = {
    ...options,
    includeStats: false,
  };
  const result = processBatch(addresses, parseIntersection, batchOptions);
  return result.results as (ParsedIntersection | null)[];
}

/**
 * Parses many addresses with `parseLocation`, and reports which failed and how long it took. A failure is recorded and
 * the batch goes on, unless `options.stopOnError` is set.
 *
 * @param addresses - The addresses, one string each.
 * @param options - How to parse, plus the batch settings (see `BatchParseOptions`).
 * @returns The results in order (`null` for a failure), the errors with their index and input, and the counts and
 * timing.
 * @example
 * ```ts
 * import { parseLocationsBatch } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseLocationsBatch(["100 Queen St W, Toronto, ON M5H 2N2", "", "大阪府大阪市北区梅田3-1-1"]).stats.successful);
 * // → 2
 * ```
 */
function parseLocationsBatch(addresses: string[], options?: BatchParseOptions): BatchParseResult<ParsedAddress> {
  return processBatch(addresses, parseLocation, options) as BatchParseResult<ParsedAddress>;
}

/**
 * Parses many street addresses with `parseAddress`, and reports which failed and how long it took.
 *
 * @param addresses - The addresses, one string each.
 * @param options - How to parse, plus the batch settings (see `BatchParseOptions`).
 * @returns The results in order (`null` for a failure), the errors, and the counts and timing.
 * @example
 * ```ts
 * import { parseAddressesBatch } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseAddressesBatch(["10 Main St, Anytown, NY 12345", "PO Box 12, Springfield, IL 62701"]).stats.successful);
 * // → 2
 * ```
 */
function parseAddressesBatch(addresses: string[], options?: BatchParseOptions): BatchParseResult<ParsedAddress> {
  return processBatch(addresses, parseAddress, options) as BatchParseResult<ParsedAddress>;
}

/**
 * Parses many loosely written addresses with `parseInformalAddress`, and reports which failed and how long it took.
 *
 * @param addresses - The addresses, one string each.
 * @param options - How to parse, plus the batch settings (see `BatchParseOptions`).
 * @returns The results in order (`null` for a failure), the errors, and the counts and timing.
 * @example
 * ```ts
 * import { parseInformalAddressesBatch } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseInformalAddressesBatch(["Main St, Anytown NY"]).stats.successful);
 * // → 1
 * ```
 */
function parseInformalAddressesBatch(
  addresses: string[],
  options?: BatchParseOptions,
): BatchParseResult<ParsedAddress> {
  return processBatch(addresses, parseInformalAddress, options) as BatchParseResult<ParsedAddress>;
}

/**
 * Parses many intersections with `parseIntersection`, and reports which failed and how long it took.
 *
 * @param addresses - The intersections, one string each.
 * @param options - How to parse, plus the batch settings (see `BatchParseOptions`).
 * @returns The results in order (`null` for a failure), the errors, and the counts and timing.
 * @example
 * ```ts
 * import { parseIntersectionsBatch } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseIntersectionsBatch(["Yonge St and Bloor St, Toronto, ON"]).stats.successful);
 * // → 1
 * ```
 */
function parseIntersectionsBatch(
  addresses: string[],
  options?: BatchParseOptions,
): BatchParseResult<ParsedIntersection> {
  return processBatch(addresses, parseIntersection, options) as BatchParseResult<ParsedIntersection>;
}

export {
  parseAddresses,
  parseAddressesBatch,
  parseInformalAddresses,
  parseInformalAddressesBatch,
  parseIntersections,
  parseIntersectionsBatch,
  parseLocations,
  parseLocationsBatch,
};
