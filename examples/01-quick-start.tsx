// README: Quick start
import { NeofloThemeProvider } from '@neofloai/atoms';
import { AgenticChat, createRestAdapter } from '@neofloai/agentic-chat';
import { chartBlock } from '@neofloai/agentic-chat/charts';

declare function getAccessToken(): Promise<string>;

const adapter = createRestAdapter({
  baseUrl: 'https://api.example.com',
  headers: async () => ({ Authorization: `Bearer ${await getAccessToken()}` }),
});

export function App() {
  return (
    <NeofloThemeProvider>
      <div style={{ height: '100vh' }}>
        <AgenticChat adapter={adapter} blocks={[chartBlock]} />
      </div>
    </NeofloThemeProvider>
  );
}
