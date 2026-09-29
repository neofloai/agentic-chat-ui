// README: Persistence with your own storage (IndexedDB, an encrypted store…)
import { createChatRuntime, createRestAdapter, type StorageAdapter } from '@neofloai/agentic-chat/core';

declare const kv: {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
  keys(): Promise<string[]>;
};

// Async adapters are fine. The chat hydrates once they resolve.
const encryptedStore: StorageAdapter = {
  getItem: async (key) => (await kv.get(key)) ?? null,
  setItem: (key, value) => kv.set(key, value),
  removeItem: (key) => kv.del(key),
  keys: () => kv.keys(),
};

export const runtime = createChatRuntime({
  adapter: createRestAdapter({ baseUrl: 'https://api.example.com' }),
  persistence: {
    storage: encryptedStore,
    scope: 'user-7f3a', // a hash of the signed-in user, so accounts never share state
    persist: { drafts: true, activeConversation: true, preferences: true, history: true },
    maxCachedConversations: 50,
    ttl: 7 * 24 * 60 * 60 * 1000, // forget cached chats after a week
  },
});
