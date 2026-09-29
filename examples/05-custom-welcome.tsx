// README: Slots (custom welcome screen)
import { Button, Stack, Typography } from '@neofloai/atoms';
import { AgenticChat, useChatActions, useThreadMeta, type ChatAdapter } from '@neofloai/agentic-chat';

function Welcome() {
  const meta = useThreadMeta();
  const { send } = useChatActions();
  return (
    <Stack spacing={2} sx={{ alignItems: 'center', py: 8 }}>
      <Typography variant="h4" component="h2">
        {meta.greeting ?? 'Good morning'}
      </Typography>
      <Stack direction="row" spacing={1}>
        {meta.suggestedPrompts.map((p) => (
          <Button key={p.label} size="sm" variant="secondary" appearance="outline" onClick={() => void send(p.prompt)}>
            {p.label}
          </Button>
        ))}
        <Button size="sm" onClick={() => void send('What changed since yesterday?')}>
          Daily digest
        </Button>
      </Stack>
    </Stack>
  );
}

export function Chat({ adapter }: { adapter: ChatAdapter }) {
  return <AgenticChat adapter={adapter} components={{ Welcome }} history={false} />;
}
