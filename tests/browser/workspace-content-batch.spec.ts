import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { graph } from '../../src/features/garden/data';
const networkNodeCount = graph.nodes.filter(node => !['root', 'group', 'path', 'document'].includes(node.kind)).length;
const inventory = JSON.parse(readFileSync('content/garden/content-inventory.json', 'utf8'));
const probabilityArticleId = 'llm-conditional-probability';
const statisticsArticleId = 'statistical-inference-confidence-interval';
const dataSplitArticleId = 'train-validation-test-data-leakage';
const metricsArticleId = 'classification-accuracy-precision-recall-f1';
const naiveBayesArticleId = 'supervised-learning-naive-bayes';
const trainingArticleId = 'llm-training-loop';
const trainingTitle = '一次训练更新：从目标、损失到参数变化';
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

test('training expansion adds only SGD and learning rate to the existing independent unit', () => {
  const articles = JSON.parse(readFileSync('content/articles.json', 'utf8')).articles;
  const matches = articles.filter((article: { id: string }) => article.id === trainingArticleId);
  expect(matches).toHaveLength(1);
  expect(matches[0].title).toBe(trainingTitle);
  const unit = matches[0].knowledgeUnit;
  expect(unit.exampleId).toBe('training');
  expect(unit.reviewStatus).toBe('needs-independent-review');
  expect(unit.conceptIds).toEqual(['concept:loss-objective', 'concept:backpropagation', 'concept:gradient', 'concept:sgd', 'concept:learning-rate']);
  expect(unit.placements).toEqual([{ hubId: 'hub:llm', path: 'training/loop' }]);
  expect(unit.relatedResourceIds).toEqual(['arena-text', 'aa-intelligence']);
  expect(graph.nodes.filter(node => node.kind === 'concept' && node.articleBindings.some(ref => ref.articleId === trainingArticleId)).map(node => node.id).sort()).toEqual([...unit.conceptIds].sort());
  for (const id of unit.conceptIds) {
    const nodes = graph.nodes.filter(node => node.id === id);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].articleBindings).toEqual([{ articleId: trainingArticleId, coverage: 'explanation' }]);
    expect(nodes[0].contentStatus).toBe('outline');
    expect(nodes[0].evidenceStatus).toBe('not-reviewed');
  }
  const branch = graph.nodes.find(node => node.id === 'branch:llm:training/loop')!;
  expect(branch.parentId).toBe('branch:llm:training');
  expect(branch.embeddedArticleId).toBe(trainingArticleId);
  expect(branch.conceptRefs).toEqual(['concept:backpropagation', 'concept:loss-objective', 'concept:sgd', 'concept:learning-rate']);
  expect(inventory.originalScope.originalModelNodeIds).toContain(branch.id);
  const refs = graph.edges.filter(edge => edge.source === branch.id && edge.type === 'references');
  expect(refs.map(edge => edge.target).sort()).toEqual([...branch.conceptRefs!].sort());
  const teaching = graph.edges.filter(edge => edge.source === 'concept:gradient' && edge.target === 'concept:sgd');
  expect(teaching).toHaveLength(1);
  expect(teaching[0].type).toBe('recommended_before');
  expect(teaching[0].assertionStatus).toBe('editorial');
  expect(teaching[0].reason).toContain('阅读顺序建议');
  expect(graph.nodes.some(node => node.id === 'concept:gradient-descent')).toBe(false);
  expect(inventory.summary.independentlyReviewedNodes).toBe(0);
});

const units = [
  { article: trainingArticleId, concept: 'concept:sgd', branch: 'branch:llm:training/loop' },
  { article: trainingArticleId, concept: 'concept:learning-rate', branch: 'branch:llm:training/loop' },
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
    if (unit.article === trainingArticleId) {
      await expect(article.locator('h1')).toHaveText(trainingTitle);
      await expect(article.locator('.markdown-body h2').filter({ hasText: 'SGD 的随机性来自哪一步' })).toBeVisible();
      await expect(article.locator('.markdown-body h2').filter({ hasText: '学习率为什么有范围' })).toBeVisible();
      await expect(article.locator('.markdown-body')).toContainText('0.693147 0.513015');
      await expect(article.locator('.md-codeblock pre')).toContainText('def probabilities(w):');
      await expect(article.locator('.md-codeblock pre')).toContainText('def quad_step(');
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
    if (unit.article === 'llm-tensor-shapes') await page.screenshot({ path: testInfo.outputPath(`content-batch-${width}.png`) });
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

for (const width of [390, 1440]) test(`training sampling and learning-rate sections preserve the old branch and history / ${width}px`, async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    // External requests are deliberately blocked below; report application errors.
    if (message.type() === 'error' && !/net::ERR_/.test(message.text())) errors.push(message.text());
  });
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/?view=garden&scope=branch:llm:training/loop');
  const article = page.locator(`[data-document="${trainingArticleId}"]`);
  await expect(article.locator('h1')).toHaveText(trainingTitle);
  await page.reload();
  await expect(article.locator('.markdown-body')).toBeVisible();
  // Embedded branch links canonicalize to the article and retain the old branch
  // in the return route, including after reload.
  const params = new URL(page.url()).searchParams;
  expect(params.get('view')).toBe('article');
  expect(params.get('article')).toBe(trainingArticleId);
  const returnParams = new URLSearchParams(params.get('return') ?? '');
  expect(returnParams.get('view')).toBe('garden');
  expect(returnParams.get('scope')).toBe('branch:llm:training/loop');
  expect(returnParams.get('display')).toBe('list');
  for (const heading of ['一个完整数值更新', 'SGD 的随机性来自哪一步', 'mini-batch 能减少什么', '学习率为什么有范围', '梯度裁剪的一个边界提醒']) {
    await expect(article.locator('.markdown-body h2').filter({ hasText: heading })).toBeVisible();
  }
  const formulas = await article.locator('.katex annotation').allTextContents();
  expect(formulas.some(tex => tex.includes('\\mathbb E_I[g_I(\\theta)]'))).toBe(true);
  expect(formulas.some(tex => tex.includes('\\operatorname{Var}(\\bar g)'))).toBe(true);
  expect(formulas.some(tex => tex.replaceAll('&', '').includes("e'=(1-\\eta)e"))).toBe(true);
  await expect(article.locator('.katex-error')).toHaveCount(0);
  const keyFormulaOverflow = await article.locator('.katex-display').evaluateAll(displays => displays.filter(display => {
    const tex = display.querySelector('annotation')?.textContent ?? '';
    return tex.includes('\\ell_i(\\theta)&=') || tex.includes("\\theta'&=") || tex.includes('P(I_t=i\\mid\\mathcal H_t)');
  }).map(display => display.scrollWidth - display.clientWidth));
  expect(keyFormulaOverflow).toHaveLength(3);
  for (const overflow of keyFormulaOverflow) expect(overflow).toBeLessThanOrEqual(1);
  await expect(article.locator('.md-codeblock')).toHaveCount(1);
  await expect(article.locator('.md-codeblock pre')).toContainText('assert updated == [0.1, -0.1]');
  await expect(article.locator('.md-codeblock pre')).toContainText('def quad_gradient(');
  await expect(article.locator('.md-table-region')).toHaveCount(5);
  await article.locator('.markdown-body h2').filter({ hasText: 'SGD 的随机性来自哪一步' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath(`training-sampling-${width}.png`) });
  await article.locator('.md-diagram').scrollIntoViewIfNeeded();
  await expect(article.locator('.md-diagram')).toHaveAttribute('data-status', 'ready');
  await expect(article.locator('.md-mermaid svg')).toBeVisible();
  await expect(article.locator('.md-mermaid-error')).toHaveCount(0);
  const overflow = await article.locator('.markdown-body').evaluate(body => {
    const frame = body.getBoundingClientRect();
    return [...body.querySelectorAll('.md-codeblock, .md-table-region, .katex-display, .md-diagram')].filter(element => {
      const rect = element.getBoundingClientRect();
      return rect.left < frame.left - 1 || rect.right > frame.right + 1;
    }).map(element => element.className);
  });
  expect(overflow).toEqual([]);
  expect(await page.locator('.ws-scroll').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  await article.locator('.markdown-body h2').filter({ hasText: '学习率为什么有范围' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath(`training-learning-rate-${width}.png`) });
  await article.locator('.markdown-body a[href="?view=garden&scope=branch:llm:math/probability"]').first().click();
  await expect(page.locator(`[data-document="${probabilityArticleId}"] h1`)).toHaveText(probabilityTitle);
  await page.goBack();
  await expect(article.locator('h1')).toHaveText(trainingTitle);
  await page.goForward();
  await expect(page.locator(`[data-document="${probabilityArticleId}"] h1`)).toHaveText(probabilityTitle);
  await page.goBack();
  await expect(article.locator('.markdown-body')).toBeVisible();
  await expect(page.locator('[data-document]')).toHaveCount(1);
  await expect(page.getByRole('tab')).toHaveCount(0);
  await expect(article.locator('.ws-evidence')).toContainText('程序验证不等于专家复核');
  expect(errors).toEqual([]);
});


