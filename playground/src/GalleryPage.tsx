import { Box, Card, Divider, Stack, Typography } from '@neofloai/atoms';
import { text } from '@neofloai/atoms/tokens';
import {
  Block,
  ChatComposer,
  ChatHistory,
  ChatProvider,
  ChatSuggestions,
  FileCard,
  RunStatus,
  Shimmer,
  ThreadProvider,
  UserTurn,
  WelcomeScreen,
  createChatRuntime,
  defaultBlocks,
  linkToolResults,
  mode,
  unknownBlock,
  useThread,
  type AtomsTheme,
  type ChatAdapter,
  type ChatBlock,
  type ChatMessage,
  type ContentBlock,
  type StreamEvent,
} from '@neofloai/agentic-chat';
import { chartBlock } from '@neofloai/agentic-chat/charts';
import { createMockAdapter } from '@neofloai/agentic-chat/mock';
import { useState, type ReactNode } from 'react';
import { SCOPE_GROUPS } from './ChatPage';

const blocks = [...defaultBlocks, chartBlock];
const NOW = Date.now();

/** Answers any HITL decision with a short confirmation, so gallery cards behave like live ones. */
function galleryAdapter(): ChatAdapter {
  const mock = createMockAdapter({
    latency: 150,
    seed: [
      conv('c1', 'Acme Q3 invoice review', 0),
      conv('c2', 'Held invoices this week', 0.2),
      conv('c3', 'Vendor payment trends', 1.1),
      conv('c4', 'August reconciliation', 4),
      conv('c5', 'NetSuite posting failures', 12),
    ],
  });
  return {
    ...mock,
    async *sendMessage(_id, body) {
      const content = body.message.content as { checkpoint_id?: string };
      const cp = content.checkpoint_id ?? '';
      const messageId = cp.replace('cp-', 'msg-');
      const events: StreamEvent[] = [
        { type: 'message_start', message_id: messageId, conversation_id: 'gallery', run_id: 'r' },
        { type: 'content_block_start', index: 0, block: { id: `${cp}-ack`, type: 'text', category: 'content', text: '' } },
        {
          type: 'content_block_stop',
          index: 0,
          block: { id: `${cp}-ack`, type: 'text', category: 'content', text: 'Got it, thanks.' },
        },
        { type: 'message_stop', message_id: messageId, stop_reason: 'end_turn' },
      ];
      for (const e of events) {
        await new Promise((r) => setTimeout(r, 400));
        yield e;
      }
    },
  };
}

function conv(id: string, title: string, daysAgo: number) {
  const at = new Date(NOW - daysAgo * 86_400_000).toISOString();
  return {
    conversation_id: id,
    title,
    created_at: at,
    updated_at: at,
    archived: false,
    messages: [
      {
        message_id: `${id}-m`,
        conversation_id: id,
        role: 'user' as const,
        content: [{ id: `${id}-b`, type: 'text', category: 'content', text: title }],
        created_at: at,
      },
    ],
  };
}

const b = (
  id: string,
  data: { type: string; category: string; [key: string]: unknown },
  extra: Partial<ChatBlock> = {},
): ChatBlock => ({
  id,
  type: data.type,
  category: data.category,
  status: 'complete',
  data: { id, ...data } as ContentBlock,
  ...extra,
});

const msg = (id: string, blocksIn: ChatBlock[], status: ChatMessage['status'] = 'complete'): ChatMessage => ({
  id,
  role: 'assistant',
  blocks: blocksIn,
  status,
  createdAt: new Date(NOW).toISOString(),
});

