import React from 'react';
import GithubSlugger from 'github-slugger';

export interface MarkdownHeading {
  id: string;
  text: string;
  level: number;
}

export function getReactNodeText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(getReactNodeText).join('');
  if (React.isValidElement(node)) {
    return getReactNodeText((node.props as { children?: React.ReactNode }).children);
  }
  return '';
}

export function markdownInlineText(raw: string): string {
  return raw
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<((?:https?:\/\/|mailto:)[^>]+)>/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\\([\\`*{}\[\]()#+\-.!_>~|])/g, '$1')
    .replace(/[*_~]/g, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export function createMarkdownSlugger() {
  return new GithubSlugger();
}

export function extractMarkdownHeadings(content: string, levels: number[] = [2, 3]): MarkdownHeading[] {
  const slugger = createMarkdownSlugger();
  const headings: MarkdownHeading[] = [];
  const lines = content.split('\n');
  let fenceMarker: '`' | '~' | null = null;

  const pushHeading = (raw: string, level: number) => {
    if (!levels.includes(level)) return;
    const text = markdownInlineText(raw);
    if (!text) return;
    headings.push({ id: slugger.slug(text), text, level });
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0] as '`' | '~';
      fenceMarker = fenceMarker === null ? marker : fenceMarker === marker ? null : fenceMarker;
      continue;
    }
    if (fenceMarker) continue;

    const atx = line.match(/^\s{0,3}(#{1,6})(?:[ \t]+|$)(.*?)(?:[ \t]+#+[ \t]*)?$/);
    if (atx) {
      pushHeading(atx[2], atx[1].length);
      continue;
    }

    if (index + 1 < lines.length && line.trim()) {
      const setext = lines[index + 1].match(/^\s{0,3}(=+|-+)\s*$/);
      if (setext) {
        pushHeading(line.trim(), setext[1][0] === '=' ? 1 : 2);
        index += 1;
      }
    }
  }

  return headings;
}
