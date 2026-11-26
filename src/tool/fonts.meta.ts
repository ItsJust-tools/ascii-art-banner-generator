export const FONT_IDS = ['standard', 'slant', 'block', 'shadow', 'small', 'big', 'doom'] as const;
export type FontId = (typeof FONT_IDS)[number];
export const DEFAULT_FONT: FontId = 'standard';

export function isFontId(value: unknown): value is FontId {
  return typeof value === 'string' && (FONT_IDS as readonly string[]).includes(value);
}
