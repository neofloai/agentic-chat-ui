import { runConformance, type ConformanceOptions } from './index';

const USAGE = `Usage: agentic-chat-conformance --base-url <url> [options]

Checks a chat backend against the Neoflo chat standard over HTTP. It creates one
conversation, sends one message and deletes the conversation again.

Options:
  --base-url <url>      API origin (or CHAT_BASE_URL)
  --header "Name: v"    A request header, e.g. "Cookie: session=…" or
                        "Authorization: Bearer …". Repeatable. (or CHAT_HEADERS,
                        one header per line)
  --no-messages         Skip endpoint 6, which calls the model and costs tokens
  --prompt <text>       The test message (ask for something that uses a tool)
  --no-auth-check       Skip the 401 check for a request without the headers
  --json                Print the report as JSON
  --help                Show this help

Exit code: 0 when every check passes (warnings allowed), 1 when one fails, 2 on bad usage.`;

/** Runs the CLI with `argv` (without node and the script). Resolves the exit code. */
export async function runConformanceCli(
  argv: string[],
  env: Record<string, string | undefined> = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
    ?.env ?? {},
  out: (line: string) => void = (line) => console.log(line),
): Promise<number> {
  const headers: [string, string][] = [];
  let baseUrl = env.CHAT_BASE_URL;
  let json = false;
  const options: Partial<ConformanceOptions> = {};

  const addHeader = (raw: string) => {
    const i = raw.indexOf(':');
    if (i <= 0) throw new Error(`Bad header "${raw}". Use "Name: value".`);
    headers.push([raw.slice(0, i).trim(), raw.slice(i + 1).trim()]);
  };

  try {
    for (const line of (env.CHAT_HEADERS ?? '').split('\n')) if (line.trim()) addHeader(line);
    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i]!;
      const value = () => {
        const v = argv[++i];
        if (v === undefined) throw new Error(`${arg} needs a value.`);
        return v;
      };
      if (arg === '--help' || arg === '-h') {
        out(USAGE);
        return 0;
      } else if (arg === '--base-url') baseUrl = value();
      else if (arg === '--header' || arg === '-H') addHeader(value());
      else if (arg === '--no-messages') options.sendMessages = false;
      else if (arg === '--prompt') options.prompt = value();
      else if (arg === '--no-auth-check') options.checkUnauthenticated = false;
      else if (arg === '--json') json = true;
      else throw new Error(`Unknown option ${arg}.`);
    }
    if (!baseUrl) throw new Error('--base-url is required.');
  } catch (error) {
    out(`${error instanceof Error ? error.message : String(error)}\n\n${USAGE}`);
    return 2;
  }

  const report = await runConformance({
    ...options,
    baseUrl,
    headers: headers.length ? headers : undefined,
    onCheck: json
      ? undefined
      : (c) =>
          out(`${c.status.toUpperCase().padEnd(4)}  ${c.endpoint.padEnd(46)} ${c.title}${c.detail ? `\n      ${c.detail}` : ''}`),
  });
  out(
    json
      ? JSON.stringify(report, null, 2)
      : `\n${report.ok ? 'Conforms' : 'Does not conform'}: ${report.passed} passed, ${report.failed} failed, ${report.warnings} warnings, ${report.skipped} skipped`,
  );
  return report.ok ? 0 : 1;
}
