import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { buildExplorer, graphProjection, globalKnowledgeProjection, documentRoute, folderRoute } from '../../src/features/workspace/model';
import { graph, byId } from '../../src/features/garden/data';
import { readRoute, routeUrl, safeGardenReturn } from '../../src/routing';
import type { DocChapter } from '../../src/types';
const registry = JSON.parse(readFileSync('content/articles.json','utf8')).articles;
// Node-side navigation checks need only public IDs; actual derived content is tested in the browser.
const publishedIds: string[] = JSON.parse(readFileSync('content/spaces.json','utf8')).spaces.flatMap((space: {chapterIds:string[]})=>space.chapterIds);
const chapters: DocChapter[] = publishedIds.map(id => {
  const article=registry.find((a: {id:string})=>a.id===id);
  return article ? {...article, content:readFileSync(article.file,'utf8'), slug:id, readTime:'5 分钟'} :
    {id,slug:id,title:'',subtitle:'',category:'research',categoryName:'',content:'',date:'',tags:[],excerpt:'',readTime:''};
});
const model = buildExplorer(chapters);
const articleURL = (id: string) => `/?view=article&article=${id}`;
const at = (id: string, graphView = false) => '/' + routeUrl(folderRoute(id, graphView));
async function bounds(page: Page) {
  const result = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth, viewport: innerWidth,
    height: document.documentElement.scrollHeight, viewHeight: innerHeight,
    scrollOverflow: (() => {const e=document.querySelector('.ws-scroll') as HTMLElement|null; return e ? e.scrollWidth-e.clientWidth : 0;})(),
    shadows: [...document.querySelectorAll('.workspace *')].filter(el => {const s=getComputedStyle(el); return s.boxShadow!=='none'||s.textShadow!=='none'||s.filter.includes('drop-shadow');}).length,
  }));
  expect(result.width).toBeLessThanOrEqual(result.viewport+1); expect(result.height).toBeLessThanOrEqual(result.viewHeight+1);
  expect(result.scrollOverflow).toBeLessThanOrEqual(1); expect(result.shadows).toBe(0);
  await expect(page.locator('select,details,summary')).toHaveCount(0);
  await expect(page.locator('.workspace')).toHaveCount(1);
  await expect(page.locator('.garden-root,.docs-sidebar')).toHaveCount(0);
}
async function searchDoc(page: Page, query: string) {
  if (!(await page.locator('.ws-sidebar').isVisible())) await page.getByRole('button',{name:'打开文档侧栏',exact:true}).click();
  await page.getByRole('button',{name:'全库搜索',exact:true}).click();
  await page.getByRole('searchbox',{name:'搜索全部文档',exact:true}).fill(query);
  await page.locator('.ws-search-results button').filter({hasText:query}).first().click();
}