const approval = {
  type: 'approval',
  category: 'hitl',
  title: 'Post 4 invoices to NetSuite?',
  description: 'They total 10,061.74 across three vendors. Posting cannot be undone from here.',
  approve_label: 'Post all four',
  reject_label: 'Not now',
};
const choice = {
  type: 'choice',
  category: 'hitl',
  title: 'Which workflows should I review?',
  multiple: true,
  options: [
    { value: 'ip', label: 'Invoice Processing' },
    { value: 'col', label: 'Collections' },
    { value: 'sa', label: 'Spend Analytics' },
  ],
};
const heldTable = {
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
const scan = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="336"><rect width="600" height="336" fill="#e9ebfa"/><rect x="170" y="40" width="260" height="256" rx="6" fill="#fdfdfc" stroke="#cccac6"/><rect x="195" y="70" width="120" height="12" rx="3" fill="#aeb3f3"/></svg>')}`;

interface Sample {
  id: string;
  title: string;
  note?: string;
  message: ChatMessage;
  pending?: boolean;
}

const SAMPLES: Sample[] = [
  {
    id: 'text',
    title: 'Text',
    note: 'Markdown on the Atoms type scale',
    message: msg('m-text', [
      b('text', {
        type: 'text',
        category: 'content',
        text: 'Four are waiting on you, all in **Invoice Processing**. Three are held on a price difference against the order, and one is missing a receipt.\n\n- Redwood Components\n- Cascade Supply\n\n`search_invoices` returned 4 rows.',
      }),
    ]),
  },
  {
    id: 'thinking-live',
    title: 'ThinkingBlock',
    note: 'streaming',
    message: msg(
      'm-think-live',
      [
        b(
          'think-live',
          { type: 'thinking', category: 'reasoning', text: 'The price difference is against the order, not the receipt…' },
          { status: 'streaming' },
        ),
      ],
      'streaming',
    ),
  },
  {
    id: 'thinking',
    title: 'ThinkingBlock',
    note: 'collapsed head',
    message: msg('m-think', [
      b('think', {
        type: 'thinking',
        category: 'reasoning',
        text: 'The price difference is against the order, not the receipt, so this is a purchasing question rather than a goods-received one.',
        duration_ms: 4000,
      }),
    ]),
  },
  {
    id: 'tool-running',
    title: 'ToolBlock',
    note: 'running',
    message: msg(
      'm-tool-r',
      [
        b(
          'tool-r',
          {
            type: 'tool_call',
            category: 'tool',
            name: 'search_invoices',
            input: { workspace: 'Finance', status: 'held', window: '30d' },
            status: 'running',
          },
          { status: 'streaming' },
        ),
      ],
      'streaming',
    ),
  },
  {
    id: 'tool',
    title: 'ToolBlock',
    note: 'call and result',
    message: msg('m-tool', [
      b('tool', {
        type: 'tool_call',
        category: 'tool',
        name: 'search_invoices',
        input: { workspace: 'Finance', status: 'held', window: '30d' },
        status: 'success',
        result_summary: '4 rows',
        duration_ms: 800,
      }),
    ]),
  },
  {
    id: 'tool-error',
    title: 'ToolBlock',
    note: 'failed',
    message: msg('m-tool-e', [
      b('tool-e', {
        type: 'tool_call',
        category: 'tool',
        name: 'post_invoices',
        input: { erp: 'NetSuite' },
        status: 'error',
        error: 'Timed out after 30 s',
        duration_ms: 30000,
      }),
    ]),
  },
  {
    id: 'tool-use-result',
    title: 'ToolBlock',
    note: 'tool_use and its tool_result, one card',
    message: linkToolResults(
      msg('m-tool-ur', [
        b('toolu_01', { type: 'tool_use', category: 'tool', tool: 'search_v2', input: { query: 'Acme open invoices Q3' } }),
        b('tr_01', {
          type: 'tool_result',
          category: 'tool',
          tool_use_id: 'toolu_01',
          is_error: false,
          error_code: null,
          result_count: 2,
          results: [
            { title: 'INV-1042', snippet: 'Acme Corp · 12,400 · open', url: null },
            { title: 'INV-1051', snippet: 'Acme Corp · 9,850 · open', url: null },
          ],
          http_trace: null,
        }),
      ]),
      { ended: true },
    ),
  },
  {
    id: 'tool-interrupted',
    title: 'ToolBlock',
    note: 'the reply ended without a tool_result',
    message: linkToolResults(
      msg('m-tool-i', [
        b('toolu_02', { type: 'tool_use', category: 'tool', tool: 'erp_lookup', input: { vendor: 'Cascade Supply' } }),
      ]),
      { ended: true },
    ),
  },
  { id: 'table', title: 'TableBlock', note: 'result set, sortable', message: msg('m-table', [b('table', heldTable)]) },
  {
    id: 'sources',
    title: 'SourcesBlock',
    note: 'what it read',
    message: msg('m-src', [
      b('src', {
        type: 'sources',
        category: 'citation',
        items: [
          { id: '1', label: 'Invoice Processing · 30 days' },
          { id: '2', label: 'Purchase orders · Redwood Components' },
          { id: '3', label: 'Goods received · Lian Huat Supplies' },
        ],
      }),
    ]),
  },
  {
    id: 'sources-select',
    title: 'SourcesBlock',
    note: 'selectable',
    message: msg('m-src2', [
      b('src2', {
        type: 'sources',
        category: 'citation',
        title: '3 sources',
        items: [
          { id: '1', label: 'Invoice Processing · 30 days', selected: true },
          { id: '2', label: 'Purchase orders · Redwood Components', selected: true },
          { id: '3', label: 'Goods received · Lian Huat Supplies', selected: false },
        ],
      }),
    ]),
  },
  {
    id: 'approval',
    title: 'ApprovalBlock',
    note: 'needs a decision (try it)',
    pending: true,
    message: msg('msg-approval', [b('appr', approval, { checkpoint: { id: 'cp-approval', status: 'pending' } })], 'paused'),
  },
  {
    id: 'approval-done',
    title: 'ApprovalBlock',
    note: 'resolved',
    message: msg('m-appr-done', [
      b('appr-done', approval, { checkpoint: { id: 'cp-approval-done', status: 'resolved', decision: 'approve' } }),
    ]),
  },
  {
    id: 'choice',
    title: 'ChoiceBlock',
    note: 'multi-select decision (try it)',
    pending: true,
    message: msg('msg-choice', [b('choice', choice, { checkpoint: { id: 'cp-choice', status: 'pending' } })], 'paused'),
  },
  {
    id: 'choice-done',
    title: 'ChoiceBlock',
    note: 'resolved',
    message: msg('m-choice-done', [
      b('choice-done', choice, { checkpoint: { id: 'cp-choice-done', status: 'resolved', decision: ['ip', 'col'] } }),
    ]),
  },
  {
    id: 'error',
    title: 'ErrorBlock',
    note: 'failure',
    message: msg('m-err', [
      b('err', {
        type: 'error',
        category: 'error',
        title: 'NetSuite did not answer',
        message: 'The connection timed out after 30 seconds. Nothing was posted.',
      }),
    ]),
  },
  {
    id: 'artifact',
    title: 'ArtifactBlock',
    note: 'generated document',
    message: msg('m-art', [
      b('art', {
        type: 'artifact',
        category: 'ui',
        filename: 'reconciliation-august.md',
        format: 'markdown',
        content:
          '# August reconciliation\n\n4 held, 2 resolved, 1 escalated\n\nTotal exposure 10,061.74\n\n## Next steps\n\n1. Confirm the price differences.\n2. Chase the missing receipt.',
      }),
    ]),
  },
  {
    id: 'image',
    title: 'ImageBlock',
    note: 'returned image',
    message: msg('m-img', [b('img', { type: 'image', category: 'ui', url: scan, caption: 'Scan of Statement-Aug.pdf, page 1' })]),
  },
  {
    id: 'plan',
    title: 'Plan',
    note: 'stepper, one step open',
    message: msg('m-plan', [
      b('plan', {
        type: 'plan',
        category: 'plan',
        steps: [
          { id: 'a', title: 'Read the last thirty days', status: 'done' },
          {
            id: 'b',
            title: 'Match each against its order',
            status: 'failed',
            detail: { compared: '128 invoices', matched: '124', held: '4' },
          },
          { id: 'c', title: 'Checking receipts', status: 'running' },
        ],
      }),
    ]),
  },
  {
    id: 'bar',
    title: 'BarChart',
    note: 'grouped, with grid',
    message: msg('m-bar', [
      b('bar', {
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
      }),
    ]),
  },
  {
    id: 'line',
    title: 'LineChart',
    note: 'area fill, emphasised endpoint',
    message: msg('m-line', [
      b('line', {
        type: 'chart',
        category: 'ui',
        chart_type: 'area',
        title: 'Days to pay',
        subtitle: 'Rolling average',
        x_key: 'month',
        series: [{ key: 'days', label: 'Days' }],
        data: [
          { month: 'Mar', days: 31 },
          { month: 'Apr', days: 36 },
          { month: 'May', days: 34 },
          { month: 'Jun', days: 41 },
          { month: 'Jul', days: 39 },
          { month: 'Aug', days: 46 },
          { month: 'Sep', days: 44 },
        ],
      }),
    ]),
  },
  {
    id: 'donut',
    title: 'DonutChart',
    note: 'share of total',
    message: msg('m-donut', [
      b('donut', {
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
      }),
    ]),
  },
  {
    id: 'unknown',
    title: 'Unknown block',
    note: 'development only',
    message: msg('m-unk', [b('unk', { type: 'invoice_card', category: 'ui', number: 'INV-1042' })]),
  },
  {
    id: 'product-block',
    title: 'Product block',
    note: 'askneo.invoice_card in an app without its renderer: fallback_text',
    message: msg('m-prod', [
      b('prod', {
        type: 'askneo.invoice_card',
        category: 'ui',
        fallback_text: '**INV-1042** · Redwood Components · 3,940.24 · held on a price difference',
        data: { number: 'INV-1042', amount: 3940.24 },
      }),
    ]),
  },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box component="section" sx={{ mb: 6 }}>
      <Typography variant="h5" component="h2" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 3 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 4 }}>{children}</Box>
    </Box>
  );
}

