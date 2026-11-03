// The demo's larger tools, beside the six panels in demo.js: a list pasted whole and saved as CSV, JSON, text, Markdown
// or SQL (extras-bulk.js); a Japanese address taken apart, each part beside its reading and romaji (extras-japan.js);
// and the test corpus, fetched only when asked for and run in this browser (extras-corpus.js). Everything typed or
// returned is set as text, never as HTML.
import { BULK_SAMPLE, setUpBulk } from "./extras-bulk.js";
import { setUpCorpus } from "./extras-corpus.js";
import { setUpJapan } from "./extras-japan.js";

/** Set up the three tools. `kit` is what demo.js shares: words, helpers and the page's state. */
function setUpExtras(kit) {
  const { japan } = setUpJapan(kit);
  const { bulk, bulkState } = setUpBulk(kit);
  const { corpusView } = setUpCorpus(kit);

  return { japan, bulk, corpusView, bulkState };
}

export { BULK_SAMPLE, setUpExtras };
