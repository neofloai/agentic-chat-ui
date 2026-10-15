import { e as StreamEvent, g as ContentBlock, a as ConversationBootstrap, c as ConversationDetail, W as WireMessage, b as ConversationSummary, k as Source, C as ChatConfig, s as ConfigWorkflow, S as SendMessageBody, Q as WorkflowContext, A as Attachment, E as Ext, H as HitlDecision } from './types-CIFoqVVK.js';
export { f as CancelResult, n as ChatCapabilities, o as ChatLimits, p as CheckpointEvent, q as ConfigModel, r as ConfigSource, m as ConnectionState, t as ConnectionStatus, l as ContentBlockDelta, u as ContentBlockDeltaEvent, v as ContentBlockStartEvent, w as ContentBlockStopEvent, d as ConversationPatch, D as DefaultMessage, x as ERROR_CODES, y as ErrorCode, z as ErrorEnvelope, B as ErrorEvent, F as HitlMessage, I as ISODateString, M as MessageDeltaEvent, G as MessageRole, J as MessageStartEvent, K as MessageStopEvent, P as PROTOCOL_VERSION, L as STANDARD_REVISION, N as StatusEvent, h as StopReason, O as StreamEventType, j as SuggestedPrompt, U as UpdatedConversation, i as Usage, R as WorkflowName } from './types-CIFoqVVK.js';
import { C as ChatAdapter, P as ProtocolWarning } from './adapter-CLjeqFDx.js';
export { S as SendMessageOptions } from './adapter-CLjeqFDx.js';
export { D as DEFAULT_REST_PATHS, a as RestAdapterOptions, R as RestPaths, b as RetryOptions, U as UnauthorizedInfo, c as createRestAdapter } from './rest-adapter-RF-KDV8r.js';
import { s as ThreadMeta, b as ChatMessage, P as PendingCheckpoint, m as ConversationItem, k as ConversationGroup, l as ConversationGroupKey, j as ConfigStatus, e as Capabilities, S as ScopeGroup, q as ScopeSelection, c as ComposerAttachment, f as ChatConfigState, n as ConversationsState, r as ScopeState, t as ThreadState, i as ComposerState, D as DeltaHandler, d as ChatErrorInfo } from './stream-reducer-E9TDBSmi.js';
export { B as BlockStatus, C as ChatBlock, a as CheckpointState, g as CheckpointStatus, h as ComposerAttachmentStatus, E as ErrorAction, L as LoadStatus, M as MessageStatus, R as ReduceContext, o as RunState, F as RunStatus, p as ScopeItem, T as TOOL_CALL_TYPES, u as createThreadState, v as defaultApplyDelta, w as emptyMeta, x as interruptRun, y as linkToolResults, z as reduceStreamEvent, A as textFieldOf } from './stream-reducer-E9TDBSmi.js';

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
/** The fields of a standard error envelope, `{ "error": { type, message, … } }`. */
interface ErrorEnvelopeFields {
    type: string | null;
    message: string | null;
    retryAfter: number | null;
    requestId: string | null;
    details: Record<string, unknown> | null;
}
/** Reads the standard error envelope. Every field is `null` when the body doesn't have it. */
declare function readErrorEnvelope(body: unknown): ErrorEnvelopeFields;
/** A REST call came back non-2xx. */
declare class ChatApiError extends ChatError {
    readonly name = "ChatApiError";
    readonly status: number;
    readonly body: unknown;
    /** Seconds, from the envelope's `retry_after` or the `Retry-After` header. */
    readonly retryAfter: number | null;
    /** The envelope's `error.type` (`session_busy`, `askneo.gate_required`…), when the server sent one. */
    readonly errorType: string | null;
    /** From the envelope or the `X-Request-Id` header. */
    readonly requestId: string | null;
    readonly details: Record<string, unknown> | null;
    constructor(status: number, message: string, body: unknown, retryAfter?: number | null, extra?: {
        requestId?: string | null;
    });
}
/** The server sent an SSE `error` event. */
declare class ChatStreamError extends ChatError {
    readonly name = "ChatStreamError";
    readonly errorType: string;
    readonly retryAfter: number | null;
    readonly requestId: string | null;
    readonly details: Record<string, unknown> | null;
    constructor(errorType: string, message: string, retryAfter?: number | null, extra?: {
        requestId?: string | null;
        details?: Record<string, unknown> | null;
    });
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

/**
 * The conversation's model: `selected_model`, or the string `model` an older backend sends on
 * endpoints 2–4. A `model` array is the old endpoint-1 catalog, not a selection.
 */
declare function selectedModelOf(c: Pick<ConversationSummary, 'selected_model' | 'model'>): string | undefined;
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
 * The host's feature switches. Before a backend has a config endpoint they decide what the UI
 * shows; once it has one, they can only turn more off (`false` always wins).
 */
interface CapabilityOverrides {
    hitl?: boolean;
    attachments?: boolean;
    workflowContext?: boolean;
    archive?: boolean;
    cancel?: 'server' | 'disconnect';
    perTurnModel?: boolean;
    perTurnSources?: boolean;
}
/**
 * Reads endpoint 0 without trusting its shape: bad entries are dropped, missing lists become
 * empty. Returns `null` when the body isn't a config at all.
 */
declare function normalizeConfig(raw: unknown): ChatConfig | null;
/** What the UI may use: the backend's config first, the host's switches second, then defaults. */
declare function resolveCapabilities(status: ConfigStatus, config: ChatConfig | undefined, host?: CapabilityOverrides): Capabilities;
/**
 * The config's workflows as the scope picker's groups: one group per workspace, listing the
 * workflows available in it. The default mapping turns the selection into `workflow_context`.
 */
declare function scopeGroupsFromWorkflows(workflows: ConfigWorkflow[]): ScopeGroup[];
/**
 * Drops anything that looks like a credential from each source's `meta` before the library
 * keeps or stores it. Credentials belong on the server; the browser only keeps settings and
 * connection status.
 */
declare function stripCredentials(sources: Source[]): Source[];
/** F16: keeps only sources the config lists, when it lists any. */
declare function knownSources(sources: Source[], config: ChatConfig | undefined): {
    kept: Source[];
    dropped: string[];
};

/**
 * The composer's workflow picker. Groups are workspaces, items are workflows (the Figma
 * "SourcePicker"). The host supplies the catalog, or the runtime builds it from the config's `workflows`.
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
    code: ProtocolWarning['code'] | 'storage_error' | 'attachment_rejected' | 'attachments_uploading' | 'busy' | 'awaiting_decision' | 'unknown_checkpoint' | 'revalidate_failed' | 'cancel_failed' | 'config_failed' | 'feature_disabled' | 'unknown_source' | 'message_too_long' | 'duplicate_message';
    message: string;
    data?: unknown;
}
/** What `onConnectionRequired` gets when a send fails with `connection_required` or `connection_expired`. */
interface ConnectionRequiredInfo {
    /** `details.source` from the error, e.g. `invoice_processing`. `null` if the server didn't say. */
    sourceId: string | null;
    code: string;
    message: string;
    conversationId: string | null;
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
     * Feature switches. Until the backend serves `GET /v1/chat/config` they decide what the UI
     * shows; once it does, the config decides and these can only turn more off.
     */
    capabilities?: CapabilityOverrides;
    /**
     * Called when a send fails because a connected system needs (re)connecting. Hand the
     * credential to your backend (for example `PUT /v1/connections/{sourceId}`) and return `true`:
     * the library then retries the message once. Return `false` to leave the error on screen,
     * where a Reconnect button calls this again.
     */
    onConnectionRequired?: (info: ConnectionRequiredInfo) => boolean | Promise<boolean>;
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
    /** Per-turn source override. Ids the config doesn't list are left out. */
    sources?: Source[];
    /** Defaults to the composer's uploaded attachments. */
    attachments?: Attachment[];
    workflowContext?: WorkflowContext[];
    /** A per-turn model. Defaults to the conversation's model when the backend takes one per turn. */
    model?: string;
    /** Product-only inputs, sent as the body's `ext`. */
    ext?: Ext;
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
    /** The backend's config (endpoint 0) and the capabilities the UI uses. */
    readonly chatConfig: Store<ChatConfigState>;
    readonly conversations: Store<ConversationsState>;
    readonly session: Store<SessionState>;
    readonly scope: Store<ScopeState>;
    readonly preferences: Store<Record<string, unknown>>;
    readonly config: {
        conversationCreation: 'eager' | 'lazy';
        composerWhilePaused: 'disabled' | 'enabled';
        attachments?: Pick<AttachmentOptions, 'accept' | 'maxSize' | 'maxFiles'>;
        hasScope: boolean;
        /** Whether a Reconnect button can do anything (`onConnectionRequired` is set). */
        canReconnect: boolean;
    };
    /** Loads the config, hydrates, loads history and opens the active chat. Safe to call more than once. */
    start(): Promise<void>;
    /** Fetches `GET /v1/chat/config` again. `start()` calls it once; the result is kept for the session. */
    loadConfig(): Promise<void>;
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
    /**
     * For a turn that failed with `connection_required` / `connection_expired`: calls
     * `onConnectionRequired`, and retries the message if it returns `true`. Resolves whether it retried.
     */
    reconnect(conversationId?: string | null): Promise<boolean>;
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

interface ErrorCodeInput {
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
declare function errorInfoFromCode(input: ErrorCodeInput): ChatErrorInfo;
/** Normalizes anything thrown into something the UI can show and act on. */
declare function toErrorInfo(error: unknown): ChatErrorInfo;

export { type AddAttachmentsResult, Attachment, type AttachmentOptions, Capabilities, type CapabilityOverrides, ChatAdapter, ChatApiError, ChatConfig, ChatConfigState, ChatError, ChatErrorInfo, ChatMessage, ChatProtocolError, type ChatRuntime, type ChatRuntimeOptions, ChatStreamError, ChatTimeoutError, ComposerAttachment, ComposerState, ConfigStatus, ConfigWorkflow, type ConnectionRequiredInfo, ContentBlock, ConversationBootstrap, ConversationDetail, ConversationGroup, ConversationGroupKey, ConversationItem, ConversationSummary, ConversationsState, DeltaHandler, type ErrorCodeInput, type ErrorEnvelopeFields, Ext, HitlDecision, type Listener, type MaybePromise, type MemoryStorage, NEW_THREAD_KEY, type ParseResult, PendingCheckpoint, type PersistOptions, type PersistenceOptions, type Persister, ProtocolWarning, type ResolvedPersistence, type RuntimeEvents, type RuntimeWarning, type Scheduler, type ScopeConfig, ScopeGroup, ScopeSelection, ScopeState, type ScopeSummary, SendMessageBody, type SendOptions, type SessionState, type SetStateOptions, Source, type SseMessage, SseParser, type StorageAdapter, type StorageKind, type Store, StreamEvent, type ThreadHandle, ThreadMeta, ThreadState, type UploadOptions, WireMessage, WorkflowContext, createChatRuntime, createMemoryStorage, createPersister, createSafeStorage, createStore, createWebStorage, defaultScopeToRequest, errorInfoFromCode, filterConversations, formatBytes, frameScheduler, groupConversations, groupKeyFor, isAbortError, isContentBlock, knownSources, mergeWorkflowContexts, metaFromBootstrap, normalizeConfig, normalizeConversationDetail, normalizeMessages, parseStreamEvent, readErrorEnvelope, readSse, resolveCapabilities, scopeGroupsFromWorkflows, selectAll, selectedModelOf, sortConversations, stripCredentials, summarizeScope, syncScheduler, toConversationItem, toErrorInfo };
