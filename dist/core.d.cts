import { d as StreamEvent, f as ContentBlock, C as ConversationBootstrap, b as ConversationDetail, W as WireMessage, a as ConversationSummary, S as SendMessageBody, v as WorkflowContext, A as Attachment, j as Source, H as HitlDecision } from './types-BYSMQU8i.cjs';
export { e as CancelResult, l as CheckpointEvent, k as ContentBlockDelta, m as ContentBlockDeltaEvent, n as ContentBlockStartEvent, o as ContentBlockStopEvent, c as ConversationPatch, D as DefaultMessage, E as ErrorEvent, p as HitlMessage, I as ISODateString, M as MessageDeltaEvent, q as MessageRole, r as MessageStartEvent, s as MessageStopEvent, P as PROTOCOL_VERSION, t as StatusEvent, g as StopReason, u as StreamEventType, i as SuggestedPrompt, U as UpdatedConversation, h as Usage, w as WorkflowName } from './types-BYSMQU8i.cjs';
import { C as ChatAdapter, P as ProtocolWarning } from './adapter-CA1yC1wF.cjs';
export { S as SendMessageOptions } from './adapter-CA1yC1wF.cjs';
import { T as ThreadMeta, b as ChatMessage, P as PendingCheckpoint, j as ConversationItem, h as ConversationGroup, i as ConversationGroupKey, S as ScopeGroup, n as ScopeSelection, c as ComposerAttachment, k as ConversationsState, o as ScopeState, p as ThreadState, g as ComposerState, D as DeltaHandler, d as ChatErrorInfo } from './stream-reducer-BydUyRD3.cjs';
export { B as BlockStatus, C as ChatBlock, a as CheckpointState, e as CheckpointStatus, f as ComposerAttachmentStatus, L as LoadStatus, M as MessageStatus, R as ReduceContext, l as RunState, w as RunStatus, m as ScopeItem, q as createThreadState, r as defaultApplyDelta, s as emptyMeta, t as interruptRun, u as reduceStreamEvent, v as textFieldOf } from './stream-reducer-BydUyRD3.cjs';

declare function isContentBlock(v: unknown): v is ContentBlock;
type ParseResult = {
    ok: true;
    event: StreamEvent;
} | {
    ok: false;
    reason: 'unknown_type';
    type: string;
} | {
    ok: false;
    reason: 'invalid';
    type: string;
    detail: string;
};
/**
 * Validates one decoded SSE payload. The event type is read from the payload's `type`,
 * falling back to the SSE `event:` name.
 *
 * Unknown types come back as `unknown_type` so callers can ignore them: a newer backend
 * adding an event must never break an older client.
 */
declare function parseStreamEvent(payload: unknown, eventName?: string): ParseResult;

interface RestPaths {
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
     * Called once when a request gets a 401. Refresh the token and return `true` to retry
     * that request one time; return `false` to let the 401 surface as an error.
     */
    onUnauthorized?: () => boolean | Promise<boolean>;
    /** Retry policy for idempotent calls. Message POSTs are never retried. `false` disables it. */
    retry?: RetryOptions | false;
    credentials?: RequestCredentials;
    /** Timeout for REST calls (not the message stream). @default 30000 */
    timeoutMs?: number;
}
/** A `ChatAdapter` for any backend that implements the chat-layer schema v1. */
declare function createRestAdapter(options: RestAdapterOptions): ChatAdapter;

/** One dispatched server-sent event. */
interface SseMessage {
    event: string;
    data: string;
    id?: string;
    retry?: number;
}
/**
 * Incremental SSE parser that follows the WHATWG event-stream rules. Feed it decoded text in
 * any chunking; it returns the events completed by that chunk.
 *
 * It handles `\n`, `\r\n` and bare `\r` line endings (including a `\r\n` split across two
 * chunks), multi-line `data:`, comment/heartbeat lines, a leading BOM, and fields with no colon.
 */
