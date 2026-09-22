import React, { useState } from 'react';
import { Radar, Radio, Cpu, Orbit, Sparkles } from 'lucide-react';

interface TechFrontier {
  id: string;
  name: string;
  maturityYears: string;
  avantGardeArtOrigin: string;
  futureTechCommercial: string;
  criticalTension: string;
  iconName: 'radio' | 'cpu' | 'orbit' | 'sparkles';
}

const FRONTIERS: TechFrontier[] = [
  {
    id: 'bci',
    name: '脑机直觉接口 (BCI Direct Intuition)',
    maturityYears: '2028 - 2033',
    avantGardeArtOrigin: '生物艺术（Bio-Art）、脑电反馈声音雕塑（如Alvin Lucier早期脑电波音乐）',
    futureTechCommercial: '无屏幕时代的意念微交互、无声神经陪伴、情绪实时调频消费电子',
    criticalTension: '当意识可以直接被编译为商业指令，私人隐秘意识是否将彻底向巨头透明化？',
    iconName: 'radio'
  },
  {
    id: 'synthetic-biology',
    name: '合成生物材料与自愈硬件 (Living Hardware)',
    maturityYears: '2030 - 2035',
    avantGardeArtOrigin: '菌丝体建筑、发光细菌生物涂鸦（如Eduardo Kac的基因转殖艺术）',
    futureTechCommercial: '拥有细胞呼吸感的外壳、能自我修复划痕的触控板、有机降解电子零件',
    criticalTension: '消费品从“非生命制造物”转变为“可被废弃的半生命体”，人对器物的伦理责任何在？',
    iconName: 'orbit'
  },
  {
    id: 'quantum-haptics',
    name: '量子触觉模拟与微观阻尼 (Quantum Micro-Haptics)',
    maturityYears: '2027 - 2030',
    avantGardeArtOrigin: '动力学机械装置、触觉声音空间转化器',
    futureTechCommercial: '在空气中还原丝绸、生铁或雨滴微观碰撞的真实质感，颠覆远程虚拟交互',
    criticalTension: '极度逼真的触觉替代，是否会让人类进一步从真实的自然物理世界脱锚离体？',
    iconName: 'cpu'
  },
  {
    id: 'speculative-ai',
    name: '推测性自主AI策展人 (Autonomous AI Curators)',
    maturityYears: '2026 - 2028',
    avantGardeArtOrigin: '概念艺术、激浪派偶发艺术指令系统（如约翰·凯奇随机律动）',
    futureTechCommercial: '无需人类指令，自主探索未知艺术风格并为个体定制精神疗愈空间的大模型伴侣',
    criticalTension: '如果艺术的审美评价体系完全脱离人类主观共识，艺术是否依然是“人类之镜”？',
    iconName: 'sparkles'
  }
];

interface FutureTechRadarWidgetProps {
  isLight?: boolean;
}

