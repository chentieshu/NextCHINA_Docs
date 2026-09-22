import React, { useState } from 'react';
import { Sliders, Sparkles, RefreshCw } from 'lucide-react';

interface AigcAestheticMatrixWidgetProps {
  isLight?: boolean;
}

export const AigcAestheticMatrixWidget: React.FC<AigcAestheticMatrixWidgetProps> = ({ isLight = false }) => {
  const [promptDepth, setPromptDepth] = useState<number>(40);
  const [imperfection, setImperfection] = useState<number>(20);
  const [modelHomogeneity, setModelHomogeneity] = useState<number>(75);

  const calculateAestheticState = () => {
    if (promptDepth < 30 && modelHomogeneity > 70) {
      return {
        title: '算力通胀下的廉价奇观 (Plastic Wonder)',
        desc: '高度均质化、过度渲染的糖衣视效，充斥着AI默认权重的刻板美感，缺乏创作者的生命温度。',
        critique: '“一种没有灵魂的数字巴洛克，除了展现算力丰饶之外一无所获。”',
        commercialRisk: '极易被更强的新模型瞬间降维替代，无品牌壁垒。'
      };
    } else if (imperfection > 60 && promptDepth > 50) {
      return {
        title: '先锋偶发主义与有机瑕疵 (Organic Glitch)',
        desc: '有意保留潜空间噪波、错构与手工微扰动，打破大模型对称洁癖，形成鲜明的人文抗体。',
        critique: '“人类用自己的不完美，为冰冷的高维数学流形注入了呼吸与刺痛感。”',
        commercialRisk: '受众门槛高，但能在先锋时尚与高溢价艺术衍生品中建立顶级心智。'
      };
    } else if (promptDepth > 70 && modelHomogeneity < 40) {
      return {
        title: '潜空间炼金术与哲学重构 (Latent Alchemy)',
        desc: '将大模型视作共生媒介而非绘图苦力，通过高维隐喻与多模态反刍，实现概念层次的灵韵涌现。',
        critique: '“不仅是提示词的雕琢，而是对人机认知边界的严谨哲学策展。”',
        commercialRisk: '未来数字创意工业的最高附加值形态，奠定下一代超感官IP核心资产。'
      };
    } else {
      return {
        title: '过渡态：工艺探索期 (Exploratory Transition)',
        desc: '在流水线降本与个性化风格之间的平衡实验，创作者正在重新校准自己的审美话语权。',
        critique: '“工具在驯化人，人也在重新驯化工具，张力正在形成。”',
        commercialRisk: '适合标准化批量生产，但亟需提炼不可替代的情绪颗粒度。'
      };
    }
  };

  const state = calculateAestheticState();

  const resetValues = () => {
    setPromptDepth(40);
    setImperfection(20);
    setModelHomogeneity(75);
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
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h4 className={`text-sm font-semibold flex items-center gap-2 ${
              isLight ? 'text-[#1c1c20]' : 'text-[#e4e4eb]'
            }`}>
              AIGC 审美异化与灵韵校准器
              <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full ${
                isLight ? 'bg-[#eaebee] text-[#55555c]' : 'bg-[#2d2d33] text-[#a0a0a8]'
              }`}>
                Simulator
              </span>
            </h4>
            <p className={`text-xs ${isLight ? 'text-[#707076]' : 'text-[#8a8a92]'}`}>
              拖动参数矩阵，推演生成式AI对创作者审美主权与灵韵（Aura）的重塑过程
            </p>
          </div>
        </div>

        <button
          onClick={resetValues}
          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors ${
            isLight ? 'bg-[#eeeeF2] hover:bg-[#e4e4e9] text-[#505056]' : 'bg-[#18181b] hover:bg-[#25252a] text-[#8e8e96]'
          }`}
          title="重置预设"
        >
          <RefreshCw className="h-3 w-3" />
          <span>重置</span>
        </button>
      </div>

      {/* Sliders Grid - No Borders */}
      <div className="mt-3.5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={`space-y-1.5 p-3.5 rounded-xl ${
          isLight ? 'bg-[#eeeeF2]' : 'bg-[#18181b]'
        }`}>
          <div className="flex justify-between text-xs">
            <span className={`font-medium ${isLight ? 'text-[#1c1c20]' : 'text-[#e4e4eb]'}`}>概念深度 / 隐喻反刍</span>
            <span className="font-mono font-bold">{promptDepth}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={promptDepth}
            onChange={(e) => setPromptDepth(Number(e.target.value))}
            className="w-full h-1.5 bg-[#dcdce2] dark:bg-[#34343a] rounded-lg appearance-none cursor-pointer accent-[#606068] dark:accent-[#cfcfd5]"
          />
          <p className={`text-[11px] leading-tight ${isLight ? 'text-[#707076]' : 'text-[#7a7a82]'}`}>
            低：套用通用模板；高：注入个人生命体验与冷门美学语汇
          </p>
        </div>

        <div className={`space-y-1.5 p-3.5 rounded-xl ${
          isLight ? 'bg-[#eeeeF2]' : 'bg-[#18181b]'
        }`}>
          <div className="flex justify-between text-xs">
            <span className={`font-medium ${isLight ? 'text-[#1c1c20]' : 'text-[#e4e4eb]'}`}>缺陷容忍 / 手工失误感</span>
            <span className="font-mono font-bold">{imperfection}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={imperfection}
            onChange={(e) => setImperfection(Number(e.target.value))}
            className="w-full h-1.5 bg-[#dcdce2] dark:bg-[#34343a] rounded-lg appearance-none cursor-pointer accent-[#606068] dark:accent-[#cfcfd5]"
          />
          <p className={`text-[11px] leading-tight ${isLight ? 'text-[#707076]' : 'text-[#7a7a82]'}`}>
            低：无瑕疵工业磨皮；高：保留噪点、故障、粗糙与真实质感
          </p>
        </div>

        <div className={`space-y-1.5 p-3.5 rounded-xl ${
          isLight ? 'bg-[#eeeeF2]' : 'bg-[#18181b]'
        }`}>
          <div className="flex justify-between text-xs">
            <span className={`font-medium ${isLight ? 'text-[#1c1c20]' : 'text-[#e4e4eb]'}`}>大模型默认均质倾向</span>
            <span className="font-mono font-bold">{modelHomogeneity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={modelHomogeneity}
            onChange={(e) => setModelHomogeneity(Number(e.target.value))}
            className="w-full h-1.5 bg-[#dcdce2] dark:bg-[#34343a] rounded-lg appearance-none cursor-pointer accent-[#606068] dark:accent-[#cfcfd5]"
          />
          <p className={`text-[11px] leading-tight ${isLight ? 'text-[#707076]' : 'text-[#7a7a82]'}`}>
            高：依赖基模型普遍众数权重；低：微调特定先锋风格或异构数据集
          </p>
        </div>
      </div>

      {/* Result Card - No Borders */}
      <div className={`mt-3.5 rounded-xl p-4 md:p-5 space-y-3 ${
        isLight ? 'bg-[#eeeeF2]' : 'bg-[#18181b]'
      }`}>
        <div className="flex items-center justify-between">
          <div className={`text-sm font-semibold ${isLight ? 'text-[#1c1c20]' : 'text-[#e4e4eb]'}`}>
            审美象限判定：<span className="font-bold">{state.title}</span>
          </div>
        </div>
        <p className={`text-xs leading-relaxed ${isLight ? 'text-[#44444a]' : 'text-[#b8b8c2]'}`}>{state.desc}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
          <div className={`rounded-xl p-3.5 ${
            isLight ? 'bg-[#e4e4ea]' : 'bg-[#242429]'
          }`}>
            <span className={`font-medium block mb-1 ${isLight ? 'text-[#1c1c20]' : 'text-[#e0e0e6]'}`}>美学批判视角：</span>
            <span className={`italic ${isLight ? 'text-[#55555c]' : 'text-[#8e8e96]'}`}>{state.critique}</span>
          </div>
          <div className={`rounded-xl p-3.5 ${
            isLight ? 'bg-[#e4e4ea]' : 'bg-[#242429]'
          }`}>
            <span className={`font-medium block mb-1 ${isLight ? 'text-[#1c1c20]' : 'text-[#e0e0e6]'}`}>商业与市场洞察：</span>
            <span className={isLight ? 'text-[#44444a]' : 'text-[#b8b8c2]'}>{state.commercialRisk}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
