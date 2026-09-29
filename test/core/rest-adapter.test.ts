import { describe, expect, it, vi } from 'vitest';
import { ChatApiError, createRestAdapter, type ProtocolWarning, type StreamEvent } from '../../src/core';

const sse = (events: object[], extra = '') =>
  new Response(events.map((e) => `event: ${(e as { type: string }).type}\ndata: ${JSON.stringify(e)}\n\n`).join('') + extra, {
    headers: { 'content-type': 'text/event-stream' },
  });

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

async function drain(it: AsyncIterable<StreamEvent>) {
  const out: StreamEvent[] = [];
  for await (const e of it) out.push(e);
  return out;
}

describe('createRestAdapter', () => {
  it('calls the schema-v1 paths with auth headers from a function', async () => {
    const fetch = vi.fn(async () => json({ conversations: [] }));
    const adapter = createRestAdapter({
      baseUrl: 'https://api.test/',
      headers: async () => ({ Authorization: 'Bearer t0k' }),
      fetch,
    });
    await adapter.listConversations();
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.test/v1/conversations');
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer t0k');
  });

  it('encodes ids and unwraps the conversations list (and accepts a bare array)', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json({ conversations: [{ conversation_id: 'a' }] }))
      .mockResolvedValueOnce(json([{ conversation_id: 'b' }]))
      .mockResolvedValueOnce(json({ conversation_id: 'a/b', messages: [] }));
    const adapter = createRestAdapter({ baseUrl: 'https://api.test', fetch });
    expect(await adapter.listConversations()).toEqual([{ conversation_id: 'a' }]);
    expect(await adapter.listConversations()).toEqual([{ conversation_id: 'b' }]);
    await adapter.getConversation('a/b');
    expect(fetch.mock.calls[2]![0]).toBe('https://api.test/v1/conversations/a%2Fb');
  });

  it('retries idempotent calls on 5xx and honors Retry-After', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json({ message: 'down' }, 503, { 'retry-after': '0' }))
      .mockResolvedValueOnce(json({ conversations: [] }));
    const adapter = createRestAdapter({ baseUrl: 'https://api.test', fetch, retry: { baseDelayMs: 1 } });
    await expect(adapter.listConversations()).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('never retries a message POST', async () => {
    const fetch = vi.fn(async () => json({ message: 'boom' }, 500));
    const adapter = createRestAdapter({ baseUrl: 'https://api.test', fetch, retry: { baseDelayMs: 1 } });
    const it = adapter.sendMessage(
      'c',
      { message: { role: 'user', type: 'default', content: { default: 'hi' } } },
      {
        signal: new AbortController().signal,
      },
    );
    await expect(drain(it)).rejects.toBeInstanceOf(ChatApiError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('refreshes once on 401 and retries the request', async () => {
    let token = 'old';
    const fetch = vi.fn(async (_url: string, init: RequestInit) =>
      new Headers(init.headers).get('authorization') === 'Bearer new' ? json({ conversations: [] }) : json({}, 401),
    );
    const onUnauthorized = vi.fn(async () => {
      token = 'new';
      return true;
    });
    const adapter = createRestAdapter({
      baseUrl: 'https://api.test',
      headers: () => ({ Authorization: `Bearer ${token}` }),
      fetch: fetch as unknown as typeof globalThis.fetch,
      onUnauthorized,
    });
    await expect(adapter.listConversations()).resolves.toEqual([]);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('throws ChatApiError with the server message for 4xx', async () => {
    const adapter = createRestAdapter({
      baseUrl: 'https://api.test',
      fetch: async () => json({ detail: 'title too long' }, 422),
    });
    await expect(adapter.updateConversation('c', { title: 'x' })).rejects.toMatchObject({
      status: 422,
      message: 'title too long',
    });
  });

  it('treats DELETE 404 as success', async () => {
    const adapter = createRestAdapter({ baseUrl: 'https://api.test', fetch: async () => json({}, 404) });
    await expect(adapter.deleteConversation('gone')).resolves.toBeUndefined();
  });

  it('streams parsed events, forcing stream:true, and warns on bad events', async () => {
    const warnings: ProtocolWarning[] = [];
    let sent: unknown;
    const adapter = createRestAdapter({
      baseUrl: 'https://api.test',
      fetch: async (_u, init) => {
        sent = JSON.parse(String(init?.body));
        return sse(
          [
            { type: 'message_start', message_id: 'm', conversation_id: 'c', run_id: 'r' },
            { type: 'future_event', x: 1 },
            { type: 'content_block_start', index: 0, block: { id: 'b', type: 'text', text: '' } },
            { type: 'message_stop', message_id: 'm', stop_reason: 'end_turn' },
          ],
          'event: status\ndata: {not json\n\n',
        );
      },
    });
    const events = await drain(
      adapter.sendMessage(
        'c',
        { stream: false, message: { role: 'user', type: 'default', content: { default: 'q' } } },
        {
          signal: new AbortController().signal,
          onWarning: (w) => warnings.push(w),
        },
      ),
    );
    expect((sent as { stream: boolean }).stream).toBe(true);
    expect(events.map((e) => e.type)).toEqual(['message_start', 'content_block_start', 'message_stop']);
    // category is filled in when a backend leaves it off
    expect((events[1] as { block: { category: string } }).block.category).toBe('content');
    expect(warnings.map((w) => w.code).sort()).toEqual(['malformed_event', 'unknown_event']);
  });

  it('turns a non-streamed JSON reply into equivalent events', async () => {
    const adapter = createRestAdapter({
      baseUrl: 'https://api.test',
      fetch: async () =>
        json({
          message_id: 'm1',
          content: [{ id: 'b', type: 'text', category: 'content', text: 'hi' }],
          stop_reason: 'end_turn',
        }),
    });
    const events = await drain(
      adapter.sendMessage(
        'c',
        { message: { role: 'user', type: 'default', content: { default: 'q' } } },
        {
          signal: new AbortController().signal,
        },
      ),
    );
    expect(events.map((e) => e.type)).toEqual(['message_start', 'content_block_start', 'content_block_stop', 'message_stop']);
  });

  it('sends the cancel body and reads status', async () => {
    let body: unknown;
    const adapter = createRestAdapter({
      baseUrl: 'https://api.test',
      fetch: async (url, init) => {
        expect(url).toBe('https://api.test/v1/conversations/c1/messages/cancel');
        body = JSON.parse(String(init?.body));
        return json({ status: false });
      },
    });
    await expect(adapter.cancelMessage('c1', 'q4ne0gpb53')).resolves.toEqual({ status: false });
    expect(body).toEqual({ message_id: 'q4ne0gpb53' });
  });

  it('allows path overrides', async () => {
    const fetch = vi.fn(async (_url: string) => json({ conversation_id: 'x' }));
    const adapter = createRestAdapter({
      baseUrl: 'https://api.test/chat',
      fetch: fetch as unknown as typeof globalThis.fetch,
      paths: { createConversation: '/start' },
    });
    await adapter.createConversation();
    expect(fetch.mock.calls[0]![0]).toBe('https://api.test/chat/start');
  });

  it('wraps network failures in a ChatError with code network', async () => {
    const adapter = createRestAdapter({
      baseUrl: 'https://api.test',
      retry: false,
      fetch: async () => {
        throw new TypeError('Failed to fetch');
      },
    });
    await expect(adapter.listConversations()).rejects.toMatchObject({ code: 'network' });
  });
});
