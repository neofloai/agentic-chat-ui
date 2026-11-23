
// src/core/transport/errors.ts
var ChatError = class extends Error {
  name = "ChatError";
  code;
  constructor(code, message, options) {
    super(message, options);
    this.code = code;
  }
};
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
var ChatApiError = class extends ChatError {
  name = "ChatApiError";
  status;
  body;
  /** Seconds, from the envelope's `retry_after` or the `Retry-After` header. */
  retryAfter;
  /** The envelope's `error.type` (`session_busy`, `askneo.gate_required`…), when the server sent one. */
  errorType;
  /** From the envelope or the `X-Request-Id` header. */
  requestId;
  details;
  constructor(status, message, body, retryAfter = null, extra = {}) {
    super(`http_${status}`, message);
    const envelope = readErrorEnvelope(body);
    this.status = status;
    this.body = body;
    this.retryAfter = envelope.retryAfter ?? retryAfter;
    this.errorType = envelope.type;
    this.requestId = envelope.requestId ?? extra.requestId ?? null;
    this.details = envelope.details;
  }
};
var ChatStreamError = class extends ChatError {
  name = "ChatStreamError";
  errorType;
  retryAfter;
  requestId;
  details;
  constructor(errorType, message, retryAfter = null, extra = {}) {
    super(errorType, message);
    this.errorType = errorType;
    this.retryAfter = retryAfter;
    this.requestId = extra.requestId ?? null;
    this.details = extra.details ?? null;
  }
};
var ChatProtocolError = class extends ChatError {
  name = "ChatProtocolError";
  constructor(message, options) {
    super("protocol_error", message, options);
  }
};
var ChatTimeoutError = class extends ChatError {
  name = "ChatTimeoutError";
  constructor(message = "The response stopped arriving.") {
    super("timeout", message);
  }
};
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

export {
  ChatError,
  readErrorEnvelope,
  ChatApiError,
  ChatStreamError,
  ChatProtocolError,
  ChatTimeoutError,
  isAbortError,
  messageFromBody
};
//# sourceMappingURL=chunk-IKLKRTV5.js.map