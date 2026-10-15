"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; } async function _asyncOptionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = await fn(value); } else if (op === 'call' || op === 'optionalCall') { value = await fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; } var _class; var _class2; var _class3;





var _chunkR7CUDWRTcjs = require('./chunk-R7CUDWRT.cjs');






var _chunkZNIBBZSNcjs = require('./chunk-ZNIBBZSN.cjs');

// src/core/persistence/storage.ts
function isPromise(v) {
  return typeof _optionalChain([v, 'optionalAccess', _ => _.then]) === "function";
}
function createMemoryStorage() {
  const map = /* @__PURE__ */ new Map();
  return {
    getItem: (k) => _nullishCoalesce(map.get(k), () => ( null)),
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
    keys: () => [...map.keys()]
  };
}
function createWebStorage(kind) {
  let storage;
  try {
    if (typeof window === "undefined") return null;
    storage = kind === "local" ? window.localStorage : window.sessionStorage;
    const probe = "__neoflo_chat_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
  } catch (e2) {
    return null;
  }
  const s = storage;
  return {
    raw: s,
    getItem: (k) => s.getItem(k),
    setItem: (k, v) => s.setItem(k, v),
    removeItem: (k) => s.removeItem(k),
    keys: () => {
      const out = [];
      for (let i = 0; i < s.length; i++) {
        const key = s.key(i);
        if (key !== null) out.push(key);
      }
      return out;
    }
  };
}
function createSafeStorage(inner, onError) {
  const shadow = createMemoryStorage();
  let reported = false;
  const report = (error) => {
    if (reported) return;
    reported = true;
    onError(error);
  };
  const guard = (fn, fallback) => {
    try {
      const out = fn();
      return isPromise(out) ? out.catch((error) => {
        report(error);
        return fallback();
      }) : out;
    } catch (error) {
      report(error);
      return fallback();
    }
  };
  return {
    getItem: (k) => {
      const shadowed = shadow.getItem(k);
      if (shadowed !== null) return shadowed;
      return guard(
        () => inner.getItem(k),
        () => null
      );
    },
    setItem: (k, v) => guard(
      () => {
        const out = inner.setItem(k, v);
        shadow.removeItem(k);
        return out;
      },
      () => shadow.setItem(k, v)
    ),
    removeItem: (k) => {
      shadow.removeItem(k);
      return guard(
        () => inner.removeItem(k),
        () => void 0
      );
    },
    keys: () => {
      const own = shadow.keys();
      const listInner = _optionalChain([inner, 'access', _2 => _2.keys, 'optionalAccess', _3 => _3.bind, 'call', _4 => _4(inner)]);
      if (!listInner) return own;
      const merge = (k) => [.../* @__PURE__ */ new Set([...k, ...own])];
      try {
        const out = listInner();
        return isPromise(out) ? out.then(merge, (error) => {
          report(error);
          return own;
        }) : merge(out);
      } catch (error) {
        report(error);
        return own;
      }
    }
  };
}

// src/core/persistence/persister.ts
var SCHEMA_VERSION = 1;
var MIGRATIONS = {};
var KNOWN_NAMES = ["active", "prefs", "drafts", "conversations", "thread-index"];
function createPersister(options, onError = () => void 0, now = Date.now) {
  const opts = options || {};
  const persist = {
    activeConversation: true,
    drafts: true,
    preferences: true,
    history: false,
    ...opts.persist
  };
  const requested = options === false ? "none" : _nullishCoalesce(opts.storage, () => ( "session"));
  const namespace = _nullishCoalesce(opts.namespace, () => ( "neoflo-chat"));
  const prefix = `${namespace}:${_nullishCoalesce(opts.scope, () => ( "default"))}:`;
  const debounceMs = _nullishCoalesce(opts.debounceMs, () => ( 400));
  let kind;
  let inner;
  let crossTab = null;
  if (typeof requested === "object") {
    kind = "custom";
    inner = requested;
  } else if (requested === "none") {
    kind = "none";
    inner = null;
  } else if (requested === "memory") {
    kind = "memory";
    inner = createMemoryStorage();
  } else {
    const web = createWebStorage(requested);
    kind = web ? requested : "memory";
    inner = _nullishCoalesce(web, () => ( createMemoryStorage()));
    if (web && requested === "local") crossTab = web.raw;
  }
  const config = { kind, persist, maxCachedConversations: _nullishCoalesce(opts.maxCachedConversations, () => ( 20)) };
  if (!inner) {
    return {
      enabled: false,
      config,
      read: () => void 0,
      write: () => void 0,
      remove: () => void 0,
      flush: async () => void 0,
      clear: async () => void 0,
      onExternalChange: () => () => void 0,
      dispose: () => void 0
    };
  }
  const storage = createSafeStorage(inner, onError);
  const pending = /* @__PURE__ */ new Map();
  let timer = null;
  const listeners = /* @__PURE__ */ new Set();
  const decode = (name, raw) => {
    if (raw === null) return void 0;
    let env;
    try {
      env = JSON.parse(raw);
    } catch (e3) {
      void storage.removeItem(prefix + name);
      return void 0;
    }
    if (!env || typeof env !== "object" || typeof env.v !== "number" || !("data" in env)) {
      void storage.removeItem(prefix + name);
      return void 0;
    }
    if (opts.ttl && now() - (_nullishCoalesce(env.savedAt, () => ( 0))) > opts.ttl) {
      void storage.removeItem(prefix + name);
      return void 0;
    }
    let data = env.data;
    let v = env.v;
    if (v > SCHEMA_VERSION) return void 0;
    while (v < SCHEMA_VERSION) {
      const migrate = MIGRATIONS[v];
      if (!migrate) return void 0;
      data = migrate(data, name);
      v++;
    }
    return data;
  };
  const writeNow = async (name, data) => {
    if (data === void 0) {
      await storage.removeItem(prefix + name);
      return;
    }
    const env = { v: SCHEMA_VERSION, savedAt: now(), data };
    let json;
    try {
      json = JSON.stringify(env);
    } catch (error) {
      onError(error);
      return;
    }
    await storage.setItem(prefix + name, json);
  };
  const flush = async () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    const entries = [...pending];
    pending.clear();
    await Promise.all(entries.map(([name, data]) => writeNow(name, data)));
  };
  const schedule = () => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      void flush();
    }, debounceMs);
  };
  const onPageHide = () => {
    void flush();
  };
  const onVisibility = () => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") void flush();
  };
  const onStorage = (e) => {
    if (e.storageArea !== crossTab || !_optionalChain([e, 'access', _5 => _5.key, 'optionalAccess', _6 => _6.startsWith, 'call', _7 => _7(prefix)])) return;
    const name = e.key.slice(prefix.length);
    for (const l of [...listeners]) l(name);
  };
  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", onPageHide);
    _optionalChain([document, 'access', _8 => _8.addEventListener, 'optionalCall', _9 => _9("visibilitychange", onVisibility)]);
    if (crossTab) window.addEventListener("storage", onStorage);
  }
  return {
    enabled: true,
    config,
    read(name) {
      if (pending.has(name)) return pending.get(name);
      const raw = storage.getItem(prefix + name);
      return isPromise(raw) ? raw.then((r) => decode(name, r)) : decode(name, raw);
    },
    write(name, data) {
      pending.set(name, data);
      schedule();
    },
    remove(name) {
      pending.set(name, void 0);
      schedule();
    },
    flush,
    async clear() {
      pending.clear();
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      const listed = storage.keys ? await storage.keys() : [];
      const names = new Set(KNOWN_NAMES.map((n) => prefix + n));
      for (const k of listed) if (k.startsWith(prefix)) names.add(k);
      const index = decode("thread-index", await storage.getItem(prefix + "thread-index"));
      if (Array.isArray(index)) {
        for (const e of index) if (e && typeof e.id === "string") names.add(`${prefix}thread:${e.id}`);
      }
      await Promise.all([...names].map((k) => storage.removeItem(k)));
    },
    onExternalChange(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      void flush();
      if (typeof window !== "undefined") {
        window.removeEventListener("pagehide", onPageHide);
        _optionalChain([document, 'access', _10 => _10.removeEventListener, 'optionalCall', _11 => _11("visibilitychange", onVisibility)]);
        window.removeEventListener("storage", onStorage);
      }
      listeners.clear();
    }
  };
}

