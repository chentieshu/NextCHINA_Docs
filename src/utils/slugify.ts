import React from 'react';

/**
 * Recursively extracts plain text from any React node/tree
 * Prevents [object Object] artifacts in generated heading IDs
 */
export function getReactNodeText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) {
    return node.map(getReactNodeText).join('');
  }
  if (React.isValidElement(node) && node.props) {
    return getReactNodeText((node.props as { children?: React.ReactNode }).children);
  }
  return '';
}

/**
 * Normalizes heading text into a deterministic, valid DOM element ID
 */
export function markdownInlineText(raw: string): string {
  return raw
    .replace(/!\\[([^\\]]*)\\]\\([^)]*\\)/g, '$1')
    .replace(/\\[([^\\]]+)\\]\\([^)]*\\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_~]/g, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export function slugifyHeading(rawText: string): string {
  return markdownInlineText(rawText)
    .toLowerCase()
    .replace(/[^\\w\\u4e00-\\u9fff-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function extractMarkdownHeadings(content: string, levels: number[] = [2, 3]) {
  const counts = new Map<string, number>();
  const headings: { id: string; text: string; level: number }[] = [];
  let fence: string | null = null;

  for (const line of content.split('\\n')) {
    const fenceMatch = line.match(/^\\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      fence = fence ? null : fenceMatch[1][0];
      continue;
    }
    if (fence) continue;
    const match = line.match(/^\\s{0,3}(#{1,6})\\s+(.+?)\\s*#*\\s*$/);
    if (!match) continue;
    const level = match[1].length;
    if (!levels.includes(level)) continue;
    const text = markdownInlineText(match[2]);
    const base = slugifyHeading(text) || 'section';
    const occurrence = counts.get(base) ?? 0;
    counts.set(base, occurrence + 1);
    headings.push({ id: occurrence === 0 ? base : `${base}-${occurrence + 1}`, text, level });
  }
  return headings;
}

export function createHeadingIdFactory() {
  const counts = new Map<string, number>();
  return (text: string) => {
    const base = slugifyHeading(text) || 'section';
    const occurrence = counts.get(base) ?? 0;
    counts.set(base, occurrence + 1);
    return occurrence === 0 ? base : `${base}-${occurrence + 1}`;
  };
}
