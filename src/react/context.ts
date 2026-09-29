import { createContext, useContext } from 'react';
import type { ChatRuntime, ThreadHandle } from '../core/runtime/runtime';
import type { ChatBlock, ChatMessage } from '../core/store/types';
import type { BlockDefinition, BlockRegistry, ChatAction } from '../registry/types';
import type { ChatLabels } from './labels';

export interface ChatContextValue {
  runtime: ChatRuntime;
  registry: BlockRegistry;
  labels: ChatLabels;
  onAction?: (action: ChatAction) => void;
}

export const ChatContext = createContext<ChatContextValue | null>(null);

/** Pins hooks to one conversation instead of the active one (galleries, side-by-side chats). */
export const ThreadContext = createContext<ThreadHandle | null>(null);

export interface MessageContextValue {
  message: ChatMessage;
  /** The last message in the thread. */
  isLast: boolean;
}
export const MessageContext = createContext<MessageContextValue | null>(null);

export interface BlockContextValue {
  block: ChatBlock;
  message: ChatMessage;
  definition?: BlockDefinition;
}
export const BlockContext = createContext<BlockContextValue | null>(null);

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error(
      '[agentic-chat] This component must be rendered inside <ChatProvider> (or <AgenticChat>, which includes one).',
    );
  }
  return ctx;
}
