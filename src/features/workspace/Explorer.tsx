import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, FileText, Folder, FolderOpen, Search, ChevronsDownUp, Crosshair, X } from 'lucide-react';
import type { AppRoute } from '../../routing';
import { activeEntry, documentRoute, folderRoute, type ExplorerModel, type Entry } from './model';
interface Props { model: ExplorerModel; route: AppRoute; onOpen: (route: AppRoute) => void; searchMode: boolean; onSearchMode: (value: boolean) => void; onClose: () => void; mobile: boolean; }
const TREE_STATE = 'nextchina-explorer-expanded-v1';
export function Explorer({ model, route, onOpen, searchMode, onSearchMode, onClose, mobile }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    try { const raw = JSON.parse(sessionStorage.getItem(TREE_STATE) ?? '[]'); return new Set(Array.isArray(raw) ? raw.filter((id: unknown) => typeof id === 'string' && model.entries.has(id)) : []); }
    catch { return new Set(); }
  });
  const [showPlanned, setShowPlanned] = useState(false);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(40);
  const [focusId, setFocusId] = useState<string | null>(null);
  const host = useRef<HTMLDivElement>(null), search = useRef<HTMLInputElement>(null);
  const current = activeEntry(route, model);
  const counts = useMemo(() => {
    const result = new Map<string, number>();
    const count = (id: string): number => { if (result.has(id)) return result.get(id)!; const entry = model.entries.get(id)!; const total = entry.type === 'document' ? 1 : entry.children.reduce((sum, child) => sum + count(child), 0); result.set(id, total); return total; };
    model.roots.forEach(count); return result;
  }, [model]);
  useEffect(() => {
    if (!current) return;
    setExpanded(previous => new Set([...previous, ...model.parents(current)]));
    setFocusId(current);
    // Scroll only the explorer, never the page or the reading pane.
    const frame = requestAnimationFrame(() => {
      const row = [...(host.current?.querySelectorAll<HTMLElement>('[data-entry-id]') ?? [])].find(el => el.dataset.entryId === current);
      if (row && host.current) { const r = row.getBoundingClientRect(), h = host.current.getBoundingClientRect(); if (r.top < h.top || r.bottom > h.bottom) host.current.scrollTop += r.top - h.top - h.height / 3; }
    });
    return () => cancelAnimationFrame(frame);
  }, [current, model]);
  useEffect(() => { try { sessionStorage.setItem(TREE_STATE, JSON.stringify([...expanded])); } catch { /* Optional UI state. */ } }, [expanded]);
  useEffect(() => { if (searchMode) search.current?.focus(); }, [searchMode]);
  const visible = useMemo(() => {
    const rows: { entry: Entry; depth: number; pos: number; size: number }[] = [];
    const walk = (ids: string[], depth: number) => {
      const children = ids.filter(id => showPlanned || (counts.get(id) ?? 0) > 0);
      children.forEach((id, index) => { const entry = model.entries.get(id)!; rows.push({ entry, depth, pos: index + 1, size: children.length }); if (expanded.has(id)) walk(entry.children, depth + 1); });
    };
    walk(model.roots, 0); return rows;
  }, [model, expanded, showPlanned, counts]);
  const toggle = (id: string) => setExpanded(previous => { const next = new Set(previous); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const open = (entry: Entry) => onOpen(entry.type === 'document' ? documentRoute(entry.articleId!, entry.nodeId) : folderRoute(entry.nodeId));
  const focus = (id: string) => { setFocusId(id); requestAnimationFrame(() => [...(host.current?.querySelectorAll<HTMLElement>('[data-entry-id]') ?? [])].find(node => node.dataset.entryId === id)?.focus()); };
  const results = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    const score = (title: string) => terms.filter(term => title.toLocaleLowerCase().includes(term)).length;
    return [...model.documents.values()].filter(article => terms.every(term => `${article.title} ${article.tags.join(' ')} ${article.content}`.toLocaleLowerCase().includes(term)))
      .sort((a,b) => score(b.title)-score(a.title));
  }, [query, model]);
  const reveal = () => { if (!current) return; setExpanded(previous => new Set([...previous, ...model.parents(current)])); setFocusId(current); onSearchMode(false); requestAnimationFrame(() => focus(current)); };
  const tabbable = visible.some(row => row.entry.id === focusId) ? focusId : visible[0]?.entry.id;
  return <>
    <header className="ws-vault"><div><strong>NextCHINA</strong><span>AI 知识库</span></div>{mobile && <button type="button" onClick={onClose} aria-label="关闭文档侧栏"><X /></button>}</header>
    <div className="ws-explorer-tabs" role="group" aria-label="侧栏内容"><button type="button" aria-pressed={!searchMode} onClick={() => onSearchMode(false)}><FolderOpen />文档目录</button><button type="button" aria-pressed={searchMode} onClick={() => onSearchMode(true)}><Search />全库搜索</button></div>
    <div className="ws-tree-tools"><span>{model.documents.size} 篇文档</span><button type="button" onClick={reveal} aria-label="定位当前文档"><Crosshair /></button><button type="button" onClick={() => setExpanded(new Set())} aria-label="折叠所有目录"><ChevronsDownUp /></button></div>
    {searchMode ? <div className="ws-search-panel"><label className="ws-search-field"><Search /><input ref={search} type="search" value={query} placeholder="搜索标题、术语、全文…" aria-label="搜索全部文档" onChange={event => { setQuery(event.target.value); setLimit(40); }} /></label>
      <p className="ws-muted">{query.trim() ? `${results.length} 篇匹配文档` : '跨所有专题检索。选择结果后直接在右侧阅读。'}</p>
      <ul className="ws-search-results">{results.slice(0, limit).map(article => <li key={article.id}><button type="button" onClick={() => { onSearchMode(false); setQuery(''); onOpen(documentRoute(article.id, model.occurrence(article.id)?.nodeId)); }}><FileText /><span><strong>{article.title}</strong><small>{article.categoryName}</small></span></button></li>)}</ul>
      {results.length > limit && <button type="button" onClick={() => setLimit(value => value + 40)}>显示更多结果</button>}
    </div> : <div className="ws-tree-scroll" ref={host}><div role="tree" aria-label="全部文档目录">{visible.map(({ entry, depth, pos, size }, index) => {
      const folder = entry.type === 'folder', isOpen = expanded.has(entry.id), selected = entry.id === current;
      return <div key={entry.id} role="treeitem" aria-level={depth + 1} aria-posinset={pos} aria-setsize={size} aria-selected={selected}
        aria-expanded={folder ? isOpen : undefined} tabIndex={tabbable === entry.id ? 0 : -1} data-entry-id={entry.id} data-article-id={entry.articleId} data-planned={!(counts.get(entry.id) ?? 0)}
        className="ws-tree-row" style={{ '--tree-depth': Math.min(depth, 5) } as React.CSSProperties} title={entry.label}
        onFocus={() => setFocusId(entry.id)} onClick={() => { if (folder) toggle(entry.id); else open(entry); }}
        onKeyDown={event => {
          const key = event.key; if (!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End','Enter',' '].includes(key)) return;
          event.preventDefault();
          if (key === 'ArrowDown') focus(visible[Math.min(index + 1, visible.length - 1)].entry.id);
          if (key === 'ArrowUp') focus(visible[Math.max(index - 1, 0)].entry.id);
          if (key === 'Home') focus(visible[0].entry.id);
          if (key === 'End') focus(visible.at(-1)!.entry.id);
          if (key === 'ArrowRight' && folder) { if (!isOpen) toggle(entry.id); else if (visible[index + 1]?.depth > depth) focus(visible[index + 1].entry.id); }
          if (key === 'ArrowLeft') { if (folder && isOpen) toggle(entry.id); else if (entry.parentId) focus(entry.parentId); }
          if (key === 'Enter') { if (folder) toggle(entry.id); else open(entry); }
          if (key === ' ') { if (folder) toggle(entry.id); else open(entry); }
        }}>
        <span className="ws-tree-chevron" aria-hidden="true" onClick={event => { if (folder) { event.stopPropagation(); toggle(entry.id); } }}>{folder && <ChevronRight data-open={isOpen} />}</span>
        {folder ? isOpen ? <FolderOpen /> : <Folder /> : <FileText />}
        <span className="ws-tree-label">{entry.label}</span>{folder && <small>{counts.get(entry.id) || '○'}</small>}
      </div>;
    })}</div></div>}
    <footer className="ws-explorer-footer"><button type="button" aria-pressed={showPlanned} onClick={() => setShowPlanned(value => !value)}>{showPlanned ? '隐藏待完善大纲' : '显示待完善大纲'}</button><span>目录关联，不复制正文</span></footer>
  </>;
}
