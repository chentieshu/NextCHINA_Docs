// Adopted candidate-v3; sealed against the independently reviewed published batch17 baseline.
// The release gate remains a hard assertion, never a skip or an inferred current-source baseline.
import { test, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { graph, ancestors } from '../../src/features/garden/data';
import { exampleChecks, validateExampleChecks } from '../../scripts/knowledge-example-contract.mjs';
import { pythonFixtureRegistrations, loadPythonFixtureSuffixes } from '../../scripts/knowledge-python-fixtures.mjs';

type ExampleRow = [string, string, string];
type FixtureRow = [string, string];
interface BaselineSignatures {
  nodes: string; edges: string; articleRegistry: string; spaces: string; outline: string;
  hubResources: string; orientationChildren: string; runnerBytes: string; legacyContentSpecBytes: string;
  oldArticleFiles: string; oldFixtureFiles: string; infrastructureFiles: string;
}
const RELEASED_BATCH17: {
  status: 'pending-explicit-published-batch17-release' | 'released-published-batch17';
  publishedCommit: string | null; sourceManifestSha256: string | null;
  releaseEvidence: string | null; baselineCaptureSha256: string | null;
  signatures: BaselineSignatures | null;
} = {
    "status": "released-published-batch17",
    "publishedCommit": "6c76c9d8168a2dad4ab586f4f74b081b8a008f47",
    "sourceManifestSha256": "3ce6509a044e6aa9ce6b2102975dea8ae73e1529389fa007ce12fe55cdcd805b",
    "releaseEvidence": "Published batch17 commit 6c76c9d8168a2dad4ab586f4f74b081b8a008f47; topic-plan CI 37417370285 passed; explicit coordinator adoption release on 2026-10-06. Clean source, graph, inventory and actual 550/505 discovery captured and independently reviewed before adoption.",
    "baselineCaptureSha256": "439f58ad9b85f2f2ceb042da34adde63f3746d4056390d5d620ba430ec923e09",
    "signatures": {
      "nodes": "e511de858bc05134ee892dbf1094465f607b6ba4a5b06ce0211b4a427a1cccbf",
      "edges": "5d51077ac8a8717f54cf75fd0aaff8cbb9d880138295832eda108306bbd33b3b",
      "articleRegistry": "371f64ccb9d686e569907e806f2f821dcb51f4974ddce3db015f9eefffbd46e6",
      "spaces": "8f9aa38581c0a096cb458aa5b318b37e5ca429378f9ec5220da139a5e81406fe",
      "outline": "d5552db66b01375a221b314c71c586323d8a19b49ea59f0d94b648648e56ac65",
      "hubResources": "ad5ea4cfff738926ec03926285568abbab4d7b5d25553080287af14e6662de29",
      "orientationChildren": "9ef49f90b5cfeaa8f20a4f0ba1d874e8b2eef7bfd7a0707429ceccc86b5baaaf",
      "runnerBytes": "b8581522529dfcf0f904402130847e1276d3e3eb50a5165efa6551fddca9d67e",
      "legacyContentSpecBytes": "1af6bb65a5b4d9fb1f04efb618f591fffa10e387eec9fbee414733573ed529ea",
      "oldArticleFiles": "cba70f07d4d96a9cd7ec8e5fa33a0989fff055e209cc6ddbeb4bb6c97342a5ec",
      "oldFixtureFiles": "b6dadb16866904723c5ab53786d2b73c7ef39d4fba5ac5a5c58b43121e4075ca",
      "infrastructureFiles": "a1c8104dadca1b800be2831f0f595eb36671ce3608c58d9f50704fa56d4e8b34"
    }
};
function releasedBaseline(): BaselineSignatures {
  assert.equal(RELEASED_BATCH17.status, 'released-published-batch17',
    'Batch18 blocked: explicit published batch17 release and reviewed baseline seal are required');
  assert.match(RELEASED_BATCH17.publishedCommit ?? '', /^[a-f0-9]{40}$/,
    'Batch18 baseline requires the verified published batch17 commit');
  for (const key of ['sourceManifestSha256', 'baselineCaptureSha256'] as const)
    assert.match(RELEASED_BATCH17[key] ?? '', /^[a-f0-9]{64}$/, `Batch18 baseline requires ${key}`);
  assert.ok(RELEASED_BATCH17.releaseEvidence?.trim(), 'Batch18 baseline requires explicit parent release evidence');
  const signatures = RELEASED_BATCH17.signatures;
  assert.ok(signatures, 'Batch18 baseline fingerprints have not been sealed');
  for (const [key, value] of Object.entries(signatures))
    assert.match(value, /^[a-f0-9]{64}$/, `Unsealed batch17 signature: ${key}`);
  return signatures;
}
test.beforeAll(() => { releasedBaseline(); });

// Fixed reviewed expectations, independent of the mutable live registries.
// Pre-batch18 rows include staged batch17's exact pair; staging is not integration evidence.
const requiredPreBatch18Examples: ExampleRow[] = [
  [
    "floating-point-rounding",
    "floating-point-rounding",
    "python"
  ],
  [
    "llm-tokenization",
    "tokenization",
    "python"
  ],
  [
    "llm-softmax-temperature",
    "softmax",
    "python"
  ],
  [
    "llm-attention-calculation",
    "attention",
    "python"
  ],
  [
    "llm-training-loop",
    "training",
    "python"
  ],
  [
    "llm-kv-cache",
    "kv-cache",
    "python"
  ],
  [
    "llm-tensor-shapes",
    "tensor-shapes",
    "python"
  ],
  [
    "llm-conditional-probability",
    "conditional-probability",
    "python"
  ],
  [
    "llm-entropy-cross-entropy",
    "entropy-cross-entropy",
    "python"
  ],
  [
    "llm-derivatives",
    "derivatives",
    "python"
  ],
  [
    "statistical-inference-confidence-interval",
    "statistical-inference-confidence-interval",
    "python"
  ],
  [
    "train-validation-test-data-leakage",
    "train-validation-test-data-leakage",
    "python"
  ],
  [
    "classification-accuracy-precision-recall-f1",
    "classification-accuracy-precision-recall-f1",
    "python"
  ],
  [
    "supervised-learning-naive-bayes",
    "supervised-learning-naive-bayes",
    "python"
  ],
  [
    "ai-ml-dl-boundaries",
    "ai-ml-dl-boundaries",
    "observable-case"
  ],
  [
    "unsupervised-self-supervised-learning",
    "unsupervised-self-supervised-learning",
    "observable-case"
  ],
  [
    "algorithm-complexity-cost-model",
    "algorithm-complexity-cost-model",
    "python"
  ],
  [
    "mutual-information",
    "mutual-information",
    "python"
  ],
  [
    "regularization-penalty-generalization",
    "regularization-penalty-generalization",
    "python"
  ],
  [
    "adamw-moments-decoupled-decay",
    "adamw-moments-decoupled-decay",
    "python"
  ],
  [
    "eigen-svd-low-rank",
    "eigen-svd-low-rank",
    "python"
  ],
  [
    "compression-prefix-codes",
    "compression-prefix-codes",
    "python"
  ],
  [
    "constrained-optimization-projection-kkt",
    "constrained-optimization-projection-kkt",
    "python"
  ],
  [
    "probability-calibration-brier-bins",
    "probability-calibration-brier-bins",
    "python"
  ],
  [
    "evaluation-dataset-target-coverage",
    "evaluation-dataset-target-coverage",
    "observable-case"
  ],
  [
    "benchmark-protocol-comparable-runs",
    "benchmark-protocol-comparable-runs",
    "observable-case"
  ],
  [
    "ranking-mrr-ndcg-judgments",
    "ranking-mrr-ndcg-judgments",
    "python"
  ],
  [
    "serving-timing-throughput-tails",
    "serving-timing-throughput-tails",
    "python"
  ]
];
const requiredPreBatch18Fixtures: FixtureRow[] = [
  [
    "algorithm-complexity-cost-model",
    "scripts/knowledge-fixtures/algorithm-complexity-cost-model.py"
  ],
  [
    "mutual-information",
    "scripts/knowledge-fixtures/mutual-information.py"
  ],
  [
    "regularization-penalty-generalization",
    "scripts/knowledge-fixtures/regularization-penalty-generalization.py"
  ],
  [
    "adamw-moments-decoupled-decay",
    "scripts/knowledge-fixtures/adamw-moments-decoupled-decay.py"
  ],
  [
    "eigen-svd-low-rank",
    "scripts/knowledge-fixtures/eigen-svd-low-rank.py"
  ],
  [
    "compression-prefix-codes",
    "scripts/knowledge-fixtures/compression-prefix-codes.py"
  ],
  [
    "constrained-optimization-projection-kkt",
    "scripts/knowledge-fixtures/constrained-optimization-projection-kkt.py"
  ],
  [
    "probability-calibration-brier-bins",
    "scripts/knowledge-fixtures/probability-calibration-brier-bins.py"
  ],
  [
    "ranking-mrr-ndcg-judgments",
    "scripts/knowledge-fixtures/ranking-mrr-ndcg-judgments.py"
  ],
  [
    "serving-timing-throughput-tails",
    "scripts/knowledge-fixtures/serving-timing-throughput-tails.py"
  ]
];
const addedExamples: ExampleRow[] = [
  ['fairness-evaluation-group-rates', 'fairness-evaluation-group-rates', 'python'],
  ['robustness-perturbation-scope', 'robustness-perturbation-scope', 'python'],
];
const addedFixtures: FixtureRow[] = [
  ['fairness-evaluation-group-rates', 'scripts/knowledge-fixtures/fairness-evaluation-group-rates.py'],
  ['robustness-perturbation-scope', 'scripts/knowledge-fixtures/robustness-perturbation-scope.py'],
];
const requiredExamples = [...requiredPreBatch18Examples, ...addedExamples];
const requiredFixtures = [...requiredPreBatch18Fixtures, ...addedFixtures];
const inlineNumericIds = [
  "floating-point-rounding",
  "tokenization",
  "softmax",
  "attention",
  "training",
  "kv-cache",
  "tensor-shapes",
  "conditional-probability",
  "entropy-cross-entropy",
  "derivatives",
  "statistical-inference-confidence-interval",
  "train-validation-test-data-leakage",
  "classification-accuracy-precision-recall-f1",
  "supervised-learning-naive-bayes"
];
const requiredNumericIds = [...inlineNumericIds, ...requiredFixtures.map(row => row[0])];
const pair = [
  {
    "articleId": "fairness-evaluation-group-rates",
    "conceptId": "concept:fairness-evaluation",
    "leaf": "fairness-evaluation",
    "label": "公平性评价",
    "articleFile": "content/models/evaluation/fairness-evaluation-group-rates.md",
    "articleSha256": "608111f30815fa286021723dbba9786c8c4a7cf9734287a4f944540e6489f544",
    "metadataObjectSha256": "deb69374a5cd955dc495315763ee9f837eb7c98881ada117f0a6e651d89f4c98",
    "programSha256": "481396ee1b5fe5d45e3b7f973f7e1e7552b724751280bfd8966be47172dadf4b",
    "programBytes": 4603,
    "fixtureFile": "scripts/knowledge-fixtures/fairness-evaluation-group-rates.py",
    "fixtureSha256": "44d2786422c7294c2cdb11bdb2bf843df8b9266f33458bc467831b2a33dbf5f3",
    "fixtureBytes": 12647,
    "sourceUrls": [
      "https://papers.nips.cc/paper/6374-equality-of-opportunity-in-supervised-learning.pdf",
      "https://arxiv.org/pdf/1703.00056v1",
      "https://friedler.net/papers/sts_fat2019.pdf",
      "https://docs.python.org/3/library/fractions.html"
    ]
  },
  {
    "articleId": "robustness-perturbation-scope",
    "conceptId": "concept:robustness",
    "leaf": "robustness",
    "label": "鲁棒性评价",
    "articleFile": "content/models/evaluation/robustness-perturbation-scope.md",
    "articleSha256": "30b1e5d7c7d20b22c11f2f4726b6fd040dc78718d7aa58998e828826e6c37755",
    "metadataObjectSha256": "775c344c9ba89461b6b6e2f71d77003d3caac8f82233140ba638b519d0cc8647",
    "programSha256": "e8412e7767d3a3eafaecc9655a3e04b8cc31ea2ffb2c3d88052a5031c4175a19",
    "programBytes": 5653,
    "fixtureFile": "scripts/knowledge-fixtures/robustness-perturbation-scope.py",
    "fixtureSha256": "bd475667b42554a03a726bd413e1fba4cafe0e5cada744bde0599a5d10dd467d",
    "fixtureBytes": 23772,
    "sourceUrls": [
      "https://arxiv.org/pdf/1706.06083v4",
      "https://arxiv.org/pdf/1903.12261v1",
      "https://proceedings.neurips.cc/paper_files/paper/2020/file/d8330f857a17c53d217014ee776bfd50-Paper.pdf",
      "https://docs.python.org/3/library/fractions.html"
    ]
  }
];
const pairIds = new Set(pair.map(item => item.articleId));
const parentId = 'branch:ai-overview:orientation';
const leaves = pair.map(item => `${parentId}/${item.leaf}`);
const oldOrientationChildren = [
  {
    "id": "ai-ml-dl",
    "label": "AI、机器学习与深度学习的边界",
    "conceptRefs": [
      "concept:artificial-intelligence",
      "concept:machine-learning",
      "concept:deep-learning"
    ]
  },
  {
    "id": "naive-bayes",
    "label": "监督学习：用朴素贝叶斯训练分类器",
    "conceptRefs": [
      "concept:supervised-learning",
      "concept:naive-bayes"
    ]
  },
  {
    "id": "learning-signals",
    "label": "无监督与自监督：训练信号从哪里来",
    "conceptRefs": [
      "concept:unsupervised-learning",
      "concept:self-supervised-learning"
    ]
  }
];
const expectedFolderEntries = [
  'file:branch:ai-overview:orientation:overview',
  'branch:ai-overview:orientation/ai-ml-dl',
  'branch:ai-overview:orientation/naive-bayes',
  'branch:ai-overview:orientation/learning-signals',
  'branch:ai-overview:orientation/fairness-evaluation',
  'branch:ai-overview:orientation/robustness',
];

// Compact historical anchors: static observation, not a released batch17 baseline.
// Reconfirm at release. Their digests cannot shrink with a damaged live inventory.
const historicalAnchors = {
  canonicalIds: 'a13b341affca98678ae15c82fe3cd1b68ac3d7e997b41207ad988bd5c91e8bec',
  canonicalIdentityParentLabel: '72e89e7c6c4a69fc557af241e9576eee18ed7273406427c5ac0b9cab01b73df5',
  original603Ids: '9aa2fb7ce6321e854a679b98e1d05538942241e2ccf2a85fcb5e14b8d9389b61',
};
function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value !== null && typeof value === 'object') return Object.fromEntries(
    Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
      .map(([key, item]) => [key, stable(item)]));
  return value;
}
const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const digest = (value: unknown) => sha256(JSON.stringify(stable(value)));
const protectedInfrastructurePaths = [
  'package.json', 'package-lock.json', 'playwright.config.ts', 'playwright.production.config.ts',
  '.github/workflows/deploy-cloudflare.yml', '.github/workflows/validate-garden.yml',
  '.github/workflows/validate-topic-hub-plan.yml', '.github/workflows/validate-workspace.yml',
];
const fileSignature = (files: string[]) => digest(files.map(file => [file, sha256(readFileSync(file))]));
const readJson = (file: string) => JSON.parse(readFileSync(file, 'utf8'));
const registry = () => readJson('content/articles.json');
const units = () => registry().articles.filter((article: { knowledgeUnit?: unknown }) => article.knowledgeUnit);
const firstLine = (error: unknown) => error instanceof Error ? error.message.split('\n')[0] : '';
const assertion = (message: string) => (error: unknown) => error instanceof assert.AssertionError
  && error.code === 'ERR_ASSERTION' && firstLine(error) === message;
