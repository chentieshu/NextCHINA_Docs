import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, Eye, Volume2 } from 'lucide-react';

interface MicroPhenomenon {
  id: string;
  name: string;
  scale: string;
  scientificReality: string;
  artisticTransformation: string;
  source: string;
  speed: number;
}

const PHENOMENA: MicroPhenomenon[] = [
  {
    id: 'synapse',
    name: '神经突触离子闪烁 (Synaptic Spark)',
    scale: '20 纳米 (nm)',
    scientificReality: '乙酰胆碱与多巴胺在突触间隙由电势差驱动的快速扩散与跨膜涌流，本质为微弱物理化学梯度。',
    artisticTransformation: '通过粒子场与空间混响将突触放电视为微观星群的闪烁，使不可见的思绪流动具象化为诗意水墨。',
    source: '神经美学 / 生物传感装置',
    speed: 1.2
  },
  {
    id: 'latent',
    name: '潜空间向量扰动 (Latent Topology)',
    scale: '高维数学流形 (1024-dim)',
    scientificReality: '深度神经网络权重向量在万维空间中的余弦距离变化与几何插值，普通人无法直接目视高维数学拓扑。',
    artisticTransformation: '降维投影为动态雕塑与有机呼吸流体，让观者直视大模型潜意识的审美选择震荡。',
    source: '生成艺术 / 潜空间声学化',
    speed: 0.8
  },
  {
    id: 'quantum',
    name: '量子真空零点涨落 (Zero-Point Fluctuation)',
    scale: '普朗克尺度 (10⁻³⁵ m)',
    scientificReality: '真空并非空无一物，虚粒子对在极微尺度瞬间创生并湮灭的不确定性起伏。',
    artisticTransformation: '黑白噪波（Glitch）与微弱白噪音的律动，成为当代艺术家表达“存在之虚妄与丰盈”的终极隐喻。',
    source: '推测性物理学装置',
    speed: 1.5
  },
  {
    id: 'ferrofluid',
    name: '纳米磁流体尖峰 (Magnetic Spikes)',
    scale: '10 纳米磁性胶体颗粒',
    scientificReality: '表面张力与外加磁场能量的动态博弈，促使液体自组织形成尖锐的拓扑刺猬锥体。',
    artisticTransformation: '如同拥有生命的有机黑色雕塑随音乐心跳起伏，具身化展示无形电磁力场的威严重力。',
    source: '动力机械装置（儿玉幸子等）',
    speed: 1.0
  }
];

interface MicrocosmVisualizerWidgetProps {
  isLight?: boolean;
}

