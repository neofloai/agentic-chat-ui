import { describe, expect, it } from 'vitest';
import {
  ChatApiError,
  createChatRuntime,
  createMemoryStorage,
  createRestAdapter,
  createThreadState,
  defaultApplyDelta,
  reduceStreamEvent,
  syncScheduler,
  textFieldOf,
  type ChatRuntimeOptions,
  type RuntimeWarning,
  type StreamEvent,
} from '../../src/core';
import { createFakeAdapter, hitlPause, hitlResume, normalTurn, until, type FakeAdapter } from '../fixtures';

const ctx = { now: 5 };
const run = (events: StreamEvent[], from = createThreadState('c')) => events.reduce((s, e) => reduceStreamEvent(s, e, ctx), from);

describe('stream reducer branches', () => {
  it('replaces a block that starts twice, keeping its checkpoint', () => {
    const paused = run(hitlPause.slice(0, 6));
    const again = reduceStreamEvent(
      { ...paused, run: { ...paused.run, status: 'streaming' } },
      { type: 'content_block_start', index: 3, block: { id: 'b_appr', type: 'approval', category: 'hitl', title: 'v2' } },
      ctx,
    );
    const b = again.messages[0]!.blocks.find((x) => x.id === 'b_appr')!;
    expect(b.data.title).toBe('v2');
    expect(b.checkpoint?.id).toBe('z93hdnf02c');
  });

  it('accepts a stop for a block that never started', () => {
    const s = run([
      normalTurn[0]!,
      { type: 'content_block_stop', index: 4, block: { id: 'late', type: 'text', category: 'content', text: 'x' } },
      { type: 'content_block_stop', index: 4, block: { id: 'late', type: 'text', category: 'content', text: 'y' } },
    ]);
    expect(s.messages[0]!.blocks).toHaveLength(1);
    expect(s.messages[0]!.blocks[0]!.data.text).toBe('y');
  });

  it('ignores a checkpoint with nothing to attach to, and usage-less deltas', () => {
    const empty = createThreadState('c');
    expect(reduceStreamEvent(empty, { type: 'checkpoint', checkpoint_id: 'x', block_index: 0 }, ctx)).toBe(empty);
    const started = run([normalTurn[0]!]);
    expect(reduceStreamEvent(started, { type: 'checkpoint', checkpoint_id: 'x', block_index: 0 }, ctx)).toBe(started);
    expect(reduceStreamEvent(started, { type: 'message_delta' }, ctx)).toBe(started);
    // A checkpoint for an unknown index attaches to the last block.
    const withBlock = run([normalTurn[0]!, normalTurn[2]!]);
    const cp = reduceStreamEvent(withBlock, { type: 'checkpoint', checkpoint_id: 'y', block_index: 99 }, ctx);
    expect(cp.messages[0]!.blocks[0]!.checkpoint?.id).toBe('y');
  });

  it('keeps the error through message_stop(error) and handles unknown events', () => {
    const s = run([
      normalTurn[0]!,
      { type: 'error', error_type: 'boom', message: 'bad', retry_after: null },
      { type: 'message_stop', message_id: '', stop_reason: 'error' },
    ]);
    expect(s.run).toMatchObject({ status: 'error', error: { type: 'boom' } });
    expect(reduceStreamEvent(s, { type: 'mystery' } as unknown as StreamEvent, ctx)).toBe(s);
  });

  it('defaultApplyDelta covers thinking, objects, partial JSON and no-ops', () => {
    const thinking = { id: 't', type: 'thinking', category: 'reasoning', thinking: '' };
    expect(textFieldOf(thinking)).toBe('thinking');
    expect(defaultApplyDelta(thinking, { type: 'text_delta', text: 'a' }, undefined)).toMatchObject({ thinking: 'a' });
    const tool = { id: 'x', type: 'tool_call', category: 'tool' };
    expect(defaultApplyDelta(tool, { type: 'input_json_delta', partial_json: '{"a":' }, undefined)).toMatchObject({
      partial_json: '{"a":',
    });
    expect(defaultApplyDelta(tool, { type: 'snap' }, { status: 'running', id: 'hijack' })).toMatchObject({
      id: 'x',
      status: 'running',
    });
    expect(defaultApplyDelta(tool, { type: 'noop' }, 42)).toBe(tool);
  });
});

describe('rest adapter branches', () => {
  it('rethrows non-404 delete errors and passes object headers', async () => {
    let seen: Headers | undefined;
    const adapter = createRestAdapter({
      baseUrl: 'https://api.test',
      headers: { 'X-Tenant-Hint': 'n/a' },
      retry: false,
      fetch: async (_u, init) => {
        seen = new Headers(init?.headers);
        return new Response('{"message":"nope"}', { status: 409 });
      },
    });
    await expect(adapter.deleteConversation('c')).rejects.toBeInstanceOf(ChatApiError);
    expect(seen?.get('x-tenant-hint')).toBe('n/a');
  });

  it('synthesizes events from a wrapped non-streamed reply and handles empty bodies', async () => {
    const adapter = createRestAdapter({
      baseUrl: 'https://api.test',
      fetch: async (url) =>
        String(url).endsWith('/messages')
          ? new Response(
              JSON.stringify({
                title: 'Named',
                message: { message_id: 'm', stop_reason: 'paused', model: 'x', content: [{ id: 'b', type: 'text', text: 'hi' }] },
              }),
              {
                headers: { 'content-type': 'application/json' },
              },
            )
          : new Response(null, { status: 204 }),
    });
    const events: StreamEvent[] = [];
    for await (const e of adapter.sendMessage(
      'c',
      { message: { role: 'user', type: 'default', content: { default: 'q' } } },
      { signal: new AbortController().signal },
    ))
      events.push(e);
    expect(events.at(-1)).toMatchObject({ type: 'message_stop', stop_reason: 'paused', title: 'Named', model: 'x' });
    await expect(adapter.cancelMessage('c', 'm')).resolves.toEqual({ status: false });
  });
});

