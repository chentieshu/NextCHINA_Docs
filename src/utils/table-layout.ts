import { nodeText, type MarkdownNode } from './markdown';

export interface TableColumn {
  kind: 'numeric' | 'date' | 'text';
  content: 'label' | 'prose';
  shortHeader: boolean;
}
export interface TableLayout {
  columns: number;
  kind: 'narrow' | 'standard' | 'wide';
  tracks: TableColumn[];
}
/** Classify content, never guess pixel widths. The browser owns column sizing. */
function visibleText(node?: MarkdownNode): string {
  if (!node) return '';
  const classes = node.properties?.className;
  if (Array.isArray(classes) && classes.includes('katex')) {
    const annotation = (item: MarkdownNode): string => item.tagName === 'annotation'
      ? nodeText(item) : (item.children ?? []).map(annotation).join('');
    return annotation(node);
  }
  if (node.tagName === 'br') return '\n';
  if (node.type === 'text' || node.tagName === 'img') return nodeText(node);
  return (node.children ?? []).map(visibleText).join('');
}
export function tableLayoutFromText(headers: string[], rows: string[][]): TableLayout {
  const columns = Math.max(1, headers.length, ...rows.map(row => row.length));
  const tracks = Array.from({ length: columns }, (_, i): TableColumn => {
    const values = rows.map(row => (row[i] ?? '').trim())
      .filter(value => value && !/^(?:—|–|-|N\/A)$/i.test(value));
    const numeric = values.length > 0 && values.every(value => /^[+−-]?(?:\d[\d,.]*|\.\d+)(?:\s*[%％])?$/.test(value));
    const date = values.length > 0 && values.every(value => /^\d{4}-\d{2}-\d{2}$/.test(value));
    return {
      kind: numeric ? 'numeric' : date ? 'date' : 'text',
      content: values.some(value => [...value].length > 36 || value.includes('\n')) ? 'prose' : 'label',
      shortHeader: [...(headers[i] ?? '')].length <= 12 && !(headers[i] ?? '').includes('\n'),
    };
  });
  return { columns, kind: columns <= 2 ? 'narrow' : columns <= 4 ? 'standard' : 'wide', tracks };
}
export function measureTable(node?: MarkdownNode): TableLayout {
  const rows: string[][] = [];
  const visit = (item: MarkdownNode) => {
    if (item.tagName === 'tr') rows.push((item.children ?? [])
      .filter(child => child.tagName === 'th' || child.tagName === 'td').map(visibleText));
    else item.children?.forEach(visit);
  };
  if (node) visit(node);
  return tableLayoutFromText(rows[0] ?? [], rows.slice(1));
}