// The nonnumeric pilot has its own reader contract. The numeric units and their
// math/code assertions above remain unchanged and never dispatch on absent code.
const aiBoundariesArticleId = 'ai-ml-dl-boundaries';
const aiBoundariesTitle = 'AI、机器学习与深度学习：规则、经验与多层表示';
const aiBoundariesBranch = 'branch:ai-overview:orientation/ai-ml-dl';
const aiBoundariesConcepts = ['concept:artificial-intelligence', 'concept:machine-learning', 'concept:deep-learning'];
const aiBoundariesSources = [
  'https://artint.info/3e/html/ArtInt3e.Ch1.S1.html',
  'https://www-formal.stanford.edu/jmc/whatisai/node1.html',
  'https://www-formal.stanford.edu/jmc/whatisai/node2.html',
  'https://artint.info/3e/html/ArtInt3e.Ch7.S1.html',
  'https://www.cs.toronto.edu/~hinton/absps/NatureDeepReview.pdf',
  'https://www.deeplearningbook.org/contents/intro.html',
];
const aiBoundaryCases = [
  'A：棋盘选步器', 'B：图像分类器乙', 'C：图像分类器丙',
  'D：同一张照片、同一个答案', 'E：冻结的特征提取器与新分类头', 'F：“两层网络”的说明书',
];

test('AI boundaries pilot owns three existing concepts and one sibling navigation leaf', () => {
  const articles = JSON.parse(readFileSync('content/articles.json', 'utf8')).articles;
  const matches = articles.filter((article: { id: string }) => article.id === aiBoundariesArticleId);
  expect(matches).toHaveLength(1);
  const unit = matches[0].knowledgeUnit;
  expect(matches[0].title).toBe(aiBoundariesTitle);
  expect(unit.exampleId).toBe(aiBoundariesArticleId);
  expect(unit.reviewStatus).toBe('needs-independent-review');
  expect(unit.conceptIds).toEqual(aiBoundariesConcepts);
  expect(unit.placements).toEqual([{ hubId: 'hub:ai-overview', path: 'orientation/ai-ml-dl' }]);
  expect(unit.sourceUrls).toEqual(aiBoundariesSources);
  expect(unit.relatedResourceIds).toEqual([]);
  expect(Object.keys(unit).sort()).toEqual(['kind', 'reviewStatus', 'exampleId', 'conceptIds', 'placements', 'sourceUrls', 'relatedResourceIds'].sort());
  expect(graph.nodes.filter(node => node.kind === 'concept' && node.articleBindings.some(ref => ref.articleId === aiBoundariesArticleId)).map(node => node.id).sort()).toEqual([...aiBoundariesConcepts].sort());
  for (const id of aiBoundariesConcepts) {
    const nodes = graph.nodes.filter(node => node.id === id);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe('concept');
    expect(nodes[0].parentId).toBe('topic:landscape');
    expect(nodes[0].articleBindings).toEqual([{ articleId: aiBoundariesArticleId, coverage: 'explanation' }]);
    expect(nodes[0].embeddedArticleId).toBeUndefined();
    expect(nodes[0].contentStatus).toBe('outline');
    expect(nodes[0].evidenceStatus).toBe('not-reviewed');
    expect(inventory.originalScope.originalModelNodeIds).toContain(id);
  }
  const parent = graph.nodes.find(node => node.id === 'branch:ai-overview:orientation')!;
  expect(parent.label).toBe('基础与认识');
  expect(parent.articleBindings).toEqual([{ articleId: 'overview', coverage: 'overview' }]);
  expect(parent.resourceRefs).toEqual([{ articleId: 'overview', role: 'existing-orientation' }]);
  expect(parent.embeddedArticleId).toBeUndefined();
  const branch = graph.nodes.find(node => node.id === aiBoundariesBranch)!;
  expect(branch.kind).toBe('branch');
  expect(branch.label).toBe('AI、机器学习与深度学习的边界');
  expect(branch.parentId).toBe(parent.id);
  expect(branch.embeddedArticleId).toBe(aiBoundariesArticleId);
  expect(branch.conceptRefs).toEqual(aiBoundariesConcepts);
  expect(inventory.originalScope.addedNodeIds).toContain(branch.id);
  const refs = graph.edges.filter(edge => edge.source === branch.id && edge.type === 'references');
  expect(refs.map(edge => edge.target).sort()).toEqual([...aiBoundariesConcepts].sort());
  const incidentEdges = graph.edges.filter(edge => edge.source === branch.id || edge.target === branch.id);
  expect(incidentEdges).toHaveLength(4);
  expect(incidentEdges.filter(edge => edge.type === 'browse_child').map(edge => [edge.source, edge.target])).toEqual([[parent.id, branch.id]]);
  expect(graph.nodes.find(node => node.id === 'branch:ai-overview:orientation/naive-bayes')!.embeddedArticleId).toBe(naiveBayesArticleId);
  expect(inventory.originalScope.originalModelNodeIds).toHaveLength(603);
  expect(inventory.originalScope.missingOriginalNodeIds).toEqual([]);
  expect(inventory.summary.independentlyReviewedNodes).toBe(0);
});

