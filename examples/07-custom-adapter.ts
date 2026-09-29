// README: A backend that doesn't follow schema v1
import { createRestAdapter, type ChatAdapter, type StreamEvent } from '@neofloai/agentic-chat/core';

declare function legacyAsk(
  conversationId: string,
  question: string,
  signal: AbortSignal,
): Promise<{ id: string; answer: string }>;

const base = createRestAdapter({ baseUrl: 'https://legacy.example.com' });

// Keep the schema-v1 calls that work and translate the ones that don't. The UI only ever sees
// schema-v1 events, so every block and hook keeps working.
export const legacyAdapter: ChatAdapter = {
  ...base,
  async *sendMessage(conversationId, body, { signal }): AsyncGenerator<StreamEvent> {
    if (body.message.type !== 'default') throw new Error('This backend has no HITL support.');
    const reply = await legacyAsk(conversationId, body.message.content.default, signal);
    yield { type: 'message_start', message_id: reply.id, conversation_id: conversationId, run_id: reply.id };
    const block = { id: `${reply.id}:0`, type: 'text', category: 'content', text: reply.answer };
    yield { type: 'content_block_start', index: 0, block };
    yield { type: 'content_block_stop', index: 0, block };
    yield { type: 'message_stop', message_id: reply.id, stop_reason: 'end_turn' };
  },
};
