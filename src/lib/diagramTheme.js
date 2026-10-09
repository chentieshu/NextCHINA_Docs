/** One versioned Mermaid theme for both build-time SVG and dynamic previews. */
export const DIAGRAM_THEME_VERSION = 'reader-2026-10-09-v1';
export function diagramTheme(light) {
  const c = light ? {
    background: '#ffffff', text: '#273549', border: '#b5c5d9', line: '#8294aa',
    primary: '#edf4ff', secondary: '#ecf8f4', tertiary: '#f2f0fc', soft: '#f6f8fb',
    accent: '#426ea6', active: '#d7e8fc', done: '#dcefe7', critical: '#fae4e4',
  } : {
    background: '#1b1b20', text: '#e1e7f0', border: '#52657e', line: '#93a5bd',
    primary: '#27384f', secondary: '#233e38', tertiary: '#36304d', soft: '#232831',
    accent: '#a4c9ff', active: '#345675', done: '#305449', critical: '#643d45',
  };
  return {
    startOnLoad: false, securityLevel: 'strict', suppressErrorRendering: true,
    theme: 'base', deterministicIds: true,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans CJK SC", "PingFang SC", sans-serif',
    flowchart: { htmlLabels: false, useMaxWidth: false, curve: 'basis', nodeSpacing: 32, rankSpacing: 42, padding: 16 },
    sequence: { useMaxWidth: false, actorMargin: 45, boxMargin: 12, messageMargin: 28 },
    gantt: { useMaxWidth: false, barHeight: 24, barGap: 8, topPadding: 46, leftPadding: 110, fontSize: 13, sectionFontSize: 13 },
    themeVariables: {
      darkMode: !light, background: c.background, fontSize: '15px',
      primaryColor: c.primary, primaryTextColor: c.text, primaryBorderColor: c.border,
      secondaryColor: c.secondary, secondaryTextColor: c.text, secondaryBorderColor: c.border,
      tertiaryColor: c.tertiary, tertiaryTextColor: c.text, tertiaryBorderColor: c.border,
      lineColor: c.line, textColor: c.text, mainBkg: c.primary, nodeBorder: c.border,
      clusterBkg: c.soft, clusterBorder: c.border, titleColor: c.text,
      edgeLabelBackground: c.background, actorBkg: c.primary, actorBorder: c.border,
      actorTextColor: c.text, actorLineColor: c.line, signalColor: c.text,
      signalTextColor: c.text, labelBoxBkgColor: c.soft, labelBoxBorderColor: c.border,
      labelTextColor: c.text, noteBkgColor: c.secondary, noteTextColor: c.text, noteBorderColor: c.border,
      sectionBkgColor: c.soft, altSectionBkgColor: c.background, sectionBkgColor2: c.soft,
      taskBkgColor: c.primary, taskBorderColor: c.border, taskTextColor: c.text,
      taskTextOutsideColor: c.text, taskTextLightColor: c.text, taskTextDarkColor: c.text,
      activeTaskBkgColor: c.active, activeTaskBorderColor: c.accent,
      doneTaskBkgColor: c.done, doneTaskBorderColor: c.border,
      critBkgColor: c.critical, critBorderColor: c.border, gridColor: c.border, todayLineColor: c.accent,
    },
    themeCSS: '.node rect, .cluster rect, .actor, .task { rx: 7px; ry: 7px; } .flowchart-link { stroke-width: 1.3px; } .section { opacity: .5; } text { font-variant-numeric: tabular-nums; } * { box-shadow: none !important; text-shadow: none !important; filter: none !important; }',
  };
}
export function diagramLabel(chart) {
  const type = chart.trim().replace(/^(?:%%[^\n]*\n\s*)*/, '').split(/[\s\n]/)[0];
  return ({ flowchart: '流程图', graph: '流程图', gantt: '甘特图', sequenceDiagram: '时序图', classDiagram: '类图', stateDiagram: '状态图', 'stateDiagram-v2': '状态图', erDiagram: '实体关系图', pie: '饼图', mindmap: '思维导图', timeline: '时间线', journey: '用户旅程', gitGraph: '分支图' })[type] ?? '图表';
}
