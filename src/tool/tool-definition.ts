import type { Tool, DeserializeResult } from '@itsjust/core';
import toolConfig from './tool.config';
import {
  DEFAULT_STATE,
  MAX_HISTORY,
  MAX_WIDTH_LIMIT,
  type FontId,
  type HistoryEntry,
  type ToolState,
} from './types';
import { isFontId, FONT_IDS } from './fonts.meta';

/** Serialize tool state into a compact JSON string for share/import. */
export function serializeState(state: ToolState): string {
  return JSON.stringify({
    text: state.text,
    font: state.font,
    maxWidth: state.maxWidth,
    wordWrap: state.wordWrap,
    stripTrailing: state.stripTrailing,
    center: state.center,
    commentPrefix: state.commentPrefix,
    history: state.history,
  });
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function booleanOr(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function numberOr(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : NaN;
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(Math.round(n), MAX_WIDTH_LIMIT);
}

function validHistory(value: unknown): HistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (entry): entry is HistoryEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as HistoryEntry).text === 'string' &&
        isFontId((entry as HistoryEntry).font) &&
        typeof (entry as HistoryEntry).createdAt === 'string'
    )
    .slice(0, MAX_HISTORY);
}

/** Validate and recover tool state from an arbitrary payload. */
export function deserializeState(data: unknown): DeserializeResult<ToolState> {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return {
      success: false,
      error: 'Invalid data format: expected ASCII banner state object',
    };
  }
  const v = data as Record<string, unknown>;
  const font: FontId = isFontId(v.font) ? v.font : DEFAULT_STATE.font;
  const state: ToolState = {
    text: stringOr(v.text, DEFAULT_STATE.text),
    font,
    maxWidth: numberOr(v.maxWidth, DEFAULT_STATE.maxWidth),
    wordWrap: booleanOr(v.wordWrap, DEFAULT_STATE.wordWrap),
    stripTrailing: booleanOr(v.stripTrailing, DEFAULT_STATE.stripTrailing),
    center: booleanOr(v.center, DEFAULT_STATE.center),
    commentPrefix: stringOr(v.commentPrefix, DEFAULT_STATE.commentPrefix),
    history: validHistory(v.history),
  };
  return { success: true, data: state };
}

/** True when a serialized string round-trips back to the same state. */
export function roundTrips(state: ToolState): boolean {
  try {
    const restored = deserializeState(JSON.parse(serializeState(state)));
    return restored.success && JSON.stringify(restored.data) === JSON.stringify(state);
  } catch {
    return false;
  }
}

/** Append a history entry to state, capped at MAX_HISTORY, newest first. */
export function withHistory(state: ToolState, entry: HistoryEntry): ToolState {
  return { ...state, history: [entry, ...state.history].slice(0, MAX_HISTORY) };
}

export const asciiArtBannerGeneratorTool: Tool<ToolState> = {
  id: toolConfig.id,
  name: toolConfig.name,
  version: toolConfig.version,
  config: toolConfig,
  initialState: { ...DEFAULT_STATE },
  serialize: serializeState,
  deserialize: deserializeState,
  exporters: [{ format: 'json', loader: () => import('./exporters/json') }],
};

export { FONT_IDS, isFontId, roundTrips as stateRoundTrips };
export type { FontId, ToolState };
