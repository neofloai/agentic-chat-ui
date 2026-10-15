import type { ContentBlock, StopReason, StreamEvent } from './types';

const STOP_REASONS: ReadonlySet<string> = new Set<StopReason>(['end_turn', 'paused', 'error', 'cancelled']);

type Json = Record<string, unknown>;

const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === 'string';
const isIndex = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

export function isContentBlock(v: unknown): v is ContentBlock {
  return isObject(v) && isString(v.id) && isString(v.type);
}

/** Fills in `category` when a backend leaves it off, so every block downstream has one. */
function withCategory(block: Json): ContentBlock {
  return { ...block, category: isString(block.category) ? block.category : 'content' } as ContentBlock;
}

export type ParseResult =
  | { ok: true; event: StreamEvent }
  | { ok: false; reason: 'unknown_type'; type: string }
  | { ok: false; reason: 'invalid'; type: string; detail: string };

/**
 * Validates one decoded SSE payload. The event type is read from the payload's `type`,
 * falling back to the SSE `event:` name.
 *
 * Unknown types come back as `unknown_type` so callers can ignore them: a newer backend
 * adding an event must never break an older client.
 */
export function parseStreamEvent(payload: unknown, eventName?: string): ParseResult {
  if (!isObject(payload)) {
    return { ok: false, reason: 'invalid', type: eventName ?? 'unknown', detail: 'payload is not an object' };
  }
  const type = isString(payload.type) ? payload.type : (eventName ?? '');
  const p = payload;
  const invalid = (detail: string): ParseResult => ({ ok: false, reason: 'invalid', type, detail });

  switch (type) {
    case 'message_start':
      if (!isString(p.message_id)) return invalid('message_id is required');
      return {
        ok: true,
        event: {
          type,
          message_id: p.message_id,
          conversation_id: isString(p.conversation_id) ? p.conversation_id : '',
          run_id: isString(p.run_id) ? p.run_id : '',
          persona: p.persona ?? null,
          user_message_id: isString(p.user_message_id) ? p.user_message_id : null,
          client_message_id: isString(p.client_message_id) ? p.client_message_id : null,
        },
      };
    case 'status':
      return { ok: true, event: { type, label: isString(p.label) ? p.label : '' } };
    case 'content_block_start':
    case 'content_block_stop': {
      if (!isIndex(p.index)) return invalid('index must be a non-negative integer');
      if (!isContentBlock(p.block)) return invalid('block with id and type is required');
      return { ok: true, event: { type, index: p.index, block: withCategory(p.block) } };
    }
    case 'content_block_delta': {
      if (!isIndex(p.index)) return invalid('index must be a non-negative integer');
      const delta = isObject(p.delta) ? p.delta : {};
      return {
        ok: true,
        event: {
          type,
          index: p.index,
          delta: { ...delta, type: isString(delta.type) ? delta.type : 'text_delta' },
          snapshot: p.snapshot,
        },
      };
    }
    case 'checkpoint':
      if (!isString(p.checkpoint_id)) return invalid('checkpoint_id is required');
      if (!isIndex(p.block_index)) return invalid('block_index must be a non-negative integer');
      return {
        ok: true,
        event: { type, checkpoint_id: p.checkpoint_id, block_index: p.block_index, requires: p.requires },
      };
    case 'message_delta':
      return { ok: true, event: { type, usage: isObject(p.usage) ? (p.usage as never) : undefined } };
    case 'message_stop': {
      const reason = isString(p.stop_reason) && STOP_REASONS.has(p.stop_reason) ? p.stop_reason : 'end_turn';
      return {
        ok: true,
        event: {
          type,
          message_id: isString(p.message_id) ? p.message_id : '',
          model: isString(p.model) ? p.model : null,
          title: isString(p.title) && p.title.trim() ? p.title : null,
          stop_reason: reason as StopReason,
        },
      };
    }
    case 'error':
      return {
        ok: true,
        event: {
          type,
          error_type: isString(p.error_type) ? p.error_type : 'unknown_error',
          message: isString(p.message) ? p.message : 'Something went wrong.',
          retry_after: typeof p.retry_after === 'number' ? p.retry_after : null,
          request_id: isString(p.request_id) ? p.request_id : null,
          details: isObject(p.details) ? p.details : null,
        },
      };
    default:
      return { ok: false, reason: 'unknown_type', type };
  }
}
