import { describe, expect, it } from 'vitest';
import {
  defaultScopeToRequest,
  filterConversations,
  groupConversations,
  mergeWorkflowContexts,
  summarizeScope,
  type ConversationItem,
  type ScopeGroup,
} from '../../src/core';

const groups: ScopeGroup[] = [
  {
    id: 'ws_fin',
    label: 'Finance',
    items: [
      { id: 'ip', label: 'Invoice Processing' },
      { id: 'col', label: 'Collections' },
    ],
  },
  {
    id: 'ws_ap',
    label: 'Accounts Payable',
    items: [
      { id: 'ip', label: 'Invoice Processing' },
      { id: 'sa', label: 'Spend Analytics' },
    ],
  },
];

describe('scope', () => {
  it('maps a selection to workflow_context grouped by workflow', () => {
    const out = defaultScopeToRequest({ ws_fin: ['ip', 'col'], ws_ap: ['ip'] }, groups);
    expect(out.workflow_context).toEqual([
      { workflow_name: 'ip', workspace_id: ['ws_fin', 'ws_ap'], context: {} },
      { workflow_name: 'col', workspace_id: ['ws_fin'], context: {} },
    ]);
  });

  it('ignores ids that are not in the catalog, and sends nothing for an empty selection', () => {
    expect(defaultScopeToRequest({ ws_fin: ['ghost'] }, groups)).toEqual({});
  });

  it('summarizes for the "All workflows" / "N workflows" label', () => {
    expect(summarizeScope({ ws_fin: ['ip', 'col'], ws_ap: ['ip', 'sa'] }, groups)).toEqual({
      selected: 4,
      total: 4,
      allSelected: true,
    });
    expect(summarizeScope({ ws_fin: ['ip', 'col'] }, groups)).toMatchObject({ selected: 2, allSelected: false });
  });

  it('merges contexts by workflow name', () => {
    expect(
      mergeWorkflowContexts([{ workflow_name: 'ip', workspace_id: ['a'], context: { x: 1 } }], undefined, [
        { workflow_name: 'ip', workspace_id: ['a', 'b'], context: { y: 2 } },
      ]),
    ).toEqual([{ workflow_name: 'ip', workspace_id: ['a', 'b'], context: { x: 1, y: 2 } }]);
    expect(mergeWorkflowContexts(undefined, [])).toBeUndefined();
  });
});

describe('history helpers', () => {
  const now = new Date('2026-09-30T12:00:00').getTime();
  const item = (id: string, updatedAt: string, title = id): ConversationItem => ({
    id,
    title,
    createdAt: updatedAt,
    updatedAt,
    archived: false,
  });

  it('groups by recency and sorts newest first', () => {
    const groups = groupConversations(
      [
        item('old', '2026-06-01T10:00:00'),
        item('today2', '2026-09-30T08:00:00'),
        item('yday', '2026-09-29T20:00:00'),
        item('today1', '2026-09-30T11:00:00'),
        item('week', '2026-09-26T10:00:00'),
      ],
      now,
    );
    expect(groups.map((g) => g.key)).toEqual(['today', 'yesterday', 'previous7', 'older']);
    expect(groups[0]!.items.map((i) => i.id)).toEqual(['today1', 'today2']);
  });

  it('searches titles ignoring case and accents', () => {
    const items = [item('a', '2026-09-30T08:00:00', 'Café invoices'), item('b', '2026-09-30T08:00:00', 'Vendors')];
    expect(filterConversations(items, 'CAFE').map((i) => i.id)).toEqual(['a']);
    expect(filterConversations(items, '  ')).toHaveLength(2);
  });
});
