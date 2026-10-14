import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Typography,
} from '@neofloai/atoms';
import { BrainIcon, FilesIcon, FileTextIcon, WrenchIcon } from '@neofloai/atoms/icons';
import { text } from '@neofloai/atoms/tokens';
import { useEffect, useState } from 'react';
import {
  parseFallback,
  type ErrorData,
  type SourcesData,
  type TextData,
  type ThinkingData,
  type ToolCallData,
} from '../../blocks/parsers';
import { formatJsonish, humanizeKey } from '../../blocks/format';
import type { BlockRenderProps } from '../../registry/types';
import { useLabels } from '../../react/hooks';
import { BlockShell } from '../kit/BlockShell';
import { ErrorNotice, formatDuration, safeUrl, useCanRetry } from '../kit/helpers';
import { KeyValueList, type KeyValueItem } from '../kit/KeyValueList';
import { Shimmer } from '../kit/Shimmer';
import { mode, monoFont, type AtomsTheme } from '../kit/tokens';
import { Markdown } from './Markdown';
import { isDev } from '../../core/runtime/env';

export function TextBlock({ data }: BlockRenderProps<TextData>) {
  if (!data.text) return null;
  return <Markdown>{data.text}</Markdown>;
}

export function ThinkingBlock({ data, status }: BlockRenderProps<ThinkingData>) {
  const labels = useLabels();
  const streaming = status === 'streaming';
  const [open, setOpen] = useState(streaming);
  // Open while the model thinks, fold away once it's done.
  useEffect(() => {
    if (!streaming) setOpen(false);
  }, [streaming]);
  const seconds = data.durationMs !== undefined ? Math.round(data.durationMs / 1000) : undefined;
  const title = streaming ? (
    <Shimmer>{labels.thinkingLive}</Shimmer>
  ) : seconds !== undefined ? (
    labels.thoughtFor(seconds)
  ) : (
    labels.thought
  );
  return (
    <BlockShell icon={<BrainIcon />} title={title} collapsible open={open} onOpenChange={setOpen} busy={streaming}>
      {data.text ? (
        <Typography
          variant="body1"
          component="div"
          sx={(t: AtomsTheme) => ({ whiteSpace: 'pre-wrap', ...mode(t, { color: text.default.b2 }) })}
        >
          {data.text}
        </Typography>
      ) : null}
    </BlockShell>
  );
}

const MAX_RESULTS_SHOWN = 5;

function ToolResults({ results, total }: { results: NonNullable<ToolCallData['results']>; total: number }) {
  const labels = useLabels();
  const shown = results.slice(0, MAX_RESULTS_SHOWN);
  const more = Math.max(0, total - shown.length);
  return (
    <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <span>{labels.toolResults(total)}</span>
      {shown.map((r, i) => {
        const href = safeUrl(r.url);
        return (
          <Box component="span" key={`${r.title}:${i}`} sx={{ display: 'block' }}>
            {href ? (
              <Link href={href} target="_blank" rel="noopener noreferrer">
                {r.title}
              </Link>
            ) : (
              r.title
            )}
            {r.snippet ? (
              <Box component="span" sx={(t: AtomsTheme) => ({ display: 'block', ...mode(t, { color: text.default.b3 }) })}>
                {r.snippet}
              </Box>
            ) : null}
          </Box>
        );
      })}
      {more ? (
        <Box component="span" sx={(t: AtomsTheme) => mode(t, { color: text.default.b3 })}>
          {labels.toolMoreResults(more)}
        </Box>
      ) : null}
    </Box>
  );
}

