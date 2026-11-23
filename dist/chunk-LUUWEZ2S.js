
// src/core/runtime/config.ts
var isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var str = (v) => typeof v === "string" && v.trim() ? v : void 0;
var count = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : void 0;
var NO_CONFIG_DEFAULTS = {
  hitl: true,
  attachments: true,
  workflowContext: true,
  archive: true,
  cancel: "server",
  perTurnModel: false,
  perTurnSources: true
};
function normalizeConfig(raw) {
  if (!isObject(raw)) return null;
  const caps = isObject(raw.capabilities) ? raw.capabilities : {};
  const capabilities = {};
  for (const key of [
    "hitl",
    "attachments",
    "workflow_context",
    "archive",
    "per_turn_model",
    "per_turn_sources",
    "conversation_pagination",
    "message_pagination",
    "stream_resume"
  ]) {
    if (typeof caps[key] === "boolean") capabilities[key] = caps[key];
  }
  if (caps.cancel === "server" || caps.cancel === "disconnect") capabilities.cancel = caps.cancel;
  const product = isObject(raw.product) ? raw.product : {};
  const models = (Array.isArray(raw.models) ? raw.models : []).flatMap((m) => {
    if (!isObject(m) || !str(m.id)) return [];
    return [{ id: m.id, label: str(m.label) ?? m.id, ...m.default === true ? { default: true } : {} }];
  });
  const sources = (Array.isArray(raw.sources) ? raw.sources : []).flatMap((s) => {
    if (!isObject(s) || !str(s.id)) return [];
    return [
      {
        id: s.id,
        label: str(s.label) ?? s.id,
        ...str(s.description) ? { description: s.description } : {},
        default_enabled: s.default_enabled === true,
        meta: isObject(s.meta) ? s.meta : {}
      }
    ];
  });
  const workflows = (Array.isArray(raw.workflows) ? raw.workflows : []).flatMap((w) => {
    if (!isObject(w) || !str(w.id)) return [];
    const workspaces = (Array.isArray(w.workspaces) ? w.workspaces : []).flatMap(
      (ws) => isObject(ws) && str(ws.id) ? [{ id: ws.id, label: str(ws.label) ?? ws.id }] : []
    );
    return [{ id: w.id, label: str(w.label) ?? w.id, workspaces }];
  });
  const rawLimits = isObject(raw.limits) ? raw.limits : {};
  const limits = {};
  const maxChars = count(rawLimits.max_message_chars);
  const maxFiles = count(rawLimits.max_attachments);
  const maxBytes = count(rawLimits.max_attachment_bytes);
  if (maxChars !== void 0) limits.max_message_chars = maxChars;
  if (maxFiles !== void 0) limits.max_attachments = maxFiles;
  if (maxBytes !== void 0) limits.max_attachment_bytes = maxBytes;
  if (Array.isArray(rawLimits.attachment_types)) {
    limits.attachment_types = rawLimits.attachment_types.filter((t) => typeof t === "string" && Boolean(t.trim()));
  }
  return {
    protocol_version: str(raw.protocol_version) ?? "",
    product: { id: str(product.id) ?? "", name: str(product.name) ?? "" },
    capabilities,
    models,
    sources,
    workflows,
    limits,
    ...isObject(raw.ext) ? { ext: raw.ext } : {}
  };
}
function resolveCapabilities(status, config, host = {}) {
  const c = status === "ready" && config ? config.capabilities : void 0;
  const flag = (server, hostValue, fallback) => {
    const base = c ? server === true : hostValue ?? fallback;
    return base && hostValue !== false;
  };
  return {
    hitl: flag(c?.hitl, host.hitl, NO_CONFIG_DEFAULTS.hitl),
    attachments: flag(c?.attachments, host.attachments, NO_CONFIG_DEFAULTS.attachments),
    workflowContext: flag(c?.workflow_context, host.workflowContext, NO_CONFIG_DEFAULTS.workflowContext),
    archive: flag(c?.archive, host.archive, NO_CONFIG_DEFAULTS.archive),
    perTurnModel: flag(c?.per_turn_model, host.perTurnModel, NO_CONFIG_DEFAULTS.perTurnModel),
    perTurnSources: flag(c?.per_turn_sources, host.perTurnSources, NO_CONFIG_DEFAULTS.perTurnSources),
    // A config that doesn't declare server cancel means the backend can't stop a run itself.
    cancel: host.cancel === "disconnect" ? "disconnect" : c ? c.cancel ?? "disconnect" : host.cancel ?? NO_CONFIG_DEFAULTS.cancel
  };
}
function scopeGroupsFromWorkflows(workflows) {
  const groups = /* @__PURE__ */ new Map();
  for (const w of workflows) {
    for (const ws of w.workspaces) {
      let g = groups.get(ws.id);
      if (!g) groups.set(ws.id, g = { id: ws.id, label: ws.label, items: [] });
      if (!g.items.some((i) => i.id === w.id)) g.items.push({ id: w.id, label: w.label });
    }
  }
  return [...groups.values()];
}
var SECRET_KEY = /token|secret|password|passwd|api[-_]?key|credential|authorization|bearer|cookie/i;
function stripCredentials(sources) {
  return sources.map((s) => {
    const meta = isObject(s.meta) ? s.meta : {};
    const keys = Object.keys(meta);
    const clean = keys.filter((k) => k === "connection" || !SECRET_KEY.test(k));
    if (clean.length === keys.length) return s;
    return { ...s, meta: Object.fromEntries(clean.map((k) => [k, meta[k]])) };
  });
}
function knownSources(sources, config) {
  if (!config?.sources.length) return { kept: sources, dropped: [] };
  const ids = new Set(config.sources.map((s) => s.id));
  return {
    kept: sources.filter((s) => ids.has(s.id)),
    dropped: sources.filter((s) => !ids.has(s.id)).map((s) => s.id)
  };
}

export {
  normalizeConfig,
  resolveCapabilities,
  scopeGroupsFromWorkflows,
  stripCredentials,
  knownSources
};
//# sourceMappingURL=chunk-LUUWEZ2S.js.map