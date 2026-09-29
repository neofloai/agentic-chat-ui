import { f as ContentBlock, H as HitlDecision, i as SuggestedPrompt } from './types-BYSMQU8i.cjs';
export { A as Attachment, e as CancelResult, l as CheckpointEvent, k as ContentBlockDelta, m as ContentBlockDeltaEvent, n as ContentBlockStartEvent, o as ContentBlockStopEvent, C as ConversationBootstrap, b as ConversationDetail, c as ConversationPatch, a as ConversationSummary, D as DefaultMessage, E as ErrorEvent, p as HitlMessage, I as ISODateString, M as MessageDeltaEvent, q as MessageRole, r as MessageStartEvent, s as MessageStopEvent, P as PROTOCOL_VERSION, S as SendMessageBody, j as Source, t as StatusEvent, g as StopReason, d as StreamEvent, u as StreamEventType, U as UpdatedConversation, h as Usage, W as WireMessage, v as WorkflowContext, w as WorkflowName } from './types-BYSMQU8i.cjs';
import { ChatRuntime, ThreadHandle, ChatRuntimeOptions, Store, SendOptions, RuntimeEvents, AddAttachmentsResult, ScopeSummary } from './core.cjs';
export { AttachmentOptions, ChatApiError, ChatError, ChatProtocolError, ChatStreamError, ChatTimeoutError, DEFAULT_REST_PATHS, Listener, MaybePromise, MemoryStorage, NEW_THREAD_KEY, ParseResult, PersistOptions, PersistenceOptions, Persister, ResolvedPersistence, RestAdapterOptions, RestPaths, RetryOptions, RuntimeWarning, Scheduler, ScopeConfig, SessionState, SetStateOptions, SseMessage, SseParser, StorageAdapter, StorageKind, UploadOptions, createChatRuntime, createMemoryStorage, createPersister, createRestAdapter, createSafeStorage, createStore, createWebStorage, defaultScopeToRequest, filterConversations, formatBytes, frameScheduler, groupConversations, groupKeyFor, isAbortError, isContentBlock, mergeWorkflowContexts, metaFromBootstrap, normalizeConversationDetail, normalizeMessages, parseStreamEvent, readSse, selectAll, sortConversations, summarizeScope, syncScheduler, toConversationItem, toErrorInfo } from './core.cjs';
import { C as ChatAdapter } from './adapter-CA1yC1wF.cjs';
export { P as ProtocolWarning, S as SendMessageOptions } from './adapter-CA1yC1wF.cjs';
import { C as ChatBlock, b as ChatMessage, L as LoadStatus, d as ChatErrorInfo, j as ConversationItem, h as ConversationGroup, c as ComposerAttachment, a as CheckpointState, l as RunState, S as ScopeGroup, n as ScopeSelection, p as ThreadState, T as ThreadMeta, M as MessageStatus } from './stream-reducer-BydUyRD3.cjs';
export { B as BlockStatus, e as CheckpointStatus, f as ComposerAttachmentStatus, g as ComposerState, i as ConversationGroupKey, k as ConversationsState, D as DeltaHandler, P as PendingCheckpoint, R as ReduceContext, w as RunStatus, m as ScopeItem, o as ScopeState, q as createThreadState, r as defaultApplyDelta, s as emptyMeta, t as interruptRun, u as reduceStreamEvent, v as textFieldOf } from './stream-reducer-BydUyRD3.cjs';
import { a as BlockDefinition, l as BlockRegistry, m as ChatAction, k as BlockActions } from './parsers-CfaHqze3.cjs';
export { A as ApprovalData, g as ArtifactData, j as BLOCK_TYPES, B as BlockRenderProps, C as ChartData, b as ChartKind, c as ChartSeries, f as ChoiceData, n as ChoiceOption, E as ErrorData, F as FormatOptions, I as ImageData, P as PlanData, o as PlanStep, q as PlanStepStatus, r as SourceItem, S as SourcesData, h as TableColumn, i as TableData, T as TextData, d as ThinkingData, e as ToolCallData, s as ToolStatus, V as ValueFormat, t as applyPlanDelta, u as formatJsonish, v as formatValue, w as humanizeKey, x as parseApproval, y as parseArtifact, p as parseChart, z as parseChoice, D as parseError, G as parseImage, H as parsePlan, J as parseSources, K as parseTable, L as parseText, M as parseThinking, N as parseToolCall } from './parsers-CfaHqze3.cjs';
import * as react from 'react';
import { Component, ReactNode, ErrorInfo, TextareaHTMLAttributes, ComponentType, HTMLAttributes } from 'react';

