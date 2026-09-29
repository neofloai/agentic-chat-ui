import { Slot } from '@radix-ui/react-slot';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import type { ChatMessage, ThreadState } from '../../core/store/types';
import { MessageContext } from '../context';
import { useThread } from '../hooks';
import { useIsomorphicLayoutEffect } from '../hooks/use-store';
import { MessageBlocks } from './block';

// ---------------------------------------------------------------------------------------------
// Stick-to-bottom scrolling
// ---------------------------------------------------------------------------------------------

export interface ScrollController {
  atBottom: boolean;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  /** @internal */
  viewportRef: React.RefObject<HTMLDivElement | null>;
  /** @internal */
  contentRef: React.RefObject<HTMLDivElement | null>;
  /** @internal */
  onScroll: () => void;
}

const ScrollContext = createContext<ScrollController | null>(null);

export function useThreadScroll(): ScrollController {
  const ctx = useContext(ScrollContext);
  if (!ctx) throw new Error('[agentic-chat] useThreadScroll must be used inside <Thread.Root>.');
  return ctx;
}

const BOTTOM_THRESHOLD = 48;

function useScrollController(): ScrollController {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const atBottomRef = useRef(true);
  const [atBottom, setAtBottom] = useState(true);

  const onScroll = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const next = el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD;
    atBottomRef.current = next;
    setAtBottom(next);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = viewportRef.current;
    if (!el) return;
    atBottomRef.current = true;
    setAtBottom(true);
    if (typeof el.scrollTo === 'function') el.scrollTo({ top: el.scrollHeight, behavior });
    else el.scrollTop = el.scrollHeight;
  }, []);

  // Follow new content while the reader is at the bottom; stay put once they scroll up.
  useIsomorphicLayoutEffect(() => {
    const content = contentRef.current;
    const el = viewportRef.current;
    if (!content || !el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      if (atBottomRef.current) el.scrollTop = el.scrollHeight;
    });
    ro.observe(content);
    return () => ro.disconnect();
  }, []);

  return useMemo(() => ({ atBottom, scrollToBottom, viewportRef, contentRef, onScroll }), [atBottom, scrollToBottom, onScroll]);
}

// ---------------------------------------------------------------------------------------------
// Thread
// ---------------------------------------------------------------------------------------------

export interface AsChildProps {
  asChild?: boolean;
}

export const ThreadRoot = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & AsChildProps>(function ThreadRoot(
  { asChild, ...props },
  ref,
) {
  const controller = useScrollController();
  const Comp = asChild ? Slot : 'div';
  return (
    <ScrollContext.Provider value={controller}>
      <Comp ref={ref} data-chat-thread="" {...props} />
    </ScrollContext.Provider>
  );
});

export interface ThreadViewportProps extends HTMLAttributes<HTMLDivElement> {
  /** Props for the inner element that wraps the messages. */
  contentProps?: HTMLAttributes<HTMLDivElement>;
}

/** The scroll container. Keeps the newest message in view while the reader is at the bottom. */
export const ThreadViewport = forwardRef<HTMLDivElement, ThreadViewportProps>(function ThreadViewport(
  { children, style, onScroll, contentProps, ...props },
  ref,
) {
  const c = useThreadScroll();
  const setRef = (el: HTMLDivElement | null) => {
    c.viewportRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  };
  return (
    <div
      ref={setRef}
      role="log"
      aria-live="off"
      data-at-bottom={c.atBottom ? '' : undefined}
      onScroll={(e) => {
        c.onScroll();
        onScroll?.(e);
      }}
      style={{ overflowY: 'auto', overscrollBehavior: 'contain', ...style }}
      {...props}
    >
      <div ref={c.contentRef} {...contentProps}>
        {children}
      </div>
    </div>
  );
});

export interface MessageComponents {
  UserMessage?: ComponentType<{ message: ChatMessage }>;
  AssistantMessage?: ComponentType<{ message: ChatMessage }>;
}

function DefaultMessage() {
  return <MessageBlocks />;
}

export interface ThreadMessagesProps {
  components?: MessageComponents;
  /** Full control: render each message yourself. */
  children?: (message: ChatMessage, index: number) => ReactNode;
}

/** Renders every message in the thread, each wrapped in a message context. */
export function ThreadMessages({ components, children }: ThreadMessagesProps) {
  const messages = useThread((s) => s.messages);
  return (
    <>
      {messages.map((m, i) => {
        const isLast = i === messages.length - 1;
        const Custom = m.role === 'user' ? components?.UserMessage : components?.AssistantMessage;
        return (
          <MessageContext.Provider key={m.id} value={{ message: m, isLast }}>
            {children ? children(m, i) : Custom ? <Custom message={m} /> : <DefaultMessage />}
          </MessageContext.Provider>
        );
      })}
    </>
  );
}

/** Renders its children only while the thread has no messages (the welcome screen slot). */
export function ThreadEmpty({ children }: { children?: ReactNode }) {
  const show = useThread((s) => s.messages.length === 0 && s.loadStatus !== 'loading' && s.loadStatus !== 'error');
  return show ? <>{children}</> : null;
}

export interface ThreadIfProps {
  empty?: boolean;
  running?: boolean;
  loading?: boolean;
  error?: boolean;
  paused?: boolean;
  children?: ReactNode;
}

/** Conditional rendering on thread state. Every condition given must hold. */
export function ThreadIf({ empty, running, loading, error, paused, children }: ThreadIfProps) {
  const ok = useThread((s: ThreadState) => {
    const isRunning = s.run.status === 'submitting' || s.run.status === 'streaming' || s.run.status === 'cancelling';
    if (empty !== undefined && (s.messages.length === 0) !== empty) return false;
    if (running !== undefined && isRunning !== running) return false;
    if (loading !== undefined && (s.loadStatus === 'loading') !== loading) return false;
    if (error !== undefined && (s.loadStatus === 'error' || s.run.status === 'error') !== error) return false;
    if (paused !== undefined && Boolean(s.pendingCheckpoint) !== paused) return false;
    return true;
  });
  return ok ? <>{children}</> : null;
}

/** The transient status label (`status` event) while a turn runs. */
export function ThreadStatus({ children }: { children?: (label: string) => ReactNode }) {
  const label = useThread((s) =>
    s.run.status === 'streaming' || s.run.status === 'submitting' || s.run.status === 'cancelling'
      ? (s.run.statusLabel ?? '')
      : '',
  );
  return (
    <div aria-live="polite" aria-atomic="true" data-chat-status="">
      {label ? (children ? children(label) : label) : null}
    </div>
  );
}

/** A button that appears when the reader has scrolled up. */
export const ThreadScrollToBottom = forwardRef<HTMLButtonElement, HTMLAttributes<HTMLButtonElement> & AsChildProps>(
  function ThreadScrollToBottom({ asChild, onClick, ...props }, ref) {
    const c = useThreadScroll();
    if (c.atBottom) return null;
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        type="button"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          c.scrollToBottom();
          onClick?.(e);
        }}
        {...props}
      />
    );
  },
);
