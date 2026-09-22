import React, { useState } from 'react';
import { Heart, Activity } from 'lucide-react';

interface HumanTechEmpathyWidgetProps {
  isLight?: boolean;
}

export const HumanTechEmpathyWidget: React.FC<HumanTechEmpathyWidgetProps> = ({ isLight = false }) => {
  const [serenity, setSerenity] = useState<number>(65);
  const [embodiment, setEmbodiment] = useState<number>(70);
  const [inclusivity, setInclusivity] = useState<number>(80);

  const calculateScore = () => {
    return Math.round((serenity * 0.35) + (embodiment * 0.35) + (inclusivity * 0.3));
  };

  const score = calculateScore();

  const getEvaluation = () => {
    if (score < 40) {
      return {
        level: '高异化·注意力绞肉机',
        desc: '产品充斥着红点恐吓、无限信息流与成瘾机制，用户体验处于高度神经紧绷状态。',
        recommendation: '引入“微观弱叙事”与静默模式，去除欺骗性暗黑模式设计。'
      };
    } else if (score < 75) {
      return {
        level: '温和工具·功能主义阶段',
        desc: '具备基本的易用性与可用性，但在精神陪伴与微触觉反馈层面仍显苍白机械。',
        recommendation: '增加对触觉阻尼与环境声学氛围的关照，建立温度连接。'
      };
    } else {
      return {
        level: '人文抗体·具身共鸣容器',
        desc: '产品化作无声的数字诗篇，不仅高效解决问题，更在微秒细节处呵护使用者的尊严与情绪。',
        recommendation: '已达到顶级人文科技产品的共生美学，具备极高品牌忠诚度壁垒。'
      };
    }
  };

  const evalResult = getEvaluation();

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
            <Heart className="h-4 w-4" />
          </div>
          <div>
            <h4 className={`text-sm font-semibold flex items-center gap-2 ${
              isLight ? 'text-[#1c1c20]' : 'text-[#e4e4eb]'
            }`}>
              以人为本：人机共情指数推演 (Empathy Metric)
              <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full ${
                isLight ? 'bg-[#eaebee] text-[#55555c]' : 'bg-[#2d2d33] text-[#a0a0a8]'
              }`}>
                Index
              </span>
            </h4>
            <p className={`text-xs ${isLight ? 'text-[#707076]' : 'text-[#8a8a92]'}`}>
              评估人机交互系统如何以“数字温度”抵抗数字异化与认知过载
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono ${isLight ? 'text-[#707076]' : 'text-[#8a8a92]'}`}>共情总分:</span>
          <span className={`text-lg font-mono font-bold px-2 py-0.5 rounded-md ${
            isLight ? 'bg-[#eeeeF2] text-[#1c1c20]' : 'bg-[#18181b] text-[#dedee4]'
          }`}>
            {score}
          </span>
        </div>
      </div>

      {/* Sliders Grid - No Borders */}
      <div className="mt-3.5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={`p-3.5 rounded-xl space-y-2 ${
          isLight ? 'bg-[#eeeeF2]' : 'bg-[#18181b]'
        }`}>
          <div className="flex justify-between text-xs">
            <span className={`font-medium ${isLight ? 'text-[#1c1c20]' : 'text-[#e4e4eb]'}`}>心理静谧与非侵扰度</span>
            <span className="font-mono font-bold">{serenity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={serenity}
            onChange={(e) => setSerenity(Number(e.target.value))}
            className="w-full h-1.5 bg-[#dcdce2] dark:bg-[#34343a] rounded appearance-none cursor-pointer accent-[#606068] dark:accent-[#cfcfd5]"
          />
          <p className={`text-[11px] ${isLight ? 'text-[#707076]' : 'text-[#7a7a82]'}`}>
            拒绝注意力劫持，让通知像微风般自然无害
          </p>
        </div>

        <div className={`p-3.5 rounded-xl space-y-2 ${
          isLight ? 'bg-[#eeeeF2]' : 'bg-[#18181b]'
        }`}>
          <div className="flex justify-between text-xs">
            <span className={`font-medium ${isLight ? 'text-[#1c1c20]' : 'text-[#e4e4eb]'}`}>具身手感与有机触觉</span>
            <span className="font-mono font-bold">{embodiment}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={embodiment}
            onChange={(e) => setEmbodiment(Number(e.target.value))}
            className="w-full h-1.5 bg-[#dcdce2] dark:bg-[#34343a] rounded appearance-none cursor-pointer accent-[#606068] dark:accent-[#cfcfd5]"
          />
          <p className={`text-[11px] ${isLight ? 'text-[#707076]' : 'text-[#7a7a82]'}`}>
            引入物理阻尼、声音呼吸与自然材料反馈
          </p>
        </div>

        <div className={`p-3.5 rounded-xl space-y-2 ${
          isLight ? 'bg-[#eeeeF2]' : 'bg-[#18181b]'
        }`}>
          <div className="flex justify-between text-xs">
            <span className={`font-medium ${isLight ? 'text-[#1c1c20]' : 'text-[#e4e4eb]'}`}>感官包容与情绪无障碍</span>
            <span className="font-mono font-bold">{inclusivity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={inclusivity}
            onChange={(e) => setInclusivity(Number(e.target.value))}
            className="w-full h-1.5 bg-[#dcdce2] dark:bg-[#34343a] rounded appearance-none cursor-pointer accent-[#606068] dark:accent-[#cfcfd5]"
          />
          <p className={`text-[11px] ${isLight ? 'text-[#707076]' : 'text-[#7a7a82]'}`}>
            照顾不同神经特质（如高敏感人群、视弱群体）
          </p>
        </div>
      </div>

      {/* Outcome Banner - No Borders */}
      <div className={`mt-3.5 rounded-xl p-4 space-y-2.5 ${
        isLight ? 'bg-[#eeeeF2]' : 'bg-[#18181b]'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-mono uppercase tracking-wider ${isLight ? 'text-[#707076]' : 'text-[#8a8a92]'}`}>
            交互抗体诊断
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
            isLight ? 'bg-[#dedee4] text-[#1c1c20]' : 'bg-[#2a2a30] text-[#dedee4]'
          }`}>
            {evalResult.level}
          </span>
        </div>
        <p className={`text-xs leading-relaxed ${isLight ? 'text-[#44444a]' : 'text-[#b8b8c2]'}`}>
          {evalResult.desc}
        </p>
        <div className={`text-xs flex items-center gap-1.5 pt-1 font-serif-sc ${
          isLight ? 'text-[#2c2c30]' : 'text-[#cfcfd6]'
        }`}>
          <Activity className="h-3.5 w-3.5 opacity-60 shrink-0" />
          <span><strong>艺术破局解法：</strong>{evalResult.recommendation}</span>
        </div>
      </div>
    </div>
  );
};
