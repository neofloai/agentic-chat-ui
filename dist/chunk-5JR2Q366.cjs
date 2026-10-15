"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; } var _class;






var _chunkZNIBBZSNcjs = require('./chunk-ZNIBBZSN.cjs');

// src/core/protocol/types.ts
var PROTOCOL_VERSION = "v1";
var STANDARD_REVISION = "1.2";
var ERROR_CODES = [
  "invalid_request",
  "unsupported_feature",
  "connection_required",
  "connection_expired",
  "unauthenticated",
  "access_denied",
  "not_found",
  "session_busy",
  "duplicate_message",
  "rate_limited",
  "upstream_unavailable",
  "internal"
];

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
    return { ok: false, reason: "invalid", type: _nullishCoalesce(eventName, () => ( "unknown")), detail: "payload is not an object" };
  }
  const type = isString(payload.type) ? payload.type : _nullishCoalesce(eventName, () => ( ""));
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
          persona: _nullishCoalesce(p.persona, () => ( null)),
          user_message_id: isString(p.user_message_id) ? p.user_message_id : null,
          client_message_id: isString(p.client_message_id) ? p.client_message_id : null
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
          retry_after: typeof p.retry_after === "number" ? p.retry_after : null,
          request_id: isString(p.request_id) ? p.request_id : null,
          details: isObject(p.details) ? p.details : null
        }
      };
    default:
      return { ok: false, reason: "unknown_type", type };
  }
}

// src/core/transport/sse.ts
var SseParser = (_class = class {constructor() { _class.prototype.__init.call(this);_class.prototype.__init2.call(this);_class.prototype.__init3.call(this);_class.prototype.__init4.call(this);_class.prototype.__init5.call(this);_class.prototype.__init6.call(this); }
  __init() {this.buffer = ""}
  __init2() {this.pendingCR = false}
  __init3() {this.eventName = ""}
  __init4() {this.data = []}
  __init5() {this.hasData = false}
  
  
  __init6() {this.started = false}
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
}, _class);
async function* readSse(stream, signal) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const parser = new SseParser();
  const onAbort = () => {
    reader.cancel().catch(() => void 0);
  };
  _optionalChain([signal, 'optionalAccess', _ => _.addEventListener, 'call', _2 => _2("abort", onAbort, { once: true })]);
  try {
    while (true) {
      if (_optionalChain([signal, 'optionalAccess', _3 => _3.aborted])) throw _nullishCoalesce(signal.reason, () => ( new DOMException("Aborted", "AbortError")));
      const { value, done } = await reader.read();
      if (done) break;
      for (const msg of parser.feed(decoder.decode(value, { stream: true }))) yield msg;
    }
    if (_optionalChain([signal, 'optionalAccess', _4 => _4.aborted])) throw _nullishCoalesce(signal.reason, () => ( new DOMException("Aborted", "AbortError")));
    const tail = decoder.decode();
    for (const msg of parser.feed(tail)) yield msg;
    for (const msg of parser.flush()) yield msg;
  } finally {
    _optionalChain([signal, 'optionalAccess', _5 => _5.removeEventListener, 'call', _6 => _6("abort", onAbort)]);
    _optionalChain([reader, 'access', _7 => _7.releaseLock, 'optionalCall', _8 => _8()]);
  }
}

