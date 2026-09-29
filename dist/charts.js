"use client";
import {
  mode
} from "./chunk-MSRCL6UC.js";
import {
  BLOCK_TYPES,
  defineBlock,
  formatValue,
  parseChart
} from "./chunk-HYITIWF6.js";

// src/charts/ChartBlock.tsx
import { Box as Box2, Stack as Stack2, Typography as Typography2 } from "@neofloai/atoms";
import { typography } from "@neofloai/atoms/tokens";
import { memo, useMemo as useMemo2, useSyncExternalStore } from "react";
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
  YAxis
} from "recharts";

// src/charts/ChartCard.tsx
import { Box, Card, CardContent, CardHeader, Stack, Typography } from "@neofloai/atoms";
import { text } from "@neofloai/atoms/tokens";
import { jsx, jsxs } from "react/jsx-runtime";
function ChartLegend({ items, direction = "row" }) {
  if (!items.length) return null;
  return /* @__PURE__ */ jsx(Stack, { component: "ul", direction, sx: { listStyle: "none", m: 0, p: 0, flexWrap: "wrap", columnGap: 2, rowGap: 1 }, children: items.map((item, i) => /* @__PURE__ */ jsxs(Stack, { component: "li", direction: "row", spacing: 0.75, sx: { alignItems: "center" }, children: [
    /* @__PURE__ */ jsx(Box, { "aria-hidden": true, sx: { width: 8, height: 8, borderRadius: 0.25, backgroundColor: item.color, flexShrink: 0 } }),
    /* @__PURE__ */ jsx(Typography, { variant: "body2", component: "span", sx: (t) => mode(t, { color: text.default.b2 }), children: item.label }),
    item.value !== void 0 ? /* @__PURE__ */ jsx(Typography, { variant: "body2", component: "span", sx: (t) => mode(t, { color: text.default.b1 }), children: item.value }) : null
  ] }, i)) });
}
function ChartCard({
  title,
  subtitle,
  legend,
  children,
  height = 180,
  "aria-label": ariaLabel
}) {
  return /* @__PURE__ */ jsxs(Card, { component: "figure", "aria-label": ariaLabel, sx: { m: 0, maxWidth: 560 }, children: [
    title || subtitle ? /* @__PURE__ */ jsx(CardHeader, { title, subheader: subtitle }) : null,
    /* @__PURE__ */ jsxs(CardContent, { children: [
      /* @__PURE__ */ jsx(Box, { sx: { width: "100%", height, position: "relative" }, children }),
      legend ? /* @__PURE__ */ jsx(Box, { sx: { mt: 2 }, children: legend }) : null
    ] })
  ] });
}
function ChartTooltipContent({
  active,
  label,
  payload,
  palette,
  format
}) {
  if (!active || !payload?.length) return null;
  return /* @__PURE__ */ jsxs(
    Box,
    {
      sx: { px: 1.5, py: 1.25, borderRadius: 1, minWidth: 140, backgroundColor: palette.tooltipBg, color: palette.tooltipText },
      children: [
        label !== void 0 && label !== "" ? /* @__PURE__ */ jsx(Typography, { variant: "body2", weight: "medium", component: "div", sx: { color: palette.tooltipText, mb: 0.5 }, children: label }) : null,
        payload.map((row, i) => /* @__PURE__ */ jsxs(Stack, { direction: "row", spacing: 0.75, sx: { alignItems: "center", py: 0.25 }, children: [
          /* @__PURE__ */ jsx(Box, { "aria-hidden": true, sx: { width: 8, height: 8, borderRadius: 0.25, backgroundColor: row.color, flexShrink: 0 } }),
          /* @__PURE__ */ jsx(Typography, { variant: "body2", component: "span", sx: { flex: 1, color: palette.tooltipMuted }, children: row.name }),
          /* @__PURE__ */ jsx(Typography, { variant: "body2", component: "span", sx: { color: palette.tooltipText, ml: 2 }, children: format(row.value) })
        ] }, i))
      ]
    }
  );
}

