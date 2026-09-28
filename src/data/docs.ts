import { DOC_CHAPTERS as generatedChapters } from './generated-docs';

/**
 * JSON research fields contain literal prices, not TeX. Escape currency at this
 * output boundary so two prices in one paragraph cannot open an inline formula.
 * Already-escaped prices are untouched. Hand-authored mathematical MD articles
 * are loaded separately by essays.ts and never pass through this function.
 */
export function escapeResearchCurrency(content: string): string {
  return content.replace(/(?<!\\)\$(?=\d)/g, '\\$');
}

export const DOC_CHAPTERS = generatedChapters.map(chapter => ({
  ...chapter,
  readingLayout: 'reference' as const,
  content: escapeResearchCurrency(chapter.content),
}));
