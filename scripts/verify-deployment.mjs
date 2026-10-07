import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
const expected = process.env.EXPECTED_COMMIT;
assert.match(expected ?? '', /^[a-f0-9]{40}$/, 'EXPECTED_COMMIT must be the tested production commit');
const base = new URL(process.env.DEPLOYMENT_URL ?? 'https://docs.nextchina.org');
assert.equal(base.protocol, 'https:');
let failure;
for (let attempt=0; attempt<5; attempt++) {
  try {
    const read = async path => {
      const url = new URL(path, base); url.searchParams.set('release', expected);
      const response = await fetch(url, { cache:'no-store', signal:AbortSignal.timeout(15000) });
      assert.ok(response.ok, `Live endpoint ${path}: HTTP ${response.status}`);
      return response;
    };
    const version = await (await read('/version.json')).json();
    const health = await (await read('/knowledge-health.json')).json();
    const html = await (await read('/')).text();
    assert.equal(version.commit, expected, 'Live version does not match deployed commit');
    assert.equal(health.commit, expected, 'Live health report is stale');
    assert.equal(health.nodes, version.knowledgeNodes);
    assert.ok(health.sourceCheckedSemanticEdges > 0 && health.withIndependentExplanation > 0);
    assert.ok(html.includes(`name="nextchina-commit" content="${expected}"`), 'Homepage HTML is not this release');
    console.log(JSON.stringify({status:'pass', commit:expected, homepage:base.origin, nodes:health.nodes, sourceCheckedSemanticEdges:health.sourceCheckedSemanticEdges}));
    process.exit(0);
  } catch (error) { failure = error; if (attempt < 4) await setTimeout(3000); }
}
throw failure;
