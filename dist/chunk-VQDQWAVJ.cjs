"use client";
"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; } var _class;




var _chunkPF3MMMKGcjs = require('./chunk-PF3MMMKG.cjs');


var _chunkBSRSFPS7cjs = require('./chunk-BSRSFPS7.cjs');

// src/registry/error-boundary.tsx
var _react = require('react');
var BlockErrorBoundary = (_class = class extends _react.Component {constructor(...args2) { super(...args2); _class.prototype.__init.call(this); }
  __init() {this.state = { error: null, resetKey: this.props.resetKey }}
  static getDerivedStateFromError(error) {
    return { error };
  }
  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.resetKey) return { error: null, resetKey: props.resetKey };
    return null;
  }
  componentDidCatch(error, info) {
    _optionalChain([this, 'access', _ => _.props, 'access', _2 => _2.onError, 'optionalCall', _3 => _3(error, info)]);
  }
  render() {
    return this.state.error ? this.props.fallback(this.state.error) : this.props.children;
  }
}, _class);

// src/react/provider.tsx


// src/core/runtime/env.ts
function isDev() {
  try {
    return process.env.NODE_ENV !== "production";
  } catch (e2) {
    return false;
  }
}

// src/react/context.ts

var ChatContext = _react.createContext.call(void 0, null);
var ThreadContext = _react.createContext.call(void 0, null);
var MessageContext = _react.createContext.call(void 0, null);
var BlockContext = _react.createContext.call(void 0, null);
function useChatContext() {
  const ctx = _react.useContext.call(void 0, ChatContext);
  if (!ctx) {
    throw new Error(
      "[agentic-chat] This component must be rendered inside <ChatProvider> (or <AgenticChat>, which includes one)."
    );
  }
  return ctx;
}

// src/react/hooks/use-store.ts

var useIsomorphicLayoutEffect = typeof window !== "undefined" ? _react.useLayoutEffect : _react.useEffect;
function shallowEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!Object.prototype.hasOwnProperty.call(b, k) || !Object.is(a[k], b[k])) {
      return false;
    }
  }
  return true;
}
function useStoreSelector(store, selector, isEqual = Object.is) {
  const cache = _react.useRef.call(void 0, null);
  const selectorRef = _react.useRef.call(void 0, selector);
  const equalRef = _react.useRef.call(void 0, isEqual);
  selectorRef.current = selector;
  equalRef.current = isEqual;
  const getSnapshot = () => {
    const state = store.getState();
    const sel = selectorRef.current;
    const c = cache.current;
    if (c && c.state === state && c.selector === sel) return c.value;
    const value = sel(state);
    if (c && equalRef.current(c.value, value)) {
      cache.current = { state, selector: sel, value: c.value };
      return c.value;
    }
    cache.current = { state, selector: sel, value };
    return value;
  };
  return _react.useSyncExternalStore.call(void 0, store.subscribe, getSnapshot, getSnapshot);
}
function useStableArray(value) {
  const ref = _react.useRef.call(void 0, value);
  if (!shallowEqual(ref.current, value)) ref.current = value;
  return ref.current;
}
function useStableObject(value) {
  const ref = _react.useRef.call(void 0, value);
  if (!shallowEqual(ref.current, value)) ref.current = value;
  return ref.current;
}

// src/react/labels.ts
var defaultLabels = {
  composerPlaceholder: "Ask anything",
  composerAwaitingDecision: "Respond to the card above to continue",
  composerLabel: "Message",
  send: "Send",
  stop: "Stop",
  attach: "Attach files",
  removeAttachment: (name) => `Remove ${name}`,
  uploading: "Uploading\u2026",
  uploadFailed: "Upload failed",
  scopeAll: "All workflows",
  scopeSome: (n) => n === 1 ? "1 workflow" : `${n} workflows`,
  scopeNone: "No workflows",
  scopeSelectAll: "Select all",
  scopeDeselectAll: "Deselect all",
  scopeLabel: "Choose which workflows to ask about",
  newChat: "New chat",
  history: "History",
  openHistory: "Show chat history",
  closeHistory: "Hide chat history",
  searchChats: "Search chats",
  rename: "Rename",
  renameTitle: "Rename chat",
  save: "Save",
  delete: "Delete",
  deleteTitle: "Delete this chat?",
  deleteBody: "The conversation and its messages are removed. This can\u2019t be undone.",
  archive: "Archive",
  unarchive: "Unarchive",
  showArchived: "Show archived",
  hideArchived: "Hide archived",
  cancel: "Cancel",
  moreActions: (title) => `More actions for ${title}`,
  historyEmpty: "No chats yet",
  historyNoResults: "No chats match your search",
  historyError: "Couldn\u2019t load your chats.",
  running: "Replying\u2026",
  groupToday: "Today",
  groupYesterday: "Yesterday",
  groupPrevious7: "Previous 7 days",
  groupPrevious30: "Previous 30 days",
  groupOlder: "Older",
  thinkingLive: "Thinking\u2026",
  thoughtFor: (s) => s < 1 ? "Thought for a moment" : `Thought for ${s} ${s === 1 ? "second" : "seconds"}`,
  thought: "Thought",
  toolRunning: "Running\u2026",
  toolFailed: "Failed",
  rows: (n) => n === 1 ? "1 row" : `${n.toLocaleString()} rows`,
  sources: (n) => n === 1 ? "1 source" : `${n} sources`,
  sourcesTitle: "Sources",
  approve: "Approve",
  reject: "Not now",
  approved: "Approved",
  rejected: "Declined",
  submit: "Submit",
  submitted: "Submitted",
  selectAtLeast: (n) => `Choose at least ${n}.`,
  selectAtMost: (n) => `Choose up to ${n}.`,
  decisionFailed: "Your answer didn\u2019t go through.",
  tryAgain: "Try again",
  tryAgainIn: (s) => `Try again in ${s}s`,
  openFull: "Open",
  close: "Close",
  download: "Download",
  imageFailed: "The image couldn\u2019t be loaded.",
  planRunning: "In progress",
  copy: "Copy",
  copied: "Copied",
  jumpToLatest: "Jump to latest",
  loadError: "Couldn\u2019t load this chat.",
  reload: "Reload",
  interrupted: "The reply was interrupted.",
  stopped: "Stopped",
  unknownBlock: "Unsupported content",
  blockCrashed: "This part of the answer couldn\u2019t be displayed.",
  welcomeTitle: "What can I help you with?"
};

