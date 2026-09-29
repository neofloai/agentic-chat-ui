import { Box, Button, Checkbox, Chip, Radio, RadioGroup, Stack, Typography } from '@neofloai/atoms';
import { ListChecksIcon, WarningIcon } from '@neofloai/atoms/icons';
import { text } from '@neofloai/atoms/tokens';
import { useState } from 'react';
import type { HitlDecision } from '../../core/protocol/types';
import type { ApprovalData, ChoiceData } from '../../blocks/parsers';
import { formatJsonish, humanizeKey } from '../../blocks/format';
import type { BlockRenderProps } from '../../registry/types';
import { useHitl, useLabels } from '../../react/hooks';
import { BlockShell, type BlockTone } from '../kit/BlockShell';
import { KeyValueList } from '../kit/KeyValueList';
import { mode, type AtomsTheme } from '../kit/tokens';

const same = (a: unknown, b: unknown) => {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return a === b;
  }
};

function DecisionError() {
  const labels = useLabels();
  return (
    <Typography variant="body2" component="span" sx={(t: AtomsTheme) => mode(t, { color: text.error[3] })}>
      {labels.decisionFailed}
    </Typography>
  );
}

/** Approve / reject (Figma ApprovalBlock). Sends `approve_value` / `reject_value`. */
export function ApprovalBlock({ data }: BlockRenderProps<ApprovalData>) {
  const labels = useLabels();
  const hitl = useHitl();
  const [clicked, setClicked] = useState<'approve' | 'reject' | null>(null);

  const decide = async (which: 'approve' | 'reject') => {
    setClicked(which);
    try {
      await hitl.submit(which === 'approve' ? data.approveValue : data.rejectValue);
    } finally {
      setClicked(null);
    }
  };

  const resolvedAs = hitl.isResolved ? (same(hitl.decision, data.rejectValue) ? 'reject' : 'approve') : null;
  const live = hitl.isPending || hitl.isSubmitting;
  const tone: BlockTone = live
    ? data.tone === 'danger'
      ? 'danger'
      : data.tone === 'warning'
        ? 'warning'
        : 'primary'
    : 'default';

  let footer = null;
  if (resolvedAs) {
    footer = (
      <Chip
        size="sm"
        variant={resolvedAs === 'approve' ? 'success' : 'secondary'}
        label={resolvedAs === 'approve' ? labels.approved : labels.rejected}
      />
    );
  } else if (live) {
    footer = (
      <>
        <Button
          size="sm"
          variant="secondary"
          appearance="text"
          disabled={!hitl.canSubmit}
          loading={hitl.isSubmitting && clicked === 'reject'}
          onClick={() => void decide('reject')}
        >
          {data.rejectLabel ?? labels.reject}
        </Button>
        <Button
          size="sm"
          variant={data.tone === 'danger' ? 'error' : 'primary'}
          disabled={!hitl.canSubmit}
          loading={hitl.isSubmitting && clicked === 'approve'}
          onClick={() => void decide('approve')}
        >
          {data.approveLabel ?? labels.approve}
        </Button>
        {hitl.status === 'failed' ? <DecisionError /> : null}
      </>
    );
  }

  return (
    <BlockShell icon={<WarningIcon />} title={data.title} tone={tone} footer={footer} busy={hitl.isSubmitting}>
      {data.description || data.details.length ? (
        <Stack spacing={1.5}>
          {data.description ? (
            <Typography variant="body1" component="div" sx={(t: AtomsTheme) => mode(t, { color: text.default.b1 })}>
              {data.description}
            </Typography>
          ) : null}
          {data.details.length ? (
            <KeyValueList
              items={data.details.map(([k, v]) => ({
                key: k,
                label: humanizeKey(k),
                value: typeof v === 'string' ? v : formatJsonish(v),
              }))}
            />
          ) : null}
        </Stack>
      ) : null}
    </BlockShell>
  );
}

function initialSelection(decision: HitlDecision | undefined): string[] {
  if (Array.isArray(decision)) return decision.map(String);
  if (typeof decision === 'string') return [decision];
  return [];
}

/** Single- or multi-select question. Sends a string or a string array. */
export function ChoiceBlock({ data }: BlockRenderProps<ChoiceData>) {
  const labels = useLabels();
  const hitl = useHitl();
  const [selected, setSelected] = useState<string[]>(() => initialSelection(hitl.decision));
  const locked = !hitl.canSubmit;
  const tooFew = selected.length < data.min;
  const tooMany = data.max !== undefined && selected.length > data.max;
  const live = hitl.isPending || hitl.isSubmitting;

  const toggle = (value: string) =>
    setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  const footer = hitl.isResolved ? (
    <Chip size="sm" variant="success" label={labels.submitted} />
  ) : live ? (
    <>
      <Button
        size="sm"
        disabled={locked || tooFew || tooMany}
        loading={hitl.isSubmitting}
        onClick={() => void hitl.submit(data.multiple ? selected : (selected[0] ?? ''))}
      >
        {data.submitLabel ?? labels.submit}
      </Button>
      {tooMany && data.max !== undefined ? (
        <Typography variant="body2" component="span" sx={(t: AtomsTheme) => mode(t, { color: text.error[3] })}>
          {labels.selectAtMost(data.max)}
        </Typography>
      ) : data.multiple && data.min > 1 && tooFew ? (
        <Typography variant="body2" component="span" sx={(t: AtomsTheme) => mode(t, { color: text.default.b3 })}>
          {labels.selectAtLeast(data.min)}
        </Typography>
      ) : null}
      {hitl.status === 'failed' ? <DecisionError /> : null}
    </>
  ) : null;

  return (
    <BlockShell
      icon={<ListChecksIcon />}
      title={data.title}
      tone={live ? 'primary' : 'default'}
      footer={footer}
      busy={hitl.isSubmitting}
    >
      <Stack spacing={1}>
        {data.description ? (
          <Typography variant="body1" component="div" sx={(t: AtomsTheme) => mode(t, { color: text.default.b1 })}>
            {data.description}
          </Typography>
        ) : null}
        {data.multiple ? (
          <Box role="group" aria-label={data.title} sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            {data.options.map((o) => (
              <Checkbox
                key={o.value}
                label={o.label}
                checked={selected.includes(o.value)}
                disabled={locked}
                onChange={() => toggle(o.value)}
              />
            ))}
          </Box>
        ) : (
          <RadioGroup aria-label={data.title} value={selected[0] ?? ''} onChange={(_, value) => setSelected([value])}>
            {data.options.map((o) => (
              <Radio key={o.value} value={o.value} label={o.label} disabled={locked} />
            ))}
          </RadioGroup>
        )}
      </Stack>
    </BlockShell>
  );
}
