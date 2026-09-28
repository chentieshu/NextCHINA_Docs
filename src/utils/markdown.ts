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

