import { Slot } from '@radix-ui/react-slot';
import { createContext, forwardRef, useContext, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { HitlDecision, SuggestedPrompt } from '../../core/protocol/types';
import type { ConversationItem } from '../../core/store/types';
import { useChatActions, useConversations, useHitl, useThreadMeta } from '../hooks';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean };

// --- Suggestions ------------------------------------------------------------------------------

/** Renders the conversation's suggested prompts (row 1), or `prompts` if given. */
export function SuggestionsRoot({
  prompts,
  children,
}: {
  prompts?: SuggestedPrompt[];
  children: (prompt: SuggestedPrompt, index: number) => ReactNode;
}) {
  const meta = useThreadMeta();
  const list = prompts ?? meta.suggestedPrompts;
  if (!list.length) return null;
  return <>{list.map((p, i) => children(p, i))}</>;
}

/** Clicking sends the prompt's `prompt` text (not its `label`). */
export const SuggestionItem = forwardRef<HTMLButtonElement, ButtonProps & { prompt: SuggestedPrompt }>(function SuggestionItem(
  { asChild, prompt, onClick, children, ...props },
  ref,
) {
  const { send } = useChatActions();
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      type="button"
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);
        void send(prompt.prompt);
      }}
      {...props}
    >
      {children ?? prompt.label}
    </Comp>
  );
});

// --- Conversation list ------------------------------------------------------------------------

export function ConversationListRoot({ children }: { children: (api: ReturnType<typeof useConversations>) => ReactNode }) {
  const api = useConversations();
  return <>{children(api)}</>;
}

export const ConversationListItem = forwardRef<HTMLButtonElement, ButtonProps & { conversation: ConversationItem }>(
  function ConversationListItem({ asChild, conversation, onClick, children, ...props }, ref) {
    const { activeId } = useConversations();
    const { selectConversation } = useChatActions();
    const Comp = asChild ? Slot : 'button';
    const active = activeId === conversation.id;
    return (
      <Comp
        ref={ref}
        type="button"
        aria-current={active ? 'page' : undefined}
        data-active={active ? '' : undefined}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          onClick?.(e);
          void selectConversation(conversation.id);
        }}
        {...props}
      >
        {children ?? conversation.title}
      </Comp>
    );
  },
);

export const ConversationListNew = forwardRef<HTMLButtonElement, ButtonProps>(function ConversationListNew(
  { asChild, onClick, ...props },
  ref,
) {
  const { newConversation } = useChatActions();
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      type="button"
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);
        void newConversation().catch(() => undefined);
      }}
      {...props}
    />
  );
});

// --- HITL -------------------------------------------------------------------------------------

interface ChoiceState {
  multiple: boolean;
  selected: string[];
  toggle: (value: string) => void;
  hitl: ReturnType<typeof useHitl>;
}
const ChoiceContext = createContext<ChoiceState | null>(null);

export function useHitlChoice(): ChoiceState {
  const ctx = useContext(ChoiceContext);
  if (!ctx) throw new Error('[agentic-chat] Hitl parts must be inside <Hitl.Root>.');
  return ctx;
}

/** Holds the selection for a choice card. Use `useHitl()` directly for approve/reject cards. */
export function HitlRoot({
  multiple = false,
  initial = [],
  children,
}: {
  multiple?: boolean;
  initial?: string[];
  children?: ReactNode;
}) {
  const hitl = useHitl();
  const resolved = hitl.decision;
  const [selected, setSelected] = useState<string[]>(
    Array.isArray(resolved) ? resolved.map(String) : typeof resolved === 'string' ? [resolved] : initial,
  );
  const toggle = (value: string) =>
    setSelected((prev) => (multiple ? (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]) : [value]));
  return <ChoiceContext.Provider value={{ multiple, selected, toggle, hitl }}>{children}</ChoiceContext.Provider>;
}

export const HitlOption = forwardRef<HTMLButtonElement, ButtonProps & { value: string }>(function HitlOption(
  { asChild, value, onClick, ...props },
  ref,
) {
  const { selected, toggle, multiple, hitl } = useHitlChoice();
  const Comp = asChild ? Slot : 'button';
  const checked = selected.includes(value);
  return (
    <Comp
      ref={ref}
      type="button"
      role={multiple ? 'checkbox' : 'radio'}
      aria-checked={checked}
      data-checked={checked ? '' : undefined}
      disabled={!hitl.canSubmit}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);
        toggle(value);
      }}
      {...props}
    />
  );
});

export const HitlSubmit = forwardRef<HTMLButtonElement, ButtonProps & { toDecision?: (selected: string[]) => HitlDecision }>(
  function HitlSubmit({ asChild, toDecision, disabled, onClick, ...props }, ref) {
    const { selected, multiple, hitl } = useHitlChoice();
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        type="button"
        disabled={disabled || !hitl.canSubmit || selected.length === 0}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          onClick?.(e);
          void hitl.submit(toDecision ? toDecision(selected) : multiple ? selected : (selected[0] ?? ''));
        }}
        {...props}
      />
    );
  },
);
