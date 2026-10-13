import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/",
      ".docs-examples/",
      "node_modules/",
      "coverage/",
      "test-management/",
      "scripts/*.js",
      "scripts/scripts/",
      "scripts/src/",
      "site/",
      "test-results/",
      "playwright-report/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Japanese text is full of the ideographic space (U+3000), in regular expressions and in examples, on purpose.
    files: ["src/jp/**/*.ts", "src/constants/jp/**/*.ts", "src/__tests__/japan/**/*.ts", "scripts/jp/**/*.ts"],
    rules: {
      "no-irregular-whitespace": [
        "error",
        { skipComments: true, skipRegExps: true, skipStrings: true, skipTemplates: true },
      ],
    },
  },
  {
    files: ["src/**/*.test.js", "scripts/validate-schemas.js", "scripts/**/*.ts", "scripts/**/*.mjs"],
    languageOptions: {
      globals: { console: "readonly", process: "readonly", fetch: "readonly", Buffer: "readonly", URL: "readonly" },
    },
  },
  // The demo page runs in a browser, its build scripts and browser tests in Node with code that runs in the page.
  {
    files: ["demo/**/*.js", "e2e/**/*.mjs", "scripts/*.mjs", "playwright.config.mjs"],
    languageOptions: {
      globals: {
        clearTimeout: "readonly",
        console: "readonly",
        document: "readonly",
        familyLanguage: "readonly",
        fetch: "readonly",
        getComputedStyle: "readonly",
        navigator: "readonly",
        Node: "readonly",
        setTimeout: "readonly",
        URL: "readonly",
        window: "readonly",
      },
    },
  },
  // The demo's own tools save files and copy to the clipboard: Blob is declared here only, since a shared script
  // declares it for itself.
  {
    files: ["demo/**/*.js"],
    languageOptions: { globals: { Blob: "readonly" } },
  },
);
