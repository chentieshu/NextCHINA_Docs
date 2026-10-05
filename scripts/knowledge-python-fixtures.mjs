import assert from 'node:assert/strict';
import { existsSync, readFileSync, realpathSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Only new suffixes live in files; the existing inline assertions remain intact.
// An array preserves duplicate registrations so validation cannot hide them.
export const pythonFixtureRegistrations = [
  ['algorithm-complexity-cost-model', 'scripts/knowledge-fixtures/algorithm-complexity-cost-model.py'],
  ['mutual-information', 'scripts/knowledge-fixtures/mutual-information.py'],
];

export function loadPythonFixtureSuffixes(root, inlineIds, registrations = pythonFixtureRegistrations) {
  assert.ok(Array.isArray(registrations), 'Expected fixture registration array');
  const ids = new Set(inlineIds), registered = new Set(), files = new Set(), suffixes = {};
  for (const row of registrations) {
    assert.ok(Array.isArray(row) && row.length === 2, 'Expected example/path fixture registration');
    const [id, file] = row;
    assert.ok(typeof id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id), 'Invalid fixture example ID');
    assert.ok(!ids.has(id), `Fixture collides with inline example: ${id}`);
    assert.ok(!registered.has(id), `Duplicate fixture example ID: ${id}`);
    assert.ok(typeof file === 'string' && /^scripts\/knowledge-fixtures\/[a-z0-9]+(?:-[a-z0-9]+)*\.py$/.test(file), 'Invalid fixture path');
    const fullPath = path.resolve(root, file);
    assert.ok(existsSync(fullPath), `Missing Python fixture: ${file}`);
    const realPath = realpathSync(fullPath), fixtureRoot = realpathSync(path.join(root, 'scripts/knowledge-fixtures'));
    assert.equal(path.dirname(realPath), fixtureRoot, 'Fixture path escapes its directory');
    assert.ok(!files.has(realPath), `Duplicate fixture path: ${file}`);
    const suffix = readFileSync(fullPath, 'utf8');
    assert.ok(suffix.trim(), `Empty Python fixture: ${file}`);
    registered.add(id); files.add(realPath); suffixes[id] = suffix;
  }
  return suffixes;
}

export function testPythonFixtureRegistrations(inlineChecks, validateChecks) {
  const root = mkdtempSync(path.join(tmpdir(), 'nextchina-fixture-contract-'));
  let negatives = 0;
  try {
    mkdirSync(path.join(root, 'scripts/knowledge-fixtures'), { recursive: true });
    for (const [, file] of pythonFixtureRegistrations) writeFileSync(path.join(root, file), '# Literal test suffix\n');
    const unusedPath = 'scripts/knowledge-fixtures/unused.py';
    const emptyPath = 'scripts/knowledge-fixtures/empty.py';
    writeFileSync(path.join(root, unusedPath), '# Another literal test suffix\n');
    writeFileSync(path.join(root, emptyPath), ' \n');
    const check = rows => {
      const fixtures = loadPythonFixtureSuffixes(root, Object.keys(inlineChecks), rows);
      validateChecks({ ...inlineChecks, ...fixtures });
    };
    check(pythonFixtureRegistrations);
    const reject = (name, rows, error) => { assert.throws(() => check(rows), error, name); negatives++; };
    const rows = () => structuredClone(pythonFixtureRegistrations);
    const [first, second] = pythonFixtureRegistrations;
    reject('missing required registration', [second], /Missing numeric checks/);
    reject('duplicate fixture ID', [...rows(), [first[0], unusedPath]], /Duplicate fixture example ID/);
    reject('duplicate fixture path', [...rows(), ['unused', first[1]]], /Duplicate fixture path/);
    reject('duplicate registration', [...rows(), [...first]], /Duplicate fixture example ID/);
    reject('missing fixture file', [[first[0], 'scripts/knowledge-fixtures/missing.py'], second], /Missing Python fixture/);
    reject('inline ID collision', [...rows(), [Object.keys(inlineChecks)[0], unusedPath]], /collides with inline/);
    reject('unknown replacement ID', [['unknown', first[1]], second], /Missing numeric checks/);
    reject('unused numeric ID', [...rows(), ['unused', unusedPath]], /Unused\/reassigned numeric check/);
    reject('empty fixture content', [[first[0], emptyPath], second], /Empty Python fixture/);
    reject('nonarray registry', null, /Expected fixture registration array/);
    for (const row of [null, {}, [], [first[0]], [...first, 'extra']]) {
      reject('malformed fixture tuple', [row, second], /Expected example\/path/);
    }
    for (const id of ['', null, 1, 'has space', 'Uppercase', '__proto__']) {
      reject('invalid fixture ID', [[id, first[1]], second], /Invalid fixture example ID/);
    }
    for (const file of ['', null, 1, '/tmp/example.py', '../example.py',
      'scripts/knowledge-fixtures/../example.py', 'scripts/knowledge-fixtures/./example.py', 'scripts/knowledge-fixtures/example.txt']) {
      reject('invalid fixture path', [[first[0], file], second], /Invalid fixture path/);
    }
    return negatives;
  } finally { rmSync(root, { recursive: true, force: true }); }
}
