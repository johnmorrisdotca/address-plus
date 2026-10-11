import {
  FIELD_ATTRIBUTES,
  FIELD_COUNTRIES,
  FIELD_MODULES,
  FIELD_NATIVE_BOOLEANS,
  FIELD_OFF,
  FIELD_PARSE_KEYS,
  FIELD_SIZES,
  FIELD_STYLE,
  FIELD_VALIDATION_KEYS,
  FIELD_WORDS,
} from "./constants/field";
import { parseLocation } from "./parser";
import type { ParseOptions } from "./types/parse-options";
import type { ParsedAddress } from "./types/parsed-address";
import type { AddressValidationResult, ValidationOptions } from "./types/validation";
import { validateAddress } from "./utils/comprehensive-validation";

const ElementBase: typeof HTMLElement =
  typeof HTMLElement === "undefined" ? (class {} as unknown as typeof HTMLElement) : HTMLElement;

/** Seven built-in field countries; auto detects among them.
 * @example
 * ```ts
 * ADDRESS_FIELD_COUNTRIES.length
 * // → 7
 * ```
 */
const ADDRESS_FIELD_COUNTRIES = FIELD_COUNTRIES;
/** Native parser options checked by builder coverage.
 * @example
 * ```ts
 * ADDRESS_FIELD_PARSE_KEYS.includes("strict")
 * // → true
 * ```
 */
const ADDRESS_FIELD_PARSE_KEYS = FIELD_PARSE_KEYS;
/** Native validator options checked by builder coverage.
 * @example
 * ```ts
 * ADDRESS_FIELD_VALIDATION_KEYS.includes("requirePostalCode")
 * // → true
 * ```
 */
const ADDRESS_FIELD_VALIDATION_KEYS = FIELD_VALIDATION_KEYS;
/** Full native settings and a private callback; raw addresses never enter public events.
 * @example
 * ```ts
 * ADDRESS_FIELD_PARSE_KEYS.includes("countries")
 * // → true
 * ```
 */
interface AddressFieldOptions {
  parse?: ParseOptions; // All native parser choices, including custom country modules
  validation?: ValidationOptions; // All native validation requirements
  strings?: Partial<(typeof FIELD_WORDS)["en"]>; // Field words over English or Japanese
  onChange?: (field: AddressField) => void; // Trusted local access to value, address and validation
}
/** A form-associated address input using the seven native country parsers.
 * Import this entry safely on a server; defineField registers it in a browser.
 * The raw value is submitted under name; address and validation are local getters.
 * @example
 * ```ts
 * typeof AddressField
 * // → "function"
 * ```
 */
class AddressField extends ElementBase {
  static formAssociated = true;
  static observedAttributes = FIELD_ATTRIBUTES;
  #internals: ElementInternals | null = null;
  #input: HTMLInputElement | null = null;
  #caption: HTMLLabelElement | null = null;
  #status: HTMLParagraphElement | null = null;
  #options: AddressFieldOptions = {};
  #address: ParsedAddress | null = null;
  #validation: AddressValidationResult | null = null;
  #queued = false;
  #formDisabled = false;
  #initialValue = "";
  #initialRead = false;
  #watch: MutationObserver | null = null;
  #widthBefore = "";
  #widthOwned = false;
  #last = "";

