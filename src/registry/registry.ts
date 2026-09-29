import type { ContentBlock } from '../core/protocol/types';
import type { BlockDefinition, BlockRegistry } from './types';

const toList = (v: string | readonly string[] | undefined): readonly string[] =>
  v === undefined ? [] : typeof v === 'string' ? [v] : v;

/**
 * Declares how one kind of block renders. Register it through `blocks` on `ChatProvider` or
 * `AgenticChat`; later definitions win, so a product can override any built-in.
 *
 * ```tsx
 * const invoiceCard = defineBlock<InvoiceData>({
 *   type: 'invoice_card',
 *   parse: (b) => ({ number: String(b.number), total: Number(b.total) }),
 *   render: ({ data, actions }) => <InvoiceCard {...data} onOpen={() => actions.emit('open_invoice', data)} />,
 * });
 * ```
 */
export function defineBlock<TData = ContentBlock>(definition: BlockDefinition<TData>): BlockDefinition<TData> {
  const render = definition?.render as unknown;
  if (!render || (typeof render !== 'function' && typeof render !== 'object')) {
    throw new Error('[agentic-chat] defineBlock needs a `render` component.');
  }
  if (!definition.type && !definition.category && !definition.match) {
    throw new Error('[agentic-chat] defineBlock needs a `type`, `category` or `match`.');
  }
  return definition;
}

/**
 * Resolution order: `match()` functions (latest first), then an exact `type`, then a
 * `category`, then the fallback.
 */
export function createBlockRegistry(definitions: readonly BlockDefinition[], fallback?: BlockDefinition): BlockRegistry {
  const reversed = [...definitions].reverse();
  const matchers = reversed.filter((d) => typeof d.match === 'function');
  const byType = new Map<string, BlockDefinition>();
  const byCategory = new Map<string, BlockDefinition>();
  for (const d of definitions) {
    for (const t of toList(d.type)) byType.set(t, d);
    for (const c of toList(d.category)) byCategory.set(c, d);
  }

  const resolve = (block: ContentBlock): BlockDefinition | undefined => {
    for (const d of matchers) {
      try {
        if (d.match!(block)) return d;
      } catch {
        // A faulty matcher must not break resolution for every other block.
      }
    }
    return byType.get(block.type) ?? byCategory.get(block.category) ?? fallback;
  };

  return {
    definitions,
    fallback,
    resolve,
    deltaResolver: (block) => resolve(block)?.applyDelta,
  };
}
