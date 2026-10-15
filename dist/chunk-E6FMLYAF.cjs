"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
// src/registry/registry.ts
var toList = (v) => v === void 0 ? [] : typeof v === "string" ? [v] : v;
function defineBlock(definition) {
  const render = _optionalChain([definition, 'optionalAccess', _ => _.render]);
  if (!render || typeof render !== "function" && typeof render !== "object") {
    throw new Error("[agentic-chat] defineBlock needs a `render` component.");
  }
  if (!definition.type && !definition.category && !definition.match) {
    throw new Error("[agentic-chat] defineBlock needs a `type`, `category` or `match`.");
  }
  return definition;
}
function createBlockRegistry(definitions, fallback) {
  const reversed = [...definitions].reverse();
  const matchers = reversed.filter((d) => typeof d.match === "function");
  const byType = /* @__PURE__ */ new Map();
  const byCategory = /* @__PURE__ */ new Map();
  for (const d of definitions) {
    for (const t of toList(d.type)) byType.set(t, d);
    for (const c of toList(d.category)) byCategory.set(c, d);
  }
  const resolve = (block) => {
    for (const d of matchers) {
      try {
        if (d.match(block)) return d;
      } catch (e) {
      }
    }
    const exact = byType.get(block.type);
    if (exact) return exact;
    if (block.type.includes(".")) return fallback;
    return _nullishCoalesce(byCategory.get(block.category), () => ( fallback));
  };
  return {
    definitions,
    fallback,
    resolve,
    deltaResolver: (block) => _optionalChain([resolve, 'call', _2 => _2(block), 'optionalAccess', _3 => _3.applyDelta])
  };
}

