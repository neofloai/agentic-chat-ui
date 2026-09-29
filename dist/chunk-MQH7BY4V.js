
// src/core/transport/errors.ts
var ChatError = class extends Error {
  name = "ChatError";
  code;
  constructor(code, message, options) {
    super(message, options);
    this.code = code;
  }
};
var ChatApiError = class extends ChatError {
  name = "ChatApiError";
  status;
  body;
  /** Seconds, from a `Retry-After` header when the server sent one. */
  retryAfter;
  constructor(status, message, body, retryAfter = null) {
    super(`http_${status}`, message);
    this.status = status;
    this.body = body;
    this.retryAfter = retryAfter;
  }
};
var ChatStreamError = class extends ChatError {
  name = "ChatStreamError";
  errorType;
  retryAfter;
  constructor(errorType, message, retryAfter = null) {
    super(errorType, message);
    this.errorType = errorType;
    this.retryAfter = retryAfter;
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
  ChatApiError,
  ChatStreamError,
  ChatProtocolError,
  ChatTimeoutError,
  isAbortError,
  messageFromBody
};
//# sourceMappingURL=chunk-MQH7BY4V.js.map