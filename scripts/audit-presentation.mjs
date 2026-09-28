import assert from 'node:assert/strict';
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const walk = folder => readdirSync(folder,{withFileTypes:true}).flatMap(entry => {
  if (entry.name === 'generated') return [];
  const file=path.join(folder,entry.name);
  return entry.isDirectory()?walk(file):[file];
});
const css=walk(path.join(root,'src')).filter(file=>file.endsWith('.css'));
const literal = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi;
const records = css.map(file=>{
  const source=readFileSync(file,'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/url\([^)]*\)/g,'');
  return {
    file:path.relative(root,file),
    lines:readFileSync(file,'utf8').split('\n').length-1,
    colorLiterals:(source.match(literal)??[]).length,
    customPropertyDefinitions:(source.match(/--[\w-]+\s*:/g)??[]).length,
    mediaQueries:(source.match(/@media\b/g)??[]).length,
    containerQueries:(source.match(/@container\b/g)??[]).length,
    pixelFontDeclarations:(source.match(/font-size\s*:\s*[\d.]+px/g)??[]).length,
  };
});
const registry=JSON.parse(readFileSync(path.join(root,'content/articles.json'),'utf8'));
const spaces=JSON.parse(readFileSync(path.join(root,'content/spaces.json'),'utf8'));
const docs=registry.articles.map(a=>readFileSync(path.join(root,a.file),'utf8'));
const source=readFileSync(path.join(root,'src/styles/workspace.css'),'utf8');
const report={
  schemaVersion:1, scope:'authored CSS excluding generated/vendor files; regex inventory, not CSS coverage',
  stylesheets:records.length, files:records,
  paletteOwners:records.filter(f=>f.colorLiterals>0).map(f=>f.file),
  cssColorLiterals:records.reduce((n,f)=>n+f.colorLiterals,0),
  mediaQueries:records.reduce((n,f)=>n+f.mediaQueries,0),
  containerQueries:records.reduce((n,f)=>n+f.containerQueries,0),
  pixelFontDeclarations:records.reduce((n,f)=>n+f.pixelFontDeclarations,0),
  publishedDocuments:new Set(spaces.spaces.flatMap(s=>s.chapterIds)).size,
  markdownArticles:registry.articles.length,
  generatedDocuments:new Set(spaces.spaces.flatMap(s=>s.chapterIds)).size-registry.articles.length,
  mermaidFencesInArticles:docs.reduce((n,t)=>n+(t.match(/^```mermaid\s*$/gm)??[]).length,0),
  broadWorkspaceButtonSelector:/\.workspace\s+button(?:\s*[:{])/.test(source),
  runtimeVerification:'Separate Playwright tests; counts alone do not prove visual/accessibility compliance',
};
if(process.argv.includes('--check')){
  assert.deepEqual(report.paletteOwners,['src/styles/theme.css'],'Palette literals must have one owner');
  assert.equal(records.find(f=>f.file==='src/styles/workspace.css')?.pixelFontDeclarations,0,'Workspace text must support font scaling');
  assert.equal(report.broadWorkspaceButtonSelector,false,'Shell button rules must not override Markdown/graph controls');
}
mkdirSync(path.join(root,'test-results'),{recursive:true});
writeFileSync(path.join(root,'test-results/presentation-inventory.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
