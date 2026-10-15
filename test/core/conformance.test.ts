import { describe, expect, it } from 'vitest';
import { formatReport, runConformance, runConformanceCli, type ConformanceReport } from '../../src/conformance';
import { ChatApiError, type StreamEvent } from '../../src/core';
import { createMockAdapter, type MockAdapter, type MockAdapterOptions } from '../../src/mock';

const AUTH = 'Bearer t0ken';

interface Tweaks {
  /** Rewrites a JSON response body before it's sent. */
  json?: (method: string, path: string, body: unknown) => unknown;
  /** Rewrites each stream event before it's sent. */
  event?: (e: StreamEvent) => StreamEvent;
  /** Status for a request without auth. */
  noAuthStatus?: number;
}

/** Serves a mock backend over `fetch`, the way a real one would answer HTTP. */
function httpBackend(mock: MockAdapter, tweaks: Tweaks = {}): typeof fetch {
  const respond = (status: number, body?: unknown, headers: Record<string, string> = {}) =>
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', 'x-request-id': 'req_http', ...headers },
    });
  const fail = (error: unknown) =>
    error instanceof ChatApiError
      ? respond(error.status, error.body)
      : respond(500, { error: { type: 'internal', message: String(error) } });

  return async (input, init) => {
    const url = new URL(String(input));
    const method = init?.method ?? 'GET';
    const path = url.pathname;
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    if (new Headers(init?.headers).get('authorization') !== AUTH) {
      return respond(tweaks.noAuthStatus ?? 401, {
        error: { type: 'unauthenticated', message: 'Sign in again.', request_id: 'r' },
      });
    }
    const out = (status: number, json: unknown) => respond(status, tweaks.json ? tweaks.json(method, path, json) : json);
    try {
      if (path === '/v1/chat/config') return out(200, await mock.getConfig());
      if (path === '/v1/conversation' && method === 'POST') return out(201, await mock.createConversation());
      if (path === '/v1/conversations') return out(200, { conversations: await mock.listConversations() });
      const m = /^\/v1\/conversations\/([^/]+)(\/messages(\/cancel)?)?$/.exec(path);
      if (!m) return respond(404, { error: { type: 'not_found', message: 'No route.' } });
      const id = decodeURIComponent(m[1]!);
      if (m[3]) return out(200, await mock.cancelMessage(id, body.message_id));
      if (m[2]) {
        const it = mock.sendMessage(id, body, { signal: init?.signal ?? new AbortController().signal })[Symbol.asyncIterator]();
        let first: IteratorResult<StreamEvent>;
        try {
          first = await it.next();
        } catch (error) {
          return fail(error);
        }
        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const write = (e: StreamEvent) => {
              const ev = tweaks.event ? tweaks.event(e) : e;
              controller.enqueue(encoder.encode(`event: ${ev.type}\ndata: ${JSON.stringify(ev)}\n\n`));
            };
            if (!first.done) write(first.value);
            for (;;) {
              const next = await it.next();
              if (next.done) break;
              write(next.value);
            }
            controller.close();
          },
        });
        return new Response(stream, {
          headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', 'x-accel-buffering': 'no' },
        });
      }
      if (method === 'GET') return out(200, await mock.getConversation(id));
      if (method === 'PATCH') return out(200, await mock.updateConversation(id, body));
      if (method === 'DELETE') {
        await mock.getConversation(id);
        await mock.deleteConversation(id);
        return new Response(null, { status: 204 });
      }
      return respond(405, { error: { type: 'invalid_request', message: 'Method not allowed.' } });
    } catch (error) {
      return fail(error);
    }
  };
}

const run = (options: MockAdapterOptions = {}, tweaks: Tweaks = {}) => {
  const mock = createMockAdapter({ latency: 0, speed: 0, ...options });
  return runConformance({ baseUrl: 'https://chat.test', headers: { Authorization: AUTH }, fetch: httpBackend(mock, tweaks) });
};

const status = (report: ConformanceReport, id: string) => report.checks.find((c) => c.id === id)?.status;
const failures = (report: ConformanceReport) =>
  report.checks.filter((c) => c.status === 'fail').map((c) => `${c.id}: ${c.detail}`);

