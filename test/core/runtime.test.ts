import { describe, expect, it, vi } from 'vitest';
import {
  ChatApiError,
  createChatRuntime,
  createMemoryStorage,
  syncScheduler,
  type ChatRuntimeOptions,
  type StreamEvent,
} from '../../src/core';
import { createFakeAdapter, hitlPause, hitlResume, normalTurn, tick, until, type FakeAdapter } from '../fixtures';

const scope: ChatRuntimeOptions['scope'] = {
  groups: [
    {
      id: 'ws_fin',
      label: 'Finance',
      items: [
        { id: 'ip', label: 'Invoice Processing' },
        { id: 'col', label: 'Collections' },
      ],
    },
  ],
};

function setup(overrides: Partial<ChatRuntimeOptions> = {}, adapter: FakeAdapter = createFakeAdapter()) {
  const runtime = createChatRuntime({
    adapter,
    scheduler: syncScheduler,
    persistence: { storage: 'memory' },
    refreshOnFocus: false,
    ...overrides,
  });
  const thread = () => runtime.activeThread().store.getState();
  return { runtime, adapter, thread };
}

const withIds = (events: StreamEvent[], conversationId: string) =>
  events.map((e) => (e.type === 'message_start' ? { ...e, conversation_id: conversationId } : e));

describe('runtime: lifecycle', () => {
  it('eagerly creates a conversation on start and exposes the greeting', async () => {
    const { runtime, adapter, thread } = setup();
    await runtime.start();
    expect(adapter.created).toBe(1);
    expect(runtime.session.getState().activeId).toBe('conv_1');
    expect(thread().meta.greeting).toBe('Hey! What can I help you dig into today?');
    expect(thread().meta.suggestedPrompts).toHaveLength(1);
    // An empty chat stays out of history until something is sent.
    expect(runtime.conversations.getState().items.map((i) => i.id)).toEqual(['h8k2mfa931']);
  });

  it('adds the new chat to history as soon as the first message is sent', async () => {
    const { runtime, adapter } = setup();
    await runtime.start();
    const p = runtime.send('hello');
    await until(() => expect(adapter.streams).toHaveLength(1));
    expect(runtime.conversations.getState().items[0]!.id).toBe('conv_1');
    adapter.lastStream().end();
    await p;
  });

  it('start() is idempotent', async () => {
    const { runtime, adapter } = setup();
    await Promise.all([runtime.start(), runtime.start()]);
    expect(adapter.created).toBe(1);
  });

  it('reuses an untouched new chat instead of creating another', async () => {
    const { runtime, adapter } = setup();
    await runtime.start();
    await runtime.newConversation();
    await runtime.newConversation();
    expect(adapter.created).toBe(1);
  });

  it('lazy mode waits for the first message to create', async () => {
    const { runtime, adapter, thread } = setup({ conversationCreation: 'lazy' });
    await runtime.start();
    expect(adapter.created).toBe(0);
    const p = runtime.send('hello');
    await until(() => expect(adapter.streams).toHaveLength(1));
    expect(adapter.created).toBe(1);
    expect(thread().conversationId).toBe('conv_1');
    expect(thread().messages[0]).toMatchObject({ role: 'user' });
    adapter.lastStream().push(...withIds(normalTurn, 'conv_1'));
    adapter.lastStream().end();
    await p;
    expect(thread().messages).toHaveLength(2);
  });
});