/**
 * Declares how one kind of block renders. Register it through `blocks` on `ChatProvider` or
 * `AgenticChat`; later definitions win, so a product can override any built-in.
 *
 * ```tsx
 * const invoiceCard = defineBlock<InvoiceData>({
 *   type: 'invoice_card',
 *   parse: (b) => ({ number: String(b.number), total: Number(b.total) }),
 *   render: ({ data, actions }) => <InvoiceCard {...data} onOpen={() => actions.emit('open_invoice', data)} />,
 * });
 * ```
 */
declare function defineBlock<TData = ContentBlock>(definition: BlockDefinition<TData>): BlockDefinition<TData>;
/**
 * Resolution order: `match()` functions (latest first), then an exact `type`, then a
 * `category`, then the fallback.
 */
declare function createBlockRegistry(definitions: readonly BlockDefinition[], fallback?: BlockDefinition): BlockRegistry;

interface BlockErrorBoundaryProps {
    children: ReactNode;
    /** Rendered instead of a block that threw. */
    fallback: (error: Error) => ReactNode;
    /** Changing this resets the boundary (e.g. the block's data changed). */
    resetKey?: unknown;
    onError?: (error: Error, info: ErrorInfo) => void;
}
interface State {
    error: Error | null;
    resetKey: unknown;
}
/** Keeps one crashing card from taking the whole thread down. */
declare class BlockErrorBoundary extends Component<BlockErrorBoundaryProps, State> {
    state: State;
    static getDerivedStateFromError(error: Error): Partial<State>;
    static getDerivedStateFromProps(props: BlockErrorBoundaryProps, state: State): Partial<State> | null;
    componentDidCatch(error: Error, info: ErrorInfo): void;
    render(): ReactNode;
}

/** Every string the UI shows. Override any of them through `labels` for copy or translation. */
interface ChatLabels {
    composerPlaceholder: string;
    composerAwaitingDecision: string;
    composerLabel: string;
    send: string;
    stop: string;
    attach: string;
    removeAttachment: (name: string) => string;
    uploading: string;
    uploadFailed: string;
    scopeAll: string;
    scopeSome: (count: number) => string;
    scopeNone: string;
    scopeSelectAll: string;
    scopeDeselectAll: string;
    scopeLabel: string;
    newChat: string;
    history: string;
    openHistory: string;
    closeHistory: string;
    searchChats: string;
    rename: string;
    renameTitle: string;
    save: string;
    delete: string;
    deleteTitle: string;
    deleteBody: string;
    archive: string;
    unarchive: string;
    showArchived: string;
    hideArchived: string;
    cancel: string;
    moreActions: (title: string) => string;
    historyEmpty: string;
    historyNoResults: string;
    historyError: string;
    running: string;
    groupToday: string;
    groupYesterday: string;
    groupPrevious7: string;
    groupPrevious30: string;
    groupOlder: string;
    thinkingLive: string;
    thoughtFor: (seconds: number) => string;
    thought: string;
    toolRunning: string;
    toolFailed: string;
    rows: (count: number) => string;
    sources: (count: number) => string;
    sourcesTitle: string;
    approve: string;
    reject: string;
    approved: string;
    rejected: string;
    submit: string;
    submitted: string;
    selectAtLeast: (count: number) => string;
    selectAtMost: (count: number) => string;
    decisionFailed: string;
    tryAgain: string;
    tryAgainIn: (seconds: number) => string;
    openFull: string;
    close: string;
    download: string;
    imageFailed: string;
    planRunning: string;
    copy: string;
    copied: string;
    jumpToLatest: string;
    loadError: string;
    reload: string;
    interrupted: string;
    stopped: string;
    unknownBlock: string;
    blockCrashed: string;
    welcomeTitle: string;
}
declare const defaultLabels: ChatLabels;