export const FutureTechRadarWidget: React.FC<FutureTechRadarWidgetProps> = ({ isLight = false }) => {
  const [selectedId, setSelectedId] = useState<string>('bci');

  const current = FRONTIERS.find(f => f.id === selectedId) || FRONTIERS[0];

  const renderIcon = (name: TechFrontier['iconName']) => {
    switch (name) {
      case 'radio': return <Radio className="h-4 w-4" />;
      case 'orbit': return <Orbit className="h-4 w-4" />;
      case 'cpu': return <Cpu className="h-4 w-4" />;
      case 'sparkles': return <Sparkles className="h-4 w-4" />;
    }
  };

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
            <Radar className="h-4 w-4" />
          </div>
          <div>
            <h4 className={`text-sm font-semibold flex items-center gap-2 ${
              isLight ? 'text-[#1c1c20]' : 'text-[#e4e4eb]'
            }`}>
              未来技术推测雷达 (Speculative Tech Radar)
              <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full ${
                isLight ? 'bg-[#eaebee] text-[#55555c]' : 'bg-[#2d2d33] text-[#a0a0a8]'
              }`}>
                Radar
              </span>
            </h4>
            <p className={`text-xs ${isLight ? 'text-[#707076]' : 'text-[#8a8a92]'}`}>
              以推测性设计（Speculative Design）视角，推演前沿艺术实验如何孕育下一代消费科技
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Frontiers - No Borders */}
      <div className="mt-3.5 grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {FRONTIERS.map(item => {
          const isSelected = item.id === selectedId;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between h-24 ${
                isSelected
                  ? isLight
                    ? 'bg-[#dedee4] text-[#1a1a1e]'
                    : 'bg-[#303036] text-[#ededf4]'
                  : isLight
                    ? 'bg-[#eeeeF2] hover:bg-[#e4e4e9] text-[#55555c]'
                    : 'bg-[#18181b] hover:bg-[#25252a] text-[#8e8e96]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={isSelected ? (isLight ? 'text-[#1a1a1e]' : 'text-[#ededf4]') : (isLight ? 'text-[#505056]' : 'text-[#a0a0a8]')}>
                  {renderIcon(item.iconName)}
                </span>
                <span className={`text-[10px] font-mono ${
                  isSelected ? (isLight ? 'text-[#44444a]' : 'text-[#c0c0c8]') : (isLight ? 'text-[#707078]' : 'text-[#7a7a82]')
                }`}>
                  {item.maturityYears}
                </span>
              </div>
              <div className={`text-xs font-semibold line-clamp-2 ${
                isSelected 
                  ? (isLight ? 'text-[#1a1a1e]' : 'text-[#ffffff]') 
                  : (isLight ? 'text-[#38383e]' : 'text-[#d6d6de]')
              }`}>
                {item.name.split(' ')[0]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Card - No Borders */}
      <div className={`mt-3.5 rounded-xl p-4 md:p-5 space-y-3 ${
        isLight ? 'bg-[#eeeeF2]' : 'bg-[#18181b]'
      }`}>
        <div className="flex items-center justify-between">
          <div className={`text-sm font-semibold flex items-center gap-2 ${
            isLight ? 'text-[#1c1c20]' : 'text-[#e4e4eb]'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-[#787880]' : 'bg-[#cfcfd5]'}`}></span>
            {current.name}
          </div>
          <span className={`text-xs font-mono ${isLight ? 'text-[#707078]' : 'text-[#8a8a92]'}`}>推测设计演进链路</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className={`p-3.5 rounded-xl space-y-1 ${
            isLight ? 'bg-[#e4e4ea]' : 'bg-[#242429]'
          }`}>
            <span className={`font-semibold ${isLight ? 'text-[#1c1c20]' : 'text-[#e0e0e6]'}`}>1. 先锋艺术母体原形 (Art Ancestor):</span>
            <p className={`leading-relaxed ${isLight ? 'text-[#44444a]' : 'text-[#b8b8c2]'}`}>{current.avantGardeArtOrigin}</p>
          </div>
          <div className={`p-3.5 rounded-xl space-y-1 ${
            isLight ? 'bg-[#e4e4ea]' : 'bg-[#242429]'
          }`}>
            <span className={`font-semibold ${isLight ? 'text-[#1c1c20]' : 'text-[#e0e0e6]'}`}>2. 未来消费科技形态 (Commercial Landing):</span>
            <p className={`leading-relaxed ${isLight ? 'text-[#44444a]' : 'text-[#b8b8c2]'}`}>{current.futureTechCommercial}</p>
          </div>
        </div>

        <div className={`p-3.5 rounded-xl text-xs leading-relaxed ${
          isLight ? 'bg-[#dedee4] text-[#2c2c30]' : 'bg-[#29292f] text-[#cfcfd6]'
        }`}>
          <span className={`font-semibold mr-1.5 ${isLight ? 'text-[#1c1c20]' : 'text-[#e0e0e6]'}`}>批判性张力：</span>
          {current.criticalTension}
        </div>
      </div>
    </div>
  );
};
