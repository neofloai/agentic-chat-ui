// Local declaration so the library's types never depend on @types/node. At runtime this is the
// global (or the bundler's replacement of `process.env.NODE_ENV`).
declare const process: { env: Record<string, string | undefined> };

/**
 * True in development builds. Bundlers replace the literal `process.env.NODE_ENV`; where
 * nothing does (plain ESM in a browser) the reference throws and this reports production.
 */
export function isDev(): boolean {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
}
