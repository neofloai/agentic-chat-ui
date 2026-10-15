export type { ChatAdapter, SendMessageOptions, ProtocolWarning } from './adapter';
export {
  createRestAdapter,
  DEFAULT_REST_PATHS,
  type RestAdapterOptions,
  type RestPaths,
  type RetryOptions,
  type UnauthorizedInfo,
} from './rest-adapter';
export { SseParser, readSse, type SseMessage } from './sse';
export {
  ChatError,
  ChatApiError,
  ChatStreamError,
  ChatProtocolError,
  ChatTimeoutError,
  isAbortError,
  readErrorEnvelope,
  type ErrorEnvelopeFields,
} from './errors';
