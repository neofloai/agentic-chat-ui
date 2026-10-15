import { describe, expect, it, vi } from 'vitest';
import {
  ChatApiError,
  createBlockRegistry,
  createChatRuntime,
  createRestAdapter,
  errorInfoFromCode,
  linkToolResults,
  normalizeConfig,
  normalizeConversationDetail,
  parseToolCall,
  reduceStreamEvent,
  resolveCapabilities,
  scopeGroupsFromWorkflows,
  stripCredentials,
  syncScheduler,
  toErrorInfo,
  type ChatConfig,
  type ChatMessage,
  type ChatRuntimeOptions,
  type ContentBlock,
  type ConversationDetail,
  type StreamEvent,
  type ThreadState,
} from '../../src/headless';
import { createThreadState } from '../../src/core';
import { createMockAdapter } from '../../src/mock';
import { bootstrap, createFakeAdapter, normalTurn, until, type FakeAdapter } from '../fixtures';

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

const envelope = (type: string, message: string, extra: Record<string, unknown> = {}) => ({
  error: { type, message, retry_after: null, request_id: 'req_1', details: null, ...extra },
});

const askNeoConfig: ChatConfig = {
  protocol_version: '1.2',
  product: { id: 'askneo', name: 'Ask Neo' },
  capabilities: {
    hitl: false,
    attachments: false,
    workflow_context: false,
    archive: false,
    cancel: 'disconnect',
    per_turn_model: true,
    per_turn_sources: true,
    conversation_pagination: false,
    message_pagination: false,
    stream_resume: false,
  },
  models: [
    { id: 'claude-haiku-4-5', label: 'Haiku 4.5', default: true },
    { id: 'claude-sonnet-5', label: 'Sonnet 5' },
  ],
  sources: [
    { id: 'search_v2', label: 'Knowledge base', default_enabled: true, meta: {} },
    { id: 'invoice_processing', label: 'Invoice processing', default_enabled: false, meta: {} },
  ],
  workflows: [],
  limits: { max_message_chars: 20, max_attachments: 0, max_attachment_bytes: 0, attachment_types: [] },
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

const withConfig = (config: ChatConfig | null, extra: Partial<FakeAdapter> = {}) =>
  createFakeAdapter({ getConfig: async () => config, ...extra });

const start = (cid: string, extra: Partial<Extract<StreamEvent, { type: 'message_start' }>> = {}): StreamEvent => ({
  type: 'message_start',
  message_id: 'm_a',
  conversation_id: cid,
  run_id: 'r1',
  ...extra,
});
const stop = (reason: 'end_turn' | 'paused' | 'error' | 'cancelled' = 'end_turn'): StreamEvent => ({
  type: 'message_stop',
  message_id: 'm_a',
  model: null,
  title: null,
  stop_reason: reason,
});
const blockEvents = (index: number, block: ContentBlock): StreamEvent[] => [
  { type: 'content_block_start', index, block },
  { type: 'content_block_stop', index, block },
];

const toolUse: ContentBlock = { id: 'toolu_1', type: 'tool_use', category: 'tool', tool: 'search_v2', input: { query: 'Acme' } };
const toolResult: ContentBlock = {
  id: 'tr_1',
  type: 'tool_result',
  category: 'tool',
  tool_use_id: 'toolu_1',
  is_error: false,
  error_code: null,
  result_count: 2,
  results: [{ title: 'INV-1042', snippet: 'Acme · 12,400', url: null }, { title: 'INV-1051' }],
  http_trace: null,
};

function reduceAll(events: StreamEvent[], state: ThreadState = createThreadState('c1')): ThreadState {
  return events.reduce((s, e, i) => reduceStreamEvent(s, e, { now: 1000 + i * 100 }), state);
}

// ---------------------------------------------------------------------------------------------
// F1 / F12: one card per tool call
// ---------------------------------------------------------------------------------------------

describe('tool_use and tool_result (F1, F12)', () => {
  it('pairs a streamed tool_result with its tool_use and hides it as a block of its own', () => {
    const s = reduceAll([start('c1'), ...blockEvents(0, toolUse), ...blockEvents(1, toolResult), stop()]);
    const [use, result] = s.messages[0]!.blocks;
    expect(result!.pairedWith).toBe('toolu_1');
    expect(use!.toolResult?.id).toBe('tr_1');
    expect(use!.toolResultMissing).toBeUndefined();
    const data = parseToolCall(use!.data, use);
    expect(data).toMatchObject({ name: 'search_v2', status: 'success', resultCount: 2, input: [['query', 'Acme']] });
    expect(data.results).toEqual([{ title: 'INV-1042', snippet: 'Acme · 12,400' }, { title: 'INV-1051' }]);
  });

  it('shows a tool as running until its result arrives, and failed when the result is an error', () => {
    const running = reduceAll([start('c1'), ...blockEvents(0, toolUse)]);
    expect(parseToolCall(running.messages[0]!.blocks[0]!.data, running.messages[0]!.blocks[0]).status).toBe('running');

    const failed = reduceAll([
      start('c1'),
      ...blockEvents(0, toolUse),
      ...blockEvents(1, { ...toolResult, is_error: true, error_code: 'erp_timeout', results: [] }),
      stop(),
    ]);
    const use = failed.messages[0]!.blocks[0]!;
    expect(parseToolCall(use.data, use)).toMatchObject({ status: 'error', error: 'erp_timeout' });
  });

  it('marks a tool_use interrupted when the reply ends without its result, but not when it pauses', () => {
    const ended = reduceAll([start('c1'), ...blockEvents(0, toolUse), stop('end_turn')]);
    const use = ended.messages[0]!.blocks[0]!;
    expect(use.toolResultMissing).toBe(true);
    expect(parseToolCall(use.data, use).status).toBe('interrupted');

    const paused = reduceAll([start('c1'), ...blockEvents(0, toolUse), stop('paused')]);
    expect(paused.messages[0]!.blocks[0]!.toolResultMissing).toBeUndefined();
  });

  it('pairs tools in history, and keeps a still-running last reply open', () => {
    const detail: ConversationDetail = {
      conversation_id: 'c1',
      title: 't',
      created_at: '2026-10-06T09:12:00Z',
      updated_at: '2026-10-06T09:12:00Z',
      archived: false,
      messages: [
        {
          message_id: 'a1',
          conversation_id: 'c1',
          role: 'assistant',
          stop_reason: 'end_turn',
          created_at: '',
          content: [toolUse, toolResult],
        },
        {
          message_id: 'a2',
          conversation_id: 'c1',
          role: 'assistant',
          stop_reason: 'end_turn',
          created_at: '',
          content: [{ ...toolUse, id: 'toolu_2' }],
        },
        {
          message_id: 'a3',
          conversation_id: 'c1',
          role: 'assistant',
          stop_reason: null,
          created_at: '',
          content: [{ ...toolUse, id: 'toolu_3' }],
        },
      ],
    };
    const { messages } = normalizeConversationDetail(detail);
    expect(messages[0]!.blocks[1]!.pairedWith).toBe('toolu_1');
    expect(messages[1]!.blocks[0]!.toolResultMissing).toBe(true);
    expect(messages[2]!.blocks[0]!.toolResultMissing).toBeUndefined();
  });

  it('keeps the same objects when nothing changes, so memoized cards do not re-render', () => {
    const s = reduceAll([start('c1'), ...blockEvents(0, toolUse), ...blockEvents(1, toolResult), stop()]);
    const m = s.messages[0]! as ChatMessage;
    expect(linkToolResults(m, { ended: true })).toBe(m);
  });

  it('renders a tool_result with no matching call as its own card', () => {
    const s = reduceAll([start('c1'), ...blockEvents(0, { ...toolResult, tool_use_id: 'elsewhere' }), stop()]);
    const b = s.messages[0]!.blocks[0]!;
    expect(b.pairedWith).toBeUndefined();
    expect(parseToolCall(b.data, b)).toMatchObject({ status: 'success', resultCount: 2 });
  });
});

// ---------------------------------------------------------------------------------------------
// F5 / F13: errors by code first
// ---------------------------------------------------------------------------------------------

describe('error codes (F5, F13)', () => {
  it('maps standard codes before HTTP statuses', () => {
    expect(errorInfoFromCode({ code: 'session_busy', status: 409 })).toMatchObject({ action: 'retry', retryable: true });
    expect(errorInfoFromCode({ code: 'duplicate_message', status: 409 })).toMatchObject({ action: 'none' });
    expect(
      errorInfoFromCode({ code: 'connection_expired', status: 422, details: { source: 'invoice_processing' } }),
    ).toMatchObject({
      action: 'reconnect',
      sourceId: 'invoice_processing',
    });
    expect(errorInfoFromCode({ code: 'unauthenticated', status: 401 })).toMatchObject({ action: 'sign_in', retryable: false });
    expect(errorInfoFromCode({ code: 'rate_limited', status: 429, retryAfter: 5 })).toMatchObject({
      action: 'retry',
      retryAfter: 5,
    });
  });

  it('falls back to the HTTP status for codes it does not know, including product codes', () => {
    expect(errorInfoFromCode({ code: 'askneo.workspace_required', status: 401, message: 'Pick a workspace.' })).toMatchObject({
      type: 'askneo.workspace_required',
      action: 'sign_in',
      message: 'Pick a workspace.',
    });
    expect(errorInfoFromCode({ code: 'askneo.other', status: 409 })).toMatchObject({ action: 'retry' });
    expect(errorInfoFromCode({ code: 'askneo.thing', status: 422, message: 'Nope' })).toMatchObject({
      action: 'none',
      message: 'Nope',
    });
  });

  it('reads the error envelope off a REST error, with the request id from the header', () => {
    const err = new ChatApiError(
      422,
      'x',
      envelope('connection_required', 'Connect Zoho.', { request_id: null, details: { source: 'zoho' } }),
      null,
      {
        requestId: 'hdr_9',
      },
    );
    expect(err).toMatchObject({ errorType: 'connection_required', requestId: 'hdr_9', details: { source: 'zoho' } });
    expect(toErrorInfo(err)).toMatchObject({
      type: 'connection_required',
      message: 'Connect Zoho.',
      action: 'reconnect',
      sourceId: 'zoho',
      status: 422,
      requestId: 'hdr_9',
    });
  });

  it('maps a stream error event by its code', () => {
    const s = reduceAll([
      start('c1'),
      {
        type: 'error',
        error_type: 'connection_expired',
        message: 'Reconnect invoice processing to continue.',
        retry_after: null,
        request_id: 'req_5',
        details: { source: 'invoice_processing' },
      },
      stop('error'),
    ]);
    expect(s.run.error).toMatchObject({ action: 'reconnect', sourceId: 'invoice_processing', requestId: 'req_5' });
  });
});

// ---------------------------------------------------------------------------------------------
// Transport: config endpoint, onUnauthorized with the code (F8, F14)
// ---------------------------------------------------------------------------------------------

describe('REST adapter (F8, F14)', () => {
  it('reads GET /v1/chat/config, and resolves null when the backend has none', async () => {
    const fetch = vi.fn(async () => json(askNeoConfig));
    const adapter = createRestAdapter({ baseUrl: 'https://api.test', fetch });
    expect(await adapter.getConfig!()).toEqual(askNeoConfig);
    expect(fetch).toHaveBeenCalledWith('https://api.test/v1/chat/config', expect.objectContaining({ method: 'GET' }));

    const none = createRestAdapter({ baseUrl: 'https://api.test', fetch: async () => json(envelope('not_found', 'no'), 404) });
    expect(await none.getConfig!()).toBeNull();
  });

  it('passes the 401 error code to onUnauthorized and retries once when it returns true', async () => {
    let calls = 0;
    const fetch = vi.fn(async () =>
      ++calls === 1 ? json(envelope('askneo.workspace_required', 'Pick a workspace.'), 401) : json({ conversations: [] }),
    );
    const onUnauthorized = vi.fn(async () => true);
    const adapter = createRestAdapter({ baseUrl: 'https://api.test', fetch, onUnauthorized });
    expect(await adapter.listConversations()).toEqual([]);
    expect(onUnauthorized).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'askneo.workspace_required', message: 'Pick a workspace.', requestId: 'req_1' }),
    );
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('surfaces the 401 with its code when onUnauthorized gives up', async () => {
    const adapter = createRestAdapter({
      baseUrl: 'https://api.test',
      fetch: async () => json(envelope('unauthenticated', 'Sign in again.'), 401, { 'x-request-id': 'req_h' }),
      onUnauthorized: () => false,
      retry: false,
    });
    const error = await adapter.listConversations().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ChatApiError);
    expect(error).toMatchObject({ status: 401, errorType: 'unauthenticated', message: 'Sign in again.', requestId: 'req_1' });
  });
});

