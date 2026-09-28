import { test, expect } from '@playwright/test';

for (const id of ['llm-tokenization','llm-softmax-temperature','llm-attention-calculation','llm-training-loop','llm-kv-cache']) {
  test(`knowledge introduction uses real CommonMark emphasis: ${id}`, async ({page}) => {
    await page.goto(`/?view=article&article=${id}`);
    const intro=page.locator('.markdown-body blockquote').first();
    await expect(intro.locator('strong').first()).toHaveText('本页解决的问题');
    await expect(intro).not.toContainText('**本页');
  });
}
test('local fragment navigation does not open a duplicate document tab',async({page})=>{
  await page.goto('/?view=article&article=llm-tokenization');
  await expect(page.locator('.markdown-body')).toBeVisible();
  const target=await page.locator('.markdown-body h2[id]').last().getAttribute('id');
  await page.evaluate(id=>{const link=document.createElement('a');link.href='#'+encodeURIComponent(id!);link.textContent='阅读来源段落';link.id='workspace-fragment-test';document.querySelector('.ws-document-heading')!.append(link);},target);
  await page.locator('#workspace-fragment-test').click();
  await expect.poll(()=>page.locator('.ws-scroll').evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
  await expect(page.getByRole('tab')).toHaveCount(1);
  await expect.poll(()=>decodeURIComponent(new URL(page.url()).hash.slice(1))).toBe(target);
});
