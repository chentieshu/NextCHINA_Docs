import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readJson = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const meta = readJson('../content/data/research-meta.json');
const categories = readJson('../content/data/categories.json');
const sources = readJson('../content/data/sources.json');
const productFiles = ['audio', 'video', 'image', '3d', 'music', 'assistants', 'platforms', 'agents'];
const productGroups = productFiles.map(name => readJson(`../content/data/products/${name}.json`).products);
const products = { products: productGroups.flat() };
const benchmarks = readJson('../content/data/benchmarks.json');
const apiPrices = readJson('../content/data/model-api-prices.json');
const data = {
  ...meta,
  categories: categories.categories,
  sources: sources.sources,
  products: products.products,
  benchmarks: benchmarks.benchmarks,
  modelApiPrices: apiPrices.modelApiPrices
};
const uniqueIds = (items, label) => {
  assert.equal(new Set(items.map(item => item.id)).size, items.length, `${label}: duplicate IDs`);
  for (const item of items) assert.match(item.id, /^[a-z0-9][a-z0-9-]*$/, `${label}: invalid ID`);
};
const isDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
assert.equal(data.schemaVersion, 1);
assert.ok(isDate(data.checkedAt));
assert.equal(data.timezone, 'Asia/Taipei');
for (const key of ['products', 'sources', 'categories', 'benchmarks', 'modelApiPrices']) {
  assert.ok(Array.isArray(data[key]) && data[key].length, `${key}: missing records`);
  uniqueIds(data[key], key);
}
const sourceIds = new Set(data.sources.map(source => source.id));
assert.equal(data.products.length, 50, 'Unexpected product count after domain split');
const productIds = data.products.map(product => product.id);
assert.equal(new Set(productIds).size, productIds.length, 'Product facts must exist in exactly one domain file');
const categoryIds = new Set(data.categories.map(category => category.id));
const requireSource = id => assert.ok(sourceIds.has(id), `Unknown source: ${id}`);
const kinds = new Set(['saas', 'agent', 'api', 'framework', 'model-service']);
for (const source of data.sources) {
  assert.equal(new URL(source.url).protocol, 'https:', `${source.id}: invalid source URL`);
  assert.ok(['read', 'partial', 'snapshot', 'unavailable'].includes(source.access));
  assert.ok(isDate(source.checkedAt) && source.checkedAt <= data.checkedAt);
  if (source.sourceDate !== null) assert.ok(isDate(source.sourceDate) && source.sourceDate <= source.checkedAt);
  assert.ok(source.note, `${source.id}: missing verification scope`);
}
for (const product of data.products) {
  assert.ok(product.name && product.features.length && product.caution && product.priceNote);
  assert.ok(kinds.has(product.kind));
  assert.ok(['verified', 'partial'].includes(product.verification));
  assert.ok(product.categories.length && product.sourceIds.length);
  product.categories.forEach(category => assert.ok(categoryIds.has(category), `Unknown category: ${category}`));
  product.sourceIds.forEach(requireSource);
  assert.ok(product.sourceIds.length > 0, `${product.id}: missing official website/source link`);
  const primarySource = data.sources.find(source => source.id === product.sourceIds[0]);
  assert.ok(primarySource && new URL(primarySource.url).protocol === 'https:', `${product.id}: invalid primary official link`);
  assert.ok(product.originCountry === null || typeof product.originCountry === 'string');
  // Absence of a plan is unknown, never an implicit zero/free price.
  assert.ok(Array.isArray(product.plans));
  for (const plan of product.plans) {
    assert.ok(typeof plan.amount === 'number' && Number.isFinite(plan.amount) && plan.amount >= 0);
    assert.ok(['USD', 'EUR', 'CNY', 'HKD', 'TWD'].includes(plan.currency));
    assert.ok(['monthly', 'annual'].includes(plan.billing));
    assert.ok(plan.name);
  }
}
for (const category of data.categories) {
  assert.ok(data.products.some(product => product.categories.includes(category.id)), `Empty category: ${category.id}`);
}
for (const benchmark of data.benchmarks) {
  requireSource(benchmark.sourceId);
  assert.ok(benchmark.metric && benchmark.unit && benchmark.warning);
  assert.ok(['model', 'agent'].includes(benchmark.scope));
  assert.ok(['source-order', 'unranked-excerpt'].includes(benchmark.rankType));
  if (benchmark.snapshotDate !== null) assert.ok(isDate(benchmark.snapshotDate) && benchmark.snapshotDate <= data.checkedAt);
  uniqueIds(benchmark.rows, benchmark.id);
  let lastRank = 0;
  for (const row of benchmark.rows) {
    assert.ok(row.name && Number.isFinite(row.score));
    if (benchmark.unit === '%') assert.ok(row.score >= 0 && row.score <= 100);
    if (benchmark.rankType === 'unranked-excerpt') assert.equal(row.rank, null, 'Excerpt must not invent ranks');
    else {
      assert.ok(Number.isInteger(row.rank) && row.rank > lastRank);
      lastRank = row.rank;
    }
    if ('uncertainty' in row) assert.ok(Number.isFinite(row.uncertainty) && row.uncertainty >= 0);
    if ('votes' in row) assert.ok(Number.isInteger(row.votes) && row.votes > 0);
    if ('submittedAt' in row) assert.ok(isDate(row.submittedAt) && row.submittedAt <= data.checkedAt);
    if (benchmark.scope === 'agent') assert.ok(row.model && row.submittedAt, 'Agent score requires model and date');
  }
}
for (const price of data.modelApiPrices) {
  requireSource(price.sourceId);
  assert.equal(price.currency, 'USD');
  assert.equal(price.unit, 'per-million-tokens');
  assert.ok(price.conditions && price.provider && price.name);
  assert.ok(isDate(price.checkedAt) && price.checkedAt <= data.checkedAt);
  for (const field of ['input', 'output', 'cacheRead']) assert.ok(Number.isFinite(price[field]) && price[field] >= 0);
}
console.log(JSON.stringify({
  status: 'pass',
  checkedAt: data.checkedAt,
  products: data.products.length,
  partialProducts: data.products.filter(product => product.verification === 'partial').length,
  agentProductsAndPlatforms: data.products.filter(product => product.categories.includes('agent')).length,
  categories: data.categories.length,
  sources: data.sources.length,
  benchmarkRows: data.benchmarks.reduce((total, benchmark) => total + benchmark.rows.length, 0),
  apiPrices: data.modelApiPrices.length
}, null, 2));