function Spec({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" component="div" sx={{ mb: 1 }}>
        <Box component="span" sx={{ fontWeight: 500 }}>
          {title}
        </Box>{' '}
        <Box component="span" sx={(t: AtomsTheme) => mode(t, { color: text.default.b3 })}>
          {note}
        </Box>
      </Typography>
      {children}
    </Box>
  );
}

function useGalleryRuntime() {
  const [runtime] = useState(() => {
    const rt = createChatRuntime({
      adapter: galleryAdapter(),
      persistence: false,
      maxThreads: 100,
      scope: { groups: SCOPE_GROUPS },
      attachments: { upload: async (f) => ({ url: '#', filename: f.name, content_type: f.type, size: f.size, meta: {} }) },
    });
    for (const s of SAMPLES) {
      const thread = rt.getThread(`gallery-${s.id}`);
      const block = s.message.blocks[0]!;
      thread.store.setState((st) => ({
        ...st,
        loadStatus: 'ready',
        messages: [s.message],
        run: s.pending
          ? { status: 'paused', messageId: s.message.id }
          : { status: s.message.status === 'streaming' ? 'streaming' : 'idle', messageId: s.message.id },
        pendingCheckpoint:
          s.pending && block.checkpoint
            ? { checkpointId: block.checkpoint.id, messageId: s.message.id, blockId: block.id }
            : undefined,
      }));
    }
    // A composer with text and two attachments.
    const composer = rt.getThread('gallery-composer-files');
    composer.store.setState((st) => ({ ...st, loadStatus: 'ready' }));
    composer.composer.setState({
      text: 'Which invoices are still waiting on me?',
      attachments: [
        { id: 'a1', name: 'Statement-Aug.pdf', size: 253_952, contentType: 'application/pdf', status: 'ready', progress: 1 },
        {
          id: 'a2',
          name: 'ledger.xlsx',
          size: 40_960,
          contentType: 'application/vnd.ms-excel',
          status: 'uploading',
          progress: 0.4,
        },
      ],
    });
    const status = rt.getThread('gallery-status');
    status.store.setState((st) => ({
      ...st,
      loadStatus: 'ready',
      run: { status: 'streaming', statusLabel: 'Reading Invoice Processing' },
    }));
    const welcome = rt.getThread('gallery-welcome');
    welcome.store.setState((st) => ({
      ...st,
      loadStatus: 'ready',
      meta: {
        ...st.meta,
        greeting: 'Hey! What can I help you dig into today?',
        suggestedPrompts: [
          { label: 'How many posted yesterday?', prompt: 'How many posted yesterday?' },
          { label: 'What is waiting on me?', prompt: 'What is waiting on me?' },
          { label: 'Which vendor is slowest?', prompt: 'Which vendor is slowest?' },
        ],
      },
    }));
    const turn = rt.getThread('gallery-turn');
    turn.store.setState((st) => ({
      ...st,
      loadStatus: 'ready',
      messages: [
        {
          id: 'u1',
          role: 'user',
          status: 'complete',
          createdAt: new Date(NOW).toISOString(),
          blocks: [b('u1b', { type: 'text', category: 'content', text: 'Which invoices are still waiting on me?' })],
        },
      ],
    }));
    void rt.refreshConversations();
    return rt;
  });
  return runtime;
}

