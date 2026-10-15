import { Box, Card, Chip, CircularProgress, IconButton, LinearProgress, Stack, Tooltip, Typography } from '@neofloai/atoms';
import { FileIcon, FileTextIcon, PaperclipIcon, PaperPlaneTiltIcon, StopIcon, XIcon } from '@neofloai/atoms/icons';
import { border, elevation, fontWeights, icon as iconTokens, radius, surface, text } from '@neofloai/atoms/tokens';
import { forwardRef, useEffect, useId, useState, type FormHTMLAttributes, type ReactNode } from 'react';
import type { Attachment } from '../../core/protocol/types';
import { formatBytes } from '../../core/runtime/runtime';
import type { ComposerAttachment } from '../../core/store/types';
import { useChatEvent, useComposer, useLabels, useScope } from '../../react/hooks';
import { ComposerPicker } from './ComposerPicker';
import { Composer, useComposerContext } from '../../react/primitives';
import { mode, type AtomsTheme } from '../kit/tokens';

function typeLabel(name: string, contentType?: string): string {
  const ext = name.includes('.') ? name.split('.').pop()!.toUpperCase() : '';
  if (ext && ext.length <= 5) return ext;
  if (contentType?.includes('/')) return contentType.split('/')[1]!.toUpperCase();
  return 'File';
}

export interface FileCardProps {
  name: string;
  size?: number;
  contentType?: string;
  status?: ComposerAttachment['status'];
  progress?: number;
  error?: string;
  onRemove?: () => void;
  href?: string;
}

/** Figma FileCard: an attachment with its type and size. */
export function FileCard({ name, size, contentType, status = 'ready', progress, error, onRemove }: FileCardProps) {
  const labels = useLabels();
  const detail =
    status === 'uploading'
      ? labels.uploading
      : status === 'error'
        ? (error ?? labels.uploadFailed)
        : [typeLabel(name, contentType), size !== undefined ? formatBytes(size) : ''].filter(Boolean).join(' · ');
  return (
    <Card component="article" aria-label={name} sx={{ width: 268, maxWidth: '100%' }}>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', px: 1.5, py: 1.25 }}>
        <Box aria-hidden sx={(t: AtomsTheme) => ({ display: 'inline-flex', ...mode(t, { color: iconTokens.default.b2 }) })}>
          <FileIcon size={20} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body1" weight="medium" noWrap component="div">
            {name}
          </Typography>
          <Typography
            variant="body2"
            noWrap
            component="div"
            sx={(t: AtomsTheme) => mode(t, { color: status === 'error' ? text.error[3] : text.default.b3 })}
          >
            {detail}
          </Typography>
        </Box>
        {onRemove ? (
          <IconButton
            size="sm"
            variant="secondary"
            appearance="text"
            aria-label={labels.removeAttachment(name)}
            onClick={onRemove}
          >
            <XIcon />
          </IconButton>
        ) : null}
      </Stack>
      {status === 'uploading' ? (
        <LinearProgress variant={progress ? 'determinate' : 'indeterminate'} value={(progress ?? 0) * 100} />
      ) : null}
    </Card>
  );
}

/** A sent attachment, shown with the user's message. */
export function AttachmentCard({ attachment }: { attachment: Attachment }) {
  return <FileCard name={attachment.filename} size={attachment.size} contentType={attachment.content_type} />;
}

function AttachmentChip({ attachment, onRemove }: { attachment: ComposerAttachment; onRemove: () => void }) {
  const labels = useLabels();
  const icon = attachment.status === 'uploading' ? <CircularProgress size={12} /> : <FileTextIcon />;
  return (
    <Tooltip
      title={
        attachment.status === 'error'
          ? (attachment.error ?? labels.uploadFailed)
          : `${attachment.name} · ${formatBytes(attachment.size)}`
      }
    >
      <Chip
        dense
        appearance="outline"
        variant={attachment.status === 'error' ? 'error' : 'primary'}
        icon={icon}
        label={attachment.name}
        onDelete={onRemove}
        aria-label={attachment.name}
        sx={{ maxWidth: 240 }}
      />
    </Tooltip>
  );
}