declare class SseParser {
    private buffer;
    private pendingCR;
    private eventName;
    private data;
    private hasData;
    private lastId;
    private retry;
    private started;
    feed(chunk: string): SseMessage[];
    /**
     * Call at end of stream. The spec discards an event that has no trailing blank line, but
     * plenty of servers skip it on the last event, so a pending event with data is dispatched.
     */
    flush(): SseMessage[];
    private processLine;
    private dispatch;
}
/** Reads a byte stream (e.g. `response.body`) and yields SSE messages as they complete. */
declare function readSse(stream: ReadableStream<Uint8Array>, signal?: AbortSignal): AsyncGenerator<SseMessage>;

/** Base class for every error the library throws, so hosts can `instanceof ChatError`. */
declare class ChatError extends Error {
    readonly name: string;
    readonly code: string;
    constructor(code: string, message: string, options?: {
        cause?: unknown;
    });
}
/** A REST call came back non-2xx. */
declare class ChatApiError extends ChatError {
    readonly name = "ChatApiError";
    readonly status: number;
    readonly body: unknown;
    /** Seconds, from a `Retry-After` header when the server sent one. */
    readonly retryAfter: number | null;
    constructor(status: number, message: string, body: unknown, retryAfter?: number | null);
}
/** The server sent an SSE `error` event. */
declare class ChatStreamError extends ChatError {
    readonly name = "ChatStreamError";
    readonly errorType: string;
    readonly retryAfter: number | null;
    constructor(errorType: string, message: string, retryAfter?: number | null);
}
/** The response broke the protocol (for example, a stream with no body). */
declare class ChatProtocolError extends ChatError {
    readonly name = "ChatProtocolError";
    constructor(message: string, options?: {
        cause?: unknown;
    });
}
/** No event arrived for longer than the idle timeout. */
declare class ChatTimeoutError extends ChatError {
    readonly name = "ChatTimeoutError";
    constructor(message?: string);
}
declare function isAbortError(error: unknown): boolean;

type MaybePromise<T> = T | Promise<T>;
/**
 * Where persisted chat state lives. Sync (`localStorage`) and async (IndexedDB, localforage,
 * an encrypted store) implementations are both fine.
 */
interface StorageAdapter {
    getItem(key: string): MaybePromise<string | null>;
    setItem(key: string, value: string): MaybePromise<void>;
    removeItem(key: string): MaybePromise<void>;
    /** Lists stored keys. Optional, but it lets `clear()` find every key this library wrote. */
    keys?(): MaybePromise<string[]>;
}
type StorageKind = 'session' | 'local' | 'memory' | 'none';
interface MemoryStorage extends StorageAdapter {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    keys(): string[];
}
declare function createMemoryStorage(): MemoryStorage;
/** Wraps `localStorage` / `sessionStorage`. Returns `null` when unavailable (SSR, blocked, private mode). */
declare function createWebStorage(kind: 'local' | 'session'): (StorageAdapter & {
    keys(): string[];
    raw: Storage;
}) | null;
/**
 * Guards a storage against quota and permission errors. A failed write lands in an in-memory
 * shadow instead, so the session keeps working; `onError` is told once.
 */
declare function createSafeStorage(inner: StorageAdapter, onError: (error: unknown) => void): StorageAdapter;

interface PersistOptions {
    /** The open conversation, so a reload lands back on it. @default true */
    activeConversation?: boolean;
    /** Unsent composer text and uploaded attachments, per conversation. @default true */
    drafts?: boolean;
    /** UI preferences (history panel open, model, scope selection). @default true */
    preferences?: boolean;
    /**
     * The conversation list and a cache of recent message histories, for instant loads.
     * Off by default because chat content can be sensitive; set `scope` when you turn it on.
     * @default false
     */
    history?: boolean;
}
interface PersistenceOptions {
    /** @default 'session' */
    storage?: StorageKind | StorageAdapter;
    /** Key prefix. @default 'neoflo-chat' */
    namespace?: string;
    /**
     * Partitions storage per user, e.g. a hashed user id. Two accounts on one device never
     * read each other's drafts or history.
     */
    scope?: string;
    persist?: PersistOptions;
    /** How many message histories the cache keeps (LRU). @default 20 */
    maxCachedConversations?: number;
    /** Drop entries older than this many ms. */
    ttl?: number;
    /** Write debounce. @default 400 */
    debounceMs?: number;
}
interface ResolvedPersistence {
    kind: StorageKind | 'custom';
    persist: Required<PersistOptions>;
    maxCachedConversations: number;
}
interface Persister {
    readonly enabled: boolean;
    readonly config: ResolvedPersistence;
    /** Sync for sync storages, a promise for async ones. */
    read<T>(name: string): MaybePromise<T | undefined>;
    /** Debounced. */
    write(name: string, data: unknown): void;
    remove(name: string): void;
    flush(): Promise<void>;
    /** Removes every key this persister owns (call it on logout). */
    clear(): Promise<void>;
    /** Fires when another tab changed a key (local storage only). */
    onExternalChange(listener: (name: string) => void): () => void;
    dispose(): void;
}
declare function createPersister(options: PersistenceOptions | false | undefined, onError?: (error: unknown) => void, now?: () => number): Persister;

