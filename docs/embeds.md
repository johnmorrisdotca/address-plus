# Address field and embeds

The [builder](https://johnmorrisdotca.github.io/address-plus/builder.html) previews
an address input and prints custom-element, module, React 19, Vue, Svelte,
Angular, plain HTML and iframe code. Load the optional
`@johnmorrisdotca/address-plus/element/define` entry. `./element` exports
AddressField and defineField(tag?) without registering it; both imports are safe
on a server. The field is browser-only. Its browser code bundles the parsers for
US, CA, JP, AU, GB, FR and DE. Individual country entries keep their isolation.

## A field in a form

Put `<address-field country="CA" name="shipping-address" required>` in a form.
It submits the raw value under name, participates in required/native validity,
resets to its initial value and follows a disabled fieldset. On browsers without
ElementInternals it falls back to its native text input. Use the element inside
your form: an iframe cannot submit into a form in its parent page.

Attributes reflect as properties: country (auto or a country code), name, value,
required, disabled, readonly, validate (true by default), lang (en/ja), theme
(auto/light/dark), size (small/medium/large), width and label. Native boolean
attributes with off/false/no/0 are removed to preserve HTML form semantics;
validate=false remains explicit because validation is on by default. Widths are
320/480/640 pixels, fitting their parent; explicit width takes priority and its
removal restores the earlier host width. The label is visible and accessible.
Language/look changes keep entered text and focus. The input allows 4,000 characters.

The local value getter returns text; address returns the native ParsedAddress or
null, and validation returns the native findings or null when empty/disabled.
checkValidity/reportValidity integrate with ordinary forms. `options.parse` and
`options.validation` accept every native option, including custom country modules.
`options.strings` overrides the field's own words; `options.onChange(field)` gives
trusted local access to value, address and validation. The parsers check format
and known postal data, never whether mail will reach the destination.

## Private links, frames and events

Entered addresses never go into builder state, copied code or setup URLs. Set a
private value from trusted host code; it is deliberately absent from the builder.
The frame at embed/ validates setup parameters, ignores value and unknown keys,
uses no storage and makes no external requests except static scripts/assets.
No cookies, tracking, timers or hosted services are added.

address-plus-load carries country. address-plus-change carries country, valid,
warning count and error count. address-plus-error carries a fixed localized
message; no raw address, parsed fields or native finding messages are sent.
All custom events bubble and compose through shadow roots. Frames post
{ type, detail }; check event.origin against the exact GitHub Pages origin and
event.source against your frame's contentWindow. Native form submission and
trusted local callbacks still receive the value; choose your own form destination.

## Troubleshooting

An optional empty input is valid; required rejects it. Disabling validation
still parses locally but skips native format checks. When needed, set full native
requirements in options.validation. A disabled field does not submit; readonly
retains its value. Unsupported country parameters are ignored by the frame.
Existing core/parser/country APIs keep working; this is an optional new entry.
