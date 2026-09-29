import type { neofloTheme } from '@neofloai/atoms/theme';
import { fontFamilies, type ModeToken } from '@neofloai/atoms/tokens';

export type AtomsTheme = typeof neofloTheme;

type StyleValue = ModeToken | string | number | undefined;

const isModeToken = (v: unknown): v is ModeToken => typeof v === 'object' && v !== null && 'light' in v && 'dark' in v;

/**
 * Resolves Atoms `{ light, dark }` tokens for both colour schemes, the same way Atoms' own
 * components do: the light value inline, the dark one under `theme.applyStyles('dark')`.
 *
 * ```ts
 * sx={(theme) => mode(theme, { backgroundColor: surface.layers.card2, color: text.default.b1 })}
 * ```
 */
export function mode(theme: AtomsTheme, styles: Record<string, StyleValue>): Record<string, unknown> {
  const light: Record<string, string | number> = {};
  const dark: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(styles)) {
    if (value === undefined) continue;
    if (isModeToken(value)) {
      light[key] = value.light;
      dark[key] = value.dark;
    } else {
      light[key] = value;
    }
  }
  return Object.keys(dark).length ? { ...light, ...theme.applyStyles('dark', dark) } : light;
}

export const monoFont = fontFamilies.product.mono;

/** Block head icon size; body text indents by this plus the head gap so it lines up with the title. */
export const BLOCK_ICON_PX = 18;
