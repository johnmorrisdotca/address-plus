---
title: Plain HTML and CDNs
section: how-to
order: 13
description: Put an address field on a plain page with one script tag from jsDelivr or unpkg.
---

A page needs no build step. The `element/define` entry registers the `<address-field>` tag; a script tag from a CDN loads it, and the tag draws a form field that reads the address as it is typed. Add `validate` to see whether it is valid. Everything it needs, the parser and the country tables, is inside the package's files, so nothing else is fetched.

## jsDelivr

jsDelivr serves the package's files as they are, so the address is the built file.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>address-plus from jsDelivr</title>
    <script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/address-plus@1/dist/element-define.js"></script>
  </head>
  <body>
    <address-field country="US" label="Shipping address" value="1600 Pennsylvania Ave NW, Washington, DC 20500" validate></address-field>
  </body>
</html>
```

## unpkg

unpkg serves the package's own files too; `?module` makes it rewrite the imports inside them for the browser.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>address-plus from unpkg</title>
    <script type="module" src="https://unpkg.com/@johnmorrisdotca/address-plus@1/dist/element-define.js?module"></script>
  </head>
  <body>
    <address-field country="US" label="Shipping address" value="1600 Pennsylvania Ave NW, Washington, DC 20500" validate></address-field>
  </body>
</html>
```

## Notes

- Use `<script type="module">`. A classic script cannot `import`.
- Pin a major version in the address (`@johnmorrisdotca/address-plus@1`) so the page stays as it is.
- The attributes are in [the native form field](form-field-and-embeds.md). If nothing appears, see [troubleshooting](troubleshooting.md).
