import { Slot } from '@radix-ui/react-slot';
import {
  createContext,
  forwardRef,
  useContext,
  useImperativeHandle,
  useRef,
  type ButtonHTMLAttributes,
  type FormHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import type { ComposerAttachment } from '../../core/store/types';
import { useComposer, useLabels } from '../hooks';
import { useIsomorphicLayoutEffect } from '../hooks/use-store';

type ComposerApi = ReturnType<typeof useComposer>;
const ComposerContext = createContext<ComposerApi | null>(null);

export function useComposerContext(): ComposerApi {
  const ctx = useContext(ComposerContext);
  if (!ctx) throw new Error('[agentic-chat] Composer parts must be inside <Composer.Root>.');
  return ctx;
}

export const ComposerRoot = forwardRef<HTMLFormElement, FormHTMLAttributes<HTMLFormElement> & { asChild?: boolean }>(
  function ComposerRoot({ asChild, onSubmit, ...props }, ref) {
    const composer = useComposer();
    const Comp = asChild ? Slot : 'form';
    return (
      <ComposerContext.Provider value={composer}>
        <Comp
          ref={ref}
          data-busy={composer.busy ? '' : undefined}
          data-blocked={composer.blockedByDecision ? '' : undefined}
          onSubmit={(e: Parameters<NonNullable<FormHTMLAttributes<HTMLFormElement>['onSubmit']>>[0]) => {
            e.preventDefault();
            onSubmit?.(e);
            void composer.send();
          }}
          {...props}
        />
      </ComposerContext.Provider>
    );
  },
);

export interface ComposerInputProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
  /** Enter sends, Shift+Enter adds a line. @default true */
  submitOnEnter?: boolean;
  /** @default 1 */
  minRows?: number;
  /** Grows up to this many rows, then scrolls. @default 8 */
  maxRows?: number;
  /** Focus when the thread becomes idle again (after a send or a decision). @default true */
  refocus?: boolean;
}

/** An auto-growing textarea bound to the draft. IME-safe: Enter while composing never sends. */
export const ComposerInput = forwardRef<HTMLTextAreaElement, ComposerInputProps>(function ComposerInput(
  { submitOnEnter = true, minRows = 1, maxRows = 8, refocus = true, onKeyDown, placeholder, disabled, style, ...props },
  ref,
) {
  const c = useComposerContext();
  const labels = useLabels();
  const inner = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => inner.current!, []);

  useIsomorphicLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const cs = typeof getComputedStyle === 'function' ? getComputedStyle(el) : null;
    const line = cs ? parseFloat(cs.lineHeight) || 20 : 20;
    const pad = cs ? parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) : 0;
    el.style.height = 'auto';
    const max = line * maxRows + pad;
    const min = line * minRows + pad;
    el.style.height = `${Math.max(min, Math.min(el.scrollHeight, max))}px`;
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
  }, [c.text, minRows, maxRows]);

  const wasBusy = useRef(c.busy);
  useIsomorphicLayoutEffect(() => {
    if (refocus && wasBusy.current && !c.busy) inner.current?.focus({ preventScroll: true });
    wasBusy.current = c.busy;
  }, [c.busy, refocus]);

  const blocked = c.blockedByDecision;
  return (
    <textarea
      ref={inner}
      rows={minRows}
      aria-label={labels.composerLabel}
      placeholder={blocked ? labels.composerAwaitingDecision : (placeholder ?? labels.composerPlaceholder)}
      value={c.text}
      disabled={disabled || blocked}
      onChange={(e) => c.setText(e.target.value)}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented || !submitOnEnter) return;
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
          e.preventDefault();
          void c.send();
        }
      }}
      onPaste={(e) => {
        if (!c.attachmentsEnabled) return;
        const files = [...e.clipboardData.files];
        if (files.length) {
          e.preventDefault();
          c.addFiles(files);
        }
      }}
      style={{ resize: 'none', ...style }}
      {...props}
    />
  );
});

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean };

export const ComposerSend = forwardRef<HTMLButtonElement, ButtonProps>(function ComposerSend(
  { asChild, disabled, ...props },
  ref,
) {
  const c = useComposerContext();
  const labels = useLabels();
  const Comp = asChild ? Slot : 'button';
  return <Comp ref={ref} type="submit" aria-label={labels.send} disabled={disabled || !c.canSend} {...props} />;
});

/** Stop button; renders only while a reply is streaming. */
export const ComposerCancel = forwardRef<HTMLButtonElement, ButtonProps>(function ComposerCancel(
  { asChild, onClick, ...props },
  ref,
) {
  const c = useComposerContext();
  const labels = useLabels();
  if (!c.busy) return null;
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      type="button"
      aria-label={labels.stop}
      disabled={c.cancelling}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);
        void c.cancel();
      }}
      {...props}
    />
  );
});

/** The attach trigger. Wraps its child (via `asChild`) and owns a hidden file input. */
export const ComposerAttachmentInput = forwardRef<HTMLButtonElement, ButtonProps & { multiple?: boolean }>(
  function ComposerAttachmentInput({ asChild, multiple = true, onClick, ...props }, ref) {
    const c = useComposerContext();
    const labels = useLabels();
    const input = useRef<HTMLInputElement>(null);
    if (!c.attachmentsEnabled) return null;
    const Comp = asChild ? Slot : 'button';
    return (
      <>
        <input
          ref={input}
          type="file"
          hidden
          multiple={multiple}
          accept={c.accept}
          onChange={(e) => {
            const files = e.target.files ? [...e.target.files] : [];
            if (files.length) c.addFiles(files);
            e.target.value = '';
          }}
        />
        <Comp
          ref={ref}
          type="button"
          aria-label={labels.attach}
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            onClick?.(e);
            input.current?.click();
          }}
          {...props}
        />
      </>
    );
  },
);

export function ComposerAttachments({
  children,
}: {
  children: (attachment: ComposerAttachment, remove: () => void) => ReactNode;
}) {
  const c = useComposerContext();
  if (!c.attachments.length) return null;
  return <>{c.attachments.map((a) => children(a, () => c.removeAttachment(a.id)))}</>;
}
