import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { byId, readingEntries, graph } from '../../src/features/garden/data';
import { resourceMeta } from '../../src/features/garden/hub-data';
import { readRoute, routeUrl } from '../../src/routing';

interface UnitArticle { id: string; title: string; file: string; knowledgeUnit?: { conceptIds: string[]; placements: { hubId: string; path: string }[]; relatedResourceIds: string[]; }; }
const articles = (JSON.parse(readFileSync('content/articles.json', 'utf8')).articles as UnitArticle[]).filter(article => article.knowledgeUnit);
const scopeFor = (article: UnitArticle) => `branch:${article.knowledgeUnit!.placements[0].hubId.slice(4)}:${article.knowledgeUnit!.placements[0].path}`;
const at = (scope: string) => `/?view=garden&scope=${encodeURIComponent(scope)}`;

test('independent knowledge units preserve canonical ownership and incomplete leaves', () => {
  expect(articles.length).toBeGreaterThan(0);
  expect(graph.stats.independentArticles).toBe(articles.length);
  expect(byId.get('hub:llm')?.articleBindings).toEqual([]);
  for (const article of articles) {
    expect(byId.get(scopeFor(article))?.embeddedArticleId).toBe(article.id);
    expect(resourceMeta(article.id)?.kind).toBe('independent-explanation');
    for (const id of article.knowledgeUnit!.conceptIds) {
      expect(readingEntries(id).some(ref => ref.articleId === article.id && ref.coverage === 'explanation')).toBe(true);
      expect(graph.nodes.filter(node => node.id === id)).toHaveLength(1);
    }
  }
  // A worked attention unit is not falsely copied onto every deeper question.
  expect(readingEntries('branch:llm:mechanisms/attention/qkv')).toEqual([]);
});

for (const [width, theme] of [[390, 'light'], [1440, 'dark']] as const) {
  for (const article of articles) {
    test(`knowledge ${article.id} ${width}px ${theme}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(value => localStorage.setItem('nextchina-theme', value), theme);
      await page.goto(at(scopeFor(article)));
      const reader = page.locator(`[data-resource-id="${article.id}"]`);
      await expect(reader).toHaveAttribute('data-resource-kind', 'explanation');
      await expect(reader.getByRole('heading', { name: article.title, exact: true })).toBeVisible();
      await expect(reader.locator('.md-codeblock')).toHaveCount(1);
      await expect(reader.locator('.katex-error')).toHaveCount(0);
      expect(await reader.locator('.katex-display').count()).toBeGreaterThan(0);
      await expect(reader.locator('.hub-evidence-note')).toContainText('程序验证不等于专家复核');
      const diagramCount = (readFileSync(article.file, 'utf8').match(/^```mermaid$/gm) ?? []).length;
      await expect(reader.locator('.md-diagram')).toHaveCount(diagramCount);
      for (let i = 0; i < diagramCount; i++) {
        const diagram = reader.locator('.md-diagram').nth(i);
        await diagram.scrollIntoViewIfNeeded();
        await expect(diagram).toHaveAttribute('data-status', 'ready');
        await expect(diagram.locator('.md-mermaid > svg')).toBeVisible();
      }
      const metrics = await page.evaluate(() => {
        const host = document.querySelector('.hub-content') as HTMLElement;
        return { page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          content: host.scrollWidth - host.clientWidth,
          height: document.documentElement.scrollHeight - innerHeight,
          shadows: [...document.querySelectorAll('.garden-root *')].filter(el => {
            const s = getComputedStyle(el); return s.boxShadow !== 'none' || s.textShadow !== 'none' || s.filter.includes('drop-shadow');
          }).length };
      });
      expect(metrics.page).toBeLessThanOrEqual(1);
      expect(metrics.content).toBeLessThanOrEqual(1);
      expect(metrics.height).toBeLessThanOrEqual(1);
      expect(metrics.shadows).toBe(0);
      const returnSearch = routeUrl(readRoute(new URL(page.url()).search));
      await reader.getByRole('button', { name: '在文档阅读器中打开', exact: true }).click();
      await expect(page.getByRole('heading', { level: 1, name: article.title, exact: true })).toBeVisible();
      await page.getByRole('button', { name: '返回知识花园', exact: true }).click();
      await expect.poll(() => new URL(page.url()).search).toBe(returnSearch);
      await expect(page.locator(`[data-resource-id="${article.id}"]`)).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
}

test('a mechanism links to canonical pricing without refreshing its evidence', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(at('branch:llm:inference/kv-cache'));
  await page.locator('[data-related-resource="model-api-prices"]').click();
  await expect(page.locator('[data-resource-id="model-api-prices"]')).toBeVisible();
  await expect(page.locator('.hub-evidence-note')).toContainText('未重新核验');
  await page.goBack();
  await expect(page.locator('[data-resource-id="llm-kv-cache"]')).toBeVisible();
});
