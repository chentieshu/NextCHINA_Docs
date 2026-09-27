import React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import type { DocSpace } from '../types';

interface Props { spaces: DocSpace[]; value: string; onChange: (id: string) => void; }

/** Styled single-select listbox; no browser-native select popup. */
export function SpaceSelector({ spaces, value, onChange }: Props) {
  const root = React.useRef<HTMLDivElement>(null);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const list = React.useRef<HTMLDivElement>(null);
  const id = React.useId();
  const selected = Math.max(0, spaces.findIndex(space => space.id === value));
  const [open, setOpen] = React.useState(false);
  const [focused, setFocused] = React.useState(selected);
  const typeahead = React.useRef({ text: '', at: 0 });
  const close = (restoreFocus = false) => { setOpen(false); if (restoreFocus) trigger.current?.focus(); };

  React.useEffect(() => {
    if (!open) return;
    list.current?.focus();
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  React.useEffect(() => {
    if (open) list.current?.querySelector<HTMLElement>(`[data-index="${focused}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }, [focused, open]);

  const choose = (index: number) => {
    const space = spaces[index];
    if (!space) return;
    close(true);
    onChange(space.id);
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Tab') { close(); return; }
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); setFocused(index => Math.max(0, Math.min(spaces.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1))));
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault(); setFocused(event.key === 'Home' ? 0 : spaces.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); choose(focused);
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      const text = (now - typeahead.current.at < 700 ? typeahead.current.text : '') + event.key.toLowerCase();
      typeahead.current = { text, at: now };
      const index = spaces.findIndex(space => space.name.toLowerCase().startsWith(text));
      if (index >= 0) setFocused(index);
    }
  };

  return <div ref={root} className="space-selector" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }}>
    <button ref={trigger} type="button" className="space-selector-trigger" aria-label="切换文档大分类" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? id : undefined}
      onClick={() => { setFocused(selected); setOpen(state => !state); }}
      onKeyDown={event => { if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) { event.preventDefault(); setFocused(event.key === 'Home' ? 0 : event.key === 'End' ? spaces.length - 1 : selected); setOpen(true); } }}>
      <span>{spaces[selected]?.name ?? '选择大分类'}</span><ChevronsUpDown aria-hidden="true" size={16} />
    </button>
    {open && <div ref={list} id={id} role="listbox" tabIndex={-1} aria-label="文档大分类" aria-activedescendant={`${id}-${focused}`} className="space-selector-list" onKeyDown={onKeyDown}>
      {spaces.map((space, index) => <div key={space.id} id={`${id}-${index}`} role="option" aria-selected={space.id === value} data-index={index} data-focused={index === focused} className="space-selector-option"
        onPointerMove={() => setFocused(index)} onPointerDown={event => event.preventDefault()} onClick={() => choose(index)}>
        <span>{space.name}</span>{space.id === value && <Check aria-hidden="true" size={16} />}
      </div>)}
    </div>}
  </div>;
}
