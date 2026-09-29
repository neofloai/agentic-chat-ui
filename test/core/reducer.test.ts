import { describe, expect, it } from 'vitest';
import {
  createThreadState,
  interruptRun,
  parseStreamEvent,
  reduceStreamEvent,
  type StreamEvent,
  type ThreadState,
} from '../../src/core';
import { hitlPause, hitlResume, normalTurn } from '../fixtures';

const ctx = { now: 1_000 };
const run = (events: StreamEvent[], from: ThreadState = createThreadState('c1')) =>
  events.reduce((s, e) => reduceStreamEvent(s, e, ctx), from);

describe('reduceStreamEvent', () => {
  it('builds a complete assistant message from the schema example', () => {
    const s = run(normalTurn);
    expect(s.messages).toHaveLength(1);
    const m = s.messages[0]!;
    expect(m).toMatchObject({
      id: 'q4ne0gpb53',
      role: 'assistant',
      status: 'complete',
      stopReason: 'end_turn',
      model: 'claude-sonnet-5',
    });
    expect(m.blocks[0]!.data.text).toBe("Acme's top three invoices were…");
    expect(m.blocks[0]!.status).toBe('complete');
    expect(m.usage?.output_tokens).toBe(143);
    expect(s.run.status).toBe('idle');
    expect(s.run.statusLabel).toBeUndefined();
  });

  it('shows the status label while streaming', () => {
    const s = run(normalTurn.slice(0, 2));
    expect(s.run).toMatchObject({ status: 'streaming', statusLabel: 'Searching invoices…', messageId: 'q4ne0gpb53' });
  });

  it('treats snapshot as a full overwrite, so a dropped delta cannot corrupt text', () => {
    const start = run(normalTurn.slice(0, 3));
    const s = [
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Ac' }, snapshot: 'Ac' },
      // the "me's" delta is lost
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: ' top' }, snapshot: "Acme's top" },
    ].reduce((st, e) => reduceStreamEvent(st, e as StreamEvent, ctx), start);
    expect(s.messages[0]!.blocks[0]!.data.text).toBe("Acme's top");
  });

  it('appends delta.text when there is no snapshot', () => {
    const start = run(normalTurn.slice(0, 3));
    const s = [
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Hel' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'lo' } },
    ].reduce((st, e) => reduceStreamEvent(st, e as StreamEvent, ctx), start);
    expect(s.messages[0]!.blocks[0]!.data.text).toBe('Hello');
  });

  it('uses a block-specific delta handler when one is registered', () => {
    const start = run([
      normalTurn[0]!,
      { type: 'content_block_start', index: 0, block: { id: 'p', type: 'plan', category: 'plan', steps: [] } },
    ]);
    const s = reduceStreamEvent(
      start,
      {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'plan_delta' },
        snapshot: [{ id: 's1', title: 'Read', status: 'running' }],
      },
      { now: 1, resolveDeltaHandler: (b) => (b.type === 'plan' ? (block, _d, snap) => ({ ...block, steps: snap }) : undefined) },
    );
    expect(s.messages[0]!.blocks[0]!.data.steps).toEqual([{ id: 's1', title: 'Read', status: 'running' }]);
  });

  it('attaches the checkpoint to the right block and pauses', () => {
    const s = run(hitlPause);
    const appr = s.messages[0]!.blocks[1]!;
    expect(appr.checkpoint).toEqual({ id: 'z93hdnf02c', requires: { kind: 'approve_reject' }, status: 'pending' });
    expect(s.pendingCheckpoint).toMatchObject({ checkpointId: 'z93hdnf02c', blockId: 'b_appr', messageId: 'm_hitl' });
    expect(s.run.status).toBe('paused');
    expect(s.messages[0]!.status).toBe('paused');
  });

  it('continues the same message on resume, even though indexes restart at 0', () => {
    const paused = run(hitlPause);
    const s = run(hitlResume, paused);
    const m = s.messages[0]!;
    expect(s.messages).toHaveLength(1);
    expect(m.blocks.map((b) => b.id)).toEqual(['b_text', 'b_appr', 'b_after']);
    expect(m.blocks[1]!.checkpoint?.id).toBe('z93hdnf02c'); // untouched by index 0 reuse
    expect(m.status).toBe('complete');
    expect(s.pendingCheckpoint).toBeUndefined();
    expect(s.meta.title).toBe('Acme posting');
  });

  it('records an error event and a message_stop with stop_reason error', () => {
    const s = run([
      normalTurn[0]!,
      { type: 'error', error_type: 'rate_limited', message: 'Slow down', retry_after: 5 },
      { type: 'message_stop', message_id: 'q4ne0gpb53', stop_reason: 'error' },
    ]);
    expect(s.run.status).toBe('error');
    expect(s.run.error).toMatchObject({ type: 'rate_limited', retryAfter: 5 });
    expect(s.messages[0]!.status).toBe('error');
    expect(s.messages[0]!.error?.message).toBe('Slow down');
  });

  it('creates a message when blocks arrive without message_start', () => {
    const s = run([{ type: 'content_block_start', index: 0, block: { id: 'x', type: 'text', category: 'content', text: 'hi' } }]);
    expect(s.messages).toHaveLength(1);
    expect(s.run.status).toBe('streaming');
  });

  it('ignores deltas for unknown indexes', () => {
    const s0 = run(normalTurn.slice(0, 1));
    const s1 = reduceStreamEvent(s0, { type: 'content_block_delta', index: 9, delta: { type: 'text_delta', text: 'x' } }, ctx);
    expect(s1).toBe(s0);
  });

  it('interruptRun marks open blocks interrupted with an error, or cancelled without one', () => {
    const mid = run(normalTurn.slice(0, 4));
    const failed = interruptRun(mid, { type: 'network', message: 'lost', retryable: true }, ctx);
    expect(failed.messages[0]!.status).toBe('interrupted');
    expect(failed.messages[0]!.blocks[0]!.status).toBe('interrupted');
    expect(failed.run.status).toBe('error');
    const cancelled = interruptRun(mid, undefined, ctx);
    expect(cancelled.messages[0]!.status).toBe('cancelled');
    expect(cancelled.run.status).toBe('idle');
  });
});

describe('parseStreamEvent', () => {
  it('reads the type from the SSE event name when the payload has none', () => {
    const r = parseStreamEvent({ label: 'x' }, 'status');
    expect(r).toEqual({ ok: true, event: { type: 'status', label: 'x' } });
  });

  it('rejects invalid payloads and flags unknown types', () => {
    expect(parseStreamEvent({ type: 'checkpoint', block_index: 0 })).toMatchObject({ ok: false, reason: 'invalid' });
    expect(parseStreamEvent({ type: 'content_block_start', index: -1, block: {} })).toMatchObject({ ok: false });
    expect(parseStreamEvent({ type: 'shiny_new' })).toMatchObject({ ok: false, reason: 'unknown_type' });
    expect(parseStreamEvent('nope')).toMatchObject({ ok: false });
  });

  it('defaults unknown stop reasons to end_turn and blank titles to null', () => {
    const r = parseStreamEvent({ type: 'message_stop', message_id: 'm', stop_reason: 'weird', title: '  ' });
    expect(r).toMatchObject({ ok: true, event: { stop_reason: 'end_turn', title: null } });
  });
});
