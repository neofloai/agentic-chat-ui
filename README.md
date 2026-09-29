<img src="docs/brand/neoflo-mark.png" width="56" height="56" alt="Neoflo" />

# @neofloai/agentic-chat

A React chat UI for agentic assistants. Point it at any backend that implements the **Neoflo chat-layer schema v1**. You get streaming answers, chat history, human-in-the-loop decisions, tool activity, tables, charts and custom cards without building any of it yourself.

It's built on [`@neofloai/atoms`](https://github.com/neofloai/atoms), so it looks like the rest of your Neoflo product in light and dark.

**[Live demo](https://neofloai.github.io/agentic-chat-ui/#/chat)** · **[Component gallery](https://neofloai.github.io/agentic-chat-ui/#/gallery)** · [Backend contract](docs/backend-contract.md) · [Block contracts](docs/block-contracts.md)

![A streamed answer with a tool call, a table and sources](docs/images/chat-answer.png)

## What you get

- **A complete chat in one component.** `<AgenticChat>` renders the history panel, the thread and the composer.
- **Streaming that holds up in production.** It handles SSE over `fetch`, snapshot-based deltas, cancel, retry, idle timeouts and dropped connections.
- **Human-in-the-loop.** Approval and choice cards pause the turn, lock the composer, and resume with your decision.
- **12 built-in blocks from the Figma sheets.** Text, thinking, tool call, table, sources, approval, choice, error, artifact, image, plan and charts.
- **Your own cards.** `defineBlock` registers a card, and `actions.emit` routes clicks into your app.
- **Chat history.** Search, date groups, rename, archive and delete, all with optimistic updates.
- **Configurable local persistence.** Choose session, local, memory, off, or your own storage, partitioned per user.
- **Three levels of control.** Use the styled UI, swap parts through slots, or go fully headless with hooks and primitives.

## Contents

1. [Install](#install)
2. [Quick start](#quick-start)
3. [How it talks to your backend](#how-it-talks-to-your-backend)
4. [Configuration](#configuration)
5. [Chat history](#chat-history)
6. [Local persistence](#local-persistence)
7. [Human-in-the-loop](#human-in-the-loop)
8. [Blocks](#blocks)
9. [Customizing the UI](#customizing-the-ui)
10. [Headless](#headless)
11. [A backend that doesn't follow the schema](#a-backend-that-doesnt-follow-the-schema)
12. [Driving the chat from your app](#driving-the-chat-from-your-app)
13. [Mock backend](#mock-backend)
14. [Server rendering](#server-rendering)
15. [Troubleshooting](#troubleshooting)
16. [Versioning](#versioning)
17. [Contributing](#contributing)

## Install

The package installs straight from GitHub. It has no registry, needs no token, and follows semver through release tags:

```bash
npm install github:neofloai/agentic-chat-ui#semver:^0.1.0

# The UI is built on Atoms (skip it if you only use /headless or /core)
npm install github:neofloai/atoms#semver:^2.1.0

# Only if you use the chart blocks
npm install recharts
```

Requirements:

- React 18.2 or 19.
- A `git` binary on machines that install it. `node:*-alpine` and `-slim` images don't ship one (`apk add --no-cache git`).
- Atoms builds itself on install, so don't run `npm ci --ignore-scripts`.

| Import                            | What it contains                                                           | Needs      |
| --------------------------------- | -------------------------------------------------------------------------- | ---------- |
| `@neofloai/agentic-chat`          | `<AgenticChat>`, every UI part and block, plus everything from `/headless` | Atoms      |
| `@neofloai/agentic-chat/headless` | Runtime, adapters, hooks, primitives, block registry and parsers           | React only |
| `@neofloai/agentic-chat/core`     | The framework-free engine and schema types                                 | Nothing    |
| `@neofloai/agentic-chat/charts`   | `chartBlock` (bar, line, area, donut)                                      | `recharts` |
| `@neofloai/agentic-chat/mock`     | An in-memory schema-v1 backend with demo scenarios                         | Nothing    |

## Quick start

Mount `NeofloThemeProvider` once, give the chat a sized container, and hand it an adapter:

```tsx
import { NeofloThemeProvider } from '@neofloai/atoms';
import { AgenticChat, createRestAdapter } from '@neofloai/agentic-chat';
import { chartBlock } from '@neofloai/agentic-chat/charts';

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
```

That's the whole integration. The chat creates a conversation, shows the server's greeting and suggested prompts, streams answers, and keeps history.

## How it talks to your backend

`createRestAdapter` implements the seven endpoints of schema v1:

| #   | Call                                          | Used for                                                            |
| --- | --------------------------------------------- | ------------------------------------------------------------------- |
| 1   | `POST /v1/conversation`                       | New chat. The response supplies the greeting and suggested prompts. |
| 2   | `GET /v1/conversations`                       | The history panel                                                   |
| 3   | `GET /v1/conversations/{id}`                  | Opening a chat and its messages                                     |
| 4   | `PATCH /v1/conversations/{id}`                | Rename, archive, model, default sources                             |
| 5   | `DELETE /v1/conversations/{id}`               | Delete                                                              |
| 6   | `POST /v1/conversations/{id}/messages`        | Sending a turn, or resuming a HITL checkpoint. Streamed as SSE.     |
| 7   | `POST /v1/conversations/{id}/messages/cancel` | The Stop button                                                     |

It reads all nine stream events (`message_start` through `error`), treats `snapshot` as a full overwrite, and ignores event types it doesn't know. A newer backend therefore never breaks an older UI. Identity comes only from your `headers`. The library never puts user or tenant data in a payload.

[docs/backend-contract.md](docs/backend-contract.md) is the reference for backend teams. It covers ordering rules, retries and error handling. [docs/block-contracts.md](docs/block-contracts.md) defines the payload of every block type, and [docs/schema-gaps.md](docs/schema-gaps.md) lists what schema v1 doesn't cover yet.

## Configuration

Every option works the same on `<AgenticChat>`, `<ChatProvider>` and `createChatRuntime`:

```tsx
<AgenticChat
  adapter={adapter}
  // The composer's "All workflows" picker. Groups are workspaces, items are workflows.
  scope={{ groups: [{ id: 'ws_finance', label: 'Finance', items: [{ id: 'ip', label: 'Invoice Processing' }] }] }}
  // Context from the page the chat sits in, merged into every turn.
  workflowContext={() => [{ workflow_name: 'ip', workspace_id: ['ws_finance'], context: { invoice_id: 'INV-1042' } }]}
  // The schema has no upload endpoint: your app uploads and returns the Attachment.
  attachments={{ accept: '.pdf,.xlsx,image/*', maxSize: 20 * 1024 * 1024, upload: uploadFile }}
  persistence={{ storage: 'local', scope: user.idHash, persist: { history: true } }}
  conversationId={params.id}
  onConversationChange={(id) => navigate(id ? `/chat/${id}` : '/chat')}
  onAction={(action) => handleCardAction(action)}
  onError={(error) => report(error)}
  labels={{ composerPlaceholder: 'Ask Neo anything' }}
/>
```

| Option                                    | Default         | What it does                                                                                                                       |
| ----------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `adapter`                                 | required        | The backend connection. Use `createRestAdapter` or your own.                                                                       |
| `runtime`                                 |                 | Pass a runtime you created yourself instead of `adapter`. See [Driving the chat](#driving-the-chat-from-your-app).                 |
| `blocks`                                  | built-ins       | Extra or replacement block definitions. Later entries win.                                                                         |
| `scope`                                   | none            | Groups and items for the workflow picker. By default the selection becomes `workflow_context`. Change that with `scope.toRequest`. |
| `workflowContext`                         | none            | Page context added to every turn. It merges with the scope by `workflow_name`.                                                     |
| `attachments`                             | off             | `{ upload, accept, maxSize, maxFiles }`. This turns on the paperclip button, drag-and-drop and paste.                              |
| `persistence`                             | session storage | See [Local persistence](#local-persistence).                                                                                       |
| `conversationCreation`                    | `'eager'`       | `'eager'` creates the chat when it opens, which is what fetches the greeting. `'lazy'` waits for the first message.                |
| `hitl.composerWhilePaused`                | `'disabled'`    | Whether people can type while a card waits for a decision.                                                                         |
| `conversationId` / `onConversationChange` |                 | A controlled active chat, for deep links. `null` means a new chat.                                                                 |
| `onAction`                                |                 | Receives `actions.emit(name, payload)` from cards.                                                                                 |
| `onEvent` / `onError` / `onWarning`       |                 | Telemetry hooks for every stream event, error and recoverable warning.                                                             |
| `labels`                                  | English         | Override any UI string, for copy changes or translation.                                                                           |
| `streamIdleTimeoutMs`                     | `60000`         | How long a silent stream waits before it counts as dropped and becomes retryable.                                                  |
| `refreshOnFocus`                          | `true`          | Refresh history when the window regains focus.                                                                                     |

`createRestAdapter` options:

| Option                              | What it does                                                                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `baseUrl`                           | The API origin. The `/v1/...` paths are appended to it.                                                                                    |
| `headers`                           | An object or an (async) function, called on every request so tokens stay fresh.                                                            |
| `onUnauthorized`                    | Called once on a 401. Refresh the session and return `true` to retry that request.                                                         |
| `retry`                             | `{ retries, baseDelayMs, maxDelayMs }` for idempotent calls on 5xx, 429 and network errors. Message POSTs are never retried automatically. |
| `paths`                             | Override individual endpoint paths.                                                                                                        |
| `fetch`, `credentials`, `timeoutMs` | Transport details.                                                                                                                         |

## Chat history

The history panel lists conversations from row 2, newest first. It groups them into Today, Yesterday, Previous 7 days, Previous 30 days and Older, and searches titles as you type. Rename, archive and delete are optimistic, and they roll back if the server refuses.

- A new chat joins the list when its first message is sent. Empty chats never clutter history.
- A reply keeps streaming if you switch chats mid-answer. The list marks that conversation "Replying…".
- `message_stop.title` updates the title everywhere as soon as the server names the chat.
- Build your own panel with `useConversations()`, which returns items, groups, the active id, search, create, select, rename, remove, archive and refresh.

## Local persistence

```ts
persistence: {
  storage: 'session',        // 'session' | 'local' | 'memory' | 'none' | your StorageAdapter
  scope: user.idHash,        // partitions storage per user
  persist: {
    activeConversation: true, // reopen the same chat after a reload
    drafts: true,             // unsent text and uploaded attachments, per chat
    preferences: true,        // history panel open, model, scope selection
    history: false,           // cache the list and recent messages for instant loads
  },
  maxCachedConversations: 20,
  ttl: 7 * 24 * 60 * 60 * 1000,
}
```

- `history` is off by default because chat content can be sensitive. Turn it on together with `scope`.
- Cached chats render instantly, then reconcile with the server. The server always wins.
- A full or blocked storage never breaks the chat. It falls back to memory and reports once through `onWarning`.
- **Call `runtime.persistence.clear()` on logout.**
- A custom `StorageAdapter` can be async: IndexedDB, localforage, an encrypted store. See [docs/persistence.md](docs/persistence.md).

## Human-in-the-loop

When the backend emits a `checkpoint`, the card that asked the question becomes live. The turn stops with `stop_reason: "paused"`, the composer shows "Respond to the card above to continue", and the answer goes back through row 6:

```json
{
  "stream": true,
  "message": { "role": "user", "type": "hitl", "content": { "checkpoint_id": "z93hdnf02c", "decision": "approve" } }
}
```

![An approval card waiting for a decision](docs/images/chat-approval.png)

The rest of the turn streams into the same message. A double click can't send two decisions. If the resume request fails, the card shows the error and lets the user try again.

Write your own decision card with `useHitl()`:

```tsx
function AmountCard({ data }: { data: AmountData }) {
  const hitl = useHitl();
  const [amount, setAmount] = useState(String(data.suggested));
  return (
    <BlockShell
      icon={<PencilSimpleIcon />}
      title={data.title}
      tone={hitl.isPending ? 'primary' : 'default'}
      footer={
        !hitl.isResolved && (
          <Button
            size="sm"
            loading={hitl.isSubmitting}
            disabled={!hitl.canSubmit}
            onClick={() => hitl.submit({ amount: Number(amount) })}
          >
            Confirm
          </Button>
        )
      }
    >
      <TextField label="Amount" value={amount} disabled={!hitl.canSubmit} onChange={(e) => setAmount(e.target.value)} />
    </BlockShell>
  );
}

export const amountCard = defineBlock({
  type: 'amount_confirmation',
  parse: parseAmount,
  render: ({ data }) => <AmountCard data={data} />,
});
```

## Blocks

A block is one piece of an answer. The renderer is picked by the block's `type`, falling back to its `category`:

| `type` (aliases)                 | Renders                                                         | Payload                                        |
| -------------------------------- | --------------------------------------------------------------- | ---------------------------------------------- |
| `text` (`markdown`)              | Markdown on the Atoms type scale. Raw HTML is never rendered.   | [text](docs/block-contracts.md#text)           |
| `thinking` (`reasoning`)         | "Thought for N seconds". Open while streaming, folds when done. | [thinking](docs/block-contracts.md#thinking)   |
| `tool_call` (`tool_use`, `tool`) | Tool name, duration, inputs and result                          | [tool_call](docs/block-contracts.md#tool_call) |
| `table`                          | A titled, sortable result set with a row count                  | [table](docs/block-contracts.md#table)         |
| `sources` (`citations`)          | What the answer read. Items can link out or be selectable.      | [sources](docs/block-contracts.md#sources)     |
| `approval`                       | Approve or reject a proposed action (HITL)                      | [approval](docs/block-contracts.md#approval)   |
| `choice`                         | Single or multi-select question (HITL)                          | [choice](docs/block-contracts.md#choice)       |
| `error`                          | Failure with a Try again button that respects `retry_after`     | [error](docs/block-contracts.md#error)         |
| `artifact` (`document`)          | A generated file with a preview, full view and download         | [artifact](docs/block-contracts.md#artifact)   |
| `image`                          | An image with a caption that opens larger                       | [image](docs/block-contracts.md#image)         |
| `plan` (`steps`)                 | The agent's steps as a live stepper                             | [plan](docs/block-contracts.md#plan)           |
| `chart`                          | Bar, line, area and donut in Atoms colors (`/charts`)           | [chart](docs/block-contracts.md#chart)         |

### Custom blocks

```tsx
import { AgenticChat, BlockShell, KeyValueList, defineBlock } from '@neofloai/agentic-chat';

export const invoiceCard = defineBlock<InvoiceCardData>({
  type: 'invoice_card',
  parse: (block) => ({
    id: String(block.invoice_id),
    vendor: String(block.vendor),
    total: String(block.total),
    status: String(block.status),
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

<AgenticChat adapter={adapter} blocks={[invoiceCard]} onAction={(a) => a.name === 'open_invoice' && openInvoice(a.payload)} />;
```

- **Matching.** Use `type` (one or several), `category`, or `match(block)` for anything else. Later registrations override built-ins, so `{ ...approvalBlock, type: 'approval_card' }` maps a backend's own name onto a built-in card.
- **Safety.** If `parse` throws, the block falls back to the unknown-block renderer. A renderer that throws is caught by its own error boundary, so the rest of the answer still shows.
- **Streaming.** `applyDelta(block, delta, snapshot)` takes over how deltas apply to your block type.
- **`actions`.** `send(text)` starts a follow-up turn, `resume(decision)` answers a checkpoint, `emit(name, payload)` reaches your `onAction`, and `retry()` retries the last failed turn.
- **The kit.** `BlockShell`, `KeyValueList`, `Shimmer`, `ChartCard` and `useChartPalette` are the same pieces the built-in blocks use, so custom cards look native.

More in [docs/custom-blocks.md](docs/custom-blocks.md).

## Customizing the UI

**Slots** replace any part of `<AgenticChat>`: `Welcome`, `UserTurn`, `AssistantTurn`, `Header`, `History` and `Composer`.

```tsx
function Welcome() {
  const meta = useThreadMeta();
  const { send } = useChatActions();
  return (
    <Stack spacing={2} sx={{ alignItems: 'center', py: 8 }}>
      <Typography variant="h4">{meta.greeting}</Typography>
      <Button size="sm" onClick={() => send('What changed since yesterday?')}>
        Daily digest
      </Button>
    </Stack>
  );
}

<AgenticChat adapter={adapter} components={{ Welcome }} history={false} />;
```

- **Layout props.** `history`, `header`, `title`, `headerActions`, `maxWidth`, `composerProps` (`placeholder`, `extraActions`, `footer`) and `compactBelow`. Below 720px of container width, history becomes an overlay.
- **Compose it yourself.** `ChatThread`, `ChatComposer`, `ChatHistory`, `ChatHeader`, `WelcomeScreen`, `ChatSuggestions` and `RunStatus` all work inside a `ChatProvider`, in any layout you like.
- **Theming.** Everything reads Atoms tokens, so it follows `NeofloThemeProvider`, including light and dark. Don't restyle the internals with CSS overrides. If Atoms lacks something, request it in Atoms.
- **Copy.** `labels` overrides any string. See `defaultLabels` for the full list.

![Charts in dark mode](docs/images/chat-charts-dark.png)

## Headless

`@neofloai/agentic-chat/headless` has the same engine with no styling and no Atoms dependency:

```tsx
import {
  ChatProvider,
  Composer,
  Message,
  Thread,
  Block,
  defineBlock,
  parseText,
  useMessage,
} from '@neofloai/agentic-chat/headless';

const text = defineBlock({ type: 'text', category: 'content', parse: parseText, render: ({ data }) => <p>{data.text}</p> });

function AnyMessage() {
  const { message } = useMessage();
  return (
    <Message.Root>
      {message.blocks.map((b) => (
        <Block key={b.id} block={b} message={message} />
      ))}
    </Message.Root>
  );
}

export function MyChat() {
  return (
    <ChatProvider adapter={adapter} blocks={[text]}>
      <Thread.Root>
        <Thread.Viewport>
          <Thread.Empty>Ask me anything.</Thread.Empty>
          <Thread.Messages components={{ UserMessage: AnyMessage, AssistantMessage: AnyMessage }} />
          <Thread.Status>{(label) => <span>{label}</span>}</Thread.Status>
        </Thread.Viewport>
        <Thread.ScrollToBottom>↓</Thread.ScrollToBottom>
      </Thread.Root>
      <Composer.Root>
        <Composer.Input />
        <Composer.Cancel>Stop</Composer.Cancel>
        <Composer.Send>Send</Composer.Send>
      </Composer.Root>
    </ChatProvider>
  );
}
```

- **Primitives.** `Thread`, `Message`, `Composer`, `Suggestions`, `ConversationList` and `Hitl` accept normal HTML props and `asChild`, and expose `data-*` state attributes for styling.
- **Hooks.** `useThread`, `useMessages`, `useRun`, `useComposer`, `useConversations`, `useScope`, `useHitl`, `useChatActions`, `usePreference` and `useChatEvent`.

See [docs/headless.md](docs/headless.md).

## A backend that doesn't follow the schema

`ChatAdapter` is the only seam. Keep the REST calls that match and translate the ones that don't:

```ts
import { createRestAdapter, type ChatAdapter } from '@neofloai/agentic-chat/core';

const base = createRestAdapter({ baseUrl: 'https://legacy.example.com' });

export const legacyAdapter: ChatAdapter = {
  ...base,
  async *sendMessage(conversationId, body, { signal }) {
    const reply = await legacyAsk(conversationId, body.message.content.default, signal);
    yield { type: 'message_start', message_id: reply.id, conversation_id: conversationId, run_id: reply.id };
    const block = { id: `${reply.id}:0`, type: 'text', category: 'content', text: reply.answer };
    yield { type: 'content_block_start', index: 0, block };
    yield { type: 'content_block_stop', index: 0, block };
    yield { type: 'message_stop', message_id: reply.id, stop_reason: 'end_turn' };
  },
};
```

## Driving the chat from your app

Create the runtime outside React to reach it from anywhere:

```tsx
export const chat = createChatRuntime({ adapter, persistence: { storage: 'session' } });

function AskAboutInvoice({ invoiceId }: { invoiceId: string }) {
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

<AgenticChat runtime={chat} />;

// On logout
await chat.persistence.clear();
chat.dispose();
```

The runtime also exposes `cancel`, `retry`, `resume`, `selectConversation`, `renameConversation`, `deleteConversation`, `setModel` and `on('event' | 'error' | 'warning' | 'activeChange', listener)`. Several runtimes can share a page.

## Mock backend

`@neofloai/agentic-chat/mock` runs a schema-v1 backend in memory. Use it to build UI before the API exists, in tests, and in demos. The [live demo](https://neofloai.github.io/agentic-chat-ui/#/chat) runs on it.

```tsx
import { createMockAdapter } from '@neofloai/agentic-chat/mock';

const adapter = createMockAdapter({
  latency: 200,
  scenarios: [
    {
      name: 'invoice',
      match: (prompt) => prompt.includes('invoice'),
      run: async (w) => {
        await w.status('Looking it up');
        await w.block({ type: 'invoice_card', category: 'ui', invoice_id: 'INV-1042', vendor: 'Acme', total: '$1,200' });
        await w.text('Here it is.');
      },
    },
  ],
});
```

The writer has `status`, `text`, `thinking`, `block` (with streamed `snapshots`), `pause` (a HITL checkpoint with an `onResume` continuation), `error` and `wait`. Cancel and abort work the same as on a real backend.

## Server rendering

The library is plain React and works in any React app. If yours renders on the server:

- Nothing touches `window` or storage at import time or during server render. Persistence hydrates on the client.
- The React entry points (`.`, `/headless`, `/charts`) are marked `"use client"`. `/core` and `/mock` contain no React, so they can also run in server code.
- Create the adapter and render `<AgenticChat>` in a client component. An adapter holds functions, and functions can't be passed as props from server-rendered components.

## Troubleshooting

| Symptom                                                                   | Fix                                                                                                                |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `Cannot find module ./dist/index.mjs` from Atoms                          | Your install skipped scripts. Remove `--ignore-scripts`.                                                           |
| `git: not found` in CI or Docker                                          | Install git in the image: `apk add --no-cache git`.                                                                |
| The chat has no height, or never scrolls                                  | Give its container a height (`height: 100vh`, or a flex child with `min-height: 0`).                               |
| Wrong fonts or colors, plus a console warning about `NeofloThemeProvider` | Mount `NeofloThemeProvider` once at the root.                                                                      |
| An "Unsupported content: …" box                                           | The backend sent a block type nothing renders. Register a `defineBlock` for it. The box only shows in development. |
| Cards do nothing when clicked                                             | Handle `onAction`. Cards emit, and your app decides.                                                               |
| A 401 loop                                                                | Return `false` from `onUnauthorized` when the refresh fails. The error then surfaces instead of retrying.          |

## Versioning

The package follows semver. Pin a range (`#semver:^0.1.0`) and `npm update` picks up fixes and features. Crossing a major version is a deliberate `package.json` edit. **Any change to the backend or block contract is a major version.** Each release lists its changes in [CHANGELOG.md](CHANGELOG.md) and on the GitHub Releases page.

## Contributing

```bash
git clone https://github.com/neofloai/agentic-chat-ui.git && cd agentic-chat-ui
npm install
npm run dev            # playground at http://localhost:5173 (chat + gallery on the mock backend)
npm run check          # typecheck, lint, tests, build, package validation
```

- Point the playground at a real backend with `VITE_CHAT_BASE_URL` and `VITE_CHAT_TOKEN` in `playground/.env.local`. That mode only exists locally; the public demo compiles it out.
- New UI goes into the gallery (`playground/src/GalleryPage.tsx`) in every state, in light and dark.
- **Import only from Atoms' public entry points.** Lint enforces it, along with keeping `/headless` free of Atoms and `/core` free of React.
- Add a changeset (`npm run changeset`) to every PR that changes the library. Merging the generated "Version packages" PR tags the release with a prebuilt `dist/`, creates the GitHub Release, and redeploys the demo.

Project layout:

```
src/core        engine: schema types, REST/SSE adapter, stores, persistence, runtime (no React)
src/react       provider, hooks, headless primitives
src/registry    defineBlock, block resolution, error boundary
src/blocks      block parsers shared by every renderer
src/ui          the Atoms UI: shell, blocks, history, kit
src/charts      chart blocks (Recharts)
src/mock        the in-memory backend
playground      the demo app and component gallery (GitHub Pages)
examples        the README's code, type-checked in CI
docs            contracts and guides
```

## License

To be decided by Neoflo before the first public release. The package is marked `UNLICENSED` until then.