type Listener = () => void;
interface SetStateOptions {
    /**
     * Coalesce listener notifications to one per animation frame. The state itself updates
     * immediately, so `getState()` is always current; only re-render pressure is reduced.
     */
    batch?: boolean;
}
interface Store<T> {
    getState(): T;
    setState(next: T | ((prev: T) => T), options?: SetStateOptions): void;
    subscribe(listener: Listener): () => void;
    /** Deliver any batched notification now. */
    flush(): void;
    /** How many listeners are subscribed (used to avoid evicting state something is showing). */
    listenerCount(): number;
}
type Scheduler = (callback: () => void) => () => void;
declare const frameScheduler: Scheduler;
/** Delivers notifications synchronously. Used in tests and SSR. */
declare const syncScheduler: Scheduler;
/** A tiny observable store. Framework-free; React binds to it with `useSyncExternalStore`. */
declare function createStore<T>(initial: T, scheduler?: Scheduler): Store<T>;

declare function toConversationItem(s: ConversationSummary): ConversationItem;
declare function metaFromBootstrap(b: ConversationBootstrap): ThreadMeta;
declare function normalizeMessages(wire: WireMessage[]): {
    messages: ChatMessage[];
    pendingCheckpoint?: PendingCheckpoint;
};
declare function normalizeConversationDetail(detail: ConversationDetail, previous?: ThreadMeta): {
    meta: ThreadMeta;
    messages: ChatMessage[];
    pendingCheckpoint?: PendingCheckpoint;
};

declare function sortConversations(items: ConversationItem[]): ConversationItem[];
declare function groupKeyFor(updatedAt: string, now?: number): ConversationGroupKey;
/** Groups a sorted list by recency, dropping empty groups. */
declare function groupConversations(items: ConversationItem[], now?: number): ConversationGroup[];
/** Case- and accent-insensitive title search. */
declare function filterConversations(items: ConversationItem[], query: string): ConversationItem[];

/**
 * The composer's workflow picker. Groups are workspaces, items are workflows (the Figma
 * "SourcePicker"). The host supplies the catalog because schema v1 has no endpoint for it.
 */
interface ScopeConfig {
    groups: ScopeGroup[] | (() => ScopeGroup[] | Promise<ScopeGroup[]>);
    /** What's selected before the user touches the picker. @default 'all' */
    defaultSelection?: 'all' | 'none' | ScopeSelection;
    /**
     * Turns the selection into request fields. The default builds `workflow_context`
     * (`[{ workflow_name: itemId, workspace_id: [groupIds…], context: {} }]`).
     */
    toRequest?: (selection: ScopeSelection, groups: ScopeGroup[]) => Partial<Pick<SendMessageBody, 'workflow_context' | 'sources'>>;
}
declare function selectAll(groups: ScopeGroup[]): ScopeSelection;
declare function defaultScopeToRequest(selection: ScopeSelection, groups: ScopeGroup[]): {
    workflow_context?: WorkflowContext[];
};
interface ScopeSummary {
    selected: number;
    total: number;
    allSelected: boolean;
}
declare function summarizeScope(selection: ScopeSelection, groups: ScopeGroup[]): ScopeSummary;
/** Merges contexts by `workflow_name`: workspace ids are unioned, context bags shallow-merged. */
declare function mergeWorkflowContexts(...lists: (WorkflowContext[] | undefined | null)[]): WorkflowContext[] | undefined;

