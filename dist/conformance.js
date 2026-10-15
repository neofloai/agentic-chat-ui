import {
  DEFAULT_REST_PATHS,
  ERROR_CODES,
  readSse
} from "./chunk-7BKRFFB3.js";
import {
  readErrorEnvelope
} from "./chunk-IKLKRTV5.js";

// src/conformance/index.ts
var isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var isString = (v) => typeof v === "string";
var IDENTITY_FIELDS = ["user_id", "workspace_id", "tenant_id", "object"];
var SECRET_KEY = /token|secret|password|passwd|api[-_]?key|credential|authorization|bearer|cookie/i;
var CONNECTION_STATES = /* @__PURE__ */ new Set(["connected", "expired", "missing"]);
var STOP_REASONS = /* @__PURE__ */ new Set(["end_turn", "paused", "error", "cancelled"]);
var KNOWN_CODES = new Set(ERROR_CODES);
var rand = () => Math.random().toString(36).slice(2, 10);
async function runConformance(options) {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const paths = { ...DEFAULT_REST_PATHS, ...options.paths };
  const doFetch = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
  const timeoutMs = options.timeoutMs ?? 3e4;
  const checks = [];
  const record = (endpoint, id2, title, status, detail) => {
    const check = { id: id2, endpoint, title, status, ...detail ? { detail } : {} };
    checks.push(check);
    options.onCheck?.(check);
    return status !== "fail";
  };
  const expectAll = (endpoint, id2, title, problems, level = "fail") => record(endpoint, id2, title, problems.length ? level : "pass", problems.length ? problems.join("; ") : void 0);
  async function headersFor(auth, accept, hasBody) {
    const source = auth ? typeof options.headers === "function" ? await options.headers() : options.headers : void 0;
    const headers = new Headers(source);
    headers.set("Accept", accept);
    if (hasBody) headers.set("Content-Type", "application/json");
    return headers;
  }
  async function call(method, path, init = {}) {
    const controller = new AbortController();
    const timer = init.keepBody ? void 0 : setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = () => controller.abort();
    init.signal?.addEventListener("abort", onAbort, { once: true });
    try {
      const auth = init.auth !== false;
      const res = await doFetch(baseUrl + path, {
        method,
        headers: await headersFor(auth, init.accept ?? "application/json", init.body !== void 0),
        body: init.body === void 0 ? void 0 : JSON.stringify(init.body),
        credentials: auth ? options.credentials : "omit",
        signal: controller.signal
      });
      if (init.keepBody) return { res, body: void 0 };
      const text = await res.text().catch(() => "");
      let body = text || void 0;
      try {
        body = text ? JSON.parse(text) : void 0;
      } catch {
      }
      return { res, body };
    } finally {
      clearTimeout(timer);
      init.signal?.removeEventListener("abort", onAbort);
    }
  }
  function envelopeProblems(r, expectType) {
    const problems = [];
    const warnings = [];
    const e = readErrorEnvelope(r.body);
    if (!isObject(r.body) || !isObject(r.body.error)) problems.push('body is not {"error": {...}}');
    if (!e.type) problems.push("error.type is missing");
    if (!e.message) problems.push("error.message is missing");
    if (expectType && e.type && e.type !== expectType) problems.push(`error.type is "${e.type}", expected "${expectType}"`);
    if (e.type && !KNOWN_CODES.has(e.type) && !e.type.includes(".")) {
      warnings.push(`"${e.type}" is not a standard code; product codes are "<product>.<code>"`);
    }
    if (!e.requestId) warnings.push("error.request_id is missing");
    if (!r.res.headers.get("x-request-id")) warnings.push("X-Request-Id header is missing");
    return { problems, warnings };
  }
  function identityProblems(obj, where) {
    if (!isObject(obj)) return [];
    return IDENTITY_FIELDS.filter((k) => k in obj).map((k) => `${where} has "${k}" (identity comes from the session)`);
  }
  function sourceProblems(sources, where) {
    if (sources === void 0) return [];
    if (!Array.isArray(sources)) return [`${where}.sources is not an array`];
    const out = [];
    sources.forEach((s, i) => {
      if (!isObject(s) || !isString(s.id)) return void out.push(`${where}.sources[${i}] has no id`);
      const meta = isObject(s.meta) ? s.meta : {};
      for (const k of Object.keys(meta)) {
        if (k !== "connection" && SECRET_KEY.test(k)) out.push(`${where}.sources[${s.id}].meta.${k} looks like a credential`);
      }
      if (meta.connection !== void 0) {
        const c = meta.connection;
        if (!isObject(c) || !isString(c.status) || !CONNECTION_STATES.has(c.status)) {
          out.push(`${where}.sources[${s.id}].meta.connection must be {status: connected|expired|missing, expires_at}`);
        } else {
          const extra = Object.keys(c).filter((k) => k !== "status" && k !== "expires_at");
          if (extra.length) out.push(`${where}.sources[${s.id}].meta.connection has extra fields: ${extra.join(", ")}`);
        }
      }
    });
    return out;
  }
  function conversationProblems(c, where, { list = false } = {}) {
    if (!isObject(c)) return [`${where} is not an object`];
    const out = [];
    if (!isString(c.conversation_id)) out.push(`${where}.conversation_id is missing`);
    if (!isString(c.title)) out.push(`${where}.title is missing`);
    if (!isString(c.selected_model)) {
      out.push(
        isString(c.model) ? `${where} sends "model"; the standard name is "selected_model"` : `${where}.selected_model is missing`
      );
    }
    if (typeof c.archived !== "boolean") out.push(`${where}.archived is not a boolean`);
    if (!isString(c.created_at) || !isString(c.updated_at)) out.push(`${where} needs created_at and updated_at`);
    if (Array.isArray(c.model)) out.push(`${where}.model is a catalog; the model list belongs in the config`);
    out.push(...identityProblems(c, where));
    if (!list) out.push(...sourceProblems(c.sources, where));
    return out;
  }
  const ep = {
    config: `GET ${paths.config}`,
    create: `POST ${paths.createConversation}`,
    list: `GET ${paths.listConversations}`,
    get: "GET /v1/conversations/{id}",
    patch: "PATCH /v1/conversations/{id}",
    del: "DELETE /v1/conversations/{id}",
    send: "POST /v1/conversations/{id}/messages",
    cancel: "POST /v1/conversations/{id}/messages/cancel"
  };
  const safely = async (endpoint, id2, title, fn) => {
    try {
      await fn();
    } catch (error) {
      record(endpoint, id2, title, "fail", error instanceof Error ? error.message : String(error));
    }
  };
  let config;
  await safely(ep.config, "config.shape", "Serves the config", async () => {
    const r = await call("GET", paths.config);
    if (r.res.status === 404) {
      return record(ep.config, "config.shape", "Serves the config", "fail", "endpoint 0 returns 404; the standard requires it");
    }
    if (!r.res.ok || !isObject(r.body)) {
      return record(
        ep.config,
        "config.shape",
        "Serves the config",
        "fail",
        `status ${r.res.status}, expected 200 with a JSON object`
      );
    }
    config = r.body;
    const p = [];
    if (!isString(config.protocol_version)) p.push("protocol_version is missing");
    if (!isObject(config.product) || !isString(config.product.id)) p.push("product.id is missing");
    if (!isObject(config.capabilities)) p.push("capabilities is missing");
    for (const key of ["models", "sources", "workflows"])
      if (!Array.isArray(config[key])) p.push(`${key} is not an array`);
    if (!isObject(config.limits)) p.push("limits is missing");
    if (Array.isArray(config.models)) {
      config.models.forEach((m, i) => {
        if (!isObject(m) || !isString(m.id) || !isString(m.label)) p.push(`models[${i}] needs id and label`);
      });
    }
    if (Array.isArray(config.sources)) {
      config.sources.forEach((s, i) => {
        if (!isObject(s) || !isString(s.id) || !isString(s.label)) p.push(`sources[${i}] needs id and label`);
      });
    }
    p.push(...sourceProblems(config.sources, "config"));
    const caps2 = isObject(config.capabilities) ? config.capabilities : {};
    if (caps2.cancel !== void 0 && caps2.cancel !== "server" && caps2.cancel !== "disconnect") {
      p.push('capabilities.cancel must be "server" or "disconnect"');
    }
    expectAll(ep.config, "config.shape", "Serves the config", p);
  });
  const caps = isObject(config?.capabilities) ? config.capabilities : {};
  const productId = isObject(config?.product) && isString(config.product.id) ? config.product.id : void 0;
  const hasAuth = Boolean(options.headers) || options.credentials === "include";
  if (options.checkUnauthenticated === false || !hasAuth) {
    record(ep.list, "auth.unauthenticated", "No session gets 401 unauthenticated", "skip", "no auth to leave out");
  } else {
    await safely(ep.list, "auth.unauthenticated", "No session gets 401 unauthenticated", async () => {
      const r = await call("GET", paths.listConversations, { auth: false });
      if (r.res.status === 403) {
        return record(
          ep.list,
          "auth.unauthenticated",
          "No session gets 401 unauthenticated",
          "fail",
          "403 means signed in but not allowed; no session is 401"
        );
      }
      if (r.res.status !== 401) {
        return record(
          ep.list,
          "auth.unauthenticated",
          "No session gets 401 unauthenticated",
          "fail",
          `status ${r.res.status}, expected 401`
        );
      }
      const { problems, warnings } = envelopeProblems(r);
      const type = readErrorEnvelope(r.body).type;
      if (type && type !== "unauthenticated" && !problems.length) {
        warnings.push(`401 type is "${type}"; a missing or expired session is "unauthenticated"`);
      }
      if (problems.length) expectAll(ep.list, "auth.unauthenticated", "No session gets 401 unauthenticated", problems);
      else expectAll(ep.list, "auth.unauthenticated", "No session gets 401 unauthenticated", warnings, "warn");
    });
  }
  let conversationId;
  await safely(ep.create, "create.shape", "Creates a conversation", async () => {
    const r = await call("POST", paths.createConversation);
    if (r.res.status !== 200 && r.res.status !== 201) {
      return record(ep.create, "create.shape", "Creates a conversation", "fail", `status ${r.res.status}`);
    }
    const p = conversationProblems(r.body, "response");
    if (isObject(r.body) && isString(r.body.conversation_id)) conversationId = r.body.conversation_id;
    if (isObject(r.body) && r.body.suggested_prompts !== void 0) {
      const sp = r.body.suggested_prompts;
      if (!Array.isArray(sp) || sp.some((x) => !isObject(x) || !isString(x.label) || !isString(x.prompt))) {
        p.push("suggested_prompts must be [{label, prompt}]");
      }
    }
    if (isObject(r.body) && r.body.ext !== void 0 && productId && isObject(r.body.ext)) {
      const keys = Object.keys(r.body.ext).filter((k) => k !== productId);
      if (keys.length) p.push(`ext has keys other than "${productId}": ${keys.join(", ")}`);
    }
    expectAll(ep.create, "create.shape", "Creates a conversation", p);
  });
  if (!conversationId) {
    record(ep.get, "run.stopped", "Remaining checks", "skip", "no conversation to test with");
    return summarize(checks);
  }
  const id = conversationId;
  await safely(ep.get, "get.shape", "Returns a conversation with messages", async () => {
    const r = await call("GET", paths.conversation(id));
    if (!r.res.ok) return record(ep.get, "get.shape", "Returns a conversation with messages", "fail", `status ${r.res.status}`);
    const p = conversationProblems(r.body, "response");
    if (!isObject(r.body) || !Array.isArray(r.body.messages)) p.push("messages is not an array");
    expectAll(ep.get, "get.shape", "Returns a conversation with messages", p);
  });
  await safely(ep.patch, "patch.title", "Renames and returns the conversation", async () => {
    const title = `Conformance ${rand()}`;
    const r = await call("PATCH", paths.conversation(id), { body: { title } });
    if (!r.res.ok)
      return record(ep.patch, "patch.title", "Renames and returns the conversation", "fail", `status ${r.res.status}`);
    const p = conversationProblems(r.body, "response");
    if (isObject(r.body) && r.body.title !== title) p.push("the response title is not the new title");
    expectAll(ep.patch, "patch.title", "Renames and returns the conversation", p);
  });
  const models = Array.isArray(config?.models) ? config.models.filter(isObject) : [];
  const model = models.find((m) => !m.default && isString(m.id)) ?? models[0];
  if (model && isString(model.id)) {
    await safely(ep.patch, "patch.model", "Sets the model from the config", async () => {
      const r = await call("PATCH", paths.conversation(id), { body: { model: model.id } });
      const p = [];
      if (!r.res.ok) p.push(`status ${r.res.status}`);
      else if (!isObject(r.body) || r.body.selected_model !== model.id) p.push("selected_model is not the model just set");
      expectAll(ep.patch, "patch.model", "Sets the model from the config", p);
    });
  } else {
    record(ep.patch, "patch.model", "Sets the model from the config", "skip", "the config lists no models");
  }
  if (options.sendMessages === false) {
    for (const [cid, title] of [
      ["stream.events", "Streams a reply"],
      ["stream.duplicate", "Rejects a repeated client_message_id"],
      ["stream.unsupported", "Rejects inputs the config turns off"]
    ]) {
      record(ep.send, cid, title, "skip", "sendMessages is false");
    }
  } else {
    const clientMessageId = `cm_conformance_${rand()}`;
    const body = {
      stream: true,
      client_message_id: clientMessageId,
      message: { role: "user", type: "default", content: { default: options.prompt ?? "Say hello in one short sentence." } }
    };
    let streamed = false;
    await safely(ep.send, "stream.events", "Streams a reply", async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), options.streamTimeoutMs ?? 12e4);
      try {
        const { res } = await call("POST", paths.messages(id), {
          body,
          accept: "text/event-stream",
          keepBody: true,
          signal: controller.signal
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          return record(ep.send, "stream.events", "Streams a reply", "fail", `status ${res.status}: ${text.slice(0, 200)}`);
        }
        if (!(res.headers.get("content-type") ?? "").includes("text/event-stream") || !res.body) {
          await res.body?.cancel().catch(() => void 0);
          return record(ep.send, "stream.events", "Streams a reply", "fail", "the response is not text/event-stream");
        }
        const events = [];
        const p = [];
        for await (const msg of readSse(res.body, controller.signal)) {
          if (!msg.data || msg.data === "[DONE]") continue;
          try {
            const e = JSON.parse(msg.data);
            if (!isObject(e)) p.push(`a "${msg.event}" event is not an object`);
            else events.push({ ...e, type: isString(e.type) ? e.type : msg.event });
          } catch {
            p.push(`a "${msg.event}" event is not valid JSON`);
          }
        }
        streamed = true;
        const first = events[0];
        const last = events[events.length - 1];
        if (first?.type !== "message_start") p.push("the first event is not message_start");
        else {
          if (!isString(first.message_id)) p.push("message_start.message_id is missing");
          if (first.client_message_id !== clientMessageId) p.push("message_start does not echo client_message_id");
          if (!isString(first.user_message_id)) p.push("message_start.user_message_id is missing");
        }
        if (last?.type !== "message_stop") p.push("the stream does not end with message_stop");
        else if (!isString(last.stop_reason) || !STOP_REASONS.has(last.stop_reason))
          p.push("message_stop.stop_reason is not valid");
        const toolUses = /* @__PURE__ */ new Set();
        const results = /* @__PURE__ */ new Map();
        for (const e of events) {
          if (e.type === "content_block_start" || e.type === "content_block_stop") {
            const b = e.block;
            if (!isObject(b) || !isString(b.id) || !isString(b.type)) {
              p.push(`a ${String(e.type)} block has no id or type`);
              continue;
            }
            if (!isString(b.category)) p.push(`block "${b.id}" has no category`);
            if (e.type === "content_block_stop" && b.type === "tool_use") toolUses.add(b.id);
            if (e.type === "content_block_stop" && b.type === "tool_result") {
              if (b.http_trace !== void 0 && b.http_trace !== null) p.push(`tool_result "${b.id}" sends http_trace`);
              if (isString(b.tool_use_id)) results.set(b.tool_use_id, (results.get(b.tool_use_id) ?? 0) + 1);
            }
            if (b.type.includes(".") && !isString(b.fallback_text)) p.push(`product block "${b.type}" has no fallback_text`);
          }
          if (e.type === "error") {
            if (!isString(e.error_type)) p.push("an error event has no error_type");
            else if (!KNOWN_CODES.has(e.error_type) && !e.error_type.includes(".")) {
              p.push(`error_type "${e.error_type}" is not a standard code`);
            }
          }
        }
        for (const t of toolUses) {
          const n = results.get(t) ?? 0;
          if (n !== 1) p.push(`tool_use "${t}" has ${n} tool_result blocks; the standard is exactly one`);
        }
        expectAll(ep.send, "stream.events", "Streams a reply", p);
        const h = [];
        if (!(res.headers.get("cache-control") ?? "").includes("no-cache")) h.push("send Cache-Control: no-cache");
        if ((res.headers.get("x-accel-buffering") ?? "").toLowerCase() !== "no") h.push("send X-Accel-Buffering: no");
        expectAll(ep.send, "stream.headers", "Sends the streaming headers", h, "warn");
      } finally {
        clearTimeout(timer);
        controller.abort();
      }
    });
    if (streamed) {
      await safely(ep.send, "stream.duplicate", "Rejects a repeated client_message_id", async () => {
        const r = await call("POST", paths.messages(id), { body, accept: "text/event-stream" });
        if (r.res.status !== 409) {
          return record(
            ep.send,
            "stream.duplicate",
            "Rejects a repeated client_message_id",
            "fail",
            `status ${r.res.status}, expected 409`
          );
        }
        const { problems } = envelopeProblems(r, "duplicate_message");
        expectAll(ep.send, "stream.duplicate", "Rejects a repeated client_message_id", problems);
      });
    } else {
      record(ep.send, "stream.duplicate", "Rejects a repeated client_message_id", "skip", "the first message did not stream");
    }
    const unsupported = [];
    if (caps.attachments === false) {
      unsupported.push([
        "attachments",
        {
          attachments: [
            {
              url: "https://example.com/conformance.pdf",
              filename: "conformance.pdf",
              content_type: "application/pdf",
              size: 1,
              meta: {}
            }
          ]
        }
      ]);
    }
    if (caps.workflow_context === false) {
      unsupported.push([
        "workflow_context",
        { workflow_context: [{ workflow_name: "conformance", workspace_id: [], context: {} }] }
      ]);
    }
    if (!unsupported.length) {
      record(ep.send, "stream.unsupported", "Rejects inputs the config turns off", "skip", "the config turns nothing off");
    }
    for (const [feature, extra] of unsupported) {
      await safely(ep.send, `stream.unsupported.${feature}`, `Rejects ${feature} while it's off`, async () => {
        const r = await call("POST", paths.messages(id), {
          body: { ...body, client_message_id: `cm_conformance_${rand()}`, ...extra },
          accept: "text/event-stream"
        });
        if (r.res.status !== 422) {
          return record(
            ep.send,
            `stream.unsupported.${feature}`,
            `Rejects ${feature} while it's off`,
            "fail",
            `status ${r.res.status}, expected 422`
          );
        }
        const { problems } = envelopeProblems(r, "unsupported_feature");
        expectAll(ep.send, `stream.unsupported.${feature}`, `Rejects ${feature} while it's off`, problems);
      });
    }
  }
  await safely(ep.cancel, "cancel.shape", "Answers cancel with {status}", async () => {
    const r = await call("POST", paths.cancel(id), { body: { message_id: `conformance_${rand()}` } });
    if (!r.res.ok) {
      return record(
        ep.cancel,
        "cancel.shape",
        "Answers cancel with {status}",
        "warn",
        `status ${r.res.status}; a finished or unknown message should get {"status": false}`
      );
    }
    const p = isObject(r.body) && typeof r.body.status === "boolean" ? [] : ['the body is not {"status": true|false}'];
    if (!p.length && caps.cancel === "disconnect" && isObject(r.body) && r.body.status !== false) {
      p.push('with cancel "disconnect" the endpoint always returns {"status": false}');
    }
    expectAll(ep.cancel, "cancel.shape", "Answers cancel with {status}", p);
  });
  await safely(ep.list, "list.shape", "Lists conversations", async () => {
    const r = await call("GET", paths.listConversations);
    if (!r.res.ok) return record(ep.list, "list.shape", "Lists conversations", "fail", `status ${r.res.status}`);
    const p = [];
    const items = isObject(r.body) && Array.isArray(r.body.conversations) ? r.body.conversations : void 0;
    if (!items)
      p.push(
        Array.isArray(r.body) ? 'the list is a bare array; the standard is {"conversations": [...]}' : "conversations is missing"
      );
    (items ?? []).slice(0, 20).forEach((c, i) => p.push(...conversationProblems(c, `conversations[${i}]`, { list: true })));
    expectAll(ep.list, "list.shape", "Lists conversations", p);
    if (items && options.sendMessages !== false && !items.some((c) => isObject(c) && c.conversation_id === id)) {
      record(
        ep.list,
        "list.contains",
        "Lists the conversation after its first message",
        "warn",
        "the test conversation is not in the list"
      );
    }
    const withSources = (items ?? []).filter((c) => isObject(c) && "sources" in c).length;
    if (withSources)
      record(
        ep.list,
        "list.lean",
        "Keeps list items lean",
        "warn",
        'list items carry "sources"; they belong on endpoints 1, 3 and 4'
      );
  });
  if (options.sendMessages !== false) {
    await safely(ep.get, "get.messages", "Returns the saved messages", async () => {
      const r = await call("GET", paths.conversation(id));
      if (!r.res.ok) return record(ep.get, "get.messages", "Returns the saved messages", "fail", `status ${r.res.status}`);
      const messages = isObject(r.body) && Array.isArray(r.body.messages) ? r.body.messages : [];
      const p = [];
      const w = [];
      if (!messages.length) p.push("no messages after a message was sent");
      messages.forEach((m, i) => {
        const where = `messages[${i}]`;
        if (!isObject(m)) return void p.push(`${where} is not an object`);
        if (!isString(m.message_id) || m.role !== "user" && m.role !== "assistant")
          p.push(`${where} needs message_id and role`);
        p.push(...identityProblems(m, where));
        p.push(...sourceProblems(m.sources, where));
        for (const k of ["seq", "citations"]) if (k in m) w.push(`${where}.${k} is not part of the standard`);
        if (Array.isArray(m.content)) {
          for (const b of m.content) {
            if (!isObject(b) || !isString(b.id) || !isString(b.type)) p.push(`${where} has a block without id or type`);
            else if (b.type === "tool_result" && b.http_trace !== void 0 && b.http_trace !== null) {
              p.push(`${where} tool_result "${b.id}" keeps http_trace`);
            }
          }
        }
      });
      const user = messages.find((m) => isObject(m) && m.role === "user");
      if (isObject(user) && !isString(user.client_message_id)) p.push("the user message has no client_message_id");
      expectAll(ep.get, "get.messages", "Returns the saved messages", p);
      if (w.length) expectAll(ep.get, "get.lean", "Leaves out removed fields", w, "warn");
    });
  }
  await safely(ep.get, "errors.not_found", "An unknown conversation gets 404 not_found", async () => {
    const r = await call("GET", paths.conversation(`conformance-missing-${rand()}`));
    if (r.res.status !== 404) {
      return record(
        ep.get,
        "errors.not_found",
        "An unknown conversation gets 404 not_found",
        "fail",
        `status ${r.res.status}, expected 404`
      );
    }
    const { problems, warnings } = envelopeProblems(r, "not_found");
    expectAll(ep.get, "errors.not_found", "An unknown conversation gets 404 not_found", problems);
    expectAll(ep.get, "errors.request_id", "Errors carry a request id", warnings, "warn");
  });
  await safely(ep.del, "delete", "Deletes the conversation", async () => {
    const r = await call("DELETE", paths.conversation(id));
    const p = [];
    if (!r.res.ok) p.push(`status ${r.res.status}`);
    else {
      const after = await call("GET", paths.conversation(id));
      if (after.res.status !== 404) p.push(`the conversation still loads (status ${after.res.status})`);
      const again = await call("DELETE", paths.conversation(id));
      if (!again.res.ok && again.res.status !== 404) p.push(`a second delete returns ${again.res.status}; expected 404 or 204`);
    }
    expectAll(ep.del, "delete", "Deletes the conversation", p);
    if (r.res.ok && r.res.status !== 204)
      record(ep.del, "delete.status", "Deletes with 204 No Content", "warn", `status ${r.res.status}`);
  });
  return summarize(checks);
}
function summarize(checks) {
  const count = (s) => checks.filter((c) => c.status === s).length;
  const failed = count("fail");
  return { ok: failed === 0, passed: count("pass"), failed, warnings: count("warn"), skipped: count("skip"), checks };
}
var MARK = { pass: "PASS", fail: "FAIL", warn: "WARN", skip: "SKIP" };
function formatReport(report) {
  const lines = report.checks.map(
    (c) => `${MARK[c.status]}  ${c.endpoint.padEnd(46)} ${c.title}${c.detail ? `
      ${c.detail}` : ""}`
  );
  lines.push(
    "",
    `${report.ok ? "Conforms" : "Does not conform"}: ${report.passed} passed, ${report.failed} failed, ${report.warnings} warnings, ${report.skipped} skipped`
  );
  return lines.join("\n");
}