test('one explorer covers every published document and preserves canonical ownership', () => {
  expect(model.documents.size).toBe(chapters.length);
  for (const chapter of chapters) expect(model.occurrences.get(chapter.id)?.length).toBeGreaterThan(0);
  expect(graph.nodes.filter(node => node.id==='concept:softmax')).toHaveLength(1);
  expect(model.entries.get('hub:llm')?.children.filter(id=>byId.get(id)?.kind==='branch')).toHaveLength(12);
  expect(model.occurrence('llm-tokenization')?.nodeId).toBe('branch:llm:math/tokenization');
  expect(model.occurrences.get('apple-style-premium-product-video')?.every(id=>!id.includes('llm:'))).toBe(true);
  for (const [id,entry] of model.entries) {
    expect(new Set(model.parents(id)).size).toBe(model.parents(id).length);
    if (entry.articleId) expect(model.documents.has(entry.articleId)).toBe(true);
  }
  const globalKnowledge=globalKnowledgeProjection();
  expect(globalKnowledge.nodes.some(node=>node.kind==='document')).toBe(false);
  expect(globalKnowledge.nodes.filter(node=>node.kind==='domain')).toHaveLength(graph.nodes.filter(node=>node.kind==='domain').length);
  expect(globalKnowledge.total).toBeGreaterThan(globalKnowledge.nodes.length);
  const softmaxFocus=globalKnowledgeProjection('concept:softmax');
  expect(softmaxFocus.nodes.some(node=>node.id==='concept:softmax')).toBe(true);
  expect(softmaxFocus.nodes.some(node=>node.id==='concept:self-attention')).toBe(true);
  const atlas=graphProjection('root:ai',model);
  expect(atlas.atlas).toBe(true);
  expect(atlas.layer).toBe('atlas');
  expect(atlas.nodes.filter(node=>node.kind==='document')).toHaveLength(0);
  expect(atlas.nodes.filter(node=>node.kind==='group')).toHaveLength(graph.groups.length);
  expect(atlas.nodes.filter(node=>node.kind==='domain')).toHaveLength(graph.nodes.filter(node=>node.kind==='domain').length);
  expect(atlas.nodes.filter(node=>node.kind==='hub')).toHaveLength(graph.nodes.filter(node=>node.kind==='hub').length);
  expect(atlas.edges.every(edge=>atlas.nodes.some(node=>node.id===edge.source)&&atlas.nodes.some(node=>node.id===edge.target))).toBe(true);
  const docs=graphProjection('root:ai',model,'documents');
  expect(docs.nodes.filter(node=>node.kind==='document')).toHaveLength(chapters.length);
  expect(docs.edges.every(edge=>docs.nodes.some(node=>node.id===edge.source)&&docs.nodes.some(node=>node.id===edge.target))).toBe(true);
  const paths=graphProjection('root:ai',model,'paths');
  expect(paths.nodes.filter(node=>node.kind==='path')).toHaveLength(graph.learningPaths.length);
  expect(paths.edges.every(edge=>edge.type==='recommended_before')).toBe(true);
  const local=graphProjection('branch:llm:math/tokenization',model);
  expect(local.layer).toBe('explore');
  expect(local.nodes.some(node=>node.id==='article:llm-tokenization'||node.articleBindings.some(binding=>binding.articleId==='llm-tokenization'))).toBe(true);
  expect(safeGardenReturn('https://evil.example')).toBeUndefined();
  expect(safeGardenReturn('?view=article&article=bad')).toBeUndefined();
  expect(readRoute(routeUrl(documentRoute('llm-tokenization','branch:llm:math/tokenization')))).toEqual(documentRoute('llm-tokenization','branch:llm:math/tokenization'));
});
for (const width of [320,390,768,1024,1280,1440,1920]) for (const theme of ['light','dark']) {
  test(`workspace responsive ${width}px ${theme}`, async ({page}) => {
    const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
    await page.setViewportSize({width,height:900});
    await page.addInitScript(value=>localStorage.setItem('nextchina-theme',value),theme);
    await page.goto(articleURL('llm-tokenization'));
    await expect(page.locator('[data-document="llm-tokenization"] .markdown-body')).toBeVisible();
    await bounds(page);
    if(width<960) {
      await page.getByRole('button',{name:'打开文档侧栏',exact:true}).click();
      await expect(page.getByRole('dialog',{name:'文档侧栏'})).toBeVisible();
      expect(await page.locator('.ws-main').evaluate(el=>el.hasAttribute('inert'))).toBe(true);
      if (width===390 && theme==='light') await page.screenshot({path:'test-results/workspace-mobile-explorer.png'});
      await page.keyboard.press('Tab');
      expect(await page.locator('.ws-sidebar').evaluate(el=>el.contains(document.activeElement))).toBe(true);
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button',{name:'打开文档侧栏',exact:true})).toBeFocused();
    } else await expect(page.getByRole('tree',{name:'全部文档目录'})).toBeVisible();
    await page.getByRole('button',{name:'显示关联资料',exact:true}).click();
    await expect(page.locator('.ws-related')).toBeVisible();
    await bounds(page);
    await page.getByRole('button',{name:'关闭关联资料'}).click();
    if ([390,1440].includes(width)) await page.screenshot({path:`test-results/workspace-${width}-${theme}.png`});
    expect(errors).toEqual([]);
  });
}

test('root immediately reads a document; search replaces the current document in the same shell', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('.ws-scroll .markdown-body')).toBeVisible();
  await expect(page.getByRole('button',{name:'进入文档',exact:true})).toHaveCount(0);
  const shell = await page.locator('.workspace').elementHandle();
  await searchDoc(page,'Token 与分词');
  await expect(page.locator('[data-document="llm-tokenization"]')).toBeVisible();
  await searchDoc(page,'KV Cache');
  await expect(page.locator('[data-document="llm-kv-cache"]')).toBeVisible();
  await searchDoc(page,'Token 与分词');
  await expect(page.locator('[data-document="llm-tokenization"]')).toBeVisible();
  expect(await page.getByRole('tab').count()).toBe(0);
  expect(await shell?.evaluate(el=>el.isConnected)).toBe(true);
  await page.goBack();
  await expect(page.locator('[data-document="llm-kv-cache"]')).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-document="llm-kv-cache"]')).toBeVisible();
});

