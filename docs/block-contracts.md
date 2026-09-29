# Block contracts

This page proposes a payload for every block the chat renders out of the box. It needs sign-off from the Ask Neo and Reef backend teams. Every block carries `id`, `type` and `category`. The fields below are the rest.

The parsers accept the aliases and fallbacks listed, so a backend can adopt these shapes gradually. A block the client can't parse falls back to a development-only "unsupported content" notice and never crashes the thread.

**The vocabulary is closed on purpose.** A turn composes these shapes and never invents a layout. Product-specific cards (for example `invoice_card`) are registered by the host app with `defineBlock` and documented by that product.

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

## tool_call

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

## checkpoint.requires

Proposed shape, describing what the decision must look like:

```json
{ "kind": "approve_reject", "options": ["approve", "reject"] }
{ "kind": "multi_select", "options": [{ "value": "ip", "label": "Invoice Processing" }], "min": 1, "max": 2 }
{ "kind": "form", "schema": { "amount": "number" } }
```

The client passes `requires` to the card as-is. Built-in cards read `options`, `multiple`, `min` and `max` from it when the block itself doesn't carry them.
