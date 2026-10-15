import { parseStreamEvent, isContentBlock } from '../protocol/events';
import type {
  CancelResult,
  ChatConfig,
  ContentBlock,
  ConversationBootstrap,
  ConversationDetail,
  ConversationPatch,
  ConversationSummary,
  SendMessageBody,
  StopReason,
  StreamEvent,
  UpdatedConversation,
} from '../protocol/types';
import type { ChatAdapter, SendMessageOptions } from './adapter';
import { ChatApiError, ChatError, ChatProtocolError, isAbortError, messageFromBody, readErrorEnvelope } from './errors';
import { readSse } from './sse';

export interface RestPaths {
  config: string;
  createConversation: string;
  listConversations: string;
  conversation: (conversationId: string) => string;
  messages: (conversationId: string) => string;
  cancel: (conversationId: string) => string;
}

export const DEFAULT_REST_PATHS: RestPaths = {
  config: '/v1/chat/config',
  createConversation: '/v1/conversation',
  listConversations: '/v1/conversations',
  conversation: (id) => `/v1/conversations/${encodeURIComponent(id)}`,
  messages: (id) => `/v1/conversations/${encodeURIComponent(id)}/messages`,
  cancel: (id) => `/v1/conversations/${encodeURIComponent(id)}/messages/cancel`,
};

export interface RetryOptions {
  /** Extra attempts for idempotent calls on network errors, 5xx and 429. @default 2 */
  retries?: number;
  /** @default 300 */
  baseDelayMs?: number;
  /** @default 4000 */
  maxDelayMs?: number;
}

/** What `onUnauthorized` gets: the 401's error code tells the host where to send the user. */
export interface UnauthorizedInfo {
  /**
   * The envelope's `error.type`: `unauthenticated` (sign in again), or a product code such as
   * `askneo.gate_required` or `askneo.workspace_required`. `null` when the body had none.
   */
  code: string | null;
  /** The server's message, when it sent one. */
  message: string | null;
  requestId: string | null;
  body: unknown;
}

export interface RestAdapterOptions {
  /** e.g. `https://api.example.com` — the `/v1/...` paths are appended. */
  baseUrl: string;
  /**
   * Headers for every request. Pass a function to read a fresh token each time:
   * `headers: async () => ({ Authorization: `Bearer ${await getToken()}` })`.
   */
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
  /** Custom fetch (tests, proxies, instrumentation). Defaults to the global one. */
  fetch?: typeof fetch;
  /** Override individual endpoint paths. */
  paths?: Partial<RestPaths>;
  /**
   * Called once when a request gets a 401, with the error code. Sign the user in again (or
   * send them to the gate or workspace picker the code names) and return `true` to retry that
   * request one time; return `false` to let the 401 surface as an error.
   */
  onUnauthorized?: (info: UnauthorizedInfo) => boolean | Promise<boolean>;
  /** Retry policy for idempotent calls. Message POSTs are never retried. `false` disables it. */
  retry?: RetryOptions | false;
  /** `'include'` sends the session cookie when the API is on another origin. */
  credentials?: RequestCredentials;
  /** Timeout for REST calls (not the message stream). @default 30000 */
  timeoutMs?: number;
}

interface SendInit {
  body?: unknown;
  accept?: string;
  signal?: AbortSignal;
  idempotent: boolean;
  timeout?: boolean;
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, (date - Date.now()) / 1000);
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
    const t = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** Links an optional caller signal with an optional timeout into one signal. */
function linkSignal(signal: AbortSignal | undefined, timeoutMs: number | undefined) {
  if (!timeoutMs) return { signal, cleanup: () => undefined };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException('The request timed out.', 'TimeoutError')), timeoutMs);
  const onAbort = () => controller.abort(signal?.reason);
  if (signal?.aborted) controller.abort(signal.reason);
  else signal?.addEventListener('abort', onAbort, { once: true });
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    },
  };
}

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => '');
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function readJson<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch (cause) {
    throw new ChatProtocolError('The server returned a response that is not valid JSON.', { cause });
  }
}

