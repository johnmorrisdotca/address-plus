import { australia } from "../au";
import { germany } from "../de";
import { france } from "../fr";
import { unitedKingdom } from "../gb";
import type { ParseOptions } from "../types/parse-options";
import type { ValidationOptions } from "../types/validation";

const FIELD_COUNTRIES = ["US", "CA", "JP", "AU", "GB", "FR", "DE"] as const;
const FIELD_MODULES = [australia, unitedKingdom, france, germany];
const FIELD_ATTRIBUTES = [
  "country",
  "name",
  "value",
  "required",
  "disabled",
  "readonly",
  "validate",
  "lang",
  "theme",
  "size",
  "width",
  "label",
];
const FIELD_NATIVE_BOOLEANS = ["required", "disabled", "readonly"];
const FIELD_OFF = ["off", "false", "no", "0"];
const FIELD_SIZES: Record<string, number> = { small: 320, medium: 480, large: 640 };
const FIELD_WORDS = {
  en: {
    address: "Address",
    required: "Enter an address.",
    valid: "Address format checked.",
    invalid: "Check the address format.",
    error: "The address could not be checked.",
    findings: "Warnings",
  },
  ja: {
    address: "住所",
    required: "住所を入力してください。",
    valid: "住所の形式を確認しました。",
    invalid: "住所の形式を確認してください。",
    error: "住所を確認できませんでした。",
    findings: "注意事項",
  },
};
const FIELD_PARSE_KEYS = Object.keys({
  country: true,
  countries: true,
  normalize: true,
  validatePostalCode: true,
  language: true,
  extractFacilities: true,
  parseParenthetical: true,
  strict: true,
  useSnakeCase: true,
} satisfies Record<keyof ParseOptions, boolean>);
const FIELD_VALIDATION_KEYS = Object.keys({
  requireStreetNumber: true,
  requireStreetName: true,
  requireCity: true,
  requireState: true,
  requirePostalCode: true,
  allowPOBox: true,
  allowRuralRoute: true,
  allowGeneralDelivery: true,
  strictPostalValidation: true,
  country: true,
  countries: true,
} satisfies Record<keyof ValidationOptions, boolean>);
const FIELD_STYLE = `
:host{display:block;max-width:100%;color-scheme:light dark;font:inherit}
.field{--ap-surface:#fbf8f1;--ap-ink:#1f2320;--ap-rule:#a39d91;--ap-error:#9b3420;display:grid;gap:8px;color:var(--ap-ink);background:var(--ap-surface);padding:12px;border-radius:12px;font:inherit}
@media(prefers-color-scheme:dark){:host(:not([theme="light"])) .field{--ap-surface:#1d201e;--ap-ink:#ece8dc;--ap-rule:#9c9b93;--ap-error:#ffa58f}}
:host([theme="dark"]) .field{--ap-surface:#1d201e;--ap-ink:#ece8dc;--ap-rule:#9c9b93;--ap-error:#ffa58f}
label{font-weight:600}input{box-sizing:border-box;min-height:44px;min-width:0;width:100%;border:1px solid var(--ap-rule);border-radius:8px;background:var(--ap-surface);color:inherit;font:inherit;padding:10px}
input:focus-visible{outline:3px solid var(--ap-ink);outline-offset:2px}input:disabled{opacity:.65}p{margin:0;line-height:1.4;font-size:.9em}input[aria-invalid="true"]{border-color:var(--ap-error)}
`;
export {
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
};
