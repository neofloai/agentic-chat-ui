import { R as RestPaths } from './rest-adapter-RF-KDV8r.js';
import './adapter-CLjeqFDx.js';
import './types-CIFoqVVK.js';

/**
 * Checks a backend against the chat standard (schema v1, revision 1.2) over real HTTP, the way
 * the library will call it. Run it in a product's CI against a dev or staging deployment:
 *
 * ```ts
 * const report = await runConformance({ baseUrl: 'https://askneo.dev.example', headers: { Cookie: session } });
 * if (!report.ok) throw new Error(formatReport(report));
 * ```
 *
 * It creates one conversation, sends one message (unless `sendMessages: false`) and deletes the
 * conversation at the end.
 */
interface ConformanceOptions {
    /** The API origin; the `/v1/...` paths are appended. */
    baseUrl: string;
    /** Auth for every request: a session cookie or a Bearer header. */
    headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
    credentials?: RequestCredentials;
    fetch?: typeof fetch;
    paths?: Partial<RestPaths>;
    /** Send real messages through endpoint 6. This calls the model, so it costs tokens. @default true */
    sendMessages?: boolean;
    /** The test message. Ask for something that makes the backend use a tool to check tool pairing. */
    prompt?: string;
    /**
     * Check that a request without the auth gets 401 `unauthenticated`. Runs only when `headers`
     * or `credentials: 'include'` carry the auth. @default true
     */
    checkUnauthenticated?: boolean;
    /** Per REST call. @default 30000 */
    timeoutMs?: number;
    /** For the whole message stream. @default 120000 */
    streamTimeoutMs?: number;
    /** Called as each check finishes, for live output. */
    onCheck?: (check: ConformanceCheck) => void;
}
type ConformanceStatus = 'pass' | 'fail' | 'warn' | 'skip';
interface ConformanceCheck {
    /** Stable id, e.g. `stream.client_message_id`. */
    id: string;
    /** The endpoint, e.g. `POST /v1/conversations/{id}/messages`. */
    endpoint: string;
    title: string;
    status: ConformanceStatus;
    detail?: string;
}
interface ConformanceReport {
    /** No check failed. Warnings don't fail the run. */
    ok: boolean;
    passed: number;
    failed: number;
    warnings: number;
    skipped: number;
    checks: ConformanceCheck[];
}
declare function runConformance(options: ConformanceOptions): Promise<ConformanceReport>;
/** A plain-text report, one line per check, for CI logs. */
declare function formatReport(report: ConformanceReport): string;

/** Runs the CLI with `argv` (without node and the script). Resolves the exit code. */
declare function runConformanceCli(argv: string[], env?: Record<string, string | undefined>, out?: (line: string) => void): Promise<number>;

export { type ConformanceCheck, type ConformanceOptions, type ConformanceReport, type ConformanceStatus, formatReport, runConformance, runConformanceCli };
