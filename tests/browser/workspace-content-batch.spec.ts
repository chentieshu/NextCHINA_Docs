import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { graph } from '../../src/features/garden/data';
const networkNodeCount = graph.nodes.filter(node => !['root', 'group', 'path', 'document'].includes(node.kind)).length;
const inventory = JSON.parse(readFileSync('content/garden/content-inventory.json', 'utf8'));
const probabilityArticleId = 'llm-conditional-probability';
const statisticsArticleId = 'statistical-inference-confidence-interval';
const dataSplitArticleId = 'train-validation-test-data-leakage';
const metricsArticleId = 'classification-accuracy-precision-recall-f1';
const naiveBayesArticleId = 'supervised-learning-naive-bayes';
const naiveBayesTitle = '监督学习怎样从标注样本得到分类器？朴素贝叶斯实算';
const metricsTitle = '准确率90%，为什么仍漏掉全部目标？精确率、召回率与 F1';
const dataSplitTitle = '训练、验证与测试：模型没见过答案，评估就可信吗？';
const statisticsTitle = '测试集答对80%，能说明模型有多可靠？统计推断与置信区间';
const probabilityTitle = '概率基础：从贝叶斯更新到期望与序列概率';
const probabilityBridges = [
  { source: 'concept:bayes-rule', target: 'concept:naive-bayes', label: '朴素贝叶斯', articleId: naiveBayesArticleId, articleTitle: naiveBayesTitle },
  { source: 'concept:expectation-variance', target: 'concept:value-function', label: '价值函数', articleId: null, articleTitle: null },
  { source: 'concept:expectation-variance', target: 'concept:confidence-interval', label: '置信区间', articleId: statisticsArticleId, articleTitle: statisticsTitle },
];

test('probability bindings and cross-domain reading routes preserve editorial maturity', () => {
  const articles = JSON.parse(readFileSync('content/articles.json', 'utf8')).articles;
  const matches = articles.filter((article: { id: string }) => article.id === probabilityArticleId);
  expect(matches).toHaveLength(1);
  expect(matches[0].title).toBe(probabilityTitle);
  expect(matches[0].knowledgeUnit.reviewStatus).toBe('needs-independent-review');
  for (const id of new Set(probabilityBridges.map(bridge => bridge.source))) {
    const nodes = graph.nodes.filter(node => node.id === id);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].articleBindings).toEqual([{ articleId: probabilityArticleId, coverage: 'explanation' }]);
    expect(nodes[0].contentStatus).toBe('outline');
    expect(nodes[0].evidenceStatus).toBe('not-reviewed');
    expect(matches[0].knowledgeUnit.conceptIds).toContain(id);
  }
  for (const bridge of probabilityBridges) {
    expect(Boolean(bridge.articleId)).toBe(Boolean(bridge.articleTitle));
    const nodes = graph.nodes.filter(node => node.id === bridge.target);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].articleBindings).toEqual(bridge.articleId ? [{ articleId: bridge.articleId, coverage: 'explanation' }] : []);
    expect(nodes[0].embeddedArticleId).toBeUndefined();
    expect(nodes[0].contentStatus).toBe('outline');
    expect(nodes[0].evidenceStatus).toBe('not-reviewed');
    expect(matches[0].knowledgeUnit.conceptIds).not.toContain(bridge.target);
    const edges = graph.edges.filter(edge => edge.source === bridge.source && edge.target === bridge.target && edge.type === 'recommended_before');
    expect(edges).toHaveLength(1);
    expect(edges[0].assertionStatus).toBe('editorial');
  }
});

