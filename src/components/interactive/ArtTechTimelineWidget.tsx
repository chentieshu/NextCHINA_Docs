import React, { useState } from 'react';
import { History, Compass, ExternalLink } from 'lucide-react';

interface TimelineEra {
  year: string;
  artMovement: string;
  techMilestone: string;
  philosophicalShift: string;
  representativeWorks: string;
  tags: string[];
}

const ERAS: TimelineEra[] = [
  {
    year: '1910s - 1920s',
    artMovement: '达达主义与包豪斯 (Bauhaus)',
    techMilestone: '工业流水线、机械化批量复制、早期机械自动化',
    philosophicalShift: '从对古典艺术殿堂的崇拜转向“机械美学”与功能主义统一，技术成为艺术的塑型骨骼。',
    representativeWorks: '莫霍利-纳吉《光空间调制器》、杜尚《下楼梯的裸女》',
    tags: ['机械时代', '功能主义', '激进达达']
  },
  {
    year: '1960s - 1970s',
    artMovement: '激浪派与早期控制论艺术 (Fluxus / Cybernetic)',
    techMilestone: '晶体管、阴极射线显像管 (CRT)、诺伯特·维纳控制论理论',
    philosophicalShift: '艺术不再是静止的客体，而是基于反馈回路与人机互动的“开放系统”。',
    representativeWorks: '白南准《电视大佛》、E.A.T. (Experiments in Art and Technology)',
    tags: ['控制论', '电视媒介', '反馈系统']
  },
  {
    year: '1990s - 2000s',
    artMovement: '网络艺术与虚拟沉浸 (Net.Art & VR)',
    techMilestone: '万维网普及、浏览器、实时3D图形渲染引擎',
    philosophicalShift: '赛博空间成为新的精神飞地，肉身与意识的二元撕裂，超文本瓦解了传统中心化叙事。',
    representativeWorks: 'Jeffrey Shaw《清醒的城市》、Olia Lialina《My Boyfriend Came Back From the War》',
    tags: ['赛博空间', '超文本', '去中心化']
  },
  {
    year: '2020s - 至今',
    artMovement: 'AIGC、潜空间策展与算法具身 (Latent Space Era)',
    techMilestone: 'Transformer大语言模型、扩散生成算法、具身智能机器人',
    philosophicalShift: '艺术从“表达人类经验”走向“与非人类智能协同共生”，反思算力通胀下的微观情绪颗粒度。',
    representativeWorks: 'Refik Anadol《无人之境》、Mario Klingemann《神经衰弱》',
    tags: ['大模型', '潜空间', '微观弱叙事']
  }
];

interface ArtTechTimelineWidgetProps {
  isLight?: boolean;
}

export const ArtTechTimelineWidget: React.FC<ArtTechTimelineWidgetProps> = ({ isLight = false }) => {
  const [activeIdx, setActiveIdx] = useState<number>(3);
  const activeEra = ERAS[activeIdx];

  return (
    <div className={`my-8 rounded-2xl p-5 md:p-6 transition-colors ${
      isLight ? 'bg-[#f6f6f9] text-[#2c2c30]' : 'bg-[#202024] text-[#cfcfd5]'
    }`}>
      {/* Widget Header - No Borders */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            isLight ? 'bg-[#eaebee] text-[#2c2c30]' : 'bg-[#2a2a30] text-[#dedee4]'
          }`}>
            <History className="h-4 w-4" />
          </div>
          <div>
            <h4 className={`text-sm font-semibold flex items-center gap-2 ${
              isLight ? 'text-[#1c1c20]' : 'text-[#e4e4eb]'
            }`}>
              媒介与范式演变时间轴 (1910 — 2026)
              <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full ${
                isLight ? 'bg-[#eaebee] text-[#55555c]' : 'bg-[#2d2d33] text-[#a0a0a8]'
              }`}>
                Timeline
              </span>
            </h4>
            <p className={`text-xs ${isLight ? 'text-[#707076]' : 'text-[#8a8a92]'}`}>
              点击不同历史锚点，审视媒介材料与艺术哲学的协同演进
            </p>
          </div>
        </div>
        <div className={`text-xs font-mono ${isLight ? 'text-[#7a7a82]' : 'text-[#7e7e86]'}`}>
          锚点: {activeIdx + 1} / {ERAS.length}
        </div>
      </div>

      {/* Epoch Pills - No Borders */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {ERAS.map((era, idx) => (
          <button
            key={era.year}
            onClick={() => setActiveIdx(idx)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeIdx === idx
                ? isLight
                  ? 'bg-[#dedee4] text-[#1a1a1e]'
                  : 'bg-[#303036] text-[#ededf4]'
                : isLight
                  ? 'bg-[#eeeeF2] text-[#55555c] hover:bg-[#e4e4e9]'
                  : 'bg-[#18181b] text-[#8e8e96] hover:bg-[#25252a]'
            }`}
          >
            <span className="font-mono opacity-80 mr-1.5">{era.year}</span>
            {era.artMovement.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Active Era Detail Card - No Borders */}
      <div className={`mt-3.5 rounded-xl p-4 md:p-5 ${
        isLight ? 'bg-[#eeeeF2]' : 'bg-[#18181b]'
      }`}>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <div>
            <div className={`text-xs font-mono tracking-wider mb-1 flex items-center gap-1.5 ${
              isLight ? 'text-[#707078]' : 'text-[#8a8a92]'
            }`}>
              <Compass className="h-3.5 w-3.5" />
              时代坐标 · {activeEra.year}
            </div>
            <h5 className={`text-base font-semibold mb-1.5 ${isLight ? 'text-[#1c1c20]' : 'text-[#e4e4eb]'}`}>
              {activeEra.artMovement}
            </h5>
            <div className={`inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded mb-2.5 ${
              isLight 
                ? 'bg-[#e2e2e7] text-[#3e3e44]' 
                : 'bg-[#25252a] text-[#b8b8c2]'
            }`}>
              <span className={isLight ? 'text-[#7a7a82]' : 'text-[#707078]'}>底层技术破局:</span>
              <span className="font-medium">{activeEra.techMilestone}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 pt-2 text-sm leading-relaxed">
          <div>
            <span className={`text-xs font-mono uppercase tracking-wider block mb-1 ${
              isLight ? 'text-[#707076]' : 'text-[#8a8a92]'
            }`}>
              哲学范式位移 (Philosophical Shift)
            </span>
            <p className={`font-serif-sc ${isLight ? 'text-[#2c2c30]' : 'text-[#cfcfd6]'}`}>
              {activeEra.philosophicalShift}
            </p>
          </div>

          <div className="pt-2">
            <span className={`text-xs font-mono uppercase tracking-wider block mb-1 ${
              isLight ? 'text-[#707076]' : 'text-[#8a8a92]'
            }`}>
              标志性艺术实践 (Milestone Practice)
            </span>
            <div className={`flex items-center gap-2 text-xs font-medium ${
              isLight ? 'text-[#3e3e44]' : 'text-[#dedee4]'
            }`}>
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
              <span>{activeEra.representativeWorks}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