// src/core/transport/rest-adapter.ts
var DEFAULT_REST_PATHS = {
  config: "/v1/chat/config",
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
    if (_optionalChain([signal, 'optionalAccess', _9 => _9.aborted])) return reject(_nullishCoalesce(signal.reason, () => ( new DOMException("Aborted", "AbortError"))));
    const t = setTimeout(() => {
      _optionalChain([signal, 'optionalAccess', _10 => _10.removeEventListener, 'call', _11 => _11("abort", onAbort)]);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(_nullishCoalesce(_optionalChain([signal, 'optionalAccess', _12 => _12.reason]), () => ( new DOMException("Aborted", "AbortError"))));
    };
    _optionalChain([signal, 'optionalAccess', _13 => _13.addEventListener, 'call', _14 => _14("abort", onAbort, { once: true })]);
  });
}
function linkSignal(signal, timeoutMs) {
  if (!timeoutMs) return { signal, cleanup: () => void 0 };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException("The request timed out.", "TimeoutError")), timeoutMs);
  const onAbort = () => controller.abort(_optionalChain([signal, 'optionalAccess', _15 => _15.reason]));
  if (_optionalChain([signal, 'optionalAccess', _16 => _16.aborted])) controller.abort(signal.reason);
  else _optionalChain([signal, 'optionalAccess', _17 => _17.addEventListener, 'call', _18 => _18("abort", onAbort, { once: true })]);
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      _optionalChain([signal, 'optionalAccess', _19 => _19.removeEventListener, 'call', _20 => _20("abort", onAbort)]);
    }
  };
}
async function readBody(res) {
  const text = await res.text().catch(() => "");
  if (!text) return void 0;
  try {
    return JSON.parse(text);
  } catch (e) {
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
    throw new (0, _chunkZNIBBZSNcjs.ChatProtocolError)("The server returned a response that is not valid JSON.", { cause });
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
  const timeoutMs = _nullishCoalesce(options.timeoutMs, () => ( 3e4));
  const doFetch = _nullishCoalesce(options.fetch, () => ( ((input, init) => globalThis.fetch(input, init))));
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
      const extra = { Accept: _nullishCoalesce(init.accept, () => ( "application/json")) };
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
        if (_optionalChain([init, 'access', _21 => _21.signal, 'optionalAccess', _22 => _22.aborted])) throw error;
        const timedOut = _chunkZNIBBZSNcjs.isAbortError.call(void 0, error);
        if (init.idempotent && attempt < retry.retries) {
          await sleep(backoff(attempt), init.signal);
          attempt++;
          continue;
        }
        throw new (0, _chunkZNIBBZSNcjs.ChatError)(
          timedOut ? "timeout" : "network",
          timedOut ? "The chat service took too long to respond." : "Could not reach the chat service.",
          { cause: error }
        );
      }
      if (init.timeout !== false) linked.cleanup();
      const requestId = res.headers.get("x-request-id");
      if (res.status === 401 && options.onUnauthorized && !refreshed) {
        refreshed = true;
        const body = await readBody(res);
        const envelope = _chunkZNIBBZSNcjs.readErrorEnvelope.call(void 0, body);
        const info = {
          code: envelope.type,
          message: envelope.message,
          requestId: _nullishCoalesce(envelope.requestId, () => ( requestId)),
          body
        };
        if (await options.onUnauthorized(info)) continue;
        throw new (0, _chunkZNIBBZSNcjs.ChatApiError)(
          401,
          _chunkZNIBBZSNcjs.messageFromBody.call(void 0, body, "Your session has expired. Sign in again to keep chatting."),
          body,
          null,
          {
            requestId
          }
        );
      }
      if (!res.ok) {
        const retryAfter = parseRetryAfter(res.headers.get("retry-after"));
        if (init.idempotent && attempt < retry.retries && (res.status >= 500 || res.status === 429)) {
          await _optionalChain([res, 'access', _23 => _23.body, 'optionalAccess', _24 => _24.cancel, 'call', _25 => _25(), 'access', _26 => _26.catch, 'call', _27 => _27(() => void 0)]);
          const wait = retryAfter !== null ? Math.min(retryAfter * 1e3, retry.maxDelayMs) : backoff(attempt);
          await sleep(wait, init.signal);
          attempt++;
          continue;
        }
        const body = await readBody(res);
        throw new (0, _chunkZNIBBZSNcjs.ChatApiError)(res.status, _chunkZNIBBZSNcjs.messageFromBody.call(void 0, body, `Request failed (${res.status}).`), body, retryAfter, {
          requestId
        });
      }
      return res;
    }
  }
  return {
    async getConfig() {
      try {
        const res = await send("GET", paths.config, { idempotent: true });
        const json = await readJson(res);
        return json && typeof json === "object" ? json : null;
      } catch (error) {
        if (error instanceof _chunkZNIBBZSNcjs.ChatApiError && (error.status === 404 || error.status === 405)) return null;
        throw error;
      }
    },
    async createConversation() {
      const res = await send("POST", paths.createConversation, { idempotent: false });
      return readJson(res);
    },
    async listConversations() {
      const res = await send("GET", paths.listConversations, { idempotent: true });
      const json = await readJson(res);
      if (Array.isArray(json)) return json;
      return Array.isArray(_optionalChain([json, 'optionalAccess', _28 => _28.conversations])) ? json.conversations : [];
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
        if (error instanceof _chunkZNIBBZSNcjs.ChatApiError && error.status === 404) return;
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
      const contentType = _nullishCoalesce(res.headers.get("content-type"), () => ( ""));
      if (!contentType.includes("text/event-stream") && contentType.includes("json")) {
        _optionalChain([onWarning, 'optionalCall', _29 => _29({ code: "non_stream_response", message: "The server answered with JSON instead of a stream." })]);
        yield* synthesizeEvents(await readJson(res), conversationId);
        return;
      }
      if (!res.body) throw new (0, _chunkZNIBBZSNcjs.ChatProtocolError)("The response had no body to stream.");
      for await (const msg of readSse(res.body, signal)) {
        if (!msg.data || msg.data === "[DONE]") continue;
        let payload;
        try {
          payload = JSON.parse(msg.data);
        } catch (e2) {
          _optionalChain([onWarning, 'optionalCall', _30 => _30({ code: "malformed_event", message: `Could not parse a "${msg.event}" event.`, data: msg.data })]);
          continue;
        }
        const parsed = parseStreamEvent(payload, msg.event === "message" ? void 0 : msg.event);
        if (parsed.ok) yield parsed.event;
        else if (parsed.reason === "unknown_type")
          _optionalChain([onWarning, 'optionalCall', _31 => _31({ code: "unknown_event", message: `Ignored unknown event "${parsed.type}".`, data: payload })]);
        else
          _optionalChain([onWarning, 'optionalCall', _32 => _32({
            code: "invalid_event",
            message: `Ignored an invalid "${parsed.type}" event: ${parsed.detail}.`,
            data: payload
          })]);
      }
    },
    async cancelMessage(conversationId, messageId) {
      const res = await send("POST", paths.cancel(conversationId), {
        body: { message_id: messageId },
        idempotent: true
      });
      const json = await readJson(res);
      return { status: Boolean(_optionalChain([json, 'optionalAccess', _33 => _33.status])) };
    }
  };
}











exports.PROTOCOL_VERSION = PROTOCOL_VERSION; exports.STANDARD_REVISION = STANDARD_REVISION; exports.ERROR_CODES = ERROR_CODES; exports.isContentBlock = isContentBlock; exports.parseStreamEvent = parseStreamEvent; exports.SseParser = SseParser; exports.readSse = readSse; exports.DEFAULT_REST_PATHS = DEFAULT_REST_PATHS; exports.createRestAdapter = createRestAdapter;
//# sourceMappingURL=chunk-5JR2Q366.cjs.map