const reject = (label: string, run: () => unknown, message: string) =>
  assert.throws(run, assertion(message), label);

function assertRequiredRows(actual: unknown, required: string[][], kind: 'example' | 'fixture') {
  assert.ok(Array.isArray(actual), `Required ${kind} registry must be an array`);
  for (const expected of required) {
    const matches: unknown[] = actual.filter((row: unknown) => Array.isArray(row) && row[0] === expected[0]);
    assert.ok(matches.length, `Required ${kind} row missing: ${expected[0]}`);
    assert.equal(matches.length, 1, `Required ${kind} row duplicated: ${expected[0]}`);
    assert.deepEqual(matches[0], expected, `Required ${kind} row mismatch: ${expected[0]}`);
  }
  assert.equal(actual.length, required.length, `Unexpected ${kind} registration count`);
  assert.deepEqual(actual, required, `Required ${kind} registration order changed`);
}
function orderedUnits() {
  const actual = units();
  assert.deepEqual(actual.map((article: { id: string }) => article.id).sort(),
    requiredExamples.map(row => row[0]).sort(), 'Required knowledge-unit identities changed');
  return requiredExamples.map(([id]) => actual.find((article: { id: string }) => article.id === id));
}
function checkLiveRegistries(examples: string[][] = exampleChecks, fixtures: string[][] = pythonFixtureRegistrations) {
  assertRequiredRows(examples, requiredExamples, 'example');
  assertRequiredRows(fixtures, requiredFixtures, 'fixture');
  const loaded = loadPythonFixtureSuffixes(process.cwd(), inlineNumericIds, fixtures);
  assert.deepEqual([...inlineNumericIds, ...Object.keys(loaded)], requiredNumericIds,
    'Required Python check identities or order changed');
  validateExampleChecks(orderedUnits(), requiredNumericIds, examples);
}

