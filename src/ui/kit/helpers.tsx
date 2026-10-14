import { Alert, Box, Button } from '@neofloai/atoms';
import { text } from '@neofloai/atoms/tokens';
import { useEffect, useState, type ReactNode } from 'react';
import type { ChatErrorInfo } from '../../core/store/types';
import { useChatActions, useChatRuntime, useLabels, useSourceLabel, useThread } from '../../react/hooks';
import { mode, type AtomsTheme } from './tokens';

const BUSY = new Set(['submitting', 'streaming', 'cancelling']);

/** True when the thread's last turn failed and can be retried. */
export function useCanRetry(): boolean {
  return useThread((s) => {
    if (BUSY.has(s.run.status)) return false;
    const last = s.messages[s.messages.length - 1];
    return s.run.status === 'error' || last?.status === 'error' || last?.status === 'interrupted';
  });
}

/** Allows http(s), mailto, relative URLs and blob:; `data:image/*` only when asked. */
export function safeUrl(url: string | undefined, { allowDataImage = false } = {}): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (/^(https?:|mailto:|blob:)/i.test(trimmed)) return trimmed;
  // SVG is safe here: images never run scripts, and this is only used for <img> sources.
  if (allowDataImage && /^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml)[;,]/i.test(trimmed)) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return undefined; // javascript:, vbscript:, …
  return trimmed;
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '';
  if (ms < 60_000) return `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)}s`;
  return `${Math.round(ms / 60_000)}m`;
}

/** A Try again button that waits out `retry_after` first. */
export function RetryButton({ retryAfter, onRetry }: { retryAfter?: number | null; onRetry: () => void }) {
  const labels = useLabels();
  const [left, setLeft] = useState(() => Math.ceil(retryAfter ?? 0));
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return (
    <Button size="sm" variant="error" appearance="text" disabled={left > 0} onClick={onRetry}>
      {left > 0 ? labels.tryAgainIn(left) : labels.tryAgain}
    </Button>
  );
}

/** The error card (Figma ErrorBlock), built on Atoms `Alert`. */
export function ErrorNotice({
  title,
  message,
  retryable = true,
  retryAfter,
  onRetry,
  action,
  requestId,
}: {
  title: ReactNode;
  message?: ReactNode;
  retryable?: boolean;
  retryAfter?: number | null;
  onRetry?: () => void;
  /** Replaces the Try again button (for example Reconnect). */
  action?: ReactNode;
  /** Shown small under the message, for bug reports. */
  requestId?: string | null;
}) {
  const labels = useLabels();
  const canRetry = useCanRetry();
  const { retry } = useChatActions();
  const handler = onRetry ?? (() => void retry());
  return (
    <Alert
      severity="error"
      floating
      title={title}
      action={
        action ?? (retryable && (onRetry || canRetry) ? <RetryButton retryAfter={retryAfter} onRetry={handler} /> : undefined)
      }
    >
      {message}
      {requestId ? (
        <Box component="span" sx={(t: AtomsTheme) => ({ display: 'block', mt: 0.5, ...mode(t, { color: text.default.b3 }) })}>
          {labels.errorReference(requestId)}
        </Box>
      ) : null}
    </Alert>
  );
}

/** A Reconnect button for `connection_required` / `connection_expired`, named after the source. */
function ReconnectButton({ sourceId }: { sourceId?: string }) {
  const labels = useLabels();
  const { reconnect } = useChatActions();
  const sourceLabel = useSourceLabel(sourceId);
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="sm"
      variant="error"
      appearance="text"
      loading={busy}
      onClick={() => {
        setBusy(true);
        void reconnect().finally(() => setBusy(false));
      }}
    >
      {labels.reconnect(sourceLabel)}
    </Button>
  );
}

/**
 * An `ErrorNotice` for a turn's error: Try again (with the `retry_after` countdown), Reconnect
 * for a connection error, or no button when retrying can't help (sign in, access denied…).
 */
export function TurnErrorNotice({ error, title, message }: { error: ChatErrorInfo; title?: ReactNode; message?: ReactNode }) {
  const runtime = useChatRuntime();
  const reconnect = error.action === 'reconnect' && runtime.config.canReconnect;
  return (
    <ErrorNotice
      title={title ?? error.message}
      message={message}
      retryable={error.action ? error.action === 'retry' : error.retryable !== false}
      retryAfter={error.retryAfter}
      action={reconnect ? <ReconnectButton sourceId={error.sourceId} /> : undefined}
      requestId={error.requestId}
    />
  );
}