// src/core/store/store.ts
var frameScheduler = (callback) => {
  if (typeof requestAnimationFrame === "function" && typeof document !== "undefined" && !document.hidden) {
    const id2 = requestAnimationFrame(callback);
    return () => cancelAnimationFrame(id2);
  }
  const id = setTimeout(callback, 16);
  return () => clearTimeout(id);
};
var syncScheduler = (callback) => {
  callback();
  return () => void 0;
};
function createStore(initial, scheduler = frameScheduler) {
  let state = initial;
  const listeners = /* @__PURE__ */ new Set();
  let cancelScheduled = null;
  const notify = () => {
    cancelScheduled = null;
    for (const listener of [...listeners]) listener();
  };
  return {
    getState: () => state,
    setState(next, options) {
      const value = typeof next === "function" ? next(state) : next;
      if (Object.is(value, state)) return;
      state = value;
      if (_optionalChain([options, 'optionalAccess', _12 => _12.batch])) {
        if (!cancelScheduled) cancelScheduled = scheduler(notify);
        return;
      }
      _optionalChain([cancelScheduled, 'optionalCall', _13 => _13()]);
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    flush() {
      if (cancelScheduled) {
        cancelScheduled();
        notify();
      }
    },
    listenerCount: () => listeners.size
  };
}

// src/core/store/types.ts
var emptyMeta = () => ({
  title: "New chat",
  suggestedPrompts: [],
  models: [],
  sources: [],
  archived: false
});
var createThreadState = (conversationId) => ({
  conversationId,
  loadStatus: conversationId ? "idle" : "ready",
  meta: emptyMeta(),
  messages: [],
  run: { status: "idle" },
  streamBlockIds: {}
});

// src/core/runtime/error-info.ts
var RETRY_LATER = "The chat service is having trouble. Try again in a moment.";
var CODE_RULES = {
  invalid_request: { action: "none", retryable: false, message: "The request was not valid." },
  unsupported_feature: { action: "none", retryable: false, message: "This chat doesn't support that yet." },
  connection_required: { action: "reconnect", retryable: false, message: "Connect this source to continue." },
  connection_expired: { action: "reconnect", retryable: false, message: "Reconnect this source to continue." },
  unauthenticated: { action: "sign_in", retryable: false, message: "Your session has expired. Sign in again to keep chatting." },
  access_denied: { action: "none", retryable: false, message: "You don't have access to this." },
  not_found: { action: "none", retryable: false, message: "This conversation no longer exists." },
  session_busy: {
    action: "retry",
    retryable: true,
    message: "A reply is already in progress in this chat. Try again when it finishes."
  },
  duplicate_message: { action: "none", retryable: false, message: "This message was already sent." },
  rate_limited: { action: "retry", retryable: true, message: "Too many requests. Wait a moment and try again." },
  upstream_unavailable: { action: "retry", retryable: true, message: RETRY_LATER },
  internal: { action: "retry", retryable: true, message: RETRY_LATER }
};
function statusRule(status) {
  if (status === 401) return CODE_RULES.unauthenticated;
  if (status === 403) return CODE_RULES.access_denied;
  if (status === 404) return CODE_RULES.not_found;
  if (status === 409) return CODE_RULES.session_busy;
  if (status === 429) return CODE_RULES.rate_limited;
  if (status === 408 || status >= 500) return { action: "retry", retryable: true, message: RETRY_LATER };
  return { action: "none", retryable: false, message: `Request failed (${status}).` };
}
function errorInfoFromCode(input) {
  const code = _nullishCoalesce(input.code, () => ( void 0));
  const known = code ? CODE_RULES[code] : void 0;
  const rule = _nullishCoalesce(known, () => ( (input.status !== void 0 ? statusRule(input.status) : { ...CODE_RULES.internal, message: "" })));
  const source = _optionalChain([input, 'access', _14 => _14.details, 'optionalAccess', _15 => _15.source]);
  return {
    type: _nullishCoalesce(code, () => ( (input.status !== void 0 ? `http_${input.status}` : "unknown"))),
    message: input.message || rule.message || "Something went wrong.",
    retryAfter: _nullishCoalesce(input.retryAfter, () => ( null)),
    retryable: rule.retryable,
    action: rule.action,
    ...input.status !== void 0 ? { status: input.status } : {},
    requestId: _nullishCoalesce(input.requestId, () => ( null)),
    details: _nullishCoalesce(input.details, () => ( null)),
    ...typeof source === "string" && source ? { sourceId: source } : {}
  };
}
function toErrorInfo(error) {
  if (error instanceof _chunkZNIBBZSNcjs.ChatApiError) {
    const hasEnvelope = error.errorType !== null;
    return errorInfoFromCode({
      code: error.errorType,
      status: error.status,
      message: hasEnvelope ? _nullishCoalesce(_chunkZNIBBZSNcjs.readErrorEnvelope.call(void 0, error.body).message, () => ( error.message)) : legacyHttpMessage(error),
      retryAfter: error.retryAfter,
      requestId: error.requestId,
      details: error.details
    });
  }
  if (error instanceof _chunkZNIBBZSNcjs.ChatStreamError) {
    return errorInfoFromCode({
      code: error.errorType,
      message: error.message,
      retryAfter: error.retryAfter,
      requestId: error.requestId,
      details: error.details
    });
  }
  if (error instanceof _chunkZNIBBZSNcjs.ChatError) {
    const retryable = ["network", "timeout", "protocol_error"].includes(error.code);
    return { type: error.code, message: error.message, retryable, action: retryable ? "retry" : "none" };
  }
  if (_chunkZNIBBZSNcjs.isAbortError.call(void 0, error)) {
    return { type: "aborted", message: "The request was stopped.", retryable: true, action: "retry" };
  }
  if (error instanceof TypeError) {
    return { type: "network", message: "Could not reach the chat service.", retryable: true, action: "retry" };
  }
  const message = error instanceof Error && error.message ? error.message : "Something went wrong.";
  return { type: "unknown", message, retryable: true, action: "retry" };
}
function legacyHttpMessage(error) {
  if (error.status === 401) return CODE_RULES.unauthenticated.message;
  if (error.status === 403) return "You don't have access to this conversation.";
  if (error.status === 404) return CODE_RULES.not_found.message;
  if (error.status === 429) return CODE_RULES.rate_limited.message;
  if (error.status >= 500) return RETRY_LATER;
  return error.message;
}

// src/core/store/stream-reducer.ts
function textFieldOf(block) {
  return block.type === "thinking" && typeof block.thinking === "string" && typeof block.text !== "string" ? "thinking" : "text";
}
function defaultApplyDelta(block, delta, snapshot) {
  if (typeof snapshot === "string") {
    return { ...block, [textFieldOf(block)]: snapshot };
  }
  if (snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)) {
    return { ...block, ...snapshot, id: block.id, type: block.type, category: block.category };
  }
  if (typeof delta.text === "string") {
    const field = textFieldOf(block);
    const prev = typeof block[field] === "string" ? block[field] : "";
    return { ...block, [field]: prev + delta.text };
  }
  if (typeof delta.partial_json === "string") {
    const prev = typeof block.partial_json === "string" ? block.partial_json : "";
    return { ...block, partial_json: prev + delta.partial_json };
  }
  return block;
}
var STATUS_BY_STOP = {
  end_turn: "complete",
  paused: "paused",
  error: "error",
  cancelled: "cancelled"
};
var RUN_BY_STOP = {
  end_turn: "idle",
  paused: "paused",
  error: "error",
  cancelled: "idle"
};
var TOOL_CALL_TYPES = /* @__PURE__ */ new Set(["tool_use", "tool_call", "tool"]);
var isToolBlock = (type) => type === "tool_result" || TOOL_CALL_TYPES.has(type);
function linkToolResults(message, options = {}) {
  const callIds = /* @__PURE__ */ new Set();
  for (const b of message.blocks) if (TOOL_CALL_TYPES.has(b.type)) callIds.add(b.id);
  if (!callIds.size) return message;
  let changed = false;
  const results = /* @__PURE__ */ new Map();
  const paired = message.blocks.map((b) => {
    if (b.type !== "tool_result") return b;
    const target = typeof b.data.tool_use_id === "string" && callIds.has(b.data.tool_use_id) ? b.data.tool_use_id : void 0;
    const next = b.pairedWith === target ? b : { ...b, pairedWith: target };
    if (next !== b) changed = true;
    if (target) results.set(target, next);
    return next;
  });
  const blocks = paired.map((b) => {
    if (!TOOL_CALL_TYPES.has(b.type)) return b;
    const result = results.get(b.id);
    const missing = result ? void 0 : options.ended && b.type === "tool_use" ? true : b.toolResultMissing;
    if (b.toolResult === result && b.toolResultMissing === missing) return b;
    changed = true;
    const { toolResult: _r, toolResultMissing: _m, ...rest } = b;
    return { ...rest, ...result ? { toolResult: result } : {}, ...missing ? { toolResultMissing: true } : {} };
  });
  return changed ? { ...message, blocks } : message;
}
function confirmUserMessage(messages, event) {
  const serverId = event.user_message_id;
  let index = -1;
  if (event.client_message_id) {
    index = messages.findIndex((m2) => m2.role === "user" && m2.clientMessageId === event.client_message_id);
  }
  if (index < 0 && serverId) {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user" && messages[i].local) {
        index = i;
        break;
      }
    }
  }
  if (index < 0) return messages;
  const m = messages[index];
  const id = serverId && !messages.some((x, i) => i !== index && x.id === serverId) ? serverId : m.id;
  if (id === m.id && !m.local) return messages;
  const next = [...messages];
  next[index] = { ...m, id, local: false };
  return next;
}
function updateMessage(state, messageId, fn) {
  if (!messageId) return state;
  let changed = false;
  const messages = state.messages.map((m) => {
    if (m.id !== messageId) return m;
    changed = true;
    return fn(m);
  });
  return changed ? { ...state, messages } : state;
}
function updateBlock(message, blockId, fn) {
  let changed = false;
  const blocks = message.blocks.map((b) => {
    if (b.id !== blockId) return b;
    changed = true;
    return fn(b);
  });
  return changed ? { ...message, blocks } : message;
}
function ensureAssistantMessage(state, ctx) {
  if (state.run.messageId && state.messages.some((m) => m.id === state.run.messageId)) return state;
  const id = _nullishCoalesce(state.run.messageId, () => ( `msg_local_${ctx.now.toString(36)}`));
  const message = {
    id,
    role: "assistant",
    blocks: [],
    status: "streaming",
    createdAt: new Date(ctx.now).toISOString()
  };
  return { ...state, messages: [...state.messages, message], run: { ...state.run, messageId: id, status: "streaming" } };
}
function reduceStreamEvent(state, event, ctx) {
  switch (event.type) {
    case "message_start": {
      const confirmed = confirmUserMessage(state.messages, event);
      const exists = confirmed.some((m) => m.id === event.message_id);
      const messages = exists ? confirmed.map(
        (m) => m.id === event.message_id ? {
          ...m,
          status: "streaming",
          error: void 0,
          blocks: m.blocks.map((b) => b.toolResultMissing ? { ...b, toolResultMissing: void 0 } : b)
        } : m
      ) : [
        ...confirmed,
        {
          id: event.message_id,
          role: "assistant",
          blocks: [],
          status: "streaming",
          createdAt: new Date(ctx.now).toISOString(),
          ...event.run_id ? { runId: event.run_id } : {}
        }
      ];
      return {
        ...state,
        messages,
        run: { status: "streaming", runId: event.run_id || void 0, messageId: event.message_id },
        streamBlockIds: {}
      };
    }
    case "status":
      return { ...state, run: { ...state.run, statusLabel: event.label || void 0 } };
    case "content_block_start": {
      const s = ensureAssistantMessage(state, ctx);
      const messageId = s.run.messageId;
      const incoming = {
        id: event.block.id,
        type: event.block.type,
        category: event.block.category,
        status: "streaming",
        data: event.block,
        startedAt: ctx.now
      };
      const next = updateMessage(s, messageId, (m) => {
        const existing = m.blocks.find((b) => b.id === incoming.id);
        const updated = existing ? updateBlock(m, incoming.id, (b) => ({ ...incoming, checkpoint: b.checkpoint, startedAt: b.startedAt })) : { ...m, blocks: [...m.blocks, incoming] };
        return isToolBlock(incoming.type) ? linkToolResults(updated) : updated;
      });
      return { ...next, streamBlockIds: { ...next.streamBlockIds, [event.index]: incoming.id } };
    }
    case "content_block_delta": {
      const blockId = state.streamBlockIds[event.index];
      if (!blockId) return state;
      return updateMessage(state, state.run.messageId, (m) => {
        const updated = updateBlock(m, blockId, (b) => {
          const handler = _optionalChain([ctx, 'access', _16 => _16.resolveDeltaHandler, 'optionalCall', _17 => _17(b.data)]);
          const data = _nullishCoalesce(_optionalChain([handler, 'optionalCall', _18 => _18(b.data, event.delta, event.snapshot)]), () => ( defaultApplyDelta(b.data, event.delta, event.snapshot)));
          return data === b.data ? b : { ...b, data };
        });
        const block = updated.blocks.find((b) => b.id === blockId);
        return updated !== m && block && isToolBlock(block.type) ? linkToolResults(updated) : updated;
      });
    }
    case "content_block_stop": {
      const s = ensureAssistantMessage(state, ctx);
      const blockId = _nullishCoalesce(s.streamBlockIds[event.index], () => ( event.block.id));
      const next = updateMessage(s, s.run.messageId, (m) => {
        const final = {
          id: blockId,
          type: event.block.type,
          category: event.block.category,
          status: "complete",
          data: { ...event.block, id: blockId },
          completedAt: ctx.now
        };
        const updated = !m.blocks.some((b) => b.id === blockId) ? { ...m, blocks: [...m.blocks, { ...final, startedAt: ctx.now }] } : updateBlock(m, blockId, (b) => ({ ...final, checkpoint: b.checkpoint, startedAt: b.startedAt }));
        return isToolBlock(final.type) ? linkToolResults(updated) : updated;
      });
      return next.streamBlockIds[event.index] ? next : { ...next, streamBlockIds: { ...next.streamBlockIds, [event.index]: blockId } };
    }
    case "checkpoint": {
      const messageId = state.run.messageId;
      const message = state.messages.find((m) => m.id === messageId);
      if (!message) return state;
      const blockId = _nullishCoalesce(state.streamBlockIds[event.block_index], () => ( _optionalChain([message, 'access', _19 => _19.blocks, 'access', _20 => _20[message.blocks.length - 1], 'optionalAccess', _21 => _21.id])));
      if (!blockId) return state;
      const next = updateMessage(
        state,
        messageId,
        (m) => updateBlock(m, blockId, (b) => ({
          ...b,
          checkpoint: { id: event.checkpoint_id, requires: event.requires, status: "pending" }
        }))
      );
      return {
        ...next,
        pendingCheckpoint: {
          checkpointId: event.checkpoint_id,
          messageId: message.id,
          blockId,
          requires: event.requires
        }
      };
    }
    case "message_delta":
      if (!event.usage) return state;
      return updateMessage(state, state.run.messageId, (m) => ({ ...m, usage: { ...m.usage, ...event.usage } }));
    case "message_stop": {
      const messageId = event.message_id || state.run.messageId;
      const status = STATUS_BY_STOP[event.stop_reason];
      let next = updateMessage(
        state,
        messageId,
        (m) => linkToolResults(
          {
            ...m,
            status,
            stopReason: event.stop_reason,
            model: _nullishCoalesce(event.model, () => ( m.model)),
            error: event.stop_reason === "error" ? _nullishCoalesce(m.error, () => ( state.run.error)) : m.error,
            blocks: m.blocks.map((b) => b.status === "streaming" ? { ...b, status: "complete", completedAt: ctx.now } : b)
          },
          // A paused turn resumes in the same message, so its tools may still answer.
          { ended: event.stop_reason !== "paused" }
        )
      );
      if (event.title) next = { ...next, meta: { ...next.meta, title: event.title } };
      const runStatus = RUN_BY_STOP[event.stop_reason];
      return {
        ...next,
        run: {
          status: runStatus,
          messageId,
          error: runStatus === "error" ? state.run.error : void 0
        },
        pendingCheckpoint: event.stop_reason === "paused" ? next.pendingCheckpoint : void 0,
        streamBlockIds: {}
      };
    }
    case "error": {
      const error = errorInfoFromCode({
        code: event.error_type,
        message: event.message,
        retryAfter: event.retry_after,
        requestId: event.request_id,
        details: event.details
      });
      const next = updateMessage(state, state.run.messageId, (m) => ({ ...m, error }));
      return { ...next, run: { ...next.run, status: "error", statusLabel: void 0, error } };
    }
    default:
      return state;
  }
}
function interruptRun(state, error, ctx) {
  const messageId = state.run.messageId;
  const next = updateMessage(
    state,
    messageId,
    (m) => m.status === "streaming" ? linkToolResults(
      {
        ...m,
        status: error ? "interrupted" : "cancelled",
        error: _nullishCoalesce(error, () => ( m.error)),
        blocks: m.blocks.map((b) => b.status === "streaming" ? { ...b, status: "interrupted", completedAt: ctx.now } : b)
      },
      { ended: true }
    ) : m
  );
  return {
    ...next,
    run: error ? { status: "error", messageId, error } : { status: "idle", messageId },
    streamBlockIds: {}
  };
}

