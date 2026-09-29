"use client";
"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

var _chunkD7SVFE66cjs = require('./chunk-D7SVFE66.cjs');





var _chunkBSRSFPS7cjs = require('./chunk-BSRSFPS7.cjs');

// src/charts/ChartBlock.tsx
var _atoms = require('@neofloai/atoms');
var _tokens = require('@neofloai/atoms/tokens');
var _react = require('react');













var _recharts = require('recharts');

// src/charts/ChartCard.tsx


var _jsxruntime = require('react/jsx-runtime');
function ChartLegend({ items, direction = "row" }) {
  if (!items.length) return null;
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Stack, { component: "ul", direction, sx: { listStyle: "none", m: 0, p: 0, flexWrap: "wrap", columnGap: 2, rowGap: 1 }, children: items.map((item, i) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Stack, { component: "li", direction: "row", spacing: 0.75, sx: { alignItems: "center" }, children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { "aria-hidden": true, sx: { width: 8, height: 8, borderRadius: 0.25, backgroundColor: item.color, flexShrink: 0 } }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "body2", component: "span", sx: (t) => _chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.b2 }), children: item.label }),
    item.value !== void 0 ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "body2", component: "span", sx: (t) => _chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.b1 }), children: item.value }) : null
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
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Card, { component: "figure", "aria-label": ariaLabel, sx: { m: 0, maxWidth: 560 }, children: [
    title || subtitle ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.CardHeader, { title, subheader: subtitle }) : null,
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.CardContent, { children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { sx: { width: "100%", height, position: "relative" }, children }),
      legend ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { sx: { mt: 2 }, children: legend }) : null
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
  if (!active || !_optionalChain([payload, 'optionalAccess', _ => _.length])) return null;
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    _atoms.Box,
    {
      sx: { px: 1.5, py: 1.25, borderRadius: 1, minWidth: 140, backgroundColor: palette.tooltipBg, color: palette.tooltipText },
      children: [
        label !== void 0 && label !== "" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "body2", weight: "medium", component: "div", sx: { color: palette.tooltipText, mb: 0.5 }, children: label }) : null,
        payload.map((row, i) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Stack, { direction: "row", spacing: 0.75, sx: { alignItems: "center", py: 0.25 }, children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { "aria-hidden": true, sx: { width: 8, height: 8, borderRadius: 0.25, backgroundColor: row.color, flexShrink: 0 } }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "body2", component: "span", sx: { flex: 1, color: palette.tooltipMuted }, children: row.name }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "body2", component: "span", sx: { color: palette.tooltipText, ml: 2 }, children: format(row.value) })
        ] }, i))
      ]
    }
  );
}

// src/charts/palette.ts



var CHART_SERIES = {
  light: [_tokens.colors.primary[500], _tokens.colors.blue[200], _tokens.colors.green[200], _tokens.colors.orange[400], _tokens.colors.purple[300], _tokens.colors.grey[400]],
  dark: [_tokens.colors.primary[400], _tokens.colors.blue[300], _tokens.colors.green[300], _tokens.colors.orange[400], _tokens.colors.purple[400], _tokens.colors.grey[500]]
};
function useResolvedScheme() {
  const { mode: mode2, systemMode } = _atoms.useColorScheme.call(void 0, );
  const resolved = mode2 === "system" ? systemMode : mode2;
  return resolved === "dark" ? "dark" : "light";
}
function chartPalette(scheme) {
  return {
    series: CHART_SERIES[scheme],
    grid: _tokens.border.layers.card1[scheme],
    axis: _tokens.text.default.b3[scheme],
    track: _tokens.surface.layers.card2[scheme],
    tooltipBg: _tokens.surface.layers.card4OnColor[scheme],
    tooltipText: _tokens.text.default["heading on-color"][scheme],
    tooltipMuted: _tokens.text.default["caption on-color"][scheme]
  };
}
function useChartPalette() {
  const scheme = useResolvedScheme();
  return _react.useMemo.call(void 0, () => chartPalette(scheme), [scheme]);
}

// src/charts/ChartBlock.tsx