/** Joins a workspace and a workflow into one picker id. A unit separator never appears in either. */
const SCOPE_SEP = '\u001f';

/**
 * Figma Composer-scope + SourcePicker: which workflows the question is about. A `ComposerPicker`
 * over the scope catalog; it hides itself when there is no catalog or the backend takes no
 * workflow context.
 */
export function ScopePicker() {
  const scope = useScope();
  const labels = useLabels();
  if (!scope.enabled) return null;
  const { selected, allSelected } = scope.summary;
  const summary =
    scope.status !== 'ready' || allSelected ? labels.scopeAll : selected === 0 ? labels.scopeNone : labels.scopeSome(selected);
  const value = Object.entries(scope.selection).flatMap(([groupId, ids]) => ids.map((id) => groupId + SCOPE_SEP + id));
  return (
    <ComposerPicker
      name={labels.scopeLabel}
      triggerLabel={summary}
      selectAllLabel={labels.scopeSelectAll}
      deselectAllLabel={labels.scopeDeselectAll}
      loading={scope.status === 'loading'}
      groups={scope.groups.map((g) => ({
        id: g.id,
        label: g.label,
        selectAll: true,
        items: g.items.map((item) => ({ id: g.id + SCOPE_SEP + item.id, label: item.label })),
      }))}
      value={value}
      onChange={(next) => {
        const selection: Record<string, string[]> = Object.fromEntries(scope.groups.map((g) => [g.id, []]));
        for (const key of next) {
          const [groupId, id] = key.split(SCOPE_SEP) as [string, string];
          (selection[groupId] ??= []).push(id);
        }
        scope.setSelection(selection);
      }}
    />
  );
}

/** Shown when the draft is longer than the backend's `max_message_chars`. */
function TooLongNotice() {
  const labels = useLabels();
  const { tooLong, maxChars } = useComposer();
  if (!tooLong || !maxChars) return null;
  return (
    <Typography role="alert" variant="body2" sx={(t: AtomsTheme) => mode(t, { color: text.error[3] })}>
      {labels.messageTooLong(maxChars)}
    </Typography>
  );
}

function RejectedNotice() {
  const [message, setMessage] = useState<string | null>(null);
  useChatEvent('warning', (w) => {
    if (w.code === 'attachment_rejected') setMessage(w.message);
  });
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(t);
  }, [message]);
  if (!message) return null;
  return (
    <Typography role="alert" variant="body2" sx={(t: AtomsTheme) => mode(t, { color: text.error[3] })}>
      {message}
    </Typography>
  );
}

type ControlsProps = Pick<ChatComposerProps, 'leadingActions' | 'extraActions' | 'scopePicker'>;

function ComposerControls({ leadingActions, extraActions, scopePicker }: ControlsProps) {
  const c = useComposerContext();
  const labels = useLabels();
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Composer.AttachmentInput asChild>
        <IconButton size="sm" variant="secondary" appearance="text" aria-label={labels.attach}>
          <PaperclipIcon />
        </IconButton>
      </Composer.AttachmentInput>
      {scopePicker === undefined ? <ScopePicker /> : scopePicker || null}
      {leadingActions}
      <Box sx={{ flex: 1 }} />
      {extraActions}
      {c.busy ? (
        <Composer.Cancel asChild>
          <IconButton size="sm" variant="secondary" aria-label={labels.stop}>
            <StopIcon weight="fill" />
          </IconButton>
        </Composer.Cancel>
      ) : (
        <Composer.Send asChild>
          <IconButton size="sm" aria-label={labels.send}>
            <PaperPlaneTiltIcon />
          </IconButton>
        </Composer.Send>
      )}
    </Stack>
  );
}

function ComposerAttachmentRow() {
  return (
    <Composer.Attachments>{(a, remove) => <AttachmentChip key={a.id} attachment={a} onRemove={remove} />}</Composer.Attachments>
  );
}

