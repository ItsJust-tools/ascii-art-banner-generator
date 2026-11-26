'use client';

import React from 'react';
import { BANNER_FONTS } from '../banner';
import type { ToolState } from '../types';

interface SidebarProps {
  state: ToolState;
  onChange: (next: ToolState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ state, onChange }) => {
  const update = (patch: Partial<ToolState>) => onChange({ ...state, ...patch });
  return (
    <div className="space-y-6 overflow-y-auto p-4 text-sm h-full" data-testid="banner-sidebar">
      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Fonts</h3>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          {BANNER_FONTS.map((f) => (
            <li key={f.id} className="flex justify-between gap-2">
              <span>{f.label}</span>
              {state.font === f.id ? (
                <span data-testid={`font-active-${f.id}`} aria-label="active font marker">
                  active
                </span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">{f.id}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Output options</h3>
        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={state.stripTrailing}
              onChange={(e) => update({ stripTrailing: e.target.checked })}
              data-testid="opt-strip-trailing"
            />
            Strip trailing whitespace
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={state.center}
              onChange={(e) => update({ center: e.target.checked })}
              data-testid="opt-center"
            />
            Center-align lines
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={state.wordWrap}
              onChange={(e) => update({ wordWrap: e.target.checked })}
              data-testid="opt-word-wrap"
            />
            Word-wrap long lines
          </label>
          <label className="block">
            Max width (columns, 0 = unlimited)
            <input
              type="number"
              min={0}
              max={500}
              value={state.maxWidth}
              onChange={(e) => {
                const n = Number(e.target.value);
                update({ maxWidth: Number.isFinite(n) && n >= 0 ? Math.round(n) : 0 });
              }}
              data-testid="opt-max-width"
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </label>
          <label className="block">
            Comment prefix
            <input
              type="text"
              value={state.commentPrefix}
              placeholder="e.g. // or # (empty = none)"
              onChange={(e) => update({ commentPrefix: e.target.value })}
              data-testid="opt-comment-prefix"
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </label>
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Saved banners</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300" data-testid="sidebar-history-count">
          {state.history.length} entr{state.history.length === 1 ? 'y' : 'ies'} in history
          {state.history.length > 0 ? ' (newest first)' : ''}
        </p>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Keyboard shortcuts</h3>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          <li>
            <kbd>Ctrl+C</kbd> — copy banner (with selection focus)
          </li>
          <li>
            <kbd>Ctrl+S</kbd> — save banner to history
          </li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Share</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Use the toolbar share button to create a URL containing the banner text and font; open it
          to restore this banner.
        </p>
      </div>
    </div>
  );
};