  constructor() {
    super();
    if (typeof HTMLElement !== "undefined" && typeof this.attachInternals === "function")
      this.#internals = this.attachInternals();
  }
  // The raw value stays in the control, its form and the local API.
  get value(): string {
    return this.#input?.value ?? this.getAttribute("value") ?? "";
  }
  set value(value: string) {
    this.#write("value", value);
  }
  /** Native parsed address; null for an empty or unparseable value. */
  get address(): ParsedAddress | null {
    return this.#address;
  }
  /** Native validation findings, kept local; null when empty or validation is disabled. */
  get validation(): AddressValidationResult | null {
    return this.#validation;
  }
  /** Full native parser/validator options and trusted local callbacks. */
  get options(): AddressFieldOptions {
    return this.#options;
  }
  set options(options: AddressFieldOptions) {
    this.#options = options ?? {};
    if (this.isConnected) this.#refresh();
  }
  get form(): HTMLFormElement | null {
    return this.#internals?.form ?? this.#input?.form ?? null;
  }
  get validity(): ValidityState | undefined {
    return this.#internals?.validity ?? this.#input?.validity;
  }
  get validationMessage(): string {
    return this.#internals?.validationMessage ?? this.#input?.validationMessage ?? "";
  }
  get willValidate(): boolean {
    return this.#internals?.willValidate ?? this.#input?.willValidate ?? false;
  }
  get country(): string | null {
    return this.getAttribute("country");
  }
  set country(value: string | number | boolean | null | undefined) {
    this.#write("country", value);
  }
  get name(): string | null {
    return this.getAttribute("name");
  }
  set name(value: string | number | boolean | null | undefined) {
    this.#write("name", value);
  }
  get required(): string | null {
    return this.getAttribute("required");
  }
  set required(value: string | number | boolean | null | undefined) {
    this.#write("required", value);
  }
  get disabled(): string | null {
    return this.getAttribute("disabled");
  }
  set disabled(value: string | number | boolean | null | undefined) {
    this.#write("disabled", value);
  }
  get readonly(): string | null {
    return this.getAttribute("readonly");
  }
  set readonly(value: string | number | boolean | null | undefined) {
    this.#write("readonly", value);
  }
  get validate(): string | null {
    return this.getAttribute("validate");
  }
  set validate(value: string | number | boolean | null | undefined) {
    this.#write("validate", value);
  }
  get theme(): string | null {
    return this.getAttribute("theme");
  }
  set theme(value: string | number | boolean | null | undefined) {
    this.#write("theme", value);
  }
  get size(): string | null {
    return this.getAttribute("size");
  }
  set size(value: string | number | boolean | null | undefined) {
    this.#write("size", value);
  }
  get width(): string | null {
    return this.getAttribute("width");
  }
  set width(value: string | number | boolean | null | undefined) {
    this.#write("width", value);
  }
  get label(): string | null {
    return this.getAttribute("label");
  }
  set label(value: string | number | boolean | null | undefined) {
    this.#write("label", value);
  }
  // Explicit booleans retain every supported off spelling.
  #on(name: string, fallback = false): boolean {
    const value = this.getAttribute(name);
    return value === null ? fallback : !FIELD_OFF.includes(value.trim().toLowerCase());
  }
  #write(name: string, value: unknown): void {
    if (value === null || value === undefined) this.removeAttribute(name);
    else this.setAttribute(name, String(value));
  }
  connectedCallback(): void {
    if (!this.#initialRead) {
      this.#initialRead = true;
      this.#initialValue = this.getAttribute("value") ?? "";
    }
    if (this.#input === null) {
      const root = this.attachShadow({ mode: "open" });
      const style = this.ownerDocument.createElement("style");
      style.textContent = FIELD_STYLE;
      const wrap = this.ownerDocument.createElement("div");
      wrap.className = "field";
      this.#caption = this.ownerDocument.createElement("label");
      this.#caption.htmlFor = "address";
      this.#input = this.ownerDocument.createElement("input");
      this.#input.id = "address";
      this.#input.type = "text";
      this.#input.value = this.getAttribute("value") ?? "";
      this.#input.autocomplete = "street-address";
      this.#input.maxLength = 4000;
      this.#input.setAttribute("aria-describedby", "status");
      this.#status = this.ownerDocument.createElement("p");
      this.#status.id = "status";
      this.#status.setAttribute("aria-live", "polite");
      this.#input.addEventListener("input", () => {
        this.#write("value", this.#input!.value);
        this.#refresh();
      });
      wrap.append(this.#caption, this.#input, this.#status);
      root.append(style, wrap);
    }
    this.#refresh();
    this.#watch = new MutationObserver(() => {
      if (!this.hasAttribute("lang")) this.#refresh();
    });
    this.#watch.observe(this.ownerDocument.documentElement, { attributes: true, attributeFilter: ["lang"] });
    this.dispatchEvent(
      new CustomEvent("address-plus-load", { detail: { country: this.#country() }, bubbles: true, composed: true }),
    );
  }
  disconnectedCallback(): void {
    this.#watch?.disconnect();
    this.#watch = null;
  }
  attributeChangedCallback(name: string, before: string | null, now: string | null): void {
    if (FIELD_NATIVE_BOOLEANS.includes(name) && now !== null && FIELD_OFF.includes(now.trim().toLowerCase())) {
      this.removeAttribute(name);
      return;
    }
    if (name === "value" && this.#input !== null && this.#input.value !== (now ?? "")) this.#input.value = now ?? "";
    if (before === now || !this.isConnected || this.#queued) return;
    this.#queued = true;
    queueMicrotask(() => {
      this.#queued = false;
      if (this.isConnected) this.#refresh();
    });
  }
  formDisabledCallback(disabled: boolean): void {
    this.#formDisabled = disabled;
    this.#refresh();
  }
  formResetCallback(): void {
    this.value = this.#initialValue;
    this.#refresh();
  }
  formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === "string") {
      this.value = state;
      this.#refresh();
    }
  }
  /** Check the current value using native rules and HTML form validity.
   * @returns True if empty and optional, or if the enabled checks pass.
   * @example
   * ```ts
   * typeof AddressField.prototype.checkValidity
   * // → "function"
   * ```
   */
  checkValidity(): boolean {
    this.#refresh();
    return this.#internals?.checkValidity() ?? this.#input?.checkValidity() ?? true;
  }
  /** Show native form validation feedback for the current value.
   * @returns Whether the enabled checks pass.
   * @example
   * ```ts
   * typeof AddressField.prototype.reportValidity
   * // → "function"
   * ```
   */
  reportValidity(): boolean {
    this.#refresh();
    return this.#internals?.reportValidity() ?? this.#input?.reportValidity() ?? true;
  }
  #country(): ParseOptions["country"] {
    const country = this.getAttribute("country")?.toUpperCase();
    return FIELD_COUNTRIES.includes(country as (typeof FIELD_COUNTRIES)[number])
      ? (country as (typeof FIELD_COUNTRIES)[number])
      : (this.#options.parse?.country ?? "auto");
  }
  #refresh(): void {
    if (this.#input === null || this.#status === null || this.#caption === null) return;
    const locale = (this.closest("[lang]")?.getAttribute("lang") ?? this.ownerDocument.documentElement.lang)
      .toLowerCase()
      .startsWith("ja")
      ? "ja"
      : "en";
    const words = { ...FIELD_WORDS[locale], ...this.#options.strings };
    const value = this.value,
      disabled = this.#formDisabled || this.#on("disabled"),
      required = this.#on("required"),
      check = this.#on("validate", true);
    this.#input.disabled = disabled;
    this.#input.required = required;
    this.#input.readOnly = this.#on("readonly");
    this.#input.lang = locale;
    this.#caption.textContent = this.getAttribute("label") ?? words.address;
    if (this.#internals === null) this.#input.name = this.getAttribute("name") ?? "";
    const width = Number(this.getAttribute("width")),
      size = this.getAttribute("size");
    const pixels =
      this.hasAttribute("width") && width > 0 && Number.isFinite(width)
        ? Math.min(width, 2000)
        : FIELD_SIZES[size ?? ""];
    if (pixels !== undefined) {
      if (!this.#widthOwned) this.#widthBefore = this.style.width;
      this.#widthOwned = true;
      this.style.width = `${pixels}px`;
    } else if (this.#widthOwned) {
      this.style.width = this.#widthBefore;
      this.#widthOwned = false;
    }
    let message = "";
    try {
      const country = this.#country(),
        countries = this.#options.parse?.countries ?? FIELD_MODULES;
      this.#address = value.trim() === "" ? null : parseLocation(value, { ...this.#options.parse, country, countries });
      this.#validation =
        value.trim() === "" || !check
          ? null
          : validateAddress(value, {
              ...this.#options.validation,
              country,
              countries: this.#options.validation?.countries ?? countries,
            });
      const invalid = value.trim() === "" ? required : check && (!this.#address || this.#validation?.isValid === false);
      message = invalid ? (value.trim() === "" ? words.required : words.invalid) : "";
      this.#status.textContent = value.trim() === "" ? message : !check ? "" : invalid ? words.invalid : words.valid;
      if (this.#validation?.warnings.length)
        this.#status.textContent += ` ${words.findings}: ${this.#validation.warnings.length}.`;
      this.#input.setAttribute("aria-invalid", String(invalid && !disabled));
      this.#input.setCustomValidity(disabled ? "" : message);
      this.#internals?.setFormValue(disabled ? null : value, value);
      this.#internals?.setValidity(
        disabled || !invalid ? {} : value.trim() === "" ? { valueMissing: true } : { customError: true },
        disabled ? "" : message,
        this.#input,
      );
      const key = JSON.stringify([value, country, invalid, this.#validation?.warnings.map((finding) => finding.code)]);
      if (key !== this.#last) {
        this.#last = key;
        this.dispatchEvent(
          new CustomEvent("address-plus-change", {
            detail: {
              country,
              valid: !invalid,
              warnings: this.#validation?.warnings.length ?? 0,
              errors: this.#validation?.errors.length ?? 0,
            },
            bubbles: true,
            composed: true,
          }),
        );
        this.#options.onChange?.(this);
      }
    } catch {
      this.#address = null;
      this.#validation = null;
      this.#status.textContent = words.error;
      this.#input.setCustomValidity(words.error);
      this.#internals?.setFormValue(disabled ? null : value, value);
      this.#internals?.setValidity(disabled ? {} : { customError: true }, disabled ? "" : words.error, this.#input);
      this.dispatchEvent(
        new CustomEvent("address-plus-error", {
          detail: { message: FIELD_WORDS[locale].error },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }
}
/** Register the form field under its default or a custom tag, idempotently; safe on a server.
 * @param tagName - The tag name; address-field by default.
 * @param registry - The browser registry, undefined on a server.
 * @returns Nothing; existing definitions are preserved.
 * @example
 * ```ts
 * defineField();
 * typeof defineField
 * // → "function"
 * ```
 */
function defineField(
  tagName = "address-field",
  registry: CustomElementRegistry | undefined = typeof customElements === "undefined" ? undefined : customElements,
): void {
  if (registry !== undefined && registry.get(tagName) === undefined)
    registry.define(tagName, tagName === "address-field" ? AddressField : class extends AddressField {});
}

export { ADDRESS_FIELD_COUNTRIES, ADDRESS_FIELD_PARSE_KEYS, ADDRESS_FIELD_VALIDATION_KEYS, AddressField, defineField };
export type { AddressFieldOptions };
