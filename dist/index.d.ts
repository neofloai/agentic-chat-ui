import { A as Attachment, j as SuggestedPrompt, g as ContentBlock } from './types-CIFoqVVK.js';
export { f as CancelResult, n as ChatCapabilities, C as ChatConfig, o as ChatLimits, p as CheckpointEvent, q as ConfigModel, r as ConfigSource, s as ConfigWorkflow, m as ConnectionState, t as ConnectionStatus, l as ContentBlockDelta, u as ContentBlockDeltaEvent, v as ContentBlockStartEvent, w as ContentBlockStopEvent, a as ConversationBootstrap, c as ConversationDetail, d as ConversationPatch, b as ConversationSummary, D as DefaultMessage, x as ERROR_CODES, y as ErrorCode, z as ErrorEnvelope, B as ErrorEvent, E as Ext, H as HitlDecision, F as HitlMessage, I as ISODateString, M as MessageDeltaEvent, G as MessageRole, J as MessageStartEvent, K as MessageStopEvent, P as PROTOCOL_VERSION, L as STANDARD_REVISION, S as SendMessageBody, k as Source, N as StatusEvent, h as StopReason, e as StreamEvent, O as StreamEventType, U as UpdatedConversation, i as Usage, W as WireMessage, Q as WorkflowContext, R as WorkflowName } from './types-CIFoqVVK.js';
export { AddAttachmentsResult, AttachmentOptions, CapabilityOverrides, ChatApiError, ChatError, ChatProtocolError, ChatRuntime, ChatRuntimeOptions, ChatStreamError, ChatTimeoutError, ConnectionRequiredInfo, ErrorCodeInput, ErrorEnvelopeFields, Listener, MaybePromise, MemoryStorage, NEW_THREAD_KEY, ParseResult, PersistOptions, PersistenceOptions, Persister, ResolvedPersistence, RuntimeEvents, RuntimeWarning, Scheduler, ScopeConfig, ScopeSummary, SendOptions, SessionState, SetStateOptions, SseMessage, SseParser, StorageAdapter, StorageKind, Store, ThreadHandle, UploadOptions, createChatRuntime, createMemoryStorage, createPersister, createSafeStorage, createStore, createWebStorage, defaultScopeToRequest, errorInfoFromCode, filterConversations, formatBytes, frameScheduler, groupConversations, groupKeyFor, isAbortError, isContentBlock, knownSources, mergeWorkflowContexts, metaFromBootstrap, normalizeConfig, normalizeConversationDetail, normalizeMessages, parseStreamEvent, readErrorEnvelope, readSse, resolveCapabilities, scopeGroupsFromWorkflows, selectAll, selectedModelOf, sortConversations, stripCredentials, summarizeScope, syncScheduler, toConversationItem, toErrorInfo } from './core.js';
export { C as ChatAdapter, P as ProtocolWarning, S as SendMessageOptions } from './adapter-CLjeqFDx.js';
export { D as DEFAULT_REST_PATHS, a as RestAdapterOptions, R as RestPaths, b as RetryOptions, U as UnauthorizedInfo, c as createRestAdapter } from './rest-adapter-RF-KDV8r.js';
import { c as ComposerAttachment, b as ChatMessage, d as ChatErrorInfo } from './stream-reducer-E9TDBSmi.js';
export { B as BlockStatus, e as Capabilities, C as ChatBlock, f as ChatConfigState, a as CheckpointState, g as CheckpointStatus, h as ComposerAttachmentStatus, i as ComposerState, j as ConfigStatus, k as ConversationGroup, l as ConversationGroupKey, m as ConversationItem, n as ConversationsState, D as DeltaHandler, E as ErrorAction, L as LoadStatus, M as MessageStatus, P as PendingCheckpoint, R as ReduceContext, o as RunState, S as ScopeGroup, p as ScopeItem, q as ScopeSelection, r as ScopeState, T as TOOL_CALL_TYPES, s as ThreadMeta, t as ThreadState, u as createThreadState, v as defaultApplyDelta, w as emptyMeta, x as interruptRun, y as linkToolResults, z as reduceStreamEvent, A as textFieldOf } from './stream-reducer-E9TDBSmi.js';
import { ChatProviderProps } from './headless.js';
export { Block, BlockContext, BlockErrorBoundary, BlockErrorBoundaryProps, ChatContext, ChatContextValue, ChatLabels, ChatProvider, Composer, ComposerInputProps, ConversationList, GroupSelectionState, Hitl, Message, MessageBlocks, MessageComponents, MessageContext, ScrollController, Suggestions, Thread, ThreadContext, ThreadProvider, createBlockRegistry, defaultLabels, defineBlock, messageText, shallowEqual, useActiveConversationId, useBlock, useBlockActions, useCapabilities, useChatActions, useChatConfig, useChatContext, useChatEvent, useChatRuntime, useComposer, useComposerContext, useConversations, useHitl, useHitlChoice, useIsBusy, useLabels, useMessage, useMessages, usePreference, useRun, useScope, useSourceLabel, useStoreSelector, useThread, useThreadHandle, useThreadMeta, useThreadScroll } from './headless.js';
import { B as BlockRenderProps, E as ErrorData, S as SourcesData, T as TextData, d as ThinkingData, e as ToolCallData, A as ApprovalData, f as ChoiceData, g as ArtifactData, I as ImageData, P as PlanData, h as TableColumn, i as TableData, a as BlockDefinition } from './parsers-D_dzoRqG.js';
export { j as BLOCK_TYPES, k as BlockActions, l as BlockRegistry, C as ChartData, b as ChartKind, c as ChartSeries, m as ChatAction, n as ChoiceOption, F as FallbackData, o as FormatOptions, q as PlanStep, r as PlanStepStatus, s as SourceItem, t as ToolResultItem, u as ToolStatus, V as ValueFormat, v as applyPlanDelta, w as formatJsonish, x as formatValue, y as humanizeKey, z as parseApproval, D as parseArtifact, p as parseChart, G as parseChoice, H as parseError, J as parseFallback, K as parseImage, L as parsePlan, M as parseSources, N as parseTable, O as parseText, Q as parseThinking, R as parseToolCall } from './parsers-D_dzoRqG.js';
import * as react from 'react';
import { ReactNode, ComponentType } from 'react';
import { BoxProps, TypographyVariant } from '@neofloai/atoms';
import { neofloTheme } from '@neofloai/atoms/theme';
import { ModeToken } from '@neofloai/atoms/tokens';
import { Components } from 'react-markdown';

