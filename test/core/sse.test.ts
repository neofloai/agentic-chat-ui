import { describe, expect, it } from 'vitest';
import { SseParser, readSse } from '../../src/core';

const collect = (parser: SseParser, chunks: string[]) => [...chunks.flatMap((c) => parser.feed(c)), ...parser.flush()];

describe('SseParser', () => {
  it('parses a basic event', () => {
    const out = collect(new SseParser(), ['event: status\ndata: {"type":"status","label":"Hi"}\n\n']);
    expect(out).toEqual([{ event: 'status', data: '{"type":"status","label":"Hi"}' }]);
  });

  it('handles events split at every possible byte boundary', () => {
    const text = 'event: a\ndata: one\n\nevent: b\ndata: two\ndata: lines\n\n';
    for (let i = 1; i < text.length; i++) {
      const out = collect(new SseParser(), [text.slice(0, i), text.slice(i)]);
      expect(out).toEqual([
        { event: 'a', data: 'one' },
        { event: 'b', data: 'two\nlines' },
      ]);
    }
  });

  it('supports CRLF, bare CR, and a CRLF split across chunks', () => {
    expect(collect(new SseParser(), ['data: x\r\n\r\n'])).toEqual([{ event: 'message', data: 'x' }]);
    expect(collect(new SseParser(), ['data: y\r\r'])).toEqual([{ event: 'message', data: 'y' }]);
    expect(collect(new SseParser(), ['data: z\r', '\n\r', '\n'])).toEqual([{ event: 'message', data: 'z' }]);
  });

  it('ignores comments/heartbeats and unknown fields, keeps id and retry', () => {
    const out = collect(new SseParser(), [': ping\n\nfoo: bar\nid: 7\nretry: 3000\ndata: ok\n\n']);
    expect(out).toEqual([{ event: 'message', data: 'ok', id: '7', retry: 3000 }]);
  });

  it('strips a leading BOM and only one space after the colon', () => {
    const out = collect(new SseParser(), ['﻿data:  two spaces\n\n']);
    expect(out).toEqual([{ event: 'message', data: ' two spaces' }]);
  });

  it('dispatches a final event with no trailing blank line', () => {
    expect(collect(new SseParser(), ['data: last'])).toEqual([{ event: 'message', data: 'last' }]);
  });

  it('does not dispatch an event with no data', () => {
    expect(collect(new SseParser(), ['event: lonely\n\n'])).toEqual([]);
  });
});

describe('readSse', () => {
  it('reads a byte stream with multi-byte characters split across chunks', async () => {
    const bytes = new TextEncoder().encode('data: héllo — ✓\n\n');
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        for (let i = 0; i < bytes.length; i += 3) c.enqueue(bytes.slice(i, i + 3));
        c.close();
      },
    });
    const out = [];
    for await (const m of readSse(stream)) out.push(m);
    expect(out).toEqual([{ event: 'message', data: 'héllo — ✓' }]);
  });

  it('stops when aborted', async () => {
    const controller = new AbortController();
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new TextEncoder().encode('data: 1\n\n'));
      },
    });
    const it = readSse(stream, controller.signal);
    expect((await it.next()).value).toEqual({ event: 'message', data: '1' });
    controller.abort();
    await expect(it.next()).rejects.toBeDefined();
  });
});
