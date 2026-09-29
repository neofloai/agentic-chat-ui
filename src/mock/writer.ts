import type { ContentBlock, HitlDecision, StreamEvent } from '../core/protocol/types';

/** Thrown inside a scenario when the turn was cancelled or aborted. */
export class MockStop extends Error {
  constructor(readonly reason: 'cancelled' | 'aborted') {
    super(reason);
  }
}

export interface PauseOptions {
  block: Omit<ContentBlock, 'id'> & { id?: string };
  requires?: unknown;
  /** Runs when the user answers; writes the rest of the turn. */
  onResume: (writer: MockWriter, decision: HitlDecision) => Promise<void>;
}

/** What a scenario writes with. Every call respects cancel and abort. */
export interface MockWriter {
  status(label: string): Promise<void>;
  /** Streams markdown word by word (with `snapshot` on every delta, like the schema says). */
  text(markdown: string, options?: { speed?: number }): Promise<void>;
  thinking(text: string, options?: { speed?: number; durationMs?: number }): Promise<void>;
  /** Emits a complete block (start then stop). Pass `snapshots` to stream intermediate states. */
  block(
    block: Omit<ContentBlock, 'id'> & { id?: string },
    options?: { snapshots?: unknown[]; interval?: number; startWith?: Record<string, unknown> },
  ): Promise<ContentBlock>;
  /** Emits a HITL block + checkpoint and ends the turn paused. */
  pause(options: PauseOptions): Promise<void>;
  error(errorType: string, message: string, retryAfter?: number): Promise<void>;
  wait(ms: number): Promise<void>;
}

export interface WriterHooks {
  push(event: StreamEvent): void;
  isCancelled(): boolean;
  signal: AbortSignal;
  speed: number;
  nextIndex(): number;
  /** Index of the block started most recently. */
  lastIndex(): number;
  newId(prefix: string): string;
  onBlockStop(block: ContentBlock): void;
  onPause(checkpointId: string, blockId: string, requires: unknown, onResume: PauseOptions['onResume']): void;
}

export function createWriter(h: WriterHooks): MockWriter & { paused: boolean } {
  const guard = () => {
    if (h.signal.aborted) throw new MockStop('aborted');
    if (h.isCancelled()) throw new MockStop('cancelled');
  };
  const wait = (ms: number) =>
    new Promise<void>((resolve, reject) => {
      guard();
      const t = setTimeout(() => {
        h.signal.removeEventListener('abort', onAbort);
        try {
          guard();
          resolve();
        } catch (e) {
          reject(e);
        }
      }, ms);
      const onAbort = () => {
        clearTimeout(t);
        reject(new MockStop('aborted'));
      };
      h.signal.addEventListener('abort', onAbort, { once: true });
    });

  const streamText = async (type: 'text' | 'thinking', body: string, speed: number, extra: Record<string, unknown> = {}) => {
    const index = h.nextIndex();
    const id = h.newId('blk_');
    const category = type === 'thinking' ? 'reasoning' : 'content';
    h.push({ type: 'content_block_start', index, block: { id, type, category, text: '', ...extra } });
    const tokens = body.match(/\S+\s*|\s+/g) ?? [];
    let snapshot = '';
    for (let i = 0; i < tokens.length; i += 2) {
      const piece = tokens.slice(i, i + 2).join('');
      snapshot += piece;
      h.push({ type: 'content_block_delta', index, delta: { type: 'text_delta', text: piece }, snapshot });
      await wait(speed);
    }
    const final: ContentBlock = { id, type, category, text: body, ...extra };
    h.push({ type: 'content_block_stop', index, block: final });
    h.onBlockStop(final);
  };

  const writer: MockWriter & { paused: boolean } = {
    paused: false,
    async status(label) {
      guard();
      h.push({ type: 'status', label });
    },
    async text(markdown, options) {
      await streamText('text', markdown, options?.speed ?? h.speed);
    },
    async thinking(body, options) {
      await streamText(
        'thinking',
        body,
        options?.speed ?? h.speed / 2,
        options?.durationMs ? { duration_ms: options.durationMs } : {},
      );
    },
    async block(raw, options) {
      guard();
      const index = h.nextIndex();
      const block = { ...raw, id: raw.id ?? h.newId('blk_') } as ContentBlock;
      h.push({ type: 'content_block_start', index, block: { ...block, ...(options?.startWith ?? {}) } });
      for (const snap of options?.snapshots ?? []) {
        await wait(options?.interval ?? h.speed * 8);
        h.push({ type: 'content_block_delta', index, delta: { type: 'snapshot_delta' }, snapshot: snap });
      }
      if (options?.snapshots?.length || options?.startWith) await wait(options?.interval ?? h.speed * 8);
      h.push({ type: 'content_block_stop', index, block });
      h.onBlockStop(block);
      return block;
    },
    async pause({ block: raw, requires, onResume }) {
      guard();
      const block = await writer.block(raw);
      const checkpointId = h.newId('cp_');
      h.onPause(checkpointId, block.id, requires ?? null, onResume);
      h.push({ type: 'checkpoint', checkpoint_id: checkpointId, block_index: h.lastIndex(), requires: requires ?? null });
      writer.paused = true;
    },
    async error(errorType, message, retryAfter) {
      guard();
      h.push({ type: 'error', error_type: errorType, message, retry_after: retryAfter ?? null });
    },
    wait,
  };
  return writer;
}