interface ChatContextValue {
    runtime: ChatRuntime;
    registry: BlockRegistry;
    labels: ChatLabels;
    onAction?: (action: ChatAction) => void;
}
declare const ChatContext: react.Context<ChatContextValue | null>;
/** Pins hooks to one conversation instead of the active one (galleries, side-by-side chats). */
declare const ThreadContext: react.Context<ThreadHandle | null>;
interface MessageContextValue {
    message: ChatMessage;
    /** The last message in the thread. */
    isLast: boolean;
}
declare const MessageContext: react.Context<MessageContextValue | null>;
interface BlockContextValue {
    block: ChatBlock;
    message: ChatMessage;
    definition?: BlockDefinition;
}
declare const BlockContext: react.Context<BlockContextValue | null>;
declare function useChatContext(): ChatContextValue;

interface ChatProviderProps extends Partial<Omit<ChatRuntimeOptions, 'adapter'>> {
    /** A runtime you created with `createChatRuntime`. Takes precedence over `adapter`. */
    runtime?: ChatRuntime;
    /** Shorthand: the provider creates (and later disposes) a runtime for this adapter. */
    adapter?: ChatAdapter;
    /** Block definitions. Later entries override earlier ones. */
    blocks?: readonly BlockDefinition[];
    /** Renders blocks nobody claims. */
    fallbackBlock?: BlockDefinition;
    /** Receives `actions.emit(...)` from cards: navigate, open a record, download… */
    onAction?: (action: ChatAction) => void;
    /** Override any UI string. */
    labels?: Partial<ChatLabels>;
    /** Controlled active conversation. `null` means a new chat. */
    conversationId?: string | null;
    onConversationChange?: (conversationId: string | null) => void;
    /** Rendered in place of a block whose renderer threw. */
    blockErrorFallback?: (error: Error, block: ChatBlock) => ReactNode;
    /** Start the runtime on mount (hydrate, load history, open a chat). @default true */
    autoStart?: boolean;
    children?: ReactNode;
}
/**
 * Connects the chat engine to React. Everything else in the library (hooks, primitives,
 * `AgenticChat`) reads from the nearest provider.
 */
declare function ChatProvider(props: ChatProviderProps): react.JSX.Element;
/** Pins the hooks and primitives below it to one conversation instead of the active one. */
declare function ThreadProvider({ conversationId, children }: {
    conversationId: string | null;
    children?: ReactNode;
}): react.JSX.Element;

declare function shallowEqual(a: unknown, b: unknown): boolean;
/**
 * Subscribes to a slice of a store. Re-renders only when the selected value changes
 * (by `isEqual`, `Object.is` by default).
 */
declare function useStoreSelector<S, T>(store: Store<S>, selector: (state: S) => T, isEqual?: (a: T, b: T) => boolean): T;

