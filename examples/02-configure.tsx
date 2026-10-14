// README: Configuration
import { AgenticChat, createRestAdapter, type Attachment } from '@neofloai/agentic-chat';

declare function getAccessToken(): Promise<string>;
declare function refreshSession(): Promise<boolean>;
declare function openWorkspacePicker(): Promise<boolean>;
declare function connectSource(sourceId: string): Promise<boolean>;
declare function uploadToStorage(file: File, onProgress: (p: number) => void, signal: AbortSignal): Promise<string>;
declare const currentUser: { idHash: string };
declare const invoiceOnScreen: { id: string } | null;
declare const router: { push(path: string): void };

const adapter = createRestAdapter({
  baseUrl: 'https://api.example.com',
  headers: async () => ({ Authorization: `Bearer ${await getAccessToken()}` }),
  // A 401 calls this once with its error code; return true once the user can continue, to
  // retry the request. `unauthenticated` means sign in again; a product code can mean more.
  onUnauthorized: ({ code }) => (code === 'askneo.workspace_required' ? openWorkspacePicker() : refreshSession()),
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
      // A connected system (an ERP, invoice processing…) needs reconnecting: hand your backend
      // the credential, return true, and the chat retries the message once.
      onConnectionRequired={({ sourceId }) => (sourceId ? connectSource(sourceId) : false)}
      onError={(error) => console.warn(error.type, error.message, error.requestId)}
      labels={{ composerPlaceholder: 'Ask Neo anything' }}
    />
  );
}