type Unsubscribe = () => void;

declare const NEW_THREAD_KEY = "__new__";
interface UploadOptions {
    signal: AbortSignal;
    /** Report progress as a fraction from 0 to 1. */
    onProgress: (fraction: number) => void;
}
interface AttachmentOptions {
    /** Uploads a file wherever your app stores files and returns its schema `Attachment`. */
    upload: (file: File, options: UploadOptions) => Promise<Attachment>;
    /** The file input's `accept`, e.g. `.pdf,.xlsx,image/*`. */
    accept?: string;
    /** Bytes. */
    maxSize?: number;
    /** @default 10 */
    maxFiles?: number;
}
interface RuntimeWarning {
    code: ProtocolWarning['code'] | 'storage_error' | 'attachment_rejected' | 'attachments_uploading' | 'busy' | 'awaiting_decision' | 'unknown_checkpoint' | 'revalidate_failed' | 'cancel_failed';
    message: string;
    data?: unknown;
}
interface ChatRuntimeOptions {
    adapter: ChatAdapter;
    /** Local persistence. `false` turns it off. Defaults to session storage. */
    persistence?: PersistenceOptions | false;
    /** The composer's workflow picker. */
    scope?: ScopeConfig;
    /** Extra context from the host page, merged into every send (e.g. the invoice on screen). */
    workflowContext?: WorkflowContext[] | (() => WorkflowContext[] | undefined);
    /** Enables the attach button. The schema has no upload endpoint, so the host uploads. */
    attachments?: AttachmentOptions;
    /**
     * `eager` creates the conversation as soon as a new chat opens, which is what gets the
     * server's greeting and suggested prompts. `lazy` waits for the first message.
     * @default 'eager'
     */
    conversationCreation?: 'eager' | 'lazy';
    hitl?: {
        /** Whether the user can type while a card waits for a decision. @default 'disabled' */
        composerWhilePaused?: 'disabled' | 'enabled';
    };
    /** A stream that sends nothing for this long is treated as dropped. @default 60000 */
    streamIdleTimeoutMs?: number;
    /** How many conversations to keep in memory. @default 20 */
    maxThreads?: number;
    /** Refresh the history list when the window regains focus. @default true */
    refreshOnFocus?: boolean;
    onEvent?: (event: StreamEvent, context: {
        conversationId: string;
    }) => void;
    onError?: (error: ChatErrorInfo, raw: unknown) => void;
    onWarning?: (warning: RuntimeWarning) => void;
    /** @internal Notification scheduler; tests pass a sync one. */
    scheduler?: Scheduler;
    /** @internal Clock. */
    now?: () => number;
}
interface SendOptions {
    /** Defaults to the active conversation. */
    conversationId?: string | null;
    /** Per-turn source override. */
    sources?: Source[];
    /** Defaults to the composer's uploaded attachments. */
    attachments?: Attachment[];
    workflowContext?: WorkflowContext[];
}
interface ThreadHandle {
    readonly key: string;
    readonly store: Store<ThreadState>;
    readonly composer: Store<ComposerState>;
}
interface SessionState {
    /** The thread key on screen: a conversation id, or `__new__` for an unsaved chat. */
    activeKey: string;
    activeId: string | null;
    /** Persisted state has been read. */
    hydrated: boolean;
}
type RuntimeEvents = {
    event: [StreamEvent, {
        conversationId: string;
    }];
    error: [ChatErrorInfo, unknown];
    warning: [RuntimeWarning];
    activeChange: [string | null];
};
interface AddAttachmentsResult {
    added: ComposerAttachment[];
    rejected: {
        file: File;
        reason: string;
    }[];
}
interface ChatRuntime {
    readonly adapter: ChatAdapter;
    readonly conversations: Store<ConversationsState>;
    readonly session: Store<SessionState>;
    readonly scope: Store<ScopeState>;
    readonly preferences: Store<Record<string, unknown>>;
    readonly config: {
        conversationCreation: 'eager' | 'lazy';
        composerWhilePaused: 'disabled' | 'enabled';
        attachments?: Pick<AttachmentOptions, 'accept' | 'maxSize' | 'maxFiles'>;
        hasScope: boolean;
    };
    /** Hydrates, loads history and opens the active chat. Safe to call more than once. */
    start(): Promise<void>;
    getThread(conversationId: string | null): ThreadHandle;
    activeThread(): ThreadHandle;
    newConversation(): Promise<string | null>;
    selectConversation(conversationId: string | null): Promise<void>;
    refreshConversations(): Promise<void>;
    renameConversation(conversationId: string, title: string): Promise<void>;
    archiveConversation(conversationId: string, archived: boolean): Promise<void>;
    deleteConversation(conversationId: string): Promise<void>;
    setModel(model: string, conversationId?: string): Promise<void>;
    setDefaultSources(sources: Source[], conversationId?: string): Promise<void>;
    send(text: string, options?: SendOptions): Promise<void>;
    resume(checkpointId: string, decision: HitlDecision, options?: {
        conversationId?: string;
    }): Promise<void>;
    cancel(conversationId?: string | null): Promise<void>;
    retry(conversationId?: string | null): Promise<void>;
    canRetry(conversationId?: string | null): boolean;
    setDraft(text: string, conversationId?: string | null): void;
    addAttachments(files: Iterable<File>, conversationId?: string | null): AddAttachmentsResult;
    removeAttachment(attachmentId: string, conversationId?: string | null): void;
    setScopeSelection(selection: ScopeSelection): void;
    setScopeGroups(groups: ScopeGroup[]): void;
    setPreference(key: string, value: unknown): void;
    /** Lets block definitions take over delta handling. Set by `ChatProvider`. */
    setDeltaResolver(resolver: ((block: ContentBlock) => DeltaHandler | undefined) | undefined): void;
    on<K extends keyof RuntimeEvents>(type: K, listener: (...args: RuntimeEvents[K]) => void): Unsubscribe;
    readonly persistence: {
        readonly enabled: boolean;
        /** Removes everything this chat stored locally. Call it on logout. */
        clear(): Promise<void>;
        flush(): Promise<void>;
    };
    dispose(): void;
}
declare function formatBytes(bytes: number): string;
/** Creates the chat engine. Framework-free; `ChatProvider` binds it to React. */
declare function createChatRuntime(options: ChatRuntimeOptions): ChatRuntime;