test('statistical bridge binds exactly its two canonical concepts without promoting review', () => {
  const articles = JSON.parse(readFileSync('content/articles.json', 'utf8')).articles;
  const matches = articles.filter((article: { id: string }) => article.id === statisticsArticleId);
  expect(matches).toHaveLength(1);
  const unit = matches[0].knowledgeUnit;
  expect(matches[0].title).toBe(statisticsTitle);
  expect(unit.reviewStatus).toBe('needs-independent-review');
  expect([...unit.conceptIds].sort()).toEqual(['concept:confidence-interval', 'concept:statistical-inference']);
  expect(unit.placements).toEqual([{ hubId: 'hub:llm', path: 'rankings/methodology' }]);
  for (const id of unit.conceptIds) {
    const node = graph.nodes.find(node => node.id === id)!;
    expect(node.articleBindings).toEqual([{ articleId: statisticsArticleId, coverage: 'explanation' }]);
    expect(node.contentStatus).toBe('outline');
    expect(node.evidenceStatus).toBe('not-reviewed');
  }
  for (const [source, target] of [['concept:expectation-variance', 'concept:statistical-inference'], ['concept:statistical-inference', 'concept:confidence-interval']]) {
    const edges = graph.edges.filter(edge => edge.source === source && edge.target === target && edge.type === 'recommended_before');
    expect(edges).toHaveLength(1);
    expect(edges[0].assertionStatus).toBe('editorial');
    expect(edges[0].reason!.length).toBeGreaterThan(15);
  }
});

test('data split bridge owns only two explanations and preserves contamination as a reference', () => {
  const articles = JSON.parse(readFileSync('content/articles.json', 'utf8')).articles;
  const matches = articles.filter((article: { id: string }) => article.id === dataSplitArticleId);
  expect(matches).toHaveLength(1);
  const unit = matches[0].knowledgeUnit;
  expect(matches[0].title).toBe(dataSplitTitle);
  expect(unit.reviewStatus).toBe('needs-independent-review');
  expect([...unit.conceptIds].sort()).toEqual(['concept:data-leakage', 'concept:train-validation-test']);
  expect(unit.placements).toEqual([{ hubId: 'hub:llm', path: 'training/samples' }]);
  for (const id of unit.conceptIds) {
    const node = graph.nodes.find(node => node.id === id)!;
    expect(node.articleBindings).toEqual([{ articleId: dataSplitArticleId, coverage: 'explanation' }]);
    expect(node.contentStatus).toBe('outline');
    expect(node.evidenceStatus).toBe('not-reviewed');
  }
  const branch = graph.nodes.find(node => node.id === 'branch:llm:training/samples')!;
  expect(branch.embeddedArticleId).toBe(dataSplitArticleId);
  expect(branch.conceptRefs).toContain('concept:data-contamination');
  expect(branch.conceptRefs).toContain('concept:data-leakage');
  expect(graph.nodes.find(node => node.id === 'concept:data-contamination')!.articleBindings.some(ref => ref.articleId === dataSplitArticleId)).toBe(false);
  const teaching = graph.edges.filter(edge => edge.source === 'concept:train-validation-test' && edge.target === 'concept:data-leakage' && edge.type === 'recommended_before');
  expect(teaching).toHaveLength(1);
  expect(teaching[0].assertionStatus).toBe('editorial');
  expect(graph.edges.some(edge => edge.source === branch.id && edge.target === 'concept:data-leakage' && edge.type === 'references')).toBe(true);
});