// This is source/graph preservation coverage, not numerical, reader, pixel or suite evidence.
test('trust metrics keep exact accepted metadata, manuscript fences and reviewer suffix identities', () => {
  checkLiveRegistries();
  for (const item of pair) {
    const matches = registry().articles.filter((article: { id: string }) => article.id === item.articleId);
    expect(matches).toHaveLength(1);
    expect(digest(matches[0]), item.articleId).toBe(item.metadataObjectSha256);
    const markdown = readFileSync(item.articleFile, 'utf8');
    expect(sha256(Buffer.from(markdown, 'utf8'))).toBe(item.articleSha256);
    const blocks = [...markdown.matchAll(/^```python\r?\n(# nextchina-example: ([a-z0-9-]+)\r?\n[\s\S]*?)^```\s*$/gm)];
    expect(blocks).toHaveLength(1);
    expect(blocks[0][2]).toBe(item.articleId);
    expect(Buffer.byteLength(blocks[0][1], 'utf8')).toBe(item.programBytes);
    expect(sha256(blocks[0][1])).toBe(item.programSha256);
    const suffix = readFileSync(item.fixtureFile);
    expect(suffix.length).toBe(item.fixtureBytes);
    expect(sha256(suffix)).toBe(item.fixtureSha256);
    expect(matches[0].knowledgeUnit.reviewStatus).toBe('needs-independent-review');
    expect(Object.keys(matches[0].knowledgeUnit).sort()).toEqual([
      'conceptIds', 'exampleId', 'kind', 'placements', 'relatedResourceIds', 'reviewStatus', 'sourceUrls',
    ]);
  }
});