/** Normalizes anything thrown into something the UI can show and act on. */
declare function toErrorInfo(error: unknown): ChatErrorInfo;

export { type AddAttachmentsResult, Attachment, type AttachmentOptions, ChatAdapter, ChatApiError, ChatError, ChatErrorInfo, ChatMessage, ChatProtocolError, type ChatRuntime, type ChatRuntimeOptions, ChatStreamError, ChatTimeoutError, ComposerAttachment, ComposerState, ContentBlock, ConversationBootstrap, ConversationDetail, ConversationGroup, ConversationGroupKey, ConversationItem, ConversationSummary, ConversationsState, DEFAULT_REST_PATHS, DeltaHandler, HitlDecision, type Listener, type MaybePromise, type MemoryStorage, NEW_THREAD_KEY, type ParseResult, PendingCheckpoint, type PersistOptions, type PersistenceOptions, type Persister, ProtocolWarning, type ResolvedPersistence, type RestAdapterOptions, type RestPaths, type RetryOptions, type RuntimeEvents, type RuntimeWarning, type Scheduler, type ScopeConfig, ScopeGroup, ScopeSelection, ScopeState, type ScopeSummary, SendMessageBody, type SendOptions, type SessionState, type SetStateOptions, Source, type SseMessage, SseParser, type StorageAdapter, type StorageKind, type Store, StreamEvent, type ThreadHandle, ThreadMeta, ThreadState, type UploadOptions, WireMessage, WorkflowContext, createChatRuntime, createMemoryStorage, createPersister, createRestAdapter, createSafeStorage, createStore, createWebStorage, defaultScopeToRequest, filterConversations, formatBytes, frameScheduler, groupConversations, groupKeyFor, isAbortError, isContentBlock, mergeWorkflowContexts, metaFromBootstrap, normalizeConversationDetail, normalizeMessages, parseStreamEvent, readSse, selectAll, sortConversations, summarizeScope, syncScheduler, toConversationItem, toErrorInfo };
