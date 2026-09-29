import type {
  Attachment,
  ContentBlock,
  ConversationBootstrap,
  ConversationSummary,
  HitlDecision,
  SendMessageBody,
  Source,
  StreamEvent,
  WorkflowContext,
} from '../protocol/types';
import type { ChatAdapter, ProtocolWarning } from '../transport/adapter';
import { ChatApiError, isAbortError } from '../transport/errors';
import { createPersister, type PersistenceOptions, type Persister } from '../persistence/persister';
import { isPromise } from '../persistence/storage';
import { createStore, frameScheduler, type Scheduler, type Store } from '../store/store';
import { interruptRun, reduceStreamEvent, type DeltaHandler } from '../store/stream-reducer';
import { metaFromBootstrap, normalizeConversationDetail, toConversationItem } from '../store/normalize';
import { sortConversations } from '../store/conversations';
import {
  createThreadState,
  type ChatErrorInfo,
  type ChatMessage,
  type ComposerAttachment,
  type ComposerState,
  type ConversationItem,
  type ConversationsState,
  type PendingCheckpoint,
  type ScopeGroup,
  type ScopeSelection,
  type ScopeState,
  type ThreadState,
} from '../store/types';
import { toErrorInfo } from './error-info';
import {
  defaultScopeToRequest,
  initialSelection,
  mergeWorkflowContexts,
  sanitizeSelection,
  selectAll,
  type ScopeConfig,
} from './scope';
import { Emitter, Inflight, uid, type Unsubscribe } from './utils';

export const NEW_THREAD_KEY = '__new__';

export interface UploadOptions {
  signal: AbortSignal;
  /** Report progress as a fraction from 0 to 1. */
  onProgress: (fraction: number) => void;
}

export interface AttachmentOptions {
  /** Uploads a file wherever your app stores files and returns its schema `Attachment`. */
  upload: (file: File, options: UploadOptions) => Promise<Attachment>;
  /** The file input's `accept`, e.g. `.pdf,.xlsx,image/*`. */
  accept?: string;
  /** Bytes. */
  maxSize?: number;
  /** @default 10 */
  maxFiles?: number;
}

export interface RuntimeWarning {
  code:
    | ProtocolWarning['code']
    | 'storage_error'
    | 'attachment_rejected'
    | 'attachments_uploading'
    | 'busy'
    | 'awaiting_decision'
    | 'unknown_checkpoint'
    | 'revalidate_failed'
    | 'cancel_failed';
  message: string;
  data?: unknown;
}

export interface ChatRuntimeOptions {
  adapter: ChatAdapter;
  /** Local persistence. `false` turns it off. Defaults to session storage. */
  persistence?: PersistenceOptions | false;
  /** The composer's workflow picker. */
  scope?: ScopeConfig;
  /** Extra context from the host page, merged into every send (e.g. the invoice on screen). */
  workflowContext?: WorkflowContext[] | (() => WorkflowContext[] | undefined);
  /** Enables the attach button. The schema has no upload endpoint, so the host uploads. */
  attachments?: AttachmentOptions;
  /**
   * `eager` creates the conversation as soon as a new chat opens, which is what gets the
   * server's greeting and suggested prompts. `lazy` waits for the first message.
   * @default 'eager'
   */
  conversationCreation?: 'eager' | 'lazy';
  hitl?: {
    /** Whether the user can type while a card waits for a decision. @default 'disabled' */
    composerWhilePaused?: 'disabled' | 'enabled';
  };
  /** A stream that sends nothing for this long is treated as dropped. @default 60000 */
  streamIdleTimeoutMs?: number;
  /** How many conversations to keep in memory. @default 20 */
  maxThreads?: number;
  /** Refresh the history list when the window regains focus. @default true */
  refreshOnFocus?: boolean;
  onEvent?: (event: StreamEvent, context: { conversationId: string }) => void;
  onError?: (error: ChatErrorInfo, raw: unknown) => void;
  onWarning?: (warning: RuntimeWarning) => void;
  /** @internal Notification scheduler; tests pass a sync one. */
  scheduler?: Scheduler;
  /** @internal Clock. */
  now?: () => number;
}

export interface SendOptions {
  /** Defaults to the active conversation. */
  conversationId?: string | null;
  /** Per-turn source override. */
  sources?: Source[];
  /** Defaults to the composer's uploaded attachments. */
  attachments?: Attachment[];
  workflowContext?: WorkflowContext[];
}

export interface ThreadHandle {
  readonly key: string;
  readonly store: Store<ThreadState>;
  readonly composer: Store<ComposerState>;
}

export interface SessionState {
  /** The thread key on screen: a conversation id, or `__new__` for an unsaved chat. */
  activeKey: string;
  activeId: string | null;
  /** Persisted state has been read. */
  hydrated: boolean;
}

export type RuntimeEvents = {
  event: [StreamEvent, { conversationId: string }];
  error: [ChatErrorInfo, unknown];
  warning: [RuntimeWarning];
  activeChange: [string | null];
};

export interface AddAttachmentsResult {
  added: ComposerAttachment[];
  rejected: { file: File; reason: string }[];
}

export interface ChatRuntime {
  readonly adapter: ChatAdapter;
  readonly conversations: Store<ConversationsState>;
  readonly session: Store<SessionState>;
  readonly scope: Store<ScopeState>;
  readonly preferences: Store<Record<string, unknown>>;
  readonly config: {
    conversationCreation: 'eager' | 'lazy';
    composerWhilePaused: 'disabled' | 'enabled';
    attachments?: Pick<AttachmentOptions, 'accept' | 'maxSize' | 'maxFiles'>;
    hasScope: boolean;
  };

  /** Hydrates, loads history and opens the active chat. Safe to call more than once. */
  start(): Promise<void>;
  getThread(conversationId: string | null): ThreadHandle;
  activeThread(): ThreadHandle;

  newConversation(): Promise<string | null>;
  selectConversation(conversationId: string | null): Promise<void>;
  refreshConversations(): Promise<void>;
  renameConversation(conversationId: string, title: string): Promise<void>;
  archiveConversation(conversationId: string, archived: boolean): Promise<void>;
  deleteConversation(conversationId: string): Promise<void>;
  setModel(model: string, conversationId?: string): Promise<void>;
  setDefaultSources(sources: Source[], conversationId?: string): Promise<void>;

  send(text: string, options?: SendOptions): Promise<void>;
  resume(checkpointId: string, decision: HitlDecision, options?: { conversationId?: string }): Promise<void>;
  cancel(conversationId?: string | null): Promise<void>;
  retry(conversationId?: string | null): Promise<void>;
  canRetry(conversationId?: string | null): boolean;

  setDraft(text: string, conversationId?: string | null): void;
  addAttachments(files: Iterable<File>, conversationId?: string | null): AddAttachmentsResult;
  removeAttachment(attachmentId: string, conversationId?: string | null): void;