describe('runConformance', () => {
  it('passes the mock backend, which follows the standard', async () => {
    const report = await run();
    expect(failures(report)).toEqual([]);
    expect(report.ok).toBe(true);
    for (const id of [
      'config.shape',
      'auth.unauthenticated',
      'create.shape',
      'get.shape',
      'patch.title',
      'patch.model',
      'stream.events',
      'stream.duplicate',
      'cancel.shape',
      'list.shape',
      'get.messages',
      'errors.not_found',
      'delete',
    ]) {
      expect(status(report, id), id).toBe('pass');
    }
    expect(formatReport(report)).toMatch(/^Conforms: \d+ passed, 0 failed/m);
  });

  it('checks that inputs the config turns off are refused', async () => {
    const report = await run({
      config: {
        capabilities: { hitl: false, attachments: false, workflow_context: false, archive: false, cancel: 'server' },
      },
    });
    expect(status(report, 'stream.unsupported.attachments')).toBe('pass');
    expect(status(report, 'stream.unsupported.workflow_context')).toBe('pass');
  });

  it('fails a backend that leaks identity, credentials or old field names', async () => {
    const report = await run(
      {},
      {
        json: (method, path, body) => {
          if (method === 'POST' && path === '/v1/conversation' && body && typeof body === 'object') {
            const b = body as Record<string, unknown>;
            const { selected_model, ...rest } = b;
            return {
              ...rest,
              model: selected_model,
              user_id: 'u_1',
              sources: [{ id: 'invoice_processing', enabled: true, meta: { bearer_token: 'jwt', bearer_token_set: true } }],
            };
          }
          return body;
        },
      },
    );
    const create = report.checks.find((c) => c.id === 'create.shape')!;
    expect(create.status).toBe('fail');
    expect(create.detail).toMatch(/"model"; the standard name is "selected_model"/);
    expect(create.detail).toMatch(/"user_id"/);
    expect(create.detail).toMatch(/bearer_token looks like a credential/);
    expect(report.ok).toBe(false);
  });

  it('fails a stream that does not echo client_message_id or pair its tools', async () => {
    const report = await run(
      {},
      {
        event: (e) => {
          if (e.type === 'message_start') return { ...e, client_message_id: null, user_message_id: null };
          if (e.type === 'content_block_stop' && e.block.type === 'tool_result') {
            return { ...e, block: { ...e.block, tool_use_id: 'nope', http_trace: { response_body: '…' } } };
          }
          return e;
        },
      },
    );
    const stream = report.checks.find((c) => c.id === 'stream.events')!;
    expect(stream.status).toBe('fail');
    expect(stream.detail).toMatch(/does not echo client_message_id/);
    expect(stream.detail).toMatch(/user_message_id is missing/);
    expect(stream.detail).toMatch(/has 0 tool_result blocks/);
    expect(stream.detail).toMatch(/sends http_trace/);
  });

  it('fails 403 for a request without a session', async () => {
    const report = await run({}, { noAuthStatus: 403 });
    expect(status(report, 'auth.unauthenticated')).toBe('fail');
  });

  it('can skip the message checks', async () => {
    const mock = createMockAdapter({ latency: 0, speed: 0 });
    const report = await runConformance({
      baseUrl: 'https://chat.test',
      headers: { Authorization: AUTH },
      fetch: httpBackend(mock),
      sendMessages: false,
    });
    expect(report.ok).toBe(true);
    expect(status(report, 'stream.events')).toBe('skip');
  });
});

describe('runConformanceCli', () => {
  it('needs a base URL', async () => {
    const lines: string[] = [];
    expect(await runConformanceCli([], {}, (l) => lines.push(l))).toBe(2);
    expect(lines.join('\n')).toMatch(/--base-url is required/);
  });

  it('prints usage', async () => {
    const lines: string[] = [];
    expect(await runConformanceCli(['--help'], {}, (l) => lines.push(l))).toBe(0);
    expect(lines[0]).toMatch(/^Usage: agentic-chat-conformance/);
  });

  it('rejects a malformed header', async () => {
    const lines: string[] = [];
    expect(await runConformanceCli(['--base-url', 'https://x', '--header', 'nocolon'], {}, (l) => lines.push(l))).toBe(2);
    expect(lines.join('\n')).toMatch(/Bad header/);
  });
});