test('classification metrics adds one navigation leaf and only two concept explanations', () => {
  const articles = JSON.parse(readFileSync('content/articles.json', 'utf8')).articles;
  const matches = articles.filter((article: { id: string }) => article.id === metricsArticleId);
  expect(matches).toHaveLength(1);
  const unit = matches[0].knowledgeUnit;
  expect(matches[0].title).toBe(metricsTitle);
  expect(unit.reviewStatus).toBe('needs-independent-review');
  expect([...unit.conceptIds].sort()).toEqual(['concept:accuracy-f1', 'concept:precision-recall']);
  expect(unit.placements).toEqual([{ hubId: 'hub:llm', path: 'rankings/metrics' }]);
  for (const id of unit.conceptIds) {
    const nodes = graph.nodes.filter(node => node.id === id);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe('concept');
    expect(nodes[0].articleBindings).toEqual([{ articleId: metricsArticleId, coverage: 'explanation' }]);
    expect(nodes[0].contentStatus).toBe('outline');
    expect(nodes[0].evidenceStatus).toBe('not-reviewed');
  }
  expect(graph.nodes.filter(node => node.kind === 'concept' && node.articleBindings.some(ref => ref.articleId === metricsArticleId)).map(node => node.id).sort()).toEqual([...unit.conceptIds].sort());
  const branches = graph.nodes.filter(node => node.id === 'branch:llm:rankings/metrics');
  expect(branches).toHaveLength(1);
  expect(branches[0].kind).toBe('branch');
  expect(branches[0].parentId).toBe('branch:llm:rankings');
  expect(branches[0].embeddedArticleId).toBe(metricsArticleId);
  expect([...branches[0].conceptRefs!].sort()).toEqual([...unit.conceptIds].sort());
  expect(inventory.originalScope.addedNodeIds).toContain(branches[0].id);
  expect(inventory.originalScope.originalModelNodeIds).not.toContain(branches[0].id);
  const refs = graph.edges.filter(edge => edge.source === branches[0].id && edge.type === 'references');
  expect(refs.map(edge => edge.target).sort()).toEqual([...unit.conceptIds].sort());
  for (const [source, target] of [['concept:bayes-rule', 'concept:precision-recall'], ['concept:precision-recall', 'concept:accuracy-f1']]) {
    const edges = graph.edges.filter(edge => edge.source === source && edge.target === target && edge.type === 'recommended_before');
    expect(edges).toHaveLength(1);
    expect(edges[0].assertionStatus).toBe('editorial');
  }
  for (const id of ['concept:calibration', 'concept:ranking-metrics']) {
    expect(unit.conceptIds).not.toContain(id);
    expect(graph.nodes.find(node => node.id === id)!.articleBindings.some(ref => ref.articleId === metricsArticleId)).toBe(false);
  }
});

test('supervised Bayes leaf preserves the AI overview parent and owns exactly two explanations', () => {
  const articles = JSON.parse(readFileSync('content/articles.json', 'utf8')).articles;
  const matches = articles.filter((article: { id: string }) => article.id === naiveBayesArticleId);
  expect(matches).toHaveLength(1);
  const unit = matches[0].knowledgeUnit;
  expect(matches[0].title).toBe(naiveBayesTitle);
  expect(unit.reviewStatus).toBe('needs-independent-review');
  expect([...unit.conceptIds].sort()).toEqual(['concept:naive-bayes', 'concept:supervised-learning']);
  expect(unit.placements).toEqual([{ hubId: 'hub:ai-overview', path: 'orientation/naive-bayes' }]);
  expect(graph.nodes.filter(node => node.kind === 'concept' && node.articleBindings.some(ref => ref.articleId === naiveBayesArticleId)).map(node => node.id).sort()).toEqual([...unit.conceptIds].sort());
  for (const id of unit.conceptIds) {
    const node = graph.nodes.find(node => node.id === id)!;
    expect(node.articleBindings).toEqual([{ articleId: naiveBayesArticleId, coverage: 'explanation' }]);
    expect(node.contentStatus).toBe('outline');
    expect(node.evidenceStatus).toBe('not-reviewed');
  }
  const parent = graph.nodes.find(node => node.id === 'branch:ai-overview:orientation')!;
  expect(parent.label).toBe('基础与认识');
  expect(parent.parentId).toBe('hub:ai-overview');
  expect(parent.articleBindings).toEqual([{ articleId: 'overview', coverage: 'overview' }]);
  expect(parent.resourceRefs).toEqual([{ articleId: 'overview', role: 'existing-orientation' }]);
  expect(parent.embeddedArticleId).toBeUndefined();
  const branch = graph.nodes.find(node => node.id === 'branch:ai-overview:orientation/naive-bayes')!;
  expect(branch.kind).toBe('branch');
  expect(branch.parentId).toBe(parent.id);
  expect(branch.embeddedArticleId).toBe(naiveBayesArticleId);
  expect([...branch.conceptRefs!].sort()).toEqual([...unit.conceptIds].sort());
  expect(inventory.originalScope.addedNodeIds).toContain(branch.id);
  for (const source of ['concept:bayes-rule', 'concept:supervised-learning']) {
    const edges = graph.edges.filter(edge => edge.source === source && edge.target === 'concept:naive-bayes' && edge.type === 'recommended_before');
    expect(edges).toHaveLength(1);
    expect(edges[0].assertionStatus).toBe('editorial');
  }
});

