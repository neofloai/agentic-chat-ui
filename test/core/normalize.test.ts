import { describe, expect, it } from 'vitest';
import { normalizeConversationDetail, normalizeMessages, type WireMessage } from '../../src/core';
import { detail } from '../fixtures';

describe('normalizeConversationDetail', () => {
  it('maps the schema example into the stream block model', () => {
    const n = normalizeConversationDetail(detail());
    expect(n.meta.title).toBe('Acme Q3 invoice review');
    expect(n.messages).toHaveLength(2);
    expect(n.messages[0]).toMatchObject({ role: 'user', status: 'complete' });
    expect(n.messages[1]!.blocks[0]).toMatchObject({ type: 'text', status: 'complete', category: 'content' });
    expect(n.pendingCheckpoint).toBeUndefined();
  });
});

describe('normalizeMessages', () => {
  const base = { conversation_id: 'c', created_at: '2026-09-17T14:32:00Z' };

  it('accepts string and {default} user content', () => {
    const { messages } = normalizeMessages([
      { ...base, message_id: 'a', role: 'user', content: 'plain' },
      { ...base, message_id: 'b', role: 'user', content: { default: 'send-shaped' } },
    ] as WireMessage[]);
    expect(messages.map((m) => m.blocks[0]!.data.text)).toEqual(['plain', 'send-shaped']);
  });

  it('restores a pending checkpoint on a paused last turn', () => {
    const { messages, pendingCheckpoint } = normalizeMessages([
      {
        ...base,
        message_id: 'm',
        role: 'assistant',
        stop_reason: 'paused',
        content: [
          { id: 'appr', type: 'approval', category: 'hitl', title: 'Post?', checkpoint: { checkpoint_id: 'cp1', requires: {} } },
        ],
      },
    ] as WireMessage[]);
    expect(messages[0]!.status).toBe('paused');
    expect(messages[0]!.blocks[0]!.checkpoint).toMatchObject({ id: 'cp1', status: 'pending' });
    expect(pendingCheckpoint).toMatchObject({ checkpointId: 'cp1', blockId: 'appr', messageId: 'm' });
  });

  it('applies a recorded hitl decision and hides the decision message', () => {
    const { messages, pendingCheckpoint } = normalizeMessages([
      {
        ...base,
        message_id: 'm',
        role: 'assistant',
        stop_reason: 'paused',
        content: [{ id: 'appr', type: 'approval', category: 'hitl', checkpoint_id: 'cp1' }],
      },
      { ...base, message_id: 'u', role: 'user', type: 'hitl', content: { checkpoint_id: 'cp1', decision: 'approve' } },
    ] as WireMessage[]);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.blocks[0]!.checkpoint).toMatchObject({ status: 'resolved', decision: 'approve' });
    expect(pendingCheckpoint).toBeUndefined();
  });

  it('skips junk entries and fills missing block ids', () => {
    const { messages } = normalizeMessages([
      null,
      { ...base, message_id: 'x', role: 'assistant', content: [{ type: 'text', text: 'no id' }] },
    ] as unknown as WireMessage[]);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.blocks[0]!.id).toBe('x:0');
  });
});
