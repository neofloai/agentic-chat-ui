import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { HitlDecision, Source } from '../../core/protocol/types';
import type { ChatRuntime, RuntimeEvents, SendOptions, ThreadHandle } from '../../core/runtime/runtime';
import { summarizeScope } from '../../core/runtime/scope';
import { filterConversations, groupConversations } from '../../core/store/conversations';
import type {
  Capabilities,
  ChatBlock,
  ChatConfigState,
  ChatMessage,
  RunState,
  ThreadMeta,
  ThreadState,
} from '../../core/store/types';
import type { BlockActions, ChatAction } from '../../registry/types';
import { BlockContext, MessageContext, ThreadContext, useChatContext } from '../context';
import type { ChatLabels } from '../labels';
import { shallowEqual, useStoreSelector } from './use-store';

export { useStoreSelector, shallowEqual, useStableArray, useLatestCallback } from './use-store';

const BUSY = new Set(['submitting', 'streaming', 'cancelling']);

export function useChatRuntime(): ChatRuntime {
  return useChatContext().runtime;
}

export function useLabels(): ChatLabels {
  return useChatContext().labels;
}

/** The backend's config (endpoint 0): `status`, the normalized `config`, and the `capabilities` in effect. */
export function useChatConfig(): ChatConfigState {
  const runtime = useChatRuntime();
  return useStoreSelector(runtime.chatConfig, (s) => s);
}

/** What the UI may use, after combining the backend's config with the host's switches. */
export function useCapabilities(): Capabilities {
  const runtime = useChatRuntime();
  return useStoreSelector(runtime.chatConfig, (s) => s.capabilities);
}

/** A source's display name from the config, falling back to its id. */
export function useSourceLabel(sourceId: string | null | undefined): string | undefined {
  const runtime = useChatRuntime();
  return useStoreSelector(runtime.chatConfig, (s) =>
    sourceId ? (s.config?.sources.find((x) => x.id === sourceId)?.label ?? sourceId) : undefined,
  );
}

export function useActiveConversationId(): string | null {
  const runtime = useChatRuntime();
  return useStoreSelector(runtime.session, (s) => s.activeId);
}

/** The thread these hooks read: the one pinned by `ThreadProvider`, else the active one. */
export function useThreadHandle(): ThreadHandle {
  const runtime = useChatRuntime();
  const pinned = useContext(ThreadContext);
  const activeKey = useStoreSelector(runtime.session, (s) => s.activeKey);
  const activeId = useStoreSelector(runtime.session, (s) => s.activeId);
  // `activeKey` changes when a new chat is saved and re-keyed; re-read the handle then too.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => pinned ?? runtime.getThread(activeId), [pinned, runtime, activeKey, activeId]);
}

export function useThread<T>(selector: (state: ThreadState) => T, isEqual?: (a: T, b: T) => boolean): T {
  const handle = useThreadHandle();
  return useStoreSelector(handle.store, selector, isEqual);
}

export function useMessages(): ChatMessage[] {
  return useThread((s) => s.messages);
}

export function useRun(): RunState {
  return useThread((s) => s.run, shallowEqual);
}

export function useThreadMeta(): ThreadMeta {
  return useThread((s) => s.meta);
}

export function useIsBusy(): boolean {
  return useThread((s) => BUSY.has(s.run.status));
}

export function useChatActions() {
  const runtime = useChatRuntime();
  const handle = useThreadHandle();
  const { onAction } = useChatContext();
  return useMemo(() => {
    const cid = () => handle.store.getState().conversationId;
    return {
      send: (text: string, options?: Omit<SendOptions, 'conversationId'>) =>
        runtime.send(text, { ...options, conversationId: cid() }),
      resume: (checkpointId: string, decision: HitlDecision) =>
        runtime.resume(checkpointId, decision, { conversationId: cid() ?? undefined }),
      cancel: () => runtime.cancel(cid()),
      retry: () => runtime.retry(cid()),
      canRetry: () => runtime.canRetry(cid()),
      reconnect: () => runtime.reconnect(cid()),
      newConversation: () => runtime.newConversation(),
      selectConversation: (id: string | null) => runtime.selectConversation(id),
      renameConversation: (id: string, title: string) => runtime.renameConversation(id, title),
      archiveConversation: (id: string, archived: boolean) => runtime.archiveConversation(id, archived),
      deleteConversation: (id: string) => runtime.deleteConversation(id),
      setModel: (model: string) => runtime.setModel(model, cid() ?? undefined),
      setDefaultSources: (sources: Source[]) => runtime.setDefaultSources(sources, cid() ?? undefined),
      emit: (name: string, payload?: unknown, extra?: Partial<ChatAction>) =>
        onAction?.({ name, payload, conversationId: cid(), ...extra }),
    };
  }, [runtime, handle, onAction]);
}