test('content inventory distinguishes full network candidates from default map admission', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
  await expect(page.locator('.kg-node')).toHaveCount(inventory.summary.networkCandidateNodes);
  await expect(page.locator('.kg-node:visible')).toHaveCount(inventory.summary.defaultVisibleNodes);
  expect(inventory.summary.modelNodes).toBe(graph.nodes.length);
  expect(inventory.nodes.filter((node: { id: string }) => node.id === 'root:ai')).toHaveLength(1);
});

const units = [
  { article: naiveBayesArticleId, concept: 'concept:supervised-learning', branch: 'branch:ai-overview:orientation/naive-bayes' },
  { article: naiveBayesArticleId, concept: 'concept:naive-bayes', branch: 'branch:ai-overview:orientation/naive-bayes' },
  { article: metricsArticleId, concept: 'concept:accuracy-f1', branch: 'branch:llm:rankings/metrics' },
  { article: metricsArticleId, concept: 'concept:precision-recall', branch: 'branch:llm:rankings/metrics' },
  { article: dataSplitArticleId, concept: 'concept:train-validation-test', branch: 'branch:llm:training/samples' },
  { article: dataSplitArticleId, concept: 'concept:data-leakage', branch: 'branch:llm:training/samples' },
  { article: statisticsArticleId, concept: 'concept:statistical-inference', branch: 'branch:llm:rankings/methodology' },
  { article: statisticsArticleId, concept: 'concept:confidence-interval', branch: 'branch:llm:rankings/methodology' },
  { article: 'llm-derivatives', concept: 'concept:derivative', branch: 'branch:llm:math/derivatives' },
  { article: 'llm-tensor-shapes', concept: 'concept:matrix-multiplication', branch: 'branch:llm:math/tensor-shapes' },
  { article: 'llm-conditional-probability', concept: 'concept:conditional-probability', branch: 'branch:llm:math/probability' },
  { article: 'llm-conditional-probability', concept: 'concept:bayes-rule', branch: 'branch:llm:math/probability' },
  { article: 'llm-conditional-probability', concept: 'concept:expectation-variance', branch: 'branch:llm:math/probability' },
  { article: 'llm-entropy-cross-entropy', concept: 'concept:cross-entropy', branch: 'branch:llm:math/objectives' },
];