declare function useChatRuntime(): ChatRuntime;
declare function useLabels(): ChatLabels;
declare function useActiveConversationId(): string | null;
/** The thread these hooks read: the one pinned by `ThreadProvider`, else the active one. */
declare function useThreadHandle(): ThreadHandle;
declare function useThread<T>(selector: (state: ThreadState) => T, isEqual?: (a: T, b: T) => boolean): T;
declare function useMessages(): ChatMessage[];
declare function useRun(): RunState;
declare function useThreadMeta(): ThreadMeta;
declare function useIsBusy(): boolean;
declare function useChatActions(): {
    send: (text: string, options?: Omit<SendOptions, "conversationId">) => Promise<void>;
    resume: (checkpointId: string, decision: HitlDecision) => Promise<void>;
    cancel: () => Promise<void>;
    retry: () => Promise<void>;
    canRetry: () => boolean;
    newConversation: () => Promise<string | null>;
    selectConversation: (id: string | null) => Promise<void>;
    renameConversation: (id: string, title: string) => Promise<void>;
    archiveConversation: (id: string, archived: boolean) => Promise<void>;
    deleteConversation: (id: string) => Promise<void>;
    setModel: (model: string) => Promise<void>;
    emit: (name: string, payload?: unknown, extra?: Partial<ChatAction>) => void | undefined;
};
declare function useComposer(): {
    text: string;
    attachments: ComposerAttachment[];
    busy: boolean;
    cancelling: boolean;
    uploading: boolean;
    blockedByDecision: boolean;
    canSend: boolean;
    attachmentsEnabled: boolean;
    accept: string | undefined;
    setText: (text: string) => void;
    send: () => Promise<void>;
    cancel: () => Promise<void>;
    addFiles: (files: Iterable<File>) => AddAttachmentsResult;
    removeAttachment: (id: string) => void;
};
declare function usePreference<T>(key: string, fallback: T): [T, (value: T) => void];
declare function useConversations(): {
    status: LoadStatus;
    error: ChatErrorInfo | undefined;
    allItems: ConversationItem[];
    items: ConversationItem[];
    groups: ConversationGroup[];
    activeId: string | null;
    runningIds: string[];
    isRunning: (id: string) => boolean;
    query: string;
    setQuery: react.Dispatch<react.SetStateAction<string>>;
    showArchived: boolean;
    setShowArchived: (value: boolean) => void;
    create: () => Promise<string | null>;
    select: (id: string) => Promise<void>;
    rename: (id: string, title: string) => Promise<void>;
    remove: (id: string) => Promise<void>;
    archive: (id: string, archived: boolean) => Promise<void>;
    refresh: () => Promise<void>;
};
type GroupSelectionState = 'all' | 'some' | 'none';
declare function useScope(): {
    enabled: boolean;
    status: LoadStatus;
    groups: ScopeGroup[];
    selection: ScopeSelection;
    summary: ScopeSummary;
    isSelected: (groupId: string, itemId: string) => boolean;
    groupState: (groupId: string) => GroupSelectionState;
    toggle: (groupId: string, itemId: string) => void;
    setGroup: (groupId: string, selected: boolean) => void;
    setSelection: (selection: ScopeSelection) => void;
};
declare function useMessage(): MessageContextValue;
declare function useBlock(): BlockContextValue;
/** The HITL state of the block being rendered, and how to answer it. */
declare function useHitl(): {
    checkpoint: CheckpointState | undefined;
    status: string;
    requires: unknown;
    decision: HitlDecision | undefined;
    error: ChatErrorInfo | undefined;
    isPending: boolean;
    isSubmitting: boolean;
    isResolved: boolean;
    /** The card is the live question and the thread isn't busy. */
    canSubmit: boolean;
    submit: (decision: HitlDecision) => Promise<void>;
};
declare function useBlockActions(block: ChatBlock, message: ChatMessage): BlockActions;
/** Subscribes to runtime events (`event`, `error`, `warning`, `activeChange`). */
declare function useChatEvent<K extends keyof RuntimeEvents>(type: K, listener: (...args: RuntimeEvents[K]) => void): void;

type ComposerApi = ReturnType<typeof useComposer>;
declare function useComposerContext(): ComposerApi;
interface ComposerInputProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
    /** Enter sends, Shift+Enter adds a line. @default true */
    submitOnEnter?: boolean;
    /** @default 1 */
    minRows?: number;
    /** Grows up to this many rows, then scrolls. @default 8 */
    maxRows?: number;
    /** Focus when the thread becomes idle again (after a send or a decision). @default true */
    refocus?: boolean;
}
declare function ComposerAttachments({ children, }: {
    children: (attachment: ComposerAttachment, remove: () => void) => ReactNode;
}): react.JSX.Element | null;

interface ScrollController {
    atBottom: boolean;
    scrollToBottom: (behavior?: ScrollBehavior) => void;
    /** @internal */
    viewportRef: React.RefObject<HTMLDivElement | null>;
    /** @internal */
    contentRef: React.RefObject<HTMLDivElement | null>;
    /** @internal */
    onScroll: () => void;
}
declare function useThreadScroll(): ScrollController;
interface AsChildProps {
    asChild?: boolean;
}
interface ThreadViewportProps extends HTMLAttributes<HTMLDivElement> {
    /** Props for the inner element that wraps the messages. */
    contentProps?: HTMLAttributes<HTMLDivElement>;
}
interface MessageComponents {
    UserMessage?: ComponentType<{
        message: ChatMessage;
    }>;
    AssistantMessage?: ComponentType<{
        message: ChatMessage;
    }>;
}
interface ThreadMessagesProps {
    components?: MessageComponents;
    /** Full control: render each message yourself. */
    children?: (message: ChatMessage, index: number) => ReactNode;
}
/** Renders every message in the thread, each wrapped in a message context. */
declare function ThreadMessages({ components, children }: ThreadMessagesProps): react.JSX.Element;
/** Renders its children only while the thread has no messages (the welcome screen slot). */
declare function ThreadEmpty({ children }: {
    children?: ReactNode;
}): react.JSX.Element | null;
interface ThreadIfProps {
    empty?: boolean;
    running?: boolean;
    loading?: boolean;
    error?: boolean;
    paused?: boolean;
    children?: ReactNode;
}
/** Conditional rendering on thread state. Every condition given must hold. */
declare function ThreadIf({ empty, running, loading, error, paused, children }: ThreadIfProps): react.JSX.Element | null;
/** The transient status label (`status` event) while a turn runs. */
declare function ThreadStatus({ children }: {
    children?: (label: string) => ReactNode;
}): react.JSX.Element;

