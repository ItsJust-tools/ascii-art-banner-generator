'use client';

import React from 'react';
import { renderBanner, type ToolState, type BannerStats } from '../types';

interface CanvasProps {
  state: ToolState;
  onChange?: (state: ToolState) => void;
  onSaveHistory?: (text: string) => void;
}

const textareaClass =
  'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';

const bannerClass =
  'mt-2 overflow-x-auto whitespace-pre rounded-md bg-gray-950 p-4 font-mono text-xs leading-tight text-green-300 dark:bg-black';

function CopyButton({ value, testid }: { value: string; testid?: string }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable; ignore
    }
  }, [value]);
  return (
    <button
      type="button"
      onClick={handleCopy}
      data-testid={testid}
      className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
      aria-label="Copy banner to clipboard"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function DownloadButton({ value }: { value: string }) {
  const handleDownload = React.useCallback(() => {
    const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'banner.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [value]);
  return (
    <button
      type="button"
      onClick={handleDownload}
      data-testid="btn-download-banner"
      className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
      aria-label="Download banner as .txt file"
    >
      Download .txt
    </button>
  );
}

export const Canvas: React.FC<CanvasProps> = ({ state, onChange, onSaveHistory }) => {
  const update = (patch: Partial<ToolState>) => onChange?.({ ...state, ...patch });

  const render = React.useMemo(() => {
    try {
      return renderBanner(state.text, state.font, {
        stripTrailing: state.stripTrailing,
        center: state.center,
        maxWidth: state.maxWidth,
        wordWrap: state.wordWrap,
      });
    } catch {
      return {
        output: '',
        stats: { columns: 0, lines: 0, overflow: false, overflowLines: [] } as BannerStats,
      };
    }
  }, [state.text, state.font, state.maxWidth, state.wordWrap, state.stripTrailing, state.center]);

  const output = state.commentPrefix
    ? render.output
        .split('\n')
        .map((r) => (r.length > 0 ? `${state.commentPrefix} ${r}` : r))
        .join('\n')
    : render.output;

  const isEmpty = state.text.trim() === '';

  return (
    <div className="p-4" data-testid="banner-canvas">
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
        Banner text (one line per banner, multi-line supported)
        <textarea
          value={state.text}
          onChange={(e) => update({ text: e.target.value })}
          data-testid="banner-input"
          rows={3}
          className={textareaClass}
          placeholder="Type text to bannerize…"
        />
      </label>

      {isEmpty ? (
        <p data-testid="banner-empty" className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Enter some text above to generate an ASCII banner.
        </p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span data-testid="banner-stats" className="text-xs text-gray-500 dark:text-gray-400">
              {render.stats.columns} × {render.stats.lines} columns × lines
            </span>
            <div className="flex items-center gap-2">
              <CopyButton value={output} testid="btn-copy-banner" />
              <DownloadButton value={output} />
              {onSaveHistory ? (
                <button
                  type="button"
                  onClick={() => onSaveHistory(output)}
                  data-testid="btn-save-history"
                  className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                  aria-label="Save banner to history"
                >
                  Save
                </button>
              ) : null}
            </div>
          </div>

          {render.stats.overflow ? (
            <p
              data-testid="banner-overflow-warning"
              className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
            >
              Warning: banner exceeds max width
              {render.stats.overflowLines.length > 0
                ? ` (line${render.stats.overflowLines.length > 1 ? 's' : ''} ${render.stats.overflowLines
                    .map((n) => n + 1)
                    .join(', ')})`
                : ''}
              . Enable word-wrap or raise the width limit.
            </p>
          ) : null}

          <pre data-testid="banner-output" className={bannerClass}>
            {output}
          </pre>
        </>
      )}
    </div>
  );
};
