import {
  ChatApiError,
  ChatError,
  ChatProtocolError,
  ChatStreamError,
  isAbortError,
  messageFromBody
} from "./chunk-MQH7BY4V.js";

// src/core/protocol/types.ts
var PROTOCOL_VERSION = "v1";

// src/core/protocol/events.ts
var STOP_REASONS = /* @__PURE__ */ new Set(["end_turn", "paused", "error", "cancelled"]);
var isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var isString = (v) => typeof v === "string";
var isIndex = (v) => typeof v === "number" && Number.isInteger(v) && v >= 0;
function isContentBlock(v) {
  return isObject(v) && isString(v.id) && isString(v.type);
}
function withCategory(block) {
  return { ...block, category: isString(block.category) ? block.category : "content" };
}
function parseStreamEvent(payload, eventName) {
  if (!isObject(payload)) {
    return { ok: false, reason: "invalid", type: eventName ?? "unknown", detail: "payload is not an object" };
  }
  const type = isString(payload.type) ? payload.type : eventName ?? "";
  const p = payload;
  const invalid = (detail) => ({ ok: false, reason: "invalid", type, detail });
  switch (type) {
    case "message_start":
      if (!isString(p.message_id)) return invalid("message_id is required");
      return {
        ok: true,
        event: {
          type,
          message_id: p.message_id,
          conversation_id: isString(p.conversation_id) ? p.conversation_id : "",
          run_id: isString(p.run_id) ? p.run_id : "",
          persona: p.persona ?? null
        }
      };
    case "status":
      return { ok: true, event: { type, label: isString(p.label) ? p.label : "" } };
    case "content_block_start":
    case "content_block_stop": {
      if (!isIndex(p.index)) return invalid("index must be a non-negative integer");
      if (!isContentBlock(p.block)) return invalid("block with id and type is required");
      return { ok: true, event: { type, index: p.index, block: withCategory(p.block) } };
    }
    case "content_block_delta": {
      if (!isIndex(p.index)) return invalid("index must be a non-negative integer");
      const delta = isObject(p.delta) ? p.delta : {};
      return {
        ok: true,
        event: {
          type,
          index: p.index,
          delta: { ...delta, type: isString(delta.type) ? delta.type : "text_delta" },
          snapshot: p.snapshot
        }
      };
    }
    case "checkpoint":
      if (!isString(p.checkpoint_id)) return invalid("checkpoint_id is required");
      if (!isIndex(p.block_index)) return invalid("block_index must be a non-negative integer");
      return {
        ok: true,
        event: { type, checkpoint_id: p.checkpoint_id, block_index: p.block_index, requires: p.requires }
      };
    case "message_delta":
      return { ok: true, event: { type, usage: isObject(p.usage) ? p.usage : void 0 } };
    case "message_stop": {
      const reason = isString(p.stop_reason) && STOP_REASONS.has(p.stop_reason) ? p.stop_reason : "end_turn";
      return {
        ok: true,
        event: {
          type,
          message_id: isString(p.message_id) ? p.message_id : "",
          model: isString(p.model) ? p.model : null,
          title: isString(p.title) && p.title.trim() ? p.title : null,
          stop_reason: reason
        }
      };
    }
    case "error":
      return {
        ok: true,
        event: {
          type,
          error_type: isString(p.error_type) ? p.error_type : "unknown_error",
          message: isString(p.message) ? p.message : "Something went wrong.",
          retry_after: typeof p.retry_after === "number" ? p.retry_after : null
        }
      };
    default:
      return { ok: false, reason: "unknown_type", type };
  }
}

