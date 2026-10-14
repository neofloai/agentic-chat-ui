# Block contracts

This page defines the payload of every block the chat renders out of the box, the standard types every product's backend can send. Every block carries `id`, `type` and `category`. The fields below are the rest.

The parsers accept the aliases and fallbacks listed, so a backend can adopt these shapes gradually. A block the client can't parse falls back to a development-only "unsupported content" notice and never crashes the thread.

**The vocabulary is closed on purpose.** A turn composes these shapes and never invents a layout. A product's own cards use [`<product>.<name>` types](#product-blocks), registered by that product's app with `defineBlock`.

## text

```json
{ "id": "b1", "type": "text", "category": "content", "text": "Four are waiting on you…" }
```

- `text` is Markdown (GFM tables, lists, code). Raw HTML is not rendered. Aliases: `markdown`, `content`.
- Stream it with `snapshot` set to the full text so far.

## thinking

```json
{
  "id": "b2",
  "type": "thinking",
  "category": "reasoning",
  "text": "The price difference is against the order…",
  "duration_ms": 4000
}
```

- `text` (or `thinking`) is the model's reasoning. `duration_ms` is optional; the client measures it while streaming if it's missing.

## tool_use and tool_result

The standard way to show a tool call: a `tool_use` block when the call starts, and exactly one `tool_result` when it returns, including on error. The client pairs them by `tool_use_id` and renders one card: the call's input, then what it returned.

```json
{ "id": "toolu_01A9", "type": "tool_use", "category": "tool", "tool": "search_v2", "input": { "query": "Acme open invoices Q3" } }
```

```json
{
  "id": "f4a5b6c7",
  "type": "tool_result",
  "category": "tool",
  "tool_use_id": "toolu_01A9",
  "is_error": false,
  "error_code": null,
  "result_count": 2,
  "results": [{ "title": "INV-1042", "snippet": "Acme Corp · $12,400 · open", "url": null }],
  "http_trace": null
}
```

| Field                      | Notes                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `tool_use.tool`            | The tool id, shown as the title. Aliases: `name`, `tool_name`.                                                      |
| `tool_use.title`           | Optional friendlier title.                                                                                          |
| `tool_use.input`           | Shown as key/value rows.                                                                                            |
| `tool_result.tool_use_id`  | The `tool_use` block's `id`. A result with no matching call in the message gets a card of its own.                  |
| `tool_result.is_error`     | `true` shows the card as failed, with `error_code` (or `error`/`message`) as the reason.                            |
| `tool_result.result_count` | Shown as "N results". Up to five `results` are listed under it, as `{ title, snippet, url }`; `url` becomes a link. |
| `tool_result.http_trace`   | Debug data. `null` in production, and never shown.                                                                  |

Until its result arrives the card shows "Running". If the reply ends (`message_stop` other than `paused`, Stop, or a dropped stream) without the result, the card shows "Interrupted" instead of spinning.

## tool_call

The older single-block form, still accepted: one block carries both the input and the result.

```json
{
  "id": "b3",
  "type": "tool_call",
  "category": "tool",
  "name": "search_invoices",
  "input": { "workspace": "Finance", "status": "held", "window": "30d" },
  "status": "success",
  "result_summary": "4 rows",
  "duration_ms": 800
}
```

| Field            | Notes                                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| `name`           | The tool id, shown as the title. Aliases: `tool_name`, `tool`.                                                  |
| `title`          | Optional friendlier title.                                                                                      |
| `input`          | Shown as key/value rows. Aliases: `arguments`, `args`, `parameters`. Streaming `partial_json` deltas also work. |
| `status`         | `running`, `success` or `error`.                                                                                |
| `result_summary` | One line shown as `returned`. Without it, `output` is shown compactly.                                          |
| `error`          | Shown in red when `status` is `error`.                                                                          |
| `duration_ms`    | Shown as meta ("0.8s").                                                                                         |

Send `content_block_start` with `status: "running"` and `content_block_stop` with the final status and result.

## table

```json
{
  "id": "b4",
  "type": "table",
  "category": "ui",
  "title": "Held invoices",
  "columns": [
    { "key": "vendor", "label": "Vendor" },
    { "key": "reason", "label": "Reason" },
    { "key": "amount", "label": "Amount", "format": "currency", "currency": "USD" }
  ],
  "rows": [{ "vendor": "Redwood Components", "reason": "Price vs order", "amount": 3940.24 }],
  "total_rows": 4
}
```

- `columns` entries can be plain strings. `format` is one of `text`, `number`, `currency`, `percent` or `date`. Numeric formats right-align.
- `rows` can be objects keyed by column, or arrays in column order.
- `total_rows` is shown as "N rows" when the block carries a preview of a bigger result. The client renders up to 500 rows.

## sources

```json
{
  "id": "b5",
  "type": "sources",
  "category": "citation",
  "items": [
    { "id": "s1", "label": "Invoice Processing · 30 days", "url": "https://…", "description": "…" },
    { "id": "s2", "label": "Purchase orders · Redwood Components", "selected": true }
  ]
}
```

- A `url` opens in a new tab. Every click also reaches the host app as `open_source`.
- If any item has `selected`, the list shows checkboxes. Toggling one emits `source_toggle`.

## approval

A human-in-the-loop yes or no. Pair it with a `checkpoint` event.

