import type { SuggestedPrompt } from '../core/protocol/types';
import type { MockWriter } from './writer';

export interface MockScenario {
  name: string;
  match: (prompt: string) => boolean;
  run: (writer: MockWriter, prompt: string) => Promise<void>;
}

const has =
  (...words: string[]) =>
  (prompt: string) => {
    const p = prompt.toLowerCase();
    return words.some((w) => p.includes(w));
  };

const heldInvoices = {
  type: 'table',
  category: 'ui',
  title: 'Held invoices',
  columns: [
    { key: 'vendor', label: 'Vendor' },
    { key: 'reason', label: 'Reason' },
    { key: 'amount', label: 'Amount', format: 'currency' },
  ],
  rows: [
    { vendor: 'Redwood Components', reason: 'Price vs order', amount: 3940.24 },
    { vendor: 'Cascade Supply', reason: 'Price vs order', amount: 1208 },
    { vendor: 'Lian Huat Supplies', reason: 'No receipt', amount: 812.5 },
    { vendor: 'Orchard Retail', reason: 'Price vs order', amount: 4101 },
  ],
};

const sources = {
  type: 'sources',
  category: 'citation',
  items: [
    { id: 's1', label: 'Invoice Processing · 30 days', kind: 'workflow' },
    { id: 's2', label: 'Purchase orders · Redwood Components', kind: 'record' },
    { id: 's3', label: 'Goods received · Lian Huat Supplies', kind: 'record' },
  ],
};

const scanSvg = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="336" viewBox="0 0 600 336"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#e9ebfa"/><stop offset="1" stop-color="#f7e4ec"/></linearGradient></defs><rect width="600" height="336" fill="url(#g)"/><rect x="170" y="40" width="260" height="256" rx="6" fill="#fdfdfc" stroke="#cccac6"/><rect x="195" y="70" width="120" height="12" rx="3" fill="#aeb3f3"/><rect x="195" y="100" width="210" height="8" rx="3" fill="#e5e4e1"/><rect x="195" y="118" width="190" height="8" rx="3" fill="#e5e4e1"/><rect x="195" y="136" width="200" height="8" rx="3" fill="#e5e4e1"/><rect x="195" y="170" width="210" height="60" rx="4" fill="#f5f5f3"/><rect x="330" y="250" width="75" height="14" rx="3" fill="#868fee"/></svg>`,
);

export const DEFAULT_SUGGESTIONS: SuggestedPrompt[] = [
  { label: 'What is waiting on me?', prompt: 'Which invoices are still waiting on me?' },
  { label: 'Post the held invoices', prompt: 'Post the four held invoices to NetSuite' },
  { label: 'Which vendor is slowest?', prompt: 'Which vendor is slowest to pay? Show me charts.' },
  { label: 'Reconcile August', prompt: 'Make a plan and reconcile August' },
  { label: 'Pick workflows', prompt: 'Help me choose which workflows to review' },
  { label: 'Show the scan', prompt: 'Show me the scan of Statement-Aug.pdf' },
];

