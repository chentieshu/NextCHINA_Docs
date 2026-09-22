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
export function slugifyHeading(rawText: string): string {
  return rawText
    .toLowerCase()
    .replace(/[*_`>#~]/g, '')
    .trim()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
