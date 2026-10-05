import React, { useMemo, useState } from 'react';
import { ArrowRight, ArrowLeftRight, ChevronDown, Search, Route, BookOpen } from 'lucide-react';
import { edgeLabel } from '../garden/domain';
import type { KnowledgeIndex, IndexedRelation, RelationRole } from './knowledgeIndex';

const names: Record<RelationRole, string> = { before: '建议先学', related: '延伸阅读', reference: '专题引用', semantic: '知识关系' };
export function KnowledgeConnection({ relation, index, onSelect }: { relation: IndexedRelation; index: KnowledgeIndex; onSelect: (id: string) => void }) {
  const { edge, role } = relation;
  return <article className="og-connection atlas-relation" data-relation-id={edge.id} data-role={role}>
    <div className="og-connection-pair"><button type="button" onClick={() => onSelect(edge.source)}>{index.byId.get(edge.source)?.label ?? edge.source}</button><span className="og-connection-verb">{role === 'related' ? <ArrowLeftRight /> : <ArrowRight />}<span>{role === 'before' ? '先了解 → 再学习' : role === 'reference' ? edgeLabel[edge.type] : role === 'semantic' ? edgeLabel[edge.type] : '延伸阅读'}</span></span><button type="button" onClick={() => onSelect(edge.target)}>{index.byId.get(edge.target)?.label ?? edge.target}</button></div>
    <p>{edge.reason || '原始数据尚未补充关系说明。'}</p><small>{names[role]} · {edge.assertionStatus === 'editorial' ? '编辑整理' : edge.assertionStatus}</small>
  </article>;
}
export default function LearningNavigator({ index, onSelect }: { index: KnowledgeIndex; onSelect: (id: string) => void }) {
  const [tab, setTab] = useState<'paths' | 'connections'>('paths');
  const [pathId, setPathId] = useState(index.graph.learningPaths[0]?.id ?? '');
  const [query, setQuery] = useState(''), [role, setRole] = useState<RelationRole | 'all'>('all'), [limit, setLimit] = useState(12);
  const rows = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return index.relations.filter(row => (role === 'all' || row.role === role) && terms.every(term => `${index.byId.get(row.edge.source)?.label} ${index.byId.get(row.edge.target)?.label} ${row.edge.reason ?? ''}`.toLocaleLowerCase().includes(term)));
  }, [index, query, role]);
  return <div className="og-learning-navigation">
    <p className="og-panel-intro">不知道从哪里开始？沿路线入门，再顺着概念之间的联系继续探索。</p>
    <div className="og-segments og-navigation-tabs" role="group" aria-label="学习导航视图"><button type="button" aria-pressed={tab === 'paths'} onClick={() => setTab('paths')}><Route />学习路线</button><button type="button" aria-pressed={tab === 'connections'} onClick={() => setTab('connections')}><ArrowLeftRight />概念联系</button></div>
    {tab === 'paths' ? <section aria-label="AI 学习路线"><p className="og-section-note">{index.graph.learningPaths.length} 条规划路线。步骤表示阅读建议，不等于先修条件；有资料不等于内容全部完成。</p>
      {index.graph.learningPaths.map(path => <section className="og-learning-path" key={path.id}>
        <button type="button" className="og-path-toggle" aria-expanded={pathId === path.id} aria-controls={`path-${path.id}`} onClick={() => setPathId(current => current === path.id ? '' : path.id)}><span><strong>{path.label}</strong><small>{path.steps.length} 个知识站点 · 规划路线</small></span><ChevronDown data-expanded={pathId === path.id} /></button>
        {pathId === path.id && <ol className="og-path-steps" id={`path-${path.id}`}>{path.steps.map((id, position) => { const node = index.byId.get(id), available = index.ownResources(id).length > 0; return <li key={`${position}:${id}`}><span className="og-step-number" aria-hidden="true">{String(position + 1).padStart(2,'0')}</span><button type="button" onClick={() => onSelect(id)}><strong>{node?.label ?? id}</strong><small>{available ? <><BookOpen />有直接资料</> : '知识提纲 · 待完善'}</small></button></li>; })}</ol>}
      </section>)}{!index.graph.learningPaths.length && <p className="og-section-note">学习路线尚未整理，可切换到概念联系继续探索。</p>}
    </section> : <section aria-label="概念联系浏览器">
      <label className="og-filter-search"><Search /><input type="search" aria-label="筛选概念联系" placeholder="例如：Attention、RAG、评测" value={query} onChange={e => { setQuery(e.target.value); setLimit(12); }} /></label>
      <div className="og-relation-filters" role="group" aria-label="联系类型">{(['all','before','semantic','reference','related'] as const).map(value => <button type="button" key={value} aria-pressed={role === value} onClick={() => { setRole(value); setLimit(12); }}>{value === 'all' ? '全部' : names[value]}</button>)}</div>
      <p className="og-section-note">{rows.length} 条联系 · 点击任一知识名称，在图中继续探索。</p>
      {rows.slice(0,limit).map(row => <KnowledgeConnection key={row.edge.id} index={index} relation={row} onSelect={onSelect} />)}
      {!rows.length && <div className="og-navigation-empty"><p>没有找到对应联系。</p><button type="button" onClick={() => { setQuery(''); setRole('all'); }}>清除条件</button></div>}
      {rows.length > limit && <button type="button" className="og-load-more" onClick={() => setLimit(value => value + 18)}>继续查看 · 还有 {rows.length - limit} 条</button>}
    </section>}
  </div>;
}
