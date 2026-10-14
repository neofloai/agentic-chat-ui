import type { SendMessageBody, WorkflowContext } from '../protocol/types';
import type { ScopeGroup, ScopeSelection } from '../store/types';

/**
 * The composer's workflow picker. Groups are workspaces, items are workflows (the Figma
 * "SourcePicker"). The host supplies the catalog, or the runtime builds it from the config's `workflows`.
 */
export interface ScopeConfig {
  groups: ScopeGroup[] | (() => ScopeGroup[] | Promise<ScopeGroup[]>);
  /** What's selected before the user touches the picker. @default 'all' */
  defaultSelection?: 'all' | 'none' | ScopeSelection;
  /**
   * Turns the selection into request fields. The default builds `workflow_context`
   * (`[{ workflow_name: itemId, workspace_id: [groupIds…], context: {} }]`).
   */
  toRequest?: (selection: ScopeSelection, groups: ScopeGroup[]) => Partial<Pick<SendMessageBody, 'workflow_context' | 'sources'>>;
}

export function selectAll(groups: ScopeGroup[]): ScopeSelection {
  return Object.fromEntries(groups.map((g) => [g.id, g.items.map((i) => i.id)]));
}

/** Keeps only ids that still exist in the catalog. */
export function sanitizeSelection(selection: ScopeSelection | undefined, groups: ScopeGroup[]): ScopeSelection | undefined {
  if (!selection || typeof selection !== 'object') return undefined;
  const out: ScopeSelection = {};
  for (const g of groups) {
    const chosen = Array.isArray(selection[g.id]) ? selection[g.id]! : [];
    const valid = chosen.filter((id) => g.items.some((i) => i.id === id));
    if (valid.length) out[g.id] = valid;
  }
  return out;
}

export function initialSelection(config: ScopeConfig | undefined, groups: ScopeGroup[]): ScopeSelection {
  const d = config?.defaultSelection ?? 'all';
  if (d === 'all') return selectAll(groups);
  if (d === 'none') return {};
  return sanitizeSelection(d, groups) ?? {};
}

export function defaultScopeToRequest(selection: ScopeSelection, groups: ScopeGroup[]): { workflow_context?: WorkflowContext[] } {
  const byWorkflow = new Map<string, Set<string>>();
  for (const g of groups) {
    for (const itemId of selection[g.id] ?? []) {
      if (!g.items.some((i) => i.id === itemId)) continue;
      let set = byWorkflow.get(itemId);
      if (!set) byWorkflow.set(itemId, (set = new Set()));
      set.add(g.id);
    }
  }
  if (!byWorkflow.size) return {};
  return {
    workflow_context: [...byWorkflow].map(([workflow_name, ws]) => ({ workflow_name, workspace_id: [...ws], context: {} })),
  };
}

export interface ScopeSummary {
  selected: number;
  total: number;
  allSelected: boolean;
}

export function summarizeScope(selection: ScopeSelection, groups: ScopeGroup[]): ScopeSummary {
  let selected = 0;
  let total = 0;
  for (const g of groups) {
    total += g.items.length;
    const chosen = new Set(selection[g.id] ?? []);
    selected += g.items.filter((i) => chosen.has(i.id)).length;
  }
  return { selected, total, allSelected: total > 0 && selected === total };
}

/** Merges contexts by `workflow_name`: workspace ids are unioned, context bags shallow-merged. */
export function mergeWorkflowContexts(...lists: (WorkflowContext[] | undefined | null)[]): WorkflowContext[] | undefined {
  const map = new Map<string, WorkflowContext>();
  for (const list of lists) {
    for (const wc of list ?? []) {
      if (!wc || typeof wc.workflow_name !== 'string') continue;
      const prev = map.get(wc.workflow_name);
      const ids = Array.isArray(wc.workspace_id) ? wc.workspace_id : [];
      map.set(wc.workflow_name, {
        workflow_name: wc.workflow_name,
        workspace_id: [...new Set([...(prev?.workspace_id ?? []), ...ids])],
        context: { ...(prev?.context ?? {}), ...(wc.context ?? {}) },
      });
    }
  }
  return map.size ? [...map.values()] : undefined;
}
