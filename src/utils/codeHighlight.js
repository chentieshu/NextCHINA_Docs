import './prismSetup.js';
import Prism from 'prismjs';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-jsx.js';
import 'prismjs/components/prism-tsx.js';
import 'prismjs/components/prism-json.js';
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-yaml.js';
import 'prismjs/components/prism-sql.js';
import 'prismjs/components/prism-go.js';
import 'prismjs/components/prism-java.js';
import 'prismjs/components/prism-rust.js';
import 'prismjs/components/prism-diff.js';
Prism.manual = true;
const aliases = { py: 'python', js: 'javascript', ts: 'typescript', sh: 'bash', shell: 'bash', yml: 'yaml', html: 'markup', xml: 'markup', svg: 'markup' };
const cache = new Map();
/** Prism escapes code before emitting its own token spans. Unknown/huge blocks
 * remain plain text. Never run language auto-detection or load a CDN grammar. */
export function highlightCode(code, language = '') {
  const lang = aliases[language.toLowerCase()] ?? language.toLowerCase();
  const grammar = Prism.languages[lang];
  if (!grammar || typeof grammar !== 'object' || code.length > 50000) return null;
  const key = `${lang}\0${code}`;
  if (cache.has(key)) return cache.get(key);
  const html = Prism.highlight(code, grammar, lang);
  if (cache.size >= 128) cache.delete(cache.keys().next().value);
  cache.set(key, html);
  return html;
}