// src/charts/palette.ts
import { useColorScheme } from "@neofloai/atoms";
import { useMemo } from "react";
import { border, colors, surface, text as text2 } from "@neofloai/atoms/tokens";
var CHART_SERIES = {
  light: [colors.primary[500], colors.blue[200], colors.green[200], colors.orange[400], colors.purple[300], colors.grey[400]],
  dark: [colors.primary[400], colors.blue[300], colors.green[300], colors.orange[400], colors.purple[400], colors.grey[500]]
};
function useResolvedScheme() {
  const { mode: mode2, systemMode } = useColorScheme();
  const resolved = mode2 === "system" ? systemMode : mode2;
  return resolved === "dark" ? "dark" : "light";
}
function chartPalette(scheme) {
  return {
    series: CHART_SERIES[scheme],
    grid: border.layers.card1[scheme],
    axis: text2.default.b3[scheme],
    track: surface.layers.card2[scheme],
    tooltipBg: surface.layers.card4OnColor[scheme],
    tooltipText: text2.default["heading on-color"][scheme],
    tooltipMuted: text2.default["caption on-color"][scheme]
  };
}
function useChartPalette() {
  const scheme = useResolvedScheme();
  return useMemo(() => chartPalette(scheme), [scheme]);
}

// src/charts/ChartBlock.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var TICK = typography.body.caption.size + 1;
function subscribeMotion(cb) {
  if (typeof window === "undefined" || !window.matchMedia) return () => void 0;
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener?.("change", cb);
  return () => mq.removeEventListener?.("change", cb);
}
var reducedMotion = () => typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeMotion, reducedMotion, () => false);
}
function ChartBlockImpl({ data }) {
  const palette = useChartPalette();
  const still = usePrefersReducedMotion();
  const color = (i, override) => override ?? palette.series[i % palette.series.length];
  const fmt = (v) => formatValue(v, { format: data.valueFormat ?? "number", currency: data.currency });
  const tooltip = (props) => /* @__PURE__ */ jsx2(
    ChartTooltipContent,
    {
      active: props.active,
      label: props.label,
      payload: props.payload,
      palette,
      format: fmt
    }
  );
  const legendItems = data.series.map((s, i) => ({ label: s.label, color: color(i, s.color) }));
  const axis = { tickLine: false, axisLine: false, tick: { fill: palette.axis, fontSize: TICK } };
  const lastIndex = data.data.length - 1;
  const donutRows = useMemo2(() => {
    if (data.kind !== "donut") return [];
    const key = data.series[0]?.key ?? "value";
    return data.data.map((d, i) => ({ name: String(d[data.xKey] ?? ""), value: Number(d[key]) || 0, color: color(i) }));
  }, [data, palette]);
  if (!data.data.length) return null;
  if (data.kind === "donut") {
    return /* @__PURE__ */ jsx2(ChartCard, { title: data.title, subtitle: data.subtitle, height: 140, "aria-label": data.title, children: /* @__PURE__ */ jsxs2(Stack2, { direction: "row", spacing: 2.5, sx: { alignItems: "center", height: "100%" }, children: [
      /* @__PURE__ */ jsxs2(Box2, { sx: { position: "relative", width: 140, height: 140, flexShrink: 0 }, children: [
        /* @__PURE__ */ jsx2(ResponsiveContainer, { children: /* @__PURE__ */ jsxs2(PieChart, { children: [
          /* @__PURE__ */ jsx2(
            Pie,
            {
              data: donutRows,
              dataKey: "value",
              nameKey: "name",
              innerRadius: "74%",
              outerRadius: "100%",
              startAngle: 90,
              endAngle: -270,
              stroke: "none",
              isAnimationActive: !still,
              animationDuration: 600,
              children: donutRows.map((r) => /* @__PURE__ */ jsx2(Cell, { fill: r.color }, r.name))
            }
          ),
          /* @__PURE__ */ jsx2(Tooltip, { content: tooltip })
        ] }) }),
        data.total ? /* @__PURE__ */ jsxs2(
          Stack2,
          {
            sx: { position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", pointerEvents: "none" },
            children: [
              /* @__PURE__ */ jsx2(Typography2, { variant: "h5", component: "div", children: data.total.value }),
              data.total.label ? /* @__PURE__ */ jsx2(Typography2, { variant: "caption", component: "div", children: data.total.label }) : null
            ]
          }
        ) : null
      ] }),
      /* @__PURE__ */ jsx2(
        ChartLegend,
        {
          direction: "column",
          items: donutRows.map((r) => ({ label: r.name, color: r.color, value: fmt(r.value) }))
        }
      )
    ] }) });
  }
  if (data.kind === "line" || data.kind === "area") {
    return /* @__PURE__ */ jsx2(
      ChartCard,
      {
        title: data.title,
        subtitle: data.subtitle,
        "aria-label": data.title,
        legend: data.series.length > 1 ? /* @__PURE__ */ jsx2(ChartLegend, { items: legendItems }) : void 0,
        children: /* @__PURE__ */ jsx2(ResponsiveContainer, { children: /* @__PURE__ */ jsxs2(AreaChart, { data: data.data, margin: { top: 8, right: 8, bottom: 0, left: 0 }, children: [
          /* @__PURE__ */ jsx2(CartesianGrid, { vertical: false, stroke: palette.grid }),
          /* @__PURE__ */ jsx2(XAxis, { dataKey: data.xKey, ...axis }),
          /* @__PURE__ */ jsx2(YAxis, { ...axis, width: 36, tickFormatter: (v) => fmt(v) }),
          /* @__PURE__ */ jsx2(Tooltip, { content: tooltip, cursor: { stroke: palette.grid } }),
          data.series.map((s, i) => /* @__PURE__ */ jsx2(
            Area,
            {
              type: "linear",
              dataKey: s.key,
              name: s.label,
              stroke: color(i, s.color),
              strokeWidth: 2,
              fill: color(i, s.color),
              fillOpacity: data.kind === "area" || data.series.length === 1 ? 0.12 : 0,
              stackId: data.stacked ? "a" : void 0,
              isAnimationActive: !still,
              animationDuration: 600,
              activeDot: { r: 4 },
              dot: (p) => p.index === lastIndex && p.cx !== void 0 && p.cy !== void 0 ? /* @__PURE__ */ jsx2("circle", { cx: p.cx, cy: p.cy, r: 4, fill: color(i, s.color) }, `end-${s.key}`) : /* @__PURE__ */ jsx2("g", {}, `dot-${s.key}-${p.index}`)
            },
            s.key
          ))
        ] }) })
      }
    );
  }
  return /* @__PURE__ */ jsx2(ChartCard, { title: data.title, subtitle: data.subtitle, "aria-label": data.title, legend: /* @__PURE__ */ jsx2(ChartLegend, { items: legendItems }), children: /* @__PURE__ */ jsx2(ResponsiveContainer, { children: /* @__PURE__ */ jsxs2(BarChart, { data: data.data, margin: { top: 8, right: 8, bottom: 0, left: 0 }, barGap: 4, children: [
    /* @__PURE__ */ jsx2(CartesianGrid, { vertical: false, stroke: palette.grid }),
    /* @__PURE__ */ jsx2(XAxis, { dataKey: data.xKey, ...axis }),
    /* @__PURE__ */ jsx2(YAxis, { ...axis, width: 36, tickFormatter: (v) => fmt(v) }),
    /* @__PURE__ */ jsx2(Tooltip, { content: tooltip, cursor: { fill: palette.track } }),
    data.series.map((s, i) => /* @__PURE__ */ jsx2(
      Bar,
      {
        dataKey: s.key,
        name: s.label,
        fill: color(i, s.color),
        radius: [2, 2, 0, 0],
        maxBarSize: 24,
        stackId: data.stacked ? "a" : void 0,
        isAnimationActive: !still,
        animationDuration: 600
      },
      s.key
    ))
  ] }) }) });
}
var ChartBlock = memo(ChartBlockImpl, (a, b) => a.data === b.data);
var chartBlock = defineBlock({
  name: "chart",
  type: BLOCK_TYPES.chart,
  parse: parseChart,
  render: ChartBlock,
  toText: (d) => [d.title, d.subtitle].filter(Boolean).join(" \u2014 ")
});
export {
  CHART_SERIES,
  ChartBlock,
  ChartCard,
  ChartLegend,
  ChartTooltipContent,
  chartBlock,
  chartPalette,
  parseChart,
  useChartPalette,
  useResolvedScheme
};
//# sourceMappingURL=charts.js.map