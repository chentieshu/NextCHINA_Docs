import {test,expect} from '@playwright/test';

test('home topic link and header shortcut leave search results and open the hub',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('link',{name:'LLM 专题',exact:true}).click();
  await expect(page.locator('.hub-branch-card')).toHaveCount(12);
  await page.getByRole('searchbox',{name:'搜索整个知识花园'}).fill('self-attention');
  await expect(page.getByRole('region',{name:'花园搜索结果'})).toBeVisible();
  await page.getByRole('button',{name:'LLM 专题',exact:true}).click();
  await expect(page.getByRole('searchbox',{name:'搜索整个知识花园'})).toHaveValue('');
  await expect(page.locator('.hub-branch-card')).toHaveCount(12);
  await expect(page.getByRole('region',{name:'花园搜索结果'})).toHaveCount(0);
});