// ---------------------------------------------------------------------------------------------
// Config: normalize and resolve (F4, F8)
// ---------------------------------------------------------------------------------------------

describe('config (F4, F8)', () => {
  it('normalizes a config without trusting its shape', () => {
    const c = normalizeConfig({
      protocol_version: '1.2',
      product: { id: 'askneo' },
      capabilities: { hitl: 'yes', archive: true, cancel: 'nope' },
      models: [{ id: 'm1' }, { label: 'no id' }, 'bad'],
      sources: [{ id: 's1', label: 'S1', meta: { connection: { status: 'connected' } } }, {}],
      workflows: [{ id: 'ip', label: 'Invoice Processing', workspaces: [{ id: 'ws1', label: 'Finance' }, {}] }],
      limits: { max_message_chars: 100, max_attachments: -1 },
    });
    expect(c).toMatchObject({
      capabilities: { archive: true },
      models: [{ id: 'm1', label: 'm1' }],
      sources: [{ id: 's1', label: 'S1', default_enabled: false }],
      workflows: [{ id: 'ip', workspaces: [{ id: 'ws1', label: 'Finance' }] }],
      limits: { max_message_chars: 100 },
    });
    expect(c!.capabilities.hitl).toBeUndefined();
    expect(c!.capabilities.cancel).toBeUndefined();
    expect(normalizeConfig('nope')).toBeNull();
  });

  it('lets the config decide, treats a missing flag as unsupported, and lets the host only turn things off', () => {
    const config = normalizeConfig(askNeoConfig)!;
    expect(resolveCapabilities('ready', config)).toEqual({
      hitl: false,
      attachments: false,
      workflowContext: false,
      archive: false,
      cancel: 'disconnect',
      perTurnModel: true,
      perTurnSources: true,
    });
    // The host can't turn on what the backend says it can't do, but can turn more off.
    expect(resolveCapabilities('ready', config, { hitl: true, perTurnModel: false })).toMatchObject({
      hitl: false,
      perTurnModel: false,
    });
    // Without a config, the host's switches apply.
    expect(resolveCapabilities('unavailable', undefined, { archive: false, cancel: 'disconnect' })).toMatchObject({
      archive: false,
      hitl: true,
      cancel: 'disconnect',
      perTurnModel: false,
    });
    expect(resolveCapabilities('ready', normalizeConfig({ capabilities: {} })!).cancel).toBe('disconnect');
  });

  it('turns config workflows into scope groups per workspace', () => {
    expect(
      scopeGroupsFromWorkflows([
        {
          id: 'ip',
          label: 'Invoice Processing',
          workspaces: [
            { id: 'fin', label: 'Finance' },
            { id: 'ap', label: 'AP' },
          ],
        },
        { id: 'col', label: 'Collections', workspaces: [{ id: 'fin', label: 'Finance' }] },
      ]),
    ).toEqual([
      {
        id: 'fin',
        label: 'Finance',
        items: [
          { id: 'ip', label: 'Invoice Processing' },
          { id: 'col', label: 'Collections' },
        ],
      },
      { id: 'ap', label: 'AP', items: [{ id: 'ip', label: 'Invoice Processing' }] },
    ]);
  });

  it('strips anything that looks like a credential from source meta', () => {
    expect(
      stripCredentials([
        {
          id: 'invoice_processing',
          enabled: true,
          meta: { bearer_token: 'jwt', api_key: 'k', connection: { status: 'connected' }, chunk_size: 5 },
        },
      ]),
    ).toEqual([{ id: 'invoice_processing', enabled: true, meta: { connection: { status: 'connected' }, chunk_size: 5 } }]);
  });
});

