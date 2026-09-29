/**
 * `@neofloai/agentic-chat/charts` — chart blocks on Recharts (an optional peer dependency),
 * coloured from the Atoms ramps.
 *
 * ```tsx
 * import { chartBlock } from '@neofloai/agentic-chat/charts';
 * <AgenticChat adapter={adapter} blocks={[chartBlock]} />
 * ```
 */
export { chartBlock, ChartBlock } from './charts/ChartBlock';
export { ChartCard, ChartLegend, ChartTooltipContent, type LegendItem, type TooltipRow } from './charts/ChartCard';
export { useChartPalette, chartPalette, useResolvedScheme, CHART_SERIES, type ChartPalette, type Scheme } from './charts/palette';
export { parseChart, type ChartData, type ChartKind, type ChartSeries } from './blocks/parsers';