var TICK = _tokens.typography.body.caption.size + 1;
function subscribeMotion(cb) {
  if (typeof window === "undefined" || !window.matchMedia) return () => void 0;
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  _optionalChain([mq, 'access', _2 => _2.addEventListener, 'optionalCall', _3 => _3("change", cb)]);
  return () => _optionalChain([mq, 'access', _4 => _4.removeEventListener, 'optionalCall', _5 => _5("change", cb)]);
}
var reducedMotion = () => typeof window !== "undefined" && Boolean(_optionalChain([window, 'access', _6 => _6.matchMedia, 'optionalCall', _7 => _7("(prefers-reduced-motion: reduce)"), 'access', _8 => _8.matches]));
function usePrefersReducedMotion() {
  return _react.useSyncExternalStore.call(void 0, subscribeMotion, reducedMotion, () => false);
}
function ChartBlockImpl({ data }) {
  const palette = useChartPalette();
  const still = usePrefersReducedMotion();
  const color = (i, override) => _nullishCoalesce(override, () => ( palette.series[i % palette.series.length]));
  const fmt = (v) => _chunkBSRSFPS7cjs.formatValue.call(void 0, v, { format: _nullishCoalesce(data.valueFormat, () => ( "number")), currency: data.currency });
  const tooltip = (props) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
  const donutRows = _react.useMemo.call(void 0, () => {
    if (data.kind !== "donut") return [];
    const key = _nullishCoalesce(_optionalChain([data, 'access', _9 => _9.series, 'access', _10 => _10[0], 'optionalAccess', _11 => _11.key]), () => ( "value"));
    return data.data.map((d, i) => ({ name: String(_nullishCoalesce(d[data.xKey], () => ( ""))), value: Number(d[key]) || 0, color: color(i) }));
  }, [data, palette]);
  if (!data.data.length) return null;
  if (data.kind === "donut") {
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ChartCard, { title: data.title, subtitle: data.subtitle, height: 140, "aria-label": data.title, children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Stack, { direction: "row", spacing: 2.5, sx: { alignItems: "center", height: "100%" }, children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Box, { sx: { position: "relative", width: 140, height: 140, flexShrink: 0 }, children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _recharts.ResponsiveContainer, { children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _recharts.PieChart, { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _recharts.Pie,
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
              children: donutRows.map((r) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _recharts.Cell, { fill: r.color }, r.name))
            }
          ),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _recharts.Tooltip, { content: tooltip })
        ] }) }),
        data.total ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
          _atoms.Stack,
          {
            sx: { position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", pointerEvents: "none" },
            children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "h5", component: "div", children: data.total.value }),
              data.total.label ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "caption", component: "div", children: data.total.label }) : null
            ]
          }
        ) : null
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        ChartLegend,
        {
          direction: "column",
          items: donutRows.map((r) => ({ label: r.name, color: r.color, value: fmt(r.value) }))
        }
      )
    ] }) });
  }
  if (data.kind === "line" || data.kind === "area") {
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      ChartCard,
      {
        title: data.title,
        subtitle: data.subtitle,
        "aria-label": data.title,
        legend: data.series.length > 1 ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ChartLegend, { items: legendItems }) : void 0,
        children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _recharts.ResponsiveContainer, { children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _recharts.AreaChart, { data: data.data, margin: { top: 8, right: 8, bottom: 0, left: 0 }, children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _recharts.CartesianGrid, { vertical: false, stroke: palette.grid }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _recharts.XAxis, { dataKey: data.xKey, ...axis }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _recharts.YAxis, { ...axis, width: 36, tickFormatter: (v) => fmt(v) }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _recharts.Tooltip, { content: tooltip, cursor: { stroke: palette.grid } }),
          data.series.map((s, i) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _recharts.Area,
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
              dot: (p) => p.index === lastIndex && p.cx !== void 0 && p.cy !== void 0 ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "circle", { cx: p.cx, cy: p.cy, r: 4, fill: color(i, s.color) }, `end-${s.key}`) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "g", {}, `dot-${s.key}-${p.index}`)
            },
            s.key
          ))
        ] }) })
      }
    );
  }
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ChartCard, { title: data.title, subtitle: data.subtitle, "aria-label": data.title, legend: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ChartLegend, { items: legendItems }), children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _recharts.ResponsiveContainer, { children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _recharts.BarChart, { data: data.data, margin: { top: 8, right: 8, bottom: 0, left: 0 }, barGap: 4, children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _recharts.CartesianGrid, { vertical: false, stroke: palette.grid }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _recharts.XAxis, { dataKey: data.xKey, ...axis }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _recharts.YAxis, { ...axis, width: 36, tickFormatter: (v) => fmt(v) }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _recharts.Tooltip, { content: tooltip, cursor: { fill: palette.track } }),
    data.series.map((s, i) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      _recharts.Bar,
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
var ChartBlock = _react.memo.call(void 0, ChartBlockImpl, (a, b) => a.data === b.data);
var chartBlock = _chunkBSRSFPS7cjs.defineBlock.call(void 0, {
  name: "chart",
  type: _chunkBSRSFPS7cjs.BLOCK_TYPES.chart,
  parse: _chunkBSRSFPS7cjs.parseChart,
  render: ChartBlock,
  toText: (d) => [d.title, d.subtitle].filter(Boolean).join(" \u2014 ")
});











exports.CHART_SERIES = CHART_SERIES; exports.ChartBlock = ChartBlock; exports.ChartCard = ChartCard; exports.ChartLegend = ChartLegend; exports.ChartTooltipContent = ChartTooltipContent; exports.chartBlock = chartBlock; exports.chartPalette = chartPalette; exports.parseChart = _chunkBSRSFPS7cjs.parseChart; exports.useChartPalette = useChartPalette; exports.useResolvedScheme = useResolvedScheme;
//# sourceMappingURL=charts.cjs.map