// ---------------------------------------------------------------------------------------------
// Runtime
// ---------------------------------------------------------------------------------------------

describe('runtime with a config (F3, F4, F8, F16)', () => {
  it('loads the config on start and exposes the capabilities', async () => {
    const { runtime } = setup({}, withConfig(askNeoConfig));
    await runtime.start();
    const s = runtime.chatConfig.getState();
    expect(s.status).toBe('ready');
    expect(s.config?.product.id).toBe('askneo');
    expect(s.capabilities).toMatchObject({ hitl: false, archive: false, cancel: 'disconnect' });
  });

  it('falls back to the host switches when there is no config endpoint', async () => {
    const { runtime } = setup({ capabilities: { archive: false } }, withConfig(null));
    await runtime.start();
    expect(runtime.chatConfig.getState()).toMatchObject({ status: 'unavailable', capabilities: { archive: false, hitl: true } });
  });

  it('keeps working with the defaults when the config call fails', async () => {
    const onWarning = vi.fn();
    const adapter = withConfig(null, {
      getConfig: async () => {
        throw new ChatApiError(503, 'down', null);
      },
    });
    const { runtime } = setup({ onWarning }, adapter);
    await runtime.start();
    expect(runtime.chatConfig.getState().status).toBe('error');
    expect(onWarning).toHaveBeenCalledWith(expect.objectContaining({ code: 'config_failed' }));
  });

  it('sends the conversation model with each message when the backend takes one per turn', async () => {
    const adapter = withConfig(askNeoConfig, {
      createConversation: async () => ({ ...bootstrap('conv_1'), selected_model: 'claude-sonnet-5' }),
    });
    const { runtime, thread } = setup({}, adapter);
    await runtime.start();
    expect(thread().meta.model).toBe('claude-sonnet-5');
    const p = runtime.send('hi');
    await until(() => expect(adapter.streams).toHaveLength(1));
    expect(adapter.bodies[0]!.model).toBe('claude-sonnet-5');
    adapter.lastStream().end();
    await p;
  });

  it('does not send a model per turn without a config that allows it', async () => {
    const { runtime, adapter } = setup();
    await runtime.start();
    const p = runtime.send('hi');
    await until(() => expect(adapter.streams).toHaveLength(1));
    expect(adapter.bodies[0]!.model).toBeUndefined();
    adapter.lastStream().end();
    await p;
  });

  it('leaves out sources and workflow context the backend does not take (F16, F4)', async () => {
    const onWarning = vi.fn();
    const adapter = withConfig(askNeoConfig);
    const { runtime } = setup(
      { onWarning, workflowContext: [{ workflow_name: 'ip', workspace_id: ['w'], context: {} }] },
      adapter,
    );
    await runtime.start();
    const p = runtime.send('hi', {
      sources: [
        { id: 'search_v2', enabled: true, meta: {} },
        { id: 'made_up', enabled: true, meta: {} },
      ],
    });
    await until(() => expect(adapter.streams).toHaveLength(1));
    expect(adapter.bodies[0]!.sources).toEqual([{ id: 'search_v2', enabled: true, meta: {} }]);
    expect(adapter.bodies[0]!.workflow_context).toBeUndefined();
    expect(onWarning).toHaveBeenCalledWith(expect.objectContaining({ code: 'unknown_source' }));
    expect(onWarning).toHaveBeenCalledWith(expect.objectContaining({ code: 'feature_disabled' }));
    adapter.lastStream().end();
    await p;
  });

  it('refuses a message longer than the config allows (F8)', async () => {
    const onWarning = vi.fn();
    const adapter = withConfig(askNeoConfig);
    const { runtime } = setup({ onWarning }, adapter);
    await runtime.start();
    await runtime.send('x'.repeat(21));
    expect(adapter.streams).toHaveLength(0);
    expect(onWarning).toHaveBeenCalledWith(expect.objectContaining({ code: 'message_too_long' }));
  });

  it('ignores checkpoints while hitl is off', async () => {
    const adapter = withConfig(askNeoConfig);
    const { runtime, thread } = setup({}, adapter);
    await runtime.start();
    const p = runtime.send('hi');
    await until(() => expect(adapter.streams).toHaveLength(1));
    adapter
      .lastStream()
      .push(
        start('conv_1'),
        ...blockEvents(0, { id: 'ap', type: 'approval', category: 'hitl', title: 'Post?' }),
        { type: 'checkpoint', checkpoint_id: 'cp', block_index: 0 },
        stop('end_turn'),
      );
    adapter.lastStream().end();
    await p;
    expect(thread().pendingCheckpoint).toBeUndefined();
  });

  it('fills the scope picker from the config workflows when the host has none', async () => {
    const config = {
      ...askNeoConfig,
      capabilities: { ...askNeoConfig.capabilities, workflow_context: true },
      workflows: [{ id: 'ip', label: 'Invoice Processing', workspaces: [{ id: 'fin', label: 'Finance' }] }],
    };
    const { runtime } = setup({}, withConfig(config));
    await runtime.start();
    expect(runtime.scope.getState()).toMatchObject({
      origin: 'config',
      groups: [{ id: 'fin', items: [{ id: 'ip' }] }],
      selection: { fin: ['ip'] },
    });
  });
});

