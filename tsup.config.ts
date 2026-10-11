import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    element: "src/element.ts",
    "element-define": "src/element-define.ts",
    "jp/index": "src/jp/index.ts",
    "au/index": "src/au/index.ts",
    "gb/index": "src/gb/index.ts",
    "de/index": "src/de/index.ts",
    "fr/index": "src/fr/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  splitting: true,
  sourcemap: true,
  minify: false,
  target: "es2022",
  outDir: "dist",
  // Bundle both helpers so the form field also loads directly in a browser without an import map.
  noExternal: ["@johnmorrisdotca/hikidashi", "fast-levenshtein"],
});