async function checkAiBoundaryReader(page: Page) {
  const article = page.locator(`[data-document="${aiBoundariesArticleId}"]`);
  await expect(article.locator('h1')).toHaveText(aiBoundariesTitle);
  await expect(article.locator('.markdown-body')).toBeVisible();
  await expect(article.locator('.markdown-body blockquote').first().locator('strong').first()).toHaveText('本页解决的问题');
  await expect(article.locator('.ws-evidence')).toContainText('包含来源、教学假设、示例与限制');
  await expect(article.locator('.ws-evidence')).toContainText('程序验证不等于专家复核');
  await expect(article.locator('.ws-evidence')).not.toContainText('可运行');
  await expect(article.locator('.ws-evidence')).not.toContainText('数值');
  await expect(article.locator('.markdown-body')).toContainText('A–F 全部是明确虚构的教学档案，不是实测系统，也不是六次实验。');
  for (const name of aiBoundaryCases) await expect(article.getByRole('heading', { name, exact: true })).toBeVisible();
  const paragraphs = article.locator('.markdown-body p');
  await expect(paragraphs.filter({ hasText: '对 ML 或 DL 的方法归类' })).toContainText('证据不足');
  await expect(paragraphs.filter({ hasText: '目前对 ML 与 DL 的判断都证据不足' })).toContainText('不能凭一个未定义的层数给出肯定或否定结论');
  await expect(paragraphs.filter({ hasText: '第一问的答案是' })).toContainText('证据不足');
  await expect(paragraphs.filter({ hasText: '这里的正确作答依赖限定前提' })).toContainText('不能替代对来源与推论的实质核查');
  for (const url of aiBoundariesSources) {
    const links = article.locator(`.markdown-body a[href="${url}"]`);
    expect(await links.count()).toBeGreaterThan(0);
    await expect(links.first()).toBeVisible();
    expect((await links.first().textContent())?.trim().length).toBeGreaterThan(0);
  }
  await expect(article.locator('.md-codeblock, pre, .katex-error, .md-mermaid-error')).toHaveCount(0);
  await expect(page.locator('[data-document]')).toHaveCount(1);
  await expect(page.getByRole('tab')).toHaveCount(0);
  expect(await page.locator('.ws-scroll').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  expect(await article.locator('.markdown-body').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  return article;
}

for (const width of [390, 1440]) for (const concept of aiBoundariesConcepts) {
  test(`AI boundaries canonical route preserves evidence and history / ${concept} / ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && !/net::ERR_/.test(message.text())) errors.push(message.text()); });
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/?view=garden&scope=root:ai&node=${concept}&display=graph`);
    await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
    await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', concept);
    await expect(page.locator('.og-note-badges')).toContainText('有独立讲解资料');
    await expect(page.locator('.og-coverage-note')).toContainText('不代表内容已经核验完成');
    await page.locator('.og-read-button').click();
    await checkAiBoundaryReader(page);
    await page.reload();
    await checkAiBoundaryReader(page);
    await page.goBack();
    await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', concept);
    await page.goForward();
    await checkAiBoundaryReader(page);
    await page.screenshot({ path: testInfo.outputPath(`ai-boundaries-${concept.split(':')[1]}-${width}.png`) });
    await page.getByRole('button', { name: '返回知识地图', exact: true }).click();
    await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
    await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', concept);
    await expect(page.locator('[data-document]')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

for (const width of [390, 1440]) test(`AI boundaries direct and leaf readers preserve cases, sources and sibling guides / ${width}px`, async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !/net::ERR_/.test(message.text())) errors.push(message.text()); });
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`/?view=article&article=${aiBoundariesArticleId}`);
  const article = await checkAiBoundaryReader(page);
  await page.reload();
  await checkAiBoundaryReader(page);
  for (const [index, name] of aiBoundaryCases.entries()) {
    const heading = article.getByRole('heading', { name, exact: true });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeInViewport();
    if ([0, 3, 5].includes(index)) await page.screenshot({ path: testInfo.outputPath(`ai-boundaries-case-${'ABCDEF'[index]}-${width}.png`) });
  }
  const uncertainty = article.locator('.markdown-body p').filter({ hasText: '对 ML 或 DL 的方法归类' });
  await uncertainty.scrollIntoViewIfNeeded();
  await expect(uncertainty).toBeInViewport();
  const exercise = article.locator('.markdown-body p').filter({ hasText: '第一问的答案是' });
  await exercise.scrollIntoViewIfNeeded();
  await expect(exercise).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath(`ai-boundaries-exercise-${width}.png`) });
  await article.getByRole('heading', { name: '来源与版本', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath(`ai-boundaries-sources-${width}.png`) });
  for (const target of [
    { branch: 'branch:ai-overview:orientation/naive-bayes', article: naiveBayesArticleId, title: naiveBayesTitle },
    { branch: 'branch:llm:training/loop', article: trainingArticleId, title: trainingTitle },
  ]) {
    await article.locator(`.markdown-body a[href="?view=garden&scope=${target.branch}"]`).first().click();
    await expect(page.locator(`[data-document="${target.article}"] h1`)).toHaveText(target.title);
    await page.reload();
    await expect(page.locator(`[data-document="${target.article}"] .md-codeblock`)).toHaveCount(1);
    await page.goBack();
    await checkAiBoundaryReader(page);
    await page.goForward();
    await expect(page.locator(`[data-document="${target.article}"] h1`)).toHaveText(target.title);
    await page.goBack();
    await checkAiBoundaryReader(page);
  }
  await page.goto(`/?view=garden&scope=${aiBoundariesBranch}`);
  await checkAiBoundaryReader(page);
  await page.reload();
  await checkAiBoundaryReader(page);
  const params = new URL(page.url()).searchParams;
  expect(params.get('view')).toBe('article');
  expect(params.get('article')).toBe(aiBoundariesArticleId);
  const returnParams = new URLSearchParams(params.get('return') ?? '');
  expect(returnParams.get('scope')).toBe(aiBoundariesBranch);
  expect(returnParams.get('display')).toBe('list');

  await page.goto('/?view=garden&scope=branch:ai-overview:orientation');
  const parent = page.locator('[data-folder="branch:ai-overview:orientation"]');
  await expect(parent.locator('h1')).toHaveText('基础与认识');
  await expect(page.locator('[data-document]')).toHaveCount(0);
  await expect(parent.locator('.ws-folder-rows button')).toHaveCount(7);
  await parent.locator(`[data-folder-entry="${aiBoundariesBranch}"]`).click();
  await checkAiBoundaryReader(page);
  await page.goBack();
  await expect(parent).toBeVisible();
  await parent.locator('[data-folder-entry]').filter({ hasText: '朴素贝叶斯' }).click();
  await expect(page.locator(`[data-document="${naiveBayesArticleId}"] h1`)).toHaveText(naiveBayesTitle);
  await expect(page.locator(`[data-document="${naiveBayesArticleId}"] .md-codeblock pre`)).toContainText('def predict(');
  await page.goBack();
  await parent.locator('[data-folder-entry="file:branch:ai-overview:orientation:overview"]').click();
  const overview = page.locator('[data-document="overview"]');
  await expect(overview.locator('.markdown-body h2').filter({ hasText: '模型、SaaS 与 Agent 是三件不同的事' })).toBeVisible();
  await page.reload();
  await expect(overview.locator('.markdown-body')).toBeVisible();
  await expect(page.locator('[data-document]')).toHaveCount(1);
  await page.goBack();
  await expect(parent).toBeVisible();
  await page.goForward();
  await expect(overview.locator('.markdown-body')).toBeVisible();
  expect(errors).toEqual([]);
});

