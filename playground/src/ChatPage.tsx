import { Typography } from '@neofloai/atoms';
import { AgenticChat, createRestAdapter, type Attachment, type ChatAdapter, type ScopeGroup } from '@neofloai/agentic-chat';
import { chartBlock } from '@neofloai/agentic-chat/charts';
import { createMockAdapter, type MockAdapter } from '@neofloai/agentic-chat/mock';
import { useMemo } from 'react';

export const SCOPE_GROUPS: ScopeGroup[] = [
  {
    id: 'ws_finance',
    label: 'Finance',
    items: [
      { id: 'ip', label: 'Invoice Processing' },
      { id: 'col', label: 'Collections' },
    ],
  },
  {
    id: 'ws_ap',
    label: 'Accounts Payable',
    items: [
      { id: 'ip', label: 'Invoice Processing' },
      { id: 'sa', label: 'Spend Analytics' },
    ],
  },
];

/** Pretends to upload: reports progress for a second, then returns a local object URL. */
async function demoUpload(
  file: File,
  { signal, onProgress }: { signal: AbortSignal; onProgress: (p: number) => void },
): Promise<Attachment> {
  for (let i = 1; i <= 10; i++) {
    await new Promise((r) => setTimeout(r, 100));
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    onProgress(i / 10);
  }
  return { url: URL.createObjectURL(file), filename: file.name, content_type: file.type, size: file.size, meta: {} };
}

function makeAdapter(): { adapter: ChatAdapter; real: boolean; mock?: MockAdapter } {
  // Real-backend mode exists only in local dev; the Pages build compiles this branch away.
  if (!__PAGES__ && import.meta.env.VITE_CHAT_BASE_URL) {
    const token = import.meta.env.VITE_CHAT_TOKEN;
    return {
      real: true,
      adapter: createRestAdapter({
        baseUrl: import.meta.env.VITE_CHAT_BASE_URL,
        headers: (): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {}),
      }),
    };
  }
  const mock = createMockAdapter({ persistKey: 'agentic-chat-playground:db' });
  return { real: false, adapter: mock, mock };
}

export function ChatPage() {
  const { adapter, real, mock } = useMemo(makeAdapter, []);
  return (
    <AgenticChat
      adapter={adapter}
      blocks={[chartBlock]}
      scope={{ groups: SCOPE_GROUPS }}
      attachments={{ upload: demoUpload, accept: '.pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.txt,.md', maxSize: 10 * 1024 * 1024 }}
      persistence={{ storage: 'local', scope: 'playground', persist: { history: true } }}
      onAction={(action) => console.info('[agentic-chat] onAction', action.name, action.payload)}
      onError={(error, raw) => console.warn(`[agentic-chat] ${error.type}: ${error.message}`, raw)}
      // A real app hands the credential to its backend here (PUT /v1/connections/{sourceId}).
      onConnectionRequired={async ({ sourceId }) => {
        if (!mock || !sourceId) return false;
        await new Promise((r) => setTimeout(r, 600));
        mock.connect(sourceId);
        return true;
      }}
      composerProps={{
        footer: real ? undefined : (
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            Demo backend with sample data. Try the suggestions, or ask it to post, reconcile, chart, pick, fail, show a scan or
            search invoice processing.
          </Typography>
        ),
      }}
    />
  );
}
