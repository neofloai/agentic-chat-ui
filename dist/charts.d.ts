import { B as BlockRenderProps, C as ChartData, a as BlockDefinition } from './parsers-D_dzoRqG.js';
export { b as ChartKind, c as ChartSeries, p as parseChart } from './parsers-D_dzoRqG.js';
import * as react from 'react';
import { ReactNode } from 'react';
import './types-CIFoqVVK.js';
import './stream-reducer-E9TDBSmi.js';

declare function ChartBlockImpl({ data }: BlockRenderProps<ChartData>): react.JSX.Element | null;
/** Re-renders only when the chart's data changes, so a finished turn doesn't replay the animation. */
declare const ChartBlock: react.MemoExoticComponent<typeof ChartBlockImpl>;
/** Bar, line/area and donut charts. Register with `blocks={[chartBlock]}`; needs `recharts`. */
declare const chartBlock: BlockDefinition<ChartData>;

type Scheme = 'light' | 'dark';
/** Series colours taken from the Atoms ramps, so a chart sits on the page like its tables do. */
declare const CHART_SERIES: Record<Scheme, string[]>;
declare function useResolvedScheme(): Scheme;
interface ChartPalette {
    series: string[];
    grid: string;
    axis: string;
    track: string;
    tooltipBg: string;
    tooltipText: string;
    tooltipMuted: string;
}
declare function chartPalette(scheme: Scheme): ChartPalette;
/** Concrete colours for the current scheme (SVG attributes can't use CSS variables reliably). */
declare function useChartPalette(): ChartPalette;

interface LegendItem {
    label: ReactNode;
    color: string;
    value?: ReactNode;
}
declare function ChartLegend({ items, direction }: {
    items: LegendItem[];
    direction?: 'row' | 'column';
}): react.JSX.Element | null;
/** Figma ChartCard: an Atoms card with a title, a subtitle, the chart, and a legend. */
declare function ChartCard({ title, subtitle, legend, children, height, 'aria-label': ariaLabel, }: {
    title?: ReactNode;
    subtitle?: ReactNode;
    legend?: ReactNode;
    children: ReactNode;
    height?: number;
    'aria-label'?: string;
}): react.JSX.Element;
interface TooltipRow {
    name?: ReactNode;
    value?: unknown;
    color?: string;
}
/** Figma ChartTooltip: rows on the inverse surface. Pass as Recharts' `content`. */
declare function ChartTooltipContent({ active, label, payload, palette, format, }: {
    active?: boolean;
    label?: ReactNode;
    payload?: readonly TooltipRow[];
    palette: ChartPalette;
    format: (value: unknown) => string;
}): react.JSX.Element | null;

export { CHART_SERIES, ChartBlock, ChartCard, ChartData, ChartLegend, type ChartPalette, ChartTooltipContent, type LegendItem, type Scheme, type TooltipRow, chartBlock, chartPalette, useChartPalette, useResolvedScheme };
