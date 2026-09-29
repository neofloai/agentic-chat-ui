import { A as Attachment, i as SuggestedPrompt, f as ContentBlock } from './types-BYSMQU8i.cjs';
export { e as CancelResult, l as CheckpointEvent, k as ContentBlockDelta, m as ContentBlockDeltaEvent, n as ContentBlockStartEvent, o as ContentBlockStopEvent, C as ConversationBootstrap, b as ConversationDetail, c as ConversationPatch, a as ConversationSummary, D as DefaultMessage, E as ErrorEvent, H as HitlDecision, p as HitlMessage, I as ISODateString, M as MessageDeltaEvent, q as MessageRole, r as MessageStartEvent, s as MessageStopEvent, P as PROTOCOL_VERSION, S as SendMessageBody, j as Source, t as StatusEvent, g as StopReason, d as StreamEvent, u as StreamEventType, U as UpdatedConversation, h as Usage, W as WireMessage, v as WorkflowContext, w as WorkflowName } from './types-BYSMQU8i.cjs';
export { AddAttachmentsResult, AttachmentOptions, ChatApiError, ChatError, ChatProtocolError, ChatRuntime, ChatRuntimeOptions, ChatStreamError, ChatTimeoutError, DEFAULT_REST_PATHS, Listener, MaybePromise, MemoryStorage, NEW_THREAD_KEY, ParseResult, PersistOptions, PersistenceOptions, Persister, ResolvedPersistence, RestAdapterOptions, RestPaths, RetryOptions, RuntimeEvents, RuntimeWarning, Scheduler, ScopeConfig, ScopeSummary, SendOptions, SessionState, SetStateOptions, SseMessage, SseParser, StorageAdapter, StorageKind, Store, ThreadHandle, UploadOptions, createChatRuntime, createMemoryStorage, createPersister, createRestAdapter, createSafeStorage, createStore, createWebStorage, defaultScopeToRequest, filterConversations, formatBytes, frameScheduler, groupConversations, groupKeyFor, isAbortError, isContentBlock, mergeWorkflowContexts, metaFromBootstrap, normalizeConversationDetail, normalizeMessages, parseStreamEvent, readSse, selectAll, sortConversations, summarizeScope, syncScheduler, toConversationItem, toErrorInfo } from './core.cjs';
export { C as ChatAdapter, P as ProtocolWarning, S as SendMessageOptions } from './adapter-CA1yC1wF.cjs';
import { c as ComposerAttachment, b as ChatMessage } from './stream-reducer-BydUyRD3.cjs';
export { B as BlockStatus, C as ChatBlock, d as ChatErrorInfo, a as CheckpointState, e as CheckpointStatus, f as ComposerAttachmentStatus, g as ComposerState, h as ConversationGroup, i as ConversationGroupKey, j as ConversationItem, k as ConversationsState, D as DeltaHandler, L as LoadStatus, M as MessageStatus, P as PendingCheckpoint, R as ReduceContext, l as RunState, S as ScopeGroup, m as ScopeItem, n as ScopeSelection, o as ScopeState, T as ThreadMeta, p as ThreadState, q as createThreadState, r as defaultApplyDelta, s as emptyMeta, t as interruptRun, u as reduceStreamEvent, v as textFieldOf } from './stream-reducer-BydUyRD3.cjs';
import { ChatProviderProps } from './headless.cjs';
export { Block, BlockContext, BlockErrorBoundary, BlockErrorBoundaryProps, ChatContext, ChatContextValue, ChatLabels, ChatProvider, Composer, ComposerInputProps, ConversationList, GroupSelectionState, Hitl, Message, MessageBlocks, MessageComponents, MessageContext, ScrollController, Suggestions, Thread, ThreadContext, ThreadProvider, createBlockRegistry, defaultLabels, defineBlock, messageText, shallowEqual, useActiveConversationId, useBlock, useBlockActions, useChatActions, useChatContext, useChatEvent, useChatRuntime, useComposer, useComposerContext, useConversations, useHitl, useHitlChoice, useIsBusy, useLabels, useMessage, useMessages, usePreference, useRun, useScope, useStoreSelector, useThread, useThreadHandle, useThreadMeta, useThreadScroll } from './headless.cjs';
import { B as BlockRenderProps, E as ErrorData, S as SourcesData, T as TextData, d as ThinkingData, e as ToolCallData, A as ApprovalData, f as ChoiceData, g as ArtifactData, I as ImageData, P as PlanData, h as TableColumn, i as TableData, a as BlockDefinition } from './parsers-CfaHqze3.cjs';
export { j as BLOCK_TYPES, k as BlockActions, l as BlockRegistry, C as ChartData, b as ChartKind, c as ChartSeries, m as ChatAction, n as ChoiceOption, F as FormatOptions, o as PlanStep, q as PlanStepStatus, r as SourceItem, s as ToolStatus, V as ValueFormat, t as applyPlanDelta, u as formatJsonish, v as formatValue, w as humanizeKey, x as parseApproval, y as parseArtifact, p as parseChart, z as parseChoice, D as parseError, G as parseImage, H as parsePlan, J as parseSources, K as parseTable, L as parseText, M as parseThinking, N as parseToolCall } from './parsers-CfaHqze3.cjs';
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
/** Figma Composer-scope + SourcePicker: which workflows the question is about. */
declare function ScopePicker(): react.JSX.Element | null;
interface ChatComposerProps {
    placeholder?: string;
    /** Extra controls before the send button (a model picker, a mic…). */
    extraActions?: ReactNode;
    /** Rendered under the composer (a disclaimer, a hint). */
    footer?: ReactNode;
    /** @default 8 */
    maxRows?: number;
    autoFocus?: boolean;
}
/** Figma Composer: the input, attachments, the scope picker and send/stop. */
declare function ChatComposer({ placeholder, extraActions, footer, maxRows, autoFocus }: ChatComposerProps): react.JSX.Element;

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
/** Blocks nobody claimed: raw JSON in development, nothing in production. */
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
/** Renders blocks nobody claimed: JSON in development, nothing in production. */
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
declare function ErrorNotice({ title, message, retryable, retryAfter, onRetry, }: {
    title: ReactNode;
    message?: ReactNode;
    retryable?: boolean;
    retryAfter?: number | null;
    onRetry?: () => void;
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

export { AgenticChat, type AgenticChatProps, ApprovalBlock, ApprovalData, ArtifactBlock, ArtifactData, AssistantTurn, type AtomsTheme, Attachment, AttachmentCard, BLOCK_ICON_PX, BlockCrashNotice, BlockDefinition, BlockRenderProps, BlockShell, type BlockShellProps, type BlockTone, type ChatComponents, ChatComposer, type ChatComposerProps, ChatHeader, type ChatHeaderProps, ChatHistory, type ChatHistoryProps, ChatMessage, ChatProviderProps, ChatSuggestions, ChatThread, type ChatThreadProps, ChoiceBlock, ChoiceData, ComposerAttachment, ContentBlock, DataTable, ErrorBlock, ErrorData, ErrorNotice, FileCard, type FileCardProps, ImageBlock, ImageData, type KeyValueItem, KeyValueList, Markdown, type MarkdownProps, type MarkdownSize, PendingTurn, PlanBlock, PlanData, PulseDot, RetryButton, RunStatus, ScopePicker, Shimmer, SourcesBlock, SourcesData, SuggestedPrompt, TableBlock, TableColumn, TableData, TextBlock, TextData, ThinkingBlock, ThinkingData, type ThreadComponents, ToolBlock, ToolCallData, UnknownBlock, UserTurn, WelcomeScreen, approvalBlock, artifactBlock, choiceBlock, defaultBlocks, errorBlock, formatDuration, imageBlock, mode, monoFont, planBlock, safeUrl, sourcesBlock, tableBlock, textBlock, thinkingBlock, toolCallBlock, unknownBlock, useCanRetry };