// src/react/provider.tsx
var _jsxruntime = require('react/jsx-runtime');
function devWarn(w) {
  if (!isDev()) return;
  if (w.code === "unknown_event" || w.code === "busy" || w.code === "awaiting_decision") return;
  console.warn(`[agentic-chat] ${w.message}`, _nullishCoalesce(w.data, () => ( "")));
}
function ChatProvider(props) {
  const latest = _react.useRef.call(void 0, props);
  latest.current = props;
  const [owned] = _react.useState.call(void 0, () => {
    if (props.runtime) return null;
    if (!props.adapter) throw new Error("[agentic-chat] <ChatProvider> needs a `runtime` or an `adapter`.");
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
    return _chunkPF3MMMKGcjs.createChatRuntime.call(void 0, {
      ...options,
      adapter,
      // Callbacks read the latest props so a re-render never needs a new runtime.
      workflowContext: () => {
        const w = latest.current.workflowContext;
        return typeof w === "function" ? w() : w;
      },
      onEvent: (e, c) => _optionalChain([latest, 'access', _4 => _4.current, 'access', _5 => _5.onEvent, 'optionalCall', _6 => _6(e, c)]),
      onError: (e, r) => _optionalChain([latest, 'access', _7 => _7.current, 'access', _8 => _8.onError, 'optionalCall', _9 => _9(e, r)]),
      onWarning: (w) => latest.current.onWarning ? latest.current.onWarning(w) : devWarn(w)
    });
  });
  const runtime = _nullishCoalesce(props.runtime, () => ( owned));
  const mounted = _react.useRef.call(void 0, false);
  _react.useEffect.call(void 0, () => {
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
  const autoStart = _nullishCoalesce(props.autoStart, () => ( true));
  _react.useEffect.call(void 0, () => {
    if (!autoStart) return;
    let cancelled = false;
    const initial = latest.current.conversationId;
    if (typeof initial === "string") void runtime.selectConversation(initial);
    void runtime.start().then(() => {
      if (cancelled) return;
      const want = latest.current.conversationId;
      if (want !== void 0 && runtime.session.getState().activeId !== want) void runtime.selectConversation(want);
    });
    return () => {
      cancelled = true;
    };
  }, [runtime, autoStart]);
  const firstControlled = _react.useRef.call(void 0, true);
  _react.useEffect.call(void 0, () => {
    if (firstControlled.current) {
      firstControlled.current = false;
      return;
    }
    const want = props.conversationId;
    if (want === void 0) return;
    if (runtime.session.getState().activeId !== want) void runtime.selectConversation(want);
  }, [props.conversationId, runtime]);
  _react.useEffect.call(void 0, () => runtime.on("activeChange", (id) => _optionalChain([latest, 'access', _10 => _10.current, 'access', _11 => _11.onConversationChange, 'optionalCall', _12 => _12(id)])), [runtime]);
  const blocks = useStableArray(props.blocks);
  const registry = _react.useMemo.call(void 0, () => _chunkBSRSFPS7cjs.createBlockRegistry.call(void 0, _nullishCoalesce(blocks, () => ( [])), props.fallbackBlock), [blocks, props.fallbackBlock]);
  _react.useEffect.call(void 0, () => {
    runtime.setDeltaResolver(registry.deltaResolver);
  }, [runtime, registry]);
  const labelOverrides = useStableObject(props.labels);
  const labels = _react.useMemo.call(void 0, () => ({ ...defaultLabels, ...labelOverrides }), [labelOverrides]);
  const onActionRef = _react.useRef.call(void 0, void 0);
  onActionRef.current = props.onAction;
  const onAction = _react.useMemo.call(void 0, () => (a) => _optionalChain([onActionRef, 'access', _13 => _13.current, 'optionalCall', _14 => _14(a)]), []);
  const fallbackRef = _react.useRef.call(void 0, props.blockErrorFallback);
  fallbackRef.current = props.blockErrorFallback;
  const hasFallback = Boolean(props.blockErrorFallback);
  const value = _react.useMemo.call(void 0, 
    () => ({
      runtime,
      registry,
      labels,
      onAction,
      blockErrorFallback: hasFallback ? (e, b) => _optionalChain([fallbackRef, 'access', _15 => _15.current, 'optionalCall', _16 => _16(e, b)]) : void 0
    }),
    [runtime, registry, labels, onAction, hasFallback]
  );
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ChatContext.Provider, { value, children: props.children });
}
function ThreadProvider({ conversationId, children }) {
  const { runtime } = useChatContext();
  const handle = _react.useMemo.call(void 0, () => runtime.getThread(conversationId), [runtime, conversationId]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ThreadContext.Provider, { value: handle, children });
}

// src/react/hooks/index.ts

var BUSY = /* @__PURE__ */ new Set(["submitting", "streaming", "cancelling"]);
function useChatRuntime() {
  return useChatContext().runtime;
}
function useLabels() {
  return useChatContext().labels;
}
function useActiveConversationId() {
  const runtime = useChatRuntime();
  return useStoreSelector(runtime.session, (s) => s.activeId);
}
function useThreadHandle() {
  const runtime = useChatRuntime();
  const pinned = _react.useContext.call(void 0, ThreadContext);
  const activeKey = useStoreSelector(runtime.session, (s) => s.activeKey);
  const activeId = useStoreSelector(runtime.session, (s) => s.activeId);
  return _react.useMemo.call(void 0, () => _nullishCoalesce(pinned, () => ( runtime.getThread(activeId))), [pinned, runtime, activeKey, activeId]);
}
function useThread(selector, isEqual) {
  const handle = useThreadHandle();
  return useStoreSelector(handle.store, selector, isEqual);
}
function useMessages() {
  return useThread((s) => s.messages);
}
function useRun() {
  return useThread((s) => s.run, shallowEqual);
}
function useThreadMeta() {
  return useThread((s) => s.meta);
}
function useIsBusy() {
  return useThread((s) => BUSY.has(s.run.status));
}
function useChatActions() {
  const runtime = useChatRuntime();
  const handle = useThreadHandle();
  const { onAction } = useChatContext();
  return _react.useMemo.call(void 0, () => {
    const cid = () => handle.store.getState().conversationId;
    return {
      send: (text, options) => runtime.send(text, { ...options, conversationId: cid() }),
      resume: (checkpointId, decision) => runtime.resume(checkpointId, decision, { conversationId: _nullishCoalesce(cid(), () => ( void 0)) }),
      cancel: () => runtime.cancel(cid()),
      retry: () => runtime.retry(cid()),
      canRetry: () => runtime.canRetry(cid()),
      newConversation: () => runtime.newConversation(),
      selectConversation: (id) => runtime.selectConversation(id),
      renameConversation: (id, title) => runtime.renameConversation(id, title),
      archiveConversation: (id, archived) => runtime.archiveConversation(id, archived),
      deleteConversation: (id) => runtime.deleteConversation(id),
      setModel: (model) => runtime.setModel(model, _nullishCoalesce(cid(), () => ( void 0))),
      emit: (name, payload, extra) => _optionalChain([onAction, 'optionalCall', _17 => _17({ name, payload, conversationId: cid(), ...extra })])
    };
  }, [runtime, handle, onAction]);
}
function useComposer() {
  const runtime = useChatRuntime();
  const handle = useThreadHandle();
  const composer = useStoreSelector(handle.composer, (s) => s);
  const status = useStoreSelector(handle.store, (s) => s.run.status);
  const paused = useStoreSelector(handle.store, (s) => Boolean(s.pendingCheckpoint));
  const loadStatus = useStoreSelector(handle.store, (s) => s.loadStatus);
  const busy = BUSY.has(status);
  const uploading = composer.attachments.some((a) => a.status === "uploading");
  const blockedByDecision = paused && runtime.config.composerWhilePaused === "disabled";
  const hasContent = composer.text.trim().length > 0 || composer.attachments.some((a) => a.status === "ready");
  const canSend = !busy && !uploading && !blockedByDecision && hasContent && loadStatus !== "loading";
  const cid = _react.useCallback.call(void 0, () => handle.store.getState().conversationId, [handle]);
  return {
    text: composer.text,
    attachments: composer.attachments,
    busy,
    cancelling: status === "cancelling",
    uploading,
    blockedByDecision,
    canSend,
    attachmentsEnabled: Boolean(runtime.config.attachments),
    accept: _optionalChain([runtime, 'access', _18 => _18.config, 'access', _19 => _19.attachments, 'optionalAccess', _20 => _20.accept]),
    setText: (text) => runtime.setDraft(text, cid()),
    send: () => canSend ? runtime.send(handle.composer.getState().text, { conversationId: cid() }) : Promise.resolve(),
    cancel: () => runtime.cancel(cid()),
    addFiles: (files) => runtime.addAttachments(files, cid()),
    removeAttachment: (id) => runtime.removeAttachment(id, cid())
  };
}
function usePreference(key, fallback) {
  const runtime = useChatRuntime();
  const value = useStoreSelector(runtime.preferences, (p) => key in p ? p[key] : fallback);
  const set = _react.useCallback.call(void 0, (v) => runtime.setPreference(key, v), [runtime, key]);
  return [value, set];
}
function useConversations() {
  const runtime = useChatRuntime();
  const state = useStoreSelector(runtime.conversations, (s) => s);
  const activeId = useStoreSelector(runtime.session, (s) => s.activeId);
  const [query, setQuery] = _react.useState.call(void 0, "");
  const [showArchived, setShowArchived] = usePreference("history.showArchived", false);
  const items = _react.useMemo.call(void 0, 
    () => _chunkPF3MMMKGcjs.filterConversations.call(void 0, 
      state.items.filter((i) => showArchived || !i.archived),
      query
    ),
    [state.items, showArchived, query]
  );
  const groups = _react.useMemo.call(void 0, () => _chunkPF3MMMKGcjs.groupConversations.call(void 0, items), [items]);
  return {
    status: state.status,
    error: state.error,
    allItems: state.items,
    items,
    groups,
    activeId,
    runningIds: state.runningIds,
    isRunning: (id) => state.runningIds.includes(id),
    query,
    setQuery,
    showArchived,
    setShowArchived,
    create: () => runtime.newConversation(),
    select: (id) => runtime.selectConversation(id),
    rename: (id, title) => runtime.renameConversation(id, title),
    remove: (id) => runtime.deleteConversation(id),
    archive: (id, archived) => runtime.archiveConversation(id, archived),
    refresh: () => runtime.refreshConversations()
  };
}
function useScope() {
  const runtime = useChatRuntime();
  const scope = useStoreSelector(runtime.scope, (s) => s);
  const summary = _react.useMemo.call(void 0, () => _chunkPF3MMMKGcjs.summarizeScope.call(void 0, scope.selection, scope.groups), [scope.selection, scope.groups]);
  const current = () => runtime.scope.getState();
  return {
    enabled: runtime.config.hasScope,
    status: scope.status,
    groups: scope.groups,
    selection: scope.selection,
    summary,
    isSelected: (groupId, itemId) => (_nullishCoalesce(scope.selection[groupId], () => ( []))).includes(itemId),
    groupState: (groupId) => {
      const g = scope.groups.find((x) => x.id === groupId);
      const n = (_nullishCoalesce(scope.selection[groupId], () => ( []))).length;
      if (!g || n === 0) return "none";
      return n >= g.items.length ? "all" : "some";
    },
    toggle: (groupId, itemId) => {
      const s = current();
      const set = new Set(_nullishCoalesce(s.selection[groupId], () => ( [])));
      if (set.has(itemId)) set.delete(itemId);
      else set.add(itemId);
      runtime.setScopeSelection({ ...s.selection, [groupId]: [...set] });
    },
    setGroup: (groupId, selected) => {
      const s = current();
      const g = s.groups.find((x) => x.id === groupId);
      if (!g) return;
      runtime.setScopeSelection({ ...s.selection, [groupId]: selected ? g.items.map((i) => i.id) : [] });
    },
    setSelection: runtime.setScopeSelection.bind(runtime)
  };
}
function useMessage() {
  const ctx = _react.useContext.call(void 0, MessageContext);
  if (!ctx) throw new Error("[agentic-chat] useMessage must be used inside a message (Message.Root / Thread.Messages).");
  return ctx;
}
function useBlock() {
  const ctx = _react.useContext.call(void 0, BlockContext);
  if (!ctx) throw new Error("[agentic-chat] useBlock must be used inside a rendered block.");
  return ctx;
}
function useHitl() {
  const runtime = useChatRuntime();
  const handle = useThreadHandle();
  const ctx = _react.useContext.call(void 0, BlockContext);
  const checkpoint = _optionalChain([ctx, 'optionalAccess', _21 => _21.block, 'access', _22 => _22.checkpoint]);
  const pendingId = useStoreSelector(handle.store, (s) => _optionalChain([s, 'access', _23 => _23.pendingCheckpoint, 'optionalAccess', _24 => _24.checkpointId]));
  const busy = useStoreSelector(handle.store, (s) => BUSY.has(s.run.status));
  const status = _nullishCoalesce(_optionalChain([checkpoint, 'optionalAccess', _25 => _25.status]), () => ( "none"));
  const canSubmit = Boolean(checkpoint) && (status === "pending" || status === "failed") && pendingId === _optionalChain([checkpoint, 'optionalAccess', _26 => _26.id]) && !busy;
  return {
    checkpoint,
    status,
    requires: _optionalChain([checkpoint, 'optionalAccess', _27 => _27.requires]),
    decision: _optionalChain([checkpoint, 'optionalAccess', _28 => _28.decision]),
    error: _optionalChain([checkpoint, 'optionalAccess', _29 => _29.error]),
    isPending: status === "pending" || status === "failed",
    isSubmitting: status === "submitting",
    isResolved: status === "resolved",
    /** The card is the live question and the thread isn't busy. */
    canSubmit,
    submit: (decision) => checkpoint && canSubmit ? runtime.resume(checkpoint.id, decision, { conversationId: _nullishCoalesce(handle.store.getState().conversationId, () => ( void 0)) }) : Promise.resolve()
  };
}
function useBlockActions(block, message) {
  const runtime = useChatRuntime();
  const handle = useThreadHandle();
  const { onAction } = useChatContext();
  return _react.useMemo.call(void 0, () => {
    const cid = () => handle.store.getState().conversationId;
    return {
      send: (text) => void runtime.send(text, { conversationId: cid() }),
      resume: (decision) => block.checkpoint ? runtime.resume(block.checkpoint.id, decision, { conversationId: _nullishCoalesce(cid(), () => ( void 0)) }) : Promise.resolve(),
      emit: (name, payload) => _optionalChain([onAction, 'optionalCall', _30 => _30({ name, payload, block, message, conversationId: cid() })]),
      retry: () => void runtime.retry(cid())
    };
  }, [runtime, handle, onAction, block, message]);
}
function useChatEvent(type, listener) {
  const runtime = useChatRuntime();
  const ref = _react.useRef.call(void 0, listener);
  ref.current = listener;
  _react.useEffect.call(void 0, () => runtime.on(type, (...args) => ref.current(...args)), [runtime, type]);
}

// src/react/primitives/block.tsx


function DefaultCrash() {
  const { labels } = useChatContext();
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { role: "note", "data-block-error": "", children: labels.blockCrashed });
}
function BlockRendererImpl({ block, message, isLast = false }) {
  const ctx = _react.useContext.call(void 0, ChatContext);
  if (!ctx) throw new Error("[agentic-chat] <Block> must be rendered inside <ChatProvider>.");
  const { registry } = ctx;
  const definition = registry.resolve(block.data);
  const actions = useBlockActions(block, message);
  const parsed = _react.useMemo.call(void 0, () => {
    if (!_optionalChain([definition, 'optionalAccess', _31 => _31.parse])) return { ok: true, data: block.data };
    try {
      return { ok: true, data: definition.parse(block.data, block) };
    } catch (error) {
      return { ok: false, error };
    }
  }, [definition, block]);
  const Render = parsed.ok ? _optionalChain([definition, 'optionalAccess', _32 => _32.render]) : _optionalChain([registry, 'access', _33 => _33.fallback, 'optionalAccess', _34 => _34.render]);
  const blockContext = _react.useMemo.call(void 0, () => ({ block, message, definition }), [block, message, definition]);
  if (!Render) return null;
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, BlockContext.Provider, { value: blockContext, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    BlockErrorBoundary,
    {
      resetKey: block.data,
      fallback: (error) => ctx.blockErrorFallback ? ctx.blockErrorFallback(error, block) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, DefaultCrash, {}),
      children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { "data-block-id": block.id, "data-block-type": block.type, "data-block-status": block.status, style: { minWidth: 0 }, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        Render,
        {
          block,
          data: parsed.ok ? parsed.data : block.data,
          status: block.status,
          checkpoint: block.checkpoint,
          message,
          actions,
          isLast
        }
      ) })
    }
  ) });
}
var BlockRenderer = _react.memo.call(void 0, 
  BlockRendererImpl,
  (a, b) => a.block === b.block && a.isLast === b.isLast && a.message.id === b.message.id && a.message.status === b.message.status
);
function MessageBlocks({ filter, renderGroup, renderBlock }) {
  const msg = _react.useContext.call(void 0, MessageContext);
  const { registry } = useChatContext();
  if (!msg) throw new Error("[agentic-chat] <Message.Blocks> must be inside <Message.Root>.");
  const { message } = msg;
  const blocks = filter ? message.blocks.filter(filter) : message.blocks;
  const streaming = message.status === "streaming";
  const segments = [];
  for (const b of blocks) {
    const group = _optionalChain([registry, 'access', _35 => _35.resolve, 'call', _36 => _36(b.data), 'optionalAccess', _37 => _37.group]);
    const last = segments[segments.length - 1];
    if (group && last && last.group === group) last.blocks.push(b);
    else segments.push({ group, blocks: [b] });
  }
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _jsxruntime.Fragment, { children: segments.map((seg, i) => {
    const children = seg.blocks.map((b, j) => {
      const node = /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        BlockRenderer,
        {
          block: b,
          message,
          isLast: streaming && i === segments.length - 1 && j === seg.blocks.length - 1
        },
        b.id
      );
      return renderBlock ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _react.Fragment, { children: renderBlock(node, b) }, b.id) : node;
    });
    const key = seg.blocks[0].id;
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _react.Fragment, { children: seg.group && renderGroup ? renderGroup(seg.group, children, seg.blocks) : children }, key);
  }) });
}

