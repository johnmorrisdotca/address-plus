// Every way of using the package that the guides and the README show, run against the package as npm packs it: the files in examples/ are copied beside a copy of the
// packed package (.usage/node_modules/@johnmorrisdotca/address-plus) and each one is built, type-checked or run, and the ones with a page are opened in a browser,
// which must show the field. The guides and the README must hold these files' text, word for word, so what a reader copies is what was tested.
// `pnpm test:usage` (builds the package and the site first). One browser, one page at a time.
import { type Browser, chromium, type Page } from "@playwright/test";
import { build as esbuild } from "esbuild";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { extname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const at = (...parts: string[]) => join(root, ...parts);
const usage = at(".usage");
const NAME = "@johnmorrisdotca/address-plus";
const require = createRequire(import.meta.url);

/** Run a program and, if it fails, say what it printed. */
const sh = (program: string, args: string[], cwd: string): string => {
  try {
    return execFileSync(program, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    const out = error as { stdout?: string; stderr?: string };
    throw new Error(`${program} ${args.join(" ")} failed:\n${out.stdout ?? ""}${out.stderr ?? ""}`);
  }
};

const only = process.argv.slice(2);
const results: string[] = [];
const failures: string[] = [];
const step = async (name: string, run: () => Promise<void> | void): Promise<void> => {
  if (only.length > 0 && !only.includes(name)) return;
  const started = Date.now();
  try {
    await run();
    results.push(`ok   ${name} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`);
    results.push(`FAIL ${name}`);
  }
  console.log(results[results.length - 1]);
};

// 1. The package as npm packs it, installed beside the examples.
rmSync(usage, { recursive: true, force: true });
mkdirSync(usage, { recursive: true });
const packed = JSON.parse(
  execFileSync("npm", ["pack", "--json", "--pack-destination", usage], { cwd: root, encoding: "utf8" }),
) as { filename: string }[];
const tarball = join(usage, packed[0]!.filename);
const installed = join(usage, "node_modules", "@johnmorrisdotca", "address-plus");
mkdirSync(installed, { recursive: true });
execFileSync("tar", ["-xzf", tarball, "-C", installed, "--strip-components=1"]);
cpSync(at("examples"), join(usage, "examples"), { recursive: true });
const examples = (name: string) => join(usage, "examples", name);

// 2. A page that is a folder of built files, served to the browser without a port.
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};
const serve = async (page: Page, origin: string, folder: string, prefix = ""): Promise<void> => {
  await page.route(`${origin}${prefix}/**`, (route) => {
    const pathname = new URL(route.request().url()).pathname.slice(prefix.length);
    const file = join(folder, decodeURIComponent(pathname.endsWith("/") ? `${pathname}index.html` : pathname));
    if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
    return route.fulfill({ body: readFileSync(file), contentType: TYPES[extname(file)] ?? "application/octet-stream" });
  });
};

const opened = async (browser: Browser, run: (page: Page, errors: string[]) => Promise<void>): Promise<void> => {
  const context = await browser.newContext({ viewport: { width: 800, height: 700 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  try {
    await run(page, errors);
  } finally {
    await context.close();
  }
  if (errors.length > 0) throw new Error(`the page reported errors:\n${errors.join("\n")}`);
};

/** The field is drawn: an <address-field> with its input in the shadow root; with `checked`, its status says the address was checked. */
const seesField = async (scope: { locator: Page["locator"] }, checked = true): Promise<void> => {
  const field = scope.locator("address-field").first();
  await field.waitFor({ state: "attached", timeout: 30_000 });
  await scope
    .locator("address-field")
    .first()
    .evaluate(
      (element, wantStatus) =>
        new Promise<void>((resolve, reject) => {
          const started = Date.now();
          const look = () => {
            const root = element.shadowRoot;
            const input = root?.querySelector("input");
            const status = root?.querySelector("p")?.textContent ?? "";
            if (input && (!wantStatus || /checked/i.test(status))) return resolve();
            if (Date.now() - started > 20_000)
              return reject(
                new Error(`the field is not drawn: ${root?.textContent?.slice(0, 120) ?? "no shadow root"}`),
              );
            setTimeout(look, 100);
          };
          look();
        }),
      checked,
    );
};

// 3. A bundle of one entry, as a CDN's bundler (jsDelivr's /+esm) or a bundler of your own makes it, to stand in for a CDN's answer.
const bundles = new Map<string, string>();
const bundleOf = async (entry: string): Promise<string> => {
  const found = bundles.get(entry);
  if (found !== undefined) return found;
  const out = await esbuild({
    entryPoints: [entry],
    bundle: true,
    format: "esm",
    write: false,
    minify: true,
    absWorkingDir: root,
    logLevel: "silent",
  });
  const text = out.outputFiles[0]!.text;
  bundles.set(entry, text);
  return text;
};
/** unpkg's `?module`: a file of the package with its bare imports made into unpkg addresses, and a dependency's own bundle. */
const unpkgAnswer = async (pathname: string): Promise<string | null> => {
  const own = /^\/@johnmorrisdotca\/address-plus(?:@[^/]+)?\/(.+)$/.exec(pathname);
  if (own) {
    const file = join(installed, own[1]!);
    if (!existsSync(file)) return null;
    return readFileSync(file, "utf8")
      .replace(
        /(from\s+|import\s*\(|import\s+)"([^./"][^"]*)"/g,
        (_, lead: string, bare: string) => `${lead}"https://unpkg.com/${bare}?module"`,
      )
      .replace(
        /(from\s+|import\s*\(|import\s+)"(\.[^"?]*)"/g,
        (_, lead: string, relative: string) => `${lead}"${relative}?module"`,
      );
  }
  const dependency = decodeURIComponent(pathname.slice(1)).replace(/@[\d.]+(?=\/|$)/, "");
  try {
    return await bundleOf(require.resolve(dependency, { paths: [root] }).replace(/\\/g, "/"));
  } catch {
    return null;
  }
};

const pageOf = (file: string) => readFileSync(file, "utf8");
const browser = await chromium.launch();

await step("node", () => {
  const out = execFileSync(process.execPath, [join(examples("node"), "server.mjs")], {
    cwd: usage,
    encoding: "utf8",
  }).trim();
  if (out !== "DC true") throw new Error(`unexpected output: ${out}`);
});

await step("typescript", () => {
  writeFileSync(
    join(examples("typescript"), "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "esnext",
        moduleResolution: "bundler",
        strict: true,
        noEmit: true,
        lib: ["es2023", "dom", "dom.iterable"],
        types: [],
        skipLibCheck: true,
      },
      include: ["index.ts"],
    }),
  );
  sh(
    process.execPath,
    [require.resolve("typescript/bin/tsc"), "-p", join(examples("typescript"), "tsconfig.json")],
    usage,
  );
  // The same file, run: types are erased, so it is plain JavaScript to Node.
  const run = execFileSync(process.execPath, [join(examples("typescript"), "index.ts")], {
    cwd: usage,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (!/^DC true\nXX$/m.test(run)) throw new Error(`unexpected output: ${run}`);
});

await step("cdn-jsdelivr", async () => {
  await opened(browser, async (page) => {
    await page.route("https://cdn.jsdelivr.net/**", (route) => {
      const found = /^\/npm\/@johnmorrisdotca\/address-plus(?:@[^/]+)?\/(.+)$/.exec(
        new URL(route.request().url()).pathname,
      );
      const file = found ? join(installed, found[1]!) : "";
      return found && existsSync(file)
        ? route.fulfill({ body: readFileSync(file), contentType: TYPES[extname(file)] ?? "text/javascript" })
        : route.fulfill({ status: 404, body: "" });
    });
    await page.route("https://page.test/**", (route) =>
      route.fulfill({ body: pageOf(join(examples(""), "cdn-jsdelivr.html")), contentType: "text/html" }),
    );
    await page.goto("https://page.test/");
    await seesField(page);
  });
});

await step("cdn-unpkg", async () => {
  await opened(browser, async (page) => {
    await page.route("https://unpkg.com/**", async (route) => {
      const { pathname, searchParams } = new URL(route.request().url());
      if (!searchParams.has("module")) return route.fulfill({ status: 404, body: "" });
      const body = await unpkgAnswer(pathname);
      return body === null
        ? route.fulfill({ status: 404, body: "" })
        : route.fulfill({ body, contentType: "text/javascript" });
    });
    await page.route("https://page.test/**", (route) =>
      route.fulfill({ body: pageOf(join(examples(""), "cdn-unpkg.html")), contentType: "text/html" }),
    );
    await page.goto("https://page.test/");
    await seesField(page);
  });
});

await step("iframe", async () => {
  if (!existsSync(at("site", "embed", "index.html")))
    throw new Error("site/ is not built: `pnpm test:usage` builds it");
  await opened(browser, async (page) => {
    await serve(page, "https://johnmorrisdotca.github.io", at("site"), "/address-plus");
    await page.route("https://page.test/**", (route) =>
      route.fulfill({ body: pageOf(join(examples(""), "iframe.html")), contentType: "text/html" }),
    );
    await page.goto("https://page.test/");
    await seesField(page.frameLocator("iframe"), false);
  });
});

// The bundlers and frameworks: built, then opened.
const { build: viteBuild } = await import("vite");
const viteApp = async (name: string, plugins: unknown[] = []): Promise<void> => {
  const dir = examples(name);
  const out = join(usage, "out", name);
  await viteBuild({
    root: dir,
    plugins: plugins as never[],
    logLevel: "warn",
    build: { outDir: out, emptyOutDir: true },
    base: "./",
    configFile: false,
  });
  await opened(browser, async (page) => {
    await serve(page, "https://app.test", out);
    await page.goto("https://app.test/");
    await seesField(page);
  });
};

await step("vite", () => viteApp("vite"));
await step("react", () => viteApp("react"));
await step("vue", async () => viteApp("vue", [(await import("@vitejs/plugin-vue")).default()]));
await step("svelte", async () => viteApp("svelte", [(await import("@sveltejs/vite-plugin-svelte")).svelte()]));

await step("react-ssr", async () => {
  const script = join(usage, "ssr-react.tsx");
  writeFileSync(
    script,
    `import { renderToString } from "react-dom/server";\nimport { ShippingAddress } from "./examples/react/ShippingAddress";\nconst html = renderToString(<ShippingAddress />);\nif (!html.includes("<address-field")) throw new Error("no field in " + html);\nconsole.log(html);\n`,
  );
  const out = join(usage, "ssr-react.mjs");
  await esbuild({
    entryPoints: [script],
    outfile: out,
    bundle: true,
    platform: "node",
    format: "esm",
    jsx: "automatic",
    absWorkingDir: root,
    logLevel: "silent",
    external: ["react", "react-dom"],
    splitting: false,
  });
  const html = execFileSync(process.execPath, [out], { cwd: root, encoding: "utf8" });
  if (!html.includes('country="US"')) throw new Error(`the server render lost the field: ${html}`);
});

await step("webpack", async () => {
  const { default: webpack } = await import("webpack");
  const dir = examples("webpack");
  const config = (await import(pathToFileURL(join(dir, "webpack.config.mjs")).href)).default as Record<string, unknown>;
  const stats = await new Promise<import("webpack").Stats>((resolve, reject) => {
    webpack(
      {
        ...config,
        context: dir,
        output: { ...(config.output as object), path: join(usage, "out", "webpack") },
      } as import("webpack").Configuration,
      (error, result) => (error || !result ? reject(error ?? new Error("no result")) : resolve(result)),
    );
  });
  if (stats.hasErrors()) throw new Error(stats.toString({ colors: false, errors: true }));
  const out = join(usage, "out", "webpack");
  writeFileSync(join(out, "index.html"), `<!doctype html><html><body><script src="main.js"></script></body></html>`);
  await opened(browser, async (page) => {
    await serve(page, "https://app.test", out);
    await page.goto("https://app.test/");
    await seesField(page);
  });
});

await step("angular", async () => {
  const dir = examples("angular");
  const out = join(usage, "out", "angular");
  writeFileSync(
    join(dir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "esnext",
        experimentalDecorators: true,
        useDefineForClassFields: false,
      },
    }),
  );
  await esbuild({
    entryPoints: [join(dir, "main.ts")],
    outdir: out,
    bundle: true,
    splitting: true,
    format: "esm",
    tsconfig: join(dir, "tsconfig.json"),
    absWorkingDir: root,
    logLevel: "silent",
    minify: true,
  });
  writeFileSync(join(out, "index.html"), readFileSync(join(dir, "index.html")));
  await opened(browser, async (page) => {
    await serve(page, "https://app.test", out);
    await page.goto("https://app.test/");
    await seesField(page);
  });
});

await browser.close();

// 4. The guides and the README hold what was tested, word for word.
const everything = only.length === 0;
const guide = (name: string) => [`docs/guides/${name}.md`, `docs/guides/ja/${name}.md`];
const FILES: Record<string, string[]> = {
  "cdn-jsdelivr.html": guide("html-and-cdn"),
  "cdn-unpkg.html": guide("html-and-cdn"),
  "iframe.html": guide("embed-in-an-iframe"),
  "vite/main.ts": guide("bundlers"),
  "vite/index.html": guide("bundlers"),
  "webpack/src/index.js": guide("bundlers"),
  "webpack/webpack.config.mjs": guide("bundlers"),
  "react/ShippingAddress.tsx": guide("frameworks"),
  "react/main.tsx": guide("frameworks"),
  "vue/ShippingAddress.vue": guide("frameworks"),
  "vue/main.ts": guide("frameworks"),
  "svelte/ShippingAddress.svelte": guide("frameworks"),
  "svelte/main.ts": guide("frameworks"),
  "angular/shipping-address.component.ts": guide("frameworks"),
  "react/address-field.d.ts": guide("frameworks"),
  "angular/main.ts": guide("frameworks"),
  "typescript/index.ts": guide("typescript-and-node"),
  "node/server.mjs": guide("typescript-and-node"),
};
const normal = (text: string) => text.replace(/\r\n/g, "\n").trim();
for (const [file, places] of everything ? Object.entries(FILES) : []) {
  const code = normal(readFileSync(at("examples", file), "utf8"));
  for (const place of places) {
    if (!normal(readFileSync(at(place), "utf8")).includes(code))
      failures.push(`${place} does not hold examples/${file} word for word`);
  }
}
const unlisted = (folder: string): string[] =>
  readdirSync(at("examples", folder), { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? unlisted(join(folder, entry.name))
      : [relative("", join(folder, entry.name)).split("\\").join("/")],
  );
const known = new Set([
  ...Object.keys(FILES),
  "angular/index.html",
  "react/index.html",
  "svelte/index.html",
  "vue/index.html",
]);
for (const file of everything ? unlisted("") : [])
  if (!known.has(file))
    failures.push(`examples/${file} is not listed in scripts/check-usage.ts: say where the guides show it`);

console.log(
  failures.length === 0
    ? `\nusage ok: ${results.length} ways to use ${NAME}`
    : `\n${failures.length} failure${failures.length === 1 ? "" : "s"}:\n- ${failures.join("\n- ")}`,
);
if (failures.length > 0) process.exit(1);