describe('runtime: send', () => {
  it('sends the schema body, streams the reply, and bumps the conversation', async () => {
    const { runtime, adapter, thread } = setup({
      scope,
      workflowContext: () => [{ workflow_name: 'ip', workspace_id: ['ws_page'], context: { invoice_id: 'INV-1' } }],
    });
    await runtime.start();
    const p = runtime.send('  What were Acme’s top open invoices?  ');
    await until(() => expect(adapter.streams).toHaveLength(1));
    expect(thread().run.status).toBe('submitting');
    expect(thread().messages[0]).toMatchObject({ role: 'user', local: true });

    expect(adapter.bodies[0]).toEqual({
      stream: true,
      message: { role: 'user', type: 'default', content: { default: 'What were Acme’s top open invoices?' } },
      workflow_context: [
        { workflow_name: 'ip', workspace_id: ['ws_fin', 'ws_page'], context: { invoice_id: 'INV-1' } },
        { workflow_name: 'col', workspace_id: ['ws_fin'], context: {} },
      ],
    });

    const s = adapter.lastStream();
    s.push(...withIds(normalTurn.slice(0, 2), 'conv_1'));
    await until(() => expect(thread().run.statusLabel).toBe('Searching invoices…'));
    expect(thread().messages[0]!.local).toBe(false);
    s.push(...withIds(normalTurn.slice(2), 'conv_1'));
    s.end();
    await p;
    expect(thread().run.status).toBe('idle');
    expect(thread().messages[1]!.blocks[0]!.data.text).toBe("Acme's top three invoices were…");
    expect(runtime.conversations.getState().items[0]!.id).toBe('conv_1');
    expect(runtime.conversations.getState().runningIds).toEqual([]);
  });

  it('ignores empty input and sends while busy', async () => {
    const { runtime, adapter } = setup();
    await runtime.start();
    await runtime.send('   ');
    expect(adapter.streams).toHaveLength(0);
    const p = runtime.send('one');
    await until(() => expect(adapter.streams).toHaveLength(1));
    await runtime.send('two');
    expect(adapter.streams).toHaveLength(1);
    adapter.lastStream().end();
    await p;
  });

  it('keeps the user message and shows a retryable error when the POST fails', async () => {
    const adapter = createFakeAdapter({
      sendMessage: () => ({
        [Symbol.asyncIterator]: async function* () {
          throw new ChatApiError(503, 'down', null);
        },
      }),
    });
    const onError = vi.fn();
    const { runtime, thread } = setup({ onError }, adapter);
    await runtime.start();
    await runtime.send('hi');
    expect(thread().messages).toHaveLength(1);
    expect(thread().run).toMatchObject({ status: 'error', error: { type: 'http_503', retryable: true } });
    expect(onError).toHaveBeenCalled();
    expect(runtime.canRetry()).toBe(true);
  });

  it('marks a dropped stream interrupted, and retry resends the same body', async () => {
    const { runtime, adapter, thread } = setup();
    await runtime.start();
    const p = runtime.send('hi');
    await until(() => expect(adapter.streams).toHaveLength(1));
    adapter.lastStream().push(...withIds(normalTurn.slice(0, 4), 'conv_1'));
    await until(() => expect(thread().messages).toHaveLength(2));
    adapter.lastStream().fail(new TypeError('network down'));
    await p;
    expect(thread().messages[1]!.status).toBe('interrupted');
    expect(thread().run.error?.type).toBe('network');

    const r = runtime.retry();
    await until(() => expect(adapter.streams).toHaveLength(2));
    expect(adapter.bodies[1]).toEqual(adapter.bodies[0]);
    expect(thread().messages).toHaveLength(1); // failed reply removed
    adapter.lastStream().push(...withIds(normalTurn, 'conv_1'));
    adapter.lastStream().end();
    await r;
    expect(thread().messages).toHaveLength(2);
    expect(thread().messages[1]!.status).toBe('complete');
  });

  it('treats a stream that ends without message_stop as interrupted', async () => {
    const { runtime, adapter, thread } = setup();
    await runtime.start();
    const p = runtime.send('hi');
    await until(() => expect(adapter.streams).toHaveLength(1));
    adapter.lastStream().push(...withIds(normalTurn.slice(0, 3), 'conv_1'));
    adapter.lastStream().end();
    await p;
    expect(thread().messages[1]!.status).toBe('interrupted');
    expect(thread().run.error?.type).toBe('stream_ended');
  });

  it('times out an idle stream', async () => {
    const { runtime, adapter, thread } = setup({ streamIdleTimeoutMs: 30 });
    await runtime.start();
    const p = runtime.send('hi');
    await until(() => expect(adapter.streams).toHaveLength(1));
    adapter.lastStream().push(...withIds(normalTurn.slice(0, 1), 'conv_1'));
    await p;
    expect(thread().run.error?.type).toBe('timeout');
  });

  it('updates the history title from message_stop', async () => {
    const { runtime, adapter } = setup();
    await runtime.start();
    const p = runtime.send('hi');
    await until(() => expect(adapter.streams).toHaveLength(1));
    const events = withIds(normalTurn, 'conv_1').map((e) => (e.type === 'message_stop' ? { ...e, title: 'Acme invoices' } : e));
    adapter.lastStream().push(...events);
    adapter.lastStream().end();
    await p;
    expect(runtime.conversations.getState().items.find((i) => i.id === 'conv_1')?.title).toBe('Acme invoices');
    expect(runtime.activeThread().store.getState().meta.title).toBe('Acme invoices');
  });
});