interface BlockRendererProps {
    block: ChatBlock;
    message: ChatMessage;
    /** The last block of a message that's still streaming. */
    isLast?: boolean;
}
declare function BlockRendererImpl({ block, message, isLast }: BlockRendererProps): react.JSX.Element | null;
/**
 * Renders one block through the registry, inside its own error boundary. Memoized so a delta
 * to one block doesn't re-render its siblings.
 */
declare const BlockRenderer: react.MemoExoticComponent<typeof BlockRendererImpl>;
interface MessageBlocksProps {
    /** Hide some blocks. */
    filter?: (block: ChatBlock) => boolean;
    /** Wraps consecutive blocks whose definitions share a `group`. */
    renderGroup?: (group: string, children: ReactNode, blocks: ChatBlock[]) => ReactNode;
    /** Wraps each block. */
    renderBlock?: (children: ReactNode, block: ChatBlock) => ReactNode;
}
/** Renders the current message's blocks, grouping where definitions ask for it. */
declare function MessageBlocks({ filter, renderGroup, renderBlock }: MessageBlocksProps): react.JSX.Element;

interface MessageIfProps {
    role?: ChatMessage['role'];
    status?: MessageStatus | MessageStatus[];
    /** Only the last message. */
    last?: boolean;
    children?: ReactNode;
}
declare function MessageIf({ role, status, last, children }: MessageIfProps): react.JSX.Element | null;
/** Plain text of a message, for copy buttons. Uses each block's `toText` when it has one. */
declare function messageText(message: ChatMessage, toText?: (block: ChatMessage['blocks'][number]) => string | undefined): string;

/** Renders the conversation's suggested prompts (row 1), or `prompts` if given. */
declare function SuggestionsRoot({ prompts, children, }: {
    prompts?: SuggestedPrompt[];
    children: (prompt: SuggestedPrompt, index: number) => ReactNode;
}): react.JSX.Element | null;
declare function ConversationListRoot({ children }: {
    children: (api: ReturnType<typeof useConversations>) => ReactNode;
}): react.JSX.Element;
interface ChoiceState {
    multiple: boolean;
    selected: string[];
    toggle: (value: string) => void;
    hitl: ReturnType<typeof useHitl>;
}
declare function useHitlChoice(): ChoiceState;
/** Holds the selection for a choice card. Use `useHitl()` directly for approve/reject cards. */
declare function HitlRoot({ multiple, initial, children, }: {
    multiple?: boolean;
    initial?: string[];
    children?: ReactNode;
}): react.JSX.Element;

