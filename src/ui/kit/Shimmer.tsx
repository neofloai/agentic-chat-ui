import { Box, Typography, type TypographyVariant } from '@neofloai/atoms';
import { surface, text } from '@neofloai/atoms/tokens';
import type { ReactNode } from 'react';
import { mode, type AtomsTheme } from './tokens';

const gradient = (from: string, to: string) => `linear-gradient(90deg, ${from} 0%, ${to} 45%, ${from} 90%)`;

/** Text that's still arriving (Figma "Shimmer"): a slow sweep across muted ink. */
export function Shimmer({
  children,
  variant = 'body1',
  bar = false,
}: {
  children?: ReactNode;
  variant?: TypographyVariant;
  /** Also draw the sweeping bar under the text. */
  bar?: boolean;
}) {
  const sweep = {
    light: gradient(text.default.b3.light, text.default.b1.light),
    dark: gradient(text.default.b3.dark, text.default.b1.dark),
  };
  return (
    <Box role="status" aria-live="polite" sx={{ minWidth: 0 }}>
      {children ? (
        <Typography
          variant={variant}
          component="div"
          sx={(theme: AtomsTheme) => ({
            display: 'inline-block',
            backgroundSize: '220% 100%',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            '@keyframes acu-shimmer': { from: { backgroundPosition: '120% 0' }, to: { backgroundPosition: '-120% 0' } },
            animation: 'acu-shimmer 1.8s linear infinite',
            ...mode(theme, { backgroundImage: sweep }),
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
              ...mode(theme, { color: text.default.b2 }),
            },
          })}
        >
          {children}
        </Typography>
      ) : null}
      {bar ? (
        <Box
          aria-hidden
          sx={(theme: AtomsTheme) => ({
            mt: 1.25,
            height: 8,
            borderRadius: 999,
            overflow: 'hidden',
            position: 'relative',
            ...mode(theme, { backgroundColor: surface.layers.card3 }),
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              width: '40%',
              '@keyframes acu-bar': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(250%)' } },
              animation: 'acu-bar 1.6s ease-in-out infinite',
              ...mode(theme, {
                backgroundImage: {
                  light: `linear-gradient(90deg, transparent, ${surface.layers.page.light}, transparent)`,
                  dark: `linear-gradient(90deg, transparent, ${surface.layers.card6OnColor.dark}, transparent)`,
                },
              }),
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            },
          })}
        />
      ) : null}
    </Box>
  );
}

/** The live dot on the RunStatus pill. */
export function PulseDot() {
  return (
    <Box
      component="span"
      aria-hidden
      sx={(theme: AtomsTheme) => ({
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        flexShrink: 0,
        ...mode(theme, { backgroundColor: surface.primary.default }),
        '@keyframes acu-pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.35 } },
        animation: 'acu-pulse 1.2s ease-in-out infinite',
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      })}
    />
  );
}