// src/core/store/normalize.ts
var isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var STATUS_BY_STOP2 = {
  end_turn: "complete",
  paused: "paused",
  error: "error",
  cancelled: "cancelled"
};
var extOf = (v) => isObject(v) ? v : void 0;
function selectedModelOf(c) {
  if (typeof c.selected_model === "string" && c.selected_model) return c.selected_model;
  return typeof c.model === "string" && c.model ? c.model : void 0;
}
function toConversationItem(s) {
  const model = selectedModelOf(s);
  const ext = extOf(s.ext);
  return {
    id: s.conversation_id,
    title: s.title || "New chat",
    createdAt: s.created_at,
    updatedAt: s.updated_at || s.created_at,
    archived: Boolean(s.archived),
    ...model ? { model } : {},
    ...typeof s.message_count === "number" ? { messageCount: s.message_count } : {},
    ...ext ? { ext } : {}
  };
}
function metaFromBootstrap(b) {
  return {
    ...emptyMeta(),
    title: b.title || "New chat",
    subtitle: b.subtitle,
    greeting: b.greeting,
    suggestedPrompts: Array.isArray(b.suggested_prompts) ? b.suggested_prompts : [],
    models: Array.isArray(b.model) ? b.model.filter((m) => typeof m === "string") : [],
    model: selectedModelOf(b),
    sources: Array.isArray(b.sources) ? b.sources : [],
    archived: Boolean(b.archived),
    createdAt: b.created_at,
    updatedAt: b.updated_at,
    ext: extOf(b.ext)
  };
}
function checkpointFromBlock(block) {
  const cp = isObject(block.checkpoint) ? block.checkpoint : void 0;
  const id = typeof _optionalChain([cp, 'optionalAccess', _22 => _22.checkpoint_id]) === "string" ? cp.checkpoint_id : typeof block.checkpoint_id === "string" ? block.checkpoint_id : void 0;
  if (!id) return void 0;
  const decision = _nullishCoalesce(_optionalChain([cp, 'optionalAccess', _23 => _23.decision]), () => ( block.decision));
  const resolved = _optionalChain([cp, 'optionalAccess', _24 => _24.status]) === "resolved" || _optionalChain([cp, 'optionalAccess', _25 => _25.resolved]) === true || decision !== void 0;
  return {
    id,
    requires: _nullishCoalesce(_optionalChain([cp, 'optionalAccess', _26 => _26.requires]), () => ( block.requires)),
    status: resolved ? "resolved" : "pending",
    decision
  };
}
function toBlock(raw, fallbackId) {
  const data = {
    ...raw,
    id: typeof raw.id === "string" && raw.id ? raw.id : fallbackId,
    type: typeof raw.type === "string" ? raw.type : "text",
    category: typeof raw.category === "string" ? raw.category : "content"
  };
  return {
    id: data.id,
    type: data.type,
    category: data.category,
    status: "complete",
    data,
    checkpoint: checkpointFromBlock(data)
  };
}
function contentToBlocks(message) {
  const { content } = message;
  if (Array.isArray(content)) return content.filter(isObject);
  if (typeof content === "string") return [{ id: `${message.message_id}:0`, type: "text", category: "content", text: content }];
  if (isObject(content)) {
    if (typeof content.default === "string") {
      return [{ id: `${message.message_id}:0`, type: "text", category: "content", text: content.default }];
    }
    return [{ id: `${message.message_id}:0`, type: "hitl_decision", category: "hitl", ...content }];
  }
  return [];
}
function decisionOf(message, blocks) {
  if (message.role !== "user") return null;
  if (message.type === "hitl" || blocks.some((b) => typeof b.checkpoint_id === "string")) {
    const b = blocks.find((x) => typeof x.checkpoint_id === "string");
    if (b) return { checkpointId: b.checkpoint_id, decision: b.decision };
  }
  return null;
}
function normalizeMessages(wire) {
  const decisions = /* @__PURE__ */ new Map();
  const messages = [];
  const valid = wire.filter((w) => isObject(w) && typeof w.message_id === "string");
  valid.forEach((w, position) => {
    const raw = contentToBlocks(w);
    const decision = decisionOf(w, raw);
    if (decision) {
      decisions.set(decision.checkpointId, decision.decision);
      return;
    }
    const role = w.role === "user" ? "user" : "assistant";
    const stop = typeof w.stop_reason === "string" ? w.stop_reason : void 0;
    const ext = extOf(w.ext);
    const message = {
      id: w.message_id,
      role,
      blocks: raw.map((b, i) => toBlock(b, `${w.message_id}:${i}`)),
      status: stop ? _nullishCoalesce(STATUS_BY_STOP2[stop], () => ( "complete")) : "complete",
      stopReason: stop,
      createdAt: typeof w.created_at === "string" ? w.created_at : (/* @__PURE__ */ new Date(0)).toISOString(),
      model: typeof w.model === "string" ? w.model : void 0,
      attachments: Array.isArray(w.attachments) ? w.attachments : void 0,
      ...typeof w.client_message_id === "string" && w.client_message_id ? { clientMessageId: w.client_message_id } : {},
      ...typeof w.run_id === "string" && w.run_id ? { runId: w.run_id } : {},
      ...isObject(w.usage) ? { usage: w.usage } : {},
      ...ext ? { ext } : {}
    };
    const stillRunning = stop === "paused" || stop === void 0 && position === valid.length - 1;
    messages.push(role === "assistant" ? linkToolResults(message, { ended: !stillRunning }) : message);
  });
  if (decisions.size) {
    for (const m of messages) {
      m.blocks = m.blocks.map(
        (b) => b.checkpoint && decisions.has(b.checkpoint.id) ? { ...b, checkpoint: { ...b.checkpoint, status: "resolved", decision: decisions.get(b.checkpoint.id) } } : b
      );
    }
  }
  let pendingCheckpoint;
  const last = messages[messages.length - 1];
  if (last && last.role === "assistant" && last.status === "paused") {
    const block = [...last.blocks].reverse().find((b) => _optionalChain([b, 'access', _27 => _27.checkpoint, 'optionalAccess', _28 => _28.status]) === "pending");
    if (_optionalChain([block, 'optionalAccess', _29 => _29.checkpoint])) {
      pendingCheckpoint = {
        checkpointId: block.checkpoint.id,
        messageId: last.id,
        blockId: block.id,
        requires: block.checkpoint.requires
      };
    }
  }
  return { messages, pendingCheckpoint };
}
function normalizeConversationDetail(detail, previous) {
  const { messages, pendingCheckpoint } = normalizeMessages(Array.isArray(detail.messages) ? detail.messages : []);
  const base = _nullishCoalesce(previous, () => ( emptyMeta()));
  return {
    meta: {
      ...base,
      title: detail.title || base.title,
      subtitle: _nullishCoalesce(detail.subtitle, () => ( base.subtitle)),
      sources: Array.isArray(detail.sources) ? detail.sources : base.sources,
      archived: Boolean(detail.archived),
      createdAt: detail.created_at,
      updatedAt: detail.updated_at,
      model: _nullishCoalesce(selectedModelOf(detail), () => ( base.model)),
      models: Array.isArray(detail.model) ? detail.model.filter((m) => typeof m === "string") : base.models,
      ext: _nullishCoalesce(extOf(detail.ext), () => ( base.ext))
    },
    messages,
    pendingCheckpoint
  };
}

// src/core/store/conversations.ts
var DAY = 24 * 60 * 60 * 1e3;
function sortConversations(items) {
  return [...items].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}