export const MicrocosmVisualizerWidget: React.FC<MicrocosmVisualizerWidgetProps> = ({ isLight = false }) => {
  const [selectedId, setSelectedId] = useState<string>('synapse');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [sensoryMode, setSensoryMode] = useState<'visual' | 'waveform'>('visual');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const active = PHENOMENA.find(p => p.id === selectedId) || PHENOMENA[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Set canvas dimensions
    const width = canvas.width = canvas.parentElement?.clientWidth || 500;
    const height = canvas.height = 200;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      baseAlpha: number;
    }

    const particleCount = 45;
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.5 * active.speed,
      vy: (Math.random() - 0.5) * 1.5 * active.speed,
      size: Math.random() * 3 + 1,
      baseAlpha: Math.random() * 0.7 + 0.3
    }));

    const render = () => {
      time += 0.02 * active.speed;
      ctx.fillStyle = isLight ? 'rgba(238, 238, 242, 0.4)' : 'rgba(22, 22, 25, 0.4)';
      ctx.fillRect(0, 0, width, height);

      const strokeColor = isLight ? '#55555e' : '#cfcfd6';
      const particleColor = isLight ? '#44444c' : '#dcdce2';

      // Render custom artistic visualization based on phenomenon
      particles.forEach((p, idx) => {
        p.x += p.vx * (zoomLevel / 80);
        p.y += p.vy * (zoomLevel / 80);

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Draw connections
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 65 * (zoomLevel / 100)) {
            ctx.beginPath();
            ctx.strokeStyle = strokeColor;
            ctx.globalAlpha = (1 - dist / (65 * (zoomLevel / 100))) * (isLight ? 0.2 : 0.3);
            ctx.lineWidth = 0.8;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Draw core node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (zoomLevel / 100), 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.globalAlpha = p.baseAlpha * 0.85;
        ctx.fill();
      });

      // Sensory waveform overlay if in waveform mode
      if (sensoryMode === 'waveform') {
        ctx.beginPath();
        ctx.strokeStyle = strokeColor;
        ctx.globalAlpha = isLight ? 0.5 : 0.55;
        ctx.lineWidth = 1.2;
        for (let x = 0; x < width; x += 3) {
          const y = height / 2 + Math.sin(x * 0.03 + time * 3) * 18 * Math.cos(x * 0.01 + time);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [active, zoomLevel, sensoryMode, isLight]);

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
            <ZoomIn className="h-4 w-4" />
          </div>
          <div>
            <h4 className={`text-sm font-semibold flex items-center gap-2 ${
              isLight ? 'text-[#1c1c20]' : 'text-[#e4e4eb]'
            }`}>
              微观显影仪：把隐匿的微观秩序转化为艺术直觉
              <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full ${
                isLight ? 'bg-[#eaebee] text-[#55555c]' : 'bg-[#2d2d33] text-[#a0a0a8]'
              }`}>
                Microcosm
              </span>
            </h4>
            <p className={`text-xs ${isLight ? 'text-[#707076]' : 'text-[#8a8a92]'}`}>
              选择不同尺度的微观现象，探究艺术如何破除宏大遮蔽、唤醒感官直觉
            </p>
          </div>
        </div>

        {/* Sensory Mode toggles - No Borders */}
        <div className={`flex items-center gap-1.5 p-1 rounded-lg text-xs ${
          isLight ? 'bg-[#eeeeF2]' : 'bg-[#18181b]'
        }`}>
          <button
            onClick={() => setSensoryMode('visual')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
              sensoryMode === 'visual' 
                ? (isLight ? 'bg-[#dedee4] text-[#1c1c20] font-medium' : 'bg-[#303036] text-[#ededf4] font-medium')
                : (isLight ? 'text-[#606068] hover:text-[#1c1c20]' : 'text-[#8a8a92] hover:text-[#e4e4eb]')
            }`}
          >
            <Eye className="h-3 w-3" /> 拓扑流场
          </button>
          <button
            onClick={() => setSensoryMode('waveform')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
              sensoryMode === 'waveform' 
                ? (isLight ? 'bg-[#dedee4] text-[#1c1c20] font-medium' : 'bg-[#303036] text-[#ededf4] font-medium')
                : (isLight ? 'text-[#606068] hover:text-[#1c1c20]' : 'text-[#8a8a92] hover:text-[#e4e4eb]')
            }`}
          >
            <Volume2 className="h-3 w-3" /> 声觉化波动
          </button>
        </div>
      </div>

      {/* Phenomenon selection tabs - No Borders */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {PHENOMENA.map(p => {
          const isSelected = selectedId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isSelected
                  ? isLight
                    ? 'bg-[#dedee4] text-[#1a1a1e]'
                    : 'bg-[#303036] text-[#ededf4]'
                  : isLight
                    ? 'bg-[#eeeeF2] hover:bg-[#e4e4e9] text-[#55555c]'
                    : 'bg-[#18181b] hover:bg-[#242429] text-[#8e8e96]'
              }`}
            >
              {p.name.split(' ')[0]}
            </button>
          );
        })}
      </div>

      {/* Canvas Container - No Borders */}
      <div className={`mt-3 relative rounded-xl overflow-hidden ${
        isLight ? 'bg-[#eeeeF2]' : 'bg-[#161619]'
      }`}>
        <canvas ref={canvasRef} className="w-full h-[180px] block" />
        
        {/* Overlay Badges */}
        <div className="absolute top-2.5 left-3 flex items-center gap-2">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-md ${
            isLight 
              ? 'bg-[#ffffff]/85 text-[#2c2c30]' 
              : 'bg-[#000000]/60 text-[#d0d0d8]'
          }`}>
            尺度：{active.scale}
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-md ${
            isLight 
              ? 'bg-[#ffffff]/85 text-[#55555c]' 
              : 'bg-[#000000]/60 text-[#a0a0a8]'
          }`}>
            {active.source}
          </span>
        </div>

        {/* Zoom slider overlay */}
        <div className={`absolute bottom-2.5 right-3 flex items-center gap-2 backdrop-blur-md px-2.5 py-1 rounded-md ${
          isLight ? 'bg-[#ffffff]/90 text-[#2c2c30]' : 'bg-[#000000]/70 text-[#d0d0d8]'
        }`}>
          <span className={`text-[10px] ${isLight ? 'text-[#707076]' : 'text-[#8a8a92]'}`}>显微倍率:</span>
          <input
            type="range"
            min="50"
            max="160"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="w-16 h-1 bg-[#dcdce0] dark:bg-[#34343a] rounded appearance-none cursor-pointer accent-[#606068] dark:accent-[#cfcfd5]"
          />
          <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-[#1c1c20]' : 'text-[#e4e4eb]'}`}>
            {zoomLevel}%
          </span>
        </div>
      </div>

      {/* Narrative breakdown - No Borders */}
      <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className={`rounded-xl p-3.5 ${
          isLight ? 'bg-[#eeeeF2]' : 'bg-[#18181b]'
        }`}>
          <span className={`font-semibold block mb-1 ${isLight ? 'text-[#1c1c20]' : 'text-[#e0e0e6]'}`}>
            物理/数学实相 (无感状态)：
          </span>
          <p className={`leading-relaxed ${isLight ? 'text-[#44444a]' : 'text-[#a0a0a8]'}`}>
            {active.scientificReality}
          </p>
        </div>
        <div className={`rounded-xl p-3.5 ${
          isLight ? 'bg-[#e4e4ea]' : 'bg-[#242429]'
        }`}>
          <span className={`font-semibold block mb-1 ${isLight ? 'text-[#1c1c20]' : 'text-[#e0e0e6]'}`}>
            艺术转译后的直观感知 (审美唤醒)：
          </span>
          <p className={`leading-relaxed font-serif-sc ${isLight ? 'text-[#2c2c30]' : 'text-[#cfcfd6]'}`}>
            {active.artisticTransformation}
          </p>
        </div>
      </div>
    </div>
  );
};
