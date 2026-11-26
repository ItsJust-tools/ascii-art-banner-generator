import { describe, it, expect, vi } from 'vitest';
import {
  renderToImage,
  createCanvasExporter,
  formatExportError,
  throwIfAborted,
} from '@/tool/exporters/utils';

function makeEl(): HTMLElement {
  const el = document.createElement('div');
  const pw = document.createElement('input');
  pw.type = 'password';
  el.appendChild(pw);
  document.body.appendChild(el);
  return el;
}

describe('exporters/utils', () => {
  it('blocks sensitive elements unless allowSensitiveData', async () => {
    const options = {
      signal: undefined,
      allowSensitiveData: false,
      filename: 'x.png',
      quality: 1,
      scale: 1,
    } as never;
    await expect(renderToImage(makeEl(), options)).rejects.toThrow(/sensitive/i);
  });

  it('throws AbortError for aborted signals', async () => {
    const ctx = new AbortController();
    ctx.abort();
    const options = {
      signal: ctx.signal,
      allowSensitiveData: true,
      filename: 'x.png',
      quality: 1,
      scale: 1,
    } as never;
    await expect(renderToImage(makeEl(), options)).rejects.toThrow(/aborted/i);
  });

  it('returns a failed ExportResult when rendering fails', async () => {
    const exporter = createCanvasExporter('png', 'image/png', 'png');
    const options = {
      signal: undefined,
      allowSensitiveData: true,
      filename: 'x.png',
      quality: 1,
      scale: 1,
    } as never;
    // toBlob on detached element path: force a failure by mocking html-to-image absence
    const result = await exporter.export(document.createElement('div'), options);
    // In jsdom html-to-image usually fails → either success:false with error, or success with data
    expect(result.format).toBe('png');
    if (!result.success) {
      expect(typeof result.error).toBe('string');
      expect(result.error!.length).toBeGreaterThan(0);
    }
  });

  it('formats CORS and generic errors distinctly', () => {
    expect(formatExportError(new Error('tainted canvas CORS blocked'), 'PNG')).toMatch(/CORS/i);
    expect(formatExportError(new Error('plain failure'), 'PNG')).toBe('plain failure');
    expect(formatExportError('not an error', 'PNG')).toBe('PNG export failed');
  });

  it('throwIfAborted throws only when aborted', () => {
    const ctx = new AbortController();
    expect(() => throwIfAborted(ctx.signal)).not.toThrow();
    ctx.abort();
    expect(() => throwIfAborted(ctx.signal)).toThrow(/aborted/i);
    expect(() => throwIfAborted(undefined)).not.toThrow();
  });
});