// src/blocks/parsers.ts
var BLOCK_TYPES = {
  text: ["text", "markdown"],
  thinking: ["thinking", "reasoning"],
  /** `tool_result` renders inside its tool call's card; one with no matching call gets its own. */
  toolCall: ["tool_call", "tool_use", "tool", "tool_result"],
  table: ["table", "data_table"],
  sources: ["sources", "citations"],
  approval: ["approval", "hitl_approval", "confirmation"],
  choice: ["choice", "hitl_choice", "selection"],
  error: ["error"],
  artifact: ["artifact", "document"],
  image: ["image"],
  plan: ["plan", "steps"],
  chart: ["chart"]
};
var obj = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
var arr = (v) => Array.isArray(v) ? v : [];
var str = (v, fallback = "") => typeof v === "string" ? v : typeof v === "number" ? String(v) : fallback;
var optStr = (v) => typeof v === "string" && v.trim() ? v : void 0;
var num = (v) => typeof v === "number" && Number.isFinite(v) ? v : void 0;
var first = (...vals) => vals.find((v) => v !== void 0 && v !== null);
function elapsed(cb) {
  return _optionalChain([cb, 'optionalAccess', _4 => _4.startedAt]) && cb.completedAt && cb.completedAt >= cb.startedAt ? cb.completedAt - cb.startedAt : void 0;
}
var parseText = (b) => ({ text: str(first(b.text, b.markdown, b.content)) });
var parseThinking = (b, cb) => ({
  text: str(first(b.thinking, b.text)),
  durationMs: _nullishCoalesce(num(b.duration_ms), () => ( elapsed(cb)))
});
function parsePartialJson(v) {
  if (typeof v !== "string" || !v.trim()) return {};
  try {
    return obj(JSON.parse(v));
  } catch (e2) {
    return {};
  }
}
function inlineStatus(b, cb) {
  const rawStatus = str(b.status).toLowerCase();
  if (rawStatus === "error" || rawStatus === "failed" || b.is_error === true || optStr(b.error)) return "error";
  if (rawStatus === "running" || rawStatus === "in_progress" || _optionalChain([cb, 'optionalAccess', _5 => _5.status]) === "streaming" && rawStatus !== "success") {
    return "running";
  }
  return "success";
}
function resultItems(v) {
  if (!Array.isArray(v)) return void 0;
  return v.flatMap((raw) => {
    const o = typeof raw === "string" ? { title: raw } : obj(raw);
    const title = optStr(first(o.title, o.label, o.name));
    const snippet = optStr(first(o.snippet, o.description, o.text));
    if (!title && !snippet) return [];
    return [
      { title: _nullishCoalesce(title, () => ( snippet)), ...title && snippet ? { snippet } : {}, ...optStr(o.url) ? { url: optStr(o.url) } : {} }
    ];
  });
}
var parseToolCall = (b, cb) => {
  const ownResult = b.type === "tool_result";
  const paired = _optionalChain([cb, 'optionalAccess', _6 => _6.toolResult]);
  const r = _nullishCoalesce(_optionalChain([paired, 'optionalAccess', _7 => _7.data]), () => ( (ownResult ? b : void 0)));
  const input = ownResult ? {} : obj(first(b.input, b.arguments, b.args, b.parameters));
  const inputEntries = Object.entries(Object.keys(input).length ? input : parsePartialJson(b.partial_json));
  let status;
  if (r) {
    const failed = r.is_error === true || ["error", "failed"].includes(str(r.status).toLowerCase());
    status = _optionalChain([paired, 'optionalAccess', _8 => _8.status]) === "streaming" ? "running" : failed ? "error" : "success";
  } else if (_optionalChain([cb, 'optionalAccess', _9 => _9.toolResultMissing])) {
    status = "interrupted";
  } else if (b.type === "tool_use" && b.status === void 0 && b.output === void 0 && b.result === void 0) {
    status = b.is_error === true ? "error" : "running";
  } else {
    status = inlineStatus(b, cb);
  }
  const results = r ? resultItems(r.results) : void 0;
  const errorText = status === "error" ? _nullishCoalesce(optStr(first(_optionalChain([r, 'optionalAccess', _10 => _10.error]), _optionalChain([r, 'optionalAccess', _11 => _11.message]), b.error)), () => ( optStr(first(_optionalChain([r, 'optionalAccess', _12 => _12.error_code]), b.error_code)))) : optStr(b.error);
  const durationMs = _nullishCoalesce(num(first(_optionalChain([r, 'optionalAccess', _13 => _13.duration_ms]), b.duration_ms)), () => ( (_optionalChain([paired, 'optionalAccess', _14 => _14.completedAt]) && _optionalChain([cb, 'optionalAccess', _15 => _15.startedAt]) && paired.completedAt >= cb.startedAt ? paired.completedAt - cb.startedAt : r ? void 0 : elapsed(cb))));
  return {
    name: str(first(b.name, b.tool_name, b.tool, _optionalChain([r, 'optionalAccess', _16 => _16.tool]), _optionalChain([r, 'optionalAccess', _17 => _17.tool_name])), "tool"),
    title: optStr(b.title),
    status,
    input: inputEntries,
    output: r ? results ? void 0 : first(r.output, r.content, r.result) : first(b.output, b.result),
    summary: optStr(first(_optionalChain([r, 'optionalAccess', _18 => _18.result_summary]), _optionalChain([r, 'optionalAccess', _19 => _19.summary]), b.result_summary, b.summary)),
    ...results ? { results } : {},
    ...r && num(r.result_count) !== void 0 ? { resultCount: num(r.result_count) } : {},
    durationMs,
    error: errorText
  };
};
var parseFallback = (b) => ({ text: optStr(b.fallback_text) });
var NUMERIC = /* @__PURE__ */ new Set(["number", "currency", "percent"]);
var parseTable = (b) => {
  let columns = arr(b.columns).map((c, i) => {
    if (typeof c === "string") return { key: c, label: c, align: "left" };
    const o = obj(c);
    const key = str(first(o.key, o.id, o.field, o.name), `col_${i}`);
    const format = optStr(o.format);
    const align = _nullishCoalesce(optStr(o.align), () => ( (format && NUMERIC.has(format) ? "right" : "left")));
    return { key, label: str(first(o.label, o.title, o.header), key), align, format, currency: optStr(o.currency) };
  });
  const rawRows = arr(b.rows);
  const rows = rawRows.map((r) => {
    if (Array.isArray(r)) return Object.fromEntries(columns.map((c, i) => [c.key, r[i]]));
    return obj(r);
  });
  if (!columns.length && rows[0]) {
    columns = Object.keys(rows[0]).map((k) => ({
      key: k,
      label: k,
      align: typeof rows[0][k] === "number" ? "right" : "left"
    }));
  }
  return { title: optStr(b.title), columns, rows, totalRows: _nullishCoalesce(num(first(b.total_rows, b.row_count)), () => ( rows.length)) };
};
var parseSources = (b) => {
  const items = arr(first(b.items, b.sources, b.citations)).map((raw, i) => {
    const o = typeof raw === "string" ? { label: raw } : obj(raw);
    return {
      id: str(first(o.id, o.source_id), String(i)),
      label: str(first(o.label, o.title, o.name), `Source ${i + 1}`),
      description: optStr(first(o.description, o.snippet, o.subtitle)),
      url: optStr(first(o.url, o.href)),
      kind: optStr(first(o.kind, o.type)),
      selected: typeof first(o.selected, o.used) === "boolean" ? Boolean(first(o.selected, o.used)) : void 0
    };
  });
  return {
    title: optStr(b.title),
    selectable: b.selectable === true || items.some((i) => i.selected !== void 0),
    items
  };
};
var parseApproval = (b) => {
  const tone = str(first(b.tone, b.severity));
  return {
    title: str(first(b.title, b.question, b.prompt), ""),
    description: optStr(first(b.description, b.body, b.message, b.text)),
    approveLabel: optStr(first(b.approve_label, b.confirm_label)),
    rejectLabel: optStr(first(b.reject_label, b.cancel_label)),
    approveValue: _nullishCoalesce(first(b.approve_value), () => ( "approve")),
    rejectValue: _nullishCoalesce(first(b.reject_value), () => ( "reject")),
    tone: tone === "danger" || tone === "error" ? "danger" : tone === "warning" ? "warning" : "default",
    details: Object.entries(obj(b.details))
  };
};
var parseChoice = (b, cb) => {
  const requires = obj(_optionalChain([cb, 'optionalAccess', _20 => _20.checkpoint, 'optionalAccess', _21 => _21.requires]));
  const options = arr(first(b.options, requires.options)).map((raw) => {
    if (typeof raw === "string") return { value: raw, label: raw };
    const o = obj(raw);
    const value = str(first(o.value, o.id), "");
    return { value, label: str(first(o.label, o.title), value), description: optStr(o.description) };
  });
  const multiple = Boolean(first(b.multiple, b.multi_select, requires.multiple));
  return {
    title: str(first(b.title, b.question, b.prompt), ""),
    description: optStr(first(b.description, b.body)),
    options: options.filter((o) => o.value !== ""),
    multiple,
    min: _nullishCoalesce(num(first(b.min, b.min_selections, requires.min)), () => ( 1)),
    max: _nullishCoalesce(num(first(b.max, b.max_selections, requires.max)), () => ( (multiple ? void 0 : 1))),
    submitLabel: optStr(b.submit_label)
  };
};
var parseError = (b) => ({
  title: str(first(b.title, b.error_type), "Something went wrong"),
  message: optStr(first(b.message, b.detail, b.text)),
  retryable: b.retryable !== false,
  retryAfter: num(b.retry_after),
  code: optStr(first(b.code, b.error_type))
});
var EXT_FORMAT = { md: "markdown", markdown: "markdown", txt: "text", json: "json", csv: "csv" };
var parseArtifact = (b) => {
  const title = str(first(b.filename, b.title, b.name), "Untitled");
  const ext = title.includes(".") ? title.split(".").pop().toLowerCase() : "";
  return {
    title,
    format: str(first(b.format, b.language), _nullishCoalesce(EXT_FORMAT[ext], () => ( (ext || "text")))),
    content: _nullishCoalesce(optStr(first(b.content, b.text)), () => ( (typeof b.content === "string" ? b.content : void 0))),
    url: optStr(b.url),
    mimeType: optStr(first(b.mime_type, b.content_type)),
    size: num(b.size)
  };
};
var parseImage = (b) => {
  const src = str(first(b.url, b.src));
  if (!src) throw new Error("image block has no url");
  return {
    src,
    alt: str(first(b.alt, b.caption), ""),
    caption: optStr(b.caption),
    width: num(b.width),
    height: num(b.height)
  };
};
var STEP_STATUS = {
  pending: "pending",
  todo: "pending",
  queued: "pending",
  running: "running",
  in_progress: "running",
  active: "running",
  done: "done",
  completed: "done",
  complete: "done",
  success: "done",
  failed: "failed",
  error: "failed",
  skipped: "skipped"
};
var parsePlan = (b) => ({
  title: optStr(b.title),
  steps: arr(b.steps).map((raw, i) => {
    const o = typeof raw === "string" ? { title: raw } : obj(raw);
    const detail = _nullishCoalesce(o.detail, () => ( o.details));
    return {
      id: str(o.id, String(i)),
      title: str(first(o.title, o.label, o.name), `Step ${i + 1}`),
      status: _nullishCoalesce(STEP_STATUS[str(o.status).toLowerCase()], () => ( "pending")),
      detail: typeof detail === "string" ? detail : detail && typeof detail === "object" ? Object.entries(obj(detail)) : void 0
    };
  })
});
function applyPlanDelta(block, _delta, snapshot) {
  if (Array.isArray(snapshot)) return { ...block, steps: snapshot };
  return void 0;
}
var KIND = { bar: "bar", column: "bar", line: "line", area: "area", donut: "donut", pie: "donut" };
var parseChart = (b) => {
  const data = arr(b.data).map(obj);
  const xKey = str(first(b.x_key, b.xKey, b.category_key), "label");
  let series = arr(b.series).map((s) => {
    if (typeof s === "string") return { key: s, label: s };
    const o = obj(s);
    const key = str(first(o.key, o.id, o.field), "value");
    return { key, label: str(first(o.label, o.name), key), color: optStr(o.color) };
  });
  if (!series.length && data[0]) {
    series = Object.keys(data[0]).filter((k) => k !== xKey && typeof data[0][k] === "number").map((k) => ({ key: k, label: k }));
  }
  const total = obj(b.total);
  return {
    kind: _nullishCoalesce(KIND[str(first(b.chart_type, b.kind, b.variant)).toLowerCase()], () => ( "bar")),
    title: optStr(b.title),
    subtitle: optStr(b.subtitle),
    xKey,
    series,
    data,
    stacked: b.stacked === true,
    total: total.value !== void 0 ? { value: str(total.value), label: optStr(total.label) } : void 0,
    valueFormat: optStr(b.value_format),
    currency: optStr(b.currency)
  };
};