test('frozen required registration rows include all prior rows and reject simultaneous example and fixture omission', () => {
  checkLiveRegistries();
  for (const [id] of requiredFixtures) {
    const examples = structuredClone(requiredExamples).filter(row => row[1] !== id);
    const fixtures = structuredClone(requiredFixtures).filter(row => row[0] !== id);
    // Test both independent oracles: neither required set comes from the damaged other registry.
    reject(`simultaneous omission requires example ${id}`, () => checkLiveRegistries(examples, fixtures),
      `Required example row missing: ${requiredExamples.find(row => row[1] === id)![0]}`);
    reject(`simultaneous omission requires fixture ${id}`, () => assertRequiredRows(fixtures, requiredFixtures, 'fixture'),
      `Required fixture row missing: ${id}`);
  }
  for (const [kind, required] of [['example', requiredExamples], ['fixture', requiredFixtures]] as const) {
    for (const [index, row] of required.entries()) {
      const missing = structuredClone(required).filter((_, at) => at !== index);
      reject(`${kind} frozen omission ${row[0]}`, () => assertRequiredRows(missing, required, kind), `Required ${kind} row missing: ${row[0]}`);
      reject(`${kind} frozen duplicate ${row[0]}`, () => assertRequiredRows([...structuredClone(required), [...row]], required, kind), `Required ${kind} row duplicated: ${row[0]}`);
      const wrong = structuredClone(required); wrong[index][1] = 'unregistered';
      reject(`${kind} frozen pair ${row[0]}`, () => assertRequiredRows(wrong, required, kind), `Required ${kind} row mismatch: ${row[0]}`);
    }
    const reversed = structuredClone(required).reverse();
    reject(`${kind} changed order`, () => assertRequiredRows(reversed, required, kind), `Required ${kind} registration order changed`);
  }
});

