import { Box, IconButton, Stack, Tooltip, Typography, type BoxProps } from '@neofloai/atoms';
import { NotePencilIcon, SidebarSimpleIcon } from '@neofloai/atoms/icons';
import { border, elevation, surface, text } from '@neofloai/atoms/tokens';
import { useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { useIsomorphicLayoutEffect } from '../../react/hooks/use-store';
import type { ChatMessage } from '../../core/store/types';
import { useChatActions, useLabels, usePreference, useThreadMeta } from '../../react/hooks';
import { ChatProvider, type ChatProviderProps } from '../../react/provider';
import { BlockCrashNotice, defaultBlocks, unknownBlock } from '../blocks';
import { ChatHistory, type ChatHistoryProps } from '../history/ChatHistory';
import { mode, type AtomsTheme } from '../kit/tokens';
import { isDev } from '../../core/runtime/env';
import { ChatComposer, type ChatComposerProps } from './Composer';
import { ChatThread } from './ChatThread';

export interface ChatHeaderProps {
  title?: ReactNode;
  /** Controls before the New chat button. */
  actions?: ReactNode;
  historyOpen?: boolean;
  onToggleHistory?: () => void;
}

/** The bar above the thread: history toggle, the conversation title, New chat. */
export function ChatHeader({ title, actions, historyOpen, onToggleHistory }: ChatHeaderProps) {
  const labels = useLabels();
  const meta = useThreadMeta();
  const { newConversation } = useChatActions();
  return (
    <Stack
      component="header"
      direction="row"
      spacing={1}
      sx={(t: AtomsTheme) => ({
        alignItems: 'center',
        px: 1.5,
        py: 1,
        minHeight: 52,
        borderBottom: '1px solid',
        ...mode(t, { borderColor: border.layers.card1 }),
      })}
    >
      {onToggleHistory ? (
        <Tooltip title={historyOpen ? labels.closeHistory : labels.openHistory}>
          <IconButton
            size="sm"
            variant="secondary"
            appearance="text"
            aria-label={historyOpen ? labels.closeHistory : labels.openHistory}
            aria-expanded={historyOpen}
            onClick={onToggleHistory}
          >
            <SidebarSimpleIcon />
          </IconButton>
        </Tooltip>
      ) : null}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body1"
          weight="medium"
          component="h1"
          noWrap
          sx={(t: AtomsTheme) => ({ m: 0, ...mode(t, { color: text.default.heading }) })}
        >
          {title ?? meta.title}
        </Typography>
        {meta.subtitle ? (
          <Typography variant="body2" component="div" noWrap sx={(t: AtomsTheme) => mode(t, { color: text.default.b3 })}>
            {meta.subtitle}
          </Typography>
        ) : null}
      </Box>
      {actions}
      <Tooltip title={labels.newChat}>
        <IconButton
          size="sm"
          variant="secondary"
          appearance="text"
          aria-label={labels.newChat}
          onClick={() => void newConversation().catch(() => undefined)}
        >
          <NotePencilIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

/** Slots: replace any part of the default UI with your own component. */
export interface ChatComponents {
  /** The empty-chat screen. Use hooks (`useThreadMeta`, `useChatActions`) inside it. */
  Welcome: ComponentType;
  UserTurn: ComponentType<{ message: ChatMessage }>;
  AssistantTurn: ComponentType<{ message: ChatMessage }>;
  Header: ComponentType<ChatHeaderProps>;
  History: ComponentType<ChatHistoryProps>;
  Composer: ComponentType<ChatComposerProps>;
}

export interface AgenticChatProps extends ChatProviderProps {
  /** Show the conversation history panel. @default true */
  history?: boolean;
  /** Initial state of the history panel on wide layouts (remembered afterwards). @default true */
  defaultHistoryOpen?: boolean;
  /** Show the header bar. @default true */
  header?: boolean;
  /** Header title; defaults to the conversation title. */
  title?: ReactNode;
  headerActions?: ReactNode;
  components?: Partial<ChatComponents>;
  composerProps?: ChatComposerProps;
  /** Reading-column width. @default 760 */
  maxWidth?: number;
  /** Below this container width the history panel overlays the chat. @default 720 */
  compactBelow?: number;
  className?: string;
  sx?: BoxProps['sx'];
}

let warnedTheme = false;
function checkTheme(theme: AtomsTheme) {
  if (warnedTheme) return;
  if (isDev() && !(theme as { vars?: unknown }).vars) {
    warnedTheme = true;
    console.warn(
      '[agentic-chat] Wrap your app in <NeofloThemeProvider> from @neofloai/atoms; the chat renders with the wrong theme without it.',
    );
  }
}

function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => entry && setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

function ChatLayout({
  history = true,
  defaultHistoryOpen = true,
  header = true,
  title,
  headerActions,
  components,
  composerProps,
  maxWidth = 760,
  compactBelow = 720,
  className,
  sx,
}: AgenticChatProps) {
  const [rootRef, width] = useContainerWidth<HTMLDivElement>();
  const compact = width !== null && width < compactBelow;
  const [wideOpen, setWideOpen] = usePreference('historyOpen', defaultHistoryOpen);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const historyOpen = history && (compact ? overlayOpen : wideOpen);
  const toggleHistory = () => (compact ? setOverlayOpen((o) => !o) : setWideOpen(!wideOpen));

  const Header = components?.Header ?? ChatHeader;
  const History = components?.History ?? ChatHistory;
  const ComposerSlot = components?.Composer ?? ChatComposer;

  return (
    <Box
      ref={rootRef}
      className={className}
      data-agentic-chat=""
      sx={[
        (t: AtomsTheme) => {
          checkTheme(t);
          return {
            display: 'flex',
            height: '100%',
            minHeight: 0,
            position: 'relative',
            overflow: 'hidden',
            ...mode(t, { backgroundColor: surface.layers.page, color: text.default.b1 }),
          };
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {historyOpen ? (
        <Box
          sx={(t: AtomsTheme) => ({
            width: compact ? 'min(320px, 85%)' : 280,
            flexShrink: 0,
            borderRight: '1px solid',
            ...mode(t, { borderColor: border.layers.card1, backgroundColor: surface.layers.card1 }),
            ...(compact ? { position: 'absolute', top: 0, bottom: 0, left: 0, zIndex: 2, boxShadow: elevation.large } : {}),
          })}
        >
          <History onSelect={compact ? () => setOverlayOpen(false) : undefined} />
        </Box>
      ) : null}
      {compact && historyOpen ? (
        <Box aria-hidden onClick={() => setOverlayOpen(false)} sx={{ position: 'absolute', inset: 0, zIndex: 1 }} />
      ) : null}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {header ? (
          <Header
            title={title}
            actions={headerActions}
            historyOpen={historyOpen}
            onToggleHistory={history ? toggleHistory : undefined}
          />
        ) : null}
        <ChatThread components={components} maxWidth={maxWidth} />
        <Box sx={{ px: 2, pb: 2, pt: 0.5 }}>
          <Box sx={{ maxWidth, mx: 'auto' }}>
            <ComposerSlot {...composerProps} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * The complete chat: history, thread, composer and every built-in block, on Atoms. Mount it
 * inside `NeofloThemeProvider` and give it a sized container.
 *
 * ```tsx
 * <AgenticChat adapter={createRestAdapter({ baseUrl, headers })} />
 * ```
 */
export function AgenticChat(props: AgenticChatProps) {
  const {
    history,
    defaultHistoryOpen,
    header,
    title,
    headerActions,
    components,
    composerProps,
    maxWidth,
    compactBelow,
    className,
    sx,
    blocks,
    fallbackBlock,
    blockErrorFallback,
    ...provider
  } = props;
  const allBlocks = useMemo(() => [...defaultBlocks, ...(blocks ?? [])], [blocks]);
  return (
    <ChatProvider
      {...provider}
      blocks={allBlocks}
      fallbackBlock={fallbackBlock ?? unknownBlock}
      blockErrorFallback={blockErrorFallback ?? (() => <BlockCrashNotice />)}
    >
      <ChatLayout
        history={history}
        defaultHistoryOpen={defaultHistoryOpen}
        header={header}
        title={title}
        headerActions={headerActions}
        components={components}
        composerProps={composerProps}
        maxWidth={maxWidth}
        compactBelow={compactBelow}
        className={className}
        sx={sx}
      />
    </ChatProvider>
  );
}
