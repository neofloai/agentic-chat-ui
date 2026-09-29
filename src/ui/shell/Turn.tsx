import { Box, Button, Chip, Fade, IconButton, Skeleton, Stack, Tooltip, Typography } from '@neofloai/atoms';
import { CheckIcon, CopyIcon, LightningIcon } from '@neofloai/atoms/icons';
import { border, radius, surface, text } from '@neofloai/atoms/tokens';
import { useState } from 'react';
import type { SuggestedPrompt } from '../../core/protocol/types';
import type { ChatBlock, ChatMessage } from '../../core/store/types';
import { useChatContext } from '../../react/context';
import { useLabels, useThread, useThreadMeta } from '../../react/hooks';
import { Message, MessageBlocks, Suggestions, messageText } from '../../react/primitives';
import { ErrorNotice } from '../kit/helpers';
import { PulseDot, Shimmer } from '../kit/Shimmer';
import { mode, type AtomsTheme } from '../kit/tokens';
import { AttachmentCard } from './Composer';

const BUSY = new Set(['submitting', 'streaming', 'cancelling']);

/** Figma Turn (question): the user's message, right-aligned in a bubble. */
export function UserTurn({ message }: { message: ChatMessage }) {
  const body = messageText(message);
  return (
    <Message.Root asChild>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
        {message.attachments?.length ? (
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, justifyContent: 'flex-end' }}>
            {message.attachments.map((a, i) => (
              <AttachmentCard key={`${a.url}:${i}`} attachment={a} />
            ))}
          </Stack>
        ) : null}
        {body ? (
          <Box
            sx={(t: AtomsTheme) => ({
              maxWidth: 'min(80%, 560px)',
              px: 2,
              py: 1.5,
              borderRadius: `${radius.lg}px`,
              border: '1px solid',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
              ...mode(t, {
                backgroundColor: surface.layers.card2,
                borderColor: border.layers.card1,
                color: text.default.heading,
              }),
            })}
          >
            <Typography variant="h6" weight="regular" component="div">
              {body}
            </Typography>
          </Box>
        ) : null}
      </Box>
    </Message.Root>
  );
}

function blockText(block: ChatBlock, registry: ReturnType<typeof useChatContext>['registry']): string | undefined {
  const def = registry.resolve(block.data);
  if (!def?.toText) return undefined;
  try {
    return def.toText(def.parse ? def.parse(block.data, block) : block.data, block);
  } catch {
    return undefined;
  }
}

function CopyButton({ message }: { message: ChatMessage }) {
  const labels = useLabels();
  const { registry } = useChatContext();
  const [copied, setCopied] = useState(false);
  const value = messageText(message, (b) => blockText(b, registry));
  if (!value || typeof navigator === 'undefined' || !navigator.clipboard) return null;
  return (
    <Tooltip title={copied ? labels.copied : labels.copy}>
      <IconButton
        size="sm"
        variant="secondary"
        appearance="text"
        aria-label={labels.copy}
        onClick={() => {
          void navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </IconButton>
    </Tooltip>
  );
}

/** Figma Turn (answer): the assistant's blocks, unbubbled, full width. */
export function AssistantTurn({ message }: { message: ChatMessage }) {
  const labels = useLabels();
  const waiting = message.status === 'streaming' && message.blocks.length === 0;
  const failed = message.status === 'interrupted' || (message.status === 'error' && message.error);
  return (
    <Message.Root asChild>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          minWidth: 0,
          '& .acu-turn-actions': { opacity: 0, transition: 'opacity 120ms ease' },
          '&:hover .acu-turn-actions, & .acu-turn-actions:focus-within': { opacity: 1 },
        }}
      >
        <MessageBlocks />
        {waiting ? <Shimmer>{labels.thinkingLive}</Shimmer> : null}
        {failed ? (
          <ErrorNotice
            title={message.status === 'interrupted' ? labels.interrupted : (message.error?.message ?? labels.interrupted)}
            message={message.status === 'interrupted' ? message.error?.message : undefined}
            retryable={message.error?.retryable !== false}
            retryAfter={message.error?.retryAfter}
          />
        ) : null}
        {message.status === 'cancelled' ? (
          <Typography variant="body2" sx={(t: AtomsTheme) => mode(t, { color: text.default.b3 })}>
            {labels.stopped}
          </Typography>
        ) : null}
        {message.status !== 'streaming' ? (
          <Stack direction="row" spacing={0.5} className="acu-turn-actions" sx={{ ml: -0.75 }}>
            <CopyButton message={message} />
          </Stack>
        ) : null}
      </Box>
    </Message.Root>
  );
}

/** Figma RunStatus: the live progress pill fed by `status` events. */
export function RunStatus() {
  const label = useThread((s) => (BUSY.has(s.run.status) ? s.run.statusLabel : undefined));
  return (
    <Box aria-live="polite" aria-atomic="true" sx={{ minHeight: 0 }}>
      <Fade in={Boolean(label)} unmountOnExit>
        <Box sx={{ display: 'inline-flex' }}>
          <Chip dense appearance="outline" variant="secondary" icon={<PulseDot />} label={label ?? ''} />
        </Box>
      </Fade>
    </Box>
  );
}

/** What shows under the last message while a turn is in flight or failed before starting. */
export function PendingTurn() {
  const labels = useLabels();
  const state = useThread(
    (s) => {
      const last = s.messages[s.messages.length - 1];
      const awaitingReply = last?.role === 'user' || !last;
      return {
        submitting: s.run.status === 'submitting' && awaitingReply,
        failedBeforeReply: s.run.status === 'error' && last?.role === 'user' ? s.run.error : undefined,
      };
    },
    (a, b) => a.submitting === b.submitting && a.failedBeforeReply === b.failedBeforeReply,
  );
  return (
    <>
      {state.submitting ? <Shimmer>{labels.thinkingLive}</Shimmer> : null}
      <RunStatus />
      {state.failedBeforeReply ? (
        <ErrorNotice
          title={state.failedBeforeReply.message}
          retryable={state.failedBeforeReply.retryable}
          retryAfter={state.failedBeforeReply.retryAfter}
        />
      ) : null}
    </>
  );
}

/** Figma ChatSuggestions: opening prompts. Clicking sends the prompt text. */
export function ChatSuggestions({ prompts }: { prompts?: SuggestedPrompt[] }) {
  return (
    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
      <Suggestions.Root prompts={prompts}>
        {(p, i) => (
          <Suggestions.Item key={`${p.label}:${i}`} prompt={p} asChild>
            <Button size="sm" variant="secondary" appearance="outline" startIcon={<LightningIcon />}>
              {p.label}
            </Button>
          </Suggestions.Item>
        )}
      </Suggestions.Root>
    </Stack>
  );
}

/** The default empty-chat screen: the server's greeting and suggested prompts. */
export function WelcomeScreen() {
  const labels = useLabels();
  const meta = useThreadMeta();
  const loading = useThread((s) => s.loadStatus === 'loading');
  return (
    <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center', py: { xs: 6, sm: 10 } }}>
      {loading ? (
        <Skeleton variant="text" width={280} height={36} />
      ) : (
        <Typography variant="h4" component="h2" sx={(t: AtomsTheme) => mode(t, { color: text.default.heading })}>
          {meta.greeting || labels.welcomeTitle}
        </Typography>
      )}
      <ChatSuggestions />
    </Stack>
  );
}
