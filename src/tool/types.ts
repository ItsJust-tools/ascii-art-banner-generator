import { FONT_IDS, isFontId } from './fonts.meta';
import { renderWithWrap } from './banner';

export type { FontId } from './fonts.meta';
import type { FontId } from './fonts.meta';
export { FONT_IDS, isFontId };

export interface ToolState {
  /** Text to render; newlines split banner lines. */
  text: string;
  /** Active FIGlet font id. */
  font: FontId;
  /** Max banner width in columns; 0 = unlimited. */
  maxWidth: number;
  /** Word-wrap long lines instead of warning. */
  wordWrap: boolean;
  /** Strip trailing whitespace from each output line. */
  stripTrailing: boolean;
  /** Center-align output lines within the widest line. */
  center: boolean;
  /** Comment prefix to add before each output line ('' = none). */
  commentPrefix: string;
  /** Recently generated banner summaries, newest first. */
  history: HistoryEntry[];
}

export interface HistoryEntry {
  text: string;
  font: FontId;
  createdAt: string;
}

export const DEFAULT_STATE: ToolState = {
  text: 'Hello',
  font: 'standard',
  maxWidth: 0,
  wordWrap: true,
  stripTrailing: true,
  center: false,
  commentPrefix: '',
  history: [],
};

export const MAX_HISTORY = 20;
export const MAX_WIDTH_LIMIT = 500;

export interface BannerStats {
  columns: number;
  lines: number;
  overflow: boolean;
  /** Line indices (0-based) exceeding maxWidth when overflow is true. */
  overflowLines: number[];
}

/** Normalize banner output: strip trailing whitespace, center lines. */
export function styleBanner(
  rows: string[],
  options: { stripTrailing: boolean; center: boolean }
): string[] {
  let styled = rows.map((r) => (options.stripTrailing ? r.replace(/\s+$/, '') : r));
  if (options.center) {
    styled = styled.map((r) => r.replace(/\s+$/, ''));
    const widest = styled.reduce((max, r) => Math.max(max, r.length), 0);
    styled = styled.map((r) => {
      const gap = widest - r.length;
      const left = Math.floor(gap / 2);
      return ' '.repeat(left) + r + ' '.repeat(gap - left);
    });
  }
  return styled;
}

export interface RenderOptions {
  stripTrailing: boolean;
  center: boolean;
  maxWidth: number;
  wordWrap: boolean;
}

/** Full banner render: per-line blocks separated by one blank line. */
export function renderBanner(
  text: string,
  fontId: FontId,
  options: RenderOptions
): { output: string; stats: BannerStats } {
  const lines = text.split('\n');
  const blocks: string[] = [];
  const overflowLines: number[] = [];
  let overflow = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (line.trim() === '') {
      blocks.push('');
      continue;
    }
    const result = renderWithWrap(line, fontId, {
      maxWidth: options.maxWidth,
      wordWrap: options.wordWrap,
    });
    if (result.overflow) {
      overflow = true;
      overflowLines.push(i);
    }
    blocks.push(styleBanner(result.rows, options).join('\n'));
  }

  let output = blocks.join('\n\n');
  if (text.trim() === '') output = '';

  const allRows = output ? output.split('\n') : [];
  const columns = allRows.reduce((max, r) => Math.max(max, r.length), 0);

  return {
    output,
    stats: { columns, lines: allRows.length, overflow, overflowLines },
  };
}

export function isState(value: unknown): value is ToolState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<ToolState>;
  return typeof v.text === 'string' && isFontId(v.font);
}