export function ToolBlock({ data }: BlockRenderProps<ToolCallData>) {
  const labels = useLabels();
  const running = data.status === 'running';
  const items: KeyValueItem[] = data.input.map(([k, v]) => ({ key: k, label: humanizeKey(k), value: formatJsonish(v) }));
  if (data.results) {
    const total = data.resultCount ?? data.results.length;
    items.push({ key: '__returned', label: 'returned', value: <ToolResults results={data.results} total={total} /> });
  } else if (data.summary) items.push({ key: '__returned', label: 'returned', value: data.summary });
  else if (data.output !== undefined && !running)
    items.push({ key: '__returned', label: 'returned', value: formatJsonish(data.output) });
  if (data.error) {
    items.push({
      key: '__error',
      label: 'error',
      value: (
        <Box component="span" sx={(t: AtomsTheme) => mode(t, { color: text.error[3] })}>
          {data.error}
        </Box>
      ),
    });
  }
  const meta = running ? (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      <CircularProgress size={12} color="secondary" />
      {labels.toolRunning}
    </Box>
  ) : data.status === 'error' ? (
    <Chip size="sm" variant="error" label={labels.toolFailed} />
  ) : data.status === 'interrupted' ? (
    <Chip size="sm" variant="warning" label={labels.toolInterrupted} />
  ) : data.durationMs !== undefined ? (
    formatDuration(data.durationMs)
  ) : undefined;
  return (
    <BlockShell icon={<WrenchIcon />} title={data.title ?? data.name} meta={meta} busy={running} aria-label={data.name}>
      {items.length ? <KeyValueList items={items} /> : null}
    </BlockShell>
  );
}

export function SourcesBlock({ data, actions }: BlockRenderProps<SourcesData>) {
  const labels = useLabels();
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(data.items.map((i) => [i.id, i.selected ?? false])),
  );
  const title = data.title ?? labels.sources(data.items.length);
  return (
    <BlockShell icon={<FilesIcon />} title={title} flushBody>
      <List dense>
        {data.items.map((item) => {
          const href = safeUrl(item.url);
          const primary = item.label;
          if (data.selectable) {
            return (
              <ListItem key={item.id} disablePadding>
                <ListItemButton
                  role="checkbox"
                  aria-checked={Boolean(checked[item.id])}
                  onClick={() => {
                    const next = !checked[item.id];
                    setChecked((c) => ({ ...c, [item.id]: next }));
                    actions.emit('source_toggle', { ...item, selected: next });
                  }}
                >
                  <ListItemIcon>
                    <Checkbox size="sm" checked={Boolean(checked[item.id])} tabIndex={-1} aria-hidden />
                  </ListItemIcon>
                  <ListItemText primary={primary} secondary={item.description} />
                </ListItemButton>
              </ListItem>
            );
          }
          return (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                {...(href ? { component: 'a', href, target: '_blank', rel: 'noopener noreferrer' } : {})}
                onClick={() => actions.emit('open_source', item)}
              >
                <ListItemIcon>
                  <FileTextIcon size={14} />
                </ListItemIcon>
                <ListItemText primary={primary} secondary={item.description} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </BlockShell>
  );
}

export function ErrorBlock({ data, actions }: BlockRenderProps<ErrorData>) {
  const canRetry = useCanRetry();
  return (
    <ErrorNotice
      title={data.title}
      message={data.message}
      retryable={data.retryable && canRetry}
      retryAfter={data.retryAfter}
      onRetry={canRetry ? actions.retry : undefined}
    />
  );
}

/**
 * Blocks nobody claimed. A product's own block (`<product>.<name>`) carries `fallback_text`,
 * which renders as Markdown everywhere. Anything else shows raw JSON in development and
 * nothing in production.
 */
export function UnknownBlock({ block }: BlockRenderProps) {
  const labels = useLabels();
  const fallback = parseFallback(block.data).text;
  if (fallback) return <Markdown>{fallback}</Markdown>;
  if (!isDev()) return null;
  const json = (() => {
    try {
      return JSON.stringify(block.data, null, 2).slice(0, 4000);
    } catch {
      return String(block.data);
    }
  })();
  return (
    <Alert severity="warning" floating title={`${labels.unknownBlock}: ${block.type}`}>
      <Box component="pre" sx={{ m: 0, fontFamily: monoFont, whiteSpace: 'pre-wrap', maxHeight: 240, overflow: 'auto' }}>
        {json}
      </Box>
    </Alert>
  );
}

export function BlockCrashNotice() {
  const labels = useLabels();
  return <Alert severity="warning" floating title={labels.blockCrashed} />;
}
