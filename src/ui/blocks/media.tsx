import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Tooltip,
  Typography,
} from '@neofloai/atoms';
import {
  ArrowsOutSimpleIcon,
  CheckIcon,
  DownloadSimpleIcon,
  FileTextIcon,
  ImageBrokenIcon,
  MinusIcon,
  XIcon,
} from '@neofloai/atoms/icons';
import { border, icon as iconTokens, surface, text } from '@neofloai/atoms/tokens';
import { useState } from 'react';
import type { ArtifactData, ImageData, PlanData, PlanStep } from '../../blocks/parsers';
import { formatJsonish, humanizeKey } from '../../blocks/format';
import type { BlockRenderProps } from '../../registry/types';
import { useLabels } from '../../react/hooks';
import { BlockShell } from '../kit/BlockShell';
import { safeUrl } from '../kit/helpers';
import { KeyValueList } from '../kit/KeyValueList';
import { Shimmer } from '../kit/Shimmer';
import { mode, monoFont, type AtomsTheme } from '../kit/tokens';
import { Markdown } from './Markdown';

const PREVIEW_LINES = 6;

const FORMAT_LABEL: Record<string, string> = { markdown: 'Markdown', text: 'Text', json: 'JSON', csv: 'CSV', code: 'Code' };

function download(data: ArtifactData) {
  if (typeof document === 'undefined') return;
  const href = safeUrl(data.url);
  const a = document.createElement('a');
  if (href) {
    a.href = href;
  } else if (data.content !== undefined) {
    a.href = URL.createObjectURL(new Blob([data.content], { type: data.mimeType ?? 'text/plain' }));
  } else return;
  a.download = data.title;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (!href) setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Figma ArtifactBlock: a generated document with a preview, full view and download. */
export function ArtifactBlock({ data, actions, status }: BlockRenderProps<ArtifactData>) {
  const labels = useLabels();
  const [open, setOpen] = useState(false);
  const content = data.content ?? '';
  const lines = content.split('\n');
  const truncated = lines.length > PREVIEW_LINES;
  const canDownload = Boolean(safeUrl(data.url) || data.content !== undefined);

  const openFull = () => {
    setOpen(true);
    actions.emit('open_artifact', data);
  };

  return (
    <>
      <BlockShell
        icon={<FileTextIcon />}
        title={data.title}
        busy={status === 'streaming'}
        actions={
          <>
            <Chip size="sm" variant="secondary" label={FORMAT_LABEL[data.format] ?? data.format} />
            {content ? (
              <Tooltip title={labels.openFull}>
                <IconButton size="sm" variant="secondary" appearance="text" aria-label={labels.openFull} onClick={openFull}>
                  <ArrowsOutSimpleIcon />
                </IconButton>
              </Tooltip>
            ) : null}
            {canDownload ? (
              <Tooltip title={labels.download}>
                <IconButton
                  size="sm"
                  variant="secondary"
                  appearance="text"
                  aria-label={labels.download}
                  onClick={() => download(data)}
                >
                  <DownloadSimpleIcon />
                </IconButton>
              </Tooltip>
            ) : null}
          </>
        }
      >
        {content ? (
          <Box
            component="pre"
            sx={(t: AtomsTheme) => ({
              m: 0,
              fontFamily: monoFont,
              fontSize: t.typography.body2.fontSize,
              lineHeight: '22px',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
              ...mode(t, { color: text.default.b2 }),
              ...(truncated
                ? {
                    maskImage: 'linear-gradient(to bottom, black 60%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent)',
                  }
                : {}),
            })}
          >
            {lines.slice(0, PREVIEW_LINES).join('\n')}
          </Box>
        ) : null}
      </BlockShell>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md" scroll="paper">
        <DialogTitle onClose={() => setOpen(false)} slotProps={{ closeButton: { 'aria-label': labels.close } }}>
          {data.title}
        </DialogTitle>
        <DialogContent dividers>
          {data.format === 'markdown' ? (
            <Markdown size="sm">{content}</Markdown>
          ) : (
            <Box component="pre" sx={{ m: 0, fontFamily: monoFont, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {content}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Figma ImageBlock: a returned image with its caption; opens larger on click. */
export function ImageBlock({ data, actions }: BlockRenderProps<ImageData>) {
  const labels = useLabels();
  const src = safeUrl(data.src, { allowDataImage: true });
  const [state, setState] = useState<'loading' | 'ready' | 'error'>(src ? 'loading' : 'error');
  const [open, setOpen] = useState(false);

  return (
    <Box component="figure" sx={{ m: 0, maxWidth: 480 }}>
      <Box
        component="button"
        type="button"
        disabled={state !== 'ready'}
        aria-label={data.alt || data.caption || labels.openFull}
        onClick={() => {
          setOpen(true);
          actions.emit('open_image', data);
        }}
        sx={(t: AtomsTheme) => ({
          display: 'block',
          width: '100%',
          p: 0,
          border: '1px solid',
          borderRadius: 1.5,
          overflow: 'hidden',
          cursor: state === 'ready' ? 'zoom-in' : 'default',
          position: 'relative',
          minHeight: state === 'ready' ? undefined : 168,
          ...mode(t, { backgroundColor: surface.layers.card2, borderColor: border.layers.card1 }),
        })}
      >
        {src && state !== 'error' ? (
          <Box
            component="img"
            src={src}
            alt={data.alt}
            loading="lazy"
            onLoad={() => setState('ready')}
            onError={() => setState('error')}
            sx={{ display: 'block', width: '100%', maxHeight: 360, objectFit: 'contain', opacity: state === 'ready' ? 1 : 0 }}
          />
        ) : null}
        {state === 'loading' ? <Skeleton variant="rectangular" sx={{ position: 'absolute', inset: 0, height: '100%' }} /> : null}
        {state === 'error' ? (
          <Stack
            spacing={1}
            sx={(t: AtomsTheme) => ({
              position: 'absolute',
              inset: 0,
              alignItems: 'center',
              justifyContent: 'center',
              ...mode(t, { color: iconTokens.default.b3 }),
            })}
          >
            <ImageBrokenIcon size={28} />
            <Typography variant="body2">{labels.imageFailed}</Typography>
          </Stack>
        ) : null}
      </Box>
      {data.caption ? (
        <Typography
          variant="body2"
          component="figcaption"
          sx={(t: AtomsTheme) => ({ mt: 1, ...mode(t, { color: text.default.b3 }) })}
        >
          {data.caption}
        </Typography>
      ) : null}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg">
        <DialogTitle onClose={() => setOpen(false)} slotProps={{ closeButton: { 'aria-label': labels.close } }}>
          {data.caption ?? data.alt ?? ''}
        </DialogTitle>
        <DialogContent>
          {src ? (
            <Box
              component="img"
              src={src}
              alt={data.alt}
              sx={{ display: 'block', maxWidth: '100%', maxHeight: '75vh', mx: 'auto' }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

function StepStatusIcon({ step }: { step: PlanStep }) {
  if (step.status === 'running') return <CircularProgress size={12} />;
  const glyph =
    step.status === 'done' ? (
      <CheckIcon size={14} />
    ) : step.status === 'failed' ? (
      <XIcon size={14} />
    ) : step.status === 'skipped' ? (
      <MinusIcon size={14} />
    ) : null;
  if (!glyph) return null;
  const color = step.status === 'failed' ? iconTokens.error[3] : iconTokens.default.b3;
  return (
    <Box component="span" aria-hidden sx={(t: AtomsTheme) => ({ display: 'inline-flex', ...mode(t, { color }) })}>
      {glyph}
    </Box>
  );
}

/** Figma Plan: the agent's steps on an Atoms `Stepper`, each with an optional detail panel. */
export function PlanBlock({ data }: BlockRenderProps<PlanData>) {
  const labels = useLabels();
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(data.steps.filter((s) => (s.status === 'running' || s.status === 'failed') && s.detail).map((s) => s.id)),
  );
  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Box aria-label={data.title ?? labels.planRunning}>
      {data.title ? (
        <Typography variant="body1" weight="medium" component="div" sx={{ mb: 1 }}>
          {data.title}
        </Typography>
      ) : null}
      <Stepper activeStep={-1}>
        {data.steps.map((step) => {
          const hasDetail = Boolean(step.detail && (typeof step.detail === 'string' || step.detail.length));
          const expanded = hasDetail && openIds.has(step.id);
          const label = step.status === 'running' ? <Shimmer>{step.title}</Shimmer> : <Box component="span">{step.title}</Box>;
          return (
            <Step key={step.id} completed={step.status === 'done'} active={step.status === 'running'} expanded={expanded}>
              <StepLabel error={step.status === 'failed'}>
                <Box
                  component={hasDetail ? 'button' : 'span'}
                  type={hasDetail ? 'button' : undefined}
                  aria-expanded={hasDetail ? expanded : undefined}
                  onClick={hasDetail ? () => toggle(step.id) : undefined}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    width: '100%',
                    p: 0,
                    border: 0,
                    background: 'none',
                    font: 'inherit',
                    color: 'inherit',
                    textAlign: 'left',
                    cursor: hasDetail ? 'pointer' : 'default',
                  }}
                >
                  <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
                    {label}
                  </Box>
                  <StepStatusIcon step={step} />
                </Box>
              </StepLabel>
              {hasDetail ? (
                <StepContent>
                  <Box
                    sx={(t: AtomsTheme) => ({
                      p: 1.5,
                      borderRadius: 1,
                      border: '1px solid',
                      ...mode(t, { backgroundColor: surface.layers.card2, borderColor: border.layers.card2 }),
                    })}
                  >
                    {typeof step.detail === 'string' ? (
                      <Typography variant="body2">{step.detail}</Typography>
                    ) : (
                      <KeyValueList
                        items={(step.detail ?? []).map(([k, v]) => ({
                          key: k,
                          label: humanizeKey(k),
                          value: typeof v === 'string' ? v : formatJsonish(v),
                        }))}
                      />
                    )}
                  </Box>
                </StepContent>
              ) : null}
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
}