/** Turns a non-streamed JSON reply into the same events a stream would have produced. */
function* synthesizeEvents(json: unknown, conversationId: string): Generator<StreamEvent> {
  const root = (json && typeof json === 'object' ? json : {}) as Record<string, unknown>;
  const msg = (root.message && typeof root.message === 'object' ? root.message : root) as Record<string, unknown>;
  const messageId = typeof msg.message_id === 'string' ? msg.message_id : `msg_${Date.now().toString(36)}`;
  const content = Array.isArray(msg.content) ? msg.content.filter(isContentBlock) : [];
  yield { type: 'message_start', message_id: messageId, conversation_id: conversationId, run_id: '', persona: null };
  let index = 0;
  for (const raw of content) {
    const block: ContentBlock = { ...raw, category: typeof raw.category === 'string' ? raw.category : 'content' };
    yield { type: 'content_block_start', index, block };
    yield { type: 'content_block_stop', index, block };
    index++;
  }
  const stop = typeof msg.stop_reason === 'string' ? (msg.stop_reason as StopReason) : 'end_turn';
  yield {
    type: 'message_stop',
    message_id: messageId,
    model: typeof msg.model === 'string' ? msg.model : null,
    title: typeof root.title === 'string' ? root.title : null,
    stop_reason: stop,
  };
}

