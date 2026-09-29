import { Box, Card, CardContent, CardHeader, Stack, Typography } from '@neofloai/atoms';
import { text } from '@neofloai/atoms/tokens';
import type { ReactNode } from 'react';
import { mode, type AtomsTheme } from '../ui/kit/tokens';
import type { ChartPalette } from './palette';

export interface LegendItem {
  label: ReactNode;
  color: string;
  value?: ReactNode;
}

export function ChartLegend({ items, direction = 'row' }: { items: LegendItem[]; direction?: 'row' | 'column' }) {
  if (!items.length) return null;
  return (
    <Stack component="ul" direction={direction} sx={{ listStyle: 'none', m: 0, p: 0, flexWrap: 'wrap', columnGap: 2, rowGap: 1 }}>
      {items.map((item, i) => (
        <Stack key={i} component="li" direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: 0.25, backgroundColor: item.color, flexShrink: 0 }} />
          <Typography variant="body2" component="span" sx={(t: AtomsTheme) => mode(t, { color: text.default.b2 })}>
            {item.label}
          </Typography>
          {item.value !== undefined ? (
            <Typography variant="body2" component="span" sx={(t: AtomsTheme) => mode(t, { color: text.default.b1 })}>
              {item.value}
            </Typography>
          ) : null}
        </Stack>
      ))}
    </Stack>
  );
}

/** Figma ChartCard: an Atoms card with a title, a subtitle, the chart, and a legend. */
export function ChartCard({
  title,
  subtitle,
  legend,
  children,
  height = 180,
  'aria-label': ariaLabel,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  legend?: ReactNode;
  children: ReactNode;
  height?: number;
  'aria-label'?: string;
}) {
  return (
    <Card component="figure" aria-label={ariaLabel} sx={{ m: 0, maxWidth: 560 }}>
      {title || subtitle ? <CardHeader title={title} subheader={subtitle} /> : null}
      <CardContent>
        <Box sx={{ width: '100%', height, position: 'relative' }}>{children}</Box>
        {legend ? <Box sx={{ mt: 2 }}>{legend}</Box> : null}
      </CardContent>
    </Card>
  );
}

export interface TooltipRow {
  name?: ReactNode;
  value?: unknown;
  color?: string;
}

/** Figma ChartTooltip: rows on the inverse surface. Pass as Recharts' `content`. */
export function ChartTooltipContent({
  active,
  label,
  payload,
  palette,
  format,
}: {
  active?: boolean;
  label?: ReactNode;
  payload?: readonly TooltipRow[];
  palette: ChartPalette;
  format: (value: unknown) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{ px: 1.5, py: 1.25, borderRadius: 1, minWidth: 140, backgroundColor: palette.tooltipBg, color: palette.tooltipText }}
    >
      {label !== undefined && label !== '' ? (
        <Typography variant="body2" weight="medium" component="div" sx={{ color: palette.tooltipText, mb: 0.5 }}>
          {label}
        </Typography>
      ) : null}
      {payload.map((row, i) => (
        <Stack key={i} direction="row" spacing={0.75} sx={{ alignItems: 'center', py: 0.25 }}>
          <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: 0.25, backgroundColor: row.color, flexShrink: 0 }} />
          <Typography variant="body2" component="span" sx={{ flex: 1, color: palette.tooltipMuted }}>
            {row.name}
          </Typography>
          <Typography variant="body2" component="span" sx={{ color: palette.tooltipText, ml: 2 }}>
            {format(row.value)}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
}
