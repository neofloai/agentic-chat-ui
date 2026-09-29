import { f as ContentBlock, H as HitlDecision, i as SuggestedPrompt, b as ConversationDetail } from './types-BYSMQU8i.cjs';
import { C as ChatAdapter } from './adapter-CA1yC1wF.cjs';

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
    /** Emits a HITL block + checkpoint and ends the turn paused. */
    pause(options: PauseOptions): Promise<void>;
    error(errorType: string, message: string, retryAfter?: number): Promise<void>;
    wait(ms: number): Promise<void>;
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
    models?: string[];
    /** Conversations that already exist. */
    seed?: ConversationDetail[];
    /** Keep the mock database in localStorage under this key, so a demo survives reloads. */
    persistKey?: string;
}
/**
 * An in-memory schema-v1 backend with scripted demo turns for every built-in block. Use it to
 * build UI without a server, in tests, and in the public demo.
 */
declare function createMockAdapter(options?: MockAdapterOptions): ChatAdapter & {
    reset(): void;
};

export { DEFAULT_SCENARIOS, DEFAULT_SUGGESTIONS, type MockAdapterOptions, type MockScenario, MockStop, type MockWriter, type PauseOptions, createMockAdapter };
