// README: Headless (your own design, no Atoms)
import {
  Block,
  ChatProvider,
  Composer,
  Message,
  Thread,
  defineBlock,
  parseText,
  useMessage,
  type ChatAdapter,
} from '@neofloai/agentic-chat/headless';

// Headless blocks bring their own renderer; the parsers are shared with the Atoms UI.
const text = defineBlock({ type: 'text', category: 'content', parse: parseText, render: ({ data }) => <p>{data.text}</p> });

function AnyMessage() {
  const { message } = useMessage();
  return (
    <Message.Root className={`msg msg-${message.role}`}>
      {message.blocks.map((b) => (
        <Block key={b.id} block={b} message={message} />
      ))}
    </Message.Root>
  );
}

export function MyChat({ adapter }: { adapter: ChatAdapter }) {
  return (
    <ChatProvider adapter={adapter} blocks={[text]}>
      <Thread.Root className="thread">
        <Thread.Viewport className="viewport">
          <Thread.Empty>
            <p>Ask me anything.</p>
          </Thread.Empty>
          <Thread.Messages components={{ UserMessage: AnyMessage, AssistantMessage: AnyMessage }} />
          <Thread.Status>{(label) => <span className="status">{label}</span>}</Thread.Status>
        </Thread.Viewport>
        <Thread.ScrollToBottom className="jump">↓</Thread.ScrollToBottom>
      </Thread.Root>
      <Composer.Root className="composer">
        <Composer.Input placeholder="Type a message" />
        <Composer.Cancel>Stop</Composer.Cancel>
        <Composer.Send>Send</Composer.Send>
      </Composer.Root>
    </ChatProvider>
  );
}
