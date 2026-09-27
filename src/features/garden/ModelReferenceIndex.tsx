import React, { useMemo, useState } from 'react';
import research from '../../data/research';

const sourceTargets:Record<string,string> = {
  'arena-text':'branch:llm:rankings/text-preference',
  'aa-intelligence':'branch:llm:rankings/composite',
};
/** References are not unified model identities. Never join fuzzy names or infer providers. */
export default function ModelReferenceIndex({ onOpen }: { onOpen: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const records = useMemo(() => research.benchmarks.filter(board => board.scope === 'model').flatMap(board => board.rows.map(row => ({
    key: `${board.id}:${row.id}`, name: row.name,
    provider: 'provider' in row && typeof row.provider === 'string' ? row.provider : '未记录',
    source: board.title, sourceId: board.id, snapshot: board.snapshotDate,
  }))), []);
  const visible = records.filter(row => `${row.name} ${row.provider}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <section className="hub-model-index" aria-label="模型来源索引"><h3>模型来源索引 <span>{records.length} 条记录</span></h3>
    <p className="hub-note">按现有模型评测记录逐条列出，不跨来源合并名称，不猜测版本、参数或报价映射。这里不是已核验的统一模型注册库，也未混入 Agent 系统记录。</p>
    <label className="hub-index-search">查找记录<input type="search" value={query} onChange={event => setQuery(event.target.value)} aria-label="查找模型来源记录" placeholder="模型名称或来源记录中的供应商" /></label>
    <div className="hub-record-scroll" tabIndex={0} role="region" aria-label="模型来源记录表"><table><thead><tr><th scope="col">来源中的名称</th><th scope="col">记录中的供应商</th><th scope="col">快照</th><th scope="col">证据入口</th></tr></thead><tbody>{visible.map(row => <tr key={row.key}><th scope="row">{row.name}</th><td>{row.provider}</td><td>{row.snapshot ?? '日期未记录'}</td><td>{sourceTargets[row.sourceId] ? <button onClick={() => onOpen(sourceTargets[row.sourceId])}>{row.sourceId === 'arena-text' ? 'Arena 记录' : 'AA 记录'}</button> : <span>{row.sourceId} · 专题入口待接入</span>}</td></tr>)}</tbody></table></div>
    {!visible.length && <p role="status">没有匹配记录。</p>}
  </section>;
}
