---
'@neofloai/agentic-chat': minor
---

Support the Neoflo chat standard, revision 1.2 (the schema Ask Neo now implements). Backends on schema v1 keep working.

- **Config endpoint.** The chat reads `GET /v1/chat/config` once per session. Its `capabilities` show or hide attachments, the scope picker, Archive and approval cards; its models, labelled sources, workflows and limits fill the UI. A backend without the endpoint gets the defaults, or the new `capabilities` option.
- **Tool calls.** A `tool_use` and its `tool_result` render as one card with the results. A tool whose result never arrived shows "Interrupted" instead of spinning.
- **Errors by code.** Errors follow the standard envelope and are mapped by code first, then by HTTP status. `ChatErrorInfo.type` is now the server's code when it sends one (`session_busy`, `connection_expired`, `askneo.workspace_required`…), and errors gain `action`, `status`, `requestId`, `details` and `sourceId`. Error cards show the request id.
- **Sign-in and connections.** `onUnauthorized` receives `{ code, message, requestId }`, so the host can tell sign-in from a gate or workspace picker. The new `onConnectionRequired` handles `connection_required` / `connection_expired`: reconnect, return `true`, and the message is retried once. If it returns `false`, the error stays on screen with a Reconnect button; without the hook, only the message shows.
- **Safe retries.** Every message carries a `client_message_id`. A retry of an unconfirmed message reuses it, `message_start` swaps the optimistic message for the saved one, and 409 `duplicate_message` reloads the conversation.
- **Models and sources.** `selected_model` is read on endpoints 1–4 and sent per message when the backend allows it. Only source ids listed in the config are sent, and the server's sources replace the ones the client sent after a PATCH. Credentials are never kept or stored.
- **Stop.** With `cancel: "disconnect"`, or when cancel returns `false`, Stop closes the stream at once.
- **Product blocks.** `<product>.<name>` blocks render their `fallback_text` in apps without the product's renderer, and `ext` is passed through untouched.
- **New entry: `@neofloai/agentic-chat/conformance`.** `runConformance()` and the `agentic-chat-conformance` CLI check a backend against the standard over HTTP, for a product's CI.
- **Mock backend.** It follows the standard (config, `selected_model`, client ids, error envelopes, paired tool calls), and its writer gains `tool()`. Its invoice-processing connection starts expired, so the demo can show Reconnect; `adapter.connect(sourceId)` connects it.