describe('runtime: sources after PATCH (F6)', () => {
  it('keeps the server sources and never keeps a credential', async () => {
    const adapter = withConfig(askNeoConfig, {
      updateConversation: async (id) => ({
        conversation_id: id,
        title: 't',
        created_at: '',
        updated_at: '',
        archived: false,
        sources: [{ id: 'invoice_processing', enabled: true, meta: { connection: { status: 'connected' } } }],
      }),
    });
    const { runtime, thread } = setup({}, adapter);
    await runtime.start();
    const update = vi.spyOn(adapter, 'updateConversation');
    await runtime.setDefaultSources([{ id: 'invoice_processing', enabled: true, meta: { bearer_token: 'secret' } }]);
    expect(update.mock.calls[0]![1]).toEqual({
      sources: [{ id: 'invoice_processing', enabled: true, meta: { bearer_token: 'secret' } }],
    });
    expect(thread().meta.sources).toEqual([
      { id: 'invoice_processing', enabled: true, meta: { connection: { status: 'connected' } } },
    ]);
    expect(JSON.stringify(thread().meta)).not.toContain('secret');
  });
});

describe('runtime: unknown default sources (F16)', () => {
  it('does not PATCH when every source id is unknown, so the defaults are not wiped', async () => {
    const adapter = withConfig(askNeoConfig);
    const { runtime, thread } = setup({ onWarning: () => undefined }, adapter);
    await runtime.start();
    const update = vi.spyOn(adapter, 'updateConversation');
    const before = thread().meta.sources;
    await runtime.setDefaultSources([{ id: 'made_up', enabled: true, meta: {} }]);
    expect(update).not.toHaveBeenCalled();
    expect(thread().meta.sources).toBe(before);
  });
});

