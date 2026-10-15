import type {
  ChatCapabilities,
  ChatConfig,
  ChatLimits,
  ConfigModel,
  ConfigSource,
  ConfigWorkflow,
  Source,
} from '../protocol/types';
import type { Capabilities, ConfigStatus, ScopeGroup } from '../store/types';

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v : undefined);
const count = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : undefined);

/**
 * The host's feature switches. Before a backend has a config endpoint they decide what the UI
 * shows; once it has one, they can only turn more off (`false` always wins).
 */
export interface CapabilityOverrides {
  hitl?: boolean;
  attachments?: boolean;
  workflowContext?: boolean;
  archive?: boolean;
  cancel?: 'server' | 'disconnect';
  perTurnModel?: boolean;
  perTurnSources?: boolean;
}

/** Without a config, everything the library had before stays on, except the per-turn model (gap #5 of schema v1). */
const NO_CONFIG_DEFAULTS: Capabilities = {
  hitl: true,
  attachments: true,
  workflowContext: true,
  archive: true,
  cancel: 'server',
  perTurnModel: false,
  perTurnSources: true,
};

/**
 * Reads endpoint 0 without trusting its shape: bad entries are dropped, missing lists become
 * empty. Returns `null` when the body isn't a config at all.
 */
export function normalizeConfig(raw: unknown): ChatConfig | null {
  if (!isObject(raw)) return null;
  const caps = isObject(raw.capabilities) ? raw.capabilities : {};
  const capabilities: ChatCapabilities = {};
  for (const key of [
    'hitl',
    'attachments',
    'workflow_context',
    'archive',
    'per_turn_model',
    'per_turn_sources',
    'conversation_pagination',
    'message_pagination',
    'stream_resume',
  ] as const) {
    if (typeof caps[key] === 'boolean') capabilities[key] = caps[key] as boolean;
  }
  if (caps.cancel === 'server' || caps.cancel === 'disconnect') capabilities.cancel = caps.cancel;

  const product = isObject(raw.product) ? raw.product : {};
  const models: ConfigModel[] = (Array.isArray(raw.models) ? raw.models : []).flatMap((m) => {
    if (!isObject(m) || !str(m.id)) return [];
    return [{ id: m.id as string, label: str(m.label) ?? (m.id as string), ...(m.default === true ? { default: true } : {}) }];
  });
  const sources: ConfigSource[] = (Array.isArray(raw.sources) ? raw.sources : []).flatMap((s) => {
    if (!isObject(s) || !str(s.id)) return [];
    return [
      {
        id: s.id as string,
        label: str(s.label) ?? (s.id as string),
        ...(str(s.description) ? { description: s.description as string } : {}),
        default_enabled: s.default_enabled === true,
        meta: isObject(s.meta) ? s.meta : {},
      },
    ];
  });
  const workflows: ConfigWorkflow[] = (Array.isArray(raw.workflows) ? raw.workflows : []).flatMap((w) => {
    if (!isObject(w) || !str(w.id)) return [];
    const workspaces = (Array.isArray(w.workspaces) ? w.workspaces : []).flatMap((ws) =>
      isObject(ws) && str(ws.id) ? [{ id: ws.id as string, label: str(ws.label) ?? (ws.id as string) }] : [],
    );
    return [{ id: w.id as string, label: str(w.label) ?? (w.id as string), workspaces }];
  });
  const rawLimits = isObject(raw.limits) ? raw.limits : {};
  const limits: ChatLimits = {};
  const maxChars = count(rawLimits.max_message_chars);
  const maxFiles = count(rawLimits.max_attachments);
  const maxBytes = count(rawLimits.max_attachment_bytes);
  if (maxChars !== undefined) limits.max_message_chars = maxChars;
  if (maxFiles !== undefined) limits.max_attachments = maxFiles;
  if (maxBytes !== undefined) limits.max_attachment_bytes = maxBytes;
  if (Array.isArray(rawLimits.attachment_types)) {
    limits.attachment_types = rawLimits.attachment_types.filter((t): t is string => typeof t === 'string' && Boolean(t.trim()));
  }

  return {
    protocol_version: str(raw.protocol_version) ?? '',
    product: { id: str(product.id) ?? '', name: str(product.name) ?? '' },
    capabilities,
    models,
    sources,
    workflows,
    limits,
    ...(isObject(raw.ext) ? { ext: raw.ext } : {}),
  };
}

/** What the UI may use: the backend's config first, the host's switches second, then defaults. */
export function resolveCapabilities(
  status: ConfigStatus,
  config: ChatConfig | undefined,
  host: CapabilityOverrides = {},
): Capabilities {
  // In a config the backend returned, a missing flag means "not supported".
  const c = status === 'ready' && config ? config.capabilities : undefined;
  const flag = (server: boolean | undefined, hostValue: boolean | undefined, fallback: boolean) => {
    const base = c ? server === true : (hostValue ?? fallback);
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
    cancel:
      host.cancel === 'disconnect' ? 'disconnect' : c ? (c.cancel ?? 'disconnect') : (host.cancel ?? NO_CONFIG_DEFAULTS.cancel),
  };
}

/**
 * The config's workflows as the scope picker's groups: one group per workspace, listing the
 * workflows available in it. The default mapping turns the selection into `workflow_context`.
 */
export function scopeGroupsFromWorkflows(workflows: ConfigWorkflow[]): ScopeGroup[] {
  const groups = new Map<string, ScopeGroup>();
  for (const w of workflows) {
    for (const ws of w.workspaces) {
      let g = groups.get(ws.id);
      if (!g) groups.set(ws.id, (g = { id: ws.id, label: ws.label, items: [] }));
      if (!g.items.some((i) => i.id === w.id)) g.items.push({ id: w.id, label: w.label });
    }
  }
  return [...groups.values()];
}

const SECRET_KEY = /token|secret|password|passwd|api[-_]?key|credential|authorization|bearer|cookie/i;

/**
 * Drops anything that looks like a credential from each source's `meta` before the library
 * keeps or stores it. Credentials belong on the server; the browser only keeps settings and
 * connection status.
 */
export function stripCredentials(sources: Source[]): Source[] {
  return sources.map((s) => {
    const meta = isObject(s.meta) ? s.meta : {};
    const keys = Object.keys(meta);
    // `connection` is the standard status object and never a secret.
    const clean = keys.filter((k) => k === 'connection' || !SECRET_KEY.test(k));
    if (clean.length === keys.length) return s;
    return { ...s, meta: Object.fromEntries(clean.map((k) => [k, meta[k]])) };
  });
}

/** F16: keeps only sources the config lists, when it lists any. */
export function knownSources(sources: Source[], config: ChatConfig | undefined): { kept: Source[]; dropped: string[] } {
  if (!config?.sources.length) return { kept: sources, dropped: [] };
  const ids = new Set(config.sources.map((s) => s.id));
  return {
    kept: sources.filter((s) => ids.has(s.id)),
    dropped: sources.filter((s) => !ids.has(s.id)).map((s) => s.id),
  };
}
