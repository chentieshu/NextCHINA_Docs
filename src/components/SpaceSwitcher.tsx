import React from 'react';
import type { DocSpace } from '../types';
import { Home } from 'lucide-react';

interface Props { spaces: DocSpace[]; activeSpaceId: string; isLight: boolean; onHome: () => void; onSelectSpace: (id: string) => void; }

export const SpaceSwitcher: React.FC<Props> = ({ spaces, activeSpaceId, isLight, onHome, onSelectSpace }) => (
  <aside className={`hidden lg:flex fixed top-11 bottom-0 left-0 z-30 w-14 flex-col items-center py-3 gap-2 border-r ${isLight ? 'bg-[#f4f4f7] border-[#e6e6eb]' : 'bg-[#111114] border-[#25252a]'}`}>
    <button onClick={onHome} title="文档首页" className={`w-9 h-9 rounded-xl flex items-center justify-center ${isLight ? 'text-[#65656d] hover:bg-white' : 'text-[#85858e] hover:bg-[#242429]'}`}><Home className="h-4 w-4" /></button>
    <div className={`w-6 h-px my-1 ${isLight ? 'bg-[#dddde3]' : 'bg-[#2c2c31]'}`} />
    {spaces.map(space => {
      const active = space.id === activeSpaceId;
      return <button key={space.id} onClick={() => onSelectSpace(space.id)} title={space.name} className={`relative w-9 h-9 rounded-xl text-[11px] font-mono font-bold transition-all ${active ? (isLight ? 'bg-[#1d1d21] text-white' : 'bg-[#ededf2] text-[#18181b]') : (isLight ? 'bg-white text-[#66666e]' : 'bg-[#1d1d21] text-[#9999a2]')}`}>{space.shortName}{active && <span className={`absolute -left-[11px] top-2 bottom-2 w-0.5 rounded-full ${isLight ? 'bg-[#1d1d21]' : 'bg-white'}`} />}</button>;
    })}
  </aside>
);
