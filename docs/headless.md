# Headless

`@neofloai/agentic-chat/headless` is the engine and the React bindings, with no styling and no Atoms. Use it when a product has its own design system, or when you need a layout the styled components can't express.

It depends on React and `@radix-ui/react-slot` only. `@neofloai/agentic-chat/core` goes one step further and has no dependencies at all.

## Provider

```tsx
<ChatProvider adapter={adapter} blocks={[...myBlocks]} onAction={handle} labels={{ composerPlaceholder: 'Ask' }}>
  …
</ChatProvider>
```

`ChatProvider` takes every runtime option (see the README's Configuration table), or a `runtime` you created with `createChatRuntime`. `ThreadProvider conversationId="…"` pins everything below it to one conversation instead of the active one, which is how you show two chats side by side.

## Primitives

Every part renders a plain element, accepts normal HTML props, supports `asChild` to render your own element instead, and exposes `data-*` attributes (`data-role`, `data-status`, `data-busy`, `data-at-bottom`…) for styling.

| Primitive          | Parts                                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `Thread`           | `Root`, `Viewport` (stick-to-bottom scrolling), `Messages`, `Empty`, `If`, `Status`, `ScrollToBottom`                             |
| `Message`          | `Root`, `Blocks` (renders through the registry, with optional grouping), `If`                                                     |
| `Block`            | Renders one block through the registry inside its own error boundary                                                              |
| `Composer`         | `Root` (the form), `Input` (auto-growing, Enter sends, IME-safe, paste files), `Send`, `Cancel`, `AttachmentInput`, `Attachments` |
| `Suggestions`      | `Root`, `Item` (sends the prompt text)                                                                                            |
| `ConversationList` | `Root`, `Item`, `New`                                                                                                             |
| `Hitl`             | `Root`, `Option`, `Submit`, for building choice cards                                                                             |

## Hooks

| Hook                                                          | Returns                                                                                       |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `useThread(selector)`                                         | Any slice of the thread state, re-rendering only when it changes                              |
| `useMessages()`, `useRun()`, `useThreadMeta()`, `useIsBusy()` | Common slices                                                                                 |
| `useComposer()`                                               | Draft text, attachments, `canSend`, `busy`, `blockedByDecision`, `send`, `cancel`, `addFiles` |
| `useConversations()`                                          | History: items, groups, search, create, select, rename, remove, archive                       |
| `useScope()`                                                  | The workflow picker: groups, selection, summary, `toggle`, `setGroup`                         |
| `useHitl()`                                                   | The current block's checkpoint state and `submit`                                             |
| `useChatActions()`                                            | `send`, `resume`, `cancel`, `retry`, conversation actions, `emit`                             |
| `usePreference(key, fallback)`                                | A persisted UI preference                                                                     |
| `useChatEvent(type, listener)`                                | Runtime events: `event`, `error`, `warning`, `activeChange`                                   |
| `useChatRuntime()`                                            | The runtime itself                                                                            |

## Parsers

Every built-in block's parser is exported (`parseTable`, `parseToolCall`, `parseApproval`, …) along with `BLOCK_TYPES`, so a headless renderer can reuse the exact payload handling of the Atoms UI:

```tsx
const table = defineBlock({ type: BLOCK_TYPES.table, parse: parseTable, render: MyTable });
```
