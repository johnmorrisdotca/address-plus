---
title: Embed an address field in an iframe
section: how-to
order: 17
description: Show an address field on a page that allows no scripts, with an iframe of the demo's embed page.
---

A site that allows no scripts can still take an address: an iframe of the demo's embed page needs no code of your own. The address chooses the country (`country`, or `auto`), the label (`label`), the field's name in a form (`name`), the language (`lang`), the theme (`theme`), the size (`size`), and the switches `required`, `disabled`, `readonly` and `validate`. The keys are the attribute names of `<address-field>`.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>address-plus in an iframe</title>
  </head>
  <body>
    <iframe
      src="https://johnmorrisdotca.github.io/address-plus/embed/?country=US&label=Shipping%20address&validate"
      title="A US address field"
      width="420"
      height="120"
      loading="lazy"
      style="border: 0"
    ></iframe>
  </body>
</html>
```

The page draws one field and nothing else, stores nothing and loads nothing from anywhere else. What is typed stays in the frame: the page around it hears only that the field changed, with `address-plus-change` and whether the address is valid, never the address. The [builder](https://johnmorrisdotca.github.io/address-plus/builder.html) writes this frame, and the other formats, for the field you choose.