export interface ChatComposerProps {
  placeholder?: string;
  /**
   * Controls on the left, after the attach button and the workflow picker: a `ComposerPicker` for
   * tools or data sources, a mode switch…
   */
  leadingActions?: ReactNode;
  /** Controls on the right, before the send button: a model picker, a mic… */
  extraActions?: ReactNode;
  /**
   * The workflow picker's place. Omit it for the built-in `ScopePicker` (which hides itself when
   * there is no workflow catalog), pass your own node to replace it, or `false` to leave it out.
   */
  scopePicker?: ReactNode | false;
  /** Rendered under the composer (a disclaimer, a hint). */
  footer?: ReactNode;
  /** @default 8 */
  maxRows?: number;
  autoFocus?: boolean;
}

/** Figma Composer: the input, attachments, the workflow picker, your own controls, and send/stop. */
export function ChatComposer({
  placeholder,
  leadingActions,
  extraActions,
  scopePicker,
  footer,
  maxRows = 8,
  autoFocus,
}: ChatComposerProps) {
  const [dragging, setDragging] = useState(false);
  const hintId = useId();
  return (
    <Box>
      <Composer.Root asChild>
        <DropZone onDragChange={setDragging}>
          <Box
            sx={(t: AtomsTheme) => ({
              display: 'flex',
              flexDirection: 'column',
              gap: 1.25,
              px: 2,
              pt: 1.75,
              pb: 1.5,
              borderRadius: `${radius.lg}px`,
              border: '1px solid',
              transition: 'border-color 120ms ease, box-shadow 120ms ease',
              ...mode(t, {
                backgroundColor: surface.layers.card1,
                borderColor: dragging ? border.primary.focus : border.layers.card2,
              }),
              boxShadow: elevation.small,
              '&:focus-within': mode(t, { borderColor: border.primary.focus }),
              '& textarea': {
                width: '100%',
                border: 0,
                outline: 0,
                p: 0,
                m: 0,
                background: 'transparent',
                fontFamily: 'inherit',
                fontSize: t.typography.h6.fontSize,
                lineHeight: t.typography.h6.lineHeight,
                fontWeight: fontWeights.regular,
                ...mode(t, { color: text.default.heading }),
              },
              '& textarea::placeholder': { opacity: 1, ...mode(t, { color: text.default.b3 }) },
              '& textarea:disabled': { cursor: 'not-allowed' },
            })}
          >
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, '&:empty': { display: 'none' } }}>
              <ComposerAttachmentRow />
            </Stack>
            <Composer.Input placeholder={placeholder} maxRows={maxRows} autoFocus={autoFocus} aria-describedby={hintId} />
            <ComposerControls leadingActions={leadingActions} extraActions={extraActions} scopePicker={scopePicker} />
          </Box>
        </DropZone>
      </Composer.Root>
      <Box id={hintId} sx={{ mt: 0.75, display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
        <RejectedNotice />
        <TooLongNotice />
        {footer}
      </Box>
    </Box>
  );
}

/** The form element; accepts dropped files when attachments are enabled. */
interface DropZoneProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onDragOver' | 'onDragLeave' | 'onDrop'> {
  children: ReactNode;
  onDragChange: (dragging: boolean) => void;
}

const DropZone = forwardRef<HTMLFormElement, DropZoneProps>(function DropZone({ children, onDragChange, ...props }, ref) {
  const c = useComposerContext();
  return (
    <Box
      component="form"
      ref={ref}
      noValidate
      {...props}
      onDragOver={(e: React.DragEvent) => {
        if (!c.attachmentsEnabled || !e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
        onDragChange(true);
      }}
      onDragLeave={() => onDragChange(false)}
      onDrop={(e: React.DragEvent) => {
        onDragChange(false);
        if (!c.attachmentsEnabled || !e.dataTransfer.files.length) return;
        e.preventDefault();
        c.addFiles(e.dataTransfer.files);
      }}
    >
      {children}
    </Box>
  );
});
