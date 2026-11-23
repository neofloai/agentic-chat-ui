"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } var _class; var _class2; var _class3; var _class4; var _class5;
// src/core/transport/errors.ts
var ChatError = (_class = class extends Error {
  __init() {this.name = "ChatError"}
  
  constructor(code, message, options) {
    super(message, options);_class.prototype.__init.call(this);;
    this.code = code;
  }
}, _class);
function readErrorEnvelope(body) {
  const root = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const e = root.error && typeof root.error === "object" && !Array.isArray(root.error) ? root.error : {};
  const str = (v) => typeof v === "string" && v.trim() ? v : null;
  const details = e.details && typeof e.details === "object" && !Array.isArray(e.details) ? e.details : null;
  return {
    type: str(e.type),
    message: str(e.message),
    retryAfter: typeof e.retry_after === "number" && Number.isFinite(e.retry_after) ? Math.max(0, e.retry_after) : null,
    requestId: str(e.request_id),
    details
  };
}
var ChatApiError = (_class2 = class extends ChatError {
  __init2() {this.name = "ChatApiError"}
  
  
  /** Seconds, from the envelope's `retry_after` or the `Retry-After` header. */
  
  /** The envelope's `error.type` (`session_busy`, `askneo.gate_required`…), when the server sent one. */
  
  /** From the envelope or the `X-Request-Id` header. */
  
  
  constructor(status, message, body, retryAfter = null, extra = {}) {
    super(`http_${status}`, message);_class2.prototype.__init2.call(this);;
    const envelope = readErrorEnvelope(body);
    this.status = status;
    this.body = body;
    this.retryAfter = _nullishCoalesce(envelope.retryAfter, () => ( retryAfter));
    this.errorType = envelope.type;
    this.requestId = _nullishCoalesce(_nullishCoalesce(envelope.requestId, () => ( extra.requestId)), () => ( null));
    this.details = envelope.details;
  }
}, _class2);
var ChatStreamError = (_class3 = class extends ChatError {
  __init3() {this.name = "ChatStreamError"}
  
  
  
  
  constructor(errorType, message, retryAfter = null, extra = {}) {
    super(errorType, message);_class3.prototype.__init3.call(this);;
    this.errorType = errorType;
    this.retryAfter = retryAfter;
    this.requestId = _nullishCoalesce(extra.requestId, () => ( null));
    this.details = _nullishCoalesce(extra.details, () => ( null));
  }
}, _class3);
var ChatProtocolError = (_class4 = class extends ChatError {
  __init4() {this.name = "ChatProtocolError"}
  constructor(message, options) {
    super("protocol_error", message, options);_class4.prototype.__init4.call(this);;
  }
}, _class4);
var ChatTimeoutError = (_class5 = class extends ChatError {
  __init5() {this.name = "ChatTimeoutError"}
  constructor(message = "The response stopped arriving.") {
    super("timeout", message);_class5.prototype.__init5.call(this);;
  }
}, _class5);
function isAbortError(error) {
  return typeof error === "object" && error !== null && "name" in error && (error.name === "AbortError" || error.name === "TimeoutError");
}
function messageFromBody(body, fallback) {
  if (typeof body === "string" && body.trim()) return body.slice(0, 300);
  if (body && typeof body === "object") {
    const b = body;
    for (const key of ["message", "detail", "error"]) {
      const v = b[key];
      if (typeof v === "string" && v.trim()) return v;
      if (v && typeof v === "object" && typeof v.message === "string") {
        return v.message;
      }
    }
  }
  return fallback;
}










exports.ChatError = ChatError; exports.readErrorEnvelope = readErrorEnvelope; exports.ChatApiError = ChatApiError; exports.ChatStreamError = ChatStreamError; exports.ChatProtocolError = ChatProtocolError; exports.ChatTimeoutError = ChatTimeoutError; exports.isAbortError = isAbortError; exports.messageFromBody = messageFromBody;
//# sourceMappingURL=chunk-ZNIBBZSN.cjs.map