test('tree keyboard, directory navigation, active file reveal and read scroll restoration', async ({page}) => {
  await page.goto(articleURL('llm-tokenization'));
  const active=page.locator('.ws-tree-row[aria-selected="true"]');
  await expect(active).toHaveAttribute('data-article-id','llm-tokenization');
  await active.focus(); await page.keyboard.press('ArrowLeft');
  await expect(page.locator('[data-entry-id="branch:llm:math/tokenization"]')).toBeFocused();
  await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
  const before=await page.locator('.ws-scroll').evaluate(el=>{el.scrollTop=480;return el.scrollTop});
  await searchDoc(page,'Softmax 与温度');
  await page.goBack();
  await expect(page.locator('[data-document="llm-tokenization"]')).toBeVisible();
  await expect.poll(()=>page.locator('.ws-scroll').evaluate(el=>el.scrollTop)).toBe(before);
  await page.getByRole('button',{name:'折叠所有目录'}).click();
  await page.getByRole('button',{name:'定位当前文档'}).click();
  await expect(page.locator('[data-article-id="llm-tokenization"]').first()).toBeVisible();
});

for(const article of chapters) {
  test(`every document remains directly accessible: ${article.id}`, async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await page.goto(articleURL(article.id));
    const title = page.locator(`[data-document="${article.id}"] h1`);
    await expect(title).toBeVisible();
    if (article.title) await expect(title).toHaveText(article.title); else await expect(title).not.toBeEmpty();
    await expect(page.locator('.markdown-body')).toBeVisible();
    await expect(page.locator('.katex-error')).toHaveCount(0);
    await bounds(page);
  });
}

test('old topic links open the same reader; rankings and pricing keep original caveats', async ({page}) => {
  for(const [branch,id] of [['rankings/text-preference','arena-text'],['rankings/composite','aa-intelligence'],['rankings/system-results','terminal-bench'],['pricing/offers','model-api-prices']]) {
    await page.goto(at(`branch:llm:${branch}`));
    await expect(page.locator(`[data-document="${id}"] table`).first()).toBeVisible();
    await expect(page.locator('.ws-evidence')).toContainText('未重新核验');
    if(id==='terminal-bench') await expect(page.locator('.ws-evidence')).toContainText('不是裸模型能力排名');
    await bounds(page);
  }
});

test('one global knowledge network is independent of the current document',async({page})=>{
  await page.goto(articleURL('llm-tokenization'));
  await page.getByRole('button',{name:'打开全局知识网络'}).click();
  await expect(page.locator('.garden-canvas')).toHaveAttribute('data-layout','ready');
  await expect(page.locator('.ws-sidebar')).toBeVisible();
  await page.screenshot({path:'test-results/workspace-graph.png'});
  await bounds(page);
  await expect(page.getByRole('searchbox',{name:'搜索知识网络'})).toBeVisible();
  await page.getByRole('searchbox',{name:'搜索知识网络'}).fill('Softmax');
  await page.getByRole('option',{name:/Softmax/}).first().click();
  await expect(page.getByRole('heading',{name:/Softmax/})).toBeVisible();
  expect(await page.getByRole('tab').count()).toBe(0);
  await page.getByRole('button',{name:'打开全局知识网络'}).click();
  await expect(page.locator('.garden-canvas')).toHaveAttribute('data-layout','ready');
  await page.reload();await expect(page.locator('.garden-canvas')).toHaveAttribute('data-layout','ready');
});

test('graph module failure leaves the explorer and reading available',async({page})=>{
  await page.route(/layout\.worker/,route=>route.abort());
  await page.goto(at('branch:llm:math/tokenization',true));
  await expect(page.getByRole('button',{name:'用列表继续阅读'})).toBeVisible();
  await page.getByRole('button',{name:'用列表继续阅读'}).click();
  await expect(page.locator('.ws-scroll .markdown-body')).toBeVisible();
});

test('restricted storage, invalid links, short landscape and enlarged text',async({page})=>{
  await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('blocked')};Storage.prototype.setItem=()=>{throw new Error('blocked')};});
  await page.setViewportSize({width:844,height:390});
  await page.goto('/?view=article&article=missing');
  await expect(page.getByRole('heading',{name:'未找到这份文档或目录'})).toBeVisible();
  await page.getByRole('button',{name:'打开阅读指南'}).click();
  await expect(page.locator('.markdown-body')).toBeVisible();
  await page.addStyleTag({content:'html{font-size:20px}'});await bounds(page);
  await searchDoc(page,'苹果风格');await expect(page.locator('[data-document="apple-style-premium-product-video"]')).toBeVisible();
  await bounds(page);
});

for (const width of [390, 1440]) test(`Markdown diagrams paint inside workspace scroll ${width}px`, async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.goto(articleURL('llm-attention-calculation'));
  await expect(page.locator('.ws-scroll .markdown-body')).toBeVisible();
  const diagrams=page.locator('.ws-scroll .md-diagram');
  expect(await diagrams.count()).toBeGreaterThan(0);
  for(let index=0;index<await diagrams.count();index++) {
    const diagram=diagrams.nth(index);await diagram.scrollIntoViewIfNeeded();
    await expect(diagram).toHaveAttribute('data-status','ready');
    await expect(diagram.locator('.md-mermaid > svg')).toBeVisible();
  }
  await bounds(page);
});