export function useComposer() {
  const runtime = useChatRuntime();
  const handle = useThreadHandle();
  const composer = useStoreSelector(handle.composer, (s) => s);
  const status = useStoreSelector(handle.store, (s) => s.run.status);
  const paused = useStoreSelector(handle.store, (s) => Boolean(s.pendingCheckpoint));
  const loadStatus = useStoreSelector(handle.store, (s) => s.loadStatus);
  const attachmentsAllowed = useStoreSelector(runtime.chatConfig, (s) => s.capabilities.attachments);
  const limits = useStoreSelector(runtime.chatConfig, (s) => s.config?.limits);

  const busy = BUSY.has(status);
  const uploading = composer.attachments.some((a) => a.status === 'uploading');
  const blockedByDecision = paused && runtime.config.composerWhilePaused === 'disabled';
  const hasContent = composer.text.trim().length > 0 || composer.attachments.some((a) => a.status === 'ready');
  const maxChars = limits?.max_message_chars || undefined;
  const tooLong = maxChars !== undefined && composer.text.trim().length > maxChars;
  const canSend = !busy && !uploading && !blockedByDecision && hasContent && !tooLong && loadStatus !== 'loading';
  const serverTypes = limits?.attachment_types?.length ? limits.attachment_types.join(',') : undefined;

  const cid = useCallback(() => handle.store.getState().conversationId, [handle]);
  return {
    text: composer.text,
    attachments: composer.attachments,
    busy,
    cancelling: status === 'cancelling',
    uploading,
    blockedByDecision,
    canSend,
    /** The backend's `max_message_chars`, when it sets one. */
    maxChars,
    /** The draft is longer than `maxChars`; sending is blocked. */
    tooLong,
    attachmentsEnabled: Boolean(runtime.config.attachments) && attachmentsAllowed,
    accept: runtime.config.attachments?.accept ?? serverTypes,
    setText: (text: string) => runtime.setDraft(text, cid()),
    send: () => (canSend ? runtime.send(handle.composer.getState().text, { conversationId: cid() }) : Promise.resolve()),
    cancel: () => runtime.cancel(cid()),
    addFiles: (files: Iterable<File>) => runtime.addAttachments(files, cid()),
    removeAttachment: (id: string) => runtime.removeAttachment(id, cid()),
  };
}

export function usePreference<T>(key: string, fallback: T): [T, (value: T) => void] {
  const runtime = useChatRuntime();
  const value = useStoreSelector(runtime.preferences, (p) => (key in p ? (p[key] as T) : fallback));
  const set = useCallback((v: T) => runtime.setPreference(key, v), [runtime, key]);
  return [value, set];
}

export function useConversations() {
  const runtime = useChatRuntime();
  const state = useStoreSelector(runtime.conversations, (s) => s);
  const activeId = useStoreSelector(runtime.session, (s) => s.activeId);
  const [query, setQuery] = useState('');
  const canArchive = useStoreSelector(runtime.chatConfig, (s) => s.capabilities.archive);
  const [archivedPref, setShowArchived] = usePreference('history.showArchived', false);
  const showArchived = canArchive && archivedPref;

  const items = useMemo(
    () =>
      filterConversations(
        state.items.filter((i) => showArchived || !i.archived),
        query,
      ),
    [state.items, showArchived, query],
  );
  const groups = useMemo(() => groupConversations(items), [items]);

  return {
    status: state.status,
    error: state.error,
    allItems: state.items,
    items,
    groups,
    activeId,
    runningIds: state.runningIds,
    isRunning: (id: string) => state.runningIds.includes(id),
    query,
    setQuery,
    showArchived,
    setShowArchived,
    /** The backend supports archiving (the `archive` capability). */
    canArchive,
    create: () => runtime.newConversation(),
    select: (id: string) => runtime.selectConversation(id),
    rename: (id: string, title: string) => runtime.renameConversation(id, title),
    remove: (id: string) => runtime.deleteConversation(id),
    archive: (id: string, archived: boolean) => runtime.archiveConversation(id, archived),
    refresh: () => runtime.refreshConversations(),
  };
}

export type GroupSelectionState = 'all' | 'some' | 'none';