interface ChatHistoryProps {
    /** Called after a conversation is picked (e.g. to close an overlay on small screens). */
    onSelect?: (conversationId: string) => void;
    /** Show the New chat button at the top. @default true */
    showNewChat?: boolean;
}
/** The conversation list: search, recency groups, rename/archive/delete, archived toggle. */
declare function ChatHistory({ onSelect, showNewChat }: ChatHistoryProps): react.JSX.Element;

interface FileCardProps {
    name: string;
    size?: number;
    contentType?: string;
    status?: ComposerAttachment['status'];
    progress?: number;
    error?: string;
    onRemove?: () => void;
    href?: string;
}
/** Figma FileCard: an attachment with its type and size. */
declare function FileCard({ name, size, contentType, status, progress, error, onRemove }: FileCardProps): react.JSX.Element;
/** A sent attachment, shown with the user's message. */
declare function AttachmentCard({ attachment }: {
    attachment: Attachment;
}): react.JSX.Element;
/**
 * Figma Composer-scope + SourcePicker: which workflows the question is about. A `ComposerPicker`
 * over the scope catalog; it hides itself when there is no catalog or the backend takes no
 * workflow context.
 */
declare function ScopePicker(): react.JSX.Element | null;
interface ChatComposerProps {
    placeholder?: string;
    /**
     * Controls on the left, after the attach button and the workflow picker: a `ComposerPicker` for
     * tools or data sources, a mode switch…
     */
    leadingActions?: ReactNode;
    /** Controls on the right, before the send button: a model picker, a mic… */
    extraActions?: ReactNode;
    /**
     * The workflow picker's place. Omit it for the built-in `ScopePicker` (which hides itself when
     * there is no workflow catalog), pass your own node to replace it, or `false` to leave it out.
     */
    scopePicker?: ReactNode | false;
    /** Rendered under the composer (a disclaimer, a hint). */
    footer?: ReactNode;
    /** @default 8 */
    maxRows?: number;
    autoFocus?: boolean;
}
/** Figma Composer: the input, attachments, the workflow picker, your own controls, and send/stop. */
declare function ChatComposer({ placeholder, leadingActions, extraActions, scopePicker, footer, maxRows, autoFocus, }: ChatComposerProps): react.JSX.Element;

