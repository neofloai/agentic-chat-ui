# Local persistence

The chat can remember state on the device, so a reload lands people back where they were: same chat, same half-typed question. You choose where it's stored and what's kept.

## Options

```ts
persistence: {
  storage: 'session',          // 'session' (default) | 'local' | 'memory' | 'none' | StorageAdapter
  namespace: 'neoflo-chat',    // key prefix
  scope: user.idHash,          // partitions keys per user
  persist: {
    activeConversation: true,  // reopen the same chat
    drafts: true,              // unsent text + uploaded attachments, per chat
    preferences: true,         // history panel, model, scope selection, anything set with usePreference
    history: false,            // conversation list + recent message histories
  },
  maxCachedConversations: 20,  // LRU cap for cached histories
  ttl: undefined,              // ms; older entries are dropped on read
  debounceMs: 400,
}
```

Pass `persistence={false}` to turn it off entirely.

## Choosing a storage

| Storage            | Survives                                   | Use it when                                                     |
| ------------------ | ------------------------------------------ | --------------------------------------------------------------- |
| `session`          | Reloads in the same tab                    | The default. Nothing lingers after the tab closes.              |
| `local`            | Browser restarts, and it syncs across tabs | People expect the chat to still be there tomorrow. Set `scope`. |
| `memory`           | Nothing                                    | Tests and demos.                                                |
| `none`             | Nothing                                    | You manage state elsewhere.                                     |
| A `StorageAdapter` | Whatever it does                           | IndexedDB, localforage, encryption at rest, a native bridge.    |

```ts
const store: StorageAdapter = {
  getItem: async (key) => (await kv.get(key)) ?? null,
  setItem: (key, value) => kv.set(key, value),
  removeItem: (key) => kv.del(key),
  keys: () => kv.keys(), // optional; lets clear() find every key
};
```

Async adapters are fine. The chat hydrates as soon as reads resolve; sync storages hydrate before the first paint.

## Guarantees

- **Scoped.** Keys are `namespace:scope:name`. Two users on one device never read each other's drafts or history.
- **Versioned.** Every entry is an envelope `{ v, savedAt, data }`. Entries from a newer library version are left alone. Corrupt or foreign entries are deleted instead of crashing the chat.
- **Safe on failure.** A full quota, private mode or a blocked storage falls back to memory for the session and reports once through `onWarning` (`storage_error`).
- **Consistent.** Only finished messages are cached. A message that was mid-stream at reload is shown as interrupted, and the conversation is refetched.
- **Server wins.** Cached history renders instantly and is replaced by the server's copy when it arrives. Decisions made in the session are kept if the server's copy doesn't carry them yet (schema gap #2).
- **SSR-safe.** Nothing touches storage during server render or at import time.

## Logout

```ts
await runtime.persistence.clear(); // removes every key this chat wrote for the current scope
runtime.dispose();
```

When you render `<AgenticChat adapter={…}>` without your own runtime, read it with `useChatRuntime()` inside the tree, or create the runtime yourself with `createChatRuntime` and pass `runtime={…}`.
