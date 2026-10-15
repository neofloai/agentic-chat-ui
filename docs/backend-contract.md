# Backend contract

This page is for teams building a backend that `@neofloai/agentic-chat` talks to. It restates the Neoflo chat standard (schema v1, revision 1.2) from the client's side: what the library sends, what it expects back, and how it behaves when something goes wrong. Ask Neo is the first product on it; any other product implements the same endpoints and adds its own values through the config and `ext`.

Block payloads (what goes inside `content_block_*`) live in [block-contracts.md](block-contracts.md). What the standard still leaves open is in [schema-gaps.md](schema-gaps.md). To check a backend against this page, run the [conformance check](#8-conformance-check).

## 1. Rules for every endpoint

**Auth, identity and credentials**

- **Login** is a Bearer header or a session cookie, chosen per product. The client sends whatever `headers` the host app configures, or the cookie with `credentials: 'include'`.
- **Who the user is** (user, workspace, tenant) comes only from the session. No request or response body carries `user_id`, `workspace_id`, `tenant_id` or `object`.
- **Credentials for other systems** (an ERP, Zoho, Freshdesk, invoice processing) live only on the server, as a workspace connection. They never appear in chat requests or responses.
- **The browser only sees a connection's status:** a source's `meta.connection` is `{ "status": "connected" | "expired" | "missing", "expires_at": "…" | null }` and nothing else.
- A missing or expired connection returns 422 `connection_required` or `connection_expired` with `details.source`, before the stream opens. If it expires mid-reply, send a stream `error` with the same code.
- Cookies are `HttpOnly; Secure; SameSite=Lax` (or `None` when cross-site). POST, PATCH and DELETE check `Origin` or a CSRF token. CORS allows credentials only for listed origins, never `*`.

**Errors**

Every non-2xx response uses one envelope, and HTTP errors and stream `error` events share one list of codes:

```json
{
  "error": {
    "type": "connection_expired",
    "message": "Reconnect invoice processing to continue.",
    "retry_after": null,
    "request_id": "req_01HZX4",
    "details": { "source": "invoice_processing" }
  }
}
```

`message` is shown to the user. `request_id` is also sent as the `X-Request-Id` header. A product adds its own codes as `<product>.<code>`. The client reads the code first and falls back to the HTTP status only for codes it doesn't know:

| Code                                        | HTTP     | What the client does                                                                              |
| ------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `invalid_request`                           | 422      | Shows the message.                                                                                |
| `unsupported_feature`                       | 422      | Shows the message. Turn the feature off in the config so the UI hides it.                         |
| `connection_required`, `connection_expired` | 422      | Calls the host's `onConnectionRequired(sourceId)`, then retries once; else shows Reconnect.       |
| `unauthenticated`                           | 401      | Calls the host's `onUnauthorized({ code })` once and retries the request if it returns true.      |
| `access_denied`                             | 403      | Shows the message. No retry.                                                                      |
| `not_found`                                 | 404      | Removes the chat from history. A 404 on DELETE counts as deleted.                                 |
| `session_busy`                              | 409      | Shows "a reply is already in progress" with Try again.                                            |
| `duplicate_message`                         | 409      | Reloads the conversation to show the reply the first attempt started. No error is shown.          |
| `rate_limited`                              | 429      | Counts down `retry_after` (or `Retry-After`) before Try again.                                    |
| `upstream_unavailable`                      | 502, 503 | Offers Try again.                                                                                 |
| `internal`                                  | 500      | Offers Try again.                                                                                 |
| `<product>.<code>`                          | any      | Behaves as its HTTP status. A 401 product code (`askneo.gate_required`) goes to `onUnauthorized`. |

**General**

- Paths are `/v1/...` relative to the product's base URL. The client's `paths` option remaps them.
- Ids are opaque strings. Times are ISO-8601 UTC.
- Both sides ignore fields, events and block types they don't know, so either can add things without breaking the other.
- Product-only fields go in `ext.<product id>`, never next to the shared fields.
- Timeouts: REST calls time out after 30 s. A stream has no total limit but counts as dropped after 60 s without any event, so send `: ping` after 15 s of silence.
- Retries: the client retries GET, PATCH, DELETE and cancel up to 2 times on network errors, 5xx and 429. It never retries POST `/conversation` or POST `/messages` automatically.

## 2. Endpoints

| #   | Request                                                                     | The client expects                                                                                                                                                  |
| --- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | `GET /v1/chat/config`                                                       | What this backend supports (section 3). Called once per session. A 404 means "no config": the host's switches apply.                                                |
| 1   | `POST /v1/conversation`, optional body `{ title, model, sources }`          | 201 with the conversation object plus `greeting` and `suggested_prompts` (`{ label, prompt }[]`, the chip shows `label` and sends `prompt`).                        |
| 2   | `GET /v1/conversations`                                                     | `{ "conversations": [...], "next_cursor": null }`. Items carry `conversation_id`, `title`, `selected_model`, `archived`, `message_count`, timestamps. No `sources`. |
| 3   | `GET /v1/conversations/{id}`                                                | The conversation object plus `messages[]`, oldest first. A 404 removes the chat from history.                                                                       |
| 4   | `PATCH /v1/conversations/{id}` with `title`, `model`, `sources`, `archived` | The conversation object. The client keeps the `sources` from this response, not the ones it sent. `archived` only with the `archive` capability.                    |
| 5   | `DELETE /v1/conversations/{id}`                                             | 204. A 404 also counts as success.                                                                                                                                  |
| 6   | `POST /v1/conversations/{id}/messages`                                      | An SSE stream (section 4).                                                                                                                                          |
| 7   | `POST /v1/conversations/{id}/messages/cancel` with `{ "message_id" }`       | `{ "status": true \| false }` (section 5).                                                                                                                          |

The conversation object (endpoints 1, 3, 4):

```json
{
  "conversation_id": "6650f1c2a9b8d3e4f5a6b7c8",
  "title": "New chat",
  "subtitle": "Ask Neo",
  "archived": false,
  "selected_model": "claude-haiku-4-5",
  "sources": [
    { "id": "search_v2", "enabled": true, "meta": { "search_v2_chunk_size": 10 } },
    {
      "id": "invoice_processing",
      "enabled": false,
      "meta": { "connection": { "status": "connected", "expires_at": "2026-10-09T09:00:00Z" } }
    }
  ],
  "message_count": 0,
  "created_at": "2026-10-06T09:12:00Z",
  "updated_at": "2026-10-06T09:12:00Z",
  "ext": { "askneo": {} }
}
```

Messages (endpoint 3) carry `message_id`, `role`, `content` (a block array), `stop_reason`, `created_at`, and on assistant messages `run_id`, `model` and optional `usage`. User messages carry the `client_message_id` they were sent with, and the `sources`, `attachments` and `workflow_context` the turn used. `ext` is passed to the host app untouched.

## 3. The config (endpoint 0)

```json
{
  "protocol_version": "1.2",
  "product": { "id": "askneo", "name": "Ask Neo" },
  "capabilities": {
    "hitl": false,
    "attachments": false,
    "workflow_context": false,
    "archive": false,
    "cancel": "disconnect",
    "per_turn_model": true,
    "per_turn_sources": true,
    "conversation_pagination": false,
    "message_pagination": false,
    "stream_resume": false
  },
  "models": [{ "id": "claude-haiku-4-5", "label": "Haiku 4.5", "default": true }],
  "sources": [{ "id": "search_v2", "label": "Knowledge base", "default_enabled": true, "meta": {} }],
  "workflows": [],
  "limits": { "max_message_chars": 100000, "max_attachments": 0, "max_attachment_bytes": 0, "attachment_types": [] }
}
```

A flag missing from a returned config means "not supported". What the client does with it:

| Field                       | The client                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `hitl: false`               | Ignores `checkpoint` events and never shows approval or choice cards.                                |
| `attachments: false`        | Hides the attach button and never sends `attachments`.                                               |
| `workflow_context: false`   | Hides the scope picker and never sends `workflow_context`.                                           |
| `archive: false`            | Hides Archive and the archived filter.                                                               |
| `cancel`                    | `"disconnect"`: Stop closes the stream at once. `"server"`: Stop calls endpoint 7 first (section 5). |
| `per_turn_model`            | Sends the conversation's model as `model` with each message.                                         |
| `per_turn_sources: false`   | Sets sources per conversation only (endpoint 4), never per message.                                  |
| `sources`                   | Labels sources in the UI. The client only sends source ids listed here.                              |
| `workflows`                 | Fills the scope picker (one group per workspace) when the host app doesn't pass its own catalog.     |
| `limits`                    | Blocks a message over `max_message_chars`, and applies the attachment limits on top of the host's.   |
| `sources[].meta.connection` | A hint only. Connection status comes from the conversation responses and from `connection_*` errors. |

The host app can turn more off with the `capabilities` option, but can't turn on what the config says is unsupported.

## 4. Sending a message (endpoint 6)

```json
{
  "stream": true,
  "client_message_id": "cm_7f3a91",
  "message": { "role": "user", "type": "default", "content": { "default": "What were Acme's top open invoices last quarter?" } },
  "model": "claude-sonnet-5",
  "sources": [{ "id": "search_v2", "enabled": true, "meta": { "search_v2_chunk_size": 5 } }]
}
```

- `client_message_id` is created by the client. A repeat with the same id returns 409 `duplicate_message`. The client reuses the id when it retries a message the server never confirmed (no `message_start` arrived), and sends a new one when it did.
- `model` is sent only with `per_turn_model`. `sources` (settings only, never credentials), `workflow_context`, `attachments` and `ext` are sent only when they have content and the config allows them.
- Inputs the config turns off return 422 `unsupported_feature` before the stream opens. They're never silently ignored.
- Return 409 `session_busy` before the stream opens when a reply is already running in the conversation.

A HITL resume (only with `hitl`) uses exactly the schema shape:

```json
{
  "stream": true,
  "message": { "role": "user", "type": "hitl", "content": { "checkpoint_id": "z93hdnf02c", "decision": "approve" } }
}
```

The response is `text/event-stream`, with `Cache-Control: no-cache` and `X-Accel-Buffering: no`:

```
message_start → (status | content_block_start → content_block_delta* → content_block_stop | checkpoint)* → message_delta? → message_stop
```

| Event                 | What the client does                                                                                                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `message_start`       | Opens the assistant message, keyed by `message_id`, and keeps the id for cancel. `user_message_id` and the echoed `client_message_id` swap the optimistic user message for the saved one. |
| `status`              | Shows `label` in the progress pill until the next `status` or the end of the turn.                                                                                                        |
| `content_block_start` | Adds the block, keyed by `block.id`, so **`id` must be unique within a message**. `index` only has to be unique within one stream.                                                        |
| `content_block_delta` | `snapshot` replaces the block's streaming field (or the whole payload when it's an object). Without it, `delta.text` is appended. Send snapshots: they make a dropped delta harmless.     |
| `content_block_stop`  | Replaces the block with the final `block`, the source of truth.                                                                                                                           |
| `checkpoint`          | With `hitl`: attaches `{ checkpoint_id, requires }` to the block at `block_index` and makes that card actionable.                                                                         |
| `message_delta`       | Stores `usage`, which is optional.                                                                                                                                                        |
| `message_stop`        | Ends the turn with `stop_reason`. Always send it, including after an error. A non-null `title` renames the chat everywhere.                                                               |
| `error`               | `error_type` comes from the shared code list. Shows an error card with the action the code calls for (section 1).                                                                         |
| `: ping`              | A comment line, ignored. Send it after 15 s with no event so proxies and the client keep the stream open.                                                                                 |
| `<product>.<event>`   | Ignored by clients that don't know it.                                                                                                                                                    |

