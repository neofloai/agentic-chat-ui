import { Fragment, memo, useContext, useMemo, type ReactNode } from 'react';
import type { ChatBlock, ChatMessage } from '../../core/store/types';
import { BlockErrorBoundary } from '../../registry/error-boundary';
import { BlockContext, ChatContext, MessageContext, useChatContext } from '../context';
import { useBlockActions, useStoreSelector } from '../hooks';
import type { ExtendedChatContextValue } from '../provider';

export interface BlockRendererProps {
  block: ChatBlock;
  message: ChatMessage;
  /** The last block of a message that's still streaming. */
  isLast?: boolean;
}

function DefaultCrash() {
  const { labels } = useChatContext();
  return (
    <div role="note" data-block-error="">
      {labels.blockCrashed}
    </div>
  );
}

function BlockRendererImpl({ block, message, isLast = false }: BlockRendererProps) {
  const ctx = useContext(ChatContext) as ExtendedChatContextValue | null;
  if (!ctx) throw new Error('[agentic-chat] <Block> must be rendered inside <ChatProvider>.');
  const { registry } = ctx;
  const definition = registry.resolve(block.data);
  const actions = useBlockActions(block, message);

  const parsed = useMemo(() => {
    if (!definition?.parse) return { ok: true as const, data: block.data as unknown };
    try {
      return { ok: true as const, data: definition.parse(block.data, block) };
    } catch (error) {
      return { ok: false as const, error };
    }
  }, [definition, block]);

  const Render = parsed.ok ? definition?.render : registry.fallback?.render;
  const blockContext = useMemo(() => ({ block, message, definition }), [block, message, definition]);
  if (!Render) return null;

  return (
    <BlockContext.Provider value={blockContext}>
      <BlockErrorBoundary
        resetKey={block.data}
        fallback={(error) => (ctx.blockErrorFallback ? ctx.blockErrorFallback(error, block) : <DefaultCrash />)}
      >
        <div data-block-id={block.id} data-block-type={block.type} data-block-status={block.status} style={{ minWidth: 0 }}>
          <Render
            block={block}
            data={parsed.ok ? parsed.data : block.data}
            status={block.status}
            checkpoint={block.checkpoint}
            message={message}
            actions={actions}
            isLast={isLast}
          />
        </div>
      </BlockErrorBoundary>
    </BlockContext.Provider>
  );
}

/**
 * Renders one block through the registry, inside its own error boundary. Memoized so a delta
 * to one block doesn't re-render its siblings.
 */
export const BlockRenderer = memo(
  BlockRendererImpl,
  (a, b) =>
    a.block === b.block && a.isLast === b.isLast && a.message.id === b.message.id && a.message.status === b.message.status,
);

export interface MessageBlocksProps {
  /** Hide some blocks. */
  filter?: (block: ChatBlock) => boolean;
  /** Wraps consecutive blocks whose definitions share a `group`. */
  renderGroup?: (group: string, children: ReactNode, blocks: ChatBlock[]) => ReactNode;
  /** Wraps each block. */
  renderBlock?: (children: ReactNode, block: ChatBlock) => ReactNode;
}

/**
 * Renders the current message's blocks, grouping where definitions ask for it. A `tool_result`
 * shown inside its tool call's card is skipped, and so are approval and choice cards when the
 * backend has `hitl` off.
 */
export function MessageBlocks({ filter, renderGroup, renderBlock }: MessageBlocksProps) {
  const msg = useContext(MessageContext);
  const { registry, runtime } = useChatContext();
  const hitl = useStoreSelector(runtime.chatConfig, (s) => s.capabilities.hitl);
  if (!msg) throw new Error('[agentic-chat] <Message.Blocks> must be inside <Message.Root>.');
  const { message } = msg;
  const visible = message.blocks.filter((b) => !b.pairedWith && (hitl || b.category !== 'hitl'));
  const blocks = filter ? visible.filter(filter) : visible;
  const streaming = message.status === 'streaming';

  const segments: { group?: string; blocks: ChatBlock[] }[] = [];
  for (const b of blocks) {
    const group = registry.resolve(b.data)?.group;
    const last = segments[segments.length - 1];
    if (group && last && last.group === group) last.blocks.push(b);
    else segments.push({ group, blocks: [b] });
  }

  return (
    <>
      {segments.map((seg, i) => {
        const children = seg.blocks.map((b, j) => {
          const node = (
            <BlockRenderer
              key={b.id}
              block={b}
              message={message}
              isLast={streaming && i === segments.length - 1 && j === seg.blocks.length - 1}
            />
          );
          return renderBlock ? <Fragment key={b.id}>{renderBlock(node, b)}</Fragment> : node;
        });
        const key = seg.blocks[0]!.id;
        return (
          <Fragment key={key}>{seg.group && renderGroup ? renderGroup(seg.group, children, seg.blocks) : children}</Fragment>
        );
      })}
    </>
  );
}
