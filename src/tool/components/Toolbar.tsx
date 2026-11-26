'use client';

import React from 'react';
import { BANNER_FONTS } from '../banner';
import type { ToolState } from '../types';
import { DEFAULT_STATE, MAX_WIDTH_LIMIT } from '../types';

interface ToolbarProps {
  state: ToolState;
  onChange: (next: ToolState) => void;
  onClear: () => void;
  onCopy?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ state, onChange, onClear, onCopy }) => {
  const update = (patch: Partial<ToolState>) => onChange({ ...state, ...patch });
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
      role="group"
      aria-label="Banner tool controls"
    >
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
          Font
          <select
            value={state.font}
            onChange={(e) => update({ font: e.target.value as ToolState['font'] })}
            data-testid="font-select"
            aria-label="Banner font"
            className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            {BANNER_FONTS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onClear}
          data-testid="btn-clear"
          className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Clear
        </button>
        {onCopy ? (
          <button
            type="button"
            onClick={onCopy}
            data-testid="btn-copy-result"
            className="rounded-md bg-violet-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-violet-600"
          >
            Copy banner
          </button>
        ) : null}
        {state.history.length > 0 ? (
          <button
            type="button"
            onClick={() => update({ history: [] })}
            data-testid="btn-clear-history"
            className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Clear history
          </button>
        ) : null}
      </div>
      <span className="hidden items-center gap-2 text-xs text-gray-500 sm:flex dark:text-gray-400">
        Default font: Standard
        {state.font !== DEFAULT_STATE.font ? ' (changed)' : ''}
      </span>
    </div>
  );
};

export { MAX_WIDTH_LIMIT };