```json
{
  "id": "b6",
  "type": "approval",
  "category": "hitl",
  "title": "Post 4 invoices to NetSuite?",
  "description": "They total 10,061.74 across three vendors. Posting cannot be undone from here.",
  "approve_label": "Post all four",
  "reject_label": "Not now",
  "tone": "default",
  "details": { "vendors": 3, "total": "10,061.74" }
}
```

- The decision sent back is `approve_value` / `reject_value`, which default to `"approve"` / `"reject"`.
- `tone: "danger"` colors the approve button for destructive actions. `details` renders as key/value rows.
- An unknown `type` in the `hitl` category also renders as an approval, unless it carries `options`.

## choice

A single- or multi-select question. Pair it with a `checkpoint` event.

```json
{
  "id": "b7",
  "type": "choice",
  "category": "hitl",
  "title": "Which workflows should I review?",
  "multiple": true,
  "min": 1,
  "max": 2,
  "options": [
    { "value": "ip", "label": "Invoice Processing" },
    { "value": "col", "label": "Collections" }
  ],
  "submit_label": "Review"
}
```

- The decision is the chosen `value` (single) or an array of values (multiple).
- `options`, `multiple`, `min` and `max` may come in `checkpoint.requires` instead.

## error

```json
{
  "id": "b8",
  "type": "error",
  "category": "error",
  "title": "NetSuite did not answer",
  "message": "The connection timed out after 30 seconds. Nothing was posted.",
  "retryable": true,
  "retry_after": 10
}
```

- Use this for a failure inside a turn that otherwise completes. For a failure that ends the turn, use the `error` stream event.

## artifact

```json
{
  "id": "b9",
  "type": "artifact",
  "category": "ui",
  "filename": "reconciliation-august.md",
  "format": "markdown",
  "content": "# August reconciliation\n…",
  "url": "https://…"
}
```

- `format` is one of `markdown`, `text`, `json`, `csv` or `code`. It's inferred from the filename when missing.
- Inline `content` shows a preview and a full view, and makes the file downloadable. `url` alone offers a download.

## image

```json
{
  "id": "b10",
  "type": "image",
  "category": "ui",
  "url": "https://…/scan.png",
  "alt": "Scan of Statement-Aug.pdf, page 1",
  "caption": "Scan of Statement-Aug.pdf, page 1"
}
```

- `url` must be `https:`, `blob:`, a relative path, or a `data:image/…` URI. Other schemes are dropped.

## plan

```json
{
  "id": "b11",
  "type": "plan",
  "category": "plan",
  "title": "Reconciling August",
  "steps": [
    { "id": "read", "title": "Read the last thirty days", "status": "done" },
    {
      "id": "match",
      "title": "Match each against its order",
      "status": "running",
      "detail": { "compared": "128 invoices", "matched": "124" }
    },
    { "id": "receipts", "title": "Checking receipts", "status": "pending" }
  ]
}
```

- `status` is one of `pending`, `running`, `done`, `failed` or `skipped`. Common synonyms such as `completed` and `in_progress` are accepted.
- Stream progress with `content_block_delta` carrying `snapshot` set to the full `steps` array, or to `{ "steps": [...] }`.

## chart

```json
{
  "id": "b12",
  "type": "chart",
  "category": "ui",
  "chart_type": "bar",
  "title": "Invoices posted",
  "subtitle": "Last five weeks",
  "x_key": "week",
  "series": [
    { "key": "posted", "label": "Posted" },
    { "key": "held", "label": "Held" }
  ],
  "data": [{ "week": "W1", "posted": 22, "held": 12 }],
  "value_format": "number"
}
```

| Field                      | Notes                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| `chart_type`               | `bar`, `line`, `area` or `donut` (`pie` is accepted as donut).                                   |
| `x_key`                    | The category field, which is the slice name for donuts.                                          |
| `series`                   | Numeric fields to plot. Inferred from the first row when missing. A donut uses the first series. |
| `total`                    | `{ "value": "128", "label": "invoices" }`, shown in the donut's center.                          |
| `stacked`                  | Stack bars or areas.                                                                             |
| `value_format`, `currency` | Axis and tooltip formatting.                                                                     |

Colors come from the Atoms palette. Don't send hex colors unless a series genuinely needs a fixed one (`series[].color`).

## Product blocks

A product's own card uses the type `<product>.<name>`, where `<product>` is the config's `product.id` (for example `askneo.invoice_card`). It must carry `fallback_text`:

```json
{
  "id": "b9",
  "type": "askneo.invoice_card",
  "category": "ui",
  "fallback_text": "**INV-1042** · Redwood Components · 3,940.24 · held on a price difference",
  "data": { "number": "INV-1042", "amount": 3940.24 }
}
```

- The product's app registers a renderer with `defineBlock({ type: 'askneo.invoice_card', … })`.
- Any other app shows `fallback_text` as Markdown, so the answer still reads correctly. A `<product>.<name>` block is never given to a built-in renderer by its `category`.

## checkpoint.requires

Proposed shape, describing what the decision must look like:

```json
{ "kind": "approve_reject", "options": ["approve", "reject"] }
{ "kind": "multi_select", "options": [{ "value": "ip", "label": "Invoice Processing" }], "min": 1, "max": 2 }
{ "kind": "form", "schema": { "amount": "number" } }
```

The client passes `requires` to the card as-is. Built-in cards read `options`, `multiple`, `min` and `max` from it when the block itself doesn't carry them.