  setScopeSelection(selection: ScopeSelection): void;
  setScopeGroups(groups: ScopeGroup[]): void;
  setPreference(key: string, value: unknown): void;

  /** Lets block definitions take over delta handling. Set by `ChatProvider`. */
  setDeltaResolver(resolver: ((block: ContentBlock) => DeltaHandler | undefined) | undefined): void;

  on<K extends keyof RuntimeEvents>(type: K, listener: (...args: RuntimeEvents[K]) => void): Unsubscribe;

  readonly persistence: {
    readonly enabled: boolean;
    /** Removes everything this chat stored locally. Call it on logout. */
    clear(): Promise<void>;
    flush(): Promise<void>;
  };

  dispose(): void;
}

interface InternalThread extends ThreadHandle {
  key: string;
  abort?: AbortController;
  abortReason?: 'timeout' | 'dispose' | 'deleted';
  cancelRequested: boolean;
  cancelTimer?: ReturnType<typeof setTimeout>;
  lastRequest?:
    | { kind: 'send'; body: SendMessageBody; userMessageId: string }
    | { kind: 'resume'; body: SendMessageBody; checkpointId: string };
  loadToken: number;
  /** Created on the server this session and not yet written to. */
  fresh: boolean;
  lastLoadedAt?: number;
  uploads: Map<string, AbortController>;
  onFirstEvent?: () => void;
}

interface PersistedDraft {
  text?: string;
  attachments?: Attachment[];
}

interface PersistedPrefs {
  values?: Record<string, unknown>;
  scope?: ScopeSelection;
}

interface PersistedThread {
  meta: ThreadState['meta'];
  messages: ChatMessage[];
  pendingCheckpoint?: PendingCheckpoint;
}

const BUSY = new Set(['submitting', 'streaming', 'cancelling']);
const isBusy = (s: ThreadState) => BUSY.has(s.run.status);
const IMMEDIATE = new Set<StreamEvent['type']>(['message_start', 'checkpoint', 'message_stop', 'error']);

