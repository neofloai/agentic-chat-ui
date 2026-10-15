/**
 * `@neofloai/agentic-chat/mock` — an in-memory backend on the chat standard, with scripted turns for every
 * built-in block. Build UI without a server, write tests, run a demo.
 */
export { createMockAdapter, type MockAdapter, type MockAdapterOptions } from './mock/adapter';
export { DEFAULT_SCENARIOS, DEFAULT_SUGGESTIONS, type MockScenario } from './mock/scenarios';
export { MockStop, type MockWriter, type PauseOptions, type ToolResultPayload } from './mock/writer';
