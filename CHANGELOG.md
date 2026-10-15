# @neofloai/agentic-chat

## 0.2.0

### Minor Changes

- c1a08cc: Move to Atoms 3. The `@neofloai/atoms` peer range is now `^3.0.0`; install it with `npm install github:neofloai/atoms#semver:^3.0.0`. The library used neither of the two props Atoms 3 removed, so it needs no code changes. The chat picks up Atoms 3's redrawn buttons, chips and fields.
- fe7eb92: Support the Neoflo chat standard, revision 1.2 (the schema Ask Neo now implements). Backends on schema v1 keep working.
  
  - **Config endpoint.** The chat reads `GET /v1/chat/config` once per session. Its `capabilities` show or hide attachments, the scope picker, Archive and approval cards; its models, labelled sources, workflows and limits fill the UI. A backend without the endpoint gets the defaults, or the new `capabilities` option.
  - **Tool calls.** A `tool_use` and its `tool_result` render as one card with the results. A tool whose result never arrived shows "Interrupted" instead of spinning.
  - **Errors by code.** Errors follow the standard envelope and are mapped by code first, then by HTTP status. `ChatErrorInfo.type` is now the server's code when it sends one (`session_busy`, `connection_expired`, `askneo.workspace_required`…), and errors gain `action`, `status`, `requestId`, `details` and `sourceId`. Error cards show the request id.
  - **Sign-in and connections.** `onUnauthorized` receives `{ code, message, requestId }`, so the host can tell sign-in from a gate or workspace picker. The new `onConnectionRequired` handles `connection_required` / `connection_expired`: reconnect, return `true`, and the message is retried once. If it returns `false`, the error stays on screen with a Reconnect button; without the hook, only the message shows.
  - **Safe retries.** Every message carries a `client_message_id`. A retry of an unconfirmed message reuses it, `message_start` swaps the optimistic message for the saved one, and 409 `duplicate_message` reloads the conversation.
  - **Models and sources.** `selected_model` is read on endpoints 1–4 and sent per message when the backend allows it. Only source ids listed in the config are sent, and the server's sources replace the ones the client sent after a PATCH. Credentials are never kept or stored.
  - **Stop.** With `cancel: "disconnect"`, or when cancel returns `false`, Stop closes the stream at once.
  - **Product blocks.** `<product>.<name>` blocks render their `fallback_text` in apps without the product's renderer, and `ext` is passed through untouched.
  - **New entry: `@neofloai/agentic-chat/conformance`.** `runConformance()` and the `agentic-chat-conformance` CLI check a backend against the standard over HTTP, for a product's CI.
  - **Mock backend.** It follows the standard (config, `selected_model`, client ids, error envelopes, paired tool calls), and its writer gains `tool()`. Its invoice-processing connection starts expired, so the demo can show Reconnect; `adapter.connect(sourceId)` connects it.
- 799da93: Composer controls you can add yourself, and a generic picker for them.
  
  - `ChatComposer` takes `leadingActions` (left, after the attach button and the workflow picker) and `scopePicker` (your own node in the workflow picker's place, or `false` to hide it). `extraActions` still goes on the right, before Send.
  - New `ComposerPicker`: the Figma Composer-scope pill and SourcePicker menu, for any choices (tools, models, data sources…). Multiple or single selection, groups with headings and an optional Select all / Deselect all, descriptions, icons, disabled items and a footer. Controlled, and usable outside a `ChatProvider`.
  - The built-in workflow picker (`ScopePicker`) is now a `ComposerPicker`, so it matches the Figma pill and menu.
  - New labels: `pickerSummary`, `pickerSelectAll`, `pickerDeselectAll`.

### Patch Changes

- 07eade5: New chat fixes:
  
  - Clicking New chat while a new chat is still being created now opens that chat. Before, if you had moved to another conversation in the meantime, the click did nothing. Deleting the open conversation during a create had the same problem and left you on the deleted conversation.
  - After a reload, an empty conversation is no longer reopened without its greeting and suggested prompts. The conversation endpoint doesn't return them, so the chat now opens a new conversation that has them. An empty conversation with a half-typed message is still restored as before.

## 0.1.0

The first release of `@neofloai/agentic-chat`: a React chat UI for any backend that implements the Neoflo chat-layer schema v1. It's built on Atoms, so it matches the rest of the product in light and dark.

### Install

```bash
npm install github:neofloai/agentic-chat-ui#semver:^0.1.0
npm install github:neofloai/atoms#semver:^2.1.0   # the UI is built on Atoms
npm install recharts                               # only for chart blocks
```

### What's included

- **`<AgenticChat>`**: the complete chat (history panel, thread, composer) in one component. It needs a `NeofloThemeProvider` and a sized container.
- **Streaming**: all 7 endpoints and all 9 stream events of schema v1 over `fetch`. `snapshot` deltas are treated as full overwrites. Stop and Try again work, silent streams time out, and interrupted answers recover.
- **Human-in-the-loop**: approval and choice cards pause the turn, lock the composer, send the decision back through the schema's resume call, and continue in the same message. Double submits are blocked, and a failed decision can be retried from the card.
- **12 blocks from the Figma chat sheets**: text, thinking, tool call, table, sources, approval, choice, error, artifact, image, plan, and charts (bar, line, area, donut).
- **Chat history**: search, date groups, rename, archive and delete with optimistic updates. A reply keeps streaming when you switch chats.
- **Local persistence**: session (the default), local, memory, off, or your own async storage, partitioned per user, with `persistence.clear()` for logout.
- **Composer**: attachments (upload, drag and drop, paste), a workflow scope picker mapped to `workflow_context`, and drafts that survive a reload.
- **Extensibility**: `defineBlock` for your own cards, `onAction` for card clicks, component slots, `labels` for copy and translation, the block kit (`BlockShell`, `KeyValueList`, `Shimmer`), and a custom `ChatAdapter` for backends that don't follow the schema.
- **Entry points**: `.` (Atoms UI), `/headless` (React only), `/core` (no dependencies), `/charts` (Recharts) and `/mock` (an in-memory schema-v1 backend with demo scenarios).
- **Docs**: the README, plus the backend contract, block payload contracts and schema gaps in `docs/`.

### Compatibility

- React 18.2 or 19.
- `@neofloai/atoms` ^2.1.0, tested on 2.1.0 and 2.2.0.
- Recharts 2.12+ or 3 for the chart blocks.
- ESM and CommonJS, with TypeScript types.

### Known limitations

- The block payloads in `docs/block-contracts.md` still need sign-off from the Ask Neo and Reef backend teams.
- A paused approval card becomes live again after a reload only if the backend returns checkpoint state in conversation history (schema gap #2).
- A dropped stream can't be resumed; the answer is marked interrupted and offers Try again (schema gap #9).
- Atoms' `TableCell` logs a `:first-child` server-rendering warning in the console. This comes from Atoms, not this package.
- The license hasn't been chosen yet, so the package is marked `UNLICENSED`.
