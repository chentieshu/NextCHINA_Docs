import { test, expect, type Page } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const registry = JSON.parse(readFileSync('content/articles.json', 'utf8')) as { articles: { id: string; file: string }[] };
const counts = (source: string) => (source.match(/^(?:`{3,}|~{3,})mermaid\s*$/gm) ?? []).length;
const documents = registry.articles.map(article => ({ ...article, diagrams: counts(readFileSync(article.file, 'utf8')) })).filter(article => article.diagrams > 0);
const fixtureCount = counts(readFileSync('tests/browser/diagrams.md', 'utf8'));

async function renderEveryDiagram(page: Page, count: number) {
  await expect(page.locator('.md-diagram')).toHaveCount(count);
  for (let index = 0; index < count; index++) {
    const diagram = page.locator('.md-diagram').nth(index);
    await diagram.scrollIntoViewIfNeeded();
    await expect(diagram, `Diagram ${index + 1} must paint SVG, not just mount a React wrapper`).toHaveAttribute('data-status', 'ready');
    const drawing = diagram.locator('.md-mermaid > svg');
    await expect(drawing).toBeVisible();
    expect(await drawing.evaluate(node => {
      const svg = node as SVGSVGElement;
      return svg.viewBox.baseVal.width > 0 && svg.viewBox.baseVal.height > 0 && svg.getBoundingClientRect().height > 0;
    })).toBe(true);
  }
}
async function checkFlatLayout(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  const shadows = await page.locator('body *').evaluateAll(nodes => nodes.flatMap(node => {
    const style = getComputedStyle(node);
    return style.boxShadow !== 'none' || style.textShadow !== 'none' || style.filter.includes('drop-shadow') ? [node.tagName + '.' + node.getAttribute('class')] : [];
  }));
  expect(shadows).toEqual([]);
  await expect(page.locator('select, details, summary')).toHaveCount(0);
}

for (const theme of ['light', 'dark']) {
  for (const article of documents) {
    test(`${theme}: all diagrams in ${article.id}`, async ({ page }) => {
      await page.setViewportSize({ width: theme === 'light' ? 390 : 1440, height: 900 });
      await page.goto(`/tests/browser/fixture.html?file=${encodeURIComponent(article.file)}&theme=${theme}`);
      await page.addStyleTag({ content: 'html, body, #root { overflow-x: visible !important; }' });
      await renderEveryDiagram(page, article.diagrams);
      await checkFlatLayout(page);
    });
  }
}
for (const width of [320, 768, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`nine diagram types / ${width}px / ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/tests/browser/fixture.html?theme=${theme}`);
      await page.addStyleTag({ content: 'html, body, #root { overflow-x: visible !important; }' });
      await renderEveryDiagram(page, fixtureCount);
      await checkFlatLayout(page);
      const checkbox = page.locator('input[type="checkbox"]').first();
      expect(await checkbox.evaluate(node => getComputedStyle(node).appearance)).toBe('none');
      await expect(checkbox).toBeChecked();
      const first = page.locator('.md-diagram').first();
      await first.scrollIntoViewIfNeeded();
      await first.getByRole('button', { name: '查看源码' }).click();
      await expect(first.locator('.md-diagram-source pre')).toBeVisible();
      await first.getByRole('button', { name: '收起源码' }).click();
      await expect(first.locator('.md-diagram-source pre')).toBeHidden();
      await first.getByRole('button', { name: '适应宽度' }).click();
      await expect(first.getByRole('button', { name: '原始尺寸' })).toHaveAttribute('aria-pressed', 'true');
      await page.screenshot({ path: `test-results/diagrams-${width}-${theme}.png`, fullPage: false });
    });
  }
}

test('bad diagram recovers after source update; theme rerender remains usable', async ({ page }) => {
  await page.goto('/tests/browser/fixture.html?invalid=true');
  await expect(page.locator('.md-diagram')).toHaveAttribute('data-status', 'error');
  await expect(page.locator('.md-diagram-source pre')).toBeVisible();
  await expect(page.getByRole('button', { name: '重试绘图' })).toBeVisible();
  await page.getByRole('button', { name: '恢复有效图表' }).click();
  await renderEveryDiagram(page, fixtureCount);
  await page.getByRole('button', { name: '切换测试主题' }).click();
  await renderEveryDiagram(page, fixtureCount);
  await checkFlatLayout(page);
});

for (const width of [390, 1440]) {
  test(`unified workspace custom controls / ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    if (width < 960) await page.getByRole('button', { name: '打开文档侧栏', exact: true }).click();
    await page.getByRole('button', { name: '全库搜索', exact: true }).click();
    await page.getByRole('searchbox', { name: '搜索全部文档', exact: true }).fill('苹果风格');
    await page.locator('.ws-search-results button').first().click();
    await expect(page.getByRole('heading', { level: 1, name: '苹果风格高端产品视频制作框架' })).toBeVisible();
    await page.getByRole('button', { name: '切换为暗黑模式', exact: true }).and(page.locator(':visible')).click();
    await checkFlatLayout(page);
  });
}

test('no native disclosure/select elements or shadow utilities in application sources', () => {
  const scan = (folder: string) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) scan(file);
      else if (/\.[jt]sx?$/.test(file)) {
        const code = readFileSync(file, 'utf8');
        expect(code, file).not.toMatch(/<(?:select|details|summary)\b/);
        expect(code, file).not.toMatch(/\b(?:drop-shadow|shadow)-(?:sm|md|lg|xl|2xl|inner|\[)/);
      }
    }
  };
  scan('src');
});