// The second nonnumeric family has its own fixture/stage/reading assertions.
// It does not weaken the numeric readers or inherit the first pilot's answer key.
const learningSignalsId = 'unsupervised-self-supervised-learning';
const learningSignalsTitle = '没有人工标签，也有训练目标吗？无监督与自监督的信号从哪里来';
const learningSignalsBranch = 'branch:ai-overview:orientation/learning-signals';
const learningSignalsConcepts = ['concept:unsupervised-learning', 'concept:self-supervised-learning'];
const learningSignalsSources = [
  'https://artint.info/3e/html/ArtInt3e.Ch7.S2.html',
  'https://artint.info/3e/html/ArtInt3e.Ch10.S3.html',
  'https://arxiv.org/abs/1810.04805v2',
  'https://arxiv.org/html/1810.04805v2',
  'https://proceedings.mlr.press/v119/chen20j.html',
  'https://proceedings.mlr.press/v119/chen20j/chen20j.pdf',
  'https://developers.google.com/machine-learning/glossary#self-supervised-learning',
  'https://scikit-learn.org/1.9/common_pitfalls.html#data-leakage',
];
const learningSignalCases = ['A：后来观测到的答案也能监督拟合', 'B：没有任务类别，也能精确优化一个目标',
  'C：目标由原句提供，仍可能无法唯一猜中', 'D：同源配对不是语义真值',
  'E：冻结编码器，线性头仍在学习', 'F：无标签特征也受评价协议约束'];

test('learning signals owns exactly two original concepts and one sibling leaf without new semantic edges', () => {
  const articles = JSON.parse(readFileSync('content/articles.json', 'utf8')).articles;
  const matches = articles.filter((article: { id: string }) => article.id === learningSignalsId);
  expect(matches).toHaveLength(1);
  const unit = matches[0].knowledgeUnit;
  expect(matches[0].title).toBe(learningSignalsTitle);
  expect(unit.exampleId).toBe(learningSignalsId);
  expect(unit.conceptIds).toEqual(learningSignalsConcepts);
  expect(unit.placements).toEqual([{ hubId: 'hub:ai-overview', path: 'orientation/learning-signals' }]);
  expect(unit.reviewStatus).toBe('needs-independent-review');
  expect(unit.sourceUrls).toEqual(learningSignalsSources);
  expect(unit.relatedResourceIds).toEqual([]);
  expect(Object.keys(unit).sort()).toEqual(['kind', 'reviewStatus', 'exampleId', 'conceptIds', 'placements', 'sourceUrls', 'relatedResourceIds'].sort());
  expect(graph.nodes.filter(node => node.kind === 'concept' && node.articleBindings.some(ref => ref.articleId === learningSignalsId)).map(node => node.id).sort()).toEqual([...learningSignalsConcepts].sort());
  for (const id of learningSignalsConcepts) {
    const nodes = graph.nodes.filter(node => node.id === id);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe('concept');
    expect(nodes[0].parentId).toBe('topic:learning-paradigms');
    expect(nodes[0].articleBindings).toEqual([{ articleId: learningSignalsId, coverage: 'explanation' }]);
    expect(nodes[0].embeddedArticleId).toBeUndefined();
    expect(nodes[0].contentStatus).toBe('outline');
    expect(nodes[0].evidenceStatus).toBe('not-reviewed');
    expect(inventory.originalScope.originalModelNodeIds).toContain(id);
    expect(graph.edges.filter(edge => edge.source === id || edge.target === id).map(edge => edge.type).sort()).toEqual(['browse_child', 'references']);
  }
  const branch = graph.nodes.find(node => node.id === learningSignalsBranch)!;
  expect(branch.kind).toBe('branch');
  expect(branch.parentId).toBe('branch:ai-overview:orientation');
  expect(branch.embeddedArticleId).toBe(learningSignalsId);
  expect(branch.conceptRefs).toEqual(learningSignalsConcepts);
  expect(inventory.originalScope.addedNodeIds).toContain(branch.id);
  const incident = graph.edges.filter(edge => edge.source === branch.id || edge.target === branch.id);
  expect(incident).toHaveLength(3);
  expect(incident.filter(edge => edge.type === 'browse_child').map(edge => [edge.source, edge.target])).toEqual([['branch:ai-overview:orientation', branch.id]]);
  expect(incident.filter(edge => edge.type === 'references').map(edge => edge.target).sort()).toEqual([...learningSignalsConcepts].sort());
  expect(graph.nodes.find(node => node.id === 'branch:ai-overview:orientation')!.articleBindings).toEqual([{ articleId: 'overview', coverage: 'overview' }]);
  expect(graph.nodes.find(node => node.id === aiBoundariesBranch)!.embeddedArticleId).toBe(aiBoundariesArticleId);
  expect(graph.nodes.find(node => node.id === 'branch:ai-overview:orientation/naive-bayes')!.embeddedArticleId).toBe(naiveBayesArticleId);
  expect(inventory.originalScope.originalModelNodeIds).toHaveLength(603);
  expect(inventory.originalScope.missingOriginalNodeIds).toEqual([]);
  expect(inventory.summary.independentlyReviewedNodes).toBe(0);
});

