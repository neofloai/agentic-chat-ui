import {
  createMemoryStorage,
  createSafeStorage,
  createWebStorage,
  isPromise,
  type MaybePromise,
  type StorageAdapter,
  type StorageKind,
} from './storage';

export interface PersistOptions {
  /** The open conversation, so a reload lands back on it. @default true */
  activeConversation?: boolean;
  /** Unsent composer text and uploaded attachments, per conversation. @default true */
  drafts?: boolean;
  /** UI preferences (history panel open, model, scope selection). @default true */
  preferences?: boolean;
  /**
   * The conversation list and a cache of recent message histories, for instant loads.
   * Off by default because chat content can be sensitive; set `scope` when you turn it on.
   * @default false
   */
  history?: boolean;
}

export interface PersistenceOptions {
  /** @default 'session' */
  storage?: StorageKind | StorageAdapter;
  /** Key prefix. @default 'neoflo-chat' */
  namespace?: string;
  /**
   * Partitions storage per user, e.g. a hashed user id. Two accounts on one device never
   * read each other's drafts or history.
   */
  scope?: string;
  persist?: PersistOptions;
  /** How many message histories the cache keeps (LRU). @default 20 */
  maxCachedConversations?: number;
  /** Drop entries older than this many ms. */
  ttl?: number;
  /** Write debounce. @default 400 */
  debounceMs?: number;
}

export interface ResolvedPersistence {
  kind: StorageKind | 'custom';
  persist: Required<PersistOptions>;
  maxCachedConversations: number;
}

export interface Persister {
  readonly enabled: boolean;
  readonly config: ResolvedPersistence;
  /** Sync for sync storages, a promise for async ones. */
  read<T>(name: string): MaybePromise<T | undefined>;
  /** Debounced. */
  write(name: string, data: unknown): void;
  remove(name: string): void;
  flush(): Promise<void>;
  /** Removes every key this persister owns (call it on logout). */
  clear(): Promise<void>;
  /** Fires when another tab changed a key (local storage only). */
  onExternalChange(listener: (name: string) => void): () => void;
  dispose(): void;
}

const SCHEMA_VERSION = 1;

interface Envelope {
  v: number;
  savedAt: number;
  data: unknown;
}

/** Upgrades older envelopes. Keyed by the version being upgraded from. */
const MIGRATIONS: Record<number, (data: unknown, name: string) => unknown> = {};

const KNOWN_NAMES = ['active', 'prefs', 'drafts', 'conversations', 'thread-index'];

export function createPersister(
  options: PersistenceOptions | false | undefined,
  onError: (error: unknown) => void = () => undefined,
  now: () => number = Date.now,
): Persister {
  const opts = options || {};
  const persist: Required<PersistOptions> = {
    activeConversation: true,
    drafts: true,
    preferences: true,
    history: false,
    ...opts.persist,
  };
  const requested = options === false ? 'none' : (opts.storage ?? 'session');
  const namespace = opts.namespace ?? 'neoflo-chat';
  const prefix = `${namespace}:${opts.scope ?? 'default'}:`;
  const debounceMs = opts.debounceMs ?? 400;

  let kind: ResolvedPersistence['kind'];
  let inner: StorageAdapter | null;
  let crossTab: Storage | null = null;
  if (typeof requested === 'object') {
    kind = 'custom';
    inner = requested;
  } else if (requested === 'none') {
    kind = 'none';
    inner = null;
  } else if (requested === 'memory') {
    kind = 'memory';
    inner = createMemoryStorage();
  } else {
    const web = createWebStorage(requested);
    kind = web ? requested : 'memory';
    inner = web ?? createMemoryStorage();
    if (web && requested === 'local') crossTab = web.raw;
  }

  const config: ResolvedPersistence = { kind, persist, maxCachedConversations: opts.maxCachedConversations ?? 20 };

  if (!inner) {
    return {
      enabled: false,
      config,
      read: () => undefined,
      write: () => undefined,
      remove: () => undefined,
      flush: async () => undefined,
      clear: async () => undefined,
      onExternalChange: () => () => undefined,
      dispose: () => undefined,
    };
  }

  const storage = createSafeStorage(inner, onError);
  const pending = new Map<string, unknown>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<(name: string) => void>();

  const decode = (name: string, raw: string | null): unknown => {
    if (raw === null) return undefined;
    let env: Envelope;
    try {
      env = JSON.parse(raw) as Envelope;
    } catch {
      void storage.removeItem(prefix + name);
      return undefined;
    }
    if (!env || typeof env !== 'object' || typeof env.v !== 'number' || !('data' in env)) {
      void storage.removeItem(prefix + name);
      return undefined;
    }
    if (opts.ttl && now() - (env.savedAt ?? 0) > opts.ttl) {
      void storage.removeItem(prefix + name);
      return undefined;
    }
    let data = env.data;
    let v = env.v;
    if (v > SCHEMA_VERSION) return undefined; // written by a newer version; leave it alone
    while (v < SCHEMA_VERSION) {
      const migrate = MIGRATIONS[v];
      if (!migrate) return undefined;
      data = migrate(data, name);
      v++;
    }
    return data;
  };

  const writeNow = async (name: string, data: unknown) => {
    if (data === undefined) {
      await storage.removeItem(prefix + name);
      return;
    }
    const env: Envelope = { v: SCHEMA_VERSION, savedAt: now(), data };
    let json: string;
    try {
      json = JSON.stringify(env);
    } catch (error) {
      onError(error);
      return;
    }
    await storage.setItem(prefix + name, json);
  };

  const flush = async () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    const entries = [...pending];
    pending.clear();
    await Promise.all(entries.map(([name, data]) => writeNow(name, data)));
  };

  const schedule = () => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      void flush();
    }, debounceMs);
  };

  const onPageHide = () => {
    void flush();
  };
  const onVisibility = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') void flush();
  };
  const onStorage = (e: StorageEvent) => {
    if (e.storageArea !== crossTab || !e.key?.startsWith(prefix)) return;
    const name = e.key.slice(prefix.length);
    for (const l of [...listeners]) l(name);
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener?.('visibilitychange', onVisibility);
    if (crossTab) window.addEventListener('storage', onStorage);
  }

  return {
    enabled: true,
    config,
    read<T>(name: string): MaybePromise<T | undefined> {
      if (pending.has(name)) return pending.get(name) as T | undefined;
      const raw = storage.getItem(prefix + name);
      return isPromise(raw) ? raw.then((r) => decode(name, r) as T | undefined) : (decode(name, raw) as T | undefined);
    },
    write(name, data) {
      pending.set(name, data);
      schedule();
    },
    remove(name) {
      pending.set(name, undefined);
      schedule();
    },
    flush,
    async clear() {
      pending.clear();
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      const listed = storage.keys ? await storage.keys() : [];
      const names = new Set<string>(KNOWN_NAMES.map((n) => prefix + n));
      for (const k of listed) if (k.startsWith(prefix)) names.add(k);
      const index = decode('thread-index', await storage.getItem(prefix + 'thread-index'));
      if (Array.isArray(index)) for (const e of index) if (e && typeof e.id === 'string') names.add(`${prefix}thread:${e.id}`);
      await Promise.all([...names].map((k) => storage.removeItem(k)));
    },
    onExternalChange(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      void flush();
      if (typeof window !== 'undefined') {
        window.removeEventListener('pagehide', onPageHide);
        document.removeEventListener?.('visibilitychange', onVisibility);
        window.removeEventListener('storage', onStorage);
      }
      listeners.clear();
    },
  };
}