// src/conformance/cli.ts
var USAGE = `Usage: agentic-chat-conformance --base-url <url> [options]

Checks a chat backend against the Neoflo chat standard over HTTP. It creates one
conversation, sends one message and deletes the conversation again.

Options:
  --base-url <url>      API origin (or CHAT_BASE_URL)
  --header "Name: v"    A request header, e.g. "Cookie: session=\u2026" or
                        "Authorization: Bearer \u2026". Repeatable. (or CHAT_HEADERS,
                        one header per line)
  --no-messages         Skip endpoint 6, which calls the model and costs tokens
  --prompt <text>       The test message (ask for something that uses a tool)
  --no-auth-check       Skip the 401 check for a request without the headers
  --json                Print the report as JSON
  --help                Show this help

Exit code: 0 when every check passes (warnings allowed), 1 when one fails, 2 on bad usage.`;
async function runConformanceCli(argv, env = globalThis.process?.env ?? {}, out = (line) => console.log(line)) {
  const headers = [];
  let baseUrl = env.CHAT_BASE_URL;
  let json = false;
  const options = {};
  const addHeader = (raw) => {
    const i = raw.indexOf(":");
    if (i <= 0) throw new Error(`Bad header "${raw}". Use "Name: value".`);
    headers.push([raw.slice(0, i).trim(), raw.slice(i + 1).trim()]);
  };
  try {
    for (const line of (env.CHAT_HEADERS ?? "").split("\n")) if (line.trim()) addHeader(line);
    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i];
      const value = () => {
        const v = argv[++i];
        if (v === void 0) throw new Error(`${arg} needs a value.`);
        return v;
      };
      if (arg === "--help" || arg === "-h") {
        out(USAGE);
        return 0;
      } else if (arg === "--base-url") baseUrl = value();
      else if (arg === "--header" || arg === "-H") addHeader(value());
      else if (arg === "--no-messages") options.sendMessages = false;
      else if (arg === "--prompt") options.prompt = value();
      else if (arg === "--no-auth-check") options.checkUnauthenticated = false;
      else if (arg === "--json") json = true;
      else throw new Error(`Unknown option ${arg}.`);
    }
    if (!baseUrl) throw new Error("--base-url is required.");
  } catch (error) {
    out(`${error instanceof Error ? error.message : String(error)}

${USAGE}`);
    return 2;
  }
  const report = await runConformance({
    ...options,
    baseUrl,
    headers: headers.length ? headers : void 0,
    onCheck: json ? void 0 : (c) => out(`${c.status.toUpperCase().padEnd(4)}  ${c.endpoint.padEnd(46)} ${c.title}${c.detail ? `
      ${c.detail}` : ""}`)
  });
  out(
    json ? JSON.stringify(report, null, 2) : `
${report.ok ? "Conforms" : "Does not conform"}: ${report.passed} passed, ${report.failed} failed, ${report.warnings} warnings, ${report.skipped} skipped`
  );
  return report.ok ? 0 : 1;
}
export {
  formatReport,
  runConformance,
  runConformanceCli
};
//# sourceMappingURL=conformance.js.map