function setup(overrides: Partial<ChatRuntimeOptions> = {}, adapter: FakeAdapter = createFakeAdapter()) {
  const warnings: RuntimeWarning[] = [];
  const runtime = createChatRuntime({
    adapter,
    scheduler: syncScheduler,
    persistence: { storage: 'memory' },
    refreshOnFocus: false,
    onWarning: (w) => warnings.push(w),
    ...overrides,
  });
  return { runtime, adapter, warnings, thread: () => runtime.activeThread().store.getState() };
}

describe('runtime branches', () => {
  it('lazy newConversation returns null and selectConversation(null) opens a new chat', async () => {
    const { runtime } = setup({ conversationCreation: 'lazy' });
    await runtime.start();
    expect(await runtime.newConversation()).toBeNull();
    await runtime.selectConversation('h8k2mfa931');
    await runtime.selectConversation(null);
    expect(runtime.session.getState().activeId).toBeNull();
  });

  it('cancel and retry are no-ops when nothing is running or failed', async () => {
    const { runtime, adapter } = setup();
    await runtime.start();
    await runtime.cancel();
    await runtime.retry();
    expect(runtime.canRetry()).toBe(false);
    expect(adapter.cancels).toHaveLength(0);
  });

  it('sends explicit attachments and warns while uploads are pending', async () => {
    const { runtime, adapter, warnings } = setup({ attachments: { upload: () => new Promise(() => undefined) } });
    await runtime.start();
    runtime.addAttachments([new File(['x'], 'a.pdf')]);
    await runtime.send('with pending upload');
    expect(warnings.map((w) => w.code)).toContain('attachments_uploading');
    const att = { url: 'u', filename: 'f.pdf', content_type: 'application/pdf', size: 1, meta: {} };
    const p = runtime.send('explicit', { attachments: [att] });
    await until(() => expect(adapter.streams).toHaveLength(1));
    expect(adapter.bodies[0]!.attachments).toEqual([att]);
    adapter.lastStream().end();
    await p;
  });

  it('retries a failed decision by resuming again', async () => {
    const { runtime, adapter, thread } = setup();
    await runtime.start();
    const p = runtime.send('post');
    await until(() => expect(adapter.streams).toHaveLength(1));
    adapter.lastStream().push(...hitlPause.map((e) => (e.type === 'message_start' ? { ...e, conversation_id: 'conv_1' } : e)));
    adapter.lastStream().end();
    await p;
    const original = adapter.sendMessage.bind(adapter);
    adapter.sendMessage = () => ({
      [Symbol.asyncIterator]: async function* () {
        throw new ChatApiError(500, 'x', null);
      },
    });
    await runtime.resume('z93hdnf02c', 'approve');
    // The card is the retry path for a failed decision: it's live again, with the error shown.
    expect(thread().pendingCheckpoint?.checkpointId).toBe('z93hdnf02c');
    expect(runtime.canRetry()).toBe(false);
    adapter.sendMessage = original;
    const r = runtime.retry();
    await until(() => expect(adapter.streams).toHaveLength(2));
    expect(adapter.bodies[1]!.message).toMatchObject({ type: 'hitl', content: { decision: 'approve' } });
    adapter.lastStream().push(...hitlResume.map((e) => (e.type === 'message_start' ? { ...e, conversation_id: 'conv_1' } : e)));
    adapter.lastStream().end();
    await r;
    expect(thread().messages[1]!.blocks.find((b) => b.id === 'b_appr')!.checkpoint?.status).toBe('resolved');
  });

  it('keeps cached messages when revalidation fails', async () => {
    const storage = createMemoryStorage();
    const persistence = { storage, debounceMs: 1, persist: { history: true } };
    const first = setup({ persistence });
    await first.runtime.start();
    await first.runtime.selectConversation('h8k2mfa931');
    await first.runtime.persistence.flush();
    first.runtime.dispose();

    const failing = createFakeAdapter({
      getConversation: async () => {
        throw new ChatApiError(503, 'x', null);
      },
    });
    const second = setup({ persistence }, failing);
    await second.runtime.start();
    expect(second.thread().messages).toHaveLength(2);
    expect(second.warnings.map((w) => w.code)).toContain('revalidate_failed');
  });

  it('survives corrupt persisted data', () => {
    const storage = createMemoryStorage();
    storage.setItem('neoflo-chat:default:active', 'not json');
    storage.setItem('neoflo-chat:default:drafts', JSON.stringify({ v: 1, savedAt: Date.now(), data: 'wrong shape' }));
    const { runtime } = setup({ persistence: { storage } });
    expect(runtime.session.getState()).toMatchObject({ hydrated: true, activeId: null });
  });

  it('rejects oversized and unsupported files with reasons', () => {
    const { runtime } = setup({
      attachments: {
        upload: async () => ({ url: 'u', filename: 'f', content_type: '', size: 0, meta: {} }),
        maxSize: 3,
        accept: 'image/*',
      },
    });
    const res = runtime.addAttachments([
      new File(['toolarge'], 'big.png', { type: 'image/png' }),
      new File(['x'], 'doc.pdf', { type: 'application/pdf' }),
    ]);
    expect(res.rejected.map((r) => r.reason)).toEqual([
      expect.stringMatching(/larger than 3 B/),
      expect.stringMatching(/isn't a supported/),
    ]);
  });

  it('throws a helpful error without an adapter', () => {
    expect(() => createChatRuntime({} as ChatRuntimeOptions)).toThrow(/adapter/);
  });
});