// src/blocks/format.ts
function formatValue(value, { format = "text", currency, locale } = {}) {
  if (value === null || value === void 0 || value === "") return "\u2014";
  try {
    if (format === "number" && typeof value === "number") return value.toLocaleString(locale);
    if (format === "currency") {
      const n = typeof value === "number" ? value : Number(value);
      if (Number.isFinite(n)) {
        return currency ? new Intl.NumberFormat(locale, { style: "currency", currency }).format(n) : n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    }
    if (format === "percent") {
      const n = typeof value === "number" ? value : Number(value);
      if (Number.isFinite(n)) return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(n);
    }
    if (format === "date") {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) return d.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
    }
  } catch (e3) {
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch (e4) {
      return String(value);
    }
  }
  return String(value);
}
function formatJsonish(value) {
  if (typeof value === "string") return JSON.stringify(value);
  if (value === void 0) return "\u2014";
  try {
    const s = JSON.stringify(value);
    return s.length > 160 ? `${s.slice(0, 157)}\u2026` : s;
  } catch (e5) {
    return String(value);
  }
}
function humanizeKey(key) {
  return key.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}






















exports.defineBlock = defineBlock; exports.createBlockRegistry = createBlockRegistry; exports.BLOCK_TYPES = BLOCK_TYPES; exports.parseText = parseText; exports.parseThinking = parseThinking; exports.parseToolCall = parseToolCall; exports.parseFallback = parseFallback; exports.parseTable = parseTable; exports.parseSources = parseSources; exports.parseApproval = parseApproval; exports.parseChoice = parseChoice; exports.parseError = parseError; exports.parseArtifact = parseArtifact; exports.parseImage = parseImage; exports.parsePlan = parsePlan; exports.applyPlanDelta = applyPlanDelta; exports.parseChart = parseChart; exports.formatValue = formatValue; exports.formatJsonish = formatJsonish; exports.humanizeKey = humanizeKey;
//# sourceMappingURL=chunk-E6FMLYAF.cjs.map