interface ChatHeaderProps {
    title?: ReactNode;
    /** Controls before the New chat button. */
    actions?: ReactNode;
    historyOpen?: boolean;
    onToggleHistory?: () => void;
}
/** The bar above the thread: history toggle, the conversation title, New chat. */
declare function ChatHeader({ title, actions, historyOpen, onToggleHistory }: ChatHeaderProps): react.JSX.Element;
/** Slots: replace any part of the default UI with your own component. */
interface ChatComponents {
    /** The empty-chat screen. Use hooks (`useThreadMeta`, `useChatActions`) inside it. */
    Welcome: ComponentType;
    UserTurn: ComponentType<{
        message: ChatMessage;
    }>;
    AssistantTurn: ComponentType<{
        message: ChatMessage;
    }>;
    Header: ComponentType<ChatHeaderProps>;
    History: ComponentType<ChatHistoryProps>;
    Composer: ComponentType<ChatComposerProps>;
}
interface AgenticChatProps extends ChatProviderProps {
    /** Show the conversation history panel. @default true */
    history?: boolean;
    /** Initial state of the history panel on wide layouts (remembered afterwards). @default true */
    defaultHistoryOpen?: boolean;
    /** Show the header bar. @default true */
    header?: boolean;
    /** Header title; defaults to the conversation title. */
    title?: ReactNode;
    headerActions?: ReactNode;
    components?: Partial<ChatComponents>;
    composerProps?: ChatComposerProps;
    /** Reading-column width. @default 760 */
    maxWidth?: number;
    /** Below this container width the history panel overlays the chat. @default 720 */
    compactBelow?: number;
    className?: string;
    sx?: BoxProps['sx'];
}
/**
 * The complete chat: history, thread, composer and every built-in block, on Atoms. Mount it
 * inside `NeofloThemeProvider` and give it a sized container.
 *
 * ```tsx
 * <AgenticChat adapter={createRestAdapter({ baseUrl, headers })} />
 * ```
 */
declare function AgenticChat(props: AgenticChatProps): react.JSX.Element;

interface ThreadComponents {
    Welcome?: ComponentType;
    UserTurn?: ComponentType<{
        message: ChatMessage;
    }>;
    AssistantTurn?: ComponentType<{
        message: ChatMessage;
    }>;
}
interface ChatThreadProps {
    components?: ThreadComponents;
    /** Width of the reading column. @default 760 */
    maxWidth?: number;
}
/** The scrolling message list with the welcome screen, loading and error states. */
declare function ChatThread({ components, maxWidth }: ChatThreadProps): react.JSX.Element;

