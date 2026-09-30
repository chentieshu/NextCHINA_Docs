import React from 'react';
import { RotateCcw, Maximize2 } from 'lucide-react';
import type { KnowledgeIndex } from './knowledgeIndex';
import type { NetworkSettings, NetworkStats } from './networkEngine.js';
import { DEFAULT_NETWORK_SETTINGS } from './networkPreferences.js';
import '../../styles/graphControls.css';

interface Props {
  index: KnowledgeIndex; settings: NetworkSettings; stats: NetworkStats; selectedId: string | null;
  onChange: (settings: NetworkSettings) => void; onFit: () => void;
}
export default function GraphSettings({ index, settings, stats, selectedId, onChange, onFit }: Props) {
  const change = <K extends keyof NetworkSettings>(key: K, value: NetworkSettings[K]) => onChange({ ...settings, [key]: value });
  const switches: { key: 'structure' | 'relations' | 'prerequisites' | 'references'; label: string; note: string; tone: string }[] = [
    { key: 'structure', label: '目录归属', note: '这个知识点属于哪个领域或专题。', tone: 'structure' },
    { key: 'relations', label: '概念联系', note: '可以放在一起理解，不代表因果。', tone: 'related' },
    { key: 'prerequisites', label: '建议先学', note: '原数据明确记录的先后建议。', tone: 'before' },
    { key: 'references', label: '专题引用', note: '不同专题复用同一个知识点。', tone: 'reference' }
  ];
  return <div className="og-settings-content">
    <p className="og-panel-intro">只调整你看到的图，不改变知识内容。设置会保存在当前浏览器。</p>
    <div className="og-preset-row" role="group" aria-label="常用图谱视图">
      <button type="button" aria-pressed={settings.detail === 'all' && !settings.onlyResources && settings.groups === null && !settings.focusNeighbors} onClick={() => onChange({ ...settings, detail: 'all', onlyResources: false, groups: null, focusNeighbors: false })}>全部知识</button>
      <button type="button" aria-pressed={settings.detail === 'overview' && !settings.onlyResources && settings.groups === null && !settings.focusNeighbors} onClick={() => onChange({ ...settings, detail: 'overview', onlyResources: false, groups: null, focusNeighbors: false })}>领域与专题</button>
      <button type="button" aria-pressed={settings.detail === 'all' && settings.onlyResources && settings.groups === null && !settings.focusNeighbors} onClick={() => onChange({ ...settings, detail: 'all', onlyResources: true, groups: null, focusNeighbors: false })}>有资料可读</button>
    </div>
    <section className="og-setting-section"><h3>显示范围</h3>
      <label className="og-setting"><span>只显示有资料的节点<small>有直接绑定资料，不等于已经完成讲解。</small></span><input type="checkbox" aria-label="只显示有资料的节点" checked={settings.onlyResources} onChange={e => change('onlyResources', e.target.checked)} /></label>
      <label className="og-setting"><span>只看选中节点及相邻知识<small>{selectedId ? '仍在同一张图中筛选，不重新排列节点。' : '先在图中选择一个知识点。'}</small></span><input type="checkbox" aria-label="只看相邻知识" disabled={!selectedId} checked={settings.focusNeighbors} onChange={e => change('focusNeighbors', e.target.checked)} /></label>
      <p className="og-setting-label">知识层级</p>
      <div className="og-segments" role="group" aria-label="知识层级">{([['all','全部'],['overview','领域 / 专题'],['concepts','概念']] as const).map(([value,label]) => <button type="button" key={value} aria-pressed={settings.detail === value} onClick={() => change('detail', value)}>{label}</button>)}</div>
      <div className="og-section-heading"><h4>知识分区</h4><div><button type="button" onClick={() => change('groups', null)}>全选</button><button type="button" onClick={() => change('groups', [])}>清空</button></div></div>
      {index.groups.map(group => <label className="og-group-filter" key={group.id}><input type="checkbox" checked={!settings.groups || settings.groups.includes(group.id)} onChange={e => { const ids = new Set(settings.groups ?? index.groups.map(g => g.id)); e.target.checked ? ids.add(group.id) : ids.delete(group.id); change('groups', ids.size === index.groups.length ? null : [...ids]); }} /><i aria-hidden="true" data-group={group.id} /><span>{group.label.replace(/^\d+ · /, '')}</span></label>)}
      {selectedId && <p className="og-setting-footnote">选中的节点会保留，避免筛选后丢失位置。</p>}
    </section>
    <section className="og-setting-section"><h3>连线代表什么</h3>{switches.map(item => <label className="og-setting" key={item.key}><span><i className="og-line-sample" data-role={item.tone} aria-hidden="true" />{item.label}<small>{item.note}</small></span><input type="checkbox" aria-label={`显示${item.label}`} checked={settings[item.key]} onChange={e => change(item.key, e.target.checked)} /></label>)}<p className="og-setting-footnote">目录线只表示归属；学习路线的步骤不会自动变成先修连线。</p></section>
    <section className="og-setting-section"><h3>视觉显示</h3>
      <label className="og-setting"><span>按知识分区着色<small>颜色对应上面的分区，不表示知识的重要程度。</small></span><input type="checkbox" aria-label="按知识分区着色" checked={settings.colored} onChange={e => change('colored', e.target.checked)} /></label>
      {([{ key: 'labels', label: '标签密度', min: 0, max: 2, step: .25 }, { key: 'nodeSize', label: '节点大小', min: .7, max: 1.8, step: .1 }, { key: 'lineWidth', label: '连线粗细', min: .5, max: 2, step: .1 }, { key: 'lineOpacity', label: '连线可见度', min: .15, max: .9, step: .05 }] as const).map(item => <label className="og-slider-setting" key={item.key}><span>{item.label}<output>{item.key === 'labels' ? settings.labels === 0 ? '仅当前节点' : `${Math.round(settings.labels * 100)}%` : `${Math.round(settings[item.key] * 100)}%`}</output></span><input type="range" aria-label={item.label} min={item.min} max={item.max} step={item.step} value={settings[item.key]} onChange={e => change(item.key, Number(e.target.value))} /></label>)}
    </section>
    <section className="og-setting-section"><h3>视口操作</h3><p className="og-setting-label">鼠标滚轮</p><div className="og-segments" role="group" aria-label="滚轮操作">{(['zoom','pan'] as const).map(value => <button type="button" key={value} aria-pressed={settings.wheelMode === value} onClick={() => change('wheelMode', value)}>{value === 'zoom' ? '缩放图谱' : '平移图谱'}</button>)}</div><p className="og-setting-footnote">拖动画布平移 · 双指缩放 · 方向键移动 · + / − 缩放 · 0 显示全图</p><button type="button" className="og-action-row" onClick={onFit}><Maximize2 />将当前范围放入视口</button></section>
    <footer className="og-settings-footer"><span>显示 {stats.nodes} / {stats.total} 个知识节点</span><button type="button" className="og-action-row" onClick={() => onChange({ ...DEFAULT_NETWORK_SETTINGS })}><RotateCcw />恢复默认显示</button></footer>
  </div>;
}
