// README: HITL cards
import { Button, TextField } from '@neofloai/atoms';
import { PencilSimpleIcon } from '@neofloai/atoms/icons';
import { BlockShell, defineBlock, useHitl } from '@neofloai/agentic-chat';
import { useState } from 'react';

interface AmountData {
  title: string;
  suggested: number;
}

function AmountCard({ data }: { data: AmountData }) {
  const hitl = useHitl();
  const [amount, setAmount] = useState(String(data.suggested));
  return (
    <BlockShell
      icon={<PencilSimpleIcon />}
      title={data.title}
      tone={hitl.isPending ? 'primary' : 'default'}
      footer={
        hitl.isResolved ? null : (
          <Button
            size="sm"
            loading={hitl.isSubmitting}
            disabled={!hitl.canSubmit}
            // Sent as { stream, message: { type: 'hitl', content: { checkpoint_id, decision } } }
            onClick={() => void hitl.submit({ amount: Number(amount) })}
          >
            Confirm
          </Button>
        )
      }
    >
      <TextField label="Amount" value={amount} disabled={!hitl.canSubmit} onChange={(e) => setAmount(e.target.value)} />
    </BlockShell>
  );
}

export const amountCard = defineBlock<AmountData>({
  type: 'amount_confirmation',
  parse: (b) => ({ title: String(b.title ?? 'Confirm the amount'), suggested: Number(b.suggested ?? 0) }),
  render: ({ data }) => <AmountCard data={data} />,
});
