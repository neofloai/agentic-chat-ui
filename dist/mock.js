import {
  ChatApiError
} from "./chunk-MQH7BY4V.js";

// src/mock/scenarios.ts
var has = (...words) => (prompt) => {
  const p = prompt.toLowerCase();
  return words.some((w) => p.includes(w));
};
var heldInvoices = {
  type: "table",
  category: "ui",
  title: "Held invoices",
  columns: [
    { key: "vendor", label: "Vendor" },
    { key: "reason", label: "Reason" },
    { key: "amount", label: "Amount", format: "currency" }
  ],
  rows: [
    { vendor: "Redwood Components", reason: "Price vs order", amount: 3940.24 },
    { vendor: "Cascade Supply", reason: "Price vs order", amount: 1208 },
    { vendor: "Lian Huat Supplies", reason: "No receipt", amount: 812.5 },
    { vendor: "Orchard Retail", reason: "Price vs order", amount: 4101 }
  ]
};
var sources = {
  type: "sources",
  category: "citation",
  items: [
    { id: "s1", label: "Invoice Processing \xB7 30 days", kind: "workflow" },
    { id: "s2", label: "Purchase orders \xB7 Redwood Components", kind: "record" },
    { id: "s3", label: "Goods received \xB7 Lian Huat Supplies", kind: "record" }
  ]
};
var scanSvg = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="336" viewBox="0 0 600 336"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#e9ebfa"/><stop offset="1" stop-color="#f7e4ec"/></linearGradient></defs><rect width="600" height="336" fill="url(#g)"/><rect x="170" y="40" width="260" height="256" rx="6" fill="#fdfdfc" stroke="#cccac6"/><rect x="195" y="70" width="120" height="12" rx="3" fill="#aeb3f3"/><rect x="195" y="100" width="210" height="8" rx="3" fill="#e5e4e1"/><rect x="195" y="118" width="190" height="8" rx="3" fill="#e5e4e1"/><rect x="195" y="136" width="200" height="8" rx="3" fill="#e5e4e1"/><rect x="195" y="170" width="210" height="60" rx="4" fill="#f5f5f3"/><rect x="330" y="250" width="75" height="14" rx="3" fill="#868fee"/></svg>`
);
var DEFAULT_SUGGESTIONS = [
  { label: "What is waiting on me?", prompt: "Which invoices are still waiting on me?" },
  { label: "Post the held invoices", prompt: "Post the four held invoices to NetSuite" },
  { label: "Which vendor is slowest?", prompt: "Which vendor is slowest to pay? Show me charts." },
  { label: "Reconcile August", prompt: "Make a plan and reconcile August" },
  { label: "Pick workflows", prompt: "Help me choose which workflows to review" },
  { label: "Show the scan", prompt: "Show me the scan of Statement-Aug.pdf" }
];
var DEFAULT_SCENARIOS = [
  {
    name: "approval",
    match: has("post", "approve", "netsuite"),
    async run(w) {
      await w.status("Preparing the posting");
      await w.text("I found four invoices that are ready to post. They total **10,061.74** across three vendors.");
      await w.pause({
        block: {
          type: "approval",
          category: "hitl",
          title: "Post 4 invoices to NetSuite?",
          description: "They total 10,061.74 across three vendors. Posting cannot be undone from here.",
          approve_label: "Post all four",
          reject_label: "Not now"
        },
        requires: { kind: "approve_reject", options: ["approve", "reject"] },
        onResume: async (next, decision) => {
          if (decision === "reject") {
            await next.text("Okay, I won't post them. They stay held until you're ready.");
            return;
          }
          await next.status("Posting to NetSuite");
          await next.block(
            {
              type: "tool_call",
              category: "tool",
              name: "post_invoices",
              input: { erp: "NetSuite", count: 4 },
              status: "success",
              result_summary: "4 posted",
              duration_ms: 1400
            },
            { startWith: { status: "running", result_summary: void 0 } }
          );
          await next.text("Posted all four. NetSuite returned document numbers **VB-2231** through **VB-2234**.");
        }
      });
    }
  },
  {
    name: "charts",
    match: has("slow", "chart", "vendor", "trend"),
    async run(w) {
      await w.status("Crunching payment history");
      await w.block({
        type: "chart",
        category: "ui",
        chart_type: "bar",
        title: "Invoices posted",
        subtitle: "Last five weeks",
        x_key: "week",
        series: [
          { key: "posted", label: "Posted" },
          { key: "held", label: "Held" }
        ],
        data: [
          { week: "W1", posted: 22, held: 12 },
          { week: "W2", posted: 27, held: 15 },
          { week: "W3", posted: 18, held: 9 },
          { week: "W4", posted: 31, held: 19 },
          { week: "W5", posted: 25, held: 14 }
        ]
      });
      await w.block({
        type: "chart",
        category: "ui",
        chart_type: "area",
        title: "Days to pay",
        subtitle: "Rolling average",
        x_key: "month",
        series: [{ key: "days", label: "Days to pay" }],
        data: [
          { month: "Mar", days: 31 },
          { month: "Apr", days: 36 },
          { month: "May", days: 34 },
          { month: "Jun", days: 41 },
          { month: "Jul", days: 39 },
          { month: "Aug", days: 46 },
          { month: "Sep", days: 44 }
        ]
      });
      await w.block({
        type: "chart",
        category: "ui",
        chart_type: "donut",
        title: "Where invoices sit",
        subtitle: "128 this month",
        x_key: "stage",
        series: [{ key: "count", label: "Invoices" }],
        total: { value: "128", label: "invoices" },
        data: [
          { stage: "Posted", count: 82 },
          { stage: "In review", count: 26 },
          { stage: "Held", count: 4 }
        ]
      });
      await w.text(
        "**Orchard Retail** is the slowest: 46 days on average, up from 31 in March. The trend has climbed for four of the last six months."
      );
    }
  },
  {
    name: "plan",
    match: has("plan", "reconcile", "reconciliation"),
    async run(w) {
      const steps = (s1, s2, s3) => [
        { id: "read", title: "Read the last thirty days", status: s1 },
        {
          id: "match",
          title: "Match each against its order",
          status: s2,
          detail: s2 === "pending" ? void 0 : { compared: "128 invoices", matched: "124", held: "4" }
        },
        { id: "receipts", title: "Checking receipts", status: s3 }
      ];
      await w.block(
        { type: "plan", category: "plan", title: "Reconciling August", steps: steps("done", "done", "done") },
        {
          startWith: { steps: steps("running", "pending", "pending") },
          snapshots: [steps("done", "running", "pending"), steps("done", "done", "running")],
          interval: 700
        }
      );
      await w.block({
        type: "artifact",
        category: "ui",
        filename: "reconciliation-august.md",
        format: "markdown",
        content: "# August reconciliation\n\n4 held, 2 resolved, 1 escalated\n\nTotal exposure 10,061.74\n\n## Held\n\n| Vendor | Reason | Amount |\n|---|---|---:|\n| Redwood Components | Price vs order | 3,940.24 |\n| Cascade Supply | Price vs order | 1,208.00 |\n| Lian Huat Supplies | No receipt | 812.50 |\n| Orchard Retail | Price vs order | 4,101.00 |\n\n## Next steps\n\n1. Ask purchasing to confirm the three price differences.\n2. Chase the missing receipt from Lian Huat."
      });
      await w.text("August is reconciled. Four invoices are still held; the report above has the detail.");
    }
  },
  {
    name: "choice",
    match: has("choose", "pick", "which workflows"),
    async run(w) {
      await w.pause({
        block: {
          type: "choice",
          category: "hitl",
          title: "Which workflows should I review?",
          description: "Pick one or more.",
          multiple: true,
          options: [
            { value: "ip", label: "Invoice Processing" },
            { value: "col", label: "Collections" },
            { value: "sa", label: "Spend Analytics" }
          ]
        },
        requires: { kind: "multi_select", min: 1 },
        onResume: async (next, decision) => {
          const picked = Array.isArray(decision) ? decision : [String(decision)];
          await next.text(
            `Reviewing **${picked.length}** workflow${picked.length === 1 ? "" : "s"}: ${picked.join(", ")}. Nothing needs your attention in the last seven days.`
          );
        }
      });
    }
  },
  {
    name: "image",
    match: has("scan", "image", "picture"),
    async run(w) {
      await w.status("Opening Statement-Aug.pdf");
      await w.block({
        type: "image",
        category: "ui",
        url: `data:image/svg+xml;charset=utf-8,${scanSvg}`,
        alt: "Scan of Statement-Aug.pdf, page 1",
        caption: "Scan of Statement-Aug.pdf, page 1"
      });
      await w.text("Here is page 1. The total on the statement matches the ledger.");
    }
  },
  {
    name: "error",
    match: has("fail", "error", "break"),
    async run(w) {
      await w.status("Posting to NetSuite");
      await w.block(
        {
          type: "tool_call",
          category: "tool",
          name: "post_invoices",
          input: { erp: "NetSuite" },
          status: "error",
          error: "Timed out after 30 s",
          duration_ms: 3e4
        },
        { startWith: { status: "running", error: void 0 } }
      );
      await w.block({
        type: "error",
        category: "error",
        title: "NetSuite did not answer",
        message: "The connection timed out after 30 seconds. Nothing was posted.",
        retryable: true
      });
    }
  },
  {
    name: "markdown",
    match: has("markdown", "format", "code"),
    async run(w) {
      await w.text(
        "## Formatting check\n\nThe answer column renders **bold**, _italic_, `inline code` and [links](https://neoflo.ai).\n\n- Lists\n- With several items\n  - and nesting\n\n```ts\nconst total = invoices.reduce((sum, i) => sum + i.amount, 0);\n```\n\n| Vendor | Days |\n|---|---:|\n| Orchard Retail | 46 |\n| Redwood Components | 38 |\n\n> Quotes read as quotes."
      );
    }
  },
  {
    name: "default",
    match: () => true,
    async run(w, prompt) {
      await w.status("Reading Invoice Processing");
      await w.thinking(
        "The price difference is against the order, not the receipt, so this is a purchasing question rather than a goods-received one.",
        { durationMs: 4e3 }
      );
      await w.block(
        {
          type: "tool_call",
          category: "tool",
          name: "search_invoices",
          input: { workspace: "Finance", status: "held", window: "30d" },
          status: "success",
          result_summary: "4 rows",
          duration_ms: 800
        },
        { startWith: { status: "running", result_summary: void 0 } }
      );
      await w.block(heldInvoices);
      await w.text(
        prompt.toLowerCase().includes("yesterday") ? "Yesterday **31** invoices were posted, and **4** are still held. Three are held on a price difference against the order, and one is missing a receipt." : "Four are waiting on you, all in Invoice Processing. Three are held on a price difference against the order, and one is missing a receipt."
      );
      await w.block(sources);
    }
  }
];

