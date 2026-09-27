import GithubSlugger from 'github-slugger';

/** The small HAST surface used here; no second Markdown parser is needed. */
export interface MarkdownNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: MarkdownNode[];
}

export function nodeText(node?: MarkdownNode): string {
  if (!node) return '';
  if (node.type === 'text') return node.value ?? '';
  if (node.tagName === 'img') return String(node.properties?.alt ?? '');
  return (node.children ?? []).map(nodeText).join('');
}

/** Run before KaTeX: one slugger per syntax tree, never per React render. */
export function rehypeDocumentHeadings() {
  return (tree: MarkdownNode) => {
    const slugger = new GithubSlugger();
    const visit = (node: MarkdownNode) => {
      if (node.tagName && /^h[1-6]$/.test(node.tagName)) {
        node.properties ??= {};
        // Preserve IDs used by GFM footnotes and other trusted plugins.
        if (!node.properties.id) node.properties.id = slugger.slug(nodeText(node).trim() || 'section');
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

export function codeBlock(node?: MarkdownNode) {
  const code = node?.children?.find(child => child.tagName === 'code');
  if (!code) return null;
  const classes = code.properties?.className;
  const languageClass = (Array.isArray(classes) ? classes : String(classes ?? '').split(/\s+/))
    .find(value => String(value).startsWith('language-'));
  return {
    // Keep the final newline: copying a code block must not modify its contents.
    text: nodeText(code),
    language: languageClass ? String(languageClass).slice(9).toLowerCase() : '',
  };
}

/** Read columns from HAST, not React children (custom components change their types). */
export function tableLayout(node?: MarkdownNode) {
  const rows: MarkdownNode[][] = [];
  const visit = (item: MarkdownNode) => {
    if (item.tagName === 'tr') {
      rows.push((item.children ?? []).filter(child => child.tagName === 'th' || child.tagName === 'td'));
      return;
    }
    item.children?.forEach(visit);
  };
  if (node) visit(node);
  const columns = Math.max(1, ...rows.map(row => row.length));
  const widths = Array.from({ length: columns }, (_, index) => {
    const values = rows.slice(1).map(row => nodeText(row[index]).trim()).filter(Boolean);
    const header = nodeText(rows[0]?.[index]);
    const numeric = values.length > 0 && values.every(value => /^[+−-]?[\d,.]+(?:\s*[%％])?$/.test(value));
    const length = Math.max(header.length, ...values.map(value => value.length));
    // Readability budgets, not measured pixels: actual wrapping is still the browser's job.
    return numeric ? Math.max(4.5, Math.min(7, header.length * 0.7 + 1.5))
      : length <= 8 ? 6 : length <= 22 ? 8 : 13;
  });
  return {
    columns,
    widths,
    minimumRem: columns <= 2 ? 0 : widths.reduce((sum, width) => sum + width, 0),
    kind: columns <= 2 ? 'narrow' : columns <= 4 ? 'standard' : 'wide',
  };
}
