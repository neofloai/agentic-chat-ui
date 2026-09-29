/** Base class for every error the library throws, so hosts can `instanceof ChatError`. */
export class ChatError extends Error {
  override readonly name: string = 'ChatError';
  readonly code: string;

  constructor(code: string, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.code = code;
  }
}

/** A REST call came back non-2xx. */
export class ChatApiError extends ChatError {
  override readonly name = 'ChatApiError';
  readonly status: number;
  readonly body: unknown;
  /** Seconds, from a `Retry-After` header when the server sent one. */
  readonly retryAfter: number | null;

  constructor(status: number, message: string, body: unknown, retryAfter: number | null = null) {
    super(`http_${status}`, message);
    this.status = status;
    this.body = body;
    this.retryAfter = retryAfter;
  }
}

/** The server sent an SSE `error` event. */
export class ChatStreamError extends ChatError {
  override readonly name = 'ChatStreamError';
  readonly errorType: string;
  readonly retryAfter: number | null;

  constructor(errorType: string, message: string, retryAfter: number | null = null) {
    super(errorType, message);
    this.errorType = errorType;
    this.retryAfter = retryAfter;
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