test('every example row independently rejects omission duplicate unknown mispair wrong kind and duplicate unit', () => {
  checkLiveRegistries();
  const actualUnits = orderedUnits();
  const validate = (rows: unknown, checkedUnits = actualUnits, numeric = requiredNumericIds) =>
    // Deliberately cross the declared valid-input boundary to test malformed runtime values.
    validateExampleChecks(checkedUnits, numeric, rows as string[][]);
  for (const [index, [articleId, exampleId, kind]] of requiredExamples.entries()) {
    const rows = () => structuredClone(requiredExamples);
    reject(`missing row ${articleId}`, () => validate(rows().filter((_, at) => at !== index)),
      kind === 'python' ? `Unused/reassigned numeric check: ${exampleId}` : `Unregistered example article: ${articleId}`);
    reject(`duplicate row ${articleId}`, () => validate([...rows(), [...requiredExamples[index]]]), 'Duplicate/overlapping example registration');
    reject(`duplicate article ${articleId}`, () => validate([...rows(), [articleId, 'unregistered-example', kind]]), 'Duplicate/overlapping example registration');
    reject(`duplicate example ${exampleId}`, () => validate([...rows(), ['unregistered-article', exampleId, kind]]), 'Duplicate/overlapping example registration');
    const unknownArticle = rows(); unknownArticle[index][0] = 'unregistered-article';
    reject(`unknown article ${articleId}`, () => validate(unknownArticle), kind === 'python'
      ? `Unregistered example article: ${articleId}` : 'Unknown observable-case article/example pair');
    const unknownExample = rows(); unknownExample[index][1] = 'unregistered-example';
    reject(`unknown example ${exampleId}`, () => validate(unknownExample), kind === 'python'
      ? 'Missing numeric checks: unregistered-example' : 'Unknown observable-case article/example pair');
    const unknownKind = rows(); unknownKind[index][2] = 'optional';
    reject(`unknown kind ${articleId}`, () => validate(unknownKind), 'Unknown example kind: optional');
    const wrongKind = rows(); wrongKind[index][2] = kind === 'python' ? 'observable-case' : 'python';
    reject(`wrong kind ${articleId}`, () => validate(wrongKind), kind === 'python'
      ? `Cannot reassign numeric example: ${exampleId}` : `Missing numeric checks: ${exampleId}`);
    const otherIndex = requiredExamples.findIndex((row, at) => at !== index && row[2] === kind);
    assert.notEqual(otherIndex, -1, `Need distinct same-kind row to test pairing: ${articleId}`);
    const mismatch = rows();
    [mismatch[index][1], mismatch[otherIndex][1]] = [mismatch[otherIndex][1], mismatch[index][1]];
    reject(`mismatched pair ${articleId}`, () => validate(mismatch), kind === 'python'
      ? `Wrong article/example pair: ${requiredExamples[Math.min(index, otherIndex)][0]}`
      : 'Unknown observable-case article/example pair');
    reject(`duplicate unit ${articleId}`, () => validate(rows(), [...actualUnits, structuredClone(actualUnits[index])]), `Duplicate unit: ${articleId}`);
    reject(`omitted unit ${articleId}`, () => validate(rows(), actualUnits.filter((_: unknown, at: number) => at !== index)), 'Unused example registration');
    const wrongUnit = structuredClone(actualUnits); wrongUnit[index].knowledgeUnit.exampleId = 'unregistered-example';
    reject(`wrong unit example ${articleId}`, () => validate(rows(), wrongUnit), `Wrong article/example pair: ${articleId}`);
    for (const bad of [null, {}, [], [articleId], [articleId, exampleId], [articleId, exampleId, kind, 'extra']]) {
      const malformed: unknown[] = rows(); malformed[index] = bad;
      reject(`malformed example row ${articleId}`, () => validate(malformed), 'Expected article/example/kind registration');
    }
  }
  for (const id of requiredNumericIds) {
    reject(`missing numeric ${id}`, () => validate(requiredExamples, actualUnits, requiredNumericIds.filter(value => value !== id)), `Missing numeric checks: ${id}`);
    reject(`duplicate numeric ${id}`, () => validate(requiredExamples, actualUnits, [...requiredNumericIds, id]), 'Duplicate Python check ID');
  }
  reject('unused numeric identity', () => validate(requiredExamples, actualUnits, [...requiredNumericIds, 'unregistered-numeric']), 'Unused/reassigned numeric check: unregistered-numeric');
});

