import { C as ChatAdapter } from './adapter-CLjeqFDx.js';

interface RestPaths {
    config: string;
    createConversation: string;
    listConversations: string;
    conversation: (conversationId: string) => string;
    messages: (conversationId: string) => string;
    cancel: (conversationId: string) => string;
}
declare const DEFAULT_REST_PATHS: RestPaths;
interface RetryOptions {
    /** Extra attempts for idempotent calls on network errors, 5xx and 429. @default 2 */
    retries?: number;
    /** @default 300 */
    baseDelayMs?: number;
    /** @default 4000 */
    maxDelayMs?: number;
}
/** What `onUnauthorized` gets: the 401's error code tells the host where to send the user. */
interface UnauthorizedInfo {
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
interface RestAdapterOptions {
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
/** A `ChatAdapter` for any backend on the Neoflo chat standard (endpoints 0–7). */
declare function createRestAdapter(options: RestAdapterOptions): ChatAdapter;

export { DEFAULT_REST_PATHS as D, type RestPaths as R, type UnauthorizedInfo as U, type RestAdapterOptions as a, type RetryOptions as b, createRestAdapter as c };
