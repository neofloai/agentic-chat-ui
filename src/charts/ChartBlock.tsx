import { Box, Stack, Typography } from '@neofloai/atoms';
import { typography } from '@neofloai/atoms/tokens';
import { memo, useMemo, useSyncExternalStore } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BLOCK_TYPES, parseChart, type ChartData } from '../blocks/parsers';
import { formatValue } from '../blocks/format';
import { defineBlock } from '../registry/registry';
import type { BlockRenderProps } from '../registry/types';
import { ChartCard, ChartLegend, ChartTooltipContent, type TooltipRow } from './ChartCard';
import { useChartPalette } from './palette';

const TICK = typography.body.caption.size + 1;

function subscribeMotion(cb: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => undefined;
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener?.('change', cb);
  return () => mq.removeEventListener?.('change', cb);
}
const reducedMotion = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeMotion, reducedMotion, () => false);
}

type AnyTooltipProps = { active?: boolean; label?: unknown; payload?: readonly TooltipRow[] };

function ChartBlockImpl({ data }: BlockRenderProps<ChartData>) {
  const palette = useChartPalette();
  const still = usePrefersReducedMotion();
  const color = (i: number, override?: string) => override ?? palette.series[i % palette.series.length]!;
  const fmt = (v: unknown) => formatValue(v, { format: data.valueFormat ?? 'number', currency: data.currency });
  const tooltip = (props: AnyTooltipProps) => (
    <ChartTooltipContent
      active={props.active}
      label={props.label as string | undefined}
      payload={props.payload}
      palette={palette}
      format={fmt}
    />
  );
  const legendItems = data.series.map((s, i) => ({ label: s.label, color: color(i, s.color) }));
  const axis = { tickLine: false, axisLine: false, tick: { fill: palette.axis, fontSize: TICK } } as const;
  const lastIndex = data.data.length - 1;

  const donutRows = useMemo(() => {
    if (data.kind !== 'donut') return [];
    const key = data.series[0]?.key ?? 'value';
    return data.data.map((d, i) => ({ name: String(d[data.xKey] ?? ''), value: Number(d[key]) || 0, color: color(i) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, palette]);

  if (!data.data.length) return null;

  if (data.kind === 'donut') {
    return (
      <ChartCard title={data.title} subtitle={data.subtitle} height={140} aria-label={data.title}>
        <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center', height: '100%' }}>
          <Box sx={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={donutRows}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="74%"
                  outerRadius="100%"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                  isAnimationActive={!still}
                  animationDuration={600}
                >
                  {donutRows.map((r) => (
                    <Cell key={r.name} fill={r.color} />
                  ))}
                </Pie>
                <Tooltip content={tooltip} />
              </PieChart>
            </ResponsiveContainer>
            {data.total ? (
              <Stack
                sx={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
              >
                <Typography variant="h5" component="div">
                  {data.total.value}
                </Typography>
                {data.total.label ? (
                  <Typography variant="caption" component="div">
                    {data.total.label}
                  </Typography>
                ) : null}
              </Stack>
            ) : null}
          </Box>
          <ChartLegend
            direction="column"
            items={donutRows.map((r) => ({ label: r.name, color: r.color, value: fmt(r.value) }))}
          />
        </Stack>
      </ChartCard>
    );
  }

  if (data.kind === 'line' || data.kind === 'area') {
    return (
      <ChartCard
        title={data.title}
        subtitle={data.subtitle}
        aria-label={data.title}
        legend={data.series.length > 1 ? <ChartLegend items={legendItems} /> : undefined}
      >
        <ResponsiveContainer>
          <AreaChart data={data.data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={palette.grid} />
            <XAxis dataKey={data.xKey} {...axis} />
            <YAxis {...axis} width={36} tickFormatter={(v) => fmt(v)} />
            <Tooltip content={tooltip} cursor={{ stroke: palette.grid }} />
            {data.series.map((s, i) => (
              <Area
                key={s.key}
                type="linear"
                dataKey={s.key}
                name={s.label}
                stroke={color(i, s.color)}
                strokeWidth={2}
                fill={color(i, s.color)}
                fillOpacity={data.kind === 'area' || data.series.length === 1 ? 0.12 : 0}
                stackId={data.stacked ? 'a' : undefined}
                isAnimationActive={!still}
                animationDuration={600}
                activeDot={{ r: 4 }}
                dot={(p: { cx?: number; cy?: number; index?: number }) =>
                  p.index === lastIndex && p.cx !== undefined && p.cy !== undefined ? (
                    <circle key={`end-${s.key}`} cx={p.cx} cy={p.cy} r={4} fill={color(i, s.color)} />
                  ) : (
                    <g key={`dot-${s.key}-${p.index}`} />
                  )
                }
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  }

  return (
    <ChartCard title={data.title} subtitle={data.subtitle} aria-label={data.title} legend={<ChartLegend items={legendItems} />}>
      <ResponsiveContainer>
        <BarChart data={data.data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={4}>
          <CartesianGrid vertical={false} stroke={palette.grid} />
          <XAxis dataKey={data.xKey} {...axis} />
          <YAxis {...axis} width={36} tickFormatter={(v) => fmt(v)} />
          <Tooltip content={tooltip} cursor={{ fill: palette.track }} />
          {data.series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={color(i, s.color)}
              radius={[2, 2, 0, 0]}
              maxBarSize={24}
              stackId={data.stacked ? 'a' : undefined}
              isAnimationActive={!still}
              animationDuration={600}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Re-renders only when the chart's data changes, so a finished turn doesn't replay the animation. */
export const ChartBlock = memo(ChartBlockImpl, (a, b) => a.data === b.data);

/** Bar, line/area and donut charts. Register with `blocks={[chartBlock]}`; needs `recharts`. */
export const chartBlock = defineBlock<ChartData>({
  name: 'chart',
  type: BLOCK_TYPES.chart,
  parse: parseChart,
  render: ChartBlock,
  toText: (d) => [d.title, d.subtitle].filter(Boolean).join(' — '),
});