// src/mock/writer.ts
var MockStop = class extends Error {
  constructor(reason) {
    super(reason);
    this.reason = reason;
  }
  reason;
};
function createWriter(h) {
  const guard = () => {
    if (h.signal.aborted) throw new MockStop("aborted");
    if (h.isCancelled()) throw new MockStop("cancelled");
  };
  const wait = (ms) => new Promise((resolve, reject) => {
    guard();
    const t = setTimeout(() => {
      h.signal.removeEventListener("abort", onAbort);
      try {
        guard();
        resolve();
      } catch (e) {
        reject(e);
      }
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new MockStop("aborted"));
    };
    h.signal.addEventListener("abort", onAbort, { once: true });
  });
  const streamText = async (type, body, speed, extra = {}) => {
    const index = h.nextIndex();
    const id = h.newId("blk_");
    const category = type === "thinking" ? "reasoning" : "content";
    h.push({ type: "content_block_start", index, block: { id, type, category, text: "", ...extra } });
    const tokens = body.match(/\S+\s*|\s+/g) ?? [];
    let snapshot = "";
    for (let i = 0; i < tokens.length; i += 2) {
      const piece = tokens.slice(i, i + 2).join("");
      snapshot += piece;
      h.push({ type: "content_block_delta", index, delta: { type: "text_delta", text: piece }, snapshot });
      await wait(speed);
    }
    const final = { id, type, category, text: body, ...extra };
    h.push({ type: "content_block_stop", index, block: final });
    h.onBlockStop(final);
  };
  const writer = {
    paused: false,
    async status(label) {
      guard();
      h.push({ type: "status", label });
    },
    async text(markdown, options) {
      await streamText("text", markdown, options?.speed ?? h.speed);
    },
    async thinking(body, options) {
      await streamText(
        "thinking",
        body,
        options?.speed ?? h.speed / 2,
        options?.durationMs ? { duration_ms: options.durationMs } : {}
      );
    },
    async block(raw, options) {
      guard();
      const index = h.nextIndex();
      const block = { ...raw, id: raw.id ?? h.newId("blk_") };
      h.push({ type: "content_block_start", index, block: { ...block, ...options?.startWith ?? {} } });
      for (const snap of options?.snapshots ?? []) {
        await wait(options?.interval ?? h.speed * 8);
        h.push({ type: "content_block_delta", index, delta: { type: "snapshot_delta" }, snapshot: snap });
      }
      if (options?.snapshots?.length || options?.startWith) await wait(options?.interval ?? h.speed * 8);
      h.push({ type: "content_block_stop", index, block });
      h.onBlockStop(block);
      return block;
    },
    async pause({ block: raw, requires, onResume }) {
      guard();
      const block = await writer.block(raw);
      const checkpointId = h.newId("cp_");
      h.onPause(checkpointId, block.id, requires ?? null, onResume);
      h.push({ type: "checkpoint", checkpoint_id: checkpointId, block_index: h.lastIndex(), requires: requires ?? null });
      writer.paused = true;
    },
    async error(errorType, message, retryAfter) {
      guard();
      h.push({ type: "error", error_type: errorType, message, retry_after: retryAfter ?? null });
    },
    wait
  };
  return writer;
}

