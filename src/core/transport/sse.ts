/** One dispatched server-sent event. */
export interface SseMessage {
  event: string;
  data: string;
  id?: string;
  retry?: number;
}

/**
 * Incremental SSE parser that follows the WHATWG event-stream rules. Feed it decoded text in
 * any chunking; it returns the events completed by that chunk.
 *
 * It handles `\n`, `\r\n` and bare `\r` line endings (including a `\r\n` split across two
 * chunks), multi-line `data:`, comment/heartbeat lines, a leading BOM, and fields with no colon.
 */
export class SseParser {
  private buffer = '';
  private pendingCR = false;
  private eventName = '';
  private data: string[] = [];
  private hasData = false;
  private lastId: string | undefined;
  private retry: number | undefined;
  private started = false;

  feed(chunk: string): SseMessage[] {
    if (!chunk) return [];
    let text = chunk;
    if (!this.started) {
      this.started = true;
      if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    }
    // A \r at the end of the previous chunk may be the first half of \r\n.
    if (this.pendingCR) {
      this.pendingCR = false;
      if (text.startsWith('\n')) text = text.slice(1);
    }
    this.buffer += text;

    const out: SseMessage[] = [];
    let start = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      const ch = this.buffer[i];
      if (ch !== '\n' && ch !== '\r') continue;
      const line = this.buffer.slice(start, i);
      if (ch === '\r') {
        if (i + 1 < this.buffer.length) {
          if (this.buffer[i + 1] === '\n') i++;
        } else {
          this.pendingCR = true;
        }
      }
      start = i + 1;
      const msg = this.processLine(line);
      if (msg) out.push(msg);
    }
    this.buffer = this.buffer.slice(start);
    return out;
  }

  /**
   * Call at end of stream. The spec discards an event that has no trailing blank line, but
   * plenty of servers skip it on the last event, so a pending event with data is dispatched.
   */
  flush(): SseMessage[] {
    const out: SseMessage[] = [];
    if (this.buffer) {
      const msg = this.processLine(this.buffer);
      this.buffer = '';
      if (msg) out.push(msg);
    }
    const last = this.dispatch();
    if (last) out.push(last);
    return out;
  }

  private processLine(line: string): SseMessage | null {
    if (line === '') return this.dispatch();
    if (line.startsWith(':')) return null; // comment / heartbeat

    const colon = line.indexOf(':');
    let field = line;
    let value = '';
    if (colon !== -1) {
      field = line.slice(0, colon);
      value = line.slice(colon + 1);
      if (value.startsWith(' ')) value = value.slice(1);
    }

    switch (field) {
      case 'event':
        this.eventName = value;
        break;
      case 'data':
        this.data.push(value);
        this.hasData = true;
        break;
      case 'id':
        if (!value.includes('\u0000')) this.lastId = value;
        break;
      case 'retry':
        if (/^\d+$/.test(value)) this.retry = Number(value);
        break;
      default:
        break; // unknown fields are ignored per spec
    }
    return null;
  }

  private dispatch(): SseMessage | null {
    if (!this.hasData) {
      this.eventName = '';
      return null;
    }
    const msg: SseMessage = { event: this.eventName || 'message', data: this.data.join('\n') };
    if (this.lastId !== undefined) msg.id = this.lastId;
    if (this.retry !== undefined) msg.retry = this.retry;
    this.eventName = '';
    this.data = [];
    this.hasData = false;
    return msg;
  }
}

/** Reads a byte stream (e.g. `response.body`) and yields SSE messages as they complete. */
export async function* readSse(stream: ReadableStream<Uint8Array>, signal?: AbortSignal): AsyncGenerator<SseMessage> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const parser = new SseParser();
  const onAbort = () => {
    reader.cancel().catch(() => undefined);
  };
  signal?.addEventListener('abort', onAbort, { once: true });
  try {
    while (true) {
      if (signal?.aborted) throw signal.reason ?? new DOMException('Aborted', 'AbortError');
      const { value, done } = await reader.read();
      if (done) break;
      for (const msg of parser.feed(decoder.decode(value, { stream: true }))) yield msg;
    }
    if (signal?.aborted) throw signal.reason ?? new DOMException('Aborted', 'AbortError');
    const tail = decoder.decode();
    for (const msg of parser.feed(tail)) yield msg;
    for (const msg of parser.flush()) yield msg;
  } finally {
    signal?.removeEventListener('abort', onAbort);
    reader.releaseLock?.();
  }
}
