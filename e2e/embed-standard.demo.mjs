import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { serve } from "./demo.mjs";
const fixtures = JSON.parse(readFileSync("test-data/embed/fields.json", "utf8")).tests;
const input = (page) => page.locator("address-field input");
for (const sample of fixtures.countries)
  test(`${sample.country} field agrees with its native parser`, async ({ page }) => {
    await serve(page);
    await page.goto(`http://address-plus.test/embed/?country=${sample.country}&size=small`);
    await input(page).fill(sample.address);
    const found = await page.locator("address-field").evaluate(async (field, sample) => {
      const { parseLocation } = await import("../lib/index.js");
      const modules = await Promise.all(["au", "gb", "fr", "de"].map((name) => import(`../lib/${name}.js`)));
      const countries = [modules[0].australia, modules[1].unitedKingdom, modules[2].france, modules[3].germany];
      return {
        value: field.value,
        parsed: field.address,
        native: parseLocation(sample.address, { country: sample.country, countries }),
      };
    }, sample);
    expect(found.value).toBe(sample.address);
    expect(found.parsed).toEqual(found.native);
    expect(found.parsed.country).toBe(sample.country);
  });
test("field submits, resets and follows disabled fieldsets through native form association", async ({ page }) => {
  await serve(page);
  await page.goto("http://address-plus.test/embed/?country=US");
  const sample = fixtures.countries[0];
  const result = await page.evaluate(async (sample) => {
    const { defineField } = await import("../lib/element.js");
    defineField("shipping-address");
    const form = document.createElement("form"),
      fieldset = document.createElement("fieldset"),
      field = document.createElement("shipping-address");
    field.name = "shipping";
    field.country = "US";
    field.value = sample.address;
    fieldset.append(field);
    form.append(fieldset);
    document.body.append(form);
    const initial = field.value;
    field.value = sample.address.replace("1600", "1601");
    await Promise.resolve();
    const submitted = new globalThis.FormData(form).getAll("shipping"),
      valid = field.checkValidity();
    fieldset.disabled = true;
    const omitted = new globalThis.FormData(form).has("shipping");
    fieldset.disabled = false;
    form.reset();
    return { initial, submitted, valid, omitted, reset: field.value, form: field.form === form };
  }, sample);
  expect(result.initial).toBe(sample.address);
  expect(result.submitted).toEqual([sample.address.replace("1600", "1601")]);
  expect(result.valid).toBe(true);
  expect(result.omitted).toBe(false);
  expect(result.reset).toBe(sample.address);
  expect(result.form).toBe(true);
});
test("required validity and all boolean off aliases preserve HTML form semantics", async ({ page }) => {
  await serve(page);
  await page.goto("http://address-plus.test/embed/?name=shipping&required=true");
  expect(await page.locator("address-field").evaluate((field) => field.checkValidity())).toBe(false);
  for (const sample of fixtures.off) {
    const found = await page.locator("address-field").evaluate(async (field, off) => {
      field.required = off;
      field.disabled = off;
      field.readonly = off;
      await Promise.resolve();
      return {
        valid: field.checkValidity(),
        disabled: field.shadowRoot.querySelector("input").disabled,
        readonly: field.shadowRoot.querySelector("input").readOnly,
        attrs: ["required", "disabled", "readonly"].map((name) => field.hasAttribute(name)),
      };
    }, sample.value);
    expect(found).toEqual({ valid: true, disabled: false, readonly: false, attrs: [false, false, false] });
  }
});
test("language, theme and width changes preserve text and input focus", async ({ page }) => {
  await serve(page);
  await page.goto("http://address-plus.test/embed/?country=US&size=small");
  await input(page).fill(fixtures.countries[0].address);
  await input(page).focus();
  const result = await page.locator("address-field").evaluate(async (field) => {
    const control = field.shadowRoot.querySelector("input");
    field.lang = "ja";
    field.theme = "dark";
    field.width = 350;
    field.label = "配送先";
    await Promise.resolve();
    return {
      same: field.shadowRoot.querySelector("input") === control,
      focused: field.shadowRoot.activeElement === control,
      value: field.value,
      label: field.shadowRoot.querySelector("label").textContent,
      width: field.style.width,
    };
  });
  expect(result).toMatchObject({
    same: true,
    focused: true,
    value: fixtures.countries[0].address,
    label: "配送先",
    width: "350px",
  });
});
test("native host requirements and callbacks remain private while events compose through shadows", async ({ page }) => {
  await serve(page);
  await page.goto("http://address-plus.test/embed/");
  const sample = fixtures.countries[0];
  const result = await page.evaluate(async (sample) => {
    const { defineField } = await import("../lib/element.js");
    defineField("article-address");
    const host = document.createElement("div"),
      shadow = host.attachShadow({ mode: "open" }),
      field = document.createElement("article-address");
    document.body.append(host);
    let callback;
    field.country = "US";
    field.options = {
      parse: { useSnakeCase: true },
      validation: { requirePostalCode: true },
      onChange: (control) => {
        callback = { value: control.value, address: control.address };
      },
    };
    shadow.append(field);
    const heard = new Promise((resolve) =>
      document.addEventListener(
        "address-plus-change",
        (event) =>
          resolve({
            detail: JSON.parse(JSON.stringify(event.detail)),
            composed: event.composed,
            bubbles: event.bubbles,
          }),
        { once: true },
      ),
    );
    field.value = sample.address;
    await Promise.resolve();
    return { event: await heard, callback, private: field.address };
  }, sample);
  expect(result.event).toMatchObject({ composed: true, bubbles: true, detail: { country: "US", valid: true } });
  expect(JSON.stringify(result.event)).not.toContain(sample.address);
  expect(Object.keys(result.event.detail).sort()).toEqual(["country", "errors", "valid", "warnings"]);
  expect(result.callback.value).toBe(sample.address);
  expect(result.callback.address).toEqual(result.private);
});
test("builder covers all native choices and formats without putting entered addresses in the URL", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await serve(page);
  await page.goto("http://address-plus.test/builder.html?lang=ja");
  await expect(page.locator("#bld-stage address-field input")).toBeVisible();
  await expect(page.locator("#bld-preview-title")).toHaveText("プレビュー");
  await page.locator('#bld-makers [data-maker="field"]').click();
  await page.locator("#bld-stage address-field input").fill(fixtures.countries[0].address);
  for (const format of ["element", "iframe", "module", "react", "vue", "svelte", "angular", "html", "url"]) {
    await page.locator(`#bld-formats [data-format="${format}"]`).click();
    await expect(page.locator("#bld-code")).not.toHaveText("");
    expect(await page.locator("#bld-code").textContent()).not.toContain(fixtures.countries[0].address);
  }
  expect(page.url()).not.toContain(encodeURIComponent(fixtures.countries[0].address));
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= globalThis.innerWidth)).toBe(true);
});
test("copied iframe forwards only counts, ignores value and stores nothing", async ({ page }) => {
  await serve(page);
  await page.goto("http://address-plus.test/builder.html?lang=en");
  await expect(page.locator("#bld-stage address-field input")).toBeVisible();
  await page.locator('#bld-formats [data-format="iframe"]').click();
  const code = (await page.locator("#bld-code").textContent())
    .replaceAll("https://johnmorrisdotca.github.io/address-plus/", "http://address-plus.test/")
    .replace('loading="lazy"', "");
  await page.route("http://article.test/", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<style>body{margin:0;width:320px}</style><script>window.messages=[];addEventListener('message',e=>messages.push(e.data));</script>${code}`,
    }),
  );
  await page.goto("http://article.test/");
  const field = page.frameLocator("iframe").locator("address-field input");
  await field.fill(fixtures.countries[0].address);
  await expect
    .poll(() => page.evaluate(() => globalThis.messages.some((message) => message.type === "address-plus-change")))
    .toBe(true);
  const messages = await page.evaluate(() => globalThis.messages);
  expect(JSON.stringify(messages)).not.toContain(fixtures.countries[0].address);
  const frame = page.frames().find((frame) => frame.url().includes("address-plus.test/embed/"));
  expect(
    await frame.evaluate(
      () =>
        document.documentElement.scrollHeight <= globalThis.innerHeight &&
        document.documentElement.scrollWidth <= globalThis.innerWidth &&
        globalThis.localStorage.length === 0,
    ),
  ).toBe(true);
  await page.goto(
    `http://address-plus.test/embed/?country=bad&width=Infinity&value=${encodeURIComponent(fixtures.countries[0].address)}&label=%3Cimg%3E`,
  );
  await expect(input(page)).toHaveValue("");
  await expect(page.locator("address-field label")).toHaveText("<img>");
  await expect(page.locator("address-field")).not.toHaveAttribute("country", /.*/);
});
test("published definition entry works as a plain CDN script without bare imports", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await serve(page);
  await page.route("http://address-plus.test/dist/**", (route) => {
    const file = new URL(`../dist/${new URL(route.request().url()).pathname.slice(6)}`, import.meta.url);
    return route.fulfill({
      body: readFileSync(file),
      contentType: "text/javascript",
      headers: { "access-control-allow-origin": "*" },
    });
  });
  await page.route("http://article.test/", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<script type="module" src="http://address-plus.test/dist/element-define.js"></script><form><address-field name="address" country="US"></address-field></form>',
    }),
  );
  await page.goto("http://article.test/");
  await expect(input(page)).toBeVisible();
  await input(page).fill(fixtures.countries[0].address);
  expect(await page.locator("address-field").evaluate((field) => field.address.country)).toBe("US");
  expect(errors).toEqual([]);
});
