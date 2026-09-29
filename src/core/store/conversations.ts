import type { ConversationGroup, ConversationGroupKey, ConversationItem } from './types';

const DAY = 24 * 60 * 60 * 1000;

export function sortConversations(items: ConversationItem[]): ConversationItem[] {
  return [...items].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function groupKeyFor(updatedAt: string, now: number = Date.now()): ConversationGroupKey {
  const t = Date.parse(updatedAt);
  if (Number.isNaN(t)) return 'older';
  const today = startOfDay(now);
  if (t >= today) return 'today';
  if (t >= today - DAY) return 'yesterday';
  if (t >= today - 7 * DAY) return 'previous7';
  if (t >= today - 30 * DAY) return 'previous30';
  return 'older';
}

const ORDER: ConversationGroupKey[] = ['today', 'yesterday', 'previous7', 'previous30', 'older'];

/** Groups a sorted list by recency, dropping empty groups. */
export function groupConversations(items: ConversationItem[], now: number = Date.now()): ConversationGroup[] {
  const buckets = new Map<ConversationGroupKey, ConversationItem[]>();
  for (const item of sortConversations(items)) {
    const key = groupKeyFor(item.updatedAt, now);
    const list = buckets.get(key);
    if (list) list.push(item);
    else buckets.set(key, [item]);
  }
  return ORDER.filter((k) => buckets.has(k)).map((key) => ({ key, items: buckets.get(key)! }));
}

/** Case- and accent-insensitive title search. */
export function filterConversations(items: ConversationItem[], query: string): ConversationItem[] {
  const q = fold(query.trim());
  if (!q) return items;
  return items.filter((i) => fold(i.title).includes(q));
}

function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