// src/react/primitives/composer.tsx
var _reactslot = require('@radix-ui/react-slot');








var ComposerContext = _react.createContext.call(void 0, null);
function useComposerContext() {
  const ctx = _react.useContext.call(void 0, ComposerContext);
  if (!ctx) throw new Error("[agentic-chat] Composer parts must be inside <Composer.Root>.");
  return ctx;
}
var ComposerRoot = _react.forwardRef.call(void 0, 
  function ComposerRoot2({ asChild, onSubmit, ...props }, ref) {
    const composer = useComposer();
    const Comp = asChild ? _reactslot.Slot : "form";
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ComposerContext.Provider, { value: composer, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      Comp,
      {
        ref,
        "data-busy": composer.busy ? "" : void 0,
        "data-blocked": composer.blockedByDecision ? "" : void 0,
        onSubmit: (e) => {
          e.preventDefault();
          _optionalChain([onSubmit, 'optionalCall', _38 => _38(e)]);
          void composer.send();
        },
        ...props
      }
    ) });
  }
);
var ComposerInput = _react.forwardRef.call(void 0, function ComposerInput2({ submitOnEnter = true, minRows = 1, maxRows = 8, refocus = true, onKeyDown, placeholder, disabled, style, ...props }, ref) {
  const c = useComposerContext();
  const labels = useLabels();
  const inner = _react.useRef.call(void 0, null);
  _react.useImperativeHandle.call(void 0, ref, () => inner.current, []);
  useIsomorphicLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const cs = typeof getComputedStyle === "function" ? getComputedStyle(el) : null;
    const line = cs ? parseFloat(cs.lineHeight) || 20 : 20;
    const pad = cs ? parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) : 0;
    el.style.height = "auto";
    const max = line * maxRows + pad;
    const min = line * minRows + pad;
    el.style.height = `${Math.max(min, Math.min(el.scrollHeight, max))}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, [c.text, minRows, maxRows]);
  const wasBusy = _react.useRef.call(void 0, c.busy);
  useIsomorphicLayoutEffect(() => {
    if (refocus && wasBusy.current && !c.busy) _optionalChain([inner, 'access', _39 => _39.current, 'optionalAccess', _40 => _40.focus, 'call', _41 => _41({ preventScroll: true })]);
    wasBusy.current = c.busy;
  }, [c.busy, refocus]);
  const blocked = c.blockedByDecision;
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "textarea",
    {
      ref: inner,
      rows: minRows,
      "aria-label": labels.composerLabel,
      placeholder: blocked ? labels.composerAwaitingDecision : _nullishCoalesce(placeholder, () => ( labels.composerPlaceholder)),
      value: c.text,
      disabled: disabled || blocked,
      onChange: (e) => c.setText(e.target.value),
      onKeyDown: (e) => {
        _optionalChain([onKeyDown, 'optionalCall', _42 => _42(e)]);
        if (e.defaultPrevented || !submitOnEnter) return;
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
          e.preventDefault();
          void c.send();
        }
      },
      onPaste: (e) => {
        if (!c.attachmentsEnabled) return;
        const files = [...e.clipboardData.files];
        if (files.length) {
          e.preventDefault();
          c.addFiles(files);
        }
      },
      style: { resize: "none", ...style },
      ...props
    }
  );
});
var ComposerSend = _react.forwardRef.call(void 0, function ComposerSend2({ asChild, disabled, ...props }, ref) {
  const c = useComposerContext();
  const labels = useLabels();
  const Comp = asChild ? _reactslot.Slot : "button";
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Comp, { ref, type: "submit", "aria-label": labels.send, disabled: disabled || !c.canSend, ...props });
});
var ComposerCancel = _react.forwardRef.call(void 0, function ComposerCancel2({ asChild, onClick, ...props }, ref) {
  const c = useComposerContext();
  const labels = useLabels();
  if (!c.busy) return null;
  const Comp = asChild ? _reactslot.Slot : "button";
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    Comp,
    {
      ref,
      type: "button",
      "aria-label": labels.stop,
      disabled: c.cancelling,
      onClick: (e) => {
        _optionalChain([onClick, 'optionalCall', _43 => _43(e)]);
        void c.cancel();
      },
      ...props
    }
  );
});
var ComposerAttachmentInput = _react.forwardRef.call(void 0, 
  function ComposerAttachmentInput2({ asChild, multiple = true, onClick, ...props }, ref) {
    const c = useComposerContext();
    const labels = useLabels();
    const input = _react.useRef.call(void 0, null);
    if (!c.attachmentsEnabled) return null;
    const Comp = asChild ? _reactslot.Slot : "button";
    return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        "input",
        {
          ref: input,
          type: "file",
          hidden: true,
          multiple,
          accept: c.accept,
          onChange: (e) => {
            const files = e.target.files ? [...e.target.files] : [];
            if (files.length) c.addFiles(files);
            e.target.value = "";
          }
        }
      ),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        Comp,
        {
          ref,
          type: "button",
          "aria-label": labels.attach,
          onClick: (e) => {
            _optionalChain([onClick, 'optionalCall', _44 => _44(e)]);
            _optionalChain([input, 'access', _45 => _45.current, 'optionalAccess', _46 => _46.click, 'call', _47 => _47()]);
          },
          ...props
        }
      )
    ] });
  }
);
function ComposerAttachments({
  children
}) {
  const c = useComposerContext();
  if (!c.attachments.length) return null;
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _jsxruntime.Fragment, { children: c.attachments.map((a) => children(a, () => c.removeAttachment(a.id))) });
}

// src/react/primitives/message.tsx



var MessageRoot = _react.forwardRef.call(void 0, 
  function MessageRoot2({ asChild, ...props }, ref) {
    const ctx = _react.useContext.call(void 0, MessageContext);
    const Comp = asChild ? _reactslot.Slot : "div";
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      Comp,
      {
        ref,
        "data-message-id": _optionalChain([ctx, 'optionalAccess', _48 => _48.message, 'access', _49 => _49.id]),
        "data-role": _optionalChain([ctx, 'optionalAccess', _50 => _50.message, 'access', _51 => _51.role]),
        "data-status": _optionalChain([ctx, 'optionalAccess', _52 => _52.message, 'access', _53 => _53.status]),
        ...props
      }
    );
  }
);
function MessageIf({ role, status, last, children }) {
  const ctx = _react.useContext.call(void 0, MessageContext);
  if (!ctx) return null;
  if (role && ctx.message.role !== role) return null;
  if (status && !(Array.isArray(status) ? status : [status]).includes(ctx.message.status)) return null;
  if (last !== void 0 && ctx.isLast !== last) return null;
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _jsxruntime.Fragment, { children });
}
function messageText(message, toText) {
  return message.blocks.map((b) => {
    const custom = _optionalChain([toText, 'optionalCall', _54 => _54(b)]);
    if (custom !== void 0) return custom;
    const d = b.data;
    return typeof d.text === "string" ? d.text : "";
  }).filter(Boolean).join("\n\n");
}

// src/react/primitives/misc.tsx



function SuggestionsRoot({
  prompts,
  children
}) {
  const meta = useThreadMeta();
  const list = _nullishCoalesce(prompts, () => ( meta.suggestedPrompts));
  if (!list.length) return null;
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _jsxruntime.Fragment, { children: list.map((p, i) => children(p, i)) });
}
var SuggestionItem = _react.forwardRef.call(void 0, function SuggestionItem2({ asChild, prompt, onClick, children, ...props }, ref) {
  const { send } = useChatActions();
  const Comp = asChild ? _reactslot.Slot : "button";
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    Comp,
    {
      ref,
      type: "button",
      onClick: (e) => {
        _optionalChain([onClick, 'optionalCall', _55 => _55(e)]);
        void send(prompt.prompt);
      },
      ...props,
      children: _nullishCoalesce(children, () => ( prompt.label))
    }
  );
});
function ConversationListRoot({ children }) {
  const api = useConversations();
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _jsxruntime.Fragment, { children: children(api) });
}
var ConversationListItem = _react.forwardRef.call(void 0, 
  function ConversationListItem2({ asChild, conversation, onClick, children, ...props }, ref) {
    const { activeId } = useConversations();
    const { selectConversation } = useChatActions();
    const Comp = asChild ? _reactslot.Slot : "button";
    const active = activeId === conversation.id;
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      Comp,
      {
        ref,
        type: "button",
        "aria-current": active ? "page" : void 0,
        "data-active": active ? "" : void 0,
        onClick: (e) => {
          _optionalChain([onClick, 'optionalCall', _56 => _56(e)]);
          void selectConversation(conversation.id);
        },
        ...props,
        children: _nullishCoalesce(children, () => ( conversation.title))
      }
    );
  }
);
var ConversationListNew = _react.forwardRef.call(void 0, function ConversationListNew2({ asChild, onClick, ...props }, ref) {
  const { newConversation } = useChatActions();
  const Comp = asChild ? _reactslot.Slot : "button";
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    Comp,
    {
      ref,
      type: "button",
      onClick: (e) => {
        _optionalChain([onClick, 'optionalCall', _57 => _57(e)]);
        void newConversation().catch(() => void 0);
      },
      ...props
    }
  );
});
var ChoiceContext = _react.createContext.call(void 0, null);
function useHitlChoice() {
  const ctx = _react.useContext.call(void 0, ChoiceContext);
  if (!ctx) throw new Error("[agentic-chat] Hitl parts must be inside <Hitl.Root>.");
  return ctx;
}
function HitlRoot({
  multiple = false,
  initial = [],
  children
}) {
  const hitl = useHitl();
  const resolved = hitl.decision;
  const [selected, setSelected] = _react.useState.call(void 0, 
    Array.isArray(resolved) ? resolved.map(String) : typeof resolved === "string" ? [resolved] : initial
  );
  const toggle = (value) => setSelected((prev) => multiple ? prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value] : [value]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ChoiceContext.Provider, { value: { multiple, selected, toggle, hitl }, children });
}
var HitlOption = _react.forwardRef.call(void 0, function HitlOption2({ asChild, value, onClick, ...props }, ref) {
  const { selected, toggle, multiple, hitl } = useHitlChoice();
  const Comp = asChild ? _reactslot.Slot : "button";
  const checked = selected.includes(value);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    Comp,
    {
      ref,
      type: "button",
      role: multiple ? "checkbox" : "radio",
      "aria-checked": checked,
      "data-checked": checked ? "" : void 0,
      disabled: !hitl.canSubmit,
      onClick: (e) => {
        _optionalChain([onClick, 'optionalCall', _58 => _58(e)]);
        toggle(value);
      },
      ...props
    }
  );
});
var HitlSubmit = _react.forwardRef.call(void 0, 
  function HitlSubmit2({ asChild, toDecision, disabled, onClick, ...props }, ref) {
    const { selected, multiple, hitl } = useHitlChoice();
    const Comp = asChild ? _reactslot.Slot : "button";
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      Comp,
      {
        ref,
        type: "button",
        disabled: disabled || !hitl.canSubmit || selected.length === 0,
        onClick: (e) => {
          _optionalChain([onClick, 'optionalCall', _59 => _59(e)]);
          void hitl.submit(toDecision ? toDecision(selected) : multiple ? selected : _nullishCoalesce(selected[0], () => ( "")));
        },
        ...props
      }
    );
  }
);

// src/react/primitives/thread.tsx











var ScrollContext = _react.createContext.call(void 0, null);
function useThreadScroll() {
  const ctx = _react.useContext.call(void 0, ScrollContext);
  if (!ctx) throw new Error("[agentic-chat] useThreadScroll must be used inside <Thread.Root>.");
  return ctx;
}
var BOTTOM_THRESHOLD = 48;
function useScrollController() {
  const viewportRef = _react.useRef.call(void 0, null);
  const contentRef = _react.useRef.call(void 0, null);
  const atBottomRef = _react.useRef.call(void 0, true);
  const [atBottom, setAtBottom] = _react.useState.call(void 0, true);
  const onScroll = _react.useCallback.call(void 0, () => {
    const el = viewportRef.current;
    if (!el) return;
    const next = el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD;
    atBottomRef.current = next;
    setAtBottom(next);
  }, []);
  const scrollToBottom = _react.useCallback.call(void 0, (behavior = "smooth") => {
    const el = viewportRef.current;
    if (!el) return;
    atBottomRef.current = true;
    setAtBottom(true);
    if (typeof el.scrollTo === "function") el.scrollTo({ top: el.scrollHeight, behavior });
    else el.scrollTop = el.scrollHeight;
  }, []);
  useIsomorphicLayoutEffect(() => {
    const content = contentRef.current;
    const el = viewportRef.current;
    if (!content || !el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (atBottomRef.current) el.scrollTop = el.scrollHeight;
    });
    ro.observe(content);
    return () => ro.disconnect();
  }, []);
  return _react.useMemo.call(void 0, () => ({ atBottom, scrollToBottom, viewportRef, contentRef, onScroll }), [atBottom, scrollToBottom, onScroll]);
}
var ThreadRoot = _react.forwardRef.call(void 0, function ThreadRoot2({ asChild, ...props }, ref) {
  const controller = useScrollController();
  const Comp = asChild ? _reactslot.Slot : "div";
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ScrollContext.Provider, { value: controller, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Comp, { ref, "data-chat-thread": "", ...props }) });
});
var ThreadViewport = _react.forwardRef.call(void 0, function ThreadViewport2({ children, style, onScroll, contentProps, ...props }, ref) {
  const c = useThreadScroll();
  const setRef = (el) => {
    c.viewportRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "div",
    {
      ref: setRef,
      role: "log",
      "aria-live": "off",
      "data-at-bottom": c.atBottom ? "" : void 0,
      onScroll: (e) => {
        c.onScroll();
        _optionalChain([onScroll, 'optionalCall', _60 => _60(e)]);
      },
      style: { overflowY: "auto", overscrollBehavior: "contain", ...style },
      ...props,
      children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { ref: c.contentRef, ...contentProps, children })
    }
  );
});
function DefaultMessage() {
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, MessageBlocks, {});
}
function ThreadMessages({ components, children }) {
  const messages = useThread((s) => s.messages);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _jsxruntime.Fragment, { children: messages.map((m, i) => {
    const isLast = i === messages.length - 1;
    const Custom = m.role === "user" ? _optionalChain([components, 'optionalAccess', _61 => _61.UserMessage]) : _optionalChain([components, 'optionalAccess', _62 => _62.AssistantMessage]);
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, MessageContext.Provider, { value: { message: m, isLast }, children: children ? children(m, i) : Custom ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Custom, { message: m }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, DefaultMessage, {}) }, m.id);
  }) });
}
function ThreadEmpty({ children }) {
  const show = useThread((s) => s.messages.length === 0 && s.loadStatus !== "loading" && s.loadStatus !== "error");
  return show ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _jsxruntime.Fragment, { children }) : null;
}
function ThreadIf({ empty, running, loading, error, paused, children }) {
  const ok = useThread((s) => {
    const isRunning = s.run.status === "submitting" || s.run.status === "streaming" || s.run.status === "cancelling";
    if (empty !== void 0 && s.messages.length === 0 !== empty) return false;
    if (running !== void 0 && isRunning !== running) return false;
    if (loading !== void 0 && s.loadStatus === "loading" !== loading) return false;
    if (error !== void 0 && (s.loadStatus === "error" || s.run.status === "error") !== error) return false;
    if (paused !== void 0 && Boolean(s.pendingCheckpoint) !== paused) return false;
    return true;
  });
  return ok ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _jsxruntime.Fragment, { children }) : null;
}
function ThreadStatus({ children }) {
  const label = useThread(
    (s) => s.run.status === "streaming" || s.run.status === "submitting" || s.run.status === "cancelling" ? _nullishCoalesce(s.run.statusLabel, () => ( "")) : ""
  );
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { "aria-live": "polite", "aria-atomic": "true", "data-chat-status": "", children: label ? children ? children(label) : label : null });
}
var ThreadScrollToBottom = _react.forwardRef.call(void 0, 
  function ThreadScrollToBottom2({ asChild, onClick, ...props }, ref) {
    const c = useThreadScroll();
    if (c.atBottom) return null;
    const Comp = asChild ? _reactslot.Slot : "button";
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      Comp,
      {
        ref,
        type: "button",
        onClick: (e) => {
          c.scrollToBottom();
          _optionalChain([onClick, 'optionalCall', _63 => _63(e)]);
        },
        ...props
      }
    );
  }
);

// src/react/primitives/index.ts
var Thread = {
  Root: ThreadRoot,
  Viewport: ThreadViewport,
  Messages: ThreadMessages,
  Empty: ThreadEmpty,
  If: ThreadIf,
  Status: ThreadStatus,
  ScrollToBottom: ThreadScrollToBottom
};
var Message = {
  Root: MessageRoot,
  Blocks: MessageBlocks,
  If: MessageIf
};
var Composer = {
  Root: ComposerRoot,
  Input: ComposerInput,
  Send: ComposerSend,
  Cancel: ComposerCancel,
  AttachmentInput: ComposerAttachmentInput,
  Attachments: ComposerAttachments
};
var Suggestions = {
  Root: SuggestionsRoot,
  Item: SuggestionItem
};
var ConversationList = {
  Root: ConversationListRoot,
  Item: ConversationListItem,
  New: ConversationListNew
};
var Hitl = {
  Root: HitlRoot,
  Option: HitlOption,
  Submit: HitlSubmit
};














































exports.BlockErrorBoundary = BlockErrorBoundary; exports.isDev = isDev; exports.ChatContext = ChatContext; exports.ThreadContext = ThreadContext; exports.MessageContext = MessageContext; exports.BlockContext = BlockContext; exports.useChatContext = useChatContext; exports.useIsomorphicLayoutEffect = useIsomorphicLayoutEffect; exports.shallowEqual = shallowEqual; exports.useStoreSelector = useStoreSelector; exports.defaultLabels = defaultLabels; exports.ChatProvider = ChatProvider; exports.ThreadProvider = ThreadProvider; exports.useChatRuntime = useChatRuntime; exports.useLabels = useLabels; exports.useActiveConversationId = useActiveConversationId; exports.useThreadHandle = useThreadHandle; exports.useThread = useThread; exports.useMessages = useMessages; exports.useRun = useRun; exports.useThreadMeta = useThreadMeta; exports.useIsBusy = useIsBusy; exports.useChatActions = useChatActions; exports.useComposer = useComposer; exports.usePreference = usePreference; exports.useConversations = useConversations; exports.useScope = useScope; exports.useMessage = useMessage; exports.useBlock = useBlock; exports.useHitl = useHitl; exports.useBlockActions = useBlockActions; exports.useChatEvent = useChatEvent; exports.BlockRenderer = BlockRenderer; exports.MessageBlocks = MessageBlocks; exports.useComposerContext = useComposerContext; exports.messageText = messageText; exports.useHitlChoice = useHitlChoice; exports.useThreadScroll = useThreadScroll; exports.Thread = Thread; exports.Message = Message; exports.Composer = Composer; exports.Suggestions = Suggestions; exports.ConversationList = ConversationList; exports.Hitl = Hitl;
//# sourceMappingURL=chunk-VQDQWAVJ.cjs.map