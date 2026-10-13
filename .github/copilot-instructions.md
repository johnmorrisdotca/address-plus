---
applyTo: "**/*.{ts,tsx,js,jsx}"
---

# Coding Conventions for Copilot Agent

## Module Structure

- **Use ES Modules exclusively** - no CommonJS (`require`/`module.exports`).
- All files must use `import` and `export` statements.
- Imports must appear at the top of the file. `prettier-plugin-organize-imports` orders them; run `pnpm lint:fix`.
- Exports must be placed at the end of the file.
- Scripts run by plain `node` (`scripts/**/*.ts`) use relative imports with the `.ts` extension; everything under `src/` uses extensionless relative imports.

## Toolchain

- Node 24, pnpm 10, TypeScript 5.9, tsup 8.5, Vitest 5.
- ESLint 9 with the flat config in `eslint.config.js` (typescript-eslint recommended). Prettier formats, with `prettier-plugin-organize-imports` ordering imports.
- `pnpm check` runs everything CI runs: lint, typecheck, test, build, test:types, schema:validate, test:package. Run it before pushing.
- Never disable a lint rule to get green. If a rule is wrong for this repository, change it in `eslint.config.js` with a comment saying why.
- Eight entry points are built: the root, `./jp`, `./au`, `./gb`, `./fr`, `./de`, `./element` and `./element/define`. The `/jp` bundle must not carry the US street-type tables (`pnpm test:package` checks).
- Files named `*.data.ts` and `src/constants/sub-regions.ts` are generated (`pnpm data:jp`, `pnpm data:sub-regions`); never edit them by hand, change the generator in `scripts/`.
- Releases: add entries under `## Unreleased` in `CHANGELOG.md`, then `pnpm release <version>` from a clean `main`, then push the commit and the `v<version>` tag. The tag publishes. See `AGENTS.md`.

## Formatting Rules

- Indentation: 2 spaces, no tabs.
- Quotes: Use double quotes (`"`) for strings and props.
- Trailing commas: Required in multiline structures.
- Arrow functions: Always include parentheses.
- Brackets: Use spacing inside object literals.
- Line padding:
  - Add blank lines before `return` statements.
  - Add blank lines after variable declarations.
- Max line length: 120 characters.
- No multiple empty lines: Max 1, none at BOF/EOF.

## Comment Style & Documentation

- **Every public export carries a TSDoc block** (`/** */`): a summary, an `@param` for each parameter, `@returns` saying what `null` or `undefined` means, and an `@example` in a fenced block whose last line is `// → <answer>`. Editors show it on hover from the published `.d.ts`. `pnpm docs:legacy-check` (part of `pnpm check`) fails on an export without one, on a missing `@param` or `@returns`, on a block the build drops, and on an example whose answer is not what the built package gives. The generated tables get theirs from their generator.
- **Everything else uses concise `//` single-line comments**, not JSDoc blocks, for brevity.
- **Never use emoji, icons, or symbols** in comments, documentation, or any text output.
- Place comments above the code they describe, not inline unless necessary.
- For interfaces and types, use inline comments after properties: `property: string; // Description`
- For multi-line explanations, use multiple single-line comments:
  ```typescript
  // This function handles complex address parsing logic
  // It normalizes input and extracts components systematically
  // Returns null if the input cannot be parsed
  function parseAddress(input: string): ParsedAddress | null;
  ```
- Avoid redundant comments that simply restate the code.
- Focus on explaining **why** something is done, not **what** is being done.

## TypeScript Rules

- Do not use `any`; the lint rejects it. Use `unknown` and narrow, or a real type.
- Use consistent type imports.
- **All props, state, and function signatures must be explicitly typed.**
- **Add explicit types for variables when type inference is not clear.**
- **Function parameters and return types must be explicitly declared.**
- Use PascalCase, camelCase, or UPPER_CASE for variables.
- Prefix an intentionally unused parameter or destructured name with `_`; any other unused name fails the lint.
- Prefer async/await over `.then()` chains.
- Use type annotations for better code clarity: `const result: ParsedAddress = parseLocation(input);`

## Naming & Readability

- Do not use short or cryptic variable names like `x`, `y`, `tmp`, or `val`.
- All constants and variables must be descriptive and reflect their purpose.
- Use meaningful names for functions, parameters, and return values.

## UI Text & Accessibility

- **Never use emoji, icons, or visual symbols** in any user-facing text, console output, or documentation.
- Centralize all user-facing strings (e.g., labels, titles, ARIA attributes) at the top of the file.
- Do not inline text in JSX or props.
- Use semantic HTML and ARIA roles/labels where appropriate.
- Ensure keyboard accessibility and screen-reader compatibility.

## Constants & Configuration

- Declare static arrays (e.g., dropdown options, filters) at the top of the file.
- Declare all URLs (API endpoints, external links) as constants at the top.
- Reference constants throughout the component to ensure DRY code.
- **Use descriptive constant names and group related constants together.**
- **Export constants from dedicated files in `src/data/` for reusability.**
- **NEVER use inline constants or regular expressions in code** - all constants must be imported from appropriate files under `/src/constants/` or `/src/patterns/`
- **All regex patterns must be defined in `/src/patterns/` and imported** - no inline regex literals allowed
- **String constants, arrays, and configuration objects must be exported from `/src/constants/`** and imported where needed

## Data Architecture

- **Use scalable data structures** for geographic and regional data.
- **Create comprehensive lookup sets and maps** for fast searching (e.g., `SUB_REGION_NAMES`, `SUB_REGION_MAP`).
- **Maintain backward compatibility** when updating data structures.
- **Group related data types** in structured interfaces with proper typing.
- **Use enum-like patterns** for standardized values (countries, regions, etc.).

## JSX Style

- Prefer one-liner JSX when elements fit within 132 characters.
- Break into multiple lines only when readability improves.

## Testing

- Cover all branches and error cases.
- Use mocks for dependencies and mock before importing the module under test.
- **ALL test data MUST be stored in JSON files in the `/test-data/` folder - NO hardcoded test data inline in test files.**
- **Import JSON test data constants at the top of test files, immediately after other imports.**
- **Organize test data JSON files in appropriate subfolders within `/test-data/` (e.g., `/test-data/formatting/`, `/test-data/parsing/`).**
- **Use descriptive names for JSON test data files without redundant suffixes (e.g., `address-formatting.json`, not `address-formatting-test-data.json`).**

## Package Management

- **Always use `pnpm`** instead of `npm` or `yarn` for this project.
- Run tests with: `pnpm test`
- Build with: `pnpm build`
- Install dependencies with: `pnpm install`
- Run every check with: `pnpm check`

## Prompting Behavior

- If a preference is not listed here, ask for clarification before generating code.
- **When refactoring existing code, maintain backward compatibility unless explicitly asked to break it.**
- **Always verify changes don't break existing functionality by running tests.**
- **Use systematic approach when updating multiple files** - work through them methodically.
- **Prioritize code clarity and maintainability** over brevity when they conflict.

The documentation site also checks real package imports with `pnpm docs:check`. `pnpm check` retains both that strict check and the native expected-answer/declaration check.