describe('runtime: cancel', () => {
  it('posts cancel with the message_id from message_start', async () => {
    const { runtime, adapter, thread } = setup();
    await runtime.start();
    const p = runtime.send('hi');
    await until(() => expect(adapter.streams).toHaveLength(1));
    adapter.lastStream().push(...withIds(normalTurn.slice(0, 3), 'conv_1'));
    await until(() => expect(thread().run.messageId).toBe('q4ne0gpb53'));
    await runtime.cancel();
    expect(adapter.cancels).toEqual([{ conversationId: 'conv_1', messageId: 'q4ne0gpb53' }]);
    expect(thread().run.status).toBe('cancelling');
    adapter.lastStream().push({ type: 'message_stop', message_id: 'q4ne0gpb53', stop_reason: 'cancelled' });
    adapter.lastStream().end();
    await p;
    expect(thread().messages[1]!.status).toBe('cancelled');
    expect(thread().run.status).toBe('idle');
  });

  it('waits for message_start before cancelling when pressed early', async () => {
    const { runtime, adapter, thread } = setup();
    await runtime.start();
    const p = runtime.send('hi');
    await until(() => expect(adapter.streams).toHaveLength(1));
    await runtime.cancel();
    expect(adapter.cancels).toHaveLength(0);
    adapter.lastStream().push(...withIds(normalTurn.slice(0, 1), 'conv_1'));
    await until(() => expect(adapter.cancels).toHaveLength(1));
    expect(thread().run.status).toBe('cancelling'); // not flipped back to streaming
    adapter.lastStream().push({ type: 'message_stop', message_id: 'q4ne0gpb53', stop_reason: 'cancelled' });
    adapter.lastStream().end();
    await p;
  });

  it('stops locally if the server never closes the stream', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { runtime, adapter, thread } = setup();
      await runtime.start();
      const p = runtime.send('hi');
      await until(() => expect(adapter.streams).toHaveLength(1));
      adapter.lastStream().push(...withIds(normalTurn.slice(0, 3), 'conv_1'));
      await until(() => expect(thread().run.messageId).toBeDefined());
      await runtime.cancel();
      await vi.advanceTimersByTimeAsync(2_000);
      await p;
      expect(thread().messages[1]!.status).toBe('cancelled');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('runtime: HITL', () => {
  async function pausedRuntime(overrides: Partial<ChatRuntimeOptions> = {}) {
    const ctx = setup(overrides);
    await ctx.runtime.start();
    const p = ctx.runtime.send('post them');
    await until(() => expect(ctx.adapter.streams).toHaveLength(1));
    ctx.adapter.lastStream().push(...withIds(hitlPause, 'conv_1'));
    ctx.adapter.lastStream().end();
    await p;
    return ctx;
  }

  it('pauses on a checkpoint and blocks the composer by default', async () => {
    const { runtime, adapter, thread } = await pausedRuntime();
    expect(thread().run.status).toBe('paused');
    expect(thread().pendingCheckpoint?.checkpointId).toBe('z93hdnf02c');
    await runtime.send('something else');
    expect(adapter.streams).toHaveLength(1);
  });

  it('resumes with the exact schema hitl body and continues the same message', async () => {
    const { runtime, adapter, thread } = await pausedRuntime();
    const p = runtime.resume('z93hdnf02c', 'approve');
    await until(() => expect(adapter.streams).toHaveLength(2));
    expect(adapter.bodies[1]).toEqual({
      stream: true,
      message: { role: 'user', type: 'hitl', content: { checkpoint_id: 'z93hdnf02c', decision: 'approve' } },
    });
    const block = () => thread().messages[1]!.blocks.find((b) => b.id === 'b_appr')!;
    expect(block().checkpoint?.status).toBe('submitting');

    // A second click while submitting is ignored.
    await runtime.resume('z93hdnf02c', 'reject');
    expect(adapter.streams).toHaveLength(2);

    adapter.lastStream().push(...withIds(hitlResume, 'conv_1'));
    adapter.lastStream().end();
    await p;
    expect(block().checkpoint).toMatchObject({ status: 'resolved', decision: 'approve' });
    expect(thread().messages).toHaveLength(2);
    expect(thread().messages[1]!.blocks.map((b) => b.id)).toEqual(['b_text', 'b_appr', 'b_after']);
    expect(thread().run.status).toBe('idle');
  });

  it('sends checkbox decisions as a string array', async () => {
    const { runtime, adapter } = await pausedRuntime();
    void runtime.resume('z93hdnf02c', ['option a', 'option c']);
    await until(() => expect(adapter.streams).toHaveLength(2));
    expect(adapter.bodies[1]!.message.content).toEqual({ checkpoint_id: 'z93hdnf02c', decision: ['option a', 'option c'] });
    adapter.lastStream().end();
  });

  it('marks the checkpoint failed and restores the pause when the resume POST fails', async () => {
    const ctx = await pausedRuntime();
    ctx.adapter.sendMessage = () => ({
      [Symbol.asyncIterator]: async function* () {
        throw new ChatApiError(500, 'nope', null);
      },
    });
    await ctx.runtime.resume('z93hdnf02c', 'approve');
    const cp = ctx.thread().messages[1]!.blocks.find((b) => b.id === 'b_appr')!.checkpoint;
    expect(cp?.status).toBe('failed');
    expect(ctx.thread().pendingCheckpoint?.checkpointId).toBe('z93hdnf02c');
    expect(ctx.thread().run.status).toBe('paused');
  });

  it('lets the user type while paused when configured', async () => {
    const { runtime, adapter } = await pausedRuntime({ hitl: { composerWhilePaused: 'enabled' } });
    void runtime.send('actually, wait');
    await until(() => expect(adapter.streams).toHaveLength(2));
    adapter.lastStream().end();
  });
});

describe('runtime: history', () => {
  it('keeps a background stream running when switching conversations', async () => {
    const { runtime, adapter } = setup();
    await runtime.start();
    const p = runtime.send('long question');
    await until(() => expect(adapter.streams).toHaveLength(1));
    adapter.lastStream().push(...withIds(normalTurn.slice(0, 3), 'conv_1'));

    await runtime.selectConversation('h8k2mfa931');
    expect(runtime.activeThread().store.getState().messages).toHaveLength(2); // loaded from detail
    expect(runtime.conversations.getState().runningIds).toEqual(['conv_1']);

    adapter.lastStream().push(...withIds(normalTurn.slice(3), 'conv_1'));
    adapter.lastStream().end();
    await p;
    const bg = runtime.getThread('conv_1').store.getState();
    expect(bg.messages[1]!.status).toBe('complete');
    expect(runtime.conversations.getState().runningIds).toEqual([]);
  });

  it('renames optimistically and rolls back on failure', async () => {
    const adapter = createFakeAdapter({
      updateConversation: async () => {
        throw new ChatApiError(500, 'x', null);
      },
    });
    const { runtime } = setup({}, adapter);
    await runtime.start();
    await expect(runtime.renameConversation('h8k2mfa931', 'Renamed')).rejects.toBeInstanceOf(ChatApiError);
    expect(runtime.conversations.getState().items.find((i) => i.id === 'h8k2mfa931')?.title).toBe('Acme Q3 invoice review');
  });

  it('deleting the open conversation opens a new chat', async () => {
    const { runtime, adapter } = setup();
    await runtime.start();
    await runtime.selectConversation('h8k2mfa931');
    await runtime.deleteConversation('h8k2mfa931');
    expect(runtime.conversations.getState().items.some((i) => i.id === 'h8k2mfa931')).toBe(false);
    expect(runtime.session.getState().activeId).toBe('conv_1'); // the untouched new chat was reused
    expect(adapter.created).toBe(1);
  });

  it('drops a stale load when the user switches again quickly', async () => {
    let resolveSlow: (() => void) | undefined;
    const adapter = createFakeAdapter();
    const base = adapter.getConversation;
    adapter.getConversation = async (id) => {
      if (id === 'slow') await new Promise<void>((r) => (resolveSlow = r));
      return base(id);
    };
    const { runtime } = setup({}, adapter);
    await runtime.start();
    const slow = runtime.selectConversation('slow');
    await runtime.selectConversation('h8k2mfa931');
    resolveSlow?.();
    await slow;
    expect(runtime.session.getState().activeId).toBe('h8k2mfa931');
  });
});

describe('runtime: persistence', () => {
  it('restores the active conversation, drafts and scope after a reload', async () => {
    const storage = createMemoryStorage();
    const opts = { persistence: { storage, debounceMs: 1 }, scope } satisfies Partial<ChatRuntimeOptions>;

    const first = setup(opts);
    await first.runtime.start();
    await first.runtime.selectConversation('h8k2mfa931');
    first.runtime.setDraft('half-typed question');
    first.runtime.setScopeSelection({ ws_fin: ['col'] });
    await first.runtime.persistence.flush();
    first.runtime.dispose();

    const second = setup(opts);
    expect(second.runtime.session.getState()).toMatchObject({ activeId: 'h8k2mfa931', hydrated: true });
    expect(second.runtime.activeThread().composer.getState().text).toBe('half-typed question');
    expect(second.runtime.scope.getState().selection).toEqual({ ws_fin: ['col'] });
    await second.runtime.start();
    expect(second.adapter.created).toBe(0);
    expect(second.thread().messages).toHaveLength(2);
  });

  it('caches message history only when history persistence is on', async () => {
    const storage = createMemoryStorage();
    const opts = { persistence: { storage, debounceMs: 1, persist: { history: true } } } satisfies Partial<ChatRuntimeOptions>;
    const first = setup(opts);
    await first.runtime.start();
    await first.runtime.selectConversation('h8k2mfa931');
    await first.runtime.persistence.flush();
    first.runtime.dispose();

    const slow = createFakeAdapter({ getConversation: () => new Promise(() => undefined) });
    const second = setup(opts, slow);
    // Rendered from cache before the server answers.
    expect(second.thread().messages).toHaveLength(2);
    expect(second.runtime.conversations.getState().status).toBe('ready');
  });

  it('clear() wipes local state for logout', async () => {
    const storage = createMemoryStorage();
    const { runtime } = setup({ persistence: { storage, debounceMs: 1 } });
    await runtime.start();
    runtime.setDraft('secret');
    await runtime.persistence.flush();
    expect(storage.keys().length).toBeGreaterThan(0);
    await runtime.persistence.clear();
    expect(storage.keys()).toEqual([]);
  });
});

describe('runtime: attachments', () => {
  const file = (name: string, size = 10, type = 'application/pdf') => new File([new Uint8Array(size)], name, { type });

  it('uploads, includes ready attachments in the send, and clears the composer', async () => {
    const upload = vi.fn(async (f: File, { onProgress }: { onProgress: (p: number) => void }) => {
      onProgress(0.5);
      return { url: `https://files/${f.name}`, filename: f.name, content_type: f.type, size: f.size, meta: {} };
    });
    const { runtime, adapter } = setup({ attachments: { upload, accept: '.pdf,.xlsx', maxSize: 1000 } });
    await runtime.start();
    const { added, rejected } = runtime.addAttachments([file('a.pdf'), file('big.pdf', 5000), file('x.exe')]);
    expect(added).toHaveLength(1);
    expect(rejected.map((r) => r.file.name)).toEqual(['big.pdf', 'x.exe']);
    await until(() => expect(runtime.activeThread().composer.getState().attachments[0]!.status).toBe('ready'));

    const p = runtime.send('see attached');
    await until(() => expect(adapter.streams).toHaveLength(1));
    expect(adapter.bodies[0]!.attachments).toEqual([
      { url: 'https://files/a.pdf', filename: 'a.pdf', content_type: 'application/pdf', size: 10, meta: {} },
    ]);
    expect(runtime.activeThread().composer.getState()).toEqual({ text: '', attachments: [] });
    adapter.lastStream().end();
    await p;
  });

  it('does not send while an upload is in flight, and removal aborts it', async () => {
    let aborted = false;
    const upload = vi.fn(
      (_f: File, { signal }: { signal: AbortSignal }) =>
        new Promise<never>((_r, reject) => {
          signal.addEventListener('abort', () => {
            aborted = true;
            reject(new DOMException('x', 'AbortError'));
          });
        }),
    );
    const { runtime, adapter } = setup({ attachments: { upload } });
    await runtime.start();
    const [att] = runtime.addAttachments([file('a.pdf')]).added;
    await tick();
    await runtime.send('now');
    expect(adapter.streams).toHaveLength(0);
    runtime.removeAttachment(att!.id);
    expect(aborted).toBe(true);
    expect(runtime.activeThread().composer.getState().attachments).toEqual([]);
  });
});