// src/core/transport/sse.ts
var SseParser = class {
  buffer = "";
  pendingCR = false;
  eventName = "";
  data = [];
  hasData = false;
  lastId;
  retry;
  started = false;
  feed(chunk) {
    if (!chunk) return [];
    let text = chunk;
    if (!this.started) {
      this.started = true;
      if (text.charCodeAt(0) === 65279) text = text.slice(1);
    }
    if (this.pendingCR) {
      this.pendingCR = false;
      if (text.startsWith("\n")) text = text.slice(1);
    }
    this.buffer += text;
    const out = [];
    let start = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      const ch = this.buffer[i];
      if (ch !== "\n" && ch !== "\r") continue;
      const line = this.buffer.slice(start, i);
      if (ch === "\r") {
        if (i + 1 < this.buffer.length) {
          if (this.buffer[i + 1] === "\n") i++;
        } else {
          this.pendingCR = true;
        }
      }
      start = i + 1;
      const msg = this.processLine(line);
      if (msg) out.push(msg);
    }
    this.buffer = this.buffer.slice(start);
    return out;
  }
  /**
   * Call at end of stream. The spec discards an event that has no trailing blank line, but
   * plenty of servers skip it on the last event, so a pending event with data is dispatched.
   */
  flush() {
    const out = [];
    if (this.buffer) {
      const msg = this.processLine(this.buffer);
      this.buffer = "";
      if (msg) out.push(msg);
    }
    const last = this.dispatch();
    if (last) out.push(last);
    return out;
  }
  processLine(line) {
    if (line === "") return this.dispatch();
    if (line.startsWith(":")) return null;
    const colon = line.indexOf(":");
    let field = line;
    let value = "";
    if (colon !== -1) {
      field = line.slice(0, colon);
      value = line.slice(colon + 1);
      if (value.startsWith(" ")) value = value.slice(1);
    }
    switch (field) {
      case "event":
        this.eventName = value;
        break;
      case "data":
        this.data.push(value);
        this.hasData = true;
        break;
      case "id":
        if (!value.includes("\0")) this.lastId = value;
        break;
      case "retry":
        if (/^\d+$/.test(value)) this.retry = Number(value);
        break;
      default:
        break;
    }
    return null;
  }
  dispatch() {
    if (!this.hasData) {
      this.eventName = "";
      return null;
    }
    const msg = { event: this.eventName || "message", data: this.data.join("\n") };
    if (this.lastId !== void 0) msg.id = this.lastId;
    if (this.retry !== void 0) msg.retry = this.retry;
    this.eventName = "";
    this.data = [];
    this.hasData = false;
    return msg;
  }
};
async function* readSse(stream, signal) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const parser = new SseParser();
  const onAbort = () => {
    reader.cancel().catch(() => void 0);
  };
  signal?.addEventListener("abort", onAbort, { once: true });
  try {
    while (true) {
      if (signal?.aborted) throw signal.reason ?? new DOMException("Aborted", "AbortError");
      const { value, done } = await reader.read();
      if (done) break;
      for (const msg of parser.feed(decoder.decode(value, { stream: true }))) yield msg;
    }
    if (signal?.aborted) throw signal.reason ?? new DOMException("Aborted", "AbortError");
    const tail = decoder.decode();
    for (const msg of parser.feed(tail)) yield msg;
    for (const msg of parser.flush()) yield msg;
  } finally {
    signal?.removeEventListener("abort", onAbort);
    reader.releaseLock?.();
  }
}

// src/core/transport/rest-adapter.ts
var DEFAULT_REST_PATHS = {
  createConversation: "/v1/conversation",
  listConversations: "/v1/conversations",
  conversation: (id) => `/v1/conversations/${encodeURIComponent(id)}`,
  messages: (id) => `/v1/conversations/${encodeURIComponent(id)}/messages`,
  cancel: (id) => `/v1/conversations/${encodeURIComponent(id)}/messages/cancel`
};
function parseRetryAfter(value) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, (date - Date.now()) / 1e3);
}
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
    const t = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
