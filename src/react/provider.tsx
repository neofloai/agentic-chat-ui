import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ChatAdapter } from '../core/transport/adapter';
import { createChatRuntime, type ChatRuntime, type ChatRuntimeOptions, type RuntimeWarning } from '../core/runtime/runtime';
import type { ChatBlock } from '../core/store/types';
import { createBlockRegistry } from '../registry/registry';
import { isDev } from '../core/runtime/env';
import type { BlockDefinition, ChatAction } from '../registry/types';
import { ChatContext, ThreadContext, useChatContext, type ChatContextValue } from './context';
import { useStableArray, useStableObject } from './hooks/use-store';
import { defaultLabels, type ChatLabels } from './labels';

export interface ChatProviderProps extends Partial<Omit<ChatRuntimeOptions, 'adapter'>> {
  /** A runtime you created with `createChatRuntime`. Takes precedence over `adapter`. */
  runtime?: ChatRuntime;
  /** Shorthand: the provider creates (and later disposes) a runtime for this adapter. */
  adapter?: ChatAdapter;
  /** Block definitions. Later entries override earlier ones. */
  blocks?: readonly BlockDefinition[];
  /** Renders blocks nobody claims. */
  fallbackBlock?: BlockDefinition;
  /** Receives `actions.emit(...)` from cards: navigate, open a record, download… */
  onAction?: (action: ChatAction) => void;
  /** Override any UI string. */
  labels?: Partial<ChatLabels>;
  /** Controlled active conversation. `null` means a new chat. */
  conversationId?: string | null;
  onConversationChange?: (conversationId: string | null) => void;
  /** Rendered in place of a block whose renderer threw. */
  blockErrorFallback?: (error: Error, block: ChatBlock) => ReactNode;
  /** Start the runtime on mount (hydrate, load history, open a chat). @default true */
  autoStart?: boolean;
  children?: ReactNode;
}

export interface ExtendedChatContextValue extends ChatContextValue {
  blockErrorFallback?: (error: Error, block: ChatBlock) => ReactNode;
}

function devWarn(w: RuntimeWarning) {
  if (!isDev()) return;
  if (w.code === 'unknown_event' || w.code === 'busy' || w.code === 'awaiting_decision') return;
  console.warn(`[agentic-chat] ${w.message}`, w.data ?? '');
}

/**
 * Connects the chat engine to React. Everything else in the library (hooks, primitives,
 * `AgenticChat`) reads from the nearest provider.
 */
export function ChatProvider(props: ChatProviderProps) {
  const latest = useRef(props);
  latest.current = props;

  const [owned] = useState<ChatRuntime | null>(() => {
    if (props.runtime) return null;
    if (!props.adapter) throw new Error('[agentic-chat] <ChatProvider> needs a `runtime` or an `adapter`.');
    const {
      runtime: _r,
      adapter,
      blocks: _b,
      fallbackBlock: _f,
      onAction: _a,
      labels: _l,
      conversationId: _c,
      onConversationChange: _o,
      blockErrorFallback: _e,
      autoStart: _s,
      children: _ch,
      ...options
    } = props;
    return createChatRuntime({
      ...options,
      adapter,
      // Callbacks read the latest props so a re-render never needs a new runtime.
      workflowContext: () => {
        const w = latest.current.workflowContext;
        return typeof w === 'function' ? w() : w;
      },
      onEvent: (e, c) => latest.current.onEvent?.(e, c),
      onError: (e, r) => latest.current.onError?.(e, r),
      onWarning: (w) => (latest.current.onWarning ? latest.current.onWarning(w) : devWarn(w)),
    });
  });
  const runtime = props.runtime ?? owned!;

  // Dispose an owned runtime on a real unmount. StrictMode's unmount/remount runs the cleanup
  // and then the effect again synchronously, so the deferred check sees it mounted and keeps it.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (owned) {
        setTimeout(() => {
          if (!mounted.current) owned.dispose();
        }, 0);
      }
    };
  }, [owned]);

  const autoStart = props.autoStart ?? true;
  useEffect(() => {
    if (!autoStart) return;
    let cancelled = false;
    const initial = latest.current.conversationId;
    if (typeof initial === 'string') void runtime.selectConversation(initial);
    void runtime.start().then(() => {
      if (cancelled) return;
      const want = latest.current.conversationId;
      if (want !== undefined && runtime.session.getState().activeId !== want) void runtime.selectConversation(want);
    });
    return () => {
      cancelled = true;
    };
  }, [runtime, autoStart]);

  const firstControlled = useRef(true);
  useEffect(() => {
    if (firstControlled.current) {
      firstControlled.current = false;
      return;
    }
    const want = props.conversationId;
    if (want === undefined) return;
    if (runtime.session.getState().activeId !== want) void runtime.selectConversation(want);
  }, [props.conversationId, runtime]);

  useEffect(() => runtime.on('activeChange', (id) => latest.current.onConversationChange?.(id)), [runtime]);

  const blocks = useStableArray(props.blocks);
  const registry = useMemo(() => createBlockRegistry(blocks ?? [], props.fallbackBlock), [blocks, props.fallbackBlock]);
  useEffect(() => {
    runtime.setDeltaResolver(registry.deltaResolver);
  }, [runtime, registry]);

  const labelOverrides = useStableObject(props.labels);
  const labels = useMemo<ChatLabels>(() => ({ ...defaultLabels, ...labelOverrides }), [labelOverrides]);

  const onActionRef = useRef<((a: ChatAction) => void) | undefined>(undefined);
  onActionRef.current = props.onAction;
  const onAction = useMemo(() => (a: ChatAction) => onActionRef.current?.(a), []);
  const fallbackRef = useRef(props.blockErrorFallback);
  fallbackRef.current = props.blockErrorFallback;
  const hasFallback = Boolean(props.blockErrorFallback);

  const value = useMemo<ExtendedChatContextValue>(
    () => ({
      runtime,
      registry,
      labels,
      onAction,
      blockErrorFallback: hasFallback ? (e, b) => fallbackRef.current?.(e, b) : undefined,
    }),
    [runtime, registry, labels, onAction, hasFallback],
  );

  return <ChatContext.Provider value={value}>{props.children}</ChatContext.Provider>;
}

/** Pins the hooks and primitives below it to one conversation instead of the active one. */
export function ThreadProvider({ conversationId, children }: { conversationId: string | null; children?: ReactNode }) {
  const { runtime } = useChatContext();
  const handle = useMemo(() => runtime.getThread(conversationId), [runtime, conversationId]);
  return <ThreadContext.Provider value={handle}>{children}</ThreadContext.Provider>;
}
