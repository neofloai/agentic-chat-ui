# @neofloai/agentic-chat

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