test('every suffix row independently rejects omission missing file unknown identity duplicates collisions and malformed schema', () => {
  checkLiveRegistries();
  const validate = (rows: unknown) => {
    // Deliberately test malformed runtime values against the unchanged loader.
    const loaded = loadPythonFixtureSuffixes(process.cwd(), inlineNumericIds, rows as string[][]);
    validateExampleChecks(orderedUnits(), [...inlineNumericIds, ...Object.keys(loaded)], requiredExamples);
  };
  for (const [index, [id, file]] of requiredFixtures.entries()) {
    const rows = () => structuredClone(requiredFixtures);
    reject(`missing fixture registration ${id}`, () => validate(rows().filter((_, at) => at !== index)), `Missing numeric checks: ${id}`);
    const missing = rows(); missing[index][1] = 'scripts/knowledge-fixtures/unregistered-missing-fixture.py';
    reject(`missing fixture file ${id}`, () => validate(missing), 'Missing Python fixture: scripts/knowledge-fixtures/unregistered-missing-fixture.py');
    const unknown = rows(); unknown[index][0] = 'unregistered-fixture';
    reject(`unknown replacement fixture ${id}`, () => validate(unknown), `Missing numeric checks: ${id}`);
    reject(`duplicate entire fixture row ${id}`, () => validate([...rows(), [id, file]]), `Duplicate fixture example ID: ${id}`);
    reject(`duplicate fixture ID ${id}`, () => validate([...rows(), [id, 'scripts/knowledge-fixtures/unregistered-missing-fixture.py']]), `Duplicate fixture example ID: ${id}`);
    reject(`duplicate real fixture path ${id}`, () => validate([...rows(), ['unregistered-fixture', file]]), `Duplicate fixture path: ${file}`);
    const collision = rows(); collision[index][0] = inlineNumericIds[0];
    reject(`inline fixture collision ${id}`, () => validate(collision), `Fixture collides with inline example: ${inlineNumericIds[0]}`);
    for (const bad of [null, {}, [], [id], [id, file, 'extra']]) {
      const malformed: unknown[] = rows(); malformed[index] = bad;
      reject(`malformed fixture tuple ${id}`, () => validate(malformed), 'Expected example/path fixture registration');
    }
    for (const badId of ['', null, 1, 'has space', 'Uppercase', '__proto__']) {
      const malformed: unknown[] = rows(); malformed[index] = [badId, file];
      reject(`invalid fixture ID at ${id}`, () => validate(malformed), 'Invalid fixture example ID');
    }
    for (const badPath of ['', null, 1, '/tmp/example.py', '../example.py',
      'scripts/knowledge-fixtures/../example.py', 'scripts/knowledge-fixtures/./example.py', 'scripts/knowledge-fixtures/example.txt']) {
      const malformed: unknown[] = rows(); malformed[index] = [id, badPath];
      reject(`invalid fixture path at ${id}`, () => validate(malformed), 'Invalid fixture path');
    }
  }
  reject('nonarray fixture registry', () => validate(null), 'Expected fixture registration array');
});

test('trust pair owns precisely two existing canonical explanations and two populated AI-overview leaves', () => {
  const articles = registry().articles;
  const byId = new Map(graph.nodes.map(node => [node.id, node]));
  for (const [index, item] of pair.entries()) {
    const article = articles.find((value: { id: string }) => value.id === item.articleId)!;
    const unit = article.knowledgeUnit;
    expect(unit.conceptIds).toEqual([item.conceptId]);
    expect(unit.placements).toEqual([{ hubId: 'hub:ai-overview', path: `orientation/${item.leaf}` }]);
    expect(unit.relatedResourceIds).toEqual([]);
    expect(articles.filter((value: { knowledgeUnit?: { conceptIds: string[] } }) => value.knowledgeUnit?.conceptIds.includes(item.conceptId))
      .map((value: { id: string }) => value.id)).toEqual([item.articleId]);
    const canonical = byId.get(item.conceptId)!;
    expect(canonical.kind).toBe('concept');
    expect(canonical.parentId).toBe('topic:trust-metrics');
    expect(ancestors(item.conceptId).map(node => node.id)).toEqual(['root:ai', 'domain:evaluation', 'topic:trust-metrics', item.conceptId]);
    expect(canonical.articleBindings).toEqual([{ articleId: item.articleId, coverage: 'explanation' }]);
    expect(canonical.embeddedArticleId).toBeUndefined();
    expect(canonical.contentStatus).toBe('outline');
    expect(canonical.evidenceStatus).toBe('not-reviewed');
    expect(graph.nodes.filter(node => node.kind === 'concept' && node.articleBindings.some(ref => ref.articleId === item.articleId)).map(node => node.id)).toEqual([item.conceptId]);
    expect(graph.nodes.filter(node => node.articleBindings.some(ref => ref.articleId === item.articleId)).map(node => node.id).sort()).toEqual([item.conceptId, leaves[index]].sort());
    expect(graph.nodes.filter(node => node.embeddedArticleId === item.articleId).map(node => node.id)).toEqual([leaves[index]]);
    expect(graph.nodes.filter(node => node.resourceRefs?.some(ref => ref.articleId === item.articleId)).map(node => node.id)).toEqual([leaves[index]]);
    const leaf = byId.get(leaves[index])!;
    expect(leaf).toMatchObject({ id: leaves[index], label: item.label, kind: 'branch', parentId,
      hubId: 'hub:ai-overview', outlinePath: `orientation/${item.leaf}`, embeddedArticleId: item.articleId,
      conceptRefs: [item.conceptId], hubRefs: [], resourceRefs: [{ articleId: item.articleId, role: 'independent-explanation' }],
      articleBindings: [{ articleId: item.articleId, coverage: 'explanation' }], contentStatus: 'outline', evidenceStatus: 'not-reviewed' });
    expect(graph.nodes.filter(node => node.parentId === leaf.id)).toEqual([]);
    expect(graph.hubResources?.[item.articleId]).toEqual({ articleId: item.articleId,
      kind: 'independent-explanation', reviewStatus: 'needs-independent-review', relatedResourceIds: [], sourceUrls: item.sourceUrls });
  }
  const parent = byId.get(parentId)!;
  expect(parent.label).toBe('基础与认识');
  expect(parent.embeddedArticleId).toBeUndefined();
  expect(parent.articleBindings).toEqual([{ articleId: 'overview', coverage: 'overview' }]);
  expect(parent.resourceRefs).toEqual([{ articleId: 'overview', role: 'existing-orientation' }]);
  expect(parent.conceptRefs).toEqual([]);
  const oldIds = oldOrientationChildren.map(item => `${parentId}/${item.id}`);
  expect(graph.nodes.filter(node => node.parentId === parentId).map(node => node.id)).toEqual([...oldIds, ...leaves]);
  for (const [leaf, article] of [['ai-ml-dl', 'ai-ml-dl-boundaries'], ['naive-bayes', 'supervised-learning-naive-bayes'], ['learning-signals', 'unsupervised-self-supervised-learning']])
    expect(byId.get(`${parentId}/${leaf}`)!.embeddedArticleId).toBe(article);
  const outline = readJson('content/garden/plans/topic-hubs-v2.json').hubOutlines['hub:ai-overview'][0];
  expect(outline.id).toBe('orientation');
  expect(outline.children).toEqual([...oldOrientationChildren, ...pair.map(item => ({ id: item.leaf, label: item.label, conceptRefs: [item.conceptId] }))]);
});

