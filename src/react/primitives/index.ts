import { BlockRenderer, MessageBlocks } from './block';
import {
  ComposerAttachmentInput,
  ComposerAttachments,
  ComposerCancel,
  ComposerInput,
  ComposerRoot,
  ComposerSend,
} from './composer';
import { MessageIf, MessageRoot } from './message';
import {
  ConversationListItem,
  ConversationListNew,
  ConversationListRoot,
  HitlOption,
  HitlRoot,
  HitlSubmit,
  SuggestionItem,
  SuggestionsRoot,
} from './misc';
import { ThreadEmpty, ThreadIf, ThreadMessages, ThreadRoot, ThreadScrollToBottom, ThreadStatus, ThreadViewport } from './thread';

/** Headless building blocks. Unstyled; every part accepts normal HTML props. */
export const Thread = {
  Root: ThreadRoot,
  Viewport: ThreadViewport,
  Messages: ThreadMessages,
  Empty: ThreadEmpty,
  If: ThreadIf,
  Status: ThreadStatus,
  ScrollToBottom: ThreadScrollToBottom,
};

export const Message = {
  Root: MessageRoot,
  Blocks: MessageBlocks,
  If: MessageIf,
};

export const Composer = {
  Root: ComposerRoot,
  Input: ComposerInput,
  Send: ComposerSend,
  Cancel: ComposerCancel,
  AttachmentInput: ComposerAttachmentInput,
  Attachments: ComposerAttachments,
};

export const Suggestions = {
  Root: SuggestionsRoot,
  Item: SuggestionItem,
};

export const ConversationList = {
  Root: ConversationListRoot,
  Item: ConversationListItem,
  New: ConversationListNew,
};

export const Hitl = {
  Root: HitlRoot,
  Option: HitlOption,
  Submit: HitlSubmit,
};

export { BlockRenderer as Block, MessageBlocks };
export { useThreadScroll, type ScrollController, type MessageComponents } from './thread';
export { useComposerContext, type ComposerInputProps } from './composer';
export { useHitlChoice } from './misc';
export { messageText } from './message';