describe('runtime: client_message_id (F9, F13)', () => {
  it('sends a client id and swaps the optimistic message for the saved one', async () => {
    const { runtime, adapter, thread } = setup();
    await runtime.start();
    const p = runtime.send('hi');
    await until(() => expect(adapter.streams).toHaveLength(1));
    const clientId = adapter.bodies[0]!.client_message_id!;
    expect(thread().messages[0]).toMatchObject({ local: true, clientMessageId: clientId });
    adapter.lastStream().push(start('conv_1', { user_message_id: 'u_saved', client_message_id: clientId }), stop());
    adapter.lastStream().end();
    await p;
    expect(thread().messages[0]).toMatchObject({ id: 'u_saved', local: false, clientMessageId: clientId });
  });

  it('reuses the client id on retry when the server never confirmed the message', async () => {
    const { runtime, adapter } = setup();
    await runtime.start();
    const p = runtime.send('hi');
    await until(() => expect(adapter.streams).toHaveLength(1));
    adapter.lastStream().fail(new TypeError('network down'));
    await p;
    const r = runtime.retry();
    await until(() => expect(adapter.streams).toHaveLength(2));
    expect(adapter.bodies[1]!.client_message_id).toBe(adapter.bodies[0]!.client_message_id);
    adapter.lastStream().end();
    await r;
  });

  it('reloads the conversation on 409 duplicate_message instead of showing an error', async () => {
    const onError = vi.fn();
    const getConversation = vi.fn(async (id: string) => ({
      conversation_id: id,
      title: 'Saved',
      created_at: '',
      updated_at: '',
      archived: false,
      messages: [
        { message_id: 'u1', conversation_id: id, role: 'user' as const, created_at: '', content: 'hi', client_message_id: 'x' },
      ],
    }));
    const adapter = createFakeAdapter({
      getConversation,
      sendMessage: async function* () {
        yield* [];
        throw new ChatApiError(409, 'dup', envelope('duplicate_message', 'This message was already sent.'));
      },
    });
    const { runtime, thread } = setup({ onError }, adapter);
    await runtime.start();
    await runtime.send('hi');
    expect(getConversation).toHaveBeenCalledWith('conv_1');
    expect(thread().run.status).toBe('idle');
    expect(thread().messages.map((m) => m.id)).toEqual(['u1']);
    expect(onError).not.toHaveBeenCalled();
  });
});