export function useScope() {
  const runtime = useChatRuntime();
  const scope = useStoreSelector(runtime.scope, (s) => s);
  const allowed = useStoreSelector(runtime.chatConfig, (s) => s.capabilities.workflowContext);
  const summary = useMemo(() => summarizeScope(scope.selection, scope.groups), [scope.selection, scope.groups]);

  const current = () => runtime.scope.getState();
  return {
    /** A catalog exists (the host's `scope`, or the config's workflows) and the backend takes workflow context. */
    enabled: (runtime.config.hasScope || scope.origin === 'config') && allowed,
    status: scope.status,
    groups: scope.groups,
    selection: scope.selection,
    summary,
    isSelected: (groupId: string, itemId: string) => (scope.selection[groupId] ?? []).includes(itemId),
    groupState: (groupId: string): GroupSelectionState => {
      const g = scope.groups.find((x) => x.id === groupId);
      const n = (scope.selection[groupId] ?? []).length;
      if (!g || n === 0) return 'none';
      return n >= g.items.length ? 'all' : 'some';
    },
    toggle: (groupId: string, itemId: string) => {
      const s = current();
      const set = new Set(s.selection[groupId] ?? []);
      if (set.has(itemId)) set.delete(itemId);
      else set.add(itemId);
      runtime.setScopeSelection({ ...s.selection, [groupId]: [...set] });
    },
    setGroup: (groupId: string, selected: boolean) => {
      const s = current();
      const g = s.groups.find((x) => x.id === groupId);
      if (!g) return;
      runtime.setScopeSelection({ ...s.selection, [groupId]: selected ? g.items.map((i) => i.id) : [] });
    },
    setSelection: runtime.setScopeSelection.bind(runtime),
  };
}

export function useMessage() {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error('[agentic-chat] useMessage must be used inside a message (Message.Root / Thread.Messages).');
  return ctx;
}

export function useBlock() {
  const ctx = useContext(BlockContext);
  if (!ctx) throw new Error('[agentic-chat] useBlock must be used inside a rendered block.');
  return ctx;
}

/** The HITL state of the block being rendered, and how to answer it. */
export function useHitl() {
  const runtime = useChatRuntime();
  const handle = useThreadHandle();
  const ctx = useContext(BlockContext);
  const checkpoint = ctx?.block.checkpoint;
  const pendingId = useStoreSelector(handle.store, (s) => s.pendingCheckpoint?.checkpointId);
  const busy = useStoreSelector(handle.store, (s) => BUSY.has(s.run.status));
  const status = checkpoint?.status ?? 'none';
  const canSubmit = Boolean(checkpoint) && (status === 'pending' || status === 'failed') && pendingId === checkpoint?.id && !busy;
  return {
    checkpoint,
    status,
    requires: checkpoint?.requires,
    decision: checkpoint?.decision,
    error: checkpoint?.error,
    isPending: status === 'pending' || status === 'failed',
    isSubmitting: status === 'submitting',
    isResolved: status === 'resolved',
    /** The card is the live question and the thread isn't busy. */
    canSubmit,
    submit: (decision: HitlDecision) =>
      checkpoint && canSubmit
        ? runtime.resume(checkpoint.id, decision, { conversationId: handle.store.getState().conversationId ?? undefined })
        : Promise.resolve(),
  };
}

export function useBlockActions(block: ChatBlock, message: ChatMessage): BlockActions {
  const runtime = useChatRuntime();
  const handle = useThreadHandle();
  const { onAction } = useChatContext();
  return useMemo(() => {
    const cid = () => handle.store.getState().conversationId;
    return {
      send: (text: string) => void runtime.send(text, { conversationId: cid() }),
      resume: (decision: HitlDecision) =>
        block.checkpoint
          ? runtime.resume(block.checkpoint.id, decision, { conversationId: cid() ?? undefined })
          : Promise.resolve(),
      emit: (name: string, payload?: unknown) => onAction?.({ name, payload, block, message, conversationId: cid() }),
      retry: () => void runtime.retry(cid()),
    };
  }, [runtime, handle, onAction, block, message]);
}

/** Subscribes to runtime events (`event`, `error`, `warning`, `activeChange`). */
export function useChatEvent<K extends keyof RuntimeEvents>(type: K, listener: (...args: RuntimeEvents[K]) => void): void {
  const runtime = useChatRuntime();
  const ref = useRef(listener);
  ref.current = listener;
  useEffect(() => runtime.on(type, (...args) => ref.current(...args)), [runtime, type]);
}