/** Headless building blocks. Unstyled; every part accepts normal HTML props. */
declare const Thread: {
    Root: react.ForwardRefExoticComponent<react.HTMLAttributes<HTMLDivElement> & AsChildProps & react.RefAttributes<HTMLDivElement>>;
    Viewport: react.ForwardRefExoticComponent<ThreadViewportProps & react.RefAttributes<HTMLDivElement>>;
    Messages: typeof ThreadMessages;
    Empty: typeof ThreadEmpty;
    If: typeof ThreadIf;
    Status: typeof ThreadStatus;
    ScrollToBottom: react.ForwardRefExoticComponent<react.HTMLAttributes<HTMLButtonElement> & AsChildProps & react.RefAttributes<HTMLButtonElement>>;
};
declare const Message: {
    Root: react.ForwardRefExoticComponent<react.HTMLAttributes<HTMLDivElement> & {
        asChild?: boolean;
    } & react.RefAttributes<HTMLDivElement>>;
    Blocks: typeof MessageBlocks;
    If: typeof MessageIf;
};
declare const Composer: {
    Root: react.ForwardRefExoticComponent<react.FormHTMLAttributes<HTMLFormElement> & {
        asChild?: boolean;
    } & react.RefAttributes<HTMLFormElement>>;
    Input: react.ForwardRefExoticComponent<ComposerInputProps & react.RefAttributes<HTMLTextAreaElement>>;
    Send: react.ForwardRefExoticComponent<react.ButtonHTMLAttributes<HTMLButtonElement> & {
        asChild?: boolean;
    } & react.RefAttributes<HTMLButtonElement>>;
    Cancel: react.ForwardRefExoticComponent<react.ButtonHTMLAttributes<HTMLButtonElement> & {
        asChild?: boolean;
    } & react.RefAttributes<HTMLButtonElement>>;
    AttachmentInput: react.ForwardRefExoticComponent<react.ButtonHTMLAttributes<HTMLButtonElement> & {
        asChild?: boolean;
    } & {
        multiple?: boolean;
    } & react.RefAttributes<HTMLButtonElement>>;
    Attachments: typeof ComposerAttachments;
};
declare const Suggestions: {
    Root: typeof SuggestionsRoot;
    Item: react.ForwardRefExoticComponent<react.ButtonHTMLAttributes<HTMLButtonElement> & {
        asChild?: boolean;
    } & {
        prompt: SuggestedPrompt;
    } & react.RefAttributes<HTMLButtonElement>>;
};
declare const ConversationList: {
    Root: typeof ConversationListRoot;
    Item: react.ForwardRefExoticComponent<react.ButtonHTMLAttributes<HTMLButtonElement> & {
        asChild?: boolean;
    } & {
        conversation: ConversationItem;
    } & react.RefAttributes<HTMLButtonElement>>;
    New: react.ForwardRefExoticComponent<react.ButtonHTMLAttributes<HTMLButtonElement> & {
        asChild?: boolean;
    } & react.RefAttributes<HTMLButtonElement>>;
};
declare const Hitl: {
    Root: typeof HitlRoot;
    Option: react.ForwardRefExoticComponent<react.ButtonHTMLAttributes<HTMLButtonElement> & {
        asChild?: boolean;
    } & {
        value: string;
    } & react.RefAttributes<HTMLButtonElement>>;
    Submit: react.ForwardRefExoticComponent<react.ButtonHTMLAttributes<HTMLButtonElement> & {
        asChild?: boolean;
    } & {
        toDecision?: (selected: string[]) => HitlDecision;
    } & react.RefAttributes<HTMLButtonElement>>;
};

export { AddAttachmentsResult, BlockRenderer as Block, BlockActions, BlockContext, BlockDefinition, BlockErrorBoundary, type BlockErrorBoundaryProps, BlockRegistry, ChatAction, ChatAdapter, ChatBlock, ChatContext, type ChatContextValue, ChatErrorInfo, type ChatLabels, ChatMessage, ChatProvider, type ChatProviderProps, ChatRuntime, ChatRuntimeOptions, CheckpointState, Composer, ComposerAttachment, type ComposerInputProps, ContentBlock, ConversationGroup, ConversationItem, ConversationList, type GroupSelectionState, Hitl, HitlDecision, LoadStatus, Message, MessageBlocks, type MessageComponents, MessageContext, MessageStatus, RunState, RuntimeEvents, ScopeGroup, ScopeSelection, ScopeSummary, type ScrollController, SendOptions, Store, SuggestedPrompt, Suggestions, Thread, ThreadContext, ThreadHandle, ThreadMeta, ThreadProvider, ThreadState, createBlockRegistry, defaultLabels, defineBlock, messageText, shallowEqual, useActiveConversationId, useBlock, useBlockActions, useChatActions, useChatContext, useChatEvent, useChatRuntime, useComposer, useComposerContext, useConversations, useHitl, useHitlChoice, useIsBusy, useLabels, useMessage, useMessages, usePreference, useRun, useScope, useStoreSelector, useThread, useThreadHandle, useThreadMeta, useThreadScroll };
