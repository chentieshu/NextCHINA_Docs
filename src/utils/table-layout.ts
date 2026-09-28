import { nodeText, type MarkdownNode } from './markdown';

export interface TableColumn {
  kind: 'numeric' | 'date' | 'text';
  minimum: number;
  preferred: number;
}
export interface TableLayout {
  columns: number;
  kind: 'narrow' | 'standard' | 'wide';
  tracks: TableColumn[];
}
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
/** Approximate visible text in em, not UTF-16 length. This is a readability
 * budget, not an assertion that we measured the font or that a column is money. */
function textWidth(value: string): number {
  return [...value].reduce((sum, ch) => sum + (/\p{Mark}/u.test(ch) ? 0 : /[\u2e80-\u9fff\uac00-\ud7af\uff00-\uffef]|\p{Extended_Pictographic}/u.test(ch) ? 1 : .56), 0);
}
function visibleText(node?: MarkdownNode): string {
  if (!node) return '';
  const classes = node.properties?.className;
  // KaTeX contains accessible MathML AND visual HTML. Count a single TeX
  // annotation rather than concatenating three representations of one formula.
  if (Array.isArray(classes) && classes.includes('katex')) {
    const annotation = (item: MarkdownNode): string => item.tagName === 'annotation' ? nodeText(item) : (item.children ?? []).map(annotation).join('');
    return annotation(node);
  }
  if (node.type === 'text' || node.tagName === 'img') return nodeText(node);
  return (node.children ?? []).map(visibleText).join('');
}
export function tableLayoutFromText(headers: string[], rows: string[][]): TableLayout {
  const columns = Math.max(1, headers.length, ...rows.map(row => row.length));
  const tracks = Array.from({ length: columns }, (_, i): TableColumn => {
    const values = rows.map(row => (row[i] ?? '').trim()).filter(value => value && !/^(?:—|–|-|N\/A)$/i.test(value));
    const numeric = values.length > 0 && values.every(value => /^[+−-]?(?:\d[\d,.]*|\.\d+)(?:\s*[%％])?$/.test(value));
    const date = values.length > 0 && values.every(value => /^\d{4}-\d{2}-\d{2}$/.test(value));
    const header = textWidth(headers[i] ?? '');
    const longest = Math.max(0, ...values.map(textWidth));
    const kind = numeric ? 'numeric' : date ? 'date' : 'text';
    // 1em padding on each side, plus border and subpixel rounding room.
    const gutter = 2.25;
    const minimum = kind === 'numeric' ? clamp(Math.max(longest + gutter, header / 2 + gutter), 4.25, 10)
      : kind === 'date' ? 8.25 : clamp(Math.max(header / 2 + gutter, Math.min(longest + gutter, 10)), 6, 12);
    const preferred = Math.max(minimum, kind === 'text' ? clamp(Math.max(header, longest) + gutter, 8, 26) : Math.max(longest, Math.min(header, 10)) + gutter);
    return { kind, minimum, preferred };
  });
  return { columns, kind: columns <= 2 ? 'narrow' : columns <= 4 ? 'standard' : 'wide', tracks };
}
export function measureTable(node?: MarkdownNode): TableLayout {
  const rows: string[][] = [];
  const visit = (item: MarkdownNode) => {
    if (item.tagName === 'tr') {
      rows.push((item.children ?? []).filter(child => child.tagName === 'th' || child.tagName === 'td').map(visibleText));
    } else item.children?.forEach(visit);
  };
  if (node) visit(node);
  return tableLayoutFromText(rows[0] ?? [], rows.slice(1));
}
/** Sum is exactly max(available, minimum). Numeric/date columns stop growing
 * once comfortable; spare room goes to prose. One/two columns fit small readers. */
export function allocateTableColumns(layout: TableLayout, available: number): number[] {
  const tracks = layout.tracks;
  if (!Number.isFinite(available) || available <= 0) return tracks.map(track => track.preferred);
  const minimum = tracks.reduce((sum, track) => sum + track.minimum, 0);
  if (layout.columns <= 2 && available < minimum) return tracks.map(track => available * track.minimum / minimum);
  const target = Math.max(available, minimum);
  const result = tracks.map(track => track.minimum);
  let extra = target - minimum;
  const needs = tracks.map(track => track.preferred - track.minimum);
  const need = needs.reduce((a, b) => a + b, 0);
  const toPreferred = Math.min(extra, need);
  if (need > 0) result.forEach((_, index) => { result[index] += toPreferred * needs[index] / need; });
  extra -= toPreferred;
  const flexible = tracks.map((track, index) => track.kind === 'text' ? index : -1).filter(index => index >= 0);
  // Short names/status labels should not receive the same expansion as prose.
  // Prefer genuinely long text columns once their comfortable sizes are met.
  const longest = Math.max(0, ...flexible.map(index => tracks[index].preferred));
  const prose = flexible.filter(index => tracks[index].preferred >= 18 && tracks[index].preferred >= longest * .8);
  const grow = prose.length ? prose : flexible.length ? flexible : tracks.map((_, index) => index);
  const weight = grow.reduce((sum, index) => sum + tracks[index].preferred, 0);
  grow.forEach(index => { result[index] += extra * tracks[index].preferred / weight; });
  return result;
}