describe('runtime: Stop (F2)', () => {
  it('closes the stream right away when the backend cancels by disconnect, without calling cancel', async () => {
    const adapter = withConfig(askNeoConfig);
    const { runtime, thread } = setup({}, adapter);
    await runtime.start();
    const p = runtime.send('hi');
    await until(() => expect(adapter.streams).toHaveLength(1));
    adapter.lastStream().push(start('conv_1'), ...blockEvents(0, toolUse));
    await until(() => expect(thread().run.messageId).toBe('m_a'));
    await runtime.cancel();
    await p;
    expect(adapter.cancels).toEqual([]);
    expect(thread().messages[1]!.status).toBe('cancelled');
    // The tool never answered: its card says so instead of spinning.
    expect(thread().messages[1]!.blocks[0]!.toolResultMissing).toBe(true);
  });

  it('closes the stream right away when cancel returns false', async () => {
    const adapter = createFakeAdapter({ cancelMessage: async () => ({ status: false }) });
    const { runtime, thread } = setup({}, adapter);
    await runtime.start();
    const p = runtime.send('hi');
    await until(() => expect(adapter.streams).toHaveLength(1));
    adapter.lastStream().push(start('conv_1'));
    await until(() => expect(thread().run.messageId).toBe('m_a'));
    const before = Date.now();
    await runtime.cancel();
    await p;
    expect(Date.now() - before).toBeLessThan(1000);
    expect(thread().messages[1]!.status).toBe('cancelled');
  });
});

