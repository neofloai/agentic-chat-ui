// README: Driving the chat from your app
import { Button } from '@neofloai/atoms';
import { AgenticChat, createChatRuntime, createRestAdapter } from '@neofloai/agentic-chat';

// Create the runtime outside React to reach it from anywhere in the app.
export const chat = createChatRuntime({
  adapter: createRestAdapter({ baseUrl: 'https://api.example.com' }),
  persistence: { storage: 'session' },
});

export function AskAboutInvoice({ invoiceId }: { invoiceId: string }) {
  return (
    <Button
      onClick={async () => {
        await chat.newConversation();
        await chat.send(`Why is invoice ${invoiceId} on hold?`, {
          workflowContext: [{ workflow_name: 'ip', workspace_id: [], context: { invoice_id: invoiceId } }],
        });
      }}
    >
      Ask Neo about this invoice
    </Button>
  );
}

export function ChatPanel() {
  return <AgenticChat runtime={chat} />;
}

// On logout: stop streams and wipe everything the chat stored on this device.
export async function onLogout() {
  await chat.persistence.clear();
  chat.dispose();
}
