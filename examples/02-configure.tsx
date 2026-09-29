// README: Configuration
import { AgenticChat, createRestAdapter, type Attachment } from '@neofloai/agentic-chat';

declare function getAccessToken(): Promise<string>;
declare function refreshSession(): Promise<boolean>;
declare function uploadToStorage(file: File, onProgress: (p: number) => void, signal: AbortSignal): Promise<string>;
declare const currentUser: { idHash: string };
declare const invoiceOnScreen: { id: string } | null;
declare const router: { push(path: string): void };

const adapter = createRestAdapter({
  baseUrl: 'https://api.example.com',
  headers: async () => ({ Authorization: `Bearer ${await getAccessToken()}` }),
  // A 401 calls this once; return true after refreshing to retry the request.
  onUnauthorized: refreshSession,
});

export function Chat({ conversationId }: { conversationId?: string }) {
  return (
    <AgenticChat
      adapter={adapter}
      // The composer's "All workflows" picker. Groups are workspaces, items are workflows.
      scope={{
        groups: [
          {
            id: 'ws_finance',
            label: 'Finance',
            items: [
              { id: 'ip', label: 'Invoice Processing' },
              { id: 'col', label: 'Collections' },
            ],
          },
        ],
      }}
      // Context from the page the chat is embedded in, merged into every turn.
      workflowContext={() =>
        invoiceOnScreen
          ? [{ workflow_name: 'ip', workspace_id: ['ws_finance'], context: { invoice_id: invoiceOnScreen.id } }]
          : undefined
      }
      // The schema has no upload endpoint, so your app uploads and returns the Attachment.
      attachments={{
        accept: '.pdf,.xlsx,.csv,image/*',
        maxSize: 20 * 1024 * 1024,
        upload: async (file, { signal, onProgress }): Promise<Attachment> => ({
          url: await uploadToStorage(file, onProgress, signal),
          filename: file.name,
          content_type: file.type,
          size: file.size,
          meta: {},
        }),
      }}
      persistence={{ storage: 'local', scope: currentUser.idHash, persist: { history: true } }}
      // Keep the open chat in the URL.
      conversationId={conversationId}
      onConversationChange={(id) => router.push(id ? `/chat/${id}` : '/chat')}
      // Cards call actions.emit(...); route those into your app.
      onAction={(action) => {
        if (action.name === 'open_invoice') router.push(`/invoices/${(action.payload as { id: string }).id}`);
      }}
      onError={(error) => console.warn(error.type, error.message)}
      labels={{ composerPlaceholder: 'Ask Neo anything' }}
    />
  );
}
