# Backend contract

This page is for teams building a backend that `@neofloai/agentic-chat` talks to. It restates the Ask Neo ↔ Reef chat-layer schema v1 from the client's side. For each endpoint and event it covers what the library sends, what it expects back, and how it behaves when something goes wrong.

Block payloads (what goes inside `content_block_*`) live in [block-contracts.md](block-contracts.md). Open questions about v1 live in [schema-gaps.md](schema-gaps.md).

## 1. Transport rules

- **Auth.** Every request carries the headers the host app configures, normally `Authorization: Bearer …`. No user, workspace or tenant field appears in any body.
- **Content type.** Requests send `application/json`. Row 6 sends `Accept: text/event-stream` and always sets `"stream": true`.
- **Timeouts.** REST calls time out after 30 s (configurable). A message stream has no total timeout, but it counts as dropped after 60 s without any event, so send heartbeat comments (`: ping`) on long tool calls.
- **Retries.** The client retries `GET`, `PATCH`, `DELETE` and cancel up to 2 times on network errors, 5xx and 429, honoring `Retry-After`. It never retries `POST /conversation` or `POST /messages` automatically.
- **401.** The client asks the host app to refresh its session once, then retries the request one time.
- **Errors.** Return a non-2xx status with a JSON body containing `message` or `detail`. The UI shows that text for 4xx and a generic message for 5xx.

## 2. Endpoints

| #   | Request                                                               | The client expects                                                                                                                                                                       |
| --- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `POST /v1/conversation`, no body                                      | 200/201 with `conversation_id`, `title`, `subtitle`, `archived`, `sources`, timestamps, `greeting`, `suggested_prompts`, `model[]`. The greeting and prompts fill the empty-chat screen. |
| 2   | `GET /v1/conversations`                                               | `{ "conversations": [...] }`. A bare array is also accepted.                                                                                                                             |
| 3   | `GET /v1/conversations/{id}`                                          | The conversation plus `messages[]`, where `content` is an array of blocks with `id`, `type` and `category`. A 404 removes the chat from history.                                         |
| 4   | `PATCH /v1/conversations/{id}`                                        | One or more of `title`, `model`, `sources`, and `archived` (see gap #4). The response is a row-2 item.                                                                                   |
| 5   | `DELETE /v1/conversations/{id}`                                       | 204. A 404 also counts as success.                                                                                                                                                       |
| 6   | `POST /v1/conversations/{id}/messages`                                | An SSE stream (section 3). A JSON reply is accepted and converted, but streaming is the contract.                                                                                        |
| 7   | `POST /v1/conversations/{id}/messages/cancel` with `{ "message_id" }` | `{ "status": true                                                                                                                                                                        | false }`. `false` is a harmless no-op. |

### Row 6 request bodies

A normal turn:

```json
{
  "stream": true,
  "message": { "role": "user", "type": "default", "content": { "default": "What were Acme's top open invoices?" } },
  "workflow_context": [{ "workflow_name": "ip", "workspace_id": ["ws_finance"], "context": {} }],
  "attachments": [
    { "url": "https://files…/a.pdf", "filename": "a.pdf", "content_type": "application/pdf", "size": 253952, "meta": {} }
  ],
  "sources": [{ "id": "search_v2", "enabled": true, "meta": {} }]
}
```

`workflow_context`, `attachments` and `sources` are sent only when they have content. `workflow_context` merges three inputs by `workflow_name`: the composer's scope picker, the host page's context, and per-call options.

A HITL resume. It uses exactly the schema shape, with nothing else added:

```json
{
  "stream": true,
  "message": { "role": "user", "type": "hitl", "content": { "checkpoint_id": "z93hdnf02c", "decision": "approve" } }
}
```

`decision` is a string (approve or reject), a string array (multi-select), or an object (form-style cards).

## 3. The stream

```
message_start → (status | content_block_start → content_block_delta* → content_block_stop | checkpoint)* → message_delta? → message_stop
```

| Event                 | What the client does                                                                                                                                                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `message_start`       | Opens the assistant message, keyed by `message_id`. If that id already exists, as on a resume, the new blocks continue that message. Stores `message_id` for cancel.                                                                    |
| `status`              | Shows `label` in the progress pill until the next `status` or the end of the turn.                                                                                                                                                      |
| `content_block_start` | Adds the block. Blocks are keyed by `block.id`, so **`id` must be unique within a message**. `index` only has to be unique within one stream, and a resumed stream may restart at 0.                                                    |
| `content_block_delta` | If `snapshot` is present, it **replaces** the block's streaming field (`text` for text-like blocks, or the whole payload when it's an object). Without it, `delta.text` is appended. Send snapshots: they make dropped deltas harmless. |
| `content_block_stop`  | Replaces the block with the full final `block`. The final block is the source of truth.                                                                                                                                                 |
| `checkpoint`          | Attaches `{checkpoint_id, requires}` to the block at `block_index` and makes that card actionable. Emit it right after that block's `content_block_stop`.                                                                               |
| `message_delta`       | Stores `usage`.                                                                                                                                                                                                                         |
| `message_stop`        | Ends the turn with `stop_reason`. `paused` keeps the checkpoint live and locks the composer. A non-null `title` renames the chat everywhere.                                                                                            |
| `error`               | Shows an error card with Try again, waiting out `retry_after` seconds first. Follow it with `message_stop` (`stop_reason: "error"`).                                                                                                    |

Tolerance rules:

- An **unknown event type** is ignored with a warning, so you can add events without breaking deployed clients.
- A **malformed event** (bad JSON, missing required fields) is skipped with a warning. The stream continues.
- A stream that ends **without `message_stop`** marks the answer as interrupted and offers Try again.
- Both `event:` names and a `type` field in the data are accepted. The data's `type` wins.

## 4. Cancel

The client posts row 7 with the `message_id` from `message_start`, then gives the stream 1.5 s to finish with `message_stop` (`stop_reason: "cancelled"`) before closing it. If the user presses Stop before `message_start` arrives, the client waits up to 3 s for it and then closes the stream locally.

## 5. History and HITL

On reload, row 3 has to let the UI rebuild each card's state. Until schema v1 settles this (gap #2), the client reads:

- a checkpoint on the HITL block, as `checkpoint: { checkpoint_id, requires, status: "pending" | "resolved", decision }` or a bare `checkpoint_id`;
- a user message with `type: "hitl"` and `content: { checkpoint_id, decision }`. The client applies it to the matching card and doesn't render it as a bubble;
- a last assistant message with `stop_reason: "paused"` and an unresolved checkpoint. That card becomes live again.
