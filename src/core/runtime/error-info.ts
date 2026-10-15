import { ChatApiError, ChatError, ChatStreamError, isAbortError, readErrorEnvelope } from '../transport/errors';
import type { ChatErrorInfo, ErrorAction } from '../store/types';

interface CodeRule {
  action: ErrorAction;
  retryable: boolean;
  /** Shown when the server didn't send a message of its own. */
  message: string;
}

const RETRY_LATER = 'The chat service is having trouble. Try again in a moment.';

/** The standard error codes and what the UI does for each. Codes win over HTTP statuses. */
const CODE_RULES: Record<string, CodeRule> = {
  invalid_request: { action: 'none', retryable: false, message: 'The request was not valid.' },
  unsupported_feature: { action: 'none', retryable: false, message: "This chat doesn't support that yet." },
  connection_required: { action: 'reconnect', retryable: false, message: 'Connect this source to continue.' },
  connection_expired: { action: 'reconnect', retryable: false, message: 'Reconnect this source to continue.' },
  unauthenticated: { action: 'sign_in', retryable: false, message: 'Your session has expired. Sign in again to keep chatting.' },
  access_denied: { action: 'none', retryable: false, message: "You don't have access to this." },
  not_found: { action: 'none', retryable: false, message: 'This conversation no longer exists.' },
  session_busy: {
    action: 'retry',
    retryable: true,
    message: 'A reply is already in progress in this chat. Try again when it finishes.',
  },
  duplicate_message: { action: 'none', retryable: false, message: 'This message was already sent.' },
  rate_limited: { action: 'retry', retryable: true, message: 'Too many requests. Wait a moment and try again.' },
  upstream_unavailable: { action: 'retry', retryable: true, message: RETRY_LATER },
  internal: { action: 'retry', retryable: true, message: RETRY_LATER },
};

/** For codes the client doesn't know (including `<product>.<code>`): the behaviour of the HTTP status. */
function statusRule(status: number): CodeRule {
  if (status === 401) return CODE_RULES.unauthenticated!;
  if (status === 403) return CODE_RULES.access_denied!;
  if (status === 404) return CODE_RULES.not_found!;
  if (status === 409) return CODE_RULES.session_busy!;
  if (status === 429) return CODE_RULES.rate_limited!;
  if (status === 408 || status >= 500) return { action: 'retry', retryable: true, message: RETRY_LATER };
  return { action: 'none', retryable: false, message: `Request failed (${status}).` };
}

export interface ErrorCodeInput {
  /** The envelope's `error.type` or the stream's `error_type`. */
  code?: string | null;
  /** The HTTP status, for REST errors. */
  status?: number;
  /** The server's message. Shown as is: the standard makes `error.message` user-facing. */
  message?: string | null;
  retryAfter?: number | null;
  requestId?: string | null;
  details?: Record<string, unknown> | null;
}

/** Builds the UI's error from a code (first) and an HTTP status (second). */
export function errorInfoFromCode(input: ErrorCodeInput): ChatErrorInfo {
  const code = input.code ?? undefined;
  const known = code ? CODE_RULES[code] : undefined;
  // Unknown stream codes have no status to fall back on; a stream error is worth retrying.
  const rule = known ?? (input.status !== undefined ? statusRule(input.status) : { ...CODE_RULES.internal!, message: '' });
  const source = input.details?.source;
  return {
    type: code ?? (input.status !== undefined ? `http_${input.status}` : 'unknown'),
    message: input.message || rule.message || 'Something went wrong.',
    retryAfter: input.retryAfter ?? null,
    retryable: rule.retryable,
    action: rule.action,
    ...(input.status !== undefined ? { status: input.status } : {}),
    requestId: input.requestId ?? null,
    details: input.details ?? null,
    ...(typeof source === 'string' && source ? { sourceId: source } : {}),
  };
}

/** Normalizes anything thrown into something the UI can show and act on. */
export function toErrorInfo(error: unknown): ChatErrorInfo {
  if (error instanceof ChatApiError) {
    // Only a standard envelope promises a user-facing message; older bodies get the status's text.
    const hasEnvelope = error.errorType !== null;
    return errorInfoFromCode({
      code: error.errorType,
      status: error.status,
      message: hasEnvelope ? (readErrorEnvelope(error.body).message ?? error.message) : legacyHttpMessage(error),
      retryAfter: error.retryAfter,
      requestId: error.requestId,
      details: error.details,
    });
  }
  if (error instanceof ChatStreamError) {
    return errorInfoFromCode({
      code: error.errorType,
      message: error.message,
      retryAfter: error.retryAfter,
      requestId: error.requestId,
      details: error.details,
    });
  }
  if (error instanceof ChatError) {
    const retryable = ['network', 'timeout', 'protocol_error'].includes(error.code);
    return { type: error.code, message: error.message, retryable, action: retryable ? 'retry' : 'none' };
  }
  if (isAbortError(error)) {
    return { type: 'aborted', message: 'The request was stopped.', retryable: true, action: 'retry' };
  }
  if (error instanceof TypeError) {
    return { type: 'network', message: 'Could not reach the chat service.', retryable: true, action: 'retry' };
  }
  const message = error instanceof Error && error.message ? error.message : 'Something went wrong.';
  return { type: 'unknown', message, retryable: true, action: 'retry' };
}

function legacyHttpMessage(error: ChatApiError): string {
  if (error.status === 401) return CODE_RULES.unauthenticated!.message;
  if (error.status === 403) return "You don't have access to this conversation.";
  if (error.status === 404) return CODE_RULES.not_found!.message;
  if (error.status === 429) return CODE_RULES.rate_limited!.message;
  if (error.status >= 500) return RETRY_LATER;
  return error.message;
}
