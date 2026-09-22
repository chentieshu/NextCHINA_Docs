import React, { useState } from 'react';
import { TrendingUp, Lightbulb } from 'lucide-react';

interface CommercialScenario {
  id: string;
  name: string;
  sector: string;
  grandNarrativeApproach: string;
  microWeakNarrativeApproach: string;
  artisticTransformation: string;
  whyCommercialWins: string;
  userResonanceRate: number;
}

const SCENARIOS: CommercialScenario[] = [
  {
    id: 'perfume',
    name: '嗅觉与空间香氛 (Sensory Fragrance)',
    sector: '高客单价情绪消费',
    grandNarrativeApproach: '“征服法兰西之夜，加冕你的贵族皇冠”（宏大、阶级标榜、英雄化）',
    microWeakNarrativeApproach: '“星期日下午四点，未干的水泥台阶与雨后第一缕潮湿青苔”（微观、瞬时感官切片、私人记忆）',
    artisticTransformation: '通过空间声学混响与微观水汽粒子投影，把香调分子挥发转化为可听可视的弱叙事容器。',
    whyCommercialWins: '当代年轻人厌恶身份绑架，更愿为细碎精准的情绪避难所与松弛感支付溢价。',
    userResonanceRate: 94
  },
  {
    id: 'hardware',
    name: '极简消费电子与可穿戴 (Minimalist Hardware)',
    sector: '消费硬件与IoT',
    grandNarrativeApproach: '“全球领先的十二核算力旗舰，统治未来生产力战场”（冰冷参数、军备竞赛）',
    microWeakNarrativeApproach: '“旋转旋钮时，阻尼齿轮回馈至指腹的微秒级咔哒震颤与心跳同频”（物理微阻尼、呼吸感交互）',
    artisticTransformation: '借用日本物派（Mono-ha）艺术与包豪斯微触觉哲学，将电路板骨骼与哑光金属结合。',
    whyCommercialWins: '参数已严重过剩，对指尖极微触觉的尊重成为高端品牌与白牌拉开万倍价格差的秘密武器。',
    userResonanceRate: 89
  },
  {
    id: 'digital-product',
    name: '冥想与心理陪伴产品 (Digital Wellbeing)',
    sector: '软件与数字生活',
    grandNarrativeApproach: '“彻底击碎焦虑，重塑你的大脑神经元网络，成为精英领袖”（说教压迫、绩效狂热）',
    microWeakNarrativeApproach: '“看一颗灰度水滴在屏幕正中缓缓凝结又散开，你只需随着它的折射率呼吸”（极简微观视觉、无压伴随）',
    artisticTransformation: '引入生成水墨算法与环境白噪音，消除所有打卡排名的压力。',
    whyCommercialWins: '越是宏大的心灵说教，越让疲惫的现代人感到压迫；而微小非侵扰的陪伴却能达成极高的留存率。',
    userResonanceRate: 96
  }
];

interface MicroNarrativeCommercialWidgetProps {
  isLight?: boolean;
}

