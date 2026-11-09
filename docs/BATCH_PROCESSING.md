# Batch processing

Process multiple addresses efficiently with built-in batch functions:

## Simple Batch Functions

```js
import { parseLocations, parseAddresses, parseIntersections } from "@johnmorrisdotca/address-plus";

// Process multiple addresses (returns array of results)
const addresses = [
  "123 Main St, New York, NY 10001",
  "456 Oak Ave, Los Angeles, CA 90210",
  "789 Pine Rd, Chicago, IL 60601",
];

const results = parseLocations(addresses);
// [
//   { number: '123', street: 'Main', city: 'New York', ... },
//   { number: '456', street: 'Oak', city: 'Los Angeles', ... },
//   { number: '789', street: 'Pine', city: 'Chicago', ... }
// ]

// Process intersections
const intersections = ["Main St & Broadway, New York, NY", "5th Street and Park Ave, San Francisco, CA"];
const intersectionResults = parseIntersections(intersections);
```

## Advanced Batch Functions (with Statistics)

```js
import { parseLocationsBatch, parseAddressesBatch } from "@johnmorrisdotca/address-plus";

const addresses = [
  "123 Main St, New York, NY 10001",
  "", // Invalid address
  "456 Oak Ave, Los Angeles, CA 90210",
];

const result = parseLocationsBatch(addresses);

console.log(result.results);
// [
//   { number: '123', street: 'Main', ... },
//   null,  // Failed to parse
//   { number: '456', street: 'Oak', ... }
// ]

console.log(result.stats);
// {
//   total: 3,
//   successful: 2,
//   failed: 1,
//   duration: 15,           // milliseconds
//   averagePerAddress: 5,   // ms per address
//   addressesPerSecond: 200
// }

console.log(result.errors);
// [
//   {
//     index: 1,
//     error: 'Address parsing returned null - invalid or unparseable format',
//     input: ''
//   }
// ]
```

## Batch Options

```js
import { parseLocationsBatch } from "@johnmorrisdotca/address-plus";

const addresses = ["123 Main St, Seattle, WA 98101", "100 Queen St W, Toronto, ON M5H 2N2"];

// Stop processing on first error
const stopped = parseLocationsBatch(addresses, {
  stopOnError: true,
});

// Pass parsing options to underlying parsers
const strict = parseLocationsBatch(addresses, {
  strict: true, // Enable strict ZIP validation
  country: "CA", // Force Canadian parsing
});
```

## Available Batch Functions

| Function                                           | Input Type | Output Type                            | Description              |
| -------------------------------------------------- | ---------- | -------------------------------------- | ------------------------ |
| `parseLocations(addresses)`                        | `string[]` | `ParsedAddress[]`                      | Simple array processing  |
| `parseAddresses(addresses)`                        | `string[]` | `ParsedAddress[]`                      | Alias for parseLocations |
| `parseInformalAddresses(addresses)`                | `string[]` | `ParsedAddress[]`                      | Process informal formats |
| `parseIntersections(addresses)`                    | `string[]` | `ParsedIntersection[]`                 | Process intersections    |
| `parseLocationsBatch(addresses, options?)`         | `string[]` | `BatchParseResult<ParsedAddress>`      | With statistics          |
| `parseAddressesBatch(addresses, options?)`         | `string[]` | `BatchParseResult<ParsedAddress>`      | With statistics          |
| `parseInformalAddressesBatch(addresses, options?)` | `string[]` | `BatchParseResult<ParsedAddress>`      | With statistics          |
| `parseIntersectionsBatch(addresses, options?)`     | `string[]` | `BatchParseResult<ParsedIntersection>` | With statistics          |

## BatchParseResult Type

```ts
interface BatchParseResult<T> {
  results: (T | null)[]; // Array of parsed results (null for failures)
  errors: BatchParseError[]; // Array of error details
  stats: BatchParseStats; // Performance and count statistics
}

interface BatchParseError {
  index: number; // Index of failed address in input array
  error: string; // Error description
  input: string; // Original input that failed
}

interface BatchParseStats {
  total: number; // Total addresses processed
  successful: number; // Successfully parsed addresses
  failed: number; // Failed addresses
  duration: number; // Total processing time (ms)
  averagePerAddress: number; // Average time per address (ms)
  addressesPerSecond: number; // Processing rate
}
```

## Performance Benefits

Batch processing provides several advantages over individual parsing:

- **Reduced function call overhead**: Single function call for multiple addresses
- **Optimized pattern compilation**: Regex patterns compiled once
- **Better memory allocation**: Efficient array handling
- **Built-in error tracking**: Automatic error collection and reporting
- **Performance metrics**: Built-in timing and statistics
