/**
 * `@neofloai/agentic-chat/mock` — an in-memory schema-v1 backend with scripted turns for every
 * built-in block. Build UI without a server, write tests, run a demo.
 */
export { createMockAdapter, type MockAdapterOptions } from './mock/adapter';
export { DEFAULT_SCENARIOS, DEFAULT_SUGGESTIONS, type MockScenario } from './mock/scenarios';
export { MockStop, type MockWriter, type PauseOptions } from './mock/writer';