export const MicroNarrativeCommercialWidget: React.FC<MicroNarrativeCommercialWidgetProps> = ({ isLight = false }) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('perfume');
  const [contrastMode, setContrastMode] = useState<'both' | 'weak-only'>('both');

  const current = SCENARIOS.find(s => s.id === selectedScenarioId) || SCENARIOS[0];

  return (
    <div className={`my-8 rounded-2xl p-5 md:p-6 transition-colors ${
      isLight ? 'bg-[#f6f6f9] text-[#2c2c30]' : 'bg-[#202024] text-[#cfcfd5]'
    }`}>
      {/* Header - No Borders */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            isLight ? 'bg-[#eaebee] text-[#2c2c30]' : 'bg-[#2a2a30] text-[#dedee4]'
          }`}>
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h4 className={`text-sm font-semibold flex items-center gap-2 ${
              isLight ? 'text-[#1c1c20]' : 'text-[#e4e4eb]'
            }`}>
              叙事实战对照：宏大强叙事 vs 微观弱叙事
              <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full ${
                isLight ? 'bg-[#eaebee] text-[#55555c]' : 'bg-[#2d2d33] text-[#a0a0a8]'
              }`}>
                Commercial
              </span>
            </h4>
            <p className={`text-xs ${isLight ? 'text-[#707076]' : 'text-[#8a8a92]'}`}>
              切换典型商业赛道，洞见“艺术微观直观化”如何撬动万亿级情绪颗粒度红利
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 p-1 rounded-lg text-xs ${
          isLight ? 'bg-[#eeeeF2]' : 'bg-[#18181b]'
        }`}>
          <button
            onClick={() => setContrastMode('both')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              contrastMode === 'both' 
                ? (isLight ? 'bg-[#dedee4] text-[#1c1c20] font-medium' : 'bg-[#303036] text-[#ededf4] font-medium')
                : (isLight ? 'text-[#606068] hover:text-[#1c1c20]' : 'text-[#8a8a92] hover:text-[#e4e4eb]')
            }`}
          >
            双模对比
          </button>
          <button
            onClick={() => setContrastMode('weak-only')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              contrastMode === 'weak-only' 
                ? (isLight ? 'bg-[#dedee4] text-[#1c1c20] font-medium' : 'bg-[#303036] text-[#ededf4] font-medium')
                : (isLight ? 'text-[#606068] hover:text-[#1c1c20]' : 'text-[#8a8a92] hover:text-[#e4e4eb]')
            }`}
          >
            仅聚焦微观弱叙事
          </button>
        </div>
      </div>

      {/* Scenario Selector - No Borders */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {SCENARIOS.map(sc => {
          const isSelected = selectedScenarioId === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => setSelectedScenarioId(sc.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isSelected
                  ? isLight
                    ? 'bg-[#dedee4] text-[#1a1a1e]'
                    : 'bg-[#303036] text-[#ededf4]'
                  : isLight
                    ? 'bg-[#eeeeF2] hover:bg-[#e4e4e9] text-[#55555c]'
                    : 'bg-[#18181b] hover:bg-[#25252a] text-[#8e8e96]'
              }`}
            >
              {sc.name}
            </button>
          );
        })}
      </div>

      {/* Comparison Columns - No Borders */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {contrastMode === 'both' && (
          <div className={`rounded-xl p-4 space-y-2.5 ${
            isLight ? 'bg-[#eeeeF2]' : 'bg-[#18181b]'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-mono tracking-wide font-semibold flex items-center gap-1.5 ${
                isLight ? 'text-[#505056]' : 'text-[#a0a0a8]'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-[#808088]' : 'bg-[#6a6a72]'}`}></span>
                传统【宏大强叙事】范式
              </span>
              <span className={`text-[11px] ${isLight ? 'text-[#74747c]' : 'text-[#7a7a82]'}`}>递减效应中</span>
            </div>
            <p className={`text-xs italic font-serif-sc leading-relaxed p-3 rounded-lg ${
              isLight 
                ? 'bg-[#e4e4ea] text-[#55555c]' 
                : 'bg-[#242429] text-[#9c9ca4]'
            }`}>
              {current.grandNarrativeApproach}
            </p>
            <ul className={`text-[11px] space-y-1 pl-1 ${isLight ? 'text-[#707078]' : 'text-[#8a8a92]'}`}>
              <li>• 特征：英雄主义、阶层身份标榜、说教式劝谕</li>
              <li>• 症结：过度脱离个体细碎体验，造成防御性心理滑水</li>
              <li>• 成本：极度依赖大规模中心化广告投放推高声量</li>
            </ul>
          </div>
        )}

        <div className={`rounded-xl p-4 space-y-2.5 ${
          isLight ? 'bg-[#e6e6ec]' : 'bg-[#1e1e23]'
        } ${contrastMode === 'weak-only' ? 'md:col-span-2' : ''}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono tracking-wide font-semibold flex items-center gap-1.5 ${
              isLight ? 'text-[#1c1c20]' : 'text-[#e4e4eb]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-[#505056]' : 'bg-[#cfcfd6]'}`}></span>
              先锋【微观弱叙事】破局解法
            </span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
              isLight ? 'bg-[#dedee4] text-[#1c1c20]' : 'bg-[#2a2a30] text-[#dedee4]'
            }`}>
              情绪共鸣度 {current.userResonanceRate}%
            </span>
          </div>
          <p className={`text-xs font-serif-sc leading-relaxed p-3 rounded-lg ${
            isLight ? 'bg-[#dedee4] text-[#222226]' : 'bg-[#26262c] text-[#dedee4]'
          }`}>
            {current.microWeakNarrativeApproach}
          </p>
          <ul className={`text-[11px] space-y-1.5 ${isLight ? 'text-[#44444a]' : 'text-[#b8b8c2]'}`}>
            <li className="flex items-start gap-1.5">
              <span className="opacity-60 mt-0.5">✦</span>
              <span><strong>艺术直观化触点：</strong>{current.artisticTransformation}</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="opacity-60 mt-0.5">✦</span>
              <span><strong>商业爆发动因：</strong>{current.whyCommercialWins}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Summary Footer - No Borders */}
      <div className={`mt-3.5 rounded-xl p-3 text-xs flex items-center gap-2 ${
        isLight ? 'bg-[#eeeeF2] text-[#44444a]' : 'bg-[#18181b] text-[#b8b8c2]'
      }`}>
        <Lightbulb className="h-4 w-4 opacity-70 shrink-0" />
        <span>
          <strong>商业命题提炼：</strong>弱叙事不是“没有故事”，而是放弃支配欲与说教，将阐释权归还给使用者的微观感官与私人记忆。
        </span>
      </div>
    </div>
  );
};
