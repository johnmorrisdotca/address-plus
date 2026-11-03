// The demo page's own words, in the two languages it speaks. A `{name}` in a line is filled in when it is shown.
// The library's own messages (a validation finding, a list of changes) are its English and are shown as they are;
// in Japanese each finding's code is explained in Japanese first.
import { WORDS_EN } from "./words-en.js";
import { WORDS_JA } from "./words-ja.js";

const WORDS = { en: WORDS_EN, ja: WORDS_JA };

export { WORDS };
