/** Base class for every error the library throws, so hosts can `instanceof ChatError`. */
export class ChatError extends Error {
  override readonly name: string = 'ChatError';
  readonly code: string;

  constructor(code: string, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.code = code;
  }
}

/** The fields of a standard error envelope, `{ "error": { type, message, … } }`. */
export interface ErrorEnvelopeFields {
  type: string | null;
  message: string | null;
  retryAfter: number | null;
  requestId: string | null;
  details: Record<string, unknown> | null;
}

/** Reads the standard error envelope. Every field is `null` when the body doesn't have it. */
export function readErrorEnvelope(body: unknown): ErrorEnvelopeFields {
  const root = body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  const e =
    root.error && typeof root.error === 'object' && !Array.isArray(root.error) ? (root.error as Record<string, unknown>) : {};
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v : null);
  const details = e.details && typeof e.details === 'object' && !Array.isArray(e.details) ? e.details : null;
  return {
    type: str(e.type),
    message: str(e.message),
    retryAfter: typeof e.retry_after === 'number' && Number.isFinite(e.retry_after) ? Math.max(0, e.retry_after) : null,
    requestId: str(e.request_id),
    details: details as Record<string, unknown> | null,
  };
}

/** A REST call came back non-2xx. */
export class ChatApiError extends ChatError {
  override readonly name = 'ChatApiError';
  readonly status: number;
  readonly body: unknown;
  /** Seconds, from the envelope's `retry_after` or the `Retry-After` header. */
  readonly retryAfter: number | null;
  /** The envelope's `error.type` (`session_busy`, `askneo.gate_required`…), when the server sent one. */
  readonly errorType: string | null;
  /** From the envelope or the `X-Request-Id` header. */
  readonly requestId: string | null;
  readonly details: Record<string, unknown> | null;

  constructor(
    status: number,
    message: string,
    body: unknown,
    retryAfter: number | null = null,
    extra: { requestId?: string | null } = {},
  ) {
    super(`http_${status}`, message);
    const envelope = readErrorEnvelope(body);
    this.status = status;
    this.body = body;
    this.retryAfter = envelope.retryAfter ?? retryAfter;
    this.errorType = envelope.type;
    this.requestId = envelope.requestId ?? extra.requestId ?? null;
    this.details = envelope.details;
  }
}

/** The server sent an SSE `error` event. */
export class ChatStreamError extends ChatError {
  override readonly name = 'ChatStreamError';
  readonly errorType: string;
  readonly retryAfter: number | null;
  readonly requestId: string | null;
  readonly details: Record<string, unknown> | null;

  constructor(
    errorType: string,
    message: string,
    retryAfter: number | null = null,
    extra: { requestId?: string | null; details?: Record<string, unknown> | null } = {},
  ) {
    super(errorType, message);
    this.errorType = errorType;
    this.retryAfter = retryAfter;
    this.requestId = extra.requestId ?? null;
    this.details = extra.details ?? null;
  }
}

/** The response broke the protocol (for example, a stream with no body). */
export class ChatProtocolError extends ChatError {
  override readonly name = 'ChatProtocolError';
  constructor(message: string, options?: { cause?: unknown }) {
    super('protocol_error', message, options);
  }
}

/** No event arrived for longer than the idle timeout. */
export class ChatTimeoutError extends ChatError {
  override readonly name = 'ChatTimeoutError';
  constructor(message = 'The response stopped arriving.') {
    super('timeout', message);
  }
}

export function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    ((error as { name: unknown }).name === 'AbortError' || (error as { name: unknown }).name === 'TimeoutError')
  );
}

/** Pulls a readable message out of an error response body without trusting its shape. */
export function messageFromBody(body: unknown, fallback: string): string {
  if (typeof body === 'string' && body.trim()) return body.slice(0, 300);
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    for (const key of ['message', 'detail', 'error']) {
      const v = b[key];
      if (typeof v === 'string' && v.trim()) return v;
      if (v && typeof v === 'object' && typeof (v as Record<string, unknown>).message === 'string') {
        return (v as Record<string, string>).message as string;
      }
    }
  }
  return fallback;
}