function linkSignal(signal, timeoutMs) {
  if (!timeoutMs) return { signal, cleanup: () => void 0 };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException("The request timed out.", "TimeoutError")), timeoutMs);
  const onAbort = () => controller.abort(signal?.reason);
  if (signal?.aborted) controller.abort(signal.reason);
  else signal?.addEventListener("abort", onAbort, { once: true });
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
  };
}
async function readBody(res) {
  const text = await res.text().catch(() => "");
  if (!text) return void 0;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
async function readJson(res) {
  if (res.status === 204) return void 0;
  const text = await res.text();
  if (!text) return void 0;
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new ChatProtocolError("The server returned a response that is not valid JSON.", { cause });
  }
}
function* synthesizeEvents(json, conversationId) {
  const root = json && typeof json === "object" ? json : {};
  const msg = root.message && typeof root.message === "object" ? root.message : root;
  const messageId = typeof msg.message_id === "string" ? msg.message_id : `msg_${Date.now().toString(36)}`;
  const content = Array.isArray(msg.content) ? msg.content.filter(isContentBlock) : [];
  yield { type: "message_start", message_id: messageId, conversation_id: conversationId, run_id: "", persona: null };
  let index = 0;
  for (const raw of content) {
    const block = { ...raw, category: typeof raw.category === "string" ? raw.category : "content" };
    yield { type: "content_block_start", index, block };
    yield { type: "content_block_stop", index, block };
    index++;
  }
  const stop = typeof msg.stop_reason === "string" ? msg.stop_reason : "end_turn";
  yield {
    type: "message_stop",
    message_id: messageId,
    model: typeof msg.model === "string" ? msg.model : null,
    title: typeof root.title === "string" ? root.title : null,
    stop_reason: stop
  };
}
function createRestAdapter(options) {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const paths = { ...DEFAULT_REST_PATHS, ...options.paths };
  const retry = options.retry === false ? { retries: 0, baseDelayMs: 0, maxDelayMs: 0 } : { retries: 2, baseDelayMs: 300, maxDelayMs: 4e3, ...options.retry };
  const timeoutMs = options.timeoutMs ?? 3e4;
  const doFetch = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
  const backoff = (attempt) => {
    const exp = Math.min(retry.maxDelayMs, retry.baseDelayMs * 2 ** attempt);
    return exp / 2 + Math.random() * (exp / 2);
  };
  async function buildHeaders(extra) {
    const source = typeof options.headers === "function" ? await options.headers() : options.headers;
    const headers = new Headers(source);
    for (const [k, v] of Object.entries(extra)) if (!headers.has(k)) headers.set(k, v);
    return headers;
  }
  async function send(method, path, init) {
    let attempt = 0;
    let refreshed = false;
    for (; ; ) {
      const extra = { Accept: init.accept ?? "application/json" };
      if (init.body !== void 0) extra["Content-Type"] = "application/json";
      const headers = await buildHeaders(extra);
      const linked = linkSignal(init.signal, init.timeout === false ? void 0 : timeoutMs);
      let res;
      try {
        res = await doFetch(baseUrl + path, {
          method,
          headers,
          body: init.body === void 0 ? void 0 : JSON.stringify(init.body),
          signal: linked.signal,
          credentials: options.credentials
        });
      } catch (error) {
        linked.cleanup();
        if (init.signal?.aborted) throw error;
        const timedOut = isAbortError(error);
        if (init.idempotent && attempt < retry.retries) {
          await sleep(backoff(attempt), init.signal);
          attempt++;
          continue;
        }
        throw new ChatError(
          timedOut ? "timeout" : "network",
          timedOut ? "The chat service took too long to respond." : "Could not reach the chat service.",
          { cause: error }
        );
      }
      if (init.timeout !== false) linked.cleanup();
      if (res.status === 401 && options.onUnauthorized && !refreshed) {
        refreshed = true;
        await res.body?.cancel().catch(() => void 0);
        if (await options.onUnauthorized()) continue;
        throw new ChatApiError(401, "Your session has expired. Sign in again to keep chatting.", void 0);
      }
      if (!res.ok) {
        const retryAfter = parseRetryAfter(res.headers.get("retry-after"));
        if (init.idempotent && attempt < retry.retries && (res.status >= 500 || res.status === 429)) {
          await res.body?.cancel().catch(() => void 0);
          const wait = retryAfter !== null ? Math.min(retryAfter * 1e3, retry.maxDelayMs) : backoff(attempt);
          await sleep(wait, init.signal);
          attempt++;
          continue;
        }
        const body = await readBody(res);
        throw new ChatApiError(res.status, messageFromBody(body, `Request failed (${res.status}).`), body, retryAfter);
      }
      return res;
    }
  }
  return {
    async createConversation() {
      const res = await send("POST", paths.createConversation, { idempotent: false });
      return readJson(res);
    },
    async listConversations() {
      const res = await send("GET", paths.listConversations, { idempotent: true });
      const json = await readJson(res);
      if (Array.isArray(json)) return json;
      return Array.isArray(json?.conversations) ? json.conversations : [];
    },
    async getConversation(conversationId) {
      const res = await send("GET", paths.conversation(conversationId), { idempotent: true });
      return readJson(res);
    },
    async updateConversation(conversationId, patch) {
      const res = await send("PATCH", paths.conversation(conversationId), { body: patch, idempotent: true });
      return readJson(res);
    },
    async deleteConversation(conversationId) {
      try {
        await send("DELETE", paths.conversation(conversationId), { idempotent: true });
      } catch (error) {
        if (error instanceof ChatApiError && error.status === 404) return;
        throw error;
      }
    },
    async *sendMessage(conversationId, body, { signal, onWarning }) {
      const res = await send("POST", paths.messages(conversationId), {
        body: { ...body, stream: true },
        accept: "text/event-stream",
        signal,
        idempotent: false,
        timeout: false
      });
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("text/event-stream") && contentType.includes("json")) {
        onWarning?.({ code: "non_stream_response", message: "The server answered with JSON instead of a stream." });
        yield* synthesizeEvents(await readJson(res), conversationId);
        return;
      }
      if (!res.body) throw new ChatProtocolError("The response had no body to stream.");
      for await (const msg of readSse(res.body, signal)) {
        if (!msg.data || msg.data === "[DONE]") continue;
        let payload;
        try {
          payload = JSON.parse(msg.data);
        } catch {
          onWarning?.({ code: "malformed_event", message: `Could not parse a "${msg.event}" event.`, data: msg.data });
          continue;
        }
        const parsed = parseStreamEvent(payload, msg.event === "message" ? void 0 : msg.event);
        if (parsed.ok) yield parsed.event;
        else if (parsed.reason === "unknown_type")
          onWarning?.({ code: "unknown_event", message: `Ignored unknown event "${parsed.type}".`, data: payload });
        else
          onWarning?.({
            code: "invalid_event",
            message: `Ignored an invalid "${parsed.type}" event: ${parsed.detail}.`,
            data: payload
          });
      }
    },
    async cancelMessage(conversationId, messageId) {
      const res = await send("POST", paths.cancel(conversationId), {
        body: { message_id: messageId },
        idempotent: true
      });
      const json = await readJson(res);
      return { status: Boolean(json?.status) };
    }
  };
}

