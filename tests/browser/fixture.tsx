import React, { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MarkdownRenderer } from '../../src/components/MarkdownRenderer';
import '../../src/index.css';
import samples from './diagrams.md?raw';
const documents = import.meta.glob('../../content/**/*.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const parameters = new URLSearchParams(location.search);
const file = parameters.get('file');
const source = file ? documents['../../' + file] : samples;
if (!source) throw new Error('Unknown fixture Markdown');
function Fixture() {
  const [light, setLight] = useState(parameters.get('theme') !== 'dark');
  const [invalid, setInvalid] = useState(parameters.get('invalid') === 'true');
  useEffect(() => { document.documentElement.dataset.theme = light ? 'light' : 'dark'; }, [light]);
  const content = invalid ? '```mermaid\nflowchart TD\nA[broken\n```' : source;
  return <main style={{ width: 'calc(100% - 32px)', maxWidth: 820, margin: '0 auto', padding: '16px 0' }}>
    <div style={{ display: 'flex', gap: 12 }}><button type="button" onClick={() => setLight(value => !value)}>切换测试主题</button><button type="button" onClick={() => setInvalid(false)}>恢复有效图表</button></div>
    <MarkdownRenderer content={content} isLight={light} />
  </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Fixture /></StrictMode>);