Every `tool_use` gets exactly one `tool_result` (with `tool_use_id`), including on error, and the client shows both as one card. A reply that ends without a tool's result shows that card as "Interrupted". `tool_result.http_trace` is null in production.

Tolerance: an unknown event type is ignored; a malformed event is skipped with a warning; a stream that ends without `message_stop` marks the answer interrupted with Try again; the data's `type` wins over the SSE `event:` name.

## 5. Stop (endpoint 7)

- **`cancel: "server"`**: the client posts `{ "message_id" }` from `message_start`. `true` means the run is stopping; the client waits up to 1.5 s for `message_stop` (`stop_reason: "cancelled"`) and then closes the stream. `false` (the turn already finished, or nothing can stop it) closes the stream at once. If Stop comes before `message_start`, the client waits up to 3 s for it, then closes the stream.
- **`cancel: "disconnect"`**: the client closes the stream at once and never calls endpoint 7. The backend stops the run and saves the partial reply as `cancelled`. The endpoint, if it exists, always returns `{ "status": false }`.

## 6. History and HITL

On reload, endpoint 3 has to let the UI rebuild each card. The client pairs each `tool_result` with its `tool_use` again, and for HITL (gap #2 in [schema-gaps.md](schema-gaps.md)) reads:

- a checkpoint on the HITL block, as `checkpoint: { checkpoint_id, requires, status: "pending" | "resolved", decision }` or a bare `checkpoint_id`;
- a user message with `type: "hitl"` and `content: { checkpoint_id, decision }`, applied to the matching card and not rendered as a bubble;
- a last assistant message with `stop_reason: "paused"` and an unresolved checkpoint, which becomes live again.

## 7. Connections (optional pattern)

A product whose chat uses a third-party system can expose `/v1/connections/{source_id}`: `PUT` (the host app hands over a credential it holds), `GET` (`{ status, expires_at }`) and `DELETE`. The host app calls these, typically from `onConnectionRequired`; the chat library never does. Nothing about the credential is returned.

## 8. Conformance check

The library ships a check that calls a backend the way the UI will and reports every gap against this page. It creates one conversation, sends one message (which calls the model) and deletes the conversation. Run it in CI against a dev or staging deployment:

```bash
npx agentic-chat-conformance --base-url https://askneo.dev.example --header "Cookie: session=$SESSION"
```

```ts
import { formatReport, runConformance } from '@neofloai/agentic-chat/conformance';

const report = await runConformance({ baseUrl: process.env.CHAT_BASE_URL!, headers: { Cookie: process.env.SESSION! } });
if (!report.ok) throw new Error(formatReport(report));
```

Failures break the contract; warnings are worth fixing but don't fail the run. `--no-messages` skips endpoint 6 when the run must not call the model.