test('all 407 canonical identities parents labels and the original 603 identities remain fixed', () => {
  const canonical = graph.nodes.filter(node => node.kind === 'concept');
  expect(canonical).toHaveLength(407);
  expect(digest(canonical.map(node => node.id).sort())).toBe(historicalAnchors.canonicalIds);
  expect(digest(canonical.map(node => [node.id, node.kind, node.parentId, node.label])
    .sort(([a], [b]) => a! < b! ? -1 : a! > b! ? 1 : 0))).toBe(historicalAnchors.canonicalIdentityParentLabel);
  const ids = graph.nodes.map(node => node.id);
  expect(new Set(ids).size).toBe(ids.length);
  const original: string[] = readJson('content/garden/content-inventory.json').originalScope.originalModelNodeIds;
  expect(original).toHaveLength(603);
  expect(new Set(original).size).toBe(603);
  expect(digest([...original].sort())).toBe(historicalAnchors.original603Ids);
  const originalSet = new Set(original);
  expect(digest(ids.filter(id => originalSet.has(id)).sort())).toBe(historicalAnchors.original603Ids);
  for (const node of canonical) {
    const chain = ancestors(node.id);
    expect(chain[0].id, node.id).toBe('root:ai');
    expect(new Set(chain.map(item => item.id)).size, node.id).toBe(chain.length);
    expect(chain.at(-1)?.id, node.id).toBe(node.id);
  }
});

const expectedPairEdges = pair.flatMap(item => {
  const leaf = `${parentId}/${item.leaf}`;
  return [
    { id: `nav:${parentId}>${leaf}`, source: parentId, target: leaf, type: 'browse_child', assertionStatus: 'editorial' },
    { id: `references:${leaf}>${item.conceptId}`, source: leaf, target: item.conceptId, type: 'references', assertionStatus: 'editorial',
      reason: '专题分支引用规范知识对象。', provenance: 'conceptRefs' },
  ];
});
const pairEdgeIds = new Set(expectedPairEdges.map(edge => edge.id));
test('exact four scoped navigation/reference edges preserve old edge objects order and per-article exclusions', () => {
  const baseline = releasedBaseline();
  const ids = graph.edges.map(edge => edge.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const expected of expectedPairEdges) expect(graph.edges.filter(edge => edge.id === expected.id)).toEqual([expected]);
  expect(graph.edges.filter(edge => leaves.includes(edge.source) || leaves.includes(edge.target)).map(edge => edge.id).sort())
    .toEqual([...pairEdgeIds].sort());
  // Hash every old edge, including routeId/scope/evidence/status, in its old relative order.
  // This also rejects extra canonical-only prerequisites, reciprocal pair edges or altered old references.
  expect(digest(graph.edges.filter(edge => !pairEdgeIds.has(edge.id)))).toBe(baseline.edges);
  const metricsId = 'classification-accuracy-precision-recall-f1';
  const metrics = registry().articles.find((article: { id: string }) => article.id === metricsId);
  expect(metrics.knowledgeUnit.conceptIds).toEqual(['concept:accuracy-f1', 'concept:precision-recall']);
  for (const id of ['concept:calibration', 'concept:ranking-metrics']) {
    expect(metrics.knowledgeUnit.conceptIds).not.toContain(id);
    expect(graph.nodes.find(node => node.id === id)!.articleBindings.some(ref => ref.articleId === metricsId)).toBe(false);
  }
});

