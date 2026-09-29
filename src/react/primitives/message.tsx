import { Slot } from '@radix-ui/react-slot';
import { forwardRef, useContext, type HTMLAttributes, type ReactNode } from 'react';
import type { MessageStatus } from '../../core/store/types';
import { MessageContext } from '../context';
import type { ChatMessage } from '../../core/store/types';

export const MessageRoot = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { asChild?: boolean }>(
  function MessageRoot({ asChild, ...props }, ref) {
    const ctx = useContext(MessageContext);
    const Comp = asChild ? Slot : 'div';
    return (
      <Comp
        ref={ref}
        data-message-id={ctx?.message.id}
        data-role={ctx?.message.role}
        data-status={ctx?.message.status}
        {...props}
      />
    );
  },
);

export interface MessageIfProps {
  role?: ChatMessage['role'];
  status?: MessageStatus | MessageStatus[];
  /** Only the last message. */
  last?: boolean;
  children?: ReactNode;
}

export function MessageIf({ role, status, last, children }: MessageIfProps) {
  const ctx = useContext(MessageContext);
  if (!ctx) return null;
  if (role && ctx.message.role !== role) return null;
  if (status && !(Array.isArray(status) ? status : [status]).includes(ctx.message.status)) return null;
  if (last !== undefined && ctx.isLast !== last) return null;
  return <>{children}</>;
}

/** Plain text of a message, for copy buttons. Uses each block's `toText` when it has one. */
export function messageText(message: ChatMessage, toText?: (block: ChatMessage['blocks'][number]) => string | undefined): string {
  return message.blocks
    .map((b) => {
      const custom = toText?.(b);
      if (custom !== undefined) return custom;
      const d = b.data as Record<string, unknown>;
      return typeof d.text === 'string' ? d.text : '';
    })
    .filter(Boolean)
    .join('\n\n');
}
