import figlet from 'figlet';
import { FONT_IDS, type FontId } from './fonts.meta';

/** Font ids served by the tool — a superset of the required five. */
export const BANNER_FONTS: { id: FontId; label: string }[] = [
  { id: 'standard', label: 'Standard' },
  { id: 'slant', label: 'Slant' },
  { id: 'block', label: 'Block' },
  { id: 'shadow', label: 'Shadow' },
  { id: 'small', label: 'Small' },
  { id: 'big', label: 'Big' },
  { id: 'doom', label: 'Doom' },
];

const FIGLET_FONT_BY_ID: Record<FontId, string> = {
  standard: 'Standard',
  slant: 'Slant',
  block: 'Block',
  shadow: 'Shadow',
  small: 'Small',
  big: 'Big',
  doom: 'Doom',
};

export function figletFontFor(id: FontId): string {
  return FIGLET_FONT_BY_ID[id] ?? 'Standard';
}

/** Render a single input line with the given font; throws on figlet failure. */
export function renderLine(line: string, fontId: FontId): string[] {
  const rendered = figlet.textSync(line, {
    font: figletFontFor(fontId),
    width: Number.POSITIVE_INFINITY,
    whitespaceBreak: false,
  });
  return rendered.split('\n');
}

/** Render honoring word-wrap/overflow options from types.ts logic. */
export function renderWithWrap(
  line: string,
  fontId: FontId,
  options: { maxWidth: number; wordWrap: boolean }
): { rows: string[]; overflow: boolean } {
  const maxWidth = options.maxWidth > 0 ? options.maxWidth : Number.POSITIVE_INFINITY;
  // Render the full line first to measure natural width.
  const full = renderLine(line, fontId);
  const fullWidth = full.reduce((max, r) => Math.max(max, r.length), 0);
  if (fullWidth <= maxWidth) {
    return { rows: full, overflow: false };
  }
  if (!options.wordWrap) {
    return { rows: full, overflow: true };
  }
  // Greedy word wrap on spaces, re-rendering each chunk.
  const words = line.split(' ');
  const rows: string[] = [];
  let chunk = '';
  let overflow = false;
  const flush = () => {
    if (chunk.trim() !== '') {
      const rendered = renderLine(chunk, fontId);
      for (const r of rendered) rows.push(r);
    }
    chunk = '';
  };
  for (const word of words) {
    const wordWidth = renderLine(word, fontId).reduce((max, r) => Math.max(max, r.length), 0);
    const candidate = chunk === '' ? word : `${chunk} ${word}`;
    const candidateWidth =
      candidate === word
        ? wordWidth
        : renderLine(candidate, fontId).reduce((max, r) => Math.max(max, r.length), 0);
    if (candidateWidth > maxWidth && chunk !== '') {
      flush();
      chunk = word;
    } else {
      chunk = candidate;
    }
    if (wordWidth > maxWidth && word.length > 0) {
      // Single word still too wide: hard-break it by characters.
      flush();
      let part = '';
      for (const ch of word) {
        const test = part + ch;
        const testWidth = renderLine(test, fontId).reduce((max, r) => Math.max(max, r.length), 0);
        if (testWidth > maxWidth && part !== '') {
          flush();
          part = ch;
        } else {
          part = test;
        }
      }
      chunk = part;
      overflow = true;
    }
  }
  flush();
  return { rows, overflow };
}

/** Static smoke check used by tests: every shipped font renders ASCII-only. */
export function fontsToVerify(): FontId[] {
  return [...FONT_IDS];
}
