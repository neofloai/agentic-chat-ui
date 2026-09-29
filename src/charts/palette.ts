import { useColorScheme } from '@neofloai/atoms';
import { useMemo } from 'react';
import { border, colors, surface, text } from '@neofloai/atoms/tokens';

export type Scheme = 'light' | 'dark';

/** Series colours taken from the Atoms ramps, so a chart sits on the page like its tables do. */
export const CHART_SERIES: Record<Scheme, string[]> = {
  light: [colors.primary[500], colors.blue[200], colors.green[200], colors.orange[400], colors.purple[300], colors.grey[400]],
  dark: [colors.primary[400], colors.blue[300], colors.green[300], colors.orange[400], colors.purple[400], colors.grey[500]],
};

export function useResolvedScheme(): Scheme {
  const { mode, systemMode } = useColorScheme();
  const resolved = mode === 'system' ? systemMode : mode;
  return resolved === 'dark' ? 'dark' : 'light';
}

export interface ChartPalette {
  series: string[];
  grid: string;
  axis: string;
  track: string;
  tooltipBg: string;
  tooltipText: string;
  tooltipMuted: string;
}

export function chartPalette(scheme: Scheme): ChartPalette {
  return {
    series: CHART_SERIES[scheme],
    grid: border.layers.card1[scheme],
    axis: text.default.b3[scheme],
    track: surface.layers.card2[scheme],
    tooltipBg: surface.layers.card4OnColor[scheme],
    tooltipText: text.default['heading on-color'][scheme],
    tooltipMuted: text.default['caption on-color'][scheme],
  };
}

/** Concrete colours for the current scheme (SVG attributes can't use CSS variables reliably). */
export function useChartPalette(): ChartPalette {
  const scheme = useResolvedScheme();
  // Stable per scheme, so charts don't restart their entry animation on every render.
  return useMemo(() => chartPalette(scheme), [scheme]);
}
