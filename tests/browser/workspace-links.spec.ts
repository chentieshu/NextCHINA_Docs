import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const independentIds: string[] = JSON.parse(readFileSync('content/articles.json', 'utf8')).articles
  .filter((article: {knowledgeUnit?: unknown}) => article.knowledgeUnit)
  .map((article: {id: string}) => article.id);
for (const id of independentIds) {
  test(`knowledge introduction uses real CommonMark emphasis: ${id}`, async ({page}) => {
    await page.goto(`/?view=article&article=${id}`);
    const intro=page.locator('.markdown-body blockquote').first();
    await expect(intro.locator('strong').first()).toHaveText('本页解决的问题');
    await expect(intro).not.toContainText('**本页');
  });
}
test('local fragment navigation keeps one reader without document tabs',async({page})=>{
  await page.goto('/?view=article&article=llm-tokenization');
  await expect(page.locator('.markdown-body')).toBeVisible();
  const target=await page.locator('.markdown-body h2[id]').last().getAttribute('id');
  await page.evaluate(id=>{const link=document.createElement('a');link.href='#'+encodeURIComponent(id!);link.textContent='阅读来源段落';link.id='workspace-fragment-test';document.querySelector('.ws-document-heading')!.append(link);},target);
  await page.locator('#workspace-fragment-test').click();
  await expect.poll(()=>page.locator('.ws-scroll').evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
  await expect(page.getByRole('tab')).toHaveCount(0);
  await expect(page.locator('.ws-scroll [data-document="llm-tokenization"]')).toHaveCount(1);
  await expect(page.locator('.ws-reading-header,.ws-tab-header')).toHaveCount(0);
  await expect.poll(()=>decodeURIComponent(new URL(page.url()).hash.slice(1))).toBe(target);
});
