import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { renderAssetKey } from '../src/utils/renderAssetKey.js';
import { highlightCode } from '../src/utils/codeHighlight.js';
const data = JSON.parse(readFileSync('src/generated/markdown-assets.json','utf8'));
assert.match(data.fingerprint ?? '', /^[a-f0-9]{64}$/, 'Run npm run render:assets before this test');
let diagrams = 0, blocks = 0;
for (const article of JSON.parse(readFileSync('content/articles.json','utf8')).articles) {
  const walk=node=>{
    if (node.type==='code' && node.lang==='mermaid') {
      diagrams++;
      const source=node.value.trim(), entry=data.diagrams[renderAssetKey(source)];
      assert.equal(entry?.source,source,`${article.id}: missing static diagram`);
      for (const theme of ['light','dark']) {
        assert.ok(entry[theme].svg.includes('<svg') && entry[theme].width>0 && entry[theme].height>0);
        assert.ok(!/<script\b|\son\w+=/i.test(entry[theme].svg));
      }
      assert.notEqual(entry.light.svg,entry.dark.svg,'Both themes need real pre-rendered SVG');
    } else if (node.type==='code' && node.lang==='python') {
      blocks++;const source=node.value+'\n';
      const entry=data.code[renderAssetKey(`python\0${source}`)];
      assert.equal(entry?.source,source);assert.match(entry.html,/class="token /);
    }
    node.children?.forEach(walk);
  };walk(unified().use(remarkParse).parse(readFileSync(article.file,'utf8')));
}
assert.equal(highlightCode('<script>alert(1)</script>', 'unknown-lang'),null);
assert.ok(!highlightCode('<script>alert(1)</script>', 'html').includes('<script>'));
assert.equal(highlightCode('x'.repeat(50001),'python'),null);
console.log(JSON.stringify({status:'pass',publishedDiagrams:diagrams,highlightedPython:blocks,staticThemes:2}));
