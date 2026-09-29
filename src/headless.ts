/**
 * `@neofloai/agentic-chat/headless` — the engine plus React bindings, with no styling and no
 * Atoms dependency. Bring your own design.
 */
export * from './core/index';
export * from './registry/index';
export * from './blocks/index';

export { ChatProvider, ThreadProvider, type ChatProviderProps } from './react/provider';
export { ChatContext, ThreadContext, MessageContext, BlockContext, useChatContext, type ChatContextValue } from './react/context';
export { defaultLabels, type ChatLabels } from './react/labels';
export {
  useChatRuntime,
  useLabels,
  useActiveConversationId,
  useThreadHandle,
  useThread,
  useMessages,
  useRun,
  useThreadMeta,
  useIsBusy,
  useChatActions,
  useComposer,
  usePreference,
  useConversations,
  useScope,
  useMessage,
  useBlock,
  useHitl,
  useBlockActions,
  useChatEvent,
  useStoreSelector,
  shallowEqual,
  type GroupSelectionState,
} from './react/hooks/index';
export {
  Thread,
  Message,
  Composer,
  Suggestions,
  ConversationList,
  Hitl,
  Block,
  MessageBlocks,
  useThreadScroll,
  useComposerContext,
  useHitlChoice,
  messageText,
  type ScrollController,
  type MessageComponents,
  type ComposerInputProps,
} from './react/primitives/index';
