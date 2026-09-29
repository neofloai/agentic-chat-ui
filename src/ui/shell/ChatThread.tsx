import { Box, IconButton, Skeleton, Stack } from '@neofloai/atoms';
import { ArrowDownIcon } from '@neofloai/atoms/icons';
import { elevation } from '@neofloai/atoms/tokens';
import { useEffect, useRef, type ComponentType } from 'react';
import type { ChatMessage } from '../../core/store/types';
import { useChatActions, useLabels, useThread } from '../../react/hooks';
import { Thread, useThreadScroll } from '../../react/primitives';
import { ErrorNotice } from '../kit/helpers';
import { AssistantTurn, PendingTurn, UserTurn, WelcomeScreen } from './Turn';

export interface ThreadComponents {
  Welcome?: ComponentType;
  UserTurn?: ComponentType<{ message: ChatMessage }>;
  AssistantTurn?: ComponentType<{ message: ChatMessage }>;
}

function ThreadSkeleton() {
  return (
    <Stack spacing={3} aria-hidden>
      <Skeleton variant="rounded" height={48} width="45%" sx={{ alignSelf: 'flex-end' }} />
      <Stack spacing={1}>
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="75%" />
        <Skeleton variant="text" width="60%" />
      </Stack>
    </Stack>
  );
}

/** Scrolls to the newest message whenever the user sends one. */
function FollowOnSend() {
  const { scrollToBottom } = useThreadScroll();
  const lastUserId = useThread((s) => {
    const last = s.messages[s.messages.length - 1];
    return last?.role === 'user' ? last.id : undefined;
  });
  const prev = useRef(lastUserId);
  useEffect(() => {
    if (lastUserId && lastUserId !== prev.current) scrollToBottom('auto');
    prev.current = lastUserId;
  }, [lastUserId, scrollToBottom]);
  return null;
}

function LoadError() {
  const labels = useLabels();
  const error = useThread((s) => s.loadError);
  const id = useThread((s) => s.conversationId);
  const { selectConversation, newConversation } = useChatActions();
  return (
    <ErrorNotice
      title={labels.loadError}
      message={error?.message}
      onRetry={() => void (id ? selectConversation(id) : newConversation().catch(() => undefined))}
    />
  );
}

export interface ChatThreadProps {
  components?: ThreadComponents;
  /** Width of the reading column. @default 760 */
  maxWidth?: number;
}

/** The scrolling message list with the welcome screen, loading and error states. */
export function ChatThread({ components, maxWidth = 760 }: ChatThreadProps) {
  const labels = useLabels();
  const loadStatus = useThread((s) => s.loadStatus);
  const empty = useThread((s) => s.messages.length === 0);
  const Welcome = components?.Welcome ?? WelcomeScreen;

  return (
    <Thread.Root asChild>
      <Box sx={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <FollowOnSend />
        <Thread.Viewport style={{ flex: 1, minHeight: 0 }}>
          <Box sx={{ maxWidth, mx: 'auto', px: 2, pt: 3, pb: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {loadStatus === 'loading' && empty ? <ThreadSkeleton /> : null}
            {loadStatus === 'error' ? <LoadError /> : null}
            <Thread.Empty>
              <Welcome />
            </Thread.Empty>
            <Thread.Messages
              components={{
                UserMessage: components?.UserTurn ?? UserTurn,
                AssistantMessage: components?.AssistantTurn ?? AssistantTurn,
              }}
            />
            <PendingTurn />
          </Box>
        </Thread.Viewport>
        <Thread.ScrollToBottom asChild>
          <IconButton
            size="sm"
            variant="secondary"
            appearance="outline"
            aria-label={labels.jumpToLatest}
            sx={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', boxShadow: elevation.medium }}
          >
            <ArrowDownIcon />
          </IconButton>
        </Thread.ScrollToBottom>
      </Box>
    </Thread.Root>
  );
}