function matchesAccept(file: File, accept: string): boolean {
  const tokens = accept
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (!tokens.length) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();
  return tokens.some((t) => {
    if (t.startsWith('.')) return name.endsWith(t);
    if (t.endsWith('/*')) return type.startsWith(t.slice(0, -1));
    return type === t;
  });
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 10 ? Math.round(v) : Math.round(v * 10) / 10} ${units[i]}`;
}

function completedOnly(messages: ChatMessage[]): ChatMessage[] {
  return messages
    .filter((m) => m.status !== 'streaming')
    .map((m) => ({ ...m, blocks: m.blocks.filter((b) => b.status !== 'streaming') }));
}

/**
 * Keeps HITL outcomes the user produced in this session when a server reload doesn't carry
 * them (schema gap #2), so a resolved card doesn't flip back to asking.
 */
function mergeLocalCheckpoints(prev: ChatMessage[], next: ChatMessage[]): ChatMessage[] {
  const known = new Map<string, NonNullable<ChatMessage['blocks'][number]['checkpoint']>>();
  for (const m of prev)
    for (const b of m.blocks) if (b.checkpoint && b.checkpoint.status !== 'pending') known.set(b.id, b.checkpoint);
  if (!known.size) return next;
  return next.map((m) => ({
    ...m,
    blocks: m.blocks.map((b) => {
      const local = known.get(b.id);
      if (!local) return b;
      if (!b.checkpoint || b.checkpoint.status === 'pending') return { ...b, checkpoint: local };
      return b;
    }),
  }));
}

class Runtime implements ChatRuntime {
  readonly adapter: ChatAdapter;
  readonly conversations: Store<ConversationsState>;
  readonly session: Store<SessionState>;
  readonly scope: Store<ScopeState>;
  readonly preferences: Store<Record<string, unknown>>;
  readonly config: ChatRuntime['config'];
  readonly persistence: ChatRuntime['persistence'];

  private readonly options: ChatRuntimeOptions;
  private readonly scheduler: Scheduler;
  private readonly now: () => number;
  private readonly idleMs: number;
  private readonly maxThreads: number;
  private readonly persister: Persister;
  private readonly threads = new Map<string, InternalThread>();
  private readonly emitter = new Emitter<RuntimeEvents>();
  private readonly inflight = new Inflight();
  private readonly createdLocally = new Map<string, number>();
  private readonly cleanups: (() => void)[] = [];
  private deltaResolver?: (block: ContentBlock) => DeltaHandler | undefined;
  private drafts: Record<string, PersistedDraft> = {};
  private persistedScope?: ScopeSelection;
  private threadIndex: { id: string; savedAt: number }[] = [];
  private listToken = 0;
  private lastFocusRefresh = 0;
  private startPromise?: Promise<void>;
  private creating?: Promise<string>;
  private readonly hydration: Promise<void>;
  private disposed = false;

  constructor(options: ChatRuntimeOptions) {
    this.options = options;
    this.adapter = options.adapter;
    this.scheduler = options.scheduler ?? frameScheduler;
    this.now = options.now ?? Date.now;
    this.idleMs = options.streamIdleTimeoutMs ?? 60_000;
    this.maxThreads = Math.max(2, options.maxThreads ?? 20);
    this.config = {
      conversationCreation: options.conversationCreation ?? 'eager',
      composerWhilePaused: options.hitl?.composerWhilePaused ?? 'disabled',
      attachments: options.attachments
        ? { accept: options.attachments.accept, maxSize: options.attachments.maxSize, maxFiles: options.attachments.maxFiles }
        : undefined,
      hasScope: Boolean(options.scope),
    };
    this.persister = createPersister(
      options.persistence,
      (error) =>
        this.warn({ code: 'storage_error', message: 'Local storage is unavailable; keeping chat state in memory.', data: error }),
      this.now,
    );
    this.persistence = {
      enabled: this.persister.enabled,
      clear: () => this.persister.clear(),
      flush: () => this.persister.flush(),
    };

    this.conversations = createStore<ConversationsState>({ items: [], status: 'idle', runningIds: [] }, this.scheduler);
    this.session = createStore<SessionState>({ activeKey: NEW_THREAD_KEY, activeId: null, hydrated: false }, this.scheduler);
    this.scope = createStore<ScopeState>(
      { groups: [], selection: {}, status: options.scope ? 'loading' : 'ready' },
      this.scheduler,
    );
    this.preferences = createStore<Record<string, unknown>>({}, this.scheduler);

    this.threads.set(NEW_THREAD_KEY, this.createThread(NEW_THREAD_KEY, null));
    this.hydration = this.hydrate();
    this.initScope();
  }

  // ------------------------------------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------------------------------------

  start(): Promise<void> {
    if (!this.startPromise) {
      this.startPromise = (async () => {
        await this.hydration;
        if (this.disposed) return;
        this.listenForFocus();
        this.cleanups.push(this.persister.onExternalChange((name) => this.onExternalChange(name)));
        const list = this.refreshConversations().catch(() => undefined);
        const activeId = this.session.getState().activeId;
        if (activeId) {
          const t = this.thread(activeId);
          this.setActive(activeId);
          await this.loadThread(t, false, true);
          if (this.thread(activeId).store.getState().loadStatus === 'error' && this.session.getState().activeId === activeId) {
            // The remembered conversation is gone; start fresh rather than showing an error.
            if (this.config.conversationCreation === 'eager') await this.newConversation().catch(() => undefined);
            else this.setActive(null);
          }
        } else if (this.config.conversationCreation === 'eager') {
          await this.newConversation().catch(() => undefined);
        }
        await list;
      })();
    }
    return this.startPromise;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const t of this.threads.values()) {
      if (t.abort) {
        t.abortReason = 'dispose';
        t.abort.abort();
      }
      for (const u of t.uploads.values()) u.abort();
      clearTimeout(t.cancelTimer);
    }
    for (const c of this.cleanups.splice(0)) c();
    this.persister.dispose();
    this.emitter.clear();
  }

  on<K extends keyof RuntimeEvents>(type: K, listener: (...args: RuntimeEvents[K]) => void): Unsubscribe {
    return this.emitter.on(type, listener);
  }

  setDeltaResolver(resolver: ((block: ContentBlock) => DeltaHandler | undefined) | undefined): void {
    this.deltaResolver = resolver;
  }

  // ------------------------------------------------------------------------------------------
  // Threads
  // ------------------------------------------------------------------------------------------

  getThread(conversationId: string | null): ThreadHandle {
    return this.thread(conversationId);
  }

  activeThread(): ThreadHandle {
    return this.thread(this.session.getState().activeId);
  }

  private active(): InternalThread {
    return this.thread(this.session.getState().activeId);
  }

  private target(conversationId: string | null | undefined): InternalThread {
    return conversationId === undefined ? this.active() : this.thread(conversationId);
  }

  private thread(conversationId: string | null): InternalThread {
    const key = conversationId ?? NEW_THREAD_KEY;
    const existing = this.threads.get(key);
    if (existing) {
      // LRU touch.
      this.threads.delete(key);
      this.threads.set(key, existing);
      return existing;
    }
    const t = this.createThread(key, conversationId);
    this.threads.set(key, t);
    this.evictThreads();
    return t;
  }

  private createThread(key: string, conversationId: string | null): InternalThread {
    const draft = this.drafts[key];
    const store = createStore(createThreadState(conversationId), this.scheduler);
    const composer = createStore<ComposerState>(
      {
        text: draft?.text ?? '',
        attachments: (draft?.attachments ?? []).map((a) => ({
          id: uid('att_'),
          name: a.filename,
          size: a.size,
          contentType: a.content_type,
          status: 'ready',
          progress: 1,
          attachment: a,
        })),
      },
      this.scheduler,
    );
    const t: InternalThread = { key, store, composer, cancelRequested: false, loadToken: 0, fresh: false, uploads: new Map() };
    composer.subscribe(() => this.persistDraft(t));
    if (conversationId && this.persister.config.persist.history) this.hydrateThreadFromCache(t, conversationId);
    return t;
  }

  private evictThreads(): void {
    while (this.threads.size > this.maxThreads) {
      const activeKey = this.session?.getState().activeKey;
      // Never evict a thread something is rendering (the composer always has one internal listener).
      const victim = [...this.threads.values()].find(
        (t) =>
          t.key !== NEW_THREAD_KEY &&
          t.key !== activeKey &&
          !t.abort &&
          t.uploads.size === 0 &&
          t.store.listenerCount() === 0 &&
          t.composer.listenerCount() <= 1,
      );
      if (!victim) return;
      this.threads.delete(victim.key);
    }
  }

  private setActive(conversationId: string | null): void {
    const key = conversationId ?? NEW_THREAD_KEY;
    this.thread(conversationId);
    if (this.session.getState().activeKey === key) return;
    this.session.setState((s) => ({ ...s, activeKey: key, activeId: conversationId }));
    if (this.persister.config.persist.activeConversation) this.persister.write('active', conversationId);
    this.emitter.emit('activeChange', conversationId);
  }

  // ------------------------------------------------------------------------------------------
  // Conversations
  // ------------------------------------------------------------------------------------------

  async newConversation(): Promise<string | null> {
    const current = this.active();
    const st = current.store.getState();
    const untouched = st.messages.length === 0 && !isBusy(st) && current.composer.getState().text.trim() === '';
    if (untouched && st.loadStatus !== 'error') {
      if (st.conversationId === null && this.config.conversationCreation === 'lazy') return null;
      if (st.conversationId !== null && current.fresh) return st.conversationId;
    }
    if (this.config.conversationCreation === 'lazy') {
      this.setActive(null);
      return null;
    }
    // Reuse any chat created this session that nobody has written in yet.
    const spare = [...this.threads.values()].reverse().find((t) => {
      const s = t.store.getState();
      return t.fresh && s.conversationId && s.messages.length === 0 && !isBusy(s) && !t.composer.getState().text.trim();
    });
    if (spare) {
      const id = spare.store.getState().conversationId!;
      this.setActive(id);
      return id;
    }
    if (this.creating) return this.creating;
    const draft = this.thread(null);
    this.setActive(null);
    draft.store.setState((s) => ({ ...s, loadStatus: 'loading', loadError: undefined }));
    this.creating = (async () => {
      try {
        const boot = await this.adapter.createConversation();
        if (!this.disposed) this.adoptNewThread(draft, boot);
        return boot.conversation_id;
      } catch (error) {
        const info = toErrorInfo(error);
        draft.store.setState((s) => ({ ...s, loadStatus: 'error', loadError: info }));
        this.reportError(info, error);
        throw error;
      } finally {
        this.creating = undefined;
      }
    })();
    return this.creating;
  }

  /** Re-keys the unsaved `__new__` thread to the id the server just created. */
  private adoptNewThread(draft: InternalThread, boot: ConversationBootstrap): InternalThread {
    const id = boot.conversation_id;
    this.threads.delete(NEW_THREAD_KEY);
    draft.key = id;
    draft.fresh = true;
    draft.lastLoadedAt = this.now();
    this.threads.set(id, draft);
    this.createdLocally.set(id, this.now());
    draft.store.setState((s) => ({
      ...s,
      conversationId: id,
      loadStatus: 'ready',
      loadError: undefined,
      meta: { ...metaFromBootstrap(boot), sources: boot.sources ?? s.meta.sources },
    }));
    if (this.drafts[NEW_THREAD_KEY]) {
      this.drafts[id] = this.drafts[NEW_THREAD_KEY]!;
      delete this.drafts[NEW_THREAD_KEY];
      this.writeDrafts();
    }
    this.threads.set(NEW_THREAD_KEY, this.createThread(NEW_THREAD_KEY, null));
    if (this.session.getState().activeKey === NEW_THREAD_KEY) {
      this.session.setState((s) => ({ ...s, activeKey: id, activeId: id }));
      if (this.persister.config.persist.activeConversation) this.persister.write('active', id);
      this.emitter.emit('activeChange', id);
    }
    // An empty chat stays out of history until the first message is sent.
    if (draft.store.getState().messages.length) this.upsertConversation(toConversationItem(boot));
    return draft;
  }

  async selectConversation(conversationId: string | null): Promise<void> {
    if (conversationId === null) {
      await this.newConversation().catch(() => undefined);
      return;
    }
    const t = this.thread(conversationId);
    this.setActive(conversationId);
    await this.loadThread(t);
  }

  /** `restoring`: a remembered conversation that's gone is expected, not an error to report. */
  private async loadThread(t: InternalThread, force = false, restoring = false): Promise<void> {
    const id = t.store.getState().conversationId;
    if (!id) return;
    const st = t.store.getState();
    if (isBusy(st)) return; // never clobber a live stream
    if (!force && st.loadStatus === 'ready' && t.lastLoadedAt && this.now() - t.lastLoadedAt < 5_000) return;
    const token = ++t.loadToken;
    if (st.loadStatus !== 'ready') t.store.setState((s) => ({ ...s, loadStatus: 'loading', loadError: undefined }));
    try {
      const detail = await this.inflight.run(`get:${id}`, () => this.adapter.getConversation(id));
      if (token !== t.loadToken || this.disposed || isBusy(t.store.getState())) return;
      const prev = t.store.getState();
      const n = normalizeConversationDetail(detail, prev.meta);
      t.lastLoadedAt = this.now();
      t.store.setState((s) => ({
        ...s,
        loadStatus: 'ready',
        loadError: undefined,
        meta: n.meta,
        messages: mergeLocalCheckpoints(prev.messages, n.messages),
        pendingCheckpoint: n.pendingCheckpoint,
        run: n.pendingCheckpoint ? { status: 'paused', messageId: n.pendingCheckpoint.messageId } : { status: 'idle' },
      }));
      this.upsertConversation(
        {
          id,
          title: n.meta.title,
          createdAt: detail.created_at,
          updatedAt: detail.updated_at || detail.created_at,
          archived: n.meta.archived,
        },
        false,
      );
      this.persistThread(t);
    } catch (error) {
      if (token !== t.loadToken || this.disposed) return;
      const info = toErrorInfo(error);
      if (error instanceof ChatApiError && error.status === 404) this.removeConversationLocal(id);
      if (t.store.getState().loadStatus === 'ready' && t.store.getState().messages.length) {
        this.warn({ code: 'revalidate_failed', message: 'Showing saved messages; could not refresh them.', data: info });
        return;
      }
      t.store.setState((s) => ({ ...s, loadStatus: 'error', loadError: info }));
      if (restoring && error instanceof ChatApiError && error.status === 404) {
        this.warn({
          code: 'revalidate_failed',
          message: 'The remembered conversation no longer exists; starting a new chat.',
          data: info,
        });
        return;
      }
      this.reportError(info, error);
    }
  }

  refreshConversations(): Promise<void> {
    return this.inflight.run('list', async () => {
      const token = ++this.listToken;
      if (this.conversations.getState().status !== 'ready') {
        this.conversations.setState((s) => ({ ...s, status: 'loading', error: undefined }));
      }
      try {
        const list = await this.adapter.listConversations();
        if (token !== this.listToken || this.disposed) return;
        const server = (Array.isArray(list) ? list : [])
          .filter((c): c is ConversationSummary => Boolean(c && typeof c.conversation_id === 'string'))
          .map(toConversationItem);
        const serverIds = new Set(server.map((i) => i.id));
        const now = this.now();
        // Keep conversations created moments ago that the list endpoint may not show yet.
        const keep = this.conversations
          .getState()
          .items.filter((i) => !serverIds.has(i.id) && now - (this.createdLocally.get(i.id) ?? -Infinity) < 60_000);
        this.conversations.setState((s) => ({
          ...s,
          items: sortConversations([...server, ...keep]),
          status: 'ready',
          error: undefined,
        }));
        this.persistConversations();
      } catch (error) {
        if (token !== this.listToken) return;
        const info = toErrorInfo(error);
        this.conversations.setState((s) => ({ ...s, status: s.items.length ? 'ready' : 'error', error: info }));
        this.reportError(info, error);
      }
    });
  }

  async renameConversation(conversationId: string, title: string): Promise<void> {
    const clean = title.trim().slice(0, 200);
    if (!clean) return;
    const prevItem = this.conversations.getState().items.find((i) => i.id === conversationId);
    const t = this.threads.get(conversationId);
    const prevTitle = t?.store.getState().meta.title;
    this.patchLocal(conversationId, { title: clean });
    try {
      await this.adapter.updateConversation(conversationId, { title: clean });
    } catch (error) {
      this.patchLocal(conversationId, { title: prevItem?.title ?? prevTitle ?? 'New chat' });
      this.reportError(toErrorInfo(error), error);
      throw error;
    }
  }

  async archiveConversation(conversationId: string, archived: boolean): Promise<void> {
    const prev = this.conversations.getState().items.find((i) => i.id === conversationId)?.archived ?? !archived;
    this.patchLocal(conversationId, { archived });
    try {
      await this.adapter.updateConversation(conversationId, { archived });
    } catch (error) {
      this.patchLocal(conversationId, { archived: prev });
      this.reportError(toErrorInfo(error), error);
      throw error;
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const items = this.conversations.getState().items;
    const index = items.findIndex((i) => i.id === conversationId);
    const item = items[index];
    this.removeConversationLocal(conversationId);
    const t = this.threads.get(conversationId);
    if (t?.abort) {
      t.abortReason = 'deleted';
      t.abort.abort();
    }
    if (this.session.getState().activeId === conversationId) {
      await this.newConversation().catch(() => this.setActive(null));
    }
    try {
      await this.adapter.deleteConversation(conversationId);
      this.threads.delete(conversationId);
      delete this.drafts[conversationId];
      this.writeDrafts();
      this.dropThreadCache(conversationId);
    } catch (error) {
      if (item) {
        this.conversations.setState((s) => {
          const next = [...s.items];
          next.splice(Math.min(index, next.length), 0, item);
          return { ...s, items: next };
        });
        this.persistConversations();
      }
      this.reportError(toErrorInfo(error), error);
      throw error;
    }
  }

  async setModel(model: string, conversationId?: string): Promise<void> {
    const t = this.target(conversationId);
    const id = t.store.getState().conversationId;
    const prev = t.store.getState().meta.model;
    t.store.setState((s) => ({ ...s, meta: { ...s.meta, model } }));
    const values = { ...this.preferences.getState(), model };
    this.preferences.setState(values);
    this.writePrefs();
    if (!id) return;
    try {
      await this.adapter.updateConversation(id, { model });
    } catch (error) {
      t.store.setState((s) => ({ ...s, meta: { ...s.meta, model: prev } }));
      this.reportError(toErrorInfo(error), error);
      throw error;
    }
  }

  async setDefaultSources(sources: Source[], conversationId?: string): Promise<void> {
    const t = this.target(conversationId);
    const id = t.store.getState().conversationId;
    const prev = t.store.getState().meta.sources;
    t.store.setState((s) => ({ ...s, meta: { ...s.meta, sources } }));
    if (!id) return;
    try {
      await this.adapter.updateConversation(id, { sources });
    } catch (error) {
      t.store.setState((s) => ({ ...s, meta: { ...s.meta, sources: prev } }));
      this.reportError(toErrorInfo(error), error);
      throw error;
    }
  }

  private patchLocal(conversationId: string, patch: Partial<Pick<ConversationItem, 'title' | 'archived'>>): void {
    this.conversations.setState((s) => ({ ...s, items: s.items.map((i) => (i.id === conversationId ? { ...i, ...patch } : i)) }));
    const t = this.threads.get(conversationId);
    if (t) t.store.setState((s) => ({ ...s, meta: { ...s.meta, ...patch } }));
    this.persistConversations();
  }

  private upsertConversation(item: ConversationItem, bump = true): void {
    this.conversations.setState((s) => {
      const exists = s.items.some((i) => i.id === item.id);
      const items = exists ? s.items.map((i) => (i.id === item.id ? { ...i, ...item } : i)) : [item, ...s.items];
      return { ...s, items: bump || !exists ? sortConversations(items) : items };
    });
    this.persistConversations();
  }

  private touchConversation(conversationId: string): void {
    const t = this.threads.get(conversationId);
    const meta = t?.store.getState().meta;
    const existing = this.conversations.getState().items.find((i) => i.id === conversationId);
    const now = new Date(this.now()).toISOString();
    this.upsertConversation({
      id: conversationId,
      title: meta?.title ?? existing?.title ?? 'New chat',
      createdAt: existing?.createdAt ?? meta?.createdAt ?? now,
      updatedAt: now,
      archived: existing?.archived ?? false,
    });
  }

  private removeConversationLocal(conversationId: string): void {
    this.conversations.setState((s) => ({ ...s, items: s.items.filter((i) => i.id !== conversationId) }));
    this.persistConversations();
  }

  private setRunning(conversationId: string, running: boolean): void {
    this.conversations.setState((s) => {
      const has = s.runningIds.includes(conversationId);
      if (running === has) return s;
      return { ...s, runningIds: running ? [...s.runningIds, conversationId] : s.runningIds.filter((x) => x !== conversationId) };
    });
  }

  // ------------------------------------------------------------------------------------------
  // Turns
  // ------------------------------------------------------------------------------------------

  async send(text: string, options: SendOptions = {}): Promise<void> {
    const t = this.target(options.conversationId);
    const trimmed = text.trim();
    const composer = t.composer.getState();
    if (!options.attachments && composer.attachments.some((a) => a.status === 'uploading')) {
      this.warn({ code: 'attachments_uploading', message: 'Wait for attachments to finish uploading.' });
      return;
    }
    const attachments =
      options.attachments ??
      composer.attachments.filter((a) => a.status === 'ready' && a.attachment).map((a) => a.attachment as Attachment);
    if (!trimmed && attachments.length === 0) return;

    const state = t.store.getState();
    if (isBusy(state)) {
      this.warn({ code: 'busy', message: 'A reply is still streaming.' });
      return;
    }
    if (state.pendingCheckpoint && this.config.composerWhilePaused === 'disabled') {
      this.warn({ code: 'awaiting_decision', message: 'Respond to the card above first.' });
      return;
    }

    const now = this.now();
    const userMessage: ChatMessage = {
      id: uid('local_'),
      role: 'user',
      blocks: [
        {
          id: uid('blk_'),
          type: 'text',
          category: 'content',
          status: 'complete',
          data: { id: uid('blk_'), type: 'text', category: 'content', text: trimmed },
        },
      ],
      status: 'complete',
      createdAt: new Date(now).toISOString(),
      attachments: attachments.length ? attachments : undefined,
      local: true,
    };
    t.store.setState((s) => ({
      ...s,
      messages: [...s.messages, userMessage],
      run: { status: 'submitting' },
      pendingCheckpoint: undefined,
    }));
    t.composer.setState({ text: '', attachments: [] });

    let conversationId = t.store.getState().conversationId;
    if (!conversationId) {
      try {
        // An eager create may already be in flight for this very thread; wait for it.
        if (this.creating) {
          await this.creating.catch(() => undefined);
          conversationId = t.store.getState().conversationId;
        }
        if (!conversationId) {
          const boot = await this.adapter.createConversation();
          this.adoptNewThread(t, boot);
          conversationId = boot.conversation_id;
        }
      } catch (error) {
        const info = toErrorInfo(error);
        t.store.setState((s) => ({ ...s, run: { status: 'error', error: info } }));
        t.lastRequest = undefined;
        this.reportError(info, error);
        return;
      }
    }
    t.fresh = false;
    this.touchConversation(conversationId);

    const body: SendMessageBody = {
      stream: true,
      message: { role: 'user', type: 'default', content: { default: trimmed } },
      ...this.requestExtras(options),
      ...(attachments.length ? { attachments } : {}),
    };
    t.lastRequest = { kind: 'send', body, userMessageId: userMessage.id };
    t.onFirstEvent = () =>
      t.store.setState((s) => ({
        ...s,
        messages: s.messages.map((m) => (m.id === userMessage.id ? { ...m, local: false } : m)),
      }));
    await this.stream(t, conversationId, body);
  }

  async resume(checkpointId: string, decision: HitlDecision, options: { conversationId?: string } = {}): Promise<void> {
    const t = this.findCheckpointThread(checkpointId, options.conversationId);
    if (!t) {
      this.warn({ code: 'unknown_checkpoint', message: `No card is waiting on checkpoint ${checkpointId}.` });
      return;
    }
    const state = t.store.getState();
    const conversationId = state.conversationId;
    const block = state.messages.flatMap((m) => m.blocks).find((b) => b.checkpoint?.id === checkpointId);
    const cp = block?.checkpoint;
    if (!conversationId || !block || !cp) return;
    if (cp.status === 'submitting' || cp.status === 'resolved') return; // double-submit guard
    if (isBusy(state)) {
      this.warn({ code: 'busy', message: 'A reply is still streaming.' });
      return;
    }

    const setCheckpoint = (patch: Partial<typeof cp>) =>
      t.store.setState((s) => ({
        ...s,
        messages: s.messages.map((m) => ({
          ...m,
          blocks: m.blocks.map((b) =>
            b.checkpoint?.id === checkpointId ? { ...b, checkpoint: { ...b.checkpoint, ...patch } } : b,
          ),
        })),
      }));

    const pending = state.pendingCheckpoint;
    setCheckpoint({ status: 'submitting', decision, error: undefined });
    t.store.setState((s) => ({ ...s, pendingCheckpoint: undefined, run: { status: 'submitting' } }));

    // Exactly the schema's resume shape: the turn's context was set when it started.
    const body: SendMessageBody = {
      stream: true,
      message: { role: 'user', type: 'hitl', content: { checkpoint_id: checkpointId, decision } },
    };
    t.lastRequest = { kind: 'resume', body, checkpointId };
    t.onFirstEvent = () => setCheckpoint({ status: 'resolved' });
    await this.stream(t, conversationId, body);

    const after = t.store
      .getState()
      .messages.flatMap((m) => m.blocks)
      .find((b) => b.checkpoint?.id === checkpointId)?.checkpoint;
    if (after?.status === 'submitting') {
      // Nothing came back: let the user try the decision again.
      const error = t.store.getState().run.error;
      setCheckpoint({ status: 'failed', error });
      t.store.setState((s) => ({
        ...s,
        pendingCheckpoint: pending,
        run: { status: 'paused', messageId: pending?.messageId, error },
      }));
    }
  }

  private findCheckpointThread(checkpointId: string, conversationId?: string): InternalThread | undefined {
    const candidates = conversationId ? [this.thread(conversationId)] : [this.active(), ...this.threads.values()];
    return candidates.find((t) =>
      t.store.getState().messages.some((m) => m.blocks.some((b) => b.checkpoint?.id === checkpointId)),
    );
  }

  async cancel(conversationId?: string | null): Promise<void> {
    const t = this.target(conversationId);
    const s = t.store.getState();
    if (!isBusy(s) || !t.abort || t.cancelRequested) return;
    t.cancelRequested = true;
    t.store.setState((st) => ({ ...st, run: { ...st.run, status: 'cancelling' } }));
    if (s.run.messageId) {
      await this.fireCancel(t);
    } else {
      // No message_id yet: wait briefly for message_start, then stop locally.
      t.cancelTimer = setTimeout(() => t.abort?.abort(), 3_000);
    }
  }

  private async fireCancel(t: InternalThread): Promise<void> {
    clearTimeout(t.cancelTimer);
    const { conversationId, run } = t.store.getState();
    const controller = t.abort;
    if (conversationId && run.messageId) {
      try {
        await this.adapter.cancelMessage(conversationId, run.messageId);
      } catch (error) {
        this.warn({ code: 'cancel_failed', message: 'The server did not confirm the cancel; stopping locally.', data: error });
      }
    }
    // Give the server a moment to close with message_stop(cancelled), then stop reading.
    if (controller && !controller.signal.aborted) t.cancelTimer = setTimeout(() => controller.abort(), 1_500);
  }

  canRetry(conversationId?: string | null): boolean {
    const t = this.target(conversationId);
    const s = t.store.getState();
    return (
      Boolean(t.lastRequest) &&
      !isBusy(s) &&
      (s.run.status === 'error' || s.messages.some((m) => m.status === 'interrupted' || m.status === 'error'))
    );
  }

  async retry(conversationId?: string | null): Promise<void> {
    const t = this.target(conversationId);
    const req = t.lastRequest;
    const state = t.store.getState();
    const id = state.conversationId;
    if (!req || !id || isBusy(state)) return;
    if (req.kind === 'resume') {
      const cp = state.messages.flatMap((m) => m.blocks).find((b) => b.checkpoint?.id === req.checkpointId)?.checkpoint;
      if (cp && cp.status === 'failed') {
        await this.resume(req.checkpointId, (req.body.message.content as { decision: HitlDecision }).decision, {
          conversationId: id,
        });
        return;
      }
    }
    // Drop the failed assistant reply; a new one replaces it.
    t.store.setState((s) => {
      const idx = req.kind === 'send' ? s.messages.findIndex((m) => m.id === req.userMessageId) : -1;
      const messages = s.messages.filter(
        (m, i) => !(m.role === 'assistant' && (m.status === 'error' || m.status === 'interrupted') && i > idx),
      );
      return { ...s, messages, run: { status: 'submitting' } };
    });
    await this.stream(t, id, req.body);
  }

  private requestExtras(
    options: Pick<SendOptions, 'sources' | 'workflowContext'>,
  ): Pick<SendMessageBody, 'workflow_context' | 'sources'> {
    const cfg = this.options.scope;
    const sc = this.scope.getState();
    const scoped: Partial<Pick<SendMessageBody, 'workflow_context' | 'sources'>> =
      cfg && sc.status === 'ready' ? (cfg.toRequest ?? defaultScopeToRequest)(sc.selection, sc.groups) : {};
    const host =
      typeof this.options.workflowContext === 'function' ? this.options.workflowContext() : this.options.workflowContext;
    const workflow_context = mergeWorkflowContexts(scoped.workflow_context, host, options.workflowContext);
    const sources = options.sources ?? scoped.sources;
    return { ...(workflow_context ? { workflow_context } : {}), ...(sources ? { sources } : {}) };
  }

  private apply(t: InternalThread, event: StreamEvent): void {
    t.store.setState(
      (s) => {
        let next = reduceStreamEvent(s, event, { now: this.now(), resolveDeltaHandler: this.deltaResolver });
        if (t.cancelRequested && next.run.status === 'streaming') next = { ...next, run: { ...next.run, status: 'cancelling' } };
        return next;
      },
      { batch: !IMMEDIATE.has(event.type) },
    );
  }

  private async stream(t: InternalThread, conversationId: string, body: SendMessageBody): Promise<void> {
    const controller = new AbortController();
    t.abort = controller;
    t.abortReason = undefined;
    t.cancelRequested = false;
    this.setRunning(conversationId, true);

    let sawStop = false;
    let sawAny = false;
    let idle: ReturnType<typeof setTimeout> | undefined;
    const armIdle = () => {
      clearTimeout(idle);
      idle = setTimeout(() => {
        t.abortReason = 'timeout';
        controller.abort();
      }, this.idleMs);
    };
    armIdle();

    try {
      const events = this.adapter.sendMessage(conversationId, body, {
        signal: controller.signal,
        onWarning: (w) => this.warn(w),
      });
      for await (const event of events) {
        if (controller.signal.aborted && t.abortReason) break;
        armIdle();
        if (!sawAny) {
          sawAny = true;
          t.onFirstEvent?.();
          t.onFirstEvent = undefined;
        }
        this.emitter.emit('event', event, { conversationId });
        this.options.onEvent?.(event, { conversationId });
        this.apply(t, event);
        if (event.type === 'message_start' && t.cancelRequested) void this.fireCancel(t);
        if (event.type === 'message_stop') {
          sawStop = true;
          if (event.title) this.patchLocal(conversationId, { title: event.title });
        }
        if (event.type === 'error') {
          this.reportError(t.store.getState().run.error ?? toErrorInfo(new Error(event.message)), event);
        }
      }
      if (!sawStop && t.abortReason !== 'dispose' && t.abortReason !== 'deleted') {
        this.finishInterrupted(t, t.cancelRequested ? undefined : this.endedEarly(t));
      }
    } catch (error) {
      if (t.abortReason === 'dispose' || t.abortReason === 'deleted') {
        // Nothing to show: the thread is going away.
      } else if (t.cancelRequested && (isAbortError(error) || controller.signal.aborted)) {
        this.finishInterrupted(t, undefined);
      } else {
        const info: ChatErrorInfo =
          t.abortReason === 'timeout'
            ? { type: 'timeout', message: 'The reply stopped arriving. Try again.', retryable: true }
            : toErrorInfo(error);
        if (!sawAny) {
          t.store.setState((s) => ({ ...s, run: { status: 'error', error: info } }));
        } else {
          this.finishInterrupted(t, info);
        }
        this.reportError(info, error);
      }
    } finally {
      clearTimeout(idle);
      clearTimeout(t.cancelTimer);
      t.abort = undefined;
      t.cancelRequested = false;
      t.onFirstEvent = undefined;
      t.store.flush();
      this.setRunning(conversationId, false);
      if (!this.disposed && t.abortReason !== 'deleted') {
        this.touchConversation(conversationId);
        this.persistThread(t);
      }
    }
  }

  private endedEarly(t: InternalThread): ChatErrorInfo | undefined {
    const s = t.store.getState();
    // A stream that already reported an error has said everything it will say.
    if (s.run.status === 'error' && s.run.error) return s.run.error;
    return { type: 'stream_ended', message: 'The reply ended unexpectedly. Try again.', retryable: true };
  }

  private finishInterrupted(t: InternalThread, error: ChatErrorInfo | undefined): void {
    t.store.setState((s) => interruptRun(s, error, { now: this.now() }));
  }

  // ------------------------------------------------------------------------------------------
  // Composer
  // ------------------------------------------------------------------------------------------

  setDraft(text: string, conversationId?: string | null): void {
    const t = this.target(conversationId);
    t.composer.setState((s) => (s.text === text ? s : { ...s, text }));
  }

  addAttachments(files: Iterable<File>, conversationId?: string | null): AddAttachmentsResult {
    const cfg = this.options.attachments;
    const t = this.target(conversationId);
    const list = [...files];
    const result: AddAttachmentsResult = { added: [], rejected: [] };
    if (!cfg) {
      result.rejected = list.map((file) => ({ file, reason: 'Attachments are not enabled.' }));
      return result;
    }
    const maxFiles = cfg.maxFiles ?? 10;
    let room = maxFiles - t.composer.getState().attachments.length;
    for (const file of list) {
      if (room <= 0) {
        result.rejected.push({ file, reason: `You can attach up to ${maxFiles} files.` });
        continue;
      }
      if (cfg.maxSize && file.size > cfg.maxSize) {
        result.rejected.push({ file, reason: `${file.name} is larger than ${formatBytes(cfg.maxSize)}.` });
        continue;
      }
      if (cfg.accept && !matchesAccept(file, cfg.accept)) {
        result.rejected.push({ file, reason: `${file.name} isn't a supported file type.` });
        continue;
      }
      room--;
      const id = uid('att_');
      const controller = new AbortController();
      t.uploads.set(id, controller);
      const entry: ComposerAttachment = {
        id,
        name: file.name,
        size: file.size,
        contentType: file.type || 'application/octet-stream',
        status: 'uploading',
        progress: 0,
      };
      result.added.push(entry);
      t.composer.setState((s) => ({ ...s, attachments: [...s.attachments, entry] }));
      const update = (patch: Partial<ComposerAttachment>, batch = false) =>
        t.composer.setState((s) => ({ ...s, attachments: s.attachments.map((a) => (a.id === id ? { ...a, ...patch } : a)) }), {
          batch,
        });
      Promise.resolve()
        .then(() =>
          cfg.upload(file, {
            signal: controller.signal,
            onProgress: (p) => update({ progress: Math.max(0, Math.min(1, Number(p) || 0)) }, true),
          }),
        )
        .then((attachment) => {
          if (!controller.signal.aborted) update({ status: 'ready', progress: 1, attachment });
        })
        .catch((error) => {
          if (!controller.signal.aborted) update({ status: 'error', error: toErrorInfo(error).message });
        })
        .finally(() => t.uploads.delete(id));
    }
    if (result.rejected.length) {
      this.warn({ code: 'attachment_rejected', message: result.rejected.map((r) => r.reason).join(' '), data: result.rejected });
    }
    return result;
  }

  removeAttachment(attachmentId: string, conversationId?: string | null): void {
    const t = this.target(conversationId);
    t.uploads.get(attachmentId)?.abort();
    t.uploads.delete(attachmentId);
    t.composer.setState((s) => ({ ...s, attachments: s.attachments.filter((a) => a.id !== attachmentId) }));
  }

  // ------------------------------------------------------------------------------------------
  // Scope & preferences
  // ------------------------------------------------------------------------------------------

  private initScope(): void {
    const cfg = this.options.scope;
    if (!cfg) return;
    const apply = (groups: ScopeGroup[]) => {
      const safe = Array.isArray(groups) ? groups : [];
      const persisted = sanitizeSelection(this.persistedScope, safe);
      this.scope.setState({ groups: safe, selection: persisted ?? initialSelection(cfg, safe), status: 'ready' });
    };
    const fail = (error: unknown) => {
      this.scope.setState((s) => ({ ...s, status: 'error' }));
      this.reportError(toErrorInfo(error), error);
    };
    try {
      const groups = typeof cfg.groups === 'function' ? cfg.groups() : cfg.groups;
      if (isPromise(groups)) groups.then(apply, fail);
      else apply(groups);
    } catch (error) {
      fail(error);
    }
  }

  setScopeGroups(groups: ScopeGroup[]): void {
    const sc = this.scope.getState();
    const kept = sanitizeSelection(sc.selection, groups);
    let selection = kept && Object.keys(kept).length ? kept : initialSelection(this.options.scope, groups);
    // A default that no longer matches the new catalog means "everything", not "nothing".
    if (!Object.keys(selection).length && this.options.scope?.defaultSelection !== 'none') selection = selectAll(groups);
    this.scope.setState({ groups, selection, status: 'ready' });
  }

  setScopeSelection(selection: ScopeSelection): void {
    const sc = this.scope.getState();
    this.scope.setState({ ...sc, selection: sanitizeSelection(selection, sc.groups) ?? {} });
    this.writePrefs();
  }

  setPreference(key: string, value: unknown): void {
    const prefs = this.preferences.getState();
    if (Object.is(prefs[key], value)) return;
    this.preferences.setState({ ...prefs, [key]: value });
    this.writePrefs();
  }

  // ------------------------------------------------------------------------------------------
  // Persistence
  // ------------------------------------------------------------------------------------------

  private hydrate(): Promise<void> {
    const p = this.persister;
    const cfg = p.config.persist;
    const tasks: Promise<void>[] = [];
    const load = <T>(name: string, apply: (v: T | undefined) => void) => {
      try {
        const v = p.read<T>(name);
        if (isPromise(v)) tasks.push(v.then(apply, () => undefined));
        else apply(v);
      } catch {
        // Corrupt storage never blocks the chat.
      }
    };
    if (p.enabled) {
      if (cfg.preferences) {
        load<PersistedPrefs>('prefs', (v) => {
          if (v?.values && typeof v.values === 'object')
            this.preferences.setState({ ...v.values, ...this.preferences.getState() });
          if (v?.scope) {
            this.persistedScope = v.scope;
            const sc = this.scope.getState();
            if (sc.status === 'ready' && sc.groups.length) {
              const kept = sanitizeSelection(v.scope, sc.groups);
              if (kept) this.scope.setState({ ...sc, selection: kept });
            }
          }
        });
      }
      if (cfg.drafts) {
        load<Record<string, PersistedDraft>>('drafts', (v) => {
          if (!v || typeof v !== 'object') return;
          this.drafts = { ...v, ...this.drafts };
          for (const t of this.threads.values()) {
            const d = this.drafts[t.key];
            if (d?.text && !t.composer.getState().text) t.composer.setState((s) => ({ ...s, text: d.text ?? '' }));
          }
        });
      }
      if (cfg.history) {
        load<{ id: string; savedAt: number }[]>('thread-index', (v) => {
          if (Array.isArray(v)) this.threadIndex = v.filter((e) => e && typeof e.id === 'string');
        });
        load<ConversationItem[]>('conversations', (v) => {
          if (!Array.isArray(v) || this.conversations.getState().status === 'ready') return;
          const items = v.filter((i) => i && typeof i.id === 'string');
          this.conversations.setState((s) => ({ ...s, items: sortConversations(items), status: 'ready' }));
        });
      }
      if (cfg.activeConversation) {
        load<string | null>('active', (v) => {
          if (typeof v === 'string' && v && this.session.getState().activeId === null) {
            this.thread(v);
            this.session.setState((s) => ({ ...s, activeKey: v, activeId: v }));
          }
        });
      }
    }
    const done = () => this.session.setState((s) => ({ ...s, hydrated: true }));
    if (!tasks.length) {
      done();
      return Promise.resolve();
    }
    return Promise.all(tasks).then(done, done);
  }

  private hydrateThreadFromCache(t: InternalThread, id: string): void {
    const apply = (cached: PersistedThread | undefined) => {
      if (!cached || !Array.isArray(cached.messages)) return;
      const s = t.store.getState();
      if (s.loadStatus === 'ready' || isBusy(s) || s.messages.length) return;
      t.store.setState({
        ...s,
        loadStatus: 'ready',
        meta: { ...s.meta, ...cached.meta },
        messages: cached.messages,
        pendingCheckpoint: cached.pendingCheckpoint,
        run: cached.pendingCheckpoint ? { status: 'paused', messageId: cached.pendingCheckpoint.messageId } : { status: 'idle' },
      });
    };
    try {
      const v = this.persister.read<PersistedThread>(`thread:${id}`);
      if (isPromise(v)) v.then(apply, () => undefined);
      else apply(v);
    } catch {
      // ignore
    }
  }

  private persistThread(t: InternalThread): void {
    if (!this.persister.enabled || !this.persister.config.persist.history) return;
    const s = t.store.getState();
    const id = s.conversationId;
    if (!id) return;
    const data: PersistedThread = { meta: s.meta, messages: completedOnly(s.messages), pendingCheckpoint: s.pendingCheckpoint };
    this.persister.write(`thread:${id}`, data);
    const index = this.threadIndex.filter((e) => e.id !== id);
    index.push({ id, savedAt: this.now() });
    const max = this.persister.config.maxCachedConversations;
    while (index.length > max) {
      const old = index.shift();
      if (old) this.persister.remove(`thread:${old.id}`);
    }
    this.threadIndex = index;
    this.persister.write('thread-index', index);
  }

  private dropThreadCache(id: string): void {
    if (!this.persister.config.persist.history) return;
    this.persister.remove(`thread:${id}`);
    this.threadIndex = this.threadIndex.filter((e) => e.id !== id);
    this.persister.write('thread-index', this.threadIndex);
  }

  private persistConversations(): void {
    if (!this.persister.config.persist.history) return;
    this.persister.write('conversations', this.conversations.getState().items);
  }

  private persistDraft(t: InternalThread): void {
    if (!this.persister.config.persist.drafts) return;
    const c = t.composer.getState();
    const attachments = c.attachments.filter((a) => a.status === 'ready' && a.attachment).map((a) => a.attachment as Attachment);
    const prev = this.drafts[t.key];
    if (!c.text && !attachments.length) {
      if (!prev) return;
      delete this.drafts[t.key];
    } else {
      if (prev && prev.text === c.text && (prev.attachments?.length ?? 0) === attachments.length) return;
      this.drafts[t.key] = { text: c.text, attachments };
    }
    this.writeDrafts();
  }

  private writeDrafts(): void {
    if (!this.persister.config.persist.drafts) return;
    this.persister.write('drafts', { ...this.drafts });
  }

  private writePrefs(): void {
    if (!this.persister.config.persist.preferences) return;
    const data: PersistedPrefs = { values: this.preferences.getState(), scope: this.scope.getState().selection };
    this.persister.write('prefs', data);
  }

  private onExternalChange(name: string): void {
    if (name === 'conversations' && this.persister.config.persist.history) {
      const v = this.persister.read<ConversationItem[]>('conversations');
      const apply = (items: ConversationItem[] | undefined) => {
        if (Array.isArray(items)) this.conversations.setState((s) => ({ ...s, items: sortConversations(items) }));
      };
      if (isPromise(v)) v.then(apply, () => undefined);
      else apply(v);
    }
  }

  private listenForFocus(): void {
    if (this.options.refreshOnFocus === false || typeof window === 'undefined') return;
    const onFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      const now = this.now();
      if (now - this.lastFocusRefresh < 30_000) return;
      this.lastFocusRefresh = now;
      void this.refreshConversations().catch(() => undefined);
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener?.('visibilitychange', onFocus);
    this.lastFocusRefresh = this.now();
    this.cleanups.push(() => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener?.('visibilitychange', onFocus);
    });
  }

  // ------------------------------------------------------------------------------------------
  // Reporting
  // ------------------------------------------------------------------------------------------

  private reportError(info: ChatErrorInfo, raw: unknown): void {
    this.emitter.emit('error', info, raw);
    this.options.onError?.(info, raw);
  }

  private warn(warning: RuntimeWarning): void {
    this.emitter.emit('warning', warning);
    this.options.onWarning?.(warning);
  }
}

/** Creates the chat engine. Framework-free; `ChatProvider` binds it to React. */
export function createChatRuntime(options: ChatRuntimeOptions): ChatRuntime {
  if (!options?.adapter) throw new Error('[agentic-chat] createChatRuntime needs an `adapter`.');
  return new Runtime(options);
}