describe('runtime: reconnect (F15)', () => {
  const connectionError = () =>
    new ChatApiError(
      422,
      'x',
      envelope('connection_expired', 'Reconnect invoice processing to continue.', { details: { source: 'invoice_processing' } }),
    );

  it('asks the host to reconnect and retries the message once', async () => {
    let attempts = 0;
    const adapter = createFakeAdapter();
    const send = adapter.sendMessage.bind(adapter);
    adapter.sendMessage = (id, body, opts) => {
      attempts++;
      if (attempts === 1) {
        adapter.bodies.push(body);
        return (async function* () {
          yield* [];
          throw connectionError();
        })();
      }
      return send(id, body, opts);
    };
    const onConnectionRequired = vi.fn(async () => true);
    const { runtime, thread } = setup({ onConnectionRequired }, adapter);
    await runtime.start();
    const p = runtime.send('hi');
    await until(() => expect(adapter.streams).toHaveLength(1));
    expect(onConnectionRequired).toHaveBeenCalledWith({
      sourceId: 'invoice_processing',
      code: 'connection_expired',
      message: 'Reconnect invoice processing to continue.',
      conversationId: 'conv_1',
    });
    // Never confirmed, so the retry reuses the client id.
    expect(adapter.bodies[1]!.client_message_id).toBe(adapter.bodies[0]!.client_message_id);
    adapter.lastStream().push(...normalTurn.map((e) => (e.type === 'message_start' ? { ...e, conversation_id: 'conv_1' } : e)));
    adapter.lastStream().end();
    await p;
    expect(thread().run.status).toBe('idle');
  });

  it('tries only once, then leaves a Reconnect error that can be retried by hand', async () => {
    const adapter = createFakeAdapter({
      sendMessage: () =>
        (async function* () {
          yield* [];
          throw connectionError();
        })(),
    });
    const onConnectionRequired = vi.fn(async () => true);
    const { runtime, thread } = setup({ onConnectionRequired }, adapter);
    await runtime.start();
    await runtime.send('hi');
    expect(onConnectionRequired).toHaveBeenCalledTimes(1);
    expect(thread().run.error).toMatchObject({ action: 'reconnect', sourceId: 'invoice_processing' });
    expect(await runtime.reconnect()).toBe(true);
    expect(onConnectionRequired).toHaveBeenCalledTimes(2);
  });

  it('does nothing without a hook', async () => {
    const adapter = createFakeAdapter({
      sendMessage: () =>
        (async function* () {
          yield* [];
          throw connectionError();
        })(),
    });
    const { runtime, thread } = setup({}, adapter);
    await runtime.start();
    await runtime.send('hi');
    expect(runtime.config.canReconnect).toBe(false);
    expect(thread().run.error?.action).toBe('reconnect');
    expect(await runtime.reconnect()).toBe(false);
  });
});