export function GalleryPage() {
  const runtime = useGalleryRuntime();
  return (
    <ChatProvider runtime={runtime} blocks={blocks} fallbackBlock={unknownBlock} autoStart={false}>
      <Box sx={{ height: '100%', overflowY: 'auto' }}>
        <Box sx={{ maxWidth: 1328, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
          <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
            Component gallery
          </Typography>
          <Typography variant="body1" sx={(t: AtomsTheme) => ({ mb: 5, maxWidth: 720, ...mode(t, { color: text.default.b2 }) })}>
            Every shell component and block state in @neofloai/agentic-chat, rendered from fixtures. Built on Atoms; the Figma
            Revamp-UI chat sheets were the reference.
          </Typography>

          <Section title="Chat · shell">
            <Spec title="Composer" note="rest">
              <ThreadProvider conversationId="gallery-composer-rest">
                <ChatComposer />
              </ThreadProvider>
            </Spec>
            <Spec title="Composer" note="typed, two attachments">
              <ThreadProvider conversationId="gallery-composer-files">
                <ChatComposer />
              </ThreadProvider>
            </Spec>
            <Spec title="FileCard" note="attachment, expanded">
              <Stack spacing={1.5}>
                <FileCard name="Statement-Aug.pdf" size={253_952} contentType="application/pdf" onRemove={() => undefined} />
                <FileCard name="ledger.xlsx" size={40_960} status="uploading" progress={0.4} />
              </Stack>
            </Spec>
            <Spec title="Turn" note="question">
              <ThreadProvider conversationId="gallery-turn">
                <UserTurnPreview />
              </ThreadProvider>
            </Spec>
            <Spec title="Shimmer" note="text still arriving">
              <Shimmer bar>Checking the last thirty days against your orders</Shimmer>
            </Spec>
            <Spec title="RunStatus" note="live">
              <ThreadProvider conversationId="gallery-status">
                <RunStatus />
              </ThreadProvider>
            </Spec>
            <Spec title="ChatSuggestions" note="opening prompts">
              <ThreadProvider conversationId="gallery-welcome">
                <ChatSuggestions />
              </ThreadProvider>
            </Spec>
            <Spec title="WelcomeScreen" note="empty chat">
              <ThreadProvider conversationId="gallery-welcome">
                <Card>
                  <WelcomeScreen />
                </Card>
              </ThreadProvider>
            </Spec>
          </Section>

          <Section title="Chat · blocks">
            {SAMPLES.map((s) => (
              <Spec key={s.id} title={s.title} note={s.note}>
                <ThreadProvider conversationId={`gallery-${s.id}`}>
                  <SampleBlocks id={s.id} />
                </ThreadProvider>
              </Spec>
            ))}
          </Section>

          <Section title="Chat · history">
            <Spec title="ChatHistory" note="search, groups, rename/archive/delete">
              <Card sx={{ height: 520 }}>
                <ChatHistory />
              </Card>
            </Spec>
          </Section>
        </Box>
      </Box>
    </ChatProvider>
  );
}

function SampleBlocks({ id }: { id: string }) {
  const messages = useThread((s) => s.messages);
  const sample = SAMPLES.find((s) => s.id === id)!;
  const message = messages[0] ?? sample.message;
  return (
    <Stack spacing={1.5}>
      {message.blocks.map((blk, i) => (
        <Block
          key={blk.id}
          block={blk}
          message={message}
          isLast={message.status === 'streaming' && i === message.blocks.length - 1}
        />
      ))}
    </Stack>
  );
}

function UserTurnPreview() {
  const messages = useThread((s) => s.messages);
  return <>{messages[0] ? <UserTurn message={messages[0]} /> : null}</>;
}