export const DEFAULT_SCENARIOS: MockScenario[] = [
  {
    name: 'approval',
    match: has('post', 'approve', 'netsuite'),
    async run(w) {
      await w.status('Preparing the posting');
      await w.text('I found four invoices that are ready to post. They total **10,061.74** across three vendors.');
      await w.pause({
        block: {
          type: 'approval',
          category: 'hitl',
          title: 'Post 4 invoices to NetSuite?',
          description: 'They total 10,061.74 across three vendors. Posting cannot be undone from here.',
          approve_label: 'Post all four',
          reject_label: 'Not now',
        },
        requires: { kind: 'approve_reject', options: ['approve', 'reject'] },
        onResume: async (next, decision) => {
          if (decision === 'reject') {
            await next.text("Okay, I won't post them. They stay held until you're ready.");
            return;
          }
          await next.status('Posting to NetSuite');
          await next.block(
            {
              type: 'tool_call',
              category: 'tool',
              name: 'post_invoices',
              input: { erp: 'NetSuite', count: 4 },
              status: 'success',
              result_summary: '4 posted',
              duration_ms: 1400,
            },
            { startWith: { status: 'running', result_summary: undefined } },
          );
          await next.text('Posted all four. NetSuite returned document numbers **VB-2231** through **VB-2234**.');
        },
      });
    },
  },
  {
    name: 'charts',
    match: has('slow', 'chart', 'vendor', 'trend'),
    async run(w) {
      await w.status('Crunching payment history');
      await w.block({
        type: 'chart',
        category: 'ui',
        chart_type: 'bar',
        title: 'Invoices posted',
        subtitle: 'Last five weeks',
        x_key: 'week',
        series: [
          { key: 'posted', label: 'Posted' },
          { key: 'held', label: 'Held' },
        ],
        data: [
          { week: 'W1', posted: 22, held: 12 },
          { week: 'W2', posted: 27, held: 15 },
          { week: 'W3', posted: 18, held: 9 },
          { week: 'W4', posted: 31, held: 19 },
          { week: 'W5', posted: 25, held: 14 },
        ],
      });
      await w.block({
        type: 'chart',
        category: 'ui',
        chart_type: 'area',
        title: 'Days to pay',
        subtitle: 'Rolling average',
        x_key: 'month',
        series: [{ key: 'days', label: 'Days to pay' }],
        data: [
          { month: 'Mar', days: 31 },
          { month: 'Apr', days: 36 },
          { month: 'May', days: 34 },
          { month: 'Jun', days: 41 },
          { month: 'Jul', days: 39 },
          { month: 'Aug', days: 46 },
          { month: 'Sep', days: 44 },
        ],
      });
      await w.block({
        type: 'chart',
        category: 'ui',
        chart_type: 'donut',
        title: 'Where invoices sit',
        subtitle: '128 this month',
        x_key: 'stage',
        series: [{ key: 'count', label: 'Invoices' }],
        total: { value: '128', label: 'invoices' },
        data: [
          { stage: 'Posted', count: 82 },
          { stage: 'In review', count: 26 },
          { stage: 'Held', count: 4 },
        ],
      });
      await w.text(
        '**Orchard Retail** is the slowest: 46 days on average, up from 31 in March. The trend has climbed for four of the last six months.',
      );
    },
  },
  {
    name: 'plan',
    match: has('plan', 'reconcile', 'reconciliation'),
    async run(w) {
      const steps = (s1: string, s2: string, s3: string) => [
        { id: 'read', title: 'Read the last thirty days', status: s1 },
        {
          id: 'match',
          title: 'Match each against its order',
          status: s2,
          detail: s2 === 'pending' ? undefined : { compared: '128 invoices', matched: '124', held: '4' },
        },
        { id: 'receipts', title: 'Checking receipts', status: s3 },
      ];
      await w.block(
        { type: 'plan', category: 'plan', title: 'Reconciling August', steps: steps('done', 'done', 'done') },
        {
          startWith: { steps: steps('running', 'pending', 'pending') },
          snapshots: [steps('done', 'running', 'pending'), steps('done', 'done', 'running')],
          interval: 700,
        },
      );
      await w.block({
        type: 'artifact',
        category: 'ui',
        filename: 'reconciliation-august.md',
        format: 'markdown',
        content:
          '# August reconciliation\n\n4 held, 2 resolved, 1 escalated\n\nTotal exposure 10,061.74\n\n## Held\n\n| Vendor | Reason | Amount |\n|---|---|---:|\n| Redwood Components | Price vs order | 3,940.24 |\n| Cascade Supply | Price vs order | 1,208.00 |\n| Lian Huat Supplies | No receipt | 812.50 |\n| Orchard Retail | Price vs order | 4,101.00 |\n\n## Next steps\n\n1. Ask purchasing to confirm the three price differences.\n2. Chase the missing receipt from Lian Huat.',
      });
      await w.text('August is reconciled. Four invoices are still held; the report above has the detail.');
    },
  },
  {
    name: 'choice',
    match: has('choose', 'pick', 'which workflows'),
    async run(w) {
      await w.pause({
        block: {
          type: 'choice',
          category: 'hitl',
          title: 'Which workflows should I review?',
          description: 'Pick one or more.',
          multiple: true,
          options: [
            { value: 'ip', label: 'Invoice Processing' },
            { value: 'col', label: 'Collections' },
            { value: 'sa', label: 'Spend Analytics' },
          ],
        },
        requires: { kind: 'multi_select', min: 1 },
        onResume: async (next, decision) => {
          const picked = Array.isArray(decision) ? decision : [String(decision)];
          await next.text(
            `Reviewing **${picked.length}** workflow${picked.length === 1 ? '' : 's'}: ${picked.join(', ')}. Nothing needs your attention in the last seven days.`,
          );
        },
      });
    },
  },
  {
    name: 'image',
    match: has('scan', 'image', 'picture'),
    async run(w) {
      await w.status('Opening Statement-Aug.pdf');
      await w.block({
        type: 'image',
        category: 'ui',
        url: `data:image/svg+xml;charset=utf-8,${scanSvg}`,
        alt: 'Scan of Statement-Aug.pdf, page 1',
        caption: 'Scan of Statement-Aug.pdf, page 1',
      });
      await w.text('Here is page 1. The total on the statement matches the ledger.');
    },
  },
  {
    name: 'invoice processing',
    // The mock adapter answers this with 422 `connection_expired` until the source is connected.
    match: has('reconnect', 'invoice processing'),
    async run(w) {
      await w.status('Searching invoice processing');
      await w.tool(
        'invoice_processing',
        { query: 'held invoices', window: '30d' },
        {
          result_count: 2,
          results: [
            { title: 'INV-1042', snippet: 'Redwood Components · 3,940.24 · held: price vs order', url: null },
            { title: 'INV-1051', snippet: 'Orchard Retail · 4,101.00 · held: price vs order', url: null },
          ],
        },
        { durationMs: 900 },
      );
      await w.text('Invoice processing is connected again. Two invoices are held on a price difference against the order.');
    },
  },
  {
    name: 'interrupted tool',
    match: has('interrupt'),
    async run(w) {
      await w.status('Asking the ERP');
      // The reply ends without a tool_result, so the card shows "Interrupted" instead of spinning.
      await w.tool('erp_lookup', { vendor: 'Cascade Supply' }, null, { durationMs: 400 });
      await w.text('The ERP lookup did not come back, so I answered from the last sync instead.');
    },
  },
  {
    name: 'error',
    match: has('fail', 'error', 'break'),
    async run(w) {
      await w.status('Posting to NetSuite');
      await w.tool(
        'post_invoices',
        { erp: 'NetSuite' },
        { is_error: true, error_code: 'Timed out after 30 s', result_count: 0, results: [] },
        { durationMs: 600 },
      );
      await w.block({
        type: 'error',
        category: 'error',
        title: 'NetSuite did not answer',
        message: 'The connection timed out after 30 seconds. Nothing was posted.',
        retryable: true,
      });
    },
  },
  {
    name: 'markdown',
    match: has('markdown', 'format', 'code'),
    async run(w) {
      await w.text(
        '## Formatting check\n\nThe answer column renders **bold**, _italic_, `inline code` and [links](https://neoflo.ai).\n\n- Lists\n- With several items\n  - and nesting\n\n```ts\nconst total = invoices.reduce((sum, i) => sum + i.amount, 0);\n```\n\n| Vendor | Days |\n|---|---:|\n| Orchard Retail | 46 |\n| Redwood Components | 38 |\n\n> Quotes read as quotes.',
      );
    },
  },
  {
    name: 'default',
    match: () => true,
    async run(w, prompt) {
      await w.status('Reading Invoice Processing');
      await w.thinking(
        'The price difference is against the order, not the receipt, so this is a purchasing question rather than a goods-received one.',
        { durationMs: 4000 },
      );
      await w.tool(
        'search_invoices',
        { workspace: 'Finance', status: 'held', window: '30d' },
        {
          result_count: 4,
          results: heldInvoices.rows.map((r) => ({ title: r.vendor, snippet: `${r.reason} · ${r.amount.toLocaleString()}` })),
        },
        { durationMs: 800 },
      );
      await w.block(heldInvoices);
      await w.text(
        prompt.toLowerCase().includes('yesterday')
          ? 'Yesterday **31** invoices were posted, and **4** are still held. Three are held on a price difference against the order, and one is missing a receipt.'
          : 'Four are waiting on you, all in Invoice Processing. Three are held on a price difference against the order, and one is missing a receipt.',
      );
      await w.block(sources);
    },
  },
];