// src/core/persistence/storage.ts
function isPromise(v) {
  return typeof v?.then === "function";
}
function createMemoryStorage() {
  const map = /* @__PURE__ */ new Map();
  return {
    getItem: (k) => map.get(k) ?? null,
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
  } catch {
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
      const listInner = inner.keys?.bind(inner);
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
  const requested = options === false ? "none" : opts.storage ?? "session";
  const namespace = opts.namespace ?? "neoflo-chat";
  const prefix = `${namespace}:${opts.scope ?? "default"}:`;
  const debounceMs = opts.debounceMs ?? 400;
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
    inner = web ?? createMemoryStorage();
    if (web && requested === "local") crossTab = web.raw;
  }
  const config = { kind, persist, maxCachedConversations: opts.maxCachedConversations ?? 20 };
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
    } catch {
      void storage.removeItem(prefix + name);
      return void 0;
    }
    if (!env || typeof env !== "object" || typeof env.v !== "number" || !("data" in env)) {
      void storage.removeItem(prefix + name);
      return void 0;
    }
    if (opts.ttl && now() - (env.savedAt ?? 0) > opts.ttl) {
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
    if (e.storageArea !== crossTab || !e.key?.startsWith(prefix)) return;
    const name = e.key.slice(prefix.length);
    for (const l of [...listeners]) l(name);
  };
  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener?.("visibilitychange", onVisibility);
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
        document.removeEventListener?.("visibilitychange", onVisibility);
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
      if (options?.batch) {
        if (!cancelScheduled) cancelScheduled = scheduler(notify);
        return;
      }
      cancelScheduled?.();
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
  const id = state.run.messageId ?? `msg_local_${ctx.now.toString(36)}`;
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
      const exists = state.messages.some((m) => m.id === event.message_id);
      const messages = exists ? state.messages.map((m) => m.id === event.message_id ? { ...m, status: "streaming", error: void 0 } : m) : [
        ...state.messages,
        {
          id: event.message_id,
          role: "assistant",
          blocks: [],
          status: "streaming",
          createdAt: new Date(ctx.now).toISOString()
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
        if (existing) {
          return updateBlock(m, incoming.id, (b) => ({ ...incoming, checkpoint: b.checkpoint, startedAt: b.startedAt }));
        }
        return { ...m, blocks: [...m.blocks, incoming] };
      });
      return { ...next, streamBlockIds: { ...next.streamBlockIds, [event.index]: incoming.id } };
    }
    case "content_block_delta": {
      const blockId = state.streamBlockIds[event.index];
      if (!blockId) return state;
      return updateMessage(
        state,
        state.run.messageId,
        (m) => updateBlock(m, blockId, (b) => {
          const handler = ctx.resolveDeltaHandler?.(b.data);
          const data = handler?.(b.data, event.delta, event.snapshot) ?? defaultApplyDelta(b.data, event.delta, event.snapshot);
          return data === b.data ? b : { ...b, data };
        })
      );
    }
    case "content_block_stop": {
      const s = ensureAssistantMessage(state, ctx);
      const blockId = s.streamBlockIds[event.index] ?? event.block.id;
      const next = updateMessage(s, s.run.messageId, (m) => {
        const final = {
          id: blockId,
          type: event.block.type,
          category: event.block.category,
          status: "complete",
          data: { ...event.block, id: blockId },
          completedAt: ctx.now
        };
        if (!m.blocks.some((b) => b.id === blockId)) {
          return { ...m, blocks: [...m.blocks, { ...final, startedAt: ctx.now }] };
        }
        return updateBlock(m, blockId, (b) => ({ ...final, checkpoint: b.checkpoint, startedAt: b.startedAt }));
      });
      return next.streamBlockIds[event.index] ? next : { ...next, streamBlockIds: { ...next.streamBlockIds, [event.index]: blockId } };
    }
    case "checkpoint": {
      const messageId = state.run.messageId;
      const message = state.messages.find((m) => m.id === messageId);
      if (!message) return state;
      const blockId = state.streamBlockIds[event.block_index] ?? message.blocks[message.blocks.length - 1]?.id;
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
      let next = updateMessage(state, messageId, (m) => ({
        ...m,
        status,
        stopReason: event.stop_reason,
        model: event.model ?? m.model,
        error: event.stop_reason === "error" ? m.error ?? state.run.error : m.error,
        blocks: m.blocks.map((b) => b.status === "streaming" ? { ...b, status: "complete", completedAt: ctx.now } : b)
      }));
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
      const error = {
        type: event.error_type,
        message: event.message,
        retryAfter: event.retry_after ?? null,
        retryable: true
      };
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
    (m) => m.status === "streaming" ? {
      ...m,
      status: error ? "interrupted" : "cancelled",
      error: error ?? m.error,
      blocks: m.blocks.map((b) => b.status === "streaming" ? { ...b, status: "interrupted", completedAt: ctx.now } : b)
    } : m
  );
  return {
    ...next,
    run: error ? { status: "error", messageId, error } : { status: "idle", messageId },
    streamBlockIds: {}
  };
}