interface ComposerPickerItem {
    /** Unique across the whole picker: `value` is a list of these. */
    id: string;
    label: ReactNode;
    /** A second, quieter line under the label. */
    description?: ReactNode;
    /** A 16px glyph before the label. */
    icon?: ReactNode;
    disabled?: boolean;
}
interface ComposerPickerGroup {
    id: string;
    /** Heading above the group's items. */
    label?: ReactNode;
    /**
     * Multiple selection only: the heading also selects or clears every item in the group, and says
     * which on its right ("Select all" / "Deselect all").
     */
    selectAll?: boolean;
    items: ComposerPickerItem[];
}
interface ComposerPickerProps {
    /** What is being picked, e.g. "Tools". The trigger's accessible name and the default summary use it. */
    name: string;
    /** The choices, in groups. */
    groups?: ComposerPickerGroup[];
    /** Shorthand for one group without a heading. */
    items?: ComposerPickerItem[];
    /** The ids of the selected items. */
    value: readonly string[];
    onChange: (value: string[]) => void;
    /** Checkboxes that stay open (default), or a single choice that closes the menu. @default true */
    multiple?: boolean;
    /**
     * The trigger's text. Defaults to `labels.pickerSummary(name, selected, total)` ("All tools",
     * "Tools (2)", "No tools") for multiple selection, and to the chosen item's label for single.
     */
    triggerLabel?: ReactNode;
    /** The heading's action text. @default labels.pickerSelectAll / labels.pickerDeselectAll */
    selectAllLabel?: string;
    deselectAllLabel?: string;
    /**
     * Under a rule at the bottom of the menu, e.g. a "Manage…" `MenuItem` that opens your own dialog.
     * A function receives `close` so it can shut the menu first.
     */
    footer?: ReactNode | ((close: () => void) => ReactNode);
    disabled?: boolean;
    /** The choices are loading: the trigger is disabled and marked busy. */
    loading?: boolean;
    /** @default 260 */
    menuMinWidth?: number;
}
/**
 * A pill in the composer that opens a menu of choices: workflows, tools, models, data sources, or
 * anything else a turn can be about. Controlled, and it knows nothing about what the items mean.
 * Figma: Composer-scope (the pill) and SourcePicker (the menu).
 * The built-in workflow picker (`ScopePicker`) is one of these; put your own in `ChatComposer`'s
 * `leadingActions` or `extraActions`.
 */
declare function ComposerPicker({ name, groups, items, value, onChange, multiple, triggerLabel, selectAllLabel, deselectAllLabel, footer, disabled, loading, menuMinWidth, }: ComposerPickerProps): react.JSX.Element;

/** Figma Turn (question): the user's message, right-aligned in a bubble. */
declare function UserTurn({ message }: {
    message: ChatMessage;
}): react.JSX.Element;
/** Figma Turn (answer): the assistant's blocks, unbubbled, full width. */
declare function AssistantTurn({ message }: {
    message: ChatMessage;
}): react.JSX.Element;
/** Figma RunStatus: the live progress pill fed by `status` events. */
declare function RunStatus(): react.JSX.Element;
/** What shows under the last message while a turn is in flight or failed before starting. */
declare function PendingTurn(): react.JSX.Element;
/** Figma ChatSuggestions: opening prompts. Clicking sends the prompt text. */
declare function ChatSuggestions({ prompts }: {
    prompts?: SuggestedPrompt[];
}): react.JSX.Element;
/** The default empty-chat screen: the server's greeting and suggested prompts. */
declare function WelcomeScreen(): react.JSX.Element;

declare function TextBlock({ data }: BlockRenderProps<TextData>): react.JSX.Element | null;
declare function ThinkingBlock({ data, status }: BlockRenderProps<ThinkingData>): react.JSX.Element;
declare function ToolBlock({ data }: BlockRenderProps<ToolCallData>): react.JSX.Element;
declare function SourcesBlock({ data, actions }: BlockRenderProps<SourcesData>): react.JSX.Element;
declare function ErrorBlock({ data, actions }: BlockRenderProps<ErrorData>): react.JSX.Element;
/**
 * Blocks nobody claimed. A product's own block (`<product>.<name>`) carries `fallback_text`,
 * which renders as Markdown everywhere. Anything else shows raw JSON in development and
 * nothing in production.
 */
declare function UnknownBlock({ block }: BlockRenderProps): react.JSX.Element | null;
declare function BlockCrashNotice(): react.JSX.Element;

/** Approve / reject (Figma ApprovalBlock). Sends `approve_value` / `reject_value`. */
declare function ApprovalBlock({ data }: BlockRenderProps<ApprovalData>): react.JSX.Element;
/** Single- or multi-select question. Sends a string or a string array. */
declare function ChoiceBlock({ data }: BlockRenderProps<ChoiceData>): react.JSX.Element;

/** Figma ArtifactBlock: a generated document with a preview, full view and download. */
declare function ArtifactBlock({ data, actions, status }: BlockRenderProps<ArtifactData>): react.JSX.Element;
/** Figma ImageBlock: a returned image with its caption; opens larger on click. */
declare function ImageBlock({ data, actions }: BlockRenderProps<ImageData>): react.JSX.Element;
/** Figma Plan: the agent's steps on an Atoms `Stepper`, each with an optional detail panel. */
declare function PlanBlock({ data }: BlockRenderProps<PlanData>): react.JSX.Element;

