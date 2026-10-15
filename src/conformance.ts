/**
 * `@neofloai/agentic-chat/conformance` — checks a backend against the chat standard over real
 * HTTP. Run it in a product's CI, or from the command line with `npx agentic-chat-conformance`.
 */
export {
  runConformance,
  formatReport,
  type ConformanceOptions,
  type ConformanceCheck,
  type ConformanceReport,
  type ConformanceStatus,
} from './conformance/index';
export { runConformanceCli } from './conformance/cli';