// src/core/store/normalize.ts
var isObject2 = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var STATUS_BY_STOP2 = {
  end_turn: "complete",
  paused: "paused",
  error: "error",
  cancelled: "cancelled"
};
function toConversationItem(s) {
  return {
    id: s.conversation_id,
    title: s.title || "New chat",
    createdAt: s.created_at,
    updatedAt: s.updated_at || s.created_at,
    archived: Boolean(s.archived)
  };
}
function metaFromBootstrap(b) {
  return {
    ...emptyMeta(),
    title: b.title || "New chat",
    subtitle: b.subtitle,
    greeting: b.greeting,
    suggestedPrompts: Array.isArray(b.suggested_prompts) ? b.suggested_prompts : [],
    models: Array.isArray(b.model) ? b.model : [],
    sources: Array.isArray(b.sources) ? b.sources : [],
    archived: Boolean(b.archived),
    createdAt: b.created_at,
    updatedAt: b.updated_at
  };
}
function checkpointFromBlock(block) {
  const cp = isObject2(block.checkpoint) ? block.checkpoint : void 0;
  const id = typeof cp?.checkpoint_id === "string" ? cp.checkpoint_id : typeof block.checkpoint_id === "string" ? block.checkpoint_id : void 0;
  if (!id) return void 0;
  const decision = cp?.decision ?? block.decision;
  const resolved = cp?.status === "resolved" || cp?.resolved === true || decision !== void 0;
  return {
    id,
    requires: cp?.requires ?? block.requires,
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
  if (Array.isArray(content)) return content.filter(isObject2);
  if (typeof content === "string") return [{ id: `${message.message_id}:0`, type: "text", category: "content", text: content }];
  if (isObject2(content)) {
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
  for (const w of wire) {
    if (!isObject2(w) || typeof w.message_id !== "string") continue;
    const raw = contentToBlocks(w);
    const decision = decisionOf(w, raw);
    if (decision) {
      decisions.set(decision.checkpointId, decision.decision);
      continue;
    }
    const role = w.role === "user" ? "user" : "assistant";
    const stop = typeof w.stop_reason === "string" ? w.stop_reason : void 0;
    messages.push({
      id: w.message_id,
      role,
      blocks: raw.map((b, i) => toBlock(b, `${w.message_id}:${i}`)),
      status: stop ? STATUS_BY_STOP2[stop] ?? "complete" : "complete",
      stopReason: stop,
      createdAt: typeof w.created_at === "string" ? w.created_at : (/* @__PURE__ */ new Date(0)).toISOString(),
      model: typeof w.model === "string" ? w.model : void 0,
      attachments: Array.isArray(w.attachments) ? w.attachments : void 0
    });
  }
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
    const block = [...last.blocks].reverse().find((b) => b.checkpoint?.status === "pending");
    if (block?.checkpoint) {
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
  const base = previous ?? emptyMeta();
  const model = typeof detail.model === "string" ? detail.model : base.model;
  return {
    meta: {
      ...base,
      title: detail.title || base.title,
      subtitle: detail.subtitle ?? base.subtitle,
      sources: Array.isArray(detail.sources) ? detail.sources : base.sources,
      archived: Boolean(detail.archived),
      createdAt: detail.created_at,
      updatedAt: detail.updated_at,
      model,
      models: Array.isArray(detail.model) ? detail.model : base.models
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

// src/core/runtime/error-info.ts
function toErrorInfo(error) {
  if (error instanceof ChatApiError) {
    return {
      type: error.code,
      message: friendlyHttpMessage(error),
      retryAfter: error.retryAfter,
      retryable: error.status >= 500 || error.status === 429 || error.status === 408
    };
  }
  if (error instanceof ChatStreamError) {
    return { type: error.errorType, message: error.message, retryAfter: error.retryAfter, retryable: true };
  }
  if (error instanceof ChatError) {
    return { type: error.code, message: error.message, retryable: ["network", "timeout", "protocol_error"].includes(error.code) };
  }
  if (isAbortError(error)) {
    return { type: "aborted", message: "The request was stopped.", retryable: true };
  }
  if (error instanceof TypeError) {
    return { type: "network", message: "Could not reach the chat service.", retryable: true };
  }
  const message = error instanceof Error && error.message ? error.message : "Something went wrong.";
  return { type: "unknown", message, retryable: true };
}
function friendlyHttpMessage(error) {
  if (error.status === 401) return "Your session has expired. Sign in again to keep chatting.";
  if (error.status === 403) return "You don't have access to this conversation.";
  if (error.status === 404) return "This conversation no longer exists.";
  if (error.status === 429) return "Too many requests. Wait a moment and try again.";
  if (error.status >= 500) return "The chat service is having trouble. Try again in a moment.";
  return error.message;
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
  const d = config?.defaultSelection ?? "all";
  if (d === "all") return selectAll(groups);
  if (d === "none") return {};
  return sanitizeSelection(d, groups) ?? {};
}
function defaultScopeToRequest(selection, groups) {
  const byWorkflow = /* @__PURE__ */ new Map();
  for (const g of groups) {
    for (const itemId of selection[g.id] ?? []) {
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
    const chosen = new Set(selection[g.id] ?? []);
    selected += g.items.filter((i) => chosen.has(i.id)).length;
  }
  return { selected, total, allSelected: total > 0 && selected === total };
}
function mergeWorkflowContexts(...lists) {
  const map = /* @__PURE__ */ new Map();
  for (const list of lists) {
    for (const wc of list ?? []) {
      if (!wc || typeof wc.workflow_name !== "string") continue;
      const prev = map.get(wc.workflow_name);
      const ids = Array.isArray(wc.workspace_id) ? wc.workspace_id : [];
      map.set(wc.workflow_name, {
        workflow_name: wc.workflow_name,
        workspace_id: [.../* @__PURE__ */ new Set([...prev?.workspace_id ?? [], ...ids])],
        context: { ...prev?.context ?? {}, ...wc.context ?? {} }
      });
    }
  }
  return map.size ? [...map.values()] : void 0;
}

// src/core/runtime/utils.ts
function uid(prefix = "") {
  const c = globalThis.crypto;
  const id = typeof c?.randomUUID === "function" ? c.randomUUID().replace(/-/g, "").slice(0, 16) : Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  return prefix + id;
}
var Inflight = class {
  map = /* @__PURE__ */ new Map();
  run(key, fn) {
    const existing = this.map.get(key);
    if (existing) return existing;
    const p = fn().finally(() => {
      if (this.map.get(key) === p) this.map.delete(key);
    });
    this.map.set(key, p);
    return p;
  }
};
var Emitter = class {
  listeners = /* @__PURE__ */ new Map();
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
};

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
var Runtime = class {
  adapter;
  conversations;
  session;
  scope;
  preferences;
  config;
  persistence;
  options;
  scheduler;
  now;
  idleMs;
  maxThreads;
  persister;
  threads = /* @__PURE__ */ new Map();
  emitter = new Emitter();
  inflight = new Inflight();
  createdLocally = /* @__PURE__ */ new Map();
  cleanups = [];
  deltaResolver;
  drafts = {};
  persistedScope;
  threadIndex = [];
  listToken = 0;
  lastFocusRefresh = 0;
  startPromise;
  creating;
  hydration;
  disposed = false;
  constructor(options) {
    this.options = options;
    this.adapter = options.adapter;
    this.scheduler = options.scheduler ?? frameScheduler;
    this.now = options.now ?? Date.now;
    this.idleMs = options.streamIdleTimeoutMs ?? 6e4;
    this.maxThreads = Math.max(2, options.maxThreads ?? 20);
    this.config = {
      conversationCreation: options.conversationCreation ?? "eager",
      composerWhilePaused: options.hitl?.composerWhilePaused ?? "disabled",
      attachments: options.attachments ? { accept: options.attachments.accept, maxSize: options.attachments.maxSize, maxFiles: options.attachments.maxFiles } : void 0,
      hasScope: Boolean(options.scope)
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
    this.conversations = createStore({ items: [], status: "idle", runningIds: [] }, this.scheduler);
    this.session = createStore({ activeKey: NEW_THREAD_KEY, activeId: null, hydrated: false }, this.scheduler);
    this.scope = createStore(
      { groups: [], selection: {}, status: options.scope ? "loading" : "ready" },
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
          if (this.thread(activeId).store.getState().loadStatus === "error" && this.session.getState().activeId === activeId) {
            if (this.config.conversationCreation === "eager") await this.newConversation().catch(() => void 0);
            else this.setActive(null);
          }
        } else if (this.config.conversationCreation === "eager") {
          await this.newConversation().catch(() => void 0);
        }
        await list;
      })();
    }
    return this.startPromise;
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
    const key = conversationId ?? NEW_THREAD_KEY;
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
        text: draft?.text ?? "",
        attachments: (draft?.attachments ?? []).map((a) => ({
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
      const activeKey = this.session?.getState().activeKey;
      const victim = [...this.threads.values()].find(
        (t) => t.key !== NEW_THREAD_KEY && t.key !== activeKey && !t.abort && t.uploads.size === 0 && t.store.listenerCount() === 0 && t.composer.listenerCount() <= 1
      );
      if (!victim) return;
      this.threads.delete(victim.key);
    }
  }
  setActive(conversationId) {
    const key = conversationId ?? NEW_THREAD_KEY;
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
    if (this.creating) return this.creating;
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
      meta: { ...metaFromBootstrap(boot), sources: boot.sources ?? s.meta.sources }
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
      if (error instanceof ChatApiError && error.status === 404) this.removeConversationLocal(id);
      if (t.store.getState().loadStatus === "ready" && t.store.getState().messages.length) {
        this.warn({ code: "revalidate_failed", message: "Showing saved messages; could not refresh them.", data: info });
        return;
      }
      t.store.setState((s) => ({ ...s, loadStatus: "error", loadError: info }));
      if (restoring && error instanceof ChatApiError && error.status === 404) {
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
        const keep = this.conversations.getState().items.filter((i) => !serverIds.has(i.id) && now - (this.createdLocally.get(i.id) ?? -Infinity) < 6e4);
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
    const prevTitle = t?.store.getState().meta.title;
    this.patchLocal(conversationId, { title: clean });
    try {
      await this.adapter.updateConversation(conversationId, { title: clean });
    } catch (error) {
      this.patchLocal(conversationId, { title: prevItem?.title ?? prevTitle ?? "New chat" });
      this.reportError(toErrorInfo(error), error);
      throw error;
    }
  }
  async archiveConversation(conversationId, archived) {
    const prev = this.conversations.getState().items.find((i) => i.id === conversationId)?.archived ?? !archived;
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
    if (t?.abort) {
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
      await this.adapter.updateConversation(id, { model });
    } catch (error) {
      t.store.setState((s) => ({ ...s, meta: { ...s.meta, model: prev } }));
      this.reportError(toErrorInfo(error), error);
      throw error;
    }
  }
  async setDefaultSources(sources, conversationId) {
    const t = this.target(conversationId);
    const id = t.store.getState().conversationId;
    const prev = t.store.getState().meta.sources;
    t.store.setState((s) => ({ ...s, meta: { ...s.meta, sources } }));
    if (!id) return;
    try {
      await this.adapter.updateConversation(id, { sources });
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
    const meta = t?.store.getState().meta;
    const existing = this.conversations.getState().items.find((i) => i.id === conversationId);
    const now = new Date(this.now()).toISOString();
    this.upsertConversation({
      id: conversationId,
      title: meta?.title ?? existing?.title ?? "New chat",
      createdAt: existing?.createdAt ?? meta?.createdAt ?? now,
      updatedAt: now,
      archived: existing?.archived ?? false
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
    const t = this.target(options.conversationId);
    const trimmed = text.trim();
    const composer = t.composer.getState();
    if (!options.attachments && composer.attachments.some((a) => a.status === "uploading")) {
      this.warn({ code: "attachments_uploading", message: "Wait for attachments to finish uploading." });
      return;
    }
    const attachments = options.attachments ?? composer.attachments.filter((a) => a.status === "ready" && a.attachment).map((a) => a.attachment);
    if (!trimmed && attachments.length === 0) return;
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
      local: true
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
    const body = {
      stream: true,
      message: { role: "user", type: "default", content: { default: trimmed } },
      ...this.requestExtras(options),
      ...attachments.length ? { attachments } : {}
    };
    t.lastRequest = { kind: "send", body, userMessageId: userMessage.id };
    t.onFirstEvent = () => t.store.setState((s) => ({
      ...s,
      messages: s.messages.map((m) => m.id === userMessage.id ? { ...m, local: false } : m)
    }));
    await this.stream(t, conversationId, body);
  }
  async resume(checkpointId, decision, options = {}) {
    const t = this.findCheckpointThread(checkpointId, options.conversationId);
    if (!t) {
      this.warn({ code: "unknown_checkpoint", message: `No card is waiting on checkpoint ${checkpointId}.` });
      return;
    }
    const state = t.store.getState();
    const conversationId = state.conversationId;
    const block = state.messages.flatMap((m) => m.blocks).find((b) => b.checkpoint?.id === checkpointId);
    const cp = block?.checkpoint;
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
          (b) => b.checkpoint?.id === checkpointId ? { ...b, checkpoint: { ...b.checkpoint, ...patch } } : b
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
    t.onFirstEvent = () => setCheckpoint({ status: "resolved" });
    await this.stream(t, conversationId, body);
    const after = t.store.getState().messages.flatMap((m) => m.blocks).find((b) => b.checkpoint?.id === checkpointId)?.checkpoint;
    if (after?.status === "submitting") {
      const error = t.store.getState().run.error;
      setCheckpoint({ status: "failed", error });
      t.store.setState((s) => ({
        ...s,
        pendingCheckpoint: pending,
        run: { status: "paused", messageId: pending?.messageId, error }
      }));
    }
  }
  findCheckpointThread(checkpointId, conversationId) {
    const candidates = conversationId ? [this.thread(conversationId)] : [this.active(), ...this.threads.values()];
    return candidates.find(
      (t) => t.store.getState().messages.some((m) => m.blocks.some((b) => b.checkpoint?.id === checkpointId))
    );
  }
  async cancel(conversationId) {
    const t = this.target(conversationId);
    const s = t.store.getState();
    if (!isBusy(s) || !t.abort || t.cancelRequested) return;
    t.cancelRequested = true;
    t.store.setState((st) => ({ ...st, run: { ...st.run, status: "cancelling" } }));
    if (s.run.messageId) {
      await this.fireCancel(t);
    } else {
      t.cancelTimer = setTimeout(() => t.abort?.abort(), 3e3);
    }
  }
  async fireCancel(t) {
    clearTimeout(t.cancelTimer);
    const { conversationId, run } = t.store.getState();
    const controller = t.abort;
    if (conversationId && run.messageId) {
      try {
        await this.adapter.cancelMessage(conversationId, run.messageId);
      } catch (error) {
        this.warn({ code: "cancel_failed", message: "The server did not confirm the cancel; stopping locally.", data: error });
      }
    }
    if (controller && !controller.signal.aborted) t.cancelTimer = setTimeout(() => controller.abort(), 1500);
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
      const cp = state.messages.flatMap((m) => m.blocks).find((b) => b.checkpoint?.id === req.checkpointId)?.checkpoint;
      if (cp && cp.status === "failed") {
        await this.resume(req.checkpointId, req.body.message.content.decision, {
          conversationId: id
        });
        return;
      }
    }
    t.store.setState((s) => {
      const idx = req.kind === "send" ? s.messages.findIndex((m) => m.id === req.userMessageId) : -1;
      const messages = s.messages.filter(
        (m, i) => !(m.role === "assistant" && (m.status === "error" || m.status === "interrupted") && i > idx)
      );
      return { ...s, messages, run: { status: "submitting" } };
    });
    await this.stream(t, id, req.body);
  }
  requestExtras(options) {
    const cfg = this.options.scope;
    const sc = this.scope.getState();
    const scoped = cfg && sc.status === "ready" ? (cfg.toRequest ?? defaultScopeToRequest)(sc.selection, sc.groups) : {};
    const host = typeof this.options.workflowContext === "function" ? this.options.workflowContext() : this.options.workflowContext;
    const workflow_context = mergeWorkflowContexts(scoped.workflow_context, host, options.workflowContext);
    const sources = options.sources ?? scoped.sources;
    return { ...workflow_context ? { workflow_context } : {}, ...sources ? { sources } : {} };
  }
  apply(t, event) {
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
        if (!sawAny) {
          sawAny = true;
          t.onFirstEvent?.();
          t.onFirstEvent = void 0;
        }
        this.emitter.emit("event", event, { conversationId });
        this.options.onEvent?.(event, { conversationId });
        this.apply(t, event);
        if (event.type === "message_start" && t.cancelRequested) void this.fireCancel(t);
        if (event.type === "message_stop") {
          sawStop = true;
          if (event.title) this.patchLocal(conversationId, { title: event.title });
        }
        if (event.type === "error") {
          this.reportError(t.store.getState().run.error ?? toErrorInfo(new Error(event.message)), event);
        }
      }
      if (!sawStop && t.abortReason !== "dispose" && t.abortReason !== "deleted") {
        this.finishInterrupted(t, t.cancelRequested ? void 0 : this.endedEarly(t));
      }
    } catch (error) {
      if (t.abortReason === "dispose" || t.abortReason === "deleted") {
      } else if (t.cancelRequested && (isAbortError(error) || controller.signal.aborted)) {
        this.finishInterrupted(t, void 0);
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
    const maxFiles = cfg.maxFiles ?? 10;
    let room = maxFiles - t.composer.getState().attachments.length;
    for (const file of list) {
      if (room <= 0) {
        result.rejected.push({ file, reason: `You can attach up to ${maxFiles} files.` });
        continue;
      }
      if (cfg.maxSize && file.size > cfg.maxSize) {
        result.rejected.push({ file, reason: `${file.name} is larger than ${formatBytes(cfg.maxSize)}.` });
        continue;
      }
      if (cfg.accept && !matchesAccept(file, cfg.accept)) {
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
    t.uploads.get(attachmentId)?.abort();
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
      this.scope.setState({ groups: safe, selection: persisted ?? initialSelection(cfg, safe), status: "ready" });
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
    if (!Object.keys(selection).length && this.options.scope?.defaultSelection !== "none") selection = selectAll(groups);
    this.scope.setState({ groups, selection, status: "ready" });
  }
  setScopeSelection(selection) {
    const sc = this.scope.getState();
    this.scope.setState({ ...sc, selection: sanitizeSelection(selection, sc.groups) ?? {} });
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
      } catch {
      }
    };
    if (p.enabled) {
      if (cfg.preferences) {
        load("prefs", (v) => {
          if (v?.values && typeof v.values === "object")
            this.preferences.setState({ ...v.values, ...this.preferences.getState() });
          if (v?.scope) {
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
            if (d?.text && !t.composer.getState().text) t.composer.setState((s) => ({ ...s, text: d.text ?? "" }));
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
        meta: { ...s.meta, ...cached.meta },
        messages: cached.messages,
        pendingCheckpoint: cached.pendingCheckpoint,
        run: cached.pendingCheckpoint ? { status: "paused", messageId: cached.pendingCheckpoint.messageId } : { status: "idle" }
      });
    };
    try {
      const v = this.persister.read(`thread:${id}`);
      if (isPromise(v)) v.then(apply, () => void 0);
      else apply(v);
    } catch {
    }
  }
  persistThread(t) {
    if (!this.persister.enabled || !this.persister.config.persist.history) return;
    const s = t.store.getState();
    const id = s.conversationId;
    if (!id) return;
    const data = { meta: s.meta, messages: completedOnly(s.messages), pendingCheckpoint: s.pendingCheckpoint };
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
      if (prev && prev.text === c.text && (prev.attachments?.length ?? 0) === attachments.length) return;
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
    document.addEventListener?.("visibilitychange", onFocus);
    this.lastFocusRefresh = this.now();
    this.cleanups.push(() => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener?.("visibilitychange", onFocus);
    });
  }
  // ------------------------------------------------------------------------------------------
  // Reporting
  // ------------------------------------------------------------------------------------------
  reportError(info, raw) {
    this.emitter.emit("error", info, raw);
    this.options.onError?.(info, raw);
  }
  warn(warning) {
    this.emitter.emit("warning", warning);
    this.options.onWarning?.(warning);
  }
};
function createChatRuntime(options) {
  if (!options?.adapter) throw new Error("[agentic-chat] createChatRuntime needs an `adapter`.");
  return new Runtime(options);
}

export {
  PROTOCOL_VERSION,
  isContentBlock,
  parseStreamEvent,
  SseParser,
  readSse,
  DEFAULT_REST_PATHS,
  createRestAdapter,
  createMemoryStorage,
  createWebStorage,
  createSafeStorage,
  createPersister,
  frameScheduler,
  syncScheduler,
  createStore,
  emptyMeta,
  createThreadState,
  textFieldOf,
  defaultApplyDelta,
  reduceStreamEvent,
  interruptRun,
  toConversationItem,
  metaFromBootstrap,
  normalizeMessages,
  normalizeConversationDetail,
  sortConversations,
  groupKeyFor,
  groupConversations,
  filterConversations,
  toErrorInfo,
  selectAll,
  defaultScopeToRequest,
  summarizeScope,
  mergeWorkflowContexts,
  NEW_THREAD_KEY,
  formatBytes,
  createChatRuntime
};
//# sourceMappingURL=chunk-ZXNHFCYQ.js.map