for (const width of [390, 1440]) for (const unit of units) {
  test(`foundation batch keeps canonical reading and return / ${unit.concept} / ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/?view=garden&scope=root:ai&node=${unit.concept}&display=graph`);
    await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
    await expect(page.locator('.kg-node')).toHaveCount(networkNodeCount);
    await expect(page.locator('.og-coverage-note')).toContainText('不代表内容已经核验完成');
    await page.locator('.og-read-button').click();
    const article = page.locator(`[data-document="${unit.article}"]`);
    await expect(article.locator('.markdown-body')).toBeVisible();
    await expect(article.locator('.ws-evidence')).toContainText('程序验证不等于专家复核');
    if (unit.article === probabilityArticleId) {
      await expect(article.locator('h1')).toHaveText(probabilityTitle);
      await expect(article.locator('.markdown-body h2').filter({ hasText: '贝叶斯规则' })).toBeVisible();
      await expect(article.locator('.markdown-body h2').filter({ hasText: '期望与方差' })).toBeVisible();
      await expect(article.locator('.markdown-body')).toContainText('needs-independent-review');
      await expect(page.locator('[data-document]')).toHaveCount(1);
    }
    if (unit.article === statisticsArticleId) {
      await expect(article.locator('h1')).toHaveText(statisticsTitle);
      await expect(article.locator('.markdown-body')).toContainText('0.9405196171');
      await expect(article.locator('.markdown-body')).toContainText('needs-independent-review');
    }
    if (unit.article === dataSplitArticleId) {
      await expect(article.locator('h1')).toHaveText(dataSplitTitle);
      await expect(article.locator('.markdown-body')).toContainText('固定归纳式评估协议');
      await expect(article.locator('.markdown-body')).toContainText('needs-independent-review');
    }
    if (unit.article === metricsArticleId) {
      await expect(article.locator('h1')).toHaveText(metricsTitle);
      await expect(article.locator('.markdown-body')).toContainText('macro_f1_strict');
      await expect(article.locator('.markdown-body')).toContainText('needs-independent-review');
    }
    if (unit.article === naiveBayesArticleId) {
      await expect(article.locator('h1')).toHaveText(naiveBayesTitle);
      await expect(article.locator('.markdown-body')).toContainText('320/401');
      await expect(article.locator('.markdown-body')).toContainText('needs-independent-review');
    }
    await expect(article.locator('.katex-error')).toHaveCount(0);
    expect(await article.locator('.markdown-body a[href^="https://"]').count()).toBeGreaterThanOrEqual(2);
    expect(await article.locator('.markdown-body a[href^="?view=garden"]').count()).toBeGreaterThanOrEqual(2);
    await expect(page.getByRole('tab')).toHaveCount(0);
    await page.getByRole('button', { name: '返回知识地图', exact: true }).click();
    await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
    await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', unit.concept);
    await page.goto(`/?view=garden&scope=${unit.branch}`);
    await expect(article.locator('.markdown-body')).toBeVisible();
    await page.reload();
    await expect(article.locator('.markdown-body')).toBeVisible();
    expect(await page.locator('.ws-scroll').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
    if (unit.article === 'llm-derivatives') {
      await article.locator('.md-diagram').scrollIntoViewIfNeeded();
      await expect(article.locator('.md-diagram')).toHaveAttribute('data-status', 'ready');
      await expect(article.locator('.md-mermaid svg')).toBeVisible();
      await expect(article.locator('.md-mermaid-error')).toHaveCount(0);
      await page.screenshot({ path: testInfo.outputPath(`derivatives-${width}.png`) });
    }
    expect(errors).toEqual([]);
    if (unit.article === 'llm-tensor-shapes') await page.screenshot({ path: `test-results/content-batch-${width}.png` });
  });
}

for (const width of [390, 1440]) {
  test(`probability onward links distinguish real teaching units from remaining outlines / ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.setViewportSize({ width, height: 900 });
    const article = page.locator(`[data-document="${probabilityArticleId}"]`);
    for (const bridge of probabilityBridges) {
      await page.goto(`/?view=article&article=${probabilityArticleId}`);
      await expect(article.locator('.markdown-body')).toBeVisible();
      const link = article.locator(`.markdown-body a[href="?view=garden&scope=${bridge.target}"]`);
      await expect(link).toHaveText(bridge.label);
      await link.click();
      const destination = page.locator(`[data-folder="${bridge.target}"]`);
      await expect(destination.locator('h1')).toHaveText(bridge.label);
      expect(new URL(page.url()).searchParams.get('scope')).toBe(bridge.target);
      if (bridge.articleId) {
        await expect(destination.locator('.ws-empty')).toHaveCount(0);
        await destination.getByRole('button', { name: bridge.articleTitle!, exact: true }).click();
        const nextArticle = page.locator(`[data-document="${bridge.articleId}"]`);
        await expect(nextArticle.locator('h1')).toHaveText(bridge.articleTitle!);
        await expect(nextArticle.locator('.markdown-body')).toBeVisible();
        await page.reload();
        await expect(nextArticle.locator('h1')).toHaveText(bridge.articleTitle!);
        await page.goBack();
        await expect(destination.locator('h1')).toHaveText(bridge.label);
        await page.goForward();
        await expect(nextArticle.locator('h1')).toHaveText(bridge.articleTitle!);
        await page.goBack();
        await page.goBack();
      } else {
        await expect(destination.locator('.ws-empty')).toContainText('独立内容尚待完善');
        await expect(page.locator('[data-document], .markdown-body')).toHaveCount(0);
        await page.reload();
        await expect(destination.locator('.ws-empty')).toContainText('不会把同一篇总览冒充所有子章节');
        await page.goBack();
      }
      await expect(article.locator('h1')).toHaveText(probabilityTitle);
      await expect(page.locator('[data-document]')).toHaveCount(1);

      // The graph also exposes a real canonical outline, not a borrowed
      // independent explanation or a claim that the next subject is reviewed.
      await page.goto(`/?view=garden&scope=root:ai&node=${bridge.target}&display=graph`);
      await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
      await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', bridge.target);
      await expect(page.locator('.og-inspector h2')).toHaveText(bridge.label);
      await expect(page.locator('.og-note-badges')).toContainText(bridge.articleId ? '有独立讲解资料' : '知识提纲');
      if (bridge.articleId) {
        await expect(page.locator('.og-coverage-note')).toContainText('不代表内容已经核验完成');
        await page.locator('.og-read-button').click();
        await expect(page.locator(`[data-document="${bridge.articleId}"] h1`)).toHaveText(bridge.articleTitle!);
        await page.getByRole('button', { name: '返回知识地图', exact: true }).click();
        await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', bridge.target);
      } else {
        await expect(page.locator('.og-coverage-note')).toContainText('尚无直接绑定的独立讲解');
        await expect(page.locator('.og-read-button')).toHaveCount(0);
      }
      await expect(page.getByRole('tab')).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
}

for (const width of [390, 1440]) test(`statistical and data-split readers connect through canonical routes / ${width}px`, async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`/?view=article&article=${statisticsArticleId}`);
  const statistics = page.locator(`[data-document="${statisticsArticleId}"]`);
  await expect(statistics.locator('h1')).toHaveText(statisticsTitle);
  await statistics.locator('.markdown-body a[href="?view=garden&scope=concept:train-validation-test"]').click();
  const folder = page.locator('[data-folder="concept:train-validation-test"]');
  await expect(folder.locator('.ws-empty')).toHaveCount(0);
  await folder.getByRole('button', { name: dataSplitTitle, exact: true }).click();
  const dataSplit = page.locator(`[data-document="${dataSplitArticleId}"]`);
  await expect(dataSplit.locator('.markdown-body')).toBeVisible();
  await page.reload();
  await expect(dataSplit.locator('h1')).toHaveText(dataSplitTitle);
  await page.goBack();
  await expect(folder).toBeVisible();
  await page.goBack();
  await expect(statistics.locator('h1')).toHaveText(statisticsTitle);
  await page.goForward();
  await folder.getByRole('button', { name: dataSplitTitle, exact: true }).click();
  await dataSplit.locator('.markdown-body a[href="?view=garden&scope=branch:llm:rankings/methodology"]').first().click();
  await expect(statistics.locator('h1')).toHaveText(statisticsTitle);
  await page.goBack();
  await expect(dataSplit.locator('h1')).toHaveText(dataSplitTitle);
  await expect(page.locator('[data-document]')).toHaveCount(1);
  await expect(dataSplit.locator('.ws-evidence')).toContainText('程序验证不等于专家复核');
  await expect(page.getByRole('tab')).toHaveCount(0);
  expect(errors).toEqual([]);
});

for (const width of [390, 1440]) test(`classification metrics reuses probability, statistics and split readers / ${width}px`, async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.setViewportSize({ width, height: 900 });
  const metrics = page.locator(`[data-document="${metricsArticleId}"]`);
  for (const target of [
    { node: 'concept:bayes-rule', article: probabilityArticleId, title: probabilityTitle },
    { node: 'concept:confidence-interval', article: statisticsArticleId, title: statisticsTitle },
    { node: 'concept:train-validation-test', article: dataSplitArticleId, title: dataSplitTitle },
  ]) {
    await page.goto(`/?view=article&article=${metricsArticleId}`);
    await expect(metrics.locator('.markdown-body')).toBeVisible();
    await metrics.locator(`.markdown-body a[href="?view=garden&scope=${target.node}"]`).first().click();
    const folder = page.locator(`[data-folder="${target.node}"]`);
    await expect(folder.locator('.ws-empty')).toHaveCount(0);
    await folder.getByRole('button', { name: target.title, exact: true }).click();
    await expect(page.locator(`[data-document="${target.article}"] h1`)).toHaveText(target.title);
    await page.reload();
    await expect(page.locator(`[data-document="${target.article}"] .markdown-body`)).toBeVisible();
    await page.goBack();
    await expect(folder).toBeVisible();
    await page.goBack();
    await expect(metrics.locator('h1')).toHaveText(metricsTitle);
    await expect(page.locator('[data-document]')).toHaveCount(1);
  }
  expect(errors).toEqual([]);
});

for (const width of [390, 1440]) test(`AI overview keeps its folder and reuses classifier backlinks / ${width}px`, async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/?view=garden&scope=branch:ai-overview:orientation');
  const parent = page.locator('[data-folder="branch:ai-overview:orientation"]');
  await expect(parent.locator('h1')).toHaveText('基础与认识');
  await expect(page.locator('[data-document]')).toHaveCount(0);
  expect(await parent.locator('.ws-folder-rows button').count()).toBeGreaterThanOrEqual(2);
  await parent.locator('[data-folder-entry]').filter({ hasText: '朴素贝叶斯' }).click();
  const naiveBayes = page.locator(`[data-document="${naiveBayesArticleId}"]`);
  await expect(naiveBayes.locator('h1')).toHaveText(naiveBayesTitle);
  await page.goBack();
  await expect(parent.locator('h1')).toHaveText('基础与认识');
  for (const source of [
    { article: dataSplitArticleId, title: dataSplitTitle },
    { article: metricsArticleId, title: metricsTitle },
  ]) {
    await page.goto(`/?view=article&article=${source.article}`);
    const article = page.locator(`[data-document="${source.article}"]`);
    await article.locator('.markdown-body a[href="?view=garden&scope=branch:ai-overview:orientation/naive-bayes"]').click();
    await expect(naiveBayes.locator('.markdown-body')).toBeVisible();
    await page.reload();
    await expect(naiveBayes.locator('h1')).toHaveText(naiveBayesTitle);
    await page.goBack();
    await expect(article.locator('h1')).toHaveText(source.title);
    await page.goForward();
    await expect(naiveBayes.locator('h1')).toHaveText(naiveBayesTitle);
  }
  await naiveBayes.locator('.markdown-body a[href="?view=garden&scope=branch:llm:training/samples"]').first().click();
  await expect(page.locator(`[data-document="${dataSplitArticleId}"] h1`)).toHaveText(dataSplitTitle);
  await page.goBack();
  await expect(naiveBayes.locator('h1')).toHaveText(naiveBayesTitle);
  await expect(page.locator('[data-document]')).toHaveCount(1);
  await expect(page.getByRole('tab')).toHaveCount(0);
  expect(errors).toEqual([]);
});
