import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { graph } from '../../src/features/garden/data';
const networkNodeCount = graph.nodes.filter(node => !['root', 'group', 'path', 'document'].includes(node.kind)).length;
const inventory = JSON.parse(readFileSync('content/garden/content-inventory.json', 'utf8'));

test('content inventory distinguishes full network candidates from default map admission', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
  await expect(page.locator('.kg-node')).toHaveCount(inventory.summary.networkCandidateNodes);
  await expect(page.locator('.kg-node:visible')).toHaveCount(inventory.summary.defaultVisibleNodes);
  expect(inventory.summary.modelNodes).toBe(graph.nodes.length);
  expect(inventory.nodes.filter((node: { id: string }) => node.id === 'root:ai')).toHaveLength(1);
});

const units = [
  { article: 'llm-derivatives', concept: 'concept:derivative', branch: 'branch:llm:math/derivatives' },
  { article: 'llm-tensor-shapes', concept: 'concept:matrix-multiplication', branch: 'branch:llm:math/tensor-shapes' },
  { article: 'llm-conditional-probability', concept: 'concept:conditional-probability', branch: 'branch:llm:math/probability' },
  { article: 'llm-entropy-cross-entropy', concept: 'concept:cross-entropy', branch: 'branch:llm:math/objectives' },
];

for (const width of [390, 1440]) for (const unit of units) {
  test(`foundation batch keeps canonical reading and return / ${unit.article} / ${width}px`, async ({ page }, testInfo) => {
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