test('released batch17 nodes resources article objects spaces outlines runner and old assertions are preserved', () => {
  const baseline = releasedBaseline();
  const oldNodes = graph.nodes.filter(node => !leaves.includes(node.id)).map(node => {
    if (!pair.some(item => item.conceptId === node.id)) return node;
    return { ...node, articleBindings: node.articleBindings.filter(ref => !pairIds.has(ref.articleId)) };
  });
  expect(digest(oldNodes)).toBe(baseline.nodes);
  const articleRegistry = registry();
  expect(articleRegistry.articles.slice(-2).map((article: { id: string }) => article.id)).toEqual(pair.map(item => item.articleId));
  articleRegistry.articles = articleRegistry.articles.filter((article: { id: string }) => !pairIds.has(article.id));
  expect(digest(articleRegistry)).toBe(baseline.articleRegistry);
  expect(fileSignature(articleRegistry.articles.map((article: { file: string }) => article.file))).toBe(baseline.oldArticleFiles);
  expect(fileSignature(requiredPreBatch18Fixtures.map(row => row[1]))).toBe(baseline.oldFixtureFiles);
  expect(fileSignature(protectedInfrastructurePaths)).toBe(baseline.infrastructureFiles);
  const spaces = readJson('content/spaces.json');
  const models = spaces.spaces.filter((space: { id: string }) => space.id === 'models');
  expect(models).toHaveLength(1);
  expect(models[0].chapterIds.slice(-2)).toEqual(pair.map(item => item.articleId));
  for (const item of pair) expect(models[0].chapterIds.filter((id: string) => id === item.articleId)).toHaveLength(1);
  models[0].chapterIds = models[0].chapterIds.filter((id: string) => !pairIds.has(id));
  expect(digest(spaces)).toBe(baseline.spaces);
  const outline = readJson('content/garden/plans/topic-hubs-v2.json');
  const orientation = outline.hubOutlines['hub:ai-overview'][0];
  orientation.children = orientation.children.filter((item: { id: string }) => !pair.some(unit => unit.leaf === item.id));
  expect(digest(orientation.children)).toBe(baseline.orientationChildren);
  expect(digest(outline)).toBe(baseline.outline);
  const resources = Object.fromEntries(Object.entries(graph.hubResources ?? {}).filter(([id]) => !pairIds.has(id)));
  expect(digest(resources)).toBe(baseline.hubResources);
  const runner = readFileSync('scripts/test-knowledge-units.mjs', 'utf8');
  expect(sha256(runner)).toBe(baseline.runnerBytes);
  expect(runner).toContain("spawnSync('python3', ['-I', '-c', code], { cwd: temp, encoding: 'utf8', timeout: 8000,");
  expect(runner).toContain("maxBuffer: 128 * 1024, env: { PATH: process.env.PATH, LANG: 'C.UTF-8', PYTHONIOENCODING: 'utf-8' }");
  const oldSpec = readFileSync('tests/browser/workspace-content-batch.spec.ts', 'utf8');
  const after = "await expect(parent.locator('.ws-folder-rows button')).toHaveCount(6);";
  const before = "await expect(parent.locator('.ws-folder-rows button')).toHaveCount(4);";
  expect(oldSpec.split(after).length - 1).toBe(2);
  expect(sha256(oldSpec.replaceAll(after, before))).toBe(baseline.legacyContentSpecBytes);
});

for (const width of [390, 1440]) test(`orientation has exactly six ordered identities and all six reader/history routes / ${width}px`, async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`/?view=garden&scope=${parentId}`);
  const folder = page.locator(`[data-folder="${parentId}"]`);
  const checkFolder = async () => {
    await expect(folder).toBeVisible();
    await expect(folder.locator('h1')).toHaveText('基础与认识');
    await expect(page.locator('[data-document]')).toHaveCount(0);
    await expect(folder.locator('.ws-folder-rows button')).toHaveCount(6);
    await expect(folder.locator('[data-folder-entry]')).toHaveCount(6);
    expect(await folder.locator('[data-folder-entry]').evaluateAll(elements => elements.map(element => element.getAttribute('data-folder-entry')))).toEqual(expectedFolderEntries);
    const params = new URL(page.url()).searchParams;
    expect(params.get('view')).toBe('garden'); expect(params.get('scope')).toBe(parentId);
  };
  await checkFolder();
  const articleIds = ['overview', 'ai-ml-dl-boundaries', 'supervised-learning-naive-bayes',
    'unsupervised-self-supervised-learning', 'fairness-evaluation-group-rates', 'robustness-perturbation-scope'];
  for (const [index, entry] of expectedFolderEntries.entries()) {
    const articleId = articleIds[index];
    const checkArticle = async () => {
      await expect(page.locator('[data-document]')).toHaveCount(1);
      await expect(page.locator(`[data-document="${articleId}"] .markdown-body`)).toBeVisible();
      await expect(page.locator('[data-folder]')).toHaveCount(0);
      const params = new URL(page.url()).searchParams;
      expect(params.get('view')).toBe('article'); expect(params.get('article')).toBe(articleId);
      const returnParams = new URLSearchParams(params.get('return') ?? '');
      expect(returnParams.get('scope')).toBe(index === 0 ? parentId : entry);
      expect(returnParams.get('display')).toBe('list');
    };
    await folder.locator(`[data-folder-entry="${entry}"]`).click();
    await checkArticle(); await page.reload(); await checkArticle();
    await page.goBack(); await checkFolder();
    await page.goForward(); await checkArticle();
    await page.goBack(); await checkFolder();
  }
  expect(errors).toEqual([]);
});
