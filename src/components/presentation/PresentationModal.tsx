import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PRESENTATION_SLIDES, SlideItem } from './presentationData';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  ChevronLeft, 
  ChevronRight, 
  Grid, 
  Copy, 
  Check, 
  BookOpen, 
  ArrowRight,
  Code2,
  Play,
  Mic,
  FileText,
  Clock,
  Lightbulb,
  Sparkles,
  Layers,
  GraduationCap,
  Users,
  Compass
} from 'lucide-react';

interface PresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToChapter?: (chapterId: string) => void;
  initialSlideIndex?: number;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({
  isOpen,
  onClose,
  onNavigateToChapter,
  initialSlideIndex = 0
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(initialSlideIndex);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedFullNotes, setCopiedFullNotes] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeSlide: SlideItem = PRESENTATION_SLIDES[currentIdx] || PRESENTATION_SLIDES[0];

  // Request or exit native browser fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      const elem = document.documentElement;
      try {
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(() => {});
        } else if ((elem as any).webkitRequestFullscreen) {
          (elem as any).webkitRequestFullscreen();
        } else if ((elem as any).msRequestFullscreen) {
          (elem as any).msRequestFullscreen();
        }
      } catch (err) {
        // Fallback: isFullscreen state already maximizes within browser window
      }
    } else {
      setIsFullscreen(false);
      try {
        if (document.fullscreenElement) {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
          }
        }
      } catch (err) {}
    }
  }, [isFullscreen]);

  // Sync with native fullscreen changes (e.g. user pressed browser F11 or ESC)
  useEffect(() => {
    const handleNativeFullscreenChange = () => {
      const isNativeFull = !!document.fullscreenElement;
      if (!isNativeFull && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleNativeFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleNativeFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleNativeFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleNativeFullscreenChange);
    };
  }, [isFullscreen]);

  // Handle modal open/close lifecycle
  useEffect(() => {
    if (isOpen) {
      setCurrentIdx(initialSlideIndex);
      setIsFullscreen(false); // Windowed mode first
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
      setShowSpeakerNotes(false);
      setShowThumbnails(false);
    }
  }, [isOpen, initialSlideIndex]);

  // Navigation callbacks
  const nextSlide = useCallback(() => {
    setCurrentIdx(prev => Math.min(PRESENTATION_SLIDES.length - 1, prev + 1));
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIdx(prev => Math.max(0, prev - 1));
  }, []);

  // Keyboard navigation (PPT style)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Backspace') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentIdx(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentIdx(PRESENTATION_SLIDES.length - 1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (showSpeakerNotes) {
          setShowSpeakerNotes(false);
        } else if (showThumbnails) {
          setShowThumbnails(false);
        } else if (isFullscreen) {
          toggleFullscreen();
        } else {
          onClose();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 't' || e.key === 'T' || e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setShowThumbnails(prev => !prev);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setShowSpeakerNotes(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextSlide, prevSlide, onClose, toggleFullscreen, showThumbnails, showSpeakerNotes, isFullscreen]);

  // Auto-hide floating controls on idle (like PowerPoint / Keynote)
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isFullscreen && !showSpeakerNotes) {
        setShowControls(false);
      }
    }, 3200);
  };

  const handleCopyCurrentSpeech = () => {
    const text = `【第 ${currentIdx + 1} 幕：${activeSlide.title}】（预计时长：${activeSlide.estimatedDuration}）\n\n` +
      `● 开场定调：\n${activeSlide.speechNotes.hook}\n\n` +
      `● 核心阐述要点：\n${activeSlide.speechNotes.talkingPoints.map((pt, i) => `${i + 1}. ${pt}`).join('\n')}\n\n` +
      `● 讲者提醒：\n${activeSlide.speechNotes.presenterTip}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyFullDeckSpeech = () => {
    const fullText = PRESENTATION_SLIDES.map((slide, idx) => {
      return `========================================\n` +
        `第 ${idx + 1} 幕：${slide.title} [${slide.category}]\n` +
        `预计时长：${slide.estimatedDuration}\n` +
        `副标题：${slide.subtitle}\n\n` +
        `【演讲开场】\n${slide.speechNotes.hook}\n\n` +
        `【阐述要点】\n${slide.speechNotes.talkingPoints.map((pt, i) => `  ${i + 1}. ${pt}`).join('\n')}\n\n` +
        `【现场建议】\n${slide.speechNotes.presenterTip}\n`;
    }).join('\n\n');

    navigator.clipboard.writeText(fullText);
    setCopiedFullNotes(true);
    setTimeout(() => setCopiedFullNotes(false), 2500);
  };

  if (!isOpen) return null;

  // Render SVG Diagrams (Optimized for 16:9 Slide Canvas)
  const renderDiagram = (type?: string) => {
    if (type === 'tri-circle-loop') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-5 bg-[#14141a] rounded-2xl relative border border-[#242432]">
          <div className="text-[11px] font-mono text-[#9a9aa8] flex items-center gap-1.5 mb-2 self-start">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>三位一体闭环：跨学科协同创作矩阵</span>
          </div>

          <svg className="w-full max-w-[420px] h-48" viewBox="0 0 460 220" fill="none">
            {/* Connecting Glow Paths */}
            <circle cx="160" cy="90" r="70" stroke="#4a4a60" strokeWidth="2" strokeDasharray="5 5" fill="rgba(80, 80, 120, 0.08)" />
            <circle cx="300" cy="90" r="70" stroke="#4a4a60" strokeWidth="2" strokeDasharray="5 5" fill="rgba(80, 80, 120, 0.08)" />
            <circle cx="230" cy="150" r="70" stroke="#4a4a60" strokeWidth="2" strokeDasharray="5 5" fill="rgba(80, 80, 120, 0.08)" />

            {/* Circle 1: 艺术构想 */}
            <circle cx="160" cy="90" r="46" fill="#181824" stroke="#7a7a92" strokeWidth="2" />
            <text x="160" y="85" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="bold">艺术构想</text>
            <text x="160" y="103" fill="#a0a0b2" fontSize="9.5" textAnchor="middle" fontFamily="sans-serif">水彩书画 · 留白尺度</text>

            {/* Circle 2: 技术实现 */}
            <circle cx="300" cy="90" r="46" fill="#181824" stroke="#7a7a92" strokeWidth="2" />
            <text x="300" y="85" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="bold">技术实现</text>
            <text x="300" y="103" fill="#a0a0b2" fontSize="9.5" textAnchor="middle" fontFamily="sans-serif">技术美术 · 图形管线</text>

            {/* Circle 3: 公众体验 */}
            <circle cx="230" cy="150" r="46" fill="#181824" stroke="#7a7a92" strokeWidth="2" />
            <text x="230" y="145" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="bold">公众体验</text>
            <text x="230" y="163" fill="#a0a0b2" fontSize="9.5" textAnchor="middle" fontFamily="sans-serif">交互反馈 · 直觉共鸣</text>

            {/* Center Nexus */}
            <circle cx="230" cy="105" r="16" fill="#ffffff" fillOpacity="0.12" stroke="#e0e0ea" strokeWidth="1.5" />
            <text x="230" y="109" fill="#f0f0f8" fontSize="9" textAnchor="middle" fontWeight="bold">NextCHINA</text>
          </svg>

          <div className="flex items-center justify-between w-full max-w-[420px] text-[10px] font-mono text-[#8a8a9a] pt-1">
            <span>审美引领方向</span>
            <span className="text-[#e2e2ec] font-semibold">● 处于同一创作过程</span>
            <span>体验检验价值</span>
          </div>
        </div>
      );
    }

    if (type === 'tech-matrix') {
      return (
        <div className="w-full h-full flex flex-col justify-center p-5 bg-[#14141a] rounded-2xl relative border border-[#242432]">
          <div className="text-[11px] font-mono text-[#9a9aa8] flex items-center gap-1.5 mb-2.5">
            <Layers className="h-3.5 w-3.5 text-blue-400" />
            <span>全栈媒介支持与图形交付架构</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-[#1b1b24] space-y-1 border border-[#262634]">
              <span className="text-[9.5px] font-mono text-cyan-400 block font-semibold">Web & 3D</span>
              <div className="text-xs font-bold text-[#f0f0f8]">Three.js / WebGL</div>
              <p className="text-[10.5px] text-[#9a9aa8] leading-tight">
                免安装、跨终端、即开即赏的在线互动场景与三维邀请页。
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#1b1b24] space-y-1 border border-[#262634]">
              <span className="text-[9.5px] font-mono text-purple-400 block font-semibold">Motion UI</span>
              <div className="text-xs font-bold text-[#f0f0f8]">Lottie / Rive</div>
              <p className="text-[10.5px] text-[#9a9aa8] leading-tight">
                基于状态机组织自适应交互动效，触控反馈与视觉流转。
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#1b1b24] space-y-1 border border-[#262634]">
              <span className="text-[9.5px] font-mono text-emerald-400 block font-semibold">Real-time</span>
              <div className="text-xs font-bold text-[#f0f0f8]">TouchDesigner</div>
              <p className="text-[10.5px] text-[#9a9aa8] leading-tight">
                现场传感器捕捉、音画联动与生成式现场视听原型。
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#1b1b24] space-y-1 border border-[#262634]">
              <span className="text-[9.5px] font-mono text-amber-400 block font-semibold">Spatial & Engines</span>
              <div className="text-xs font-bold text-[#f0f0f8]">Unity / Unreal / Blender</div>
              <p className="text-[10.5px] text-[#9a9aa8] leading-tight">
                高拟真光影物理漫游，按展示硬件条件量身定制方案。
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'collaboration-synergy') {
      return (
        <div className="w-full h-full flex flex-col justify-center p-5 bg-[#14141a] rounded-2xl relative border border-[#242432]">
          <div className="text-[11px] font-mono text-[#9a9aa8] flex items-center gap-1.5 mb-2.5">
            <GraduationCap className="h-3.5 w-3.5 text-amber-400" />
            <span>三重视角价值协同（Mutual Beneficence）</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div className="p-2.5 rounded-xl bg-[#1a1a24] border border-[#262634] flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-300 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                学
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[#f0f0f8]">对在校学生：触碰真实实战</div>
                <p className="text-[10.5px] text-[#9a9aa8] leading-relaxed">
                  理解真实职业背景下的问题发现、决策取舍与面对不确定性的韧性。
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#1a1a24] border border-[#262634] flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-300 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                教
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[#f0f0f8]">对教师与项目：赋能教学科研</div>
                <p className="text-[10.5px] text-[#9a9aa8] leading-relaxed">
                  洞察前沿产业变迁，发掘有价值的科研课题，搭建外部高质量合作网络。
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#1a1a24] border border-[#262634] flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-300 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                社
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[#f0f0f8]">对社区成员：汲取学术滋养</div>
                <p className="text-[10.5px] text-[#9a9aa8] leading-relaxed">
                  跳出日常商业焦虑，在严肃学术殿堂中重新审视艺术、文化与长期社会价值。
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`fixed inset-0 z-[100] ${
        isFullscreen ? 'bg-black' : 'bg-black/85 backdrop-blur-md'
      } text-[#e0e0e6] select-none flex flex-col items-center justify-center overflow-hidden transition-colors duration-200`}
    >
      {/* WINDOW TITLE BAR (Visible in Windowed Mode, Hidden in Fullscreen) */}
      {!isFullscreen && (
        <div className="w-full max-w-[min(94vw,calc(84vh*16/9),1240px)] flex items-center justify-between px-4 py-2.5 mb-2 bg-[#16161c] rounded-2xl border border-[#242430] text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
            </div>
            <span className="font-semibold text-[#f0f0f5]">NextCHINA · 演示文稿 (PPT)</span>
            <span className="text-[#484858]">•</span>
            <span className="text-[#888898]">{activeSlide.category}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSpeakerNotes(prev => !prev)}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 font-sans ${
                showSpeakerNotes 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium' 
                  : 'bg-[#202028] hover:bg-[#282834] text-[#b0b0be] hover:text-white'
              }`}
              title="切换演讲讲稿与提示 (快捷键: N)"
            >
              <Mic className="h-3 w-3" />
              <span>演讲讲稿 (N)</span>
            </button>
            <button
              onClick={() => setShowThumbnails(true)}
              className="px-2.5 py-1 rounded-lg bg-[#202028] hover:bg-[#282834] text-[#b0b0be] hover:text-white transition-colors flex items-center gap-1.5 font-sans"
              title="查看幻灯片总览 (快捷键: T)"
            >
              <Grid className="h-3 w-3" />
              <span>总览 (T)</span>
            </button>
            <button
              onClick={toggleFullscreen}
              className="px-2.5 py-1 rounded-lg bg-[#202028] hover:bg-[#282834] text-[#b0b0be] hover:text-white transition-colors flex items-center gap-1.5 font-sans"
              title="切换全屏演示 (快捷键: F)"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>全屏播放 (F)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[#282834] text-[#8e8e9c] hover:text-white transition-colors"
              title="退出演示 (ESC)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 
        THE 16:9 SLIDE CANVAS (POWERPOINT / KEYNOTE SLIDE MASTER)
        Using exact 16:9 viewport ratio scaling
      */}
      <div 
        style={{
          width: isFullscreen ? 'min(100vw, calc(100vh * (16 / 9)))' : 'min(94vw, calc(82vh * (16 / 9)), 1240px)',
          height: isFullscreen ? 'min(100vh, calc(100vw * (9 / 16)))' : 'min(82vh, calc(94vw * (9 / 16)), 697.5px)',
        }}
        className={`bg-[#0f0f14] ${
          isFullscreen ? 'rounded-none border-0' : 'rounded-3xl border border-[#22222d] shadow-2xl'
        } relative flex flex-col justify-between overflow-hidden shrink-0 select-none`}
      >
        {/* SLIDE MASTER HEADER */}
        <header className="h-12 px-8 flex items-center justify-between border-b border-[#181822] shrink-0 bg-[#121218]/90 z-20">
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <span className="font-bold tracking-tight text-[#f4f4f8]">
              NextCHINA
            </span>
            <span className="text-[#3a3a46]">•</span>
            <span className="text-[#888898] uppercase tracking-wider text-[11px]">
              {activeSlide.category}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-[#8a8a98] flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-400/80" />
              <span>{activeSlide.estimatedDuration}</span>
            </span>
            <span className="text-[#3a3a46]">•</span>
            <div className="text-[11px] font-mono text-[#6c6c7c] tracking-wider">
              艺术构想 × 技术实现 × 公众体验
            </div>
          </div>
        </header>

        {/* SLIDE MASTER BODY (16:9 Balanced Layout) */}
        <div className="flex-1 px-8 md:px-12 py-6 flex flex-col justify-center relative z-10 overflow-hidden">
          {/* Subtle Ambient Background Gradient */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#36364a] rounded-full blur-[100px]" />
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#20202e] rounded-full blur-[100px]" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full relative z-10">
            {/* Left Content Column */}
            <div className={`${
              activeSlide.diagramType || activeSlide.xmlSnippet ? 'lg:col-span-6' : 'lg:col-span-12'
            } space-y-4`}>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif-sc text-[#f4f4f8] tracking-tight leading-snug">
                  {activeSlide.title}
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-[#9a9aa8] leading-relaxed">
                  {activeSlide.subtitle}
                </p>
              </div>

              {activeSlide.keyQuote && (
                <blockquote className="p-3.5 rounded-xl bg-[#16161d] border-l-2 border-[#5c5c70] text-xs sm:text-sm md:text-base italic font-serif-sc text-[#d8d8e4] leading-relaxed">
                  {activeSlide.keyQuote}
                </blockquote>
              )}

              {activeSlide.bulletPoints && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {activeSlide.bulletPoints.map((bp, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[#15151c] space-y-1 border border-[#20202a]">
                      <div className="text-xs font-bold text-[#f0f0f8] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8a8a9a]" />
                        {bp.label}
                      </div>
                      <p className="text-[11px] text-[#8c8c9a] leading-relaxed">
                        {bp.desc}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Visual Diagram */}
            {activeSlide.diagramType && (
              <div className="lg:col-span-6 h-full flex items-center justify-center">
                {renderDiagram(activeSlide.diagramType)}
              </div>
            )}
          </div>
        </div>

        {/* SLIDE MASTER FOOTER */}
        <footer className="h-11 px-8 flex items-center justify-between border-t border-[#181822] shrink-0 bg-[#121218]/90 z-20 text-xs text-[#707080]">
          <div>
            {activeSlide.chapterRefId && onNavigateToChapter ? (
              <button
                onClick={() => {
                  onNavigateToChapter(activeSlide.chapterRefId!);
                  onClose();
                }}
                className="flex items-center gap-1.5 text-xs text-[#9898a8] hover:text-white transition-colors font-mono"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>精读对应正文章节</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            ) : (
              <span className="font-mono text-[11px] text-[#606070]">
                NextCHINA · 走向人工智能与未来体验
              </span>
            )}
          </div>

          {/* Clean Carousel Indicator Dots */}
          <div className="flex items-center gap-1.5 bg-[#17171f] px-3 py-1 rounded-full border border-[#20202c]">
            {PRESENTATION_SLIDES.map((slide, i) => {
              const isActive = i === currentIdx;
              const isPast = i < currentIdx;

              return (
                <button
                  key={slide.id}
                  onClick={() => setCurrentIdx(i)}
                  className="py-1 px-0.5 group focus:outline-none"
                  title={`第 ${i + 1} 幕：${slide.title}`}
                >
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isActive 
                        ? 'w-7 bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]' 
                        : isPast 
                          ? 'w-2.5 bg-[#545464] group-hover:bg-[#727282]' 
                          : 'w-1.5 bg-[#252530] group-hover:bg-[#3c3c4a]'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-[#6c6c7a]">
            <span>{String(currentIdx + 1).padStart(2, '0')} / {String(PRESENTATION_SLIDES.length).padStart(2, '0')}</span>
          </div>
        </footer>

        {/* CLICK REGIONS FOR PREV / NEXT */}
        <div 
          onClick={prevSlide}
          className={`absolute left-0 top-12 bottom-11 w-12 z-20 flex items-center justify-start pl-2 cursor-pointer transition-opacity ${
            currentIdx === 0 ? 'pointer-events-none opacity-0' : 'opacity-0 hover:opacity-100'
          }`}
          title="上一页"
        >
          <div className="p-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20">
            <ChevronLeft className="h-4 w-4" />
          </div>
        </div>

        <div 
          onClick={nextSlide}
          className={`absolute right-0 top-12 bottom-11 w-12 z-20 flex items-center justify-end pr-2 cursor-pointer transition-opacity ${
            currentIdx === PRESENTATION_SLIDES.length - 1 ? 'pointer-events-none opacity-0' : 'opacity-0 hover:opacity-100'
          }`}
          title="下一页"
        >
          <div className="p-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20">
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* 
        KEYNOTE / PPT FLOATING PRESENTER CONTROLS
      */}
      <div 
        className={`fixed bottom-5 z-50 flex items-center gap-1.5 p-1.5 rounded-full bg-[#16161e]/90 backdrop-blur-md border border-[#2a2a38] shadow-2xl transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <button
          onClick={prevSlide}
          disabled={currentIdx === 0}
          className={`p-2 rounded-full transition-colors ${
            currentIdx === 0 
              ? 'opacity-30 cursor-not-allowed text-[#484856]' 
              : 'hover:bg-[#252532] text-[#dcdce6]'
          }`}
          title="上一页 (← / PageUp)"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="text-xs font-mono text-[#8a8a9a] px-2 select-none">
          {currentIdx + 1} / {PRESENTATION_SLIDES.length}
        </span>

        <button
          onClick={nextSlide}
          disabled={currentIdx === PRESENTATION_SLIDES.length - 1}
          className={`p-2 rounded-full transition-colors ${
            currentIdx === PRESENTATION_SLIDES.length - 1 
              ? 'opacity-30 cursor-not-allowed text-[#484856]' 
              : 'hover:bg-[#252532] text-[#dcdce6]'
          }`}
          title="下一页 (→ / Space / PageDown)"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <span className="w-px h-4 bg-[#2e2e3e] mx-1" />

        <button
          onClick={() => setShowSpeakerNotes(prev => !prev)}
          className={`p-2 rounded-full text-xs transition-colors ${
            showSpeakerNotes ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'hover:bg-[#252532] text-[#9a9aa8]'
          }`}
          title="演讲讲稿与提示 (N)"
        >
          <Mic className="h-4 w-4" />
        </button>

        <button
          onClick={() => setShowThumbnails(prev => !prev)}
          className={`p-2 rounded-full text-xs transition-colors ${
            showThumbnails ? 'bg-[#2a2a38] text-white' : 'hover:bg-[#252532] text-[#9a9aa8]'
          }`}
          title="幻灯片总览 (T / G)"
        >
          <Grid className="h-4 w-4" />
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-full text-xs hover:bg-[#252532] text-[#9a9aa8] transition-colors"
          title={isFullscreen ? '还原窗口模式 (F)' : '全屏播放 (F / F11)'}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>

        <button
          onClick={onClose}
          className="p-2 rounded-full text-xs hover:bg-[#252532] text-[#9a9aa8] transition-colors"
          title="退出 (ESC)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 
        SPEAKER NOTES & TALKING POINTS DRAWER (Shortcut: N)
      */}
      {showSpeakerNotes && (
        <div 
          onClick={() => setShowSpeakerNotes(false)}
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-end p-4 sm:p-8 animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[#14141c] rounded-3xl p-6 border border-[#2b2b3b] shadow-2xl flex flex-col max-h-[90vh] text-left overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#222230] mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-300">
                  <Mic className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#f0f0f8] flex items-center gap-2 font-sans">
                    <span>讲者提词与演讲台词</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#20202c] text-[#8e8e9e]">
                      第 {currentIdx + 1} / {PRESENTATION_SLIDES.length} 幕
                    </span>
                  </h3>
                  <div className="text-[11px] text-[#8e8e9e] font-mono flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3 w-3 text-amber-400" />
                    <span>预计时长：{activeSlide.estimatedDuration}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyCurrentSpeech}
                  className="px-2.5 py-1 rounded-lg bg-[#20202c] hover:bg-[#2a2a3a] text-xs font-mono text-[#b0b0c2] hover:text-white transition-colors flex items-center gap-1"
                  title="复制本页台词"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? '已复制' : '复制本页'}</span>
                </button>
                <button
                  onClick={() => setShowSpeakerNotes(false)}
                  className="p-1.5 rounded-lg hover:bg-[#202028] text-[#8e8e98]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Script Body */}
            <div className="space-y-4 overflow-y-auto p-1 pr-2 scrollbar-none flex-1">
              {/* Slide Title Reference */}
              <div className="p-3 rounded-2xl bg-[#1b1b24] border border-[#262634]">
                <div className="text-[10px] font-mono text-[#8c8c9e] uppercase tracking-wider mb-0.5">
                  {activeSlide.category}
                </div>
                <div className="text-sm font-bold text-[#f5f5fa]">
                  {activeSlide.title}
                </div>
                <div className="text-xs text-[#9a9aa8] mt-0.5">
                  {activeSlide.subtitle}
                </div>
              </div>

              {/* 1. Speech Hook */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>演讲开场与导语 (Hook)</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs sm:text-sm text-[#e8e8f0] leading-relaxed font-serif-sc">
                  “{activeSlide.speechNotes.hook}”
                </div>
              </div>

              {/* 2. Talking Points */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#d0d0dc]">
                  <FileText className="h-3.5 w-3.5 text-blue-400" />
                  <span>核心阐述要点 (Talking Points)</span>
                </div>
                <div className="space-y-2">
                  {activeSlide.speechNotes.talkingPoints.map((pt, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#171720] border border-[#22222e] flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#242434] text-xs font-mono font-bold text-[#b0b0c2] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-[#cfcfe0] leading-relaxed flex-1">
                        {pt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Presenter Tip */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span>现场台风与互动建议 (Presenter Tip)</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-[#c2dfc8] leading-relaxed">
                  💡 {activeSlide.speechNotes.presenterTip}
                </div>
              </div>
            </div>

            {/* Footer Options */}
            <div className="pt-3 border-t border-[#222230] flex items-center justify-between text-xs">
              <button
                onClick={handleCopyFullDeckSpeech}
                className="px-3 py-1.5 rounded-xl bg-[#1e1e2a] hover:bg-[#282838] text-[#a0a0b8] hover:text-white transition-colors flex items-center gap-1.5 font-mono text-[11px]"
              >
                {copiedFullNotes ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedFullNotes ? '全套讲稿已复制到剪贴板！' : '导出 12 幕完整演讲大纲'}</span>
              </button>

              <span className="text-[10.5px] font-mono text-[#686878]">
                按 N 键随时收起
              </span>
            </div>
          </div>
        </div>
      )}

      {/* THUMBNAIL OVERVIEW DRAWER (T / G) */}
      {showThumbnails && (
        <div 
          onClick={() => setShowThumbnails(false)}
          className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md p-6 sm:p-10 flex flex-col justify-center animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl mx-auto bg-[#131317] rounded-3xl p-6 border border-[#242430] shadow-2xl flex flex-col max-h-[85vh]"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#202028] mb-4">
              <div className="flex items-center gap-2">
                <Grid className="h-4 w-4 text-[#8a8a98]" />
                <span className="font-bold text-sm font-sans text-[#f0f0f5]">
                  全幕幻灯片总览 (Overview)
                </span>
                <span className="text-xs font-mono text-[#787884]">
                  共 {PRESENTATION_SLIDES.length} 幕
                </span>
              </div>
              <button
                onClick={() => setShowThumbnails(false)}
                className="p-1.5 rounded-lg hover:bg-[#202028] text-[#8e8e98]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 overflow-y-auto p-1 scrollbar-none">
              {PRESENTATION_SLIDES.map((slide, idx) => (
                <div
                  key={slide.id}
                  onClick={() => {
                    setCurrentIdx(idx);
                    setShowThumbnails(false);
                  }}
                  className={`p-3.5 rounded-xl cursor-pointer text-left transition-all border ${
                    idx === currentIdx
                      ? 'bg-[#22222e] border-[#7a7a8c] shadow-md ring-1 ring-[#7a7a8c]'
                      : 'bg-[#17171e] border-[#222228] hover:border-[#383844] hover:bg-[#1d1d26]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#7e7e8c] mb-1.5">
                    <span className="font-bold">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="text-[9.5px] text-[#9a9aa8]">
                      {slide.estimatedDuration}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-[#eeeeF6] line-clamp-1 mb-1">
                    {slide.title}
                  </h4>
                  <p className="text-[11px] text-[#888894] line-clamp-2 leading-relaxed">
                    {slide.subtitle}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