/** A sortable Atoms `Table`. Also renders markdown-free result sets from other blocks. */
declare function DataTable({ columns, rows, maxHeight, }: {
    columns: TableColumn[];
    rows: Record<string, unknown>[];
    maxHeight?: number;
}): react.JSX.Element;
/** Figma TableBlock: a titled result set with its row count. */
declare function TableBlock({ data }: BlockRenderProps<TableData>): react.JSX.Element;

type MarkdownSize = 'md' | 'sm';
interface MarkdownProps {
    children: string;
    size?: MarkdownSize;
    /** Extra react-markdown component overrides. */
    components?: Components;
}
/**
 * Markdown on the Atoms type scale. Raw HTML is never rendered and unsafe URLs are dropped
 * (react-markdown's default URL transform), so model output can't inject markup.
 */
declare const Markdown: react.NamedExoticComponent<MarkdownProps>;

declare const textBlock: BlockDefinition<TextData>;
declare const thinkingBlock: BlockDefinition<ThinkingData>;
declare const toolCallBlock: BlockDefinition<ToolCallData>;
declare const tableBlock: BlockDefinition<TableData>;
declare const sourcesBlock: BlockDefinition<SourcesData>;
declare const approvalBlock: BlockDefinition<ApprovalData>;
declare const choiceBlock: BlockDefinition<ChoiceData>;
declare const errorBlock: BlockDefinition<ErrorData>;
declare const artifactBlock: BlockDefinition<ArtifactData>;
declare const imageBlock: BlockDefinition<ImageData>;
declare const planBlock: BlockDefinition<PlanData>;
/** Renders blocks nobody claimed: `fallback_text` when the block has it, else JSON in development only. */
declare const unknownBlock: BlockDefinition<ContentBlock>;
/** Every built-in block except charts (import `chartBlock` from `@neofloai/agentic-chat/charts`). */
declare const defaultBlocks: readonly BlockDefinition[];

type BlockTone = 'default' | 'primary' | 'warning' | 'danger';
interface BlockShellProps {
    /** An 18px glyph from `@neofloai/atoms/icons`. */
    icon?: ReactNode;
    title: ReactNode;
    /** Right-aligned, quiet text: a duration, a row count. */
    meta?: ReactNode;
    /** Right-aligned controls (icon buttons). */
    actions?: ReactNode;
    collapsible?: boolean;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Tints the card for blocks that need attention, from the role's subtle surface tokens. */
    tone?: BlockTone;
    /** Indent the body under the title (the default when there's an icon). */
    indent?: boolean;
    /** A row of buttons under the body. */
    footer?: ReactNode;
    busy?: boolean;
    /** Body content. */
    children?: ReactNode;
    'aria-label'?: string;
    /** Drop the body padding, for edge-to-edge content such as a table. */
    flushBody?: boolean;
}
/**
 * The card every block shares (Figma "div.Block"): a head of icon, title and meta or caret,
 * then a body indented under the title. Exported so custom cards look native.
 */
declare function BlockShell({ icon, title, meta, actions, collapsible, open, defaultOpen, onOpenChange, tone, indent, footer, busy, children, flushBody, 'aria-label': ariaLabel, }: BlockShellProps): react.JSX.Element;

interface KeyValueItem {
    key: string;
    label?: ReactNode;
    value: ReactNode;
}
/** Muted keys against values (Figma "Block-kv"), as a semantic description list. */
declare function KeyValueList({ items }: {
    items: KeyValueItem[];
}): react.JSX.Element | null;

/** Text that's still arriving (Figma "Shimmer"): a slow sweep across muted ink. */
declare function Shimmer({ children, variant, bar, }: {
    children?: ReactNode;
    variant?: TypographyVariant;
    /** Also draw the sweeping bar under the text. */
    bar?: boolean;
}): react.JSX.Element;
/** The live dot on the RunStatus pill. */
declare function PulseDot(): react.JSX.Element;

