import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { graph } from '../../src/features/garden/data';
const networkNodeCount = graph.nodes.filter(node => !['root', 'group', 'path', 'document'].includes(node.kind)).length;
const inventory = JSON.parse(readFileSync('content/garden/content-inventory.json', 'utf8'));
const probabilityArticleId = 'llm-conditional-probability';
const statisticsArticleId = 'statistical-inference-confidence-interval';
const statisticsTitle = '测试集答对80%，能说明模型有多可靠？统计推断与置信区间';
const probabilityTitle = '概率基础：从贝叶斯更新到期望与序列概率';
const probabilityBridges = [
  { source: 'concept:bayes-rule', target: 'concept:naive-bayes', label: '朴素贝叶斯', articleId: null },
  { source: 'concept:expectation-variance', target: 'concept:value-function', label: '价值函数', articleId: null },
  { source: 'concept:expectation-variance', target: 'concept:confidence-interval', label: '置信区间', articleId: statisticsArticleId },
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

test('content inventory distinguishes full network candidates from default map admission', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
  await expect(page.locator('.kg-node')).toHaveCount(inventory.summary.networkCandidateNodes);
  await expect(page.locator('.kg-node:visible')).toHaveCount(inventory.summary.defaultVisibleNodes);
  expect(inventory.summary.modelNodes).toBe(graph.nodes.length);
  expect(inventory.nodes.filter((node: { id: string }) => node.id === 'root:ai')).toHaveLength(1);
});

const units = [
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
  test(`probability onward links distinguish real statistical reading from remaining outlines / ${width}px`, async ({ page }) => {
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
        await destination.getByRole('button', { name: statisticsTitle, exact: true }).click();
        const nextArticle = page.locator(`[data-document="${bridge.articleId}"]`);
        await expect(nextArticle.locator('h1')).toHaveText(statisticsTitle);
        await expect(nextArticle.locator('.markdown-body')).toBeVisible();
        await page.reload();
        await expect(nextArticle.locator('h1')).toHaveText(statisticsTitle);
        await page.goBack();
        await expect(destination.locator('h1')).toHaveText(bridge.label);
        await page.goForward();
        await expect(nextArticle.locator('h1')).toHaveText(statisticsTitle);
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
        await expect(page.locator(`[data-document="${bridge.articleId}"] h1`)).toHaveText(statisticsTitle);
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
