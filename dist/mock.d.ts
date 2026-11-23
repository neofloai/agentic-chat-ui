import { g as ContentBlock, H as HitlDecision, j as SuggestedPrompt, C as ChatConfig, m as ConnectionState, c as ConversationDetail } from './types-CIFoqVVK.js';
import { C as ChatAdapter } from './adapter-CLjeqFDx.js';

/** Thrown inside a scenario when the turn was cancelled or aborted. */
declare class MockStop extends Error {
    readonly reason: 'cancelled' | 'aborted';
    constructor(reason: 'cancelled' | 'aborted');
}
interface PauseOptions {
    block: Omit<ContentBlock, 'id'> & {
        id?: string;
    };
    requires?: unknown;
    /** Runs when the user answers; writes the rest of the turn. */
    onResume: (writer: MockWriter, decision: HitlDecision) => Promise<void>;
}
/** What a scenario writes with. Every call respects cancel and abort. */
interface MockWriter {
    status(label: string): Promise<void>;
    /** Streams markdown word by word (with `snapshot` on every delta, like the schema says). */
    text(markdown: string, options?: {
        speed?: number;
    }): Promise<void>;
    thinking(text: string, options?: {
        speed?: number;
        durationMs?: number;
    }): Promise<void>;
    /** Emits a complete block (start then stop). Pass `snapshots` to stream intermediate states. */
    block(block: Omit<ContentBlock, 'id'> & {
        id?: string;
    }, options?: {
        snapshots?: unknown[];
        interval?: number;
        startWith?: Record<string, unknown>;
    }): Promise<ContentBlock>;
    /**
     * Emits a standard tool call: a `tool_use` block, then (after `durationMs`) its `tool_result`
     * with `tool_use_id`. Pass `result: null` to end without a result, as an interrupted tool.
     */
    tool(name: string, input: Record<string, unknown>, result: ToolResultPayload | null, options?: {
        durationMs?: number;
        title?: string;
    }): Promise<ContentBlock>;
    /** Emits a HITL block + checkpoint and ends the turn paused. */
    pause(options: PauseOptions): Promise<void>;
    error(errorType: string, message: string, retryAfter?: number, details?: Record<string, unknown>): Promise<void>;
    wait(ms: number): Promise<void>;
}
/** The payload of a `tool_result` block (the fields Ask Neo sends). */
interface ToolResultPayload {
    is_error?: boolean;
    error_code?: string | null;
    result_count?: number;
    results?: {
        title: string;
        snippet?: string;
        url?: string | null;
    }[];
    [key: string]: unknown;
}

interface MockScenario {
    name: string;
    match: (prompt: string) => boolean;
    run: (writer: MockWriter, prompt: string) => Promise<void>;
}
declare const DEFAULT_SUGGESTIONS: SuggestedPrompt[];
declare const DEFAULT_SCENARIOS: MockScenario[];

interface MockAdapterOptions {
    /** Checked in order; the first whose `match` accepts the prompt runs. */
    scenarios?: MockScenario[];
    /** Also try the built-in demo scenarios after yours. @default true */
    includeDefaultScenarios?: boolean;
    /** Delay for REST calls, ms. @default 250 */
    latency?: number;
    /** Delay between streamed words, ms. @default 28 */
    speed?: number;
    greeting?: string;
    suggestedPrompts?: SuggestedPrompt[];
    /** Model ids. The first is the default. */
    models?: string[];
    /**
     * What `GET /v1/chat/config` returns. Fields you pass replace the demo config's; `null`
     * makes the mock behave like a backend without the config endpoint.
     */
    config?: Partial<ChatConfig> | null;
    /**
     * Connected systems and their status. A prompt that mentions "invoice processing" or
     * "reconnect" fails with 422 `connection_expired` until `invoice_processing` is connected
     * (call `adapter.connect('invoice_processing')`, e.g. from `onConnectionRequired`).
     * @default { invoice_processing: 'expired' }
     */
    connections?: Record<string, ConnectionState>;
    /** Conversations that already exist. */
    seed?: ConversationDetail[];
    /** Keep the mock database in localStorage under this key, so a demo survives reloads. */
    persistKey?: string;
}
interface MockAdapter extends ChatAdapter {
    getConfig(): Promise<ChatConfig | null>;
    /** Clears the database and reloads the seed. */
    reset(): void;
    /** Marks a connected system as connected, as a backend would after `PUT /v1/connections/{id}`. */
    connect(sourceId: string): void;
}
/**
 * An in-memory backend on the chat standard (schema v1, revision 1.2) with scripted demo turns
 * for every built-in block. Use it to build UI without a server, in tests, and in the public demo.
 */
declare function createMockAdapter(options?: MockAdapterOptions): MockAdapter;

export { DEFAULT_SCENARIOS, DEFAULT_SUGGESTIONS, type MockAdapter, type MockAdapterOptions, type MockScenario, MockStop, type MockWriter, type PauseOptions, type ToolResultPayload, createMockAdapter };