/** True when the thread's last turn failed and can be retried. */
declare function useCanRetry(): boolean;
/** Allows http(s), mailto, relative URLs and blob:; `data:image/*` only when asked. */
declare function safeUrl(url: string | undefined, { allowDataImage }?: {
    allowDataImage?: boolean | undefined;
}): string | undefined;
declare function formatDuration(ms: number): string;
/** A Try again button that waits out `retry_after` first. */
declare function RetryButton({ retryAfter, onRetry }: {
    retryAfter?: number | null;
    onRetry: () => void;
}): react.JSX.Element;
/** The error card (Figma ErrorBlock), built on Atoms `Alert`. */
declare function ErrorNotice({ title, message, retryable, retryAfter, onRetry, action, requestId, }: {
    title: ReactNode;
    message?: ReactNode;
    retryable?: boolean;
    retryAfter?: number | null;
    onRetry?: () => void;
    /** Replaces the Try again button (for example Reconnect). */
    action?: ReactNode;
    /** Shown small under the message, for bug reports. */
    requestId?: string | null;
}): react.JSX.Element;
/**
 * An `ErrorNotice` for a turn's error: Try again (with the `retry_after` countdown), Reconnect
 * for a connection error, or no button when retrying can't help (sign in, access denied…).
 */
declare function TurnErrorNotice({ error, title, message }: {
    error: ChatErrorInfo;
    title?: ReactNode;
    message?: ReactNode;
}): react.JSX.Element;

type AtomsTheme = typeof neofloTheme;
type StyleValue = ModeToken | string | number | undefined;
/**
 * Resolves Atoms `{ light, dark }` tokens for both colour schemes, the same way Atoms' own
 * components do: the light value inline, the dark one under `theme.applyStyles('dark')`.
 *
 * ```ts
 * sx={(theme) => mode(theme, { backgroundColor: surface.layers.card2, color: text.default.b1 })}
 * ```
 */
declare function mode(theme: AtomsTheme, styles: Record<string, StyleValue>): Record<string, unknown>;
declare const monoFont: "var(--font-dm-mono, \"DM Mono\"), ui-monospace, \"SF Mono\", Menlo, monospace";
/** Block head icon size; body text indents by this plus the head gap so it lines up with the title. */
declare const BLOCK_ICON_PX = 18;

export { AgenticChat, type AgenticChatProps, ApprovalBlock, ApprovalData, ArtifactBlock, ArtifactData, AssistantTurn, type AtomsTheme, Attachment, AttachmentCard, BLOCK_ICON_PX, BlockCrashNotice, BlockDefinition, BlockRenderProps, BlockShell, type BlockShellProps, type BlockTone, type ChatComponents, ChatComposer, type ChatComposerProps, ChatErrorInfo, ChatHeader, type ChatHeaderProps, ChatHistory, type ChatHistoryProps, ChatMessage, ChatProviderProps, ChatSuggestions, ChatThread, type ChatThreadProps, ChoiceBlock, ChoiceData, ComposerAttachment, ComposerPicker, type ComposerPickerGroup, type ComposerPickerItem, type ComposerPickerProps, ContentBlock, DataTable, ErrorBlock, ErrorData, ErrorNotice, FileCard, type FileCardProps, ImageBlock, ImageData, type KeyValueItem, KeyValueList, Markdown, type MarkdownProps, type MarkdownSize, PendingTurn, PlanBlock, PlanData, PulseDot, RetryButton, RunStatus, ScopePicker, Shimmer, SourcesBlock, SourcesData, SuggestedPrompt, TableBlock, TableColumn, TableData, TextBlock, TextData, ThinkingBlock, ThinkingData, type ThreadComponents, ToolBlock, ToolCallData, TurnErrorNotice, UnknownBlock, UserTurn, WelcomeScreen, approvalBlock, artifactBlock, choiceBlock, defaultBlocks, errorBlock, formatDuration, imageBlock, mode, monoFont, planBlock, safeUrl, sourcesBlock, tableBlock, textBlock, thinkingBlock, toolCallBlock, unknownBlock, useCanRetry };
