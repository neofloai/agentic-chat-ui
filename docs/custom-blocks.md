# Custom blocks

A block definition tells the chat how to render one kind of content block. Built-in blocks use the same API, so anything they do, yours can do.

## Anatomy

```ts
defineBlock<TData>({
  type: 'invoice_card', // string or string[]; matched against block.type
  category: 'ui', // fallback when no definition claims the type
  match: (block) => boolean, // full control; checked before type and category
  parse: (block, chatBlock) => TData, // validate and normalize; throw to fall back
  applyDelta: (block, delta, snapshot) => block | undefined, // custom streaming
  render: Component, // receives BlockRenderProps<TData>
  toText: (data, chatBlock) => string, // used by Copy
  group: 'activity', // render consecutive blocks of this group together
});
```

`render` receives:

| Prop                   | What it is                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| `data`                 | The output of `parse`, or the raw block without a parser                                                  |
| `block`                | The runtime block: `id`, `type`, `status` (`streaming`, `complete`, `interrupted`), `checkpoint`, timings |
| `message`              | The message it belongs to                                                                                 |
| `status`, `checkpoint` | Shortcuts for `block.status` and `block.checkpoint`                                                       |
| `isLast`               | It's the last block of a message that's still streaming                                                   |
| `actions`              | `send(text)`, `resume(decision)`, `emit(name, payload)`, `retry()`                                        |

## Resolution

1. `match()` functions, newest registration first
2. An exact `type`
3. A `category`
4. The fallback (`unknownBlock`: JSON in development, nothing in production)

Because later registrations win, you can replace a built-in:

```ts
const myTable = defineBlock({ ...tableBlock, render: MyTable });
<AgenticChat adapter={adapter} blocks={[myTable]} />;
```

Or map a backend's own type name onto a built-in:

```ts
const approvals = { ...approvalBlock, type: ['approval', 'approval_card'] };
```

## Looking native

Build cards from the kit so they match the built-in blocks:

- `BlockShell`: the card itself. It takes `icon`, `title`, `meta`, `actions`, `footer`, `collapsible`, `tone` (`primary`, `warning`, `danger` for attention), and `flushBody` for edge-to-edge content.
- `KeyValueList`: muted keys against values.
- `Shimmer`: text still arriving.
- `ChartCard`, `ChartLegend`, `useChartPalette` from `/charts`.
- `Markdown`, `DataTable`, `ErrorNotice`.

Use Atoms components and tokens for everything else. `mode(theme, { color: text.default.b2 })` resolves an Atoms `{ light, dark }` token inside `sx`.

## Talking to the host app

`actions.emit(name, payload)` calls the `onAction` prop with `{ name, payload, block, message, conversationId }`. Use it for navigation, opening records, downloads, analytics: anything the card shouldn't own.

## Streaming your block

By default, a `snapshot` string replaces the block's `text`, a `snapshot` object is merged into the block, and `delta.text` is appended. Provide `applyDelta` when your block streams differently, for example a plan whose snapshot is a step array:

```ts
applyDelta: (block, _delta, snapshot) => (Array.isArray(snapshot) ? { ...block, steps: snapshot } : undefined),
```

Return `undefined` to fall back to the default.

## HITL cards

Inside `render`, `useHitl()` returns `canSubmit`, `isPending`, `isSubmitting`, `isResolved`, `decision`, `error`, `requires` and `submit(decision)`. `canSubmit` is true only when the card is the thread's live question and nothing is streaming. It also guards double submits. See the README's HITL section for a full example.

## Tests

Register your block with the mock backend and assert on what renders:

```tsx
const adapter = createMockAdapter({
  latency: 0,
  speed: 0,
  includeDefaultScenarios: false,
  scenarios: [
    {
      name: 'card',
      match: () => true,
      run: (w) => w.block({ type: 'invoice_card', category: 'ui', invoice_id: '1' }).then(() => undefined),
    },
  ],
});
render(
  <NeofloThemeProvider>
    <AgenticChat adapter={adapter} blocks={[invoiceCard]} persistence={false} />
  </NeofloThemeProvider>,
);
```