async function checkLearningSignalsReader(page: Page) {
  const article = page.locator(`[data-document="${learningSignalsId}"]`);
  await expect(article.locator('h1')).toHaveText(learningSignalsTitle);
  const body = article.locator('.markdown-body');
  await expect(body).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(body.locator('blockquote').first().locator('strong').first()).toHaveText('本页解决的问题');
  await expect(article.locator('.ws-evidence')).toContainText('包含来源、教学假设、示例与限制');
  await expect(article.locator('.ws-evidence')).not.toContainText('可运行');
  await expect(body).toContainText('组成一个观察案例族，不是真实模型测评，也不是六次已执行实验');
  for (const name of learningSignalCases) await expect(article.getByRole('heading', { name, exact: true })).toBeVisible();
  await expect(body).toContainText('看不到 ID、原中间词、文件位置');
  await expect(body).toContainText('随机性不带来源信息');
  await expect(body).toContainText('不证明真实 SimCLR 必然丢失颜色');
  await expect(body).toContainText('测试文本是否影响过预训练仍是未知');
  await expect(body).toContainText('至少日志证实的那些测试文档已被使用');
  await expect(body).toContainText('传导式任务');
  await expect(body).toContainText('needs-independent-review');
  const tables = article.locator('.md-table-region');
  await expect(tables).toHaveCount(4);
  await expect(tables.nth(0).locator('th')).toHaveCount(6);
  await expect(tables.nth(1).locator('tbody tr')).toHaveCount(7);
  await expect(tables.nth(1)).toContainText('{A,B} 与 {C,D}');
  await expect(tables.nth(2).locator('tbody tr')).toHaveCount(2);
  await expect(tables.nth(2)).toContainText('包裹 [MASK] 送达');
  await expect(tables.nth(3).locator('tbody tr')).toHaveCount(4);
  for (const stage of ['U 上预训练', 'Ltrain 上拟合', 'Ldev 上选择', 'Ltest 上计分']) await expect(tables.nth(3)).toContainText(stage);
  const formulas = await body.locator('.katex annotation').allTextContents();
  for (const fragment of ['\\mu_S=', 'J=\\sum', '\\subseteq S', 'L(p)=', 'p(1-p)=']) expect(formulas.some(tex => tex.includes(fragment))).toBe(true);
  await expect(body.locator('.katex-display')).toHaveCount(4);
  await expect(body.locator('.md-codeblock, pre, .katex-error, .md-mermaid-error')).toHaveCount(0);
  const formulaOverflow = await body.locator('.katex-display').evaluateAll(displays => displays.map(display => display.scrollWidth - display.clientWidth));
  for (const overflow of formulaOverflow) expect(overflow).toBeLessThanOrEqual(1);
  const escapedFrames = await body.evaluate(element => {
    const frame = element.getBoundingClientRect();
    return [...element.querySelectorAll('.katex-display, .md-table-region')].filter(item => {
      const rect = item.getBoundingClientRect(); return rect.left < frame.left - 1 || rect.right > frame.right + 1;
    }).map(item => item.className);
  });
  expect(escapedFrames).toEqual([]);
  for (const url of learningSignalsSources) {
    const links = body.locator(`a[href="${url}"]`);
    expect(await links.count()).toBeGreaterThan(0);
    await expect(links.first()).toBeVisible();
    expect((await links.first().textContent())?.trim().length).toBeGreaterThan(0);
  }
  await expect(page.locator('[data-document]')).toHaveCount(1);
  await expect(page.getByRole('tab')).toHaveCount(0);
  expect(await page.locator('.ws-scroll').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  expect(await body.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  return article;
}

for (const width of [390, 1440]) for (const concept of learningSignalsConcepts) {
  test(`learning signals canonical route preserves fixtures and history / ${concept} / ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && !/net::ERR_/.test(message.text())) errors.push(message.text()); });
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/?view=garden&scope=root:ai&node=${concept}&display=graph`);
    await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
    await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', concept);
    await expect(page.locator('.og-note-badges')).toContainText('有独立讲解资料');
    await page.locator('.og-read-button').click();
    await checkLearningSignalsReader(page);
    await page.reload();
    await checkLearningSignalsReader(page);
    await page.goBack();
    await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', concept);
    await page.goForward();
    await checkLearningSignalsReader(page);
    await page.screenshot({ path: testInfo.outputPath(`learning-signals-${concept.split(':')[1]}-${width}.png`) });
    await page.getByRole('button', { name: '返回知识地图', exact: true }).click();
    await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
    await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', concept);
    await expect(page.locator('[data-document]')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

for (const width of [390, 1440]) test(`learning signals direct and leaf readers keep onward links, backlinks and all siblings / ${width}px`, async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !/net::ERR_/.test(message.text())) errors.push(message.text()); });
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`/?view=article&article=${learningSignalsId}`);
  const article = await checkLearningSignalsReader(page);
  await page.reload();
  await checkLearningSignalsReader(page);
  for (const [index, name] of learningSignalCases.entries()) {
    const heading = article.getByRole('heading', { name, exact: true });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath(`learning-signals-case-${'ABCDEF'[index]}-${width}.png`) });
  }
  for (const [index, table] of (await article.locator('.md-table-region').all()).entries()) {
    await table.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`learning-signals-table-${index}-${width}.png`) });
  }
  for (const [index, formula] of (await article.locator('.katex-display').all()).entries()) {
    await formula.scrollIntoViewIfNeeded();
    await expect(formula).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath(`learning-signals-math-${index}-${width}.png`) });
  }
  await article.getByRole('heading', { name: '参考解析：保留成立的部分，修改证据改变的部分', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath(`learning-signals-exercise-${width}.png`) });
  await article.getByRole('heading', { name: '来源、版本与验证边界', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath(`learning-signals-sources-${width}.png`) });
  for (const [branch, target] of [
    ['branch:ai-overview:orientation/naive-bayes', naiveBayesArticleId],
    ['branch:llm:training/loop', trainingArticleId],
    ['branch:llm:training/samples', dataSplitArticleId],
    [aiBoundariesBranch, aiBoundariesArticleId],
    ['branch:llm:math/objectives', 'llm-entropy-cross-entropy'],
  ]) {
    await article.locator(`.markdown-body a[href="?view=garden&scope=${branch}"]`).first().click();
    await expect(page.locator(`[data-document="${target}"] .markdown-body`)).toBeVisible();
    await page.reload();
    await expect(page.locator(`[data-document="${target}"] .markdown-body`)).toBeVisible();
    if (target !== aiBoundariesArticleId) await expect(page.locator(`[data-document="${target}"] .md-codeblock`)).toHaveCount(1);
    await page.goBack();
    await checkLearningSignalsReader(page);
    await page.goForward();
    await expect(page.locator(`[data-document="${target}"] .markdown-body`)).toBeVisible();
    await page.goBack();
    await checkLearningSignalsReader(page);
  }
  for (const concept of ['concept:clustering', 'concept:contrastive-learning']) {
    await article.locator(`.markdown-body a[href="?view=garden&scope=${concept}"]`).click();
    await expect(page.locator(`[data-folder="${concept}"]`)).toBeVisible();
    await expect(page.locator('[data-document]')).toHaveCount(0);
    await page.goBack();
    await checkLearningSignalsReader(page);
  }
  for (const source of [aiBoundariesArticleId, dataSplitArticleId]) {
    await page.goto(`/?view=article&article=${source}`);
    await page.locator(`[data-document="${source}"] .markdown-body a[href="?view=garden&scope=${learningSignalsBranch}"]`).click();
    await checkLearningSignalsReader(page);
    await page.goBack();
    await expect(page.locator(`[data-document="${source}"] .markdown-body`)).toBeVisible();
    await page.goForward();
    await checkLearningSignalsReader(page);
  }
  await page.goto(`/?view=garden&scope=${learningSignalsBranch}`);
  await checkLearningSignalsReader(page);
  await page.reload();
  await checkLearningSignalsReader(page);
  const params = new URL(page.url()).searchParams;
  expect(params.get('view')).toBe('article');
  expect(params.get('article')).toBe(learningSignalsId);
  const returnParams = new URLSearchParams(params.get('return') ?? '');
  expect(returnParams.get('scope')).toBe(learningSignalsBranch);
  expect(returnParams.get('display')).toBe('list');
  await page.goto('/?view=garden&scope=branch:ai-overview:orientation');
  const parent = page.locator('[data-folder="branch:ai-overview:orientation"]');
  await expect(parent.locator('h1')).toHaveText('基础与认识');
  await expect(parent.locator('.ws-folder-rows button')).toHaveCount(7);
  for (const [entry, target] of [
    [learningSignalsBranch, learningSignalsId], [aiBoundariesBranch, aiBoundariesArticleId],
    ['branch:ai-overview:orientation/naive-bayes', naiveBayesArticleId],
    ['file:branch:ai-overview:orientation:overview', 'overview'],
  ]) {
    await parent.locator(`[data-folder-entry="${entry}"]`).click();
    await expect(page.locator(`[data-document="${target}"] .markdown-body`)).toBeVisible();
    await page.reload();
    await expect(page.locator(`[data-document="${target}"] .markdown-body`)).toBeVisible();
    await page.goBack();
    await expect(parent).toBeVisible();
    await page.goForward();
    await expect(page.locator(`[data-document="${target}"] .markdown-body`)).toBeVisible();
    await page.goBack();
    await expect(parent).toBeVisible();
  }
  expect(errors).toEqual([]);
});