function startOfDay(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
function groupKeyFor(updatedAt, now = Date.now()) {
  const t = Date.parse(updatedAt);
  if (Number.isNaN(t)) return "older";
  const today = startOfDay(now);
  if (t >= today) return "today";
  if (t >= today - DAY) return "yesterday";
  if (t >= today - 7 * DAY) return "previous7";
  if (t >= today - 30 * DAY) return "previous30";
  return "older";
}
var ORDER = ["today", "yesterday", "previous7", "previous30", "older"];
function groupConversations(items, now = Date.now()) {
  const buckets = /* @__PURE__ */ new Map();
  for (const item of sortConversations(items)) {
    const key = groupKeyFor(item.updatedAt, now);
    const list = buckets.get(key);
    if (list) list.push(item);
    else buckets.set(key, [item]);
  }
  return ORDER.filter((k) => buckets.has(k)).map((key) => ({ key, items: buckets.get(key) }));
}
function filterConversations(items, query) {
  const q = fold(query.trim());
  if (!q) return items;
  return items.filter((i) => fold(i.title).includes(q));
}
function fold(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// src/core/runtime/scope.ts
function selectAll(groups) {
  return Object.fromEntries(groups.map((g) => [g.id, g.items.map((i) => i.id)]));
}
function sanitizeSelection(selection, groups) {
  if (!selection || typeof selection !== "object") return void 0;
  const out = {};
  for (const g of groups) {
    const chosen = Array.isArray(selection[g.id]) ? selection[g.id] : [];
    const valid = chosen.filter((id) => g.items.some((i) => i.id === id));
    if (valid.length) out[g.id] = valid;
  }
  return out;
}
function initialSelection(config, groups) {
  const d = _nullishCoalesce(_optionalChain([config, 'optionalAccess', _30 => _30.defaultSelection]), () => ( "all"));
  if (d === "all") return selectAll(groups);
  if (d === "none") return {};
  return _nullishCoalesce(sanitizeSelection(d, groups), () => ( {}));
}
function defaultScopeToRequest(selection, groups) {
  const byWorkflow = /* @__PURE__ */ new Map();
  for (const g of groups) {
    for (const itemId of _nullishCoalesce(selection[g.id], () => ( []))) {
      if (!g.items.some((i) => i.id === itemId)) continue;
      let set = byWorkflow.get(itemId);
      if (!set) byWorkflow.set(itemId, set = /* @__PURE__ */ new Set());
      set.add(g.id);
    }
  }
  if (!byWorkflow.size) return {};
  return {
    workflow_context: [...byWorkflow].map(([workflow_name, ws]) => ({ workflow_name, workspace_id: [...ws], context: {} }))
  };
}
function summarizeScope(selection, groups) {
  let selected = 0;
  let total = 0;
  for (const g of groups) {
    total += g.items.length;
    const chosen = new Set(_nullishCoalesce(selection[g.id], () => ( [])));
    selected += g.items.filter((i) => chosen.has(i.id)).length;
  }
  return { selected, total, allSelected: total > 0 && selected === total };
}
function mergeWorkflowContexts(...lists) {
  const map = /* @__PURE__ */ new Map();
  for (const list of lists) {
    for (const wc of _nullishCoalesce(list, () => ( []))) {
      if (!wc || typeof wc.workflow_name !== "string") continue;
      const prev = map.get(wc.workflow_name);
      const ids = Array.isArray(wc.workspace_id) ? wc.workspace_id : [];
      map.set(wc.workflow_name, {
        workflow_name: wc.workflow_name,
        workspace_id: [.../* @__PURE__ */ new Set([..._nullishCoalesce(_optionalChain([prev, 'optionalAccess', _31 => _31.workspace_id]), () => ( [])), ...ids])],
        context: { ..._nullishCoalesce(_optionalChain([prev, 'optionalAccess', _32 => _32.context]), () => ( {})), ..._nullishCoalesce(wc.context, () => ( {})) }
      });
    }
  }
  return map.size ? [...map.values()] : void 0;
}

// src/core/runtime/utils.ts
function uid(prefix = "") {
  const c = globalThis.crypto;
  const id = typeof _optionalChain([c, 'optionalAccess', _33 => _33.randomUUID]) === "function" ? c.randomUUID().replace(/-/g, "").slice(0, 16) : Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  return prefix + id;
}
var Inflight = (_class = class {constructor() { _class.prototype.__init.call(this); }
  __init() {this.map = /* @__PURE__ */ new Map()}
  run(key, fn) {
    const existing = this.map.get(key);
    if (existing) return existing;
    const p = fn().finally(() => {
      if (this.map.get(key) === p) this.map.delete(key);
    });
    this.map.set(key, p);
    return p;
  }
}, _class);
var Emitter = (_class2 = class {constructor() { _class2.prototype.__init2.call(this); }
  __init2() {this.listeners = /* @__PURE__ */ new Map()}
  on(type, listener) {
    let set = this.listeners.get(type);
    if (!set) this.listeners.set(type, set = /* @__PURE__ */ new Set());
    const l = listener;
    set.add(l);
    return () => {
      set.delete(l);
    };
  }
  emit(type, ...args) {
    const set = this.listeners.get(type);
    if (!set) return;
    for (const listener of [...set]) {
      try {
        listener(...args);
      } catch (error) {
        console.error("[agentic-chat] listener error", error);
      }
    }
  }
  clear() {
    this.listeners.clear();
  }
}, _class2);

// src/core/runtime/runtime.ts
var NEW_THREAD_KEY = "__new__";
var BUSY = /* @__PURE__ */ new Set(["submitting", "streaming", "cancelling"]);
var isBusy = (s) => BUSY.has(s.run.status);
var IMMEDIATE = /* @__PURE__ */ new Set(["message_start", "checkpoint", "message_stop", "error"]);
function matchesAccept(file, accept) {
  const tokens = accept.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (!tokens.length) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return tokens.some((t) => {
    if (t.startsWith(".")) return name.endsWith(t);
    if (t.endsWith("/*")) return type.startsWith(t.slice(0, -1));
    return type === t;
  });
}
function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 10 ? Math.round(v) : Math.round(v * 10) / 10} ${units[i]}`;
}
function completedOnly(messages) {
  return messages.filter((m) => m.status !== "streaming").map((m) => ({ ...m, blocks: m.blocks.filter((b) => b.status !== "streaming") }));
}
function mergeLocalCheckpoints(prev, next) {
  const known = /* @__PURE__ */ new Map();
  for (const m of prev)
    for (const b of m.blocks) if (b.checkpoint && b.checkpoint.status !== "pending") known.set(b.id, b.checkpoint);
  if (!known.size) return next;
  return next.map((m) => ({
    ...m,
    blocks: m.blocks.map((b) => {
      const local = known.get(b.id);
      if (!local) return b;
      if (!b.checkpoint || b.checkpoint.status === "pending") return { ...b, checkpoint: local };
      return b;
    })
  }));
}
var CONFIG_WAIT_MS = 3e3;
var Runtime = (_class3 = class {
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  __init3() {this.threads = /* @__PURE__ */ new Map()}
  __init4() {this.emitter = new Emitter()}
  __init5() {this.inflight = new Inflight()}
  __init6() {this.createdLocally = /* @__PURE__ */ new Map()}
  __init7() {this.cleanups = []}
  
  __init8() {this.drafts = {}}
  
  __init9() {this.threadIndex = []}
  __init10() {this.listToken = 0}
  __init11() {this.lastFocusRefresh = 0}
  
  
  __init12() {this.warnedOnce = /* @__PURE__ */ new Set()}
  
  
  __init13() {this.disposed = false}
  constructor(options) {;_class3.prototype.__init3.call(this);_class3.prototype.__init4.call(this);_class3.prototype.__init5.call(this);_class3.prototype.__init6.call(this);_class3.prototype.__init7.call(this);_class3.prototype.__init8.call(this);_class3.prototype.__init9.call(this);_class3.prototype.__init10.call(this);_class3.prototype.__init11.call(this);_class3.prototype.__init12.call(this);_class3.prototype.__init13.call(this);
    this.options = options;
    this.adapter = options.adapter;
    this.scheduler = _nullishCoalesce(options.scheduler, () => ( frameScheduler));
    this.now = _nullishCoalesce(options.now, () => ( Date.now));
    this.idleMs = _nullishCoalesce(options.streamIdleTimeoutMs, () => ( 6e4));
    this.maxThreads = Math.max(2, _nullishCoalesce(options.maxThreads, () => ( 20)));
    this.config = {
      conversationCreation: _nullishCoalesce(options.conversationCreation, () => ( "eager")),
      composerWhilePaused: _nullishCoalesce(_optionalChain([options, 'access', _34 => _34.hitl, 'optionalAccess', _35 => _35.composerWhilePaused]), () => ( "disabled")),
      attachments: options.attachments ? { accept: options.attachments.accept, maxSize: options.attachments.maxSize, maxFiles: options.attachments.maxFiles } : void 0,
      hasScope: Boolean(options.scope),
      canReconnect: Boolean(options.onConnectionRequired)
    };
    this.persister = createPersister(
      options.persistence,
      (error) => this.warn({ code: "storage_error", message: "Local storage is unavailable; keeping chat state in memory.", data: error }),
      this.now
    );
    this.persistence = {
      enabled: this.persister.enabled,
      clear: () => this.persister.clear(),
      flush: () => this.persister.flush()
    };
    this.chatConfig = createStore(
      { status: "idle", capabilities: _chunkR7CUDWRTcjs.resolveCapabilities.call(void 0, "idle", void 0, options.capabilities) },
      this.scheduler
    );
    this.conversations = createStore({ items: [], status: "idle", runningIds: [] }, this.scheduler);
    this.session = createStore({ activeKey: NEW_THREAD_KEY, activeId: null, hydrated: false }, this.scheduler);
    this.scope = createStore(
      {
        groups: [],
        selection: {},
        status: options.scope ? "loading" : "ready",
        ...options.scope ? { origin: "host" } : {}
      },
      this.scheduler
    );
    this.preferences = createStore({}, this.scheduler);
    this.threads.set(NEW_THREAD_KEY, this.createThread(NEW_THREAD_KEY, null));
    this.hydration = this.hydrate();
    this.initScope();
  }
  // ------------------------------------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------------------------------------
  start() {
    if (!this.startPromise) {
      this.startPromise = (async () => {
        const config = this.loadConfig();
        await this.hydration;
        if (this.disposed) return;
        this.listenForFocus();
        this.cleanups.push(this.persister.onExternalChange((name) => this.onExternalChange(name)));
        const list = this.refreshConversations().catch(() => void 0);
        const activeId = this.session.getState().activeId;
        if (activeId) {
          const t = this.thread(activeId);
          this.setActive(activeId);
          await this.loadThread(t, false, true);
          const restored = this.thread(activeId);
          const st = restored.store.getState();
          if (st.loadStatus === "error" && this.session.getState().activeId === activeId) {
            if (this.config.conversationCreation === "eager") await this.newConversation().catch(() => void 0);
            else this.setActive(null);
          } else if (this.config.conversationCreation === "eager" && this.session.getState().activeId === activeId && st.loadStatus === "ready" && st.messages.length === 0 && !isBusy(st) && !restored.composer.getState().text.trim() && !st.meta.greeting && st.meta.suggestedPrompts.length === 0) {
            await this.newConversation().catch(() => void 0);
          }
        } else if (this.config.conversationCreation === "eager") {
          await this.newConversation().catch(() => void 0);
        }
        await Promise.all([list, config]);
      })();
    }
    return this.startPromise;
  }
  // ------------------------------------------------------------------------------------------
  // Config (endpoint 0)
  // ------------------------------------------------------------------------------------------
  loadConfig() {
    if (this.configPromise && this.chatConfig.getState().status === "loading") return this.configPromise;
    const getConfig = _optionalChain([this, 'access', _36 => _36.adapter, 'access', _37 => _37.getConfig, 'optionalAccess', _38 => _38.bind, 'call', _39 => _39(this.adapter)]);
    const host = this.options.capabilities;
    if (!getConfig) {
      this.chatConfig.setState({ status: "unavailable", capabilities: _chunkR7CUDWRTcjs.resolveCapabilities.call(void 0, "unavailable", void 0, host) });
      this.configPromise = Promise.resolve();
      return this.configPromise;
    }
    this.chatConfig.setState((s) => ({ ...s, status: "loading", error: void 0 }));
    this.configPromise = (async () => {
      try {
        const config = _chunkR7CUDWRTcjs.normalizeConfig.call(void 0, await getConfig());
        if (this.disposed) return;
        if (!config) {
          this.chatConfig.setState({ status: "unavailable", capabilities: _chunkR7CUDWRTcjs.resolveCapabilities.call(void 0, "unavailable", void 0, host) });
          return;
        }
        this.chatConfig.setState({ status: "ready", config, capabilities: _chunkR7CUDWRTcjs.resolveCapabilities.call(void 0, "ready", config, host) });
        this.applyConfigScope();
      } catch (error) {
        if (this.disposed) return;
        const info = toErrorInfo(error);
        this.chatConfig.setState({ status: "error", error: info, capabilities: _chunkR7CUDWRTcjs.resolveCapabilities.call(void 0, "error", void 0, host) });
        this.warn({ code: "config_failed", message: "Could not load the chat config; using the default features.", data: info });
      }
    })();
    return this.configPromise;
  }
  capabilities() {
    return this.chatConfig.getState().capabilities;
  }
  /** Waits briefly for a config that's still loading, so the first send follows its rules. */
  async configSettled() {
    const pending = this.configPromise;
    if (!pending || this.chatConfig.getState().status !== "loading") return;
    let timer;
    await Promise.race([pending, new Promise((r) => timer = setTimeout(r, CONFIG_WAIT_MS))]);
    clearTimeout(timer);
  }
  /** The config's workflows fill the scope picker when the host didn't supply a catalog. */
  applyConfigScope() {
    const { config, capabilities } = this.chatConfig.getState();
    if (this.options.scope || !config || !capabilities.workflowContext || !config.workflows.length) return;
    const groups = _chunkR7CUDWRTcjs.scopeGroupsFromWorkflows.call(void 0, config.workflows);
    const kept = sanitizeSelection(this.persistedScope, groups);
    this.scope.setState({
      groups,
      selection: kept && Object.keys(kept).length ? kept : selectAll(groups),
      status: "ready",
      origin: "config"
    });
  }
  warnOnce(key, warning) {
    if (this.warnedOnce.has(key)) return;
    this.warnedOnce.add(key);
    this.warn(warning);
  }
  /** F16: leaves out source ids the config doesn't list, with one warning per id. */
  filterSources(sources) {
    const { kept, dropped } = _chunkR7CUDWRTcjs.knownSources.call(void 0, sources, this.chatConfig.getState().config);
    for (const id of dropped) {
      this.warnOnce(`source:${id}`, {
        code: "unknown_source",
        message: `Left out source "${id}": the backend's config doesn't list it.`
      });
    }
    return kept;
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const t of this.threads.values()) {
      if (t.abort) {
        t.abortReason = "dispose";
        t.abort.abort();
      }
      for (const u of t.uploads.values()) u.abort();
      clearTimeout(t.cancelTimer);
    }
    for (const c of this.cleanups.splice(0)) c();
    this.persister.dispose();
    this.emitter.clear();
  }
  on(type, listener) {
    return this.emitter.on(type, listener);
  }
  setDeltaResolver(resolver) {
    this.deltaResolver = resolver;
  }
  // ------------------------------------------------------------------------------------------
  // Threads
  // ------------------------------------------------------------------------------------------
  getThread(conversationId) {
    return this.thread(conversationId);
  }
  activeThread() {
    return this.thread(this.session.getState().activeId);
  }
  active() {
    return this.thread(this.session.getState().activeId);
  }
  target(conversationId) {
    return conversationId === void 0 ? this.active() : this.thread(conversationId);
  }
  thread(conversationId) {
    const key = _nullishCoalesce(conversationId, () => ( NEW_THREAD_KEY));
    const existing = this.threads.get(key);
    if (existing) {
      this.threads.delete(key);
      this.threads.set(key, existing);
      return existing;
    }
    const t = this.createThread(key, conversationId);
    this.threads.set(key, t);
    this.evictThreads();
    return t;
  }
  createThread(key, conversationId) {
    const draft = this.drafts[key];
    const store = createStore(createThreadState(conversationId), this.scheduler);
    const composer = createStore(
      {
        text: _nullishCoalesce(_optionalChain([draft, 'optionalAccess', _40 => _40.text]), () => ( "")),
        attachments: (_nullishCoalesce(_optionalChain([draft, 'optionalAccess', _41 => _41.attachments]), () => ( []))).map((a) => ({
          id: uid("att_"),
          name: a.filename,
          size: a.size,
          contentType: a.content_type,
          status: "ready",
          progress: 1,
          attachment: a
        }))
      },
      this.scheduler
    );
    const t = { key, store, composer, cancelRequested: false, loadToken: 0, fresh: false, uploads: /* @__PURE__ */ new Map() };
    composer.subscribe(() => this.persistDraft(t));
    if (conversationId && this.persister.config.persist.history) this.hydrateThreadFromCache(t, conversationId);
    return t;
  }
  evictThreads() {
    while (this.threads.size > this.maxThreads) {
      const activeKey = _optionalChain([this, 'access', _42 => _42.session, 'optionalAccess', _43 => _43.getState, 'call', _44 => _44(), 'access', _45 => _45.activeKey]);
      const victim = [...this.threads.values()].find(
        (t) => t.key !== NEW_THREAD_KEY && t.key !== activeKey && !t.abort && t.uploads.size === 0 && t.store.listenerCount() === 0 && t.composer.listenerCount() <= 1
      );
      if (!victim) return;
      this.threads.delete(victim.key);
    }
  }
  setActive(conversationId) {
    const key = _nullishCoalesce(conversationId, () => ( NEW_THREAD_KEY));
    this.thread(conversationId);
    if (this.session.getState().activeKey === key) return;
    this.session.setState((s) => ({ ...s, activeKey: key, activeId: conversationId }));
    if (this.persister.config.persist.activeConversation) this.persister.write("active", conversationId);
    this.emitter.emit("activeChange", conversationId);
  }
  // ------------------------------------------------------------------------------------------
  // Conversations
  // ------------------------------------------------------------------------------------------
  async newConversation() {
    const current = this.active();
    const st = current.store.getState();
    const untouched = st.messages.length === 0 && !isBusy(st) && current.composer.getState().text.trim() === "";
    if (untouched && st.loadStatus !== "error") {
      if (st.conversationId === null && this.config.conversationCreation === "lazy") return null;
      if (st.conversationId !== null && current.fresh) return st.conversationId;
    }
    if (this.config.conversationCreation === "lazy") {
      this.setActive(null);
      return null;
    }
    const spare = [...this.threads.values()].reverse().find((t) => {
      const s = t.store.getState();
      return t.fresh && s.conversationId && s.messages.length === 0 && !isBusy(s) && !t.composer.getState().text.trim();
    });
    if (spare) {
      const id = spare.store.getState().conversationId;
      this.setActive(id);
      return id;
    }
    if (this.creating) {
      this.setActive(null);
      return this.creating;
    }
    const draft = this.thread(null);
    this.setActive(null);
    draft.store.setState((s) => ({ ...s, loadStatus: "loading", loadError: void 0 }));
    this.creating = (async () => {
      try {
        const boot = await this.adapter.createConversation();
        if (!this.disposed) this.adoptNewThread(draft, boot);
        return boot.conversation_id;
      } catch (error) {
        const info = toErrorInfo(error);
        draft.store.setState((s) => ({ ...s, loadStatus: "error", loadError: info }));
        this.reportError(info, error);
        throw error;
      } finally {
        this.creating = void 0;
      }
    })();
    return this.creating;
  }
  /** Re-keys the unsaved `__new__` thread to the id the server just created. */
  adoptNewThread(draft, boot) {
    const id = boot.conversation_id;
    this.threads.delete(NEW_THREAD_KEY);
    draft.key = id;
    draft.fresh = true;
    draft.lastLoadedAt = this.now();
    this.threads.set(id, draft);
    this.createdLocally.set(id, this.now());
    draft.store.setState((s) => ({
      ...s,
      conversationId: id,
      loadStatus: "ready",
      loadError: void 0,
      meta: { ...metaFromBootstrap(boot), sources: _nullishCoalesce(boot.sources, () => ( s.meta.sources)) }
    }));
    if (this.drafts[NEW_THREAD_KEY]) {
      this.drafts[id] = this.drafts[NEW_THREAD_KEY];
      delete this.drafts[NEW_THREAD_KEY];
      this.writeDrafts();
    }
    this.threads.set(NEW_THREAD_KEY, this.createThread(NEW_THREAD_KEY, null));
    if (this.session.getState().activeKey === NEW_THREAD_KEY) {
      this.session.setState((s) => ({ ...s, activeKey: id, activeId: id }));
      if (this.persister.config.persist.activeConversation) this.persister.write("active", id);
      this.emitter.emit("activeChange", id);
    }
    if (draft.store.getState().messages.length) this.upsertConversation(toConversationItem(boot));
    return draft;
  }
  async selectConversation(conversationId) {
    if (conversationId === null) {
      await this.newConversation().catch(() => void 0);
      return;
    }
    const t = this.thread(conversationId);
    this.setActive(conversationId);
    await this.loadThread(t);
  }
  /** `restoring`: a remembered conversation that's gone is expected, not an error to report. */
  async loadThread(t, force = false, restoring = false) {
    const id = t.store.getState().conversationId;
    if (!id) return;
    const st = t.store.getState();
    if (isBusy(st)) return;
    if (!force && st.loadStatus === "ready" && t.lastLoadedAt && this.now() - t.lastLoadedAt < 5e3) return;
    const token = ++t.loadToken;
    if (st.loadStatus !== "ready") t.store.setState((s) => ({ ...s, loadStatus: "loading", loadError: void 0 }));
    try {
      const detail = await this.inflight.run(`get:${id}`, () => this.adapter.getConversation(id));
      if (token !== t.loadToken || this.disposed || isBusy(t.store.getState())) return;
      const prev = t.store.getState();
      const n = normalizeConversationDetail(detail, prev.meta);
      t.lastLoadedAt = this.now();
      t.store.setState((s) => ({
        ...s,
        loadStatus: "ready",
        loadError: void 0,
        meta: n.meta,
        messages: mergeLocalCheckpoints(prev.messages, n.messages),
        pendingCheckpoint: n.pendingCheckpoint,
        run: n.pendingCheckpoint ? { status: "paused", messageId: n.pendingCheckpoint.messageId } : { status: "idle" }
      }));
      this.upsertConversation(
        {
          id,
          title: n.meta.title,
          createdAt: detail.created_at,
          updatedAt: detail.updated_at || detail.created_at,
          archived: n.meta.archived
        },
        false
      );
      this.persistThread(t);
    } catch (error) {
      if (token !== t.loadToken || this.disposed) return;
      const info = toErrorInfo(error);
      if (error instanceof _chunkZNIBBZSNcjs.ChatApiError && error.status === 404) this.removeConversationLocal(id);
      if (t.store.getState().loadStatus === "ready" && t.store.getState().messages.length) {
        this.warn({ code: "revalidate_failed", message: "Showing saved messages; could not refresh them.", data: info });
        return;
      }
      t.store.setState((s) => ({ ...s, loadStatus: "error", loadError: info }));
      if (restoring && error instanceof _chunkZNIBBZSNcjs.ChatApiError && error.status === 404) {
        this.warn({
          code: "revalidate_failed",
          message: "The remembered conversation no longer exists; starting a new chat.",
          data: info
        });
        return;
      }
      this.reportError(info, error);
    }
  }
  refreshConversations() {
    return this.inflight.run("list", async () => {
      const token = ++this.listToken;
      if (this.conversations.getState().status !== "ready") {
        this.conversations.setState((s) => ({ ...s, status: "loading", error: void 0 }));
      }
      try {
        const list = await this.adapter.listConversations();
        if (token !== this.listToken || this.disposed) return;
        const server = (Array.isArray(list) ? list : []).filter((c) => Boolean(c && typeof c.conversation_id === "string")).map(toConversationItem);
        const serverIds = new Set(server.map((i) => i.id));
        const now = this.now();
        const keep = this.conversations.getState().items.filter((i) => !serverIds.has(i.id) && now - (_nullishCoalesce(this.createdLocally.get(i.id), () => ( -Infinity))) < 6e4);
        this.conversations.setState((s) => ({
          ...s,
          items: sortConversations([...server, ...keep]),
          status: "ready",
          error: void 0
        }));
        this.persistConversations();
      } catch (error) {
        if (token !== this.listToken) return;
        const info = toErrorInfo(error);
        this.conversations.setState((s) => ({ ...s, status: s.items.length ? "ready" : "error", error: info }));
        this.reportError(info, error);
      }
    });
  }
  async renameConversation(conversationId, title) {
    const clean = title.trim().slice(0, 200);
    if (!clean) return;
    const prevItem = this.conversations.getState().items.find((i) => i.id === conversationId);
    const t = this.threads.get(conversationId);
    const prevTitle = _optionalChain([t, 'optionalAccess', _46 => _46.store, 'access', _47 => _47.getState, 'call', _48 => _48(), 'access', _49 => _49.meta, 'access', _50 => _50.title]);
    this.patchLocal(conversationId, { title: clean });
    try {
      await this.adapter.updateConversation(conversationId, { title: clean });
    } catch (error) {
      this.patchLocal(conversationId, { title: _nullishCoalesce(_nullishCoalesce(_optionalChain([prevItem, 'optionalAccess', _51 => _51.title]), () => ( prevTitle)), () => ( "New chat")) });
      this.reportError(toErrorInfo(error), error);
      throw error;
    }
  }
  async archiveConversation(conversationId, archived) {
    const prev = _nullishCoalesce(_optionalChain([this, 'access', _52 => _52.conversations, 'access', _53 => _53.getState, 'call', _54 => _54(), 'access', _55 => _55.items, 'access', _56 => _56.find, 'call', _57 => _57((i) => i.id === conversationId), 'optionalAccess', _58 => _58.archived]), () => ( !archived));
    this.patchLocal(conversationId, { archived });
    try {
      await this.adapter.updateConversation(conversationId, { archived });
    } catch (error) {
      this.patchLocal(conversationId, { archived: prev });
      this.reportError(toErrorInfo(error), error);
      throw error;
    }
  }
  async deleteConversation(conversationId) {
    const items = this.conversations.getState().items;
    const index = items.findIndex((i) => i.id === conversationId);
    const item = items[index];
    this.removeConversationLocal(conversationId);
    const t = this.threads.get(conversationId);
    if (_optionalChain([t, 'optionalAccess', _59 => _59.abort])) {
      t.abortReason = "deleted";
      t.abort.abort();
    }
    if (this.session.getState().activeId === conversationId) {
      await this.newConversation().catch(() => this.setActive(null));
    }
    try {
      await this.adapter.deleteConversation(conversationId);
      this.threads.delete(conversationId);
      delete this.drafts[conversationId];
      this.writeDrafts();
      this.dropThreadCache(conversationId);
    } catch (error) {
      if (item) {
        this.conversations.setState((s) => {
          const next = [...s.items];
          next.splice(Math.min(index, next.length), 0, item);
          return { ...s, items: next };
        });
        this.persistConversations();
      }
      this.reportError(toErrorInfo(error), error);
      throw error;
    }
  }
  async setModel(model, conversationId) {
    const t = this.target(conversationId);
    const id = t.store.getState().conversationId;
    const prev = t.store.getState().meta.model;
    t.store.setState((s) => ({ ...s, meta: { ...s.meta, model } }));
    const values = { ...this.preferences.getState(), model };
    this.preferences.setState(values);
    this.writePrefs();
    if (!id) return;
    try {
      const updated = await this.adapter.updateConversation(id, { model });
      const selected = updated ? selectedModelOf(updated) : void 0;
      if (selected && selected !== model) t.store.setState((s) => ({ ...s, meta: { ...s.meta, model: selected } }));
    } catch (error) {
      t.store.setState((s) => ({ ...s, meta: { ...s.meta, model: prev } }));
      this.reportError(toErrorInfo(error), error);
      throw error;
    }
  }
  async setDefaultSources(sources, conversationId) {
    await this.configSettled();
    const t = this.target(conversationId);
    const id = t.store.getState().conversationId;
    const prev = t.store.getState().meta.sources;
    const send = this.filterSources(sources);
    if (sources.length && !send.length) return;
    t.store.setState((s) => ({ ...s, meta: { ...s.meta, sources: _chunkR7CUDWRTcjs.stripCredentials.call(void 0, send) } }));
    if (!id) return;
    try {
      const updated = await this.adapter.updateConversation(id, { sources: send });
      if (Array.isArray(_optionalChain([updated, 'optionalAccess', _60 => _60.sources]))) {
        const server = _chunkR7CUDWRTcjs.stripCredentials.call(void 0, updated.sources);
        t.store.setState((s) => ({ ...s, meta: { ...s.meta, sources: server } }));
        this.persistThread(t);
      }
    } catch (error) {
      t.store.setState((s) => ({ ...s, meta: { ...s.meta, sources: prev } }));
      this.reportError(toErrorInfo(error), error);
      throw error;
    }
  }
  patchLocal(conversationId, patch) {
    this.conversations.setState((s) => ({ ...s, items: s.items.map((i) => i.id === conversationId ? { ...i, ...patch } : i) }));
    const t = this.threads.get(conversationId);
    if (t) t.store.setState((s) => ({ ...s, meta: { ...s.meta, ...patch } }));
    this.persistConversations();
  }
  upsertConversation(item, bump = true) {
    this.conversations.setState((s) => {
      const exists = s.items.some((i) => i.id === item.id);
      const items = exists ? s.items.map((i) => i.id === item.id ? { ...i, ...item } : i) : [item, ...s.items];
      return { ...s, items: bump || !exists ? sortConversations(items) : items };
    });
    this.persistConversations();
  }
  touchConversation(conversationId) {
    const t = this.threads.get(conversationId);
    const meta = _optionalChain([t, 'optionalAccess', _61 => _61.store, 'access', _62 => _62.getState, 'call', _63 => _63(), 'access', _64 => _64.meta]);
    const existing = this.conversations.getState().items.find((i) => i.id === conversationId);
    const now = new Date(this.now()).toISOString();
    this.upsertConversation({
      id: conversationId,
      title: _nullishCoalesce(_nullishCoalesce(_optionalChain([meta, 'optionalAccess', _65 => _65.title]), () => ( _optionalChain([existing, 'optionalAccess', _66 => _66.title]))), () => ( "New chat")),
      createdAt: _nullishCoalesce(_nullishCoalesce(_optionalChain([existing, 'optionalAccess', _67 => _67.createdAt]), () => ( _optionalChain([meta, 'optionalAccess', _68 => _68.createdAt]))), () => ( now)),
      updatedAt: now,
      archived: _nullishCoalesce(_optionalChain([existing, 'optionalAccess', _69 => _69.archived]), () => ( false))
    });
  }
  removeConversationLocal(conversationId) {
    this.conversations.setState((s) => ({ ...s, items: s.items.filter((i) => i.id !== conversationId) }));
    this.persistConversations();
  }
  setRunning(conversationId, running) {
    this.conversations.setState((s) => {
      const has = s.runningIds.includes(conversationId);
      if (running === has) return s;
      return { ...s, runningIds: running ? [...s.runningIds, conversationId] : s.runningIds.filter((x) => x !== conversationId) };
    });
  }
  // ------------------------------------------------------------------------------------------
  // Turns
  // ------------------------------------------------------------------------------------------
  async send(text, options = {}) {
    await this.configSettled();
    const t = this.target(options.conversationId);
    const trimmed = text.trim();
    const composer = t.composer.getState();
    if (!options.attachments && composer.attachments.some((a) => a.status === "uploading")) {
      this.warn({ code: "attachments_uploading", message: "Wait for attachments to finish uploading." });
      return;
    }
    let attachments = _nullishCoalesce(options.attachments, () => ( composer.attachments.filter((a) => a.status === "ready" && a.attachment).map((a) => a.attachment)));
    if (!trimmed && attachments.length === 0) return;
    const maxChars = _optionalChain([this, 'access', _70 => _70.chatConfig, 'access', _71 => _71.getState, 'call', _72 => _72(), 'access', _73 => _73.config, 'optionalAccess', _74 => _74.limits, 'access', _75 => _75.max_message_chars]);
    if (maxChars && trimmed.length > maxChars) {
      this.warn({
        code: "message_too_long",
        message: `Messages can be up to ${maxChars.toLocaleString()} characters.`,
        data: { length: trimmed.length, max: maxChars }
      });
      return;
    }
    if (attachments.length && !this.capabilities().attachments) {
      this.warnOnce("attachments", {
        code: "feature_disabled",
        message: "This chat does not take attachments; sending without them."
      });
      attachments = [];
      if (!trimmed) return;
    }
    const state = t.store.getState();
    if (isBusy(state)) {
      this.warn({ code: "busy", message: "A reply is still streaming." });
      return;
    }
    if (state.pendingCheckpoint && this.config.composerWhilePaused === "disabled") {
      this.warn({ code: "awaiting_decision", message: "Respond to the card above first." });
      return;
    }
    const now = this.now();
    const clientMessageId = uid("cm_");
    const userMessage = {
      id: uid("local_"),
      role: "user",
      blocks: [
        {
          id: uid("blk_"),
          type: "text",
          category: "content",
          status: "complete",
          data: { id: uid("blk_"), type: "text", category: "content", text: trimmed }
        }
      ],
      status: "complete",
      createdAt: new Date(now).toISOString(),
      attachments: attachments.length ? attachments : void 0,
      local: true,
      clientMessageId
    };
    t.store.setState((s) => ({
      ...s,
      messages: [...s.messages, userMessage],
      run: { status: "submitting" },
      pendingCheckpoint: void 0
    }));
    t.composer.setState({ text: "", attachments: [] });
    let conversationId = t.store.getState().conversationId;
    if (!conversationId) {
      try {
        if (this.creating) {
          await this.creating.catch(() => void 0);
          conversationId = t.store.getState().conversationId;
        }
        if (!conversationId) {
          const boot = await this.adapter.createConversation();
          this.adoptNewThread(t, boot);
          conversationId = boot.conversation_id;
        }
      } catch (error) {
        const info = toErrorInfo(error);
        t.store.setState((s) => ({ ...s, run: { status: "error", error: info } }));
        t.lastRequest = void 0;
        this.reportError(info, error);
        return;
      }
    }
    t.fresh = false;
    this.touchConversation(conversationId);
    const model = _nullishCoalesce(options.model, () => ( (this.capabilities().perTurnModel ? this.modelFor(t) : void 0)));
    const body = {
      stream: true,
      client_message_id: clientMessageId,
      message: { role: "user", type: "default", content: { default: trimmed } },
      ...this.requestExtras(options),
      ...attachments.length ? { attachments } : {},
      ...model ? { model } : {},
      ...options.ext ? { ext: options.ext } : {}
    };
    t.lastRequest = { kind: "send", body, clientMessageId, confirmed: false };
    t.reconnectTried = false;
    t.onFirstEvent = () => this.confirmUserMessage(t, clientMessageId);
    await this.stream(t, conversationId, body);
  }
  /** The model to send with a turn: the conversation's, else the one the user last picked. */
  modelFor(t) {
    const pref = this.preferences.getState().model;
    return _nullishCoalesce(t.store.getState().meta.model, () => ( (typeof pref === "string" && pref ? pref : void 0)));
  }
  /** Marks the optimistic user message as saved on the server. */
  confirmUserMessage(t, clientMessageId) {
    t.store.setState((s) => {
      if (!s.messages.some((m) => m.clientMessageId === clientMessageId && m.local)) return s;
      return { ...s, messages: s.messages.map((m) => m.clientMessageId === clientMessageId ? { ...m, local: false } : m) };
    });
  }
  resume(checkpointId, decision, options = {}) {
    return this.doResume(checkpointId, decision, options, false);
  }
  /** `fromRetry`: a Retry of a failed decision, which must not re-arm the one automatic reconnect. */
  async doResume(checkpointId, decision, options, fromRetry) {
    const t = this.findCheckpointThread(checkpointId, options.conversationId);
    if (!t) {
      this.warn({ code: "unknown_checkpoint", message: `No card is waiting on checkpoint ${checkpointId}.` });
      return;
    }
    const state = t.store.getState();
    const conversationId = state.conversationId;
    const block = state.messages.flatMap((m) => m.blocks).find((b) => _optionalChain([b, 'access', _76 => _76.checkpoint, 'optionalAccess', _77 => _77.id]) === checkpointId);
    const cp = _optionalChain([block, 'optionalAccess', _78 => _78.checkpoint]);
    if (!conversationId || !block || !cp) return;
    if (cp.status === "submitting" || cp.status === "resolved") return;
    if (isBusy(state)) {
      this.warn({ code: "busy", message: "A reply is still streaming." });
      return;
    }
    const setCheckpoint = (patch) => t.store.setState((s) => ({
      ...s,
      messages: s.messages.map((m) => ({
        ...m,
        blocks: m.blocks.map(
          (b) => _optionalChain([b, 'access', _79 => _79.checkpoint, 'optionalAccess', _80 => _80.id]) === checkpointId ? { ...b, checkpoint: { ...b.checkpoint, ...patch } } : b
        )
      }))
    }));
    const pending = state.pendingCheckpoint;
    setCheckpoint({ status: "submitting", decision, error: void 0 });
    t.store.setState((s) => ({ ...s, pendingCheckpoint: void 0, run: { status: "submitting" } }));
    const body = {
      stream: true,
      message: { role: "user", type: "hitl", content: { checkpoint_id: checkpointId, decision } }
    };
    t.lastRequest = { kind: "resume", body, checkpointId };
    if (!fromRetry) t.reconnectTried = false;
    t.onFirstEvent = () => setCheckpoint({ status: "resolved" });
    await this.stream(t, conversationId, body);
    const after = _optionalChain([t, 'access', _81 => _81.store, 'access', _82 => _82.getState, 'call', _83 => _83(), 'access', _84 => _84.messages, 'access', _85 => _85.flatMap, 'call', _86 => _86((m) => m.blocks), 'access', _87 => _87.find, 'call', _88 => _88((b) => _optionalChain([b, 'access', _89 => _89.checkpoint, 'optionalAccess', _90 => _90.id]) === checkpointId), 'optionalAccess', _91 => _91.checkpoint]);
    if (_optionalChain([after, 'optionalAccess', _92 => _92.status]) === "submitting") {
      const error = t.store.getState().run.error;
      setCheckpoint({ status: "failed", error });
      t.store.setState((s) => ({
        ...s,
        pendingCheckpoint: pending,
        run: { status: "paused", messageId: _optionalChain([pending, 'optionalAccess', _93 => _93.messageId]), error }
      }));
    }
  }
  findCheckpointThread(checkpointId, conversationId) {
    const candidates = conversationId ? [this.thread(conversationId)] : [this.active(), ...this.threads.values()];
    return candidates.find(
      (t) => t.store.getState().messages.some((m) => m.blocks.some((b) => _optionalChain([b, 'access', _94 => _94.checkpoint, 'optionalAccess', _95 => _95.id]) === checkpointId))
    );
  }
  async cancel(conversationId) {
    const t = this.target(conversationId);
    const s = t.store.getState();
    if (!isBusy(s) || !t.abort || t.cancelRequested) return;
    t.cancelRequested = true;
    t.store.setState((st) => ({ ...st, run: { ...st.run, status: "cancelling" } }));
    if (this.capabilities().cancel === "disconnect") {
      t.abort.abort();
      return;
    }
    if (s.run.messageId) {
      await this.fireCancel(t);
    } else {
      t.cancelTimer = setTimeout(() => _optionalChain([t, 'access', _96 => _96.abort, 'optionalAccess', _97 => _97.abort, 'call', _98 => _98()]), 3e3);
    }
  }
  async fireCancel(t) {
    clearTimeout(t.cancelTimer);
    const { conversationId, run } = t.store.getState();
    const controller = t.abort;
    let stopped = false;
    if (conversationId && run.messageId) {
      try {
        stopped = await _asyncOptionalChain([(await this.adapter.cancelMessage(conversationId, run.messageId)), 'optionalAccess', async _99 => _99.status]) === true;
      } catch (error) {
        this.warn({ code: "cancel_failed", message: "The server did not confirm the cancel; stopping locally.", data: error });
      }
    }
    if (!controller || controller.signal.aborted) return;
    if (stopped) t.cancelTimer = setTimeout(() => controller.abort(), 1500);
    else controller.abort();
  }
  canRetry(conversationId) {
    const t = this.target(conversationId);
    const s = t.store.getState();
    return Boolean(t.lastRequest) && !isBusy(s) && (s.run.status === "error" || s.messages.some((m) => m.status === "interrupted" || m.status === "error"));
  }
  async retry(conversationId) {
    const t = this.target(conversationId);
    const req = t.lastRequest;
    const state = t.store.getState();
    const id = state.conversationId;
    if (!req || !id || isBusy(state)) return;
    if (req.kind === "resume") {
      const cp = _optionalChain([state, 'access', _100 => _100.messages, 'access', _101 => _101.flatMap, 'call', _102 => _102((m) => m.blocks), 'access', _103 => _103.find, 'call', _104 => _104((b) => _optionalChain([b, 'access', _105 => _105.checkpoint, 'optionalAccess', _106 => _106.id]) === req.checkpointId), 'optionalAccess', _107 => _107.checkpoint]);
      if (cp && cp.status === "failed") {
        await this.doResume(
          req.checkpointId,
          req.body.message.content.decision,
          { conversationId: id },
          true
        );
        return;
      }
    }
    t.store.setState((s) => {
      const idx = req.kind === "send" ? s.messages.findIndex((m) => m.clientMessageId === req.clientMessageId) : -1;
      const messages = s.messages.filter(
        (m, i) => !(m.role === "assistant" && (m.status === "error" || m.status === "interrupted") && i > idx)
      );
      return { ...s, messages, run: { status: "submitting" } };
    });
    let body = req.body;
    if (req.kind === "send") {
      if (req.confirmed) {
        const clientMessageId = uid("cm_");
        body = { ...req.body, client_message_id: clientMessageId };
        t.lastRequest = { ...req, body, clientMessageId, confirmed: false };
        t.store.setState((s) => ({
          ...s,
          messages: s.messages.map((m) => m.clientMessageId === req.clientMessageId ? { ...m, clientMessageId } : m)
        }));
      }
      const current = t.lastRequest;
      t.onFirstEvent = () => this.confirmUserMessage(t, current.clientMessageId);
    }
    await this.stream(t, id, body);
  }
  async reconnect(conversationId) {
    const t = this.target(conversationId);
    const s = t.store.getState();
    const last = s.messages[s.messages.length - 1];
    const error = _nullishCoalesce(s.run.error, () => ( (_optionalChain([last, 'optionalAccess', _108 => _108.role]) === "assistant" ? last.error : void 0)));
    const hook = this.options.onConnectionRequired;
    if (!hook || !error || error.action !== "reconnect" || isBusy(s)) return false;
    let ok;
    try {
      ok = await hook({
        sourceId: _nullishCoalesce(error.sourceId, () => ( null)),
        code: error.type,
        message: error.message,
        conversationId: s.conversationId
      });
    } catch (e) {
      this.reportError(toErrorInfo(e), e);
      return false;
    }
    if (!ok || this.disposed || !this.canRetry(s.conversationId)) return false;
    await this.retry(s.conversationId);
    return true;
  }
  requestExtras(options) {
    const cfg = this.options.scope;
    const sc = this.scope.getState();
    const scoped = cfg && sc.status === "ready" ? (_nullishCoalesce(cfg.toRequest, () => ( defaultScopeToRequest)))(sc.selection, sc.groups) : {};
    const host = typeof this.options.workflowContext === "function" ? this.options.workflowContext() : this.options.workflowContext;
    const caps = this.capabilities();
    let workflow_context = mergeWorkflowContexts(scoped.workflow_context, host, options.workflowContext);
    if (workflow_context && !caps.workflowContext) {
      this.warnOnce("workflow_context", {
        code: "feature_disabled",
        message: "This chat does not take workflow context; sending without it."
      });
      workflow_context = void 0;
    }
    let sources = _nullishCoalesce(options.sources, () => ( scoped.sources));
    if (sources && !caps.perTurnSources) {
      this.warnOnce("per_turn_sources", {
        code: "feature_disabled",
        message: "This chat sets sources per conversation only; use setDefaultSources."
      });
      sources = void 0;
    }
    if (sources) sources = this.filterSources(sources);
    return { ...workflow_context ? { workflow_context } : {}, ..._optionalChain([sources, 'optionalAccess', _109 => _109.length]) ? { sources } : {} };
  }
  apply(t, event) {
    if (event.type === "checkpoint" && !this.capabilities().hitl) {
      this.warnOnce("hitl", { code: "feature_disabled", message: "Ignored a checkpoint: this chat has approvals turned off." });
      return;
    }
    t.store.setState(
      (s) => {
        let next = reduceStreamEvent(s, event, { now: this.now(), resolveDeltaHandler: this.deltaResolver });
        if (t.cancelRequested && next.run.status === "streaming") next = { ...next, run: { ...next.run, status: "cancelling" } };
        return next;
      },
      { batch: !IMMEDIATE.has(event.type) }
    );
  }
  async stream(t, conversationId, body) {
    const controller = new AbortController();
    t.abort = controller;
    t.abortReason = void 0;
    t.cancelRequested = false;
    this.setRunning(conversationId, true);
    let sawStop = false;
    let sawAny = false;
    let duplicate = false;
    let idle;
    const armIdle = () => {
      clearTimeout(idle);
      idle = setTimeout(() => {
        t.abortReason = "timeout";
        controller.abort();
      }, this.idleMs);
    };
    armIdle();
    try {
      const events = this.adapter.sendMessage(conversationId, body, {
        signal: controller.signal,
        onWarning: (w) => this.warn(w)
      });
      for await (const event of events) {
        if (controller.signal.aborted && t.abortReason) break;
        armIdle();
        this.emitter.emit("event", event, { conversationId });
        _optionalChain([this, 'access', _110 => _110.options, 'access', _111 => _111.onEvent, 'optionalCall', _112 => _112(event, { conversationId })]);
        this.apply(t, event);
        if (!sawAny) {
          sawAny = true;
          _optionalChain([t, 'access', _113 => _113.onFirstEvent, 'optionalCall', _114 => _114()]);
          t.onFirstEvent = void 0;
        }
        if (event.type === "message_start" && _optionalChain([t, 'access', _115 => _115.lastRequest, 'optionalAccess', _116 => _116.kind]) === "send") t.lastRequest.confirmed = true;
        if (event.type === "message_start" && t.cancelRequested) void this.fireCancel(t);
        if (event.type === "message_stop") {
          sawStop = true;
          if (event.title) this.patchLocal(conversationId, { title: event.title });
        }
        if (event.type === "error") {
          this.reportError(_nullishCoalesce(t.store.getState().run.error, () => ( toErrorInfo(new Error(event.message)))), event);
        }
      }
      if (!sawStop && t.abortReason !== "dispose" && t.abortReason !== "deleted") {
        this.finishInterrupted(t, t.cancelRequested ? void 0 : this.endedEarly(t));
      }
    } catch (error) {
      if (t.abortReason === "dispose" || t.abortReason === "deleted") {
      } else if (t.cancelRequested && (_chunkZNIBBZSNcjs.isAbortError.call(void 0, error) || controller.signal.aborted)) {
        this.finishInterrupted(t, void 0);
      } else if (!sawAny && error instanceof _chunkZNIBBZSNcjs.ChatApiError && error.errorType === "duplicate_message") {
        duplicate = true;
        if (_optionalChain([t, 'access', _117 => _117.lastRequest, 'optionalAccess', _118 => _118.kind]) === "send") {
          t.lastRequest.confirmed = true;
          this.confirmUserMessage(t, t.lastRequest.clientMessageId);
        }
        t.store.setState((s) => ({ ...s, run: { status: "idle" } }));
        this.warn({ code: "duplicate_message", message: "That message was already sent; reloading the conversation." });
      } else {
        const info = t.abortReason === "timeout" ? { type: "timeout", message: "The reply stopped arriving. Try again.", retryable: true } : toErrorInfo(error);
        if (!sawAny) {
          t.store.setState((s) => ({ ...s, run: { status: "error", error: info } }));
        } else {
          this.finishInterrupted(t, info);
        }
        this.reportError(info, error);
      }
    } finally {
      clearTimeout(idle);
      clearTimeout(t.cancelTimer);
      t.abort = void 0;
      t.cancelRequested = false;
      t.onFirstEvent = void 0;
      t.store.flush();
      this.setRunning(conversationId, false);
      if (!this.disposed && t.abortReason !== "deleted") {
        this.touchConversation(conversationId);
        this.persistThread(t);
      }
    }
    if (this.disposed) return;
    if (duplicate) {
      await this.loadThread(t, true);
      return;
    }
    await this.reconnectOnce(t);
  }
  /** F15: after a connection error, asks the host to reconnect and retries the turn once. */
  async reconnectOnce(t) {
    const s = t.store.getState();
    if (t.reconnectTried || !this.options.onConnectionRequired || _optionalChain([s, 'access', _119 => _119.run, 'access', _120 => _120.error, 'optionalAccess', _121 => _121.action]) !== "reconnect") return;
    t.reconnectTried = true;
    await this.reconnect(s.conversationId);
  }
  endedEarly(t) {
    const s = t.store.getState();
    if (s.run.status === "error" && s.run.error) return s.run.error;
    return { type: "stream_ended", message: "The reply ended unexpectedly. Try again.", retryable: true };
  }
  finishInterrupted(t, error) {
    t.store.setState((s) => interruptRun(s, error, { now: this.now() }));
  }
  // ------------------------------------------------------------------------------------------
  // Composer
  // ------------------------------------------------------------------------------------------
  setDraft(text, conversationId) {
    const t = this.target(conversationId);
    t.composer.setState((s) => s.text === text ? s : { ...s, text });
  }
  addAttachments(files, conversationId) {
    const cfg = this.options.attachments;
    const t = this.target(conversationId);
    const list = [...files];
    const result = { added: [], rejected: [] };
    if (!cfg) {
      result.rejected = list.map((file) => ({ file, reason: "Attachments are not enabled." }));
      return result;
    }
    if (!this.capabilities().attachments) {
      result.rejected = list.map((file) => ({ file, reason: "This chat does not take attachments." }));
      return result;
    }
    const limits = _optionalChain([this, 'access', _122 => _122.chatConfig, 'access', _123 => _123.getState, 'call', _124 => _124(), 'access', _125 => _125.config, 'optionalAccess', _126 => _126.limits]);
    const maxFiles = Math.min(_nullishCoalesce(cfg.maxFiles, () => ( 10)), _optionalChain([limits, 'optionalAccess', _127 => _127.max_attachments]) || Infinity);
    const maxSize = Math.min(cfg.maxSize || Infinity, _optionalChain([limits, 'optionalAccess', _128 => _128.max_attachment_bytes]) || Infinity);
    const serverTypes = _optionalChain([limits, 'optionalAccess', _129 => _129.attachment_types, 'optionalAccess', _130 => _130.length]) ? limits.attachment_types.join(",") : void 0;
    let room = maxFiles - t.composer.getState().attachments.length;
    for (const file of list) {
      if (room <= 0) {
        result.rejected.push({ file, reason: `You can attach up to ${maxFiles} files.` });
        continue;
      }
      if (Number.isFinite(maxSize) && file.size > maxSize) {
        result.rejected.push({ file, reason: `${file.name} is larger than ${formatBytes(maxSize)}.` });
        continue;
      }
      if (cfg.accept && !matchesAccept(file, cfg.accept) || serverTypes && !matchesAccept(file, serverTypes)) {
        result.rejected.push({ file, reason: `${file.name} isn't a supported file type.` });
        continue;
      }
      room--;
      const id = uid("att_");
      const controller = new AbortController();
      t.uploads.set(id, controller);
      const entry = {
        id,
        name: file.name,
        size: file.size,
        contentType: file.type || "application/octet-stream",
        status: "uploading",
        progress: 0
      };
      result.added.push(entry);
      t.composer.setState((s) => ({ ...s, attachments: [...s.attachments, entry] }));
      const update = (patch, batch = false) => t.composer.setState((s) => ({ ...s, attachments: s.attachments.map((a) => a.id === id ? { ...a, ...patch } : a) }), {
        batch
      });
      Promise.resolve().then(
        () => cfg.upload(file, {
          signal: controller.signal,
          onProgress: (p) => update({ progress: Math.max(0, Math.min(1, Number(p) || 0)) }, true)
        })
      ).then((attachment) => {
        if (!controller.signal.aborted) update({ status: "ready", progress: 1, attachment });
      }).catch((error) => {
        if (!controller.signal.aborted) update({ status: "error", error: toErrorInfo(error).message });
      }).finally(() => t.uploads.delete(id));
    }
    if (result.rejected.length) {
      this.warn({ code: "attachment_rejected", message: result.rejected.map((r) => r.reason).join(" "), data: result.rejected });
    }
    return result;
  }
  removeAttachment(attachmentId, conversationId) {
    const t = this.target(conversationId);
    _optionalChain([t, 'access', _131 => _131.uploads, 'access', _132 => _132.get, 'call', _133 => _133(attachmentId), 'optionalAccess', _134 => _134.abort, 'call', _135 => _135()]);
    t.uploads.delete(attachmentId);
    t.composer.setState((s) => ({ ...s, attachments: s.attachments.filter((a) => a.id !== attachmentId) }));
  }
  // ------------------------------------------------------------------------------------------
  // Scope & preferences
  // ------------------------------------------------------------------------------------------
  initScope() {
    const cfg = this.options.scope;
    if (!cfg) return;
    const apply = (groups) => {
      const safe = Array.isArray(groups) ? groups : [];
      const persisted = sanitizeSelection(this.persistedScope, safe);
      this.scope.setState({ groups: safe, selection: _nullishCoalesce(persisted, () => ( initialSelection(cfg, safe))), status: "ready", origin: "host" });
    };
    const fail = (error) => {
      this.scope.setState((s) => ({ ...s, status: "error" }));
      this.reportError(toErrorInfo(error), error);
    };
    try {
      const groups = typeof cfg.groups === "function" ? cfg.groups() : cfg.groups;
      if (isPromise(groups)) groups.then(apply, fail);
      else apply(groups);
    } catch (error) {
      fail(error);
    }
  }
  setScopeGroups(groups) {
    const sc = this.scope.getState();
    const kept = sanitizeSelection(sc.selection, groups);
    let selection = kept && Object.keys(kept).length ? kept : initialSelection(this.options.scope, groups);
    if (!Object.keys(selection).length && _optionalChain([this, 'access', _136 => _136.options, 'access', _137 => _137.scope, 'optionalAccess', _138 => _138.defaultSelection]) !== "none") selection = selectAll(groups);
    this.scope.setState({ groups, selection, status: "ready", origin: "host" });
  }
  setScopeSelection(selection) {
    const sc = this.scope.getState();
    this.scope.setState({ ...sc, selection: _nullishCoalesce(sanitizeSelection(selection, sc.groups), () => ( {})) });
    this.writePrefs();
  }
  setPreference(key, value) {
    const prefs = this.preferences.getState();
    if (Object.is(prefs[key], value)) return;
    this.preferences.setState({ ...prefs, [key]: value });
    this.writePrefs();
  }
  // ------------------------------------------------------------------------------------------
  // Persistence
  // ------------------------------------------------------------------------------------------
  hydrate() {
    const p = this.persister;
    const cfg = p.config.persist;
    const tasks = [];
    const load = (name, apply) => {
      try {
        const v = p.read(name);
        if (isPromise(v)) tasks.push(v.then(apply, () => void 0));
        else apply(v);
      } catch (e4) {
      }
    };
    if (p.enabled) {
      if (cfg.preferences) {
        load("prefs", (v) => {
          if (_optionalChain([v, 'optionalAccess', _139 => _139.values]) && typeof v.values === "object")
            this.preferences.setState({ ...v.values, ...this.preferences.getState() });
          if (_optionalChain([v, 'optionalAccess', _140 => _140.scope])) {
            this.persistedScope = v.scope;
            const sc = this.scope.getState();
            if (sc.status === "ready" && sc.groups.length) {
              const kept = sanitizeSelection(v.scope, sc.groups);
              if (kept) this.scope.setState({ ...sc, selection: kept });
            }
          }
        });
      }
      if (cfg.drafts) {
        load("drafts", (v) => {
          if (!v || typeof v !== "object") return;
          this.drafts = { ...v, ...this.drafts };
          for (const t of this.threads.values()) {
            const d = this.drafts[t.key];
            if (_optionalChain([d, 'optionalAccess', _141 => _141.text]) && !t.composer.getState().text) t.composer.setState((s) => ({ ...s, text: _nullishCoalesce(d.text, () => ( "")) }));
          }
        });
      }
      if (cfg.history) {
        load("thread-index", (v) => {
          if (Array.isArray(v)) this.threadIndex = v.filter((e) => e && typeof e.id === "string");
        });
        load("conversations", (v) => {
          if (!Array.isArray(v) || this.conversations.getState().status === "ready") return;
          const items = v.filter((i) => i && typeof i.id === "string");
          this.conversations.setState((s) => ({ ...s, items: sortConversations(items), status: "ready" }));
        });
      }
      if (cfg.activeConversation) {
        load("active", (v) => {
          if (typeof v === "string" && v && this.session.getState().activeId === null) {
            this.thread(v);
            this.session.setState((s) => ({ ...s, activeKey: v, activeId: v }));
          }
        });
      }
    }
    const done = () => this.session.setState((s) => ({ ...s, hydrated: true }));
    if (!tasks.length) {
      done();
      return Promise.resolve();
    }
    return Promise.all(tasks).then(done, done);
  }
  hydrateThreadFromCache(t, id) {
    const apply = (cached) => {
      if (!cached || !Array.isArray(cached.messages)) return;
      const s = t.store.getState();
      if (s.loadStatus === "ready" || isBusy(s) || s.messages.length) return;
      t.store.setState({
        ...s,
        loadStatus: "ready",
        meta: {
          ...s.meta,
          ...cached.meta,
          sources: _chunkR7CUDWRTcjs.stripCredentials.call(void 0, Array.isArray(_optionalChain([cached, 'access', _142 => _142.meta, 'optionalAccess', _143 => _143.sources])) ? cached.meta.sources : s.meta.sources)
        },
        messages: cached.messages,
        pendingCheckpoint: cached.pendingCheckpoint,
        run: cached.pendingCheckpoint ? { status: "paused", messageId: cached.pendingCheckpoint.messageId } : { status: "idle" }
      });
    };
    try {
      const v = this.persister.read(`thread:${id}`);
      if (isPromise(v)) v.then(apply, () => void 0);
      else apply(v);
    } catch (e5) {
    }
  }
  persistThread(t) {
    if (!this.persister.enabled || !this.persister.config.persist.history) return;
    const s = t.store.getState();
    const id = s.conversationId;
    if (!id) return;
    const data = {
      meta: { ...s.meta, sources: _chunkR7CUDWRTcjs.stripCredentials.call(void 0, s.meta.sources) },
      messages: completedOnly(s.messages),
      pendingCheckpoint: s.pendingCheckpoint
    };
    this.persister.write(`thread:${id}`, data);
    const index = this.threadIndex.filter((e) => e.id !== id);
    index.push({ id, savedAt: this.now() });
    const max = this.persister.config.maxCachedConversations;
    while (index.length > max) {
      const old = index.shift();
      if (old) this.persister.remove(`thread:${old.id}`);
    }
    this.threadIndex = index;
    this.persister.write("thread-index", index);
  }
  dropThreadCache(id) {
    if (!this.persister.config.persist.history) return;
    this.persister.remove(`thread:${id}`);
    this.threadIndex = this.threadIndex.filter((e) => e.id !== id);
    this.persister.write("thread-index", this.threadIndex);
  }
  persistConversations() {
    if (!this.persister.config.persist.history) return;
    this.persister.write("conversations", this.conversations.getState().items);
  }
  persistDraft(t) {
    if (!this.persister.config.persist.drafts) return;
    const c = t.composer.getState();
    const attachments = c.attachments.filter((a) => a.status === "ready" && a.attachment).map((a) => a.attachment);
    const prev = this.drafts[t.key];
    if (!c.text && !attachments.length) {
      if (!prev) return;
      delete this.drafts[t.key];
    } else {
      if (prev && prev.text === c.text && (_nullishCoalesce(_optionalChain([prev, 'access', _144 => _144.attachments, 'optionalAccess', _145 => _145.length]), () => ( 0))) === attachments.length) return;
      this.drafts[t.key] = { text: c.text, attachments };
    }
    this.writeDrafts();
  }
  writeDrafts() {
    if (!this.persister.config.persist.drafts) return;
    this.persister.write("drafts", { ...this.drafts });
  }
  writePrefs() {
    if (!this.persister.config.persist.preferences) return;
    const data = { values: this.preferences.getState(), scope: this.scope.getState().selection };
    this.persister.write("prefs", data);
  }
  onExternalChange(name) {
    if (name === "conversations" && this.persister.config.persist.history) {
      const v = this.persister.read("conversations");
      const apply = (items) => {
        if (Array.isArray(items)) this.conversations.setState((s) => ({ ...s, items: sortConversations(items) }));
      };
      if (isPromise(v)) v.then(apply, () => void 0);
      else apply(v);
    }
  }
  listenForFocus() {
    if (this.options.refreshOnFocus === false || typeof window === "undefined") return;
    const onFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      const now = this.now();
      if (now - this.lastFocusRefresh < 3e4) return;
      this.lastFocusRefresh = now;
      void this.refreshConversations().catch(() => void 0);
    };
    window.addEventListener("focus", onFocus);
    _optionalChain([document, 'access', _146 => _146.addEventListener, 'optionalCall', _147 => _147("visibilitychange", onFocus)]);
    this.lastFocusRefresh = this.now();
    this.cleanups.push(() => {
      window.removeEventListener("focus", onFocus);
      _optionalChain([document, 'access', _148 => _148.removeEventListener, 'optionalCall', _149 => _149("visibilitychange", onFocus)]);
    });
  }
  // ------------------------------------------------------------------------------------------
  // Reporting
  // ------------------------------------------------------------------------------------------
  reportError(info, raw) {
    this.emitter.emit("error", info, raw);
    _optionalChain([this, 'access', _150 => _150.options, 'access', _151 => _151.onError, 'optionalCall', _152 => _152(info, raw)]);
  }
  warn(warning) {
    this.emitter.emit("warning", warning);
    _optionalChain([this, 'access', _153 => _153.options, 'access', _154 => _154.onWarning, 'optionalCall', _155 => _155(warning)]);
  }
}, _class3);
function createChatRuntime(options) {
  if (!_optionalChain([options, 'optionalAccess', _156 => _156.adapter])) throw new Error("[agentic-chat] createChatRuntime needs an `adapter`.");
  return new Runtime(options);
}



































