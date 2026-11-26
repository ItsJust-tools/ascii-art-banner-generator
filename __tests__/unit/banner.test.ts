import { describe, it, expect } from 'vitest';
import {
  DEFAULT_STATE,
  renderBanner,
  styleBanner,
  isState,
  MAX_WIDTH_LIMIT,
  type ToolState,
} from '@/tool/types';
import { serializeState, deserializeState, roundTrips, withHistory } from '@/tool/tool-definition';
import { BANNER_FONTS, renderLine, renderWithWrap } from '@/tool/banner';
import { FONT_IDS, isFontId, DEFAULT_FONT } from '@/tool/fonts.meta';
import { asciiArtBannerGeneratorTool } from '@/tool/tool-definition';
import txtExporter from '@/tool/exporters/json';
import { formatExportError, throwIfAborted } from '@/tool/exporters/utils';

const state = (patch: Partial<ToolState> = {}): ToolState => ({ ...DEFAULT_STATE, ...patch });

describe('built-in fonts', () => {
  it('ships at least the five required FIGlet-style fonts', () => {
    const ids = BANNER_FONTS.map((f) => f.id);
    for (const required of ['standard', 'slant', 'block', 'shadow', 'small']) {
      expect(ids).toContain(required);
    }
    expect(BANNER_FONTS.length).toBeGreaterThanOrEqual(5);
  });

  it('produces only ASCII characters (codepoints 32-126) for every built-in font', () => {
    for (const font of FONT_IDS) {
      const rows = renderLine('Abc 123 !? #', font);
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows.join('\n')) {
        const cp = row.codePointAt(0);
        expect(cp === 10 || (cp !== undefined && cp >= 32 && cp <= 126)).toBe(true);
      }
    }
  });

  it('rejects unknown font ids', () => {
    expect(isFontId('comic-sans')).toBe(false);
    expect(isFontId('standard')).toBe(true);
    expect(isFontId(42)).toBe(false);
    expect(DEFAULT_FONT).toBe('standard');
  });
});

describe('banner rendering', () => {
  it('renders non-empty banner lines for the default font', () => {
    const { output, stats } = renderBanner('Hi', DEFAULT_STATE.font, DEFAULT_STATE);
    expect(output.length).toBeGreaterThan(0);
    expect(output.split('\n').every((r) => r.length > 0 || r === '')).toBe(true);
    expect(stats.columns).toBeGreaterThan(0);
    expect(stats.lines).toBeGreaterThan(0);
    expect(stats.overflow).toBe(false);
  });

  it('splits multi-line input into per-line banner blocks', () => {
    const { output } = renderBanner('AB\nCD', 'small', DEFAULT_STATE);
    const blocks = output.split('\n\n');
    expect(blocks.length).toBeGreaterThanOrEqual(2);
  });

  it('handles empty and whitespace-only input without crashing', () => {
    for (const text of ['', '   ', '\n\n']) {
      const { output, stats } = renderBanner(text, 'standard', DEFAULT_STATE);
      expect(output).toBe('');
      expect(stats.columns).toBe(0);
      expect(stats.overflow).toBe(false);
    }
  });

  it('styles output with trailing-whitespace stripping and centering', () => {
    const styled = styleBanner(['AAA   ', 'B'], { stripTrailing: true, center: true });
    expect(styled[0]).toBe('AAA');
    expect(styled[1]).toBe(' B ');
  });

  it('detects overflow against maxWidth and honors word-wrap', () => {
    // Single wide word can never fit — overflow flagged, wrap splits it.
    const wide = renderWithWrap('AAAABBBB', 'small', { maxWidth: 10, wordWrap: true });
    expect(wide.overflow).toBe(true);
    expect(wide.rows.length).toBeGreaterThan(1);

    // Multi-word input wraps into blocks that each fit the limit.
    const wrapped = renderWithWrap('AAAA BB', 'small', { maxWidth: 32, wordWrap: true });
    expect(wrapped.overflow).toBe(false);
    expect(wrapped.rows.length).toBeGreaterThanOrEqual(2);

    const warn = renderBanner('AAABBB', 'standard', {
      ...DEFAULT_STATE,
      maxWidth: 12,
      wordWrap: false,
    });
    expect(warn.stats.overflow).toBe(true);
    expect(warn.stats.overflowLines).toEqual([0]);
  });

  it('isState gates on text + valid font', () => {
    expect(isState(state())).toBe(true);
    expect(isState({ ...state(), font: 'nope' })).toBe(false);
    expect(isState(null)).toBe(false);
    expect(isState({ text: 'x' })).toBe(false);
    expect(MAX_WIDTH_LIMIT).toBe(500);
  });
});

describe('share state serialize/deserialize', () => {
  it('round-trips text and font exactly', () => {
    const s = state({ text: 'Share me', font: 'slant', center: true, commentPrefix: '//' });
    const restored = deserializeState(JSON.parse(serializeState(s)));
    expect(restored.success).toBe(true);
    if (restored.success) {
      expect(restored.data.text).toBe('Share me');
      expect(restored.data.font).toBe('slant');
      expect(restored.data.center).toBe(true);
      expect(restored.data.commentPrefix).toBe('//');
    }
    expect(roundTrips(s)).toBe(true);
  });

  it('restores all flags and clamps maxWidth', () => {
    const restored = deserializeState({
      text: 'x',
      font: 'doom',
      maxWidth: 9999,
      wordWrap: false,
      stripTrailing: false,
      history: [],
    });
    expect(restored.success).toBe(true);
    if (restored.success) {
      expect(restored.data.maxWidth).toBe(MAX_WIDTH_LIMIT);
      expect(restored.data.wordWrap).toBe(false);
      expect(restored.data.stripTrailing).toBe(false);
    }
  });

  it('recovers gracefully from invalid payloads', () => {
    for (const bad of [{ font: 'not-a-font' }, { font: 42 }, {}]) {
      const restored = deserializeState(bad);
      expect(restored.success).toBe(true);
      if (restored.success) {
        expect(isFontId(restored.data.font)).toBe(true);
        expect(restored.data.font).toBe(DEFAULT_STATE.font);
      }
    }
    for (const bad of [null, 'string', 42, [], undefined]) {
      expect(deserializeState(bad).success).toBe(false);
    }
  });

  it('withHistory caps entries at MAX_HISTORY, newest first', () => {
    let s = state();
    for (let i = 0; i < 25; i++) {
      s = withHistory(s, { text: `t${i}`, font: 'small', createdAt: new Date(i).toISOString() });
    }
    expect(s.history.length).toBe(20);
    expect(s.history[0]?.text).toBe('t24');
  });

  it('exposes the Tool contract', () => {
    expect(asciiArtBannerGeneratorTool.id).toBe('ascii-art-banner-generator');
    expect(asciiArtBannerGeneratorTool.serialize(state())).toContain('"text"');
  });
});

describe('txt exporter + helpers', () => {
  it('exports a text blob with a sanitized filename', async () => {
    const result = await txtExporter.export(document.createElement('div'), {
      filename: 'my banner.txt',
      signal: undefined,
      allowSensitiveData: true,
      text: 'banner\nlines',
    } as never);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.format).toBe('json');
    }
  });

  it('formats errors and honors abort signals', async () => {
    const ctx = new AbortController();
    ctx.abort();
    expect(() => throwIfAborted(ctx.signal)).toThrow();
    expect(formatExportError(new Error('cors problem'), 'TXT')).toMatch(/CORS|cors/i);
    expect(formatExportError(new Error('boom'), 'TXT')).toBe('boom');
  });
});
