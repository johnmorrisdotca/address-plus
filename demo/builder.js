import { FAMILY_EMBED_BUILDER_WORDS, familyEmbedBuilder } from "./family-embed-builder.js";
import { PACKAGE_VERSION } from "./field-version.js";
import "./lib/element-define.js";
import {
  ADDRESS_FIELD_COUNTRIES,
  ADDRESS_FIELD_PARSE_KEYS,
  ADDRESS_FIELD_VALIDATION_KEYS,
  AddressField,
} from "./lib/element.js";
const words = {
  en: {
    ...FAMILY_EMBED_BUILDER_WORDS.en,
    pitch: "Choose a country, preview a form field and copy the embed code. Addresses you enter stay in the field.",
    name: "Address Plus parses and checks addresses in seven countries.",
    nameLink: "About the package",
    foot: "Setup links and frame messages never include the address you enter.",
    toGallery: "The address tools",
    makerField: "An address field",
    makerFieldSays:
      "A normal text input with native parsing and form validation. Use the custom element inside your form.",
    copyLink: "Copy a link to this field",
  },
  ja: {
    ...FAMILY_EMBED_BUILDER_WORDS.ja,
    pitch:
      "国を選び、フォームの入力欄をプレビューで確認して、埋め込むコードをコピーできます。入力した住所は入力欄の中だけで扱います。",
    name: "Address Plusは7か国の住所を解析・確認します。",
    nameLink: "パッケージについて",
    foot: "設定リンクや埋め込みのメッセージに、入力した住所は入りません。",
    toGallery: "住所のツール",
    makerField: "住所の入力欄",
    makerFieldSays: "テキスト入力と住所の解析・確認を組み合わせています。フォーム内ではカスタム要素を使ってください。",
    copyLink: "この入力欄へのリンクをコピー",
  },
};
const row = (id, kind, en, ja, extra = {}) => ({
  id,
  kind,
  group: "field",
  names: { field: id, ...(id === "country" ? { parse: "country", validation: "country" } : {}) },
  say: { en: { label: en[0], help: en[1] }, ja: { label: ja[0], help: ja[1] } },
  ...extra,
});
const options = [
  row(
    "country",
    "choice",
    ["Country", "Force one of seven country parsers or detect automatically."],
    ["国", "7か国から選ぶか、自動判別します。"],
    {
      default: "auto",
      choices: ["auto", ...ADDRESS_FIELD_COUNTRIES],
      choiceLabels: {
        en: {
          US: "United States",
          CA: "Canada",
          JP: "Japan",
          AU: "Australia",
          GB: "United Kingdom",
          FR: "France",
          DE: "Germany",
        },
        ja: {
          auto: "自動判別",
          US: "米国",
          CA: "カナダ",
          JP: "日本",
          AU: "オーストラリア",
          GB: "英国",
          FR: "フランス",
          DE: "ドイツ",
        },
      },
    },
  ),
  row(
    "name",
    "text",
    ["Form field name", "The name used by ordinary form submission."],
    ["フォームの項目名", "フォームで送信するときの項目名です。"],
    { default: "address" },
  ),
  row(
    "required",
    "boolean",
    ["Required", "Require a value before form submission."],
    ["必須", "送信前に入力が必要になります。"],
    { default: false },
  ),
  row(
    "disabled",
    "boolean",
    ["Disabled", "Disable editing and omit this field from form submission."],
    ["無効", "編集できなくなり、フォームの送信内容にも入りません。"],
    { default: false },
  ),
  row(
    "readonly",
    "boolean",
    ["Read only", "Show the current value without allowing editing."],
    ["読み取り専用", "現在の値を表示し、編集を許可しません。"],
    { default: false },
  ),
  row(
    "validate",
    "boolean",
    ["Validate format", "Apply native parsing/validation, not delivery verification."],
    ["形式を確認", "住所の解析・確認を行います。配達できるかを調べるものではありません。"],
    { default: true },
  ),
  row("size", "choice", ["Display size", "Small, medium or large."], ["表示の大きさ", "小・中・大を選びます。"], {
    default: "medium",
    choices: ["small", "medium", "large"],
  }),
  row(
    "width",
    "number",
    ["Width", "Pixels, fitting a narrower parent."],
    ["幅", "ピクセルで指定します。狭い表示枠にも収まります。"],
    { range: { min: 200, max: 1000, step: 10 } },
  ),
  row(
    "theme",
    "choice",
    ["Theme", "Light, dark or the device's preference."],
    ["配色", "明るい配色・暗い配色、または端末の設定に合わせます。"],
    { default: "auto", choices: ["auto", "light", "dark"] },
  ),
  row(
    "lang",
    "choice",
    ["Interface language", "Field labels and status; separate from the address country."],
    ["操作の言語", "項目名と確認結果の表示に使います。住所の国とは別の設定です。"],
    { choices: ["en", "ja"] },
  ),
  row(
    "label",
    "text",
    ["Field label", "A visible label and accessible name."],
    ["項目名", "画面に表示し、読み上げにも使う名前です。"],
  ),
];
const leftOut = { "field.value": "Private entered addresses never belong in shared links or snippets." };
for (const name of ADDRESS_FIELD_PARSE_KEYS)
  if (name !== "country") leftOut[`parse.${name}`] = "Advanced native parser settings belong to host options.parse.";
for (const name of ADDRESS_FIELD_VALIDATION_KEYS)
  if (name !== "country")
    leftOut[`validation.${name}`] = "Advanced native requirements belong to host options.validation.";
let mounted;
const page = globalThis.familyLanguage({ id: "address-plus", words, onChange: () => mounted?.draw() }),
  heights = {};
const key = (settings) => JSON.stringify(settings);
const builder = familyEmbedBuilder({
  id: "address-plus",
  packageName: "@johnmorrisdotca/address-plus",
  major: PACKAGE_VERSION.split(".")[0],
  site: "https://johnmorrisdotca.github.io/address-plus/",
  title: "Address Plus · form field",
  titleJa: "住所の入力欄の埋め込み",
  options,
  leftOut,
  groups: { field: { en: "The address field", ja: "住所の入力欄" } },
  makers: {
    field: {
      names: "field",
      element: "field",
      tag: "address-field",
      embed: "embed/",
      required: ["name", "size"],
      description: "makerFieldSays",
      formats: ["element", "iframe", "module", "react", "vue", "svelte", "angular", "html", "url"],
      width: 640,
      height: (settings) => Math.max(heights[key(settings)] ?? 0, 400),
    },
  },
  code: ({ maker, format, settings }) => {
    if ((format === "iframe" || format === "url") && settings.lang === undefined)
      return builder.codeFor(maker, format, options, { ...settings, lang: page.lang });
    return undefined;
  },
});
builder.validateCoverage({
  field: AddressField.observedAttributes,
  parse: ADDRESS_FIELD_PARSE_KEYS,
  validation: ADDRESS_FIELD_VALIDATION_KEYS,
});
mounted = builder.mount({
  words,
  language: () => page,
  initial: { field: { name: "address", size: "medium", lang: page.lang } },
  renderPreview: ({ stage, attrs, settings }) => {
    const field = globalThis.document.createElement("address-field");
    for (const [name, value] of attrs) field.setAttribute(name, value);
    const measure = () => {
      heights[key(settings)] = Math.ceil(field.getBoundingClientRect().height) + 40;
      mounted?.refreshCode();
    };
    stage.append(field);
    const observer = new globalThis.ResizeObserver(measure);
    observer.observe(field);
    return {
      destroy() {
        observer.disconnect();
        field.remove();
      },
    };
  },
});