describe('registry: product blocks (F10)', () => {
  it('sends <product>.<name> blocks to the fallback, never to a built-in by category', () => {
    const text = { name: 'text', type: 'text', category: 'content', render: () => null };
    const fallback = { name: 'fallback', render: () => null };
    const registry = createBlockRegistry([text], fallback);
    expect(registry.resolve({ id: 'a', type: 'askneo.invoice_card', category: 'content' })).toBe(fallback);
    expect(registry.resolve({ id: 'b', type: 'markdown', category: 'content' })).toBe(text);
  });
});

describe('mock backend on the standard (F11)', () => {
  it('serves a config, echoes client ids, rejects duplicates and simulates a lost connection', async () => {
    const mock = createMockAdapter({ latency: 0, speed: 0 });
    const config = await mock.getConfig();
    expect(config).toMatchObject({ protocol_version: '1.2', capabilities: { cancel: 'server' } });

    const boot = await mock.createConversation();
    expect(boot.selected_model).toBe('claude-sonnet-5');
    const events: StreamEvent[] = [];
    const body = {
      stream: true,
      client_message_id: 'cm_1',
      message: { role: 'user' as const, type: 'default' as const, content: { default: 'Show me the markdown' } },
    };
    for await (const e of mock.sendMessage(boot.conversation_id, body, { signal: new AbortController().signal })) events.push(e);
    expect(events[0]).toMatchObject({ type: 'message_start', client_message_id: 'cm_1', user_message_id: expect.any(String) });

    const dup = mock.sendMessage(boot.conversation_id, body, { signal: new AbortController().signal });
    await expect(dup[Symbol.asyncIterator]().next()).rejects.toMatchObject({ status: 409, errorType: 'duplicate_message' });

    const lost = mock.sendMessage(
      boot.conversation_id,
      { ...body, client_message_id: 'cm_2', message: { ...body.message, content: { default: 'search invoice processing' } } },
      { signal: new AbortController().signal },
    );
    await expect(lost[Symbol.asyncIterator]().next()).rejects.toMatchObject({
      status: 422,
      errorType: 'connection_expired',
      details: { source: 'invoice_processing' },
    });
  });

  it('runs the reconnect flow end to end through the runtime', async () => {
    const mock = createMockAdapter({ latency: 0, speed: 0 });
    const runtime = createChatRuntime({
      adapter: mock,
      scheduler: syncScheduler,
      persistence: false,
      refreshOnFocus: false,
      onConnectionRequired: async ({ sourceId }) => {
        mock.connect(sourceId!);
        return true;
      },
    });
    await runtime.start();
    await runtime.send('Search invoice processing for held invoices');
    const s = runtime.activeThread().store.getState();
    expect(s.run.status).toBe('idle');
    const reply = s.messages[s.messages.length - 1]!;
    expect(reply.status).toBe('complete');
    const tool = reply.blocks.find((b) => b.type === 'tool_use')!;
    expect(parseToolCall(tool.data, tool)).toMatchObject({ status: 'success', resultCount: 2 });
  });
});
