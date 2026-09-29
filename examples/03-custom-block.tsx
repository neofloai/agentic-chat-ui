// README: Custom blocks
import { Button } from '@neofloai/atoms';
import { ReceiptIcon } from '@neofloai/atoms/icons';
import { AgenticChat, BlockShell, KeyValueList, defineBlock, type ChatAdapter } from '@neofloai/agentic-chat';

interface InvoiceCardData {
  id: string;
  vendor: string;
  total: string;
  status: string;
}

// Matches blocks whose `type` is "invoice_card". `parse` validates the payload; if it throws,
// the block falls back to the unknown-block renderer instead of crashing the thread.
export const invoiceCard = defineBlock<InvoiceCardData>({
  type: 'invoice_card',
  parse: (block) => ({
    id: String(block.invoice_id),
    vendor: String(block.vendor),
    total: String(block.total),
    status: String(block.status ?? 'open'),
  }),
  render: ({ data, actions }) => (
    <BlockShell
      icon={<ReceiptIcon />}
      title={`Invoice ${data.id}`}
      meta={data.status}
      footer={
        <Button size="sm" onClick={() => actions.emit('open_invoice', { id: data.id })}>
          Open invoice
        </Button>
      }
    >
      <KeyValueList
        items={[
          { key: 'vendor', value: data.vendor },
          { key: 'total', value: data.total },
        ]}
      />
    </BlockShell>
  ),
  toText: (data) => `Invoice ${data.id}: ${data.vendor}, ${data.total}`,
});

export function Chat({ adapter }: { adapter: ChatAdapter }) {
  // Define blocks at module scope, not inside render.
  return <AgenticChat adapter={adapter} blocks={[invoiceCard]} />;
}