// src/mock/adapter.ts
var now = () => (/* @__PURE__ */ new Date()).toISOString();
var counter = 0;
var newId = (prefix) => `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}`;
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function titleFrom(prompt) {
  const words = prompt.replace(/[?!.]+$/, "").split(/\s+/).filter(Boolean).slice(0, 6);
  const t = words.join(" ");
  return t ? t[0].toUpperCase() + t.slice(1) : "New chat";
}
var Channel = class {
  queue = [];
  wake = null;
  closed = false;
  push(v) {
    this.queue.push(v);
    this.wake?.();
  }
  close() {
    this.closed = true;
    this.wake?.();
  }
  async *[Symbol.asyncIterator]() {
    for (; ; ) {
      if (this.queue.length) {
        yield this.queue.shift();
        continue;
      }
      if (this.closed) return;
      await new Promise((r) => this.wake = r);
      this.wake = null;
    }
  }
};
function createMockAdapter(options = {}) {
  const latency = options.latency ?? 250;
  const speed = options.speed ?? 28;
  const scenarios = [...options.scenarios ?? [], ...options.includeDefaultScenarios === false ? [] : DEFAULT_SCENARIOS];
  const db = /* @__PURE__ */ new Map();
  const pending = /* @__PURE__ */ new Map();
  const cancelled = /* @__PURE__ */ new Set();
  const load = () => {
    if (!options.persistKey || typeof localStorage === "undefined") return false;
    try {
      const raw = localStorage.getItem(options.persistKey);
      if (!raw) return false;
      for (const c of JSON.parse(raw)) db.set(c.summary.conversation_id, c);
      return true;
    } catch {
      return false;
    }
  };
  const save = () => {
    if (!options.persistKey || typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(options.persistKey, JSON.stringify([...db.values()]));
    } catch {
    }
  };
  const seed = () => {
    for (const d of options.seed ?? []) {
      db.set(d.conversation_id, {
        summary: {
          conversation_id: d.conversation_id,
          title: d.title,
          created_at: d.created_at,
          updated_at: d.updated_at,
          archived: d.archived
        },
        messages: d.messages
      });
    }
  };
  if (!load()) seed();
  const get = (id) => {
    const c = db.get(id);
    if (!c) throw new ChatApiError(404, "Conversation not found", { detail: "not found" });
    return c;
  };
  const bootstrap = (summary) => ({
    ...summary,
    subtitle: "Ask Neo",
    sources: [
      { id: "search_v2", enabled: true, meta: { search_v2_chunk_size: 10 } },
      { id: "web_search", enabled: false, meta: {} }
    ],
    greeting: options.greeting ?? "Hey! What can I help you dig into today?",
    suggested_prompts: options.suggestedPrompts ?? DEFAULT_SUGGESTIONS,
    model: options.models ?? ["claude-sonnet-5", "claude-opus-5"]
  });
  function run(conversationId, messageId, signal, firstTurn, prompt, body) {
    const ch = new Channel();
    const conv = get(conversationId);
    let index = -1;
    let assistant = conv.messages.find((m) => m.message_id === messageId);
    if (!assistant) {
      assistant = {
        message_id: messageId,
        conversation_id: conversationId,
        role: "assistant",
        content: [],
        created_at: now(),
        stop_reason: null
      };
      conv.messages.push(assistant);
    }
    const content = assistant.content;
    const writer = createWriter({
      push: (e) => ch.push(e),
      isCancelled: () => cancelled.has(messageId),
      signal,
      speed,
      nextIndex: () => ++index,
      lastIndex: () => index,
      newId,
      onBlockStop: (block) => {
        const i = content.findIndex((b) => b.id === block.id);
        if (i >= 0) content[i] = block;
        else content.push(block);
      },
      onPause: (checkpointId, blockId, requires, onResume) => {
        pending.set(checkpointId, { conversationId, messageId, blockId, onResume });
        const b = content.find((x) => x.id === blockId);
        if (b) b.checkpoint = { checkpoint_id: checkpointId, requires, status: "pending" };
      }
    });
    void (async () => {
      cancelled.delete(messageId);
      ch.push({
        type: "message_start",
        message_id: messageId,
        conversation_id: conversationId,
        run_id: newId("run_"),
        persona: null
      });
      let stop = "end_turn";
      try {
        await sleep(Math.min(latency, 400));
        await body(writer);
        if (writer.paused) stop = "paused";
      } catch (error) {
        if (error instanceof MockStop) stop = error.reason === "cancelled" ? "cancelled" : "cancelled";
        else {
          stop = "error";
          ch.push({
            type: "error",
            error_type: "mock_error",
            message: error instanceof Error ? error.message : String(error),
            retry_after: null
          });
        }
      }
      if (signal.aborted) {
        ch.close();
        return;
      }
      assistant.stop_reason = stop;
      const title = firstTurn && stop !== "cancelled" ? titleFrom(prompt) : null;
      if (title) conv.summary.title = title;
      conv.summary.updated_at = now();
      save();
      ch.push({ type: "message_delta", usage: { input_tokens: 120 + prompt.length, output_tokens: 80 } });
      ch.push({ type: "message_stop", message_id: messageId, model: "claude-sonnet-5", title, stop_reason: stop });
      ch.close();
    })();
    return ch;
  }
  return {
    reset() {
      db.clear();
      pending.clear();
      seed();
      save();
    },
    async createConversation() {
      await sleep(latency);
      const id = newId("conv_");
      const summary = {
        conversation_id: id,
        title: "New chat",
        created_at: now(),
        updated_at: now(),
        archived: false
      };
      db.set(id, { summary, messages: [] });
      save();
      return bootstrap(summary);
    },
    async listConversations() {
      await sleep(latency);
      return [...db.values()].filter((c) => c.messages.length > 0).map((c) => ({ ...c.summary })).sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
    },
    async getConversation(id) {
      await sleep(latency);
      const c = get(id);
      return { ...bootstrap(c.summary), messages: structuredClone(c.messages) };
    },
    async updateConversation(id, patch) {
      await sleep(latency);
      const c = get(id);
      if (typeof patch.title === "string") c.summary.title = patch.title.slice(0, 200);
      if (typeof patch.archived === "boolean") c.summary.archived = patch.archived;
      c.summary.updated_at = now();
      save();
      return { ...c.summary };
    },
    async deleteConversation(id) {
      await sleep(latency);
      db.delete(id);
      save();
    },
    sendMessage(conversationId, body, { signal }) {
      const conv = get(conversationId);
      if (body.message.type === "hitl") {
        const { checkpoint_id, decision } = body.message.content;
        const p = pending.get(checkpoint_id);
        if (!p || p.conversationId !== conversationId) {
          return run(conversationId, newId("msg_"), signal, false, "", async (w) => {
            await w.error("checkpoint_not_found", "That decision is no longer waiting.");
          });
        }
        pending.delete(checkpoint_id);
        conv.messages.push({
          message_id: newId("msg_"),
          conversation_id: conversationId,
          role: "user",
          type: "hitl",
          content: { checkpoint_id, decision },
          created_at: now()
        });
        const assistant = conv.messages.find((m) => m.message_id === p.messageId);
        const block = assistant?.content?.find((b) => b.id === p.blockId);
        if (block?.checkpoint && typeof block.checkpoint === "object") {
          block.checkpoint = { ...block.checkpoint, status: "resolved", decision };
        }
        return run(conversationId, p.messageId, signal, false, "", (w) => p.onResume(w, decision));
      }
      const prompt = body.message.content.default;
      const firstTurn = !conv.messages.some((m) => m.role === "user");
      conv.messages.push({
        message_id: newId("msg_"),
        conversation_id: conversationId,
        role: "user",
        content: [{ id: newId("blk_"), type: "text", category: "content", text: prompt }],
        attachments: body.attachments,
        created_at: now()
      });
      const scenario = scenarios.find((s) => s.match(prompt)) ?? DEFAULT_SCENARIOS[DEFAULT_SCENARIOS.length - 1];
      return run(conversationId, newId("msg_"), signal, firstTurn, prompt, (w) => scenario.run(w, prompt));
    },
    async cancelMessage(_conversationId, messageId) {
      await sleep(Math.min(latency, 100));
      cancelled.add(messageId);
      return { status: true };
    }
  };
}
export {
  DEFAULT_SCENARIOS,
  DEFAULT_SUGGESTIONS,
  MockStop,
  createMockAdapter
};
//# sourceMappingURL=mock.js.map