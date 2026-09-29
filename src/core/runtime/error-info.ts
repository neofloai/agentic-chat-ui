import { ChatApiError, ChatError, ChatStreamError, isAbortError } from '../transport/errors';
import type { ChatErrorInfo } from '../store/types';

/** Normalizes anything thrown into something the UI can show and act on. */
export function toErrorInfo(error: unknown): ChatErrorInfo {
  if (error instanceof ChatApiError) {
    return {
      type: error.code,
      message: friendlyHttpMessage(error),
      retryAfter: error.retryAfter,
      retryable: error.status >= 500 || error.status === 429 || error.status === 408,
    };
  }
  if (error instanceof ChatStreamError) {
    return { type: error.errorType, message: error.message, retryAfter: error.retryAfter, retryable: true };
  }
  if (error instanceof ChatError) {
    return { type: error.code, message: error.message, retryable: ['network', 'timeout', 'protocol_error'].includes(error.code) };
  }
  if (isAbortError(error)) {
    return { type: 'aborted', message: 'The request was stopped.', retryable: true };
  }
  if (error instanceof TypeError) {
    return { type: 'network', message: 'Could not reach the chat service.', retryable: true };
  }
  const message = error instanceof Error && error.message ? error.message : 'Something went wrong.';
  return { type: 'unknown', message, retryable: true };
}

function friendlyHttpMessage(error: ChatApiError): string {
  if (error.status === 401) return 'Your session has expired. Sign in again to keep chatting.';
  if (error.status === 403) return "You don't have access to this conversation.";
  if (error.status === 404) return 'This conversation no longer exists.';
  if (error.status === 429) return 'Too many requests. Wait a moment and try again.';
  if (error.status >= 500) return 'The chat service is having trouble. Try again in a moment.';
  return error.message;
}