/** A `ChatAdapter` for any backend on the Neoflo chat standard (endpoints 0–7). */
export function createRestAdapter(options: RestAdapterOptions): ChatAdapter {
  const baseUrl = options.baseUrl.replace(/\/+$/, '');
  const paths: RestPaths = { ...DEFAULT_REST_PATHS, ...options.paths };
  const retry: Required<RetryOptions> =
    options.retry === false
      ? { retries: 0, baseDelayMs: 0, maxDelayMs: 0 }
      : { retries: 2, baseDelayMs: 300, maxDelayMs: 4000, ...options.retry };
  const timeoutMs = options.timeoutMs ?? 30_000;
  const doFetch: typeof fetch = options.fetch ?? ((input, init) => globalThis.fetch(input, init));

  const backoff = (attempt: number) => {
    const exp = Math.min(retry.maxDelayMs, retry.baseDelayMs * 2 ** attempt);
    return exp / 2 + Math.random() * (exp / 2); // jittered
  };

  async function buildHeaders(extra: Record<string, string>): Promise<Headers> {
    const source = typeof options.headers === 'function' ? await options.headers() : options.headers;
    const headers = new Headers(source);
    for (const [k, v] of Object.entries(extra)) if (!headers.has(k)) headers.set(k, v);
    return headers;
  }

  async function send(method: string, path: string, init: SendInit): Promise<Response> {
    let attempt = 0;
    let refreshed = false;
    for (;;) {
      const extra: Record<string, string> = { Accept: init.accept ?? 'application/json' };
      if (init.body !== undefined) extra['Content-Type'] = 'application/json';
      const headers = await buildHeaders(extra);
      const linked = linkSignal(init.signal, init.timeout === false ? undefined : timeoutMs);
      let res: Response;
      try {
        res = await doFetch(baseUrl + path, {
          method,
          headers,
          body: init.body === undefined ? undefined : JSON.stringify(init.body),
          signal: linked.signal,
          credentials: options.credentials,
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
          timedOut ? 'timeout' : 'network',
          timedOut ? 'The chat service took too long to respond.' : 'Could not reach the chat service.',
          { cause: error },
        );
      }
      // The stream keeps reading after this returns, so only REST calls clear their timer here.
      if (init.timeout !== false) linked.cleanup();

      const requestId = res.headers.get('x-request-id');

      if (res.status === 401 && options.onUnauthorized && !refreshed) {
        refreshed = true;
        const body = await readBody(res);
        const envelope = readErrorEnvelope(body);
        const info: UnauthorizedInfo = {
          code: envelope.type,
          message: envelope.message,
          requestId: envelope.requestId ?? requestId,
          body,
        };
        if (await options.onUnauthorized(info)) continue;
        throw new ChatApiError(
          401,
          messageFromBody(body, 'Your session has expired. Sign in again to keep chatting.'),
          body,
          null,
          {
            requestId,
          },
        );
      }

      if (!res.ok) {
        const retryAfter = parseRetryAfter(res.headers.get('retry-after'));
        if (init.idempotent && attempt < retry.retries && (res.status >= 500 || res.status === 429)) {
          await res.body?.cancel().catch(() => undefined);
          const wait = retryAfter !== null ? Math.min(retryAfter * 1000, retry.maxDelayMs) : backoff(attempt);
          await sleep(wait, init.signal);
          attempt++;
          continue;
        }
        const body = await readBody(res);
        throw new ChatApiError(res.status, messageFromBody(body, `Request failed (${res.status}).`), body, retryAfter, {
          requestId,
        });
      }
      return res;
    }
  }

  return {
    async getConfig() {
      try {
        const res = await send('GET', paths.config, { idempotent: true });
        const json = await readJson<ChatConfig | undefined>(res);
        return json && typeof json === 'object' ? json : null;
      } catch (error) {
        // No config endpoint: the backend predates it. The runtime falls back to the host's switches.
        if (error instanceof ChatApiError && (error.status === 404 || error.status === 405)) return null;
        throw error;
      }
    },

    async createConversation() {
      const res = await send('POST', paths.createConversation, { idempotent: false });
      return readJson<ConversationBootstrap>(res);
    },

    async listConversations() {
      const res = await send('GET', paths.listConversations, { idempotent: true });
      const json = await readJson<{ conversations?: ConversationSummary[] } | ConversationSummary[]>(res);
      if (Array.isArray(json)) return json;
      return Array.isArray(json?.conversations) ? json.conversations : [];
    },

    async getConversation(conversationId) {
      const res = await send('GET', paths.conversation(conversationId), { idempotent: true });
      return readJson<ConversationDetail>(res);
    },

    async updateConversation(conversationId, patch: ConversationPatch) {
      const res = await send('PATCH', paths.conversation(conversationId), { body: patch, idempotent: true });
      return readJson<UpdatedConversation>(res);
    },

    async deleteConversation(conversationId) {
      try {
        await send('DELETE', paths.conversation(conversationId), { idempotent: true });
      } catch (error) {
        // Already gone is the outcome the caller wanted.
        if (error instanceof ChatApiError && error.status === 404) return;
        throw error;
      }
    },

    async *sendMessage(conversationId, body: SendMessageBody, { signal, onWarning }: SendMessageOptions) {
      const res = await send('POST', paths.messages(conversationId), {
        body: { ...body, stream: true },
        accept: 'text/event-stream',
        signal,
        idempotent: false,
        timeout: false,
      });
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('text/event-stream') && contentType.includes('json')) {
        onWarning?.({ code: 'non_stream_response', message: 'The server answered with JSON instead of a stream.' });
        yield* synthesizeEvents(await readJson<unknown>(res), conversationId);
        return;
      }
      if (!res.body) throw new ChatProtocolError('The response had no body to stream.');

      for await (const msg of readSse(res.body, signal)) {
        if (!msg.data || msg.data === '[DONE]') continue;
        let payload: unknown;
        try {
          payload = JSON.parse(msg.data);
        } catch {
          onWarning?.({ code: 'malformed_event', message: `Could not parse a "${msg.event}" event.`, data: msg.data });
          continue;
        }
        const parsed = parseStreamEvent(payload, msg.event === 'message' ? undefined : msg.event);
        if (parsed.ok) yield parsed.event;
        else if (parsed.reason === 'unknown_type')
          onWarning?.({ code: 'unknown_event', message: `Ignored unknown event "${parsed.type}".`, data: payload });
        else
          onWarning?.({
            code: 'invalid_event',
            message: `Ignored an invalid "${parsed.type}" event: ${parsed.detail}.`,
            data: payload,
          });
      }
    },

    async cancelMessage(conversationId, messageId) {
      const res = await send('POST', paths.cancel(conversationId), {
        body: { message_id: messageId },
        idempotent: true,
      });
      const json = await readJson<CancelResult | undefined>(res);
      return { status: Boolean(json?.status) };
    },
  };
}