const floatingPointId = 'floating-point-rounding';
const floatingPointConcept = 'concept:floating-point';
const floatingPointBranch = 'branch:llm:math/floating-point';
const floatingPointTitle = '浮点数与舍入：存下的数、算出的数与显示的数';
const floatingPointSources = [
  'https://docs.python.org/3.14/tutorial/floatingpoint.html',
  'https://docs.python.org/3.14/library/fractions.html',
  'https://docs.python.org/3.14/library/math.html',
  'https://docs.python.org/3.14/library/sys.html',
  'https://docs.python.org/3.12/library/functions.html#sum',
  'https://peps.python.org/pep-0485/',
  'https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html',
];
const floatingPointMarkdown = readFileSync('content/models/foundations/floating-point-rounding.md', 'utf8');
const floatingPointCode = [...floatingPointMarkdown.matchAll(/^```python\n(# nextchina-example: floating-point-rounding\n[\s\S]*?)^```/gm)].map(match => match[1]);

test('floating point binds only its canonical concept and one math leaf with a scoped reading edge', () => {
  const articles = JSON.parse(readFileSync('content/articles.json', 'utf8')).articles;
  const matches = articles.filter((article: { id: string }) => article.id === floatingPointId);
  expect(matches).toHaveLength(1);
  expect(matches[0].title).toBe(floatingPointTitle);
  expect(matches[0].category).toBe('foundations');
  const unit = matches[0].knowledgeUnit;
  expect(Object.keys(unit).sort()).toEqual(['kind', 'reviewStatus', 'exampleId', 'conceptIds', 'placements', 'sourceUrls', 'relatedResourceIds'].sort());
  expect(unit.kind).toBe('independent-explanation');
  expect(unit.reviewStatus).toBe('needs-independent-review');
  expect(unit.exampleId).toBe(floatingPointId);
  expect(unit.conceptIds).toEqual([floatingPointConcept]);
  expect(unit.placements).toEqual([{ hubId: 'hub:llm', path: 'math/floating-point' }]);
  expect(unit.sourceUrls).toEqual(floatingPointSources);
  expect(unit.relatedResourceIds).toEqual(['llm-softmax-temperature', 'llm-derivatives']);
  expect(floatingPointCode).toHaveLength(1);
  expect([...floatingPointMarkdown.matchAll(/^```python$/gm)]).toHaveLength(1);
  expect([...floatingPointMarkdown.matchAll(/nextchina-example:/g)]).toHaveLength(1);
  const canonical = graph.nodes.filter(node => node.id === floatingPointConcept);
  expect(canonical).toHaveLength(1);
  expect(canonical[0].kind).toBe('concept');
  expect(canonical[0].parentId).toBe('topic:optimization');
  expect(canonical[0].articleBindings).toEqual([{ articleId: floatingPointId, coverage: 'explanation' }]);
  expect(canonical[0].contentStatus).toBe('outline');
  expect(canonical[0].evidenceStatus).toBe('not-reviewed');
  expect(graph.nodes.filter(node => node.kind === 'concept' && node.articleBindings.some(ref => ref.articleId === floatingPointId)).map(node => node.id)).toEqual([floatingPointConcept]);
  const leaf = graph.nodes.find(node => node.id === floatingPointBranch)!;
  expect(leaf.parentId).toBe('branch:llm:math');
  expect(leaf.embeddedArticleId).toBe(floatingPointId);
  expect(leaf.conceptRefs).toEqual([floatingPointConcept]);
  const incident = graph.edges.filter(edge => edge.source === leaf.id || edge.target === leaf.id);
  expect(incident.map(edge => edge.type).sort()).toEqual(['browse_child', 'references']);
  expect(incident.find(edge => edge.type === 'references')?.target).toBe(floatingPointConcept);
  const teaching = graph.edges.filter(edge => edge.source === floatingPointConcept && edge.target === 'concept:numerical-stability');
  expect(teaching).toHaveLength(1);
  expect(teaching[0].type).toBe('recommended_before');
  expect(teaching[0].assertionStatus).toBe('editorial');
  expect(teaching[0].routeId).toBeUndefined();
  expect(teaching[0].reason).toContain('不是所有稳定算法的逻辑必要条件');
  expect(teaching[0].scope).toContain('教学阅读次序');
  expect(graph.nodes.find(node => node.id === 'branch:llm:math')!.embeddedArticleId).toBeUndefined();
  expect(graph.nodes.find(node => node.id === 'branch:llm:math/softmax')!.embeddedArticleId).toBe('llm-softmax-temperature');
  expect(graph.nodes.find(node => node.id === 'branch:llm:math/derivatives')!.embeddedArticleId).toBe('llm-derivatives');
  expect(inventory.originalScope.originalModelNodeIds).toContain(floatingPointConcept);
  expect(inventory.originalScope.originalModelNodeIds).toHaveLength(603);
  expect(inventory.originalScope.missingOriginalNodeIds).toEqual([]);
  expect(inventory.summary.independentlyReviewedNodes).toBe(0);
});

async function checkFloatingPointReader(page: Page) {
  const article = page.locator(`[data-document="${floatingPointId}"]`);
  await expect(article.locator('h1')).toHaveText(floatingPointTitle);
  const body = article.locator('.markdown-body');
  await expect(body).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  for (const heading of [
    '1. 同一个“0.1”，先分清四层',
    '3. 给 0.1 + 0.2 做一张精确账单',
    '3.1 输入已经发生了近似',
    '3.2 加法还会产生自己的一笔舍入',
    '3.3 与 float(0.3) 比较，是另一个问题',
    '3.4 显示可以换，已经存下的数没有换',
    '4. 顺序能改变结果，减法不一定是肇事者',
    '5. fsum 能改进哪一层？',
    '6. ULP、epsilon 和容差不是同一个量',
    '接近零时，先说清允许多大的绝对差',
    '7. 边界必须写进合同',
    '8. 可运行实验：审核存储值，不猜测原始意图',
    '来源、版本与核验范围',
  ]) await expect(body.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  for (const text of [
    '显示更多位没有创造更多计算精度', '不能把上方间距 2 误用到两侧',
    'Python 3.12 已更换浮点求和算法', '不是整个程序的误差保证',
    '极端边界仍会舍入', '不要据此推断所有极端输入的程序结果都与精确分数判据一致',
    '循环先溢出时整次拒绝', '不默默重排、不钳位到最大值',
    'CPython 3.12.14（Clang 22.1.3）与 CPython 3.13.5（GCC 14.2.0）',
    '阅读的 3.14 文档不等于实测了 3.14', '不是对整个解释器、数学库或硬件的 IEEE 符合性认证',
  ]) await expect(body).toContainText(text);
  await expect(article.locator('.ws-evidence')).toContainText('程序验证不等于专家复核');
  await expect(body.locator('.katex-error, .md-mermaid-error')).toHaveCount(0);
  const formulas = await body.locator('.katex annotation').allTextContents();
  for (const fragment of ['E_{\\mathrm{in}}=S-T', 'E_{\\mathrm{op}}=C-S', 'E_{\\mathrm{total}}=C-T', '180143985094819840', '36028797018963968', '22517998136852480', '|a-b|\\le\\max(rM,t)']) {
    expect(formulas.some(tex => tex.includes(fragment))).toBe(true);
  }
  await expect(body.locator('.md-codeblock')).toHaveCount(1);
  await expect(body.locator('pre code')).toHaveCount(1);
  expect((await body.locator('pre code').textContent())?.trimEnd()).toBe(floatingPointCode[0].trimEnd());
  for (const url of floatingPointSources) {
    const links = body.locator(`a[href="${url}"]`);
    expect(await links.count()).toBeGreaterThan(0);
    await expect(links.first()).toBeVisible();
    expect((await links.first().textContent())?.trim().length).toBeGreaterThan(0);
  }
  await expect(article.locator('[data-related-resource]')).toHaveCount(2);
  for (const id of ['llm-softmax-temperature', 'llm-derivatives']) await expect(article.locator(`[data-related-resource="${id}"]`)).toBeVisible();
  const geometry = await body.evaluate(element => {
    const frame = element.getBoundingClientRect();
    const round = (n: number) => Math.round(n * 100) / 100;
    return {
      body: { width: round(frame.width), overflow: element.scrollWidth - element.clientWidth },
      formulas: [...element.querySelectorAll<HTMLElement>('.katex-display')].map(display => {
        const rect = display.getBoundingClientRect();
        const ink = display.querySelector('.katex-html')!.getBoundingClientRect();
        return { tex: display.querySelector('annotation')!.textContent, width: round(rect.width), inkWidth: round(ink.width),
          overflow: display.scrollWidth - display.clientWidth,
          leftEscape: round(Math.max(0, frame.left - ink.left)), rightEscape: round(Math.max(0, ink.right - frame.right)) };
      }),
      escapedFrames: [...element.querySelectorAll('p, li, h2, h3, .md-codeblock, .katex-display')].filter(item => {
        const rect = item.getBoundingClientRect(); return rect.left < frame.left - 1 || rect.right > frame.right + 1;
      }).map(item => ({ tag: item.tagName, text: item.textContent?.slice(0, 100) })),
    };
  });
  expect(geometry.body.overflow).toBeLessThanOrEqual(1);
  expect(geometry.escapedFrames).toEqual([]);
  for (const formula of geometry.formulas) {
    expect(formula.overflow, formula.tex ?? '').toBeLessThanOrEqual(1);
    expect(formula.leftEscape, formula.tex ?? '').toBeLessThanOrEqual(1);
    expect(formula.rightEscape, formula.tex ?? '').toBeLessThanOrEqual(1);
  }
  expect(await page.locator('.ws-scroll').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  await expect(page.locator('[data-document]')).toHaveCount(1);
  await expect(page.getByRole('tab')).toHaveCount(0);
  return { article, geometry };
}

for (const width of [390, 1440]) test(`floating point canonical reading preserves exact accounting and map history / ${width}px`, async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !/net::ERR_/.test(message.text())) errors.push(message.text()); });
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`/?view=garden&scope=root:ai&node=${floatingPointConcept}&display=graph`);
  await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
  await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', floatingPointConcept);
  await expect(page.locator('.og-note-badges')).toContainText('有独立讲解资料');
  await page.locator('.og-read-button').click();
  const { geometry } = await checkFloatingPointReader(page);
  await testInfo.attach(`floating-point-geometry-${width}`, { body: JSON.stringify(geometry, null, 2), contentType: 'application/json' });
  await page.reload();
  await checkFloatingPointReader(page);
  await page.goBack();
  await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', floatingPointConcept);
  await page.goForward();
  await checkFloatingPointReader(page);
  await page.getByRole('button', { name: '返回知识地图', exact: true }).click();
  await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
  await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', floatingPointConcept);
  await expect(page.locator('[data-document]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

for (const width of [390, 1440]) test(`floating point direct and new-leaf readers retain sources, copy, onward resources and math siblings / ${width}px`, async ({ page, context }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !/net::ERR_/.test(message.text())) errors.push(message.text()); });
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`/?view=article&article=${floatingPointId}`);
  const { article, geometry } = await checkFloatingPointReader(page);
  await testInfo.attach(`floating-point-direct-geometry-${width}`, { body: JSON.stringify(geometry, null, 2), contentType: 'application/json' });
  await page.reload();
  await checkFloatingPointReader(page);
  await article.getByRole('button', { name: '复制代码', exact: true }).click();
  await expect(article.getByRole('button', { name: '复制代码', exact: true })).toContainText('已复制');
  expect((await page.evaluate(() => navigator.clipboard.readText())).trimEnd()).toBe(floatingPointCode[0].trimEnd());
  const wrap = article.getByRole('button', { name: '换行', exact: true });
  await wrap.click();
  await expect(article.locator('.md-codeblock')).toHaveAttribute('data-wrap', 'true');
  expect(await article.locator('pre').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  await wrap.click();
  await expect(article.locator('.md-codeblock')).toHaveAttribute('data-wrap', 'false');
  for (const [branch, target] of [
    ['branch:llm:math/softmax', 'llm-softmax-temperature'],
    ['branch:llm:math/derivatives', 'llm-derivatives'],
    ['branch:llm:math/tensor-shapes', 'llm-tensor-shapes'],
  ]) {
    await article.locator(`.markdown-body a[href="?view=garden&scope=${branch}"]`).click();
    await expect(page.locator(`[data-document="${target}"] .markdown-body`)).toBeVisible();
    await expect(page.locator(`[data-document="${target}"] .md-codeblock`)).toHaveCount(1);
    await page.reload();
    await expect(page.locator(`[data-document="${target}"] .markdown-body`)).toBeVisible();
    await page.goBack();
    await checkFloatingPointReader(page);
    await page.goForward();
    await expect(page.locator(`[data-document="${target}"] .markdown-body`)).toBeVisible();
    await page.goBack();
    await checkFloatingPointReader(page);
  }
  for (const target of ['llm-softmax-temperature', 'llm-derivatives']) {
    await article.locator(`[data-related-resource="${target}"]`).click();
    await expect(page.locator(`[data-document="${target}"] .markdown-body`)).toBeVisible();
    await page.goBack();
    await checkFloatingPointReader(page);
  }
  await page.goto(`/?view=garden&scope=${floatingPointBranch}`);
  await checkFloatingPointReader(page);
  await page.reload();
  await checkFloatingPointReader(page);
  await page.goto('/?view=garden&scope=branch:llm:math');
  const parent = page.locator('[data-folder="branch:llm:math"]');
  await expect(parent).toBeVisible();
  const entries = await parent.locator('[data-folder-entry]').evaluateAll(elements => elements.map(element => element.getAttribute('data-folder-entry')));
  const tensorIndex = entries.indexOf('branch:llm:math/tensor-shapes');
  expect(tensorIndex).toBeGreaterThanOrEqual(0);
  expect(entries.slice(tensorIndex, tensorIndex + 3)).toEqual(['branch:llm:math/tensor-shapes', floatingPointBranch, 'branch:llm:math/probability']);
  for (const [entry, target] of [[floatingPointBranch, floatingPointId], ['branch:llm:math/softmax', 'llm-softmax-temperature'], ['branch:llm:math/derivatives', 'llm-derivatives']]) {
    await parent.locator(`[data-folder-entry="${entry}"]`).click();
    await expect(page.locator(`[data-document="${target}"] .markdown-body`)).toBeVisible();
    await page.reload();
    await expect(page.locator(`[data-document="${target}"] .markdown-body`)).toBeVisible();
    await page.goBack();
    await expect(parent).toBeVisible();
    await page.goForward();
    await expect(page.locator(`[data-document="${target}"] .markdown-body`)).toBeVisible();
    await page.goBack();
    await expect(parent).toBeVisible();
  }
  expect(errors).toEqual([]);
});