exports.createMemoryStorage = createMemoryStorage; exports.createWebStorage = createWebStorage; exports.createSafeStorage = createSafeStorage; exports.createPersister = createPersister; exports.frameScheduler = frameScheduler; exports.syncScheduler = syncScheduler; exports.createStore = createStore; exports.emptyMeta = emptyMeta; exports.createThreadState = createThreadState; exports.errorInfoFromCode = errorInfoFromCode; exports.toErrorInfo = toErrorInfo; exports.textFieldOf = textFieldOf; exports.defaultApplyDelta = defaultApplyDelta; exports.TOOL_CALL_TYPES = TOOL_CALL_TYPES; exports.linkToolResults = linkToolResults; exports.reduceStreamEvent = reduceStreamEvent; exports.interruptRun = interruptRun; exports.selectedModelOf = selectedModelOf; exports.toConversationItem = toConversationItem; exports.metaFromBootstrap = metaFromBootstrap; exports.normalizeMessages = normalizeMessages; exports.normalizeConversationDetail = normalizeConversationDetail; exports.sortConversations = sortConversations; exports.groupKeyFor = groupKeyFor; exports.groupConversations = groupConversations; exports.filterConversations = filterConversations; exports.selectAll = selectAll; exports.defaultScopeToRequest = defaultScopeToRequest; exports.summarizeScope = summarizeScope; exports.mergeWorkflowContexts = mergeWorkflowContexts; exports.NEW_THREAD_KEY = NEW_THREAD_KEY; exports.formatBytes = formatBytes; exports.createChatRuntime = createChatRuntime;
//# sourceMappingURL=chunk-2SSFULSQ.cjs.map