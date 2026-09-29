"use client";
import {
  BlockContext,
  BlockErrorBoundary,
  BlockRenderer,
  ChatContext,
  ChatProvider,
  Composer,
  ConversationList,
  Hitl,
  Message,
  MessageBlocks,
  MessageContext,
  Suggestions,
  Thread,
  ThreadContext,
  ThreadProvider,
  defaultLabels,
  isDev,
  messageText,
  shallowEqual,
  useActiveConversationId,
  useBlock,
  useBlockActions,
  useChatActions,
  useChatContext,
  useChatEvent,
  useChatRuntime,
  useComposer,
  useComposerContext,
  useConversations,
  useHitl,
  useHitlChoice,
  useIsBusy,
  useIsomorphicLayoutEffect,
  useLabels,
  useMessage,
  useMessages,
  usePreference,
  useRun,
  useScope,
  useStoreSelector,
  useThread,
  useThreadHandle,
  useThreadMeta,
  useThreadScroll
} from "./chunk-ZKYPOMXY.js";
import {
  DEFAULT_REST_PATHS,
  NEW_THREAD_KEY,
  PROTOCOL_VERSION,
  SseParser,
  createChatRuntime,
  createMemoryStorage,
  createPersister,
  createRestAdapter,
  createSafeStorage,
  createStore,
  createThreadState,
  createWebStorage,
  defaultApplyDelta,
  defaultScopeToRequest,
  emptyMeta,
  filterConversations,
  formatBytes,
  frameScheduler,
  groupConversations,
  groupKeyFor,
  interruptRun,
  isContentBlock,
  mergeWorkflowContexts,
  metaFromBootstrap,
  normalizeConversationDetail,
  normalizeMessages,
  parseStreamEvent,
  readSse,
  reduceStreamEvent,
  selectAll,
  sortConversations,
  summarizeScope,
  syncScheduler,
  textFieldOf,
  toConversationItem,
  toErrorInfo
} from "./chunk-ZXNHFCYQ.js";
import {
  BLOCK_ICON_PX,
  mode,
  monoFont
} from "./chunk-MSRCL6UC.js";
import {
  BLOCK_TYPES,
  applyPlanDelta,
  createBlockRegistry,
  defineBlock,
  formatJsonish,
  formatValue,
  humanizeKey,
  parseApproval,
  parseArtifact,
  parseChart,
  parseChoice,
  parseError,
  parseImage,
  parsePlan,
  parseSources,
  parseTable,
  parseText,
  parseThinking,
  parseToolCall
} from "./chunk-HYITIWF6.js";
import {
  ChatApiError,
  ChatError,
  ChatProtocolError,
  ChatStreamError,
  ChatTimeoutError,
  isAbortError
} from "./chunk-MQH7BY4V.js";

// src/ui/shell/AgenticChat.tsx
import { Box as Box13, IconButton as IconButton7, Stack as Stack8, Tooltip as Tooltip4, Typography as Typography11 } from "@neofloai/atoms";
import { NotePencilIcon as NotePencilIcon2, SidebarSimpleIcon } from "@neofloai/atoms/icons";
import { border as border7, elevation as elevation3, surface as surface7, text as text11 } from "@neofloai/atoms/tokens";
import { useMemo as useMemo2, useRef as useRef2, useState as useState10 } from "react";

// src/ui/blocks/basic.tsx
import {
  Alert as Alert2,
  Box as Box5,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Typography as Typography5
} from "@neofloai/atoms";
import { BrainIcon, FilesIcon, FileTextIcon, WrenchIcon } from "@neofloai/atoms/icons";
import { text as text5 } from "@neofloai/atoms/tokens";
import { useEffect as useEffect2, useState as useState3 } from "react";

// src/ui/kit/BlockShell.tsx
import { Box, Card, CardContent, Collapse, IconButton, Stack, Typography } from "@neofloai/atoms";
import { CaretDownIcon } from "@neofloai/atoms/icons";
import { border, surface, text, icon as iconTokens } from "@neofloai/atoms/tokens";
import { useId, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
var PRIMARY_TINT = { light: surface.primary.subtle.light, dark: surface.soft.default.dark };
var TONES = {
  primary: { bg: PRIMARY_TINT, line: border.primary.default, glyph: iconTokens.primary[3] },
  warning: { bg: surface.warning.subtle, line: border.warning.default, glyph: iconTokens.warning[3] },
  danger: { bg: surface.error.subtle, line: border.error.default, glyph: iconTokens.error[3] }
};
function BlockShell({
  icon,
  title,
  meta,
  actions,
  collapsible,
  open,
  defaultOpen = true,
  onOpenChange,
  tone = "default",
  indent,
  footer,
  busy,
  children,
  flushBody,
  "aria-label": ariaLabel
}) {
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const isOpen = open ?? innerOpen;
  const bodyId = useId();
  const toggle = () => {
    const next = !isOpen;
    if (open === void 0) setInnerOpen(next);
    onOpenChange?.(next);
  };
  const hasBody = children !== void 0 && children !== null && children !== false;
  const indentBody = !flushBody && (indent ?? Boolean(icon));
  const toneSpec = tone === "default" ? void 0 : TONES[tone];
  const bodySx = (theme) => ({
    pt: flushBody ? 1.5 : 1.25,
    pl: indentBody ? `calc(${BLOCK_ICON_PX}px + ${theme.spacing(1.25)})` : 0,
    mx: flushBody ? -2 : 0,
    mb: flushBody ? -2 : 0,
    minWidth: 0
  });
  return /* @__PURE__ */ jsx(
    Card,
    {
      component: "section",
      "aria-label": ariaLabel,
      "aria-busy": busy || void 0,
      sx: (theme) => ({
        overflow: "hidden",
        ...toneSpec ? mode(theme, { backgroundColor: toneSpec.bg, borderColor: toneSpec.line }) : {}
      }),
      children: /* @__PURE__ */ jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxs(
          Stack,
          {
            direction: "row",
            spacing: 1.25,
            onClick: collapsible ? toggle : void 0,
            sx: {
              alignItems: "center",
              minHeight: 20,
              cursor: collapsible ? "pointer" : void 0,
              userSelect: collapsible ? "none" : void 0
            },
            children: [
              icon ? /* @__PURE__ */ jsx(
                Box,
                {
                  "aria-hidden": true,
                  sx: (theme) => ({
                    display: "inline-flex",
                    flexShrink: 0,
                    "& svg": { width: BLOCK_ICON_PX, height: BLOCK_ICON_PX },
                    ...mode(theme, { color: toneSpec?.glyph ?? iconTokens.default.b2 })
                  }),
                  children: icon
                }
              ) : null,
              /* @__PURE__ */ jsx(
                Typography,
                {
                  variant: "body1",
                  weight: "medium",
                  component: "div",
                  sx: (theme) => ({
                    flex: 1,
                    minWidth: 0,
                    overflowWrap: "anywhere",
                    ...mode(theme, { color: text.default.heading })
                  }),
                  children: title
                }
              ),
              meta !== void 0 && meta !== null ? /* @__PURE__ */ jsx(
                Typography,
                {
                  variant: "body2",
                  component: "div",
                  sx: (theme) => ({ flexShrink: 0, whiteSpace: "nowrap", ...mode(theme, { color: text.default.b3 }) }),
                  children: meta
                }
              ) : null,
              actions ? /* @__PURE__ */ jsx(Stack, { direction: "row", spacing: 0.5, sx: { flexShrink: 0 }, onClick: (e) => e.stopPropagation(), children: actions }) : null,
              collapsible ? /* @__PURE__ */ jsx(
                IconButton,
                {
                  size: "sm",
                  variant: "secondary",
                  appearance: "text",
                  "aria-expanded": isOpen,
                  "aria-controls": bodyId,
                  "aria-label": typeof title === "string" ? title : "Toggle details",
                  onClick: (e) => {
                    e.stopPropagation();
                    toggle();
                  },
                  sx: { my: -0.75, mr: -0.75 },
                  children: /* @__PURE__ */ jsx(CaretDownIcon, { style: { transition: "transform 150ms ease", transform: isOpen ? "rotate(180deg)" : void 0 } })
                }
              ) : null
            ]
          }
        ),
        hasBody ? collapsible ? /* @__PURE__ */ jsx(Collapse, { in: isOpen, children: /* @__PURE__ */ jsx(Box, { id: bodyId, sx: bodySx, children }) }) : /* @__PURE__ */ jsx(Box, { sx: bodySx, children }) : null,
        footer ? /* @__PURE__ */ jsx(
          Stack,
          {
            direction: "row",
            spacing: 1,
            sx: (theme) => ({
              mt: 1.5,
              flexWrap: "wrap",
              alignItems: "center",
              pl: indentBody ? `calc(${BLOCK_ICON_PX}px + ${theme.spacing(1.25)})` : 0
            }),
            children: footer
          }
        ) : null
      ] })
    }
  );
}

// src/ui/kit/helpers.tsx
import { Alert, Button } from "@neofloai/atoms";
import { useEffect, useState as useState2 } from "react";
import { jsx as jsx2 } from "react/jsx-runtime";
var BUSY = /* @__PURE__ */ new Set(["submitting", "streaming", "cancelling"]);
function useCanRetry() {
  return useThread((s) => {
    if (BUSY.has(s.run.status)) return false;
    const last = s.messages[s.messages.length - 1];
    return s.run.status === "error" || last?.status === "error" || last?.status === "interrupted";
  });
}
function safeUrl(url, { allowDataImage = false } = {}) {
  if (!url) return void 0;
  const trimmed = url.trim();
  if (/^(https?:|mailto:|blob:)/i.test(trimmed)) return trimmed;
  if (allowDataImage && /^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml)[;,]/i.test(trimmed)) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return void 0;
  return trimmed;
}
function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "";
  if (ms < 6e4) return `${(ms / 1e3).toFixed(ms < 1e4 ? 1 : 0)}s`;
  return `${Math.round(ms / 6e4)}m`;
}
function RetryButton({ retryAfter, onRetry }) {
  const labels = useLabels();
  const [left, setLeft] = useState2(() => Math.ceil(retryAfter ?? 0));
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1e3);
    return () => clearTimeout(t);
  }, [left]);
  return /* @__PURE__ */ jsx2(Button, { size: "sm", variant: "error", appearance: "text", disabled: left > 0, onClick: onRetry, children: left > 0 ? labels.tryAgainIn(left) : labels.tryAgain });
}
function ErrorNotice({
  title,
  message,
  retryable = true,
  retryAfter,
  onRetry
}) {
  const canRetry = useCanRetry();
  const { retry } = useChatActions();
  const handler = onRetry ?? (() => void retry());
  return /* @__PURE__ */ jsx2(
    Alert,
    {
      severity: "error",
      floating: true,
      title,
      action: retryable && (onRetry || canRetry) ? /* @__PURE__ */ jsx2(RetryButton, { retryAfter, onRetry: handler }) : void 0,
      children: message
    }
  );
}

// src/ui/kit/KeyValueList.tsx
import { Box as Box2, Typography as Typography2 } from "@neofloai/atoms";
import { text as text2 } from "@neofloai/atoms/tokens";
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function KeyValueList({ items }) {
  if (!items.length) return null;
  return /* @__PURE__ */ jsx3(
    Box2,
    {
      component: "dl",
      sx: {
        display: "grid",
        gridTemplateColumns: "minmax(56px, max-content) minmax(0, 1fr)",
        columnGap: 1.25,
        rowGap: 1,
        m: 0
      },
      children: items.map((item) => /* @__PURE__ */ jsxs2(Box2, { sx: { display: "contents" }, children: [
        /* @__PURE__ */ jsx3(
          Typography2,
          {
            variant: "body2",
            component: "dt",
            sx: (theme) => ({ minWidth: 0, overflowWrap: "anywhere", ...mode(theme, { color: text2.default.b3 }) }),
            children: item.label ?? item.key
          }
        ),
        /* @__PURE__ */ jsx3(
          Typography2,
          {
            variant: "body2",
            component: "dd",
            sx: (theme) => ({
              m: 0,
              minWidth: 0,
              overflowWrap: "anywhere",
              ...mode(theme, { color: text2.default.b1 })
            }),
            children: item.value
          }
        )
      ] }, item.key))
    }
  );
}

// src/ui/kit/Shimmer.tsx
import { Box as Box3, Typography as Typography3 } from "@neofloai/atoms";
import { surface as surface2, text as text3 } from "@neofloai/atoms/tokens";
import { jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
var gradient = (from, to) => `linear-gradient(90deg, ${from} 0%, ${to} 45%, ${from} 90%)`;
function Shimmer({
  children,
  variant = "body1",
  bar = false
}) {
  const sweep = {
    light: gradient(text3.default.b3.light, text3.default.b1.light),
    dark: gradient(text3.default.b3.dark, text3.default.b1.dark)
  };
  return /* @__PURE__ */ jsxs3(Box3, { role: "status", "aria-live": "polite", sx: { minWidth: 0 }, children: [
    children ? /* @__PURE__ */ jsx4(
      Typography3,
      {
        variant,
        component: "div",
        sx: (theme) => ({
          display: "inline-block",
          backgroundSize: "220% 100%",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
          "@keyframes acu-shimmer": { from: { backgroundPosition: "120% 0" }, to: { backgroundPosition: "-120% 0" } },
          animation: "acu-shimmer 1.8s linear infinite",
          ...mode(theme, { backgroundImage: sweep }),
          "@media (prefers-reduced-motion: reduce)": {
            animation: "none",
            ...mode(theme, { color: text3.default.b2 })
          }
        }),
        children
      }
    ) : null,
    bar ? /* @__PURE__ */ jsx4(
      Box3,
      {
        "aria-hidden": true,
        sx: (theme) => ({
          mt: 1.25,
          height: 8,
          borderRadius: 999,
          overflow: "hidden",
          position: "relative",
          ...mode(theme, { backgroundColor: surface2.layers.card3 }),
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            width: "40%",
            "@keyframes acu-bar": { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(250%)" } },
            animation: "acu-bar 1.6s ease-in-out infinite",
            ...mode(theme, {
              backgroundImage: {
                light: `linear-gradient(90deg, transparent, ${surface2.layers.page.light}, transparent)`,
                dark: `linear-gradient(90deg, transparent, ${surface2.layers.card6OnColor.dark}, transparent)`
              }
            }),
            "@media (prefers-reduced-motion: reduce)": { animation: "none" }
          }
        })
      }
    ) : null
  ] });
}
function PulseDot() {
  return /* @__PURE__ */ jsx4(
    Box3,
    {
      component: "span",
      "aria-hidden": true,
      sx: (theme) => ({
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        flexShrink: 0,
        ...mode(theme, { backgroundColor: surface2.primary.default }),
        "@keyframes acu-pulse": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.35 } },
        animation: "acu-pulse 1.2s ease-in-out infinite",
        "@media (prefers-reduced-motion: reduce)": { animation: "none" }
      })
    }
  );
}

// src/ui/blocks/Markdown.tsx
import {
  Box as Box4,
  Card as Card2,
  Divider,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography as Typography4
} from "@neofloai/atoms";
import { border as border2, surface as surface3, text as text4 } from "@neofloai/atoms/tokens";
import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { jsx as jsx5 } from "react/jsx-runtime";
var isExternal = (href) => Boolean(href && /^https?:\/\//i.test(href));
function align(a) {
  return a === "left" || a === "center" || a === "right" ? a : void 0;
}
function buildComponents(size) {
  const body = size === "md" ? { variant: "h6", weight: "regular" } : { variant: "body1" };
  const spaced = { "&:not(:last-child)": { mb: size === "md" ? 1.5 : 1 } };
  return {
    p: ({ children }) => /* @__PURE__ */ jsx5(Typography4, { ...body, component: "p", sx: (t) => ({ ...spaced, ...mode(t, { color: text4.default.b1 }) }), children }),
    h1: ({ children }) => /* @__PURE__ */ jsx5(Typography4, { variant: "h5", component: "h3", sx: { mt: 2, mb: 1, "&:first-of-type": { mt: 0 } }, children }),
    h2: ({ children }) => /* @__PURE__ */ jsx5(Typography4, { variant: "h6", component: "h4", sx: { mt: 2, mb: 1, "&:first-of-type": { mt: 0 } }, children }),
    h3: ({ children }) => /* @__PURE__ */ jsx5(Typography4, { variant: "body1", weight: "semibold", component: "h5", sx: { mt: 1.5, mb: 0.75 }, children }),
    h4: ({ children }) => /* @__PURE__ */ jsx5(Typography4, { variant: "body1", weight: "semibold", component: "h6", sx: { mt: 1.5, mb: 0.75 }, children }),
    h5: ({ children }) => /* @__PURE__ */ jsx5(Typography4, { variant: "body1", weight: "medium", component: "h6", sx: { mt: 1, mb: 0.5 }, children }),
    h6: ({ children }) => /* @__PURE__ */ jsx5(Typography4, { variant: "body1", weight: "medium", component: "h6", sx: { mt: 1, mb: 0.5 }, children }),
    a: ({ href, children }) => /* @__PURE__ */ jsx5(
      Link,
      {
        href,
        target: isExternal(href) ? "_blank" : void 0,
        rel: isExternal(href) ? "noopener noreferrer" : void 0,
        children
      }
    ),
    ul: ({ children }) => /* @__PURE__ */ jsx5(Box4, { component: "ul", sx: { pl: 3, my: 0, ...spaced }, children }),
    ol: ({ children, start }) => /* @__PURE__ */ jsx5(Box4, { component: "ol", start, sx: { pl: 3, my: 0, ...spaced }, children }),
    li: ({ children }) => /* @__PURE__ */ jsx5(
      Typography4,
      {
        ...body,
        component: "li",
        sx: (t) => ({ "&:not(:last-child)": { mb: 0.5 }, ...mode(t, { color: text4.default.b1 }) }),
        children
      }
    ),
    blockquote: ({ children }) => /* @__PURE__ */ jsx5(
      Box4,
      {
        component: "blockquote",
        sx: (t) => ({
          m: 0,
          pl: 1.5,
          borderLeft: "2px solid",
          ...spaced,
          ...mode(t, { borderColor: border2.layers.card3, color: text4.default.b2 })
        }),
        children
      }
    ),
    hr: () => /* @__PURE__ */ jsx5(Divider, { sx: { my: 2 } }),
    code: ({ className, children }) => {
      const block = /language-/.test(className ?? "") || String(children ?? "").includes("\n");
      if (block) return /* @__PURE__ */ jsx5("code", { className, children });
      return /* @__PURE__ */ jsx5(
        Box4,
        {
          component: "code",
          sx: (t) => ({
            fontFamily: monoFont,
            fontSize: "0.9em",
            px: 0.5,
            py: 0.125,
            borderRadius: 0.5,
            ...mode(t, { backgroundColor: surface3.layers.card2, color: text4.default.heading })
          }),
          children
        }
      );
    },
    pre: ({ children }) => /* @__PURE__ */ jsx5(
      Box4,
      {
        component: "pre",
        sx: (t) => ({
          m: 0,
          p: 1.5,
          overflowX: "auto",
          borderRadius: 1,
          border: "1px solid",
          fontFamily: monoFont,
          fontSize: t.typography.body2.fontSize,
          lineHeight: t.typography.body2.lineHeight,
          ...spaced,
          ...mode(t, { backgroundColor: surface3.layers.card2, borderColor: border2.layers.card2, color: text4.default.heading }),
          "& code": { fontFamily: "inherit" }
        }),
        children
      }
    ),
    table: ({ children }) => /* @__PURE__ */ jsx5(Card2, { sx: { ...spaced }, children: /* @__PURE__ */ jsx5(TableContainer, { children: /* @__PURE__ */ jsx5(Table, { size: "sm", children }) }) }),
    thead: ({ children }) => /* @__PURE__ */ jsx5(TableHead, { children }),
    tbody: ({ children }) => /* @__PURE__ */ jsx5(TableBody, { children }),
    tr: ({ children }) => /* @__PURE__ */ jsx5(TableRow, { children }),
    th: ({ children, style }) => /* @__PURE__ */ jsx5(TableCell, { align: align(style?.textAlign), children }),
    td: ({ children, style }) => /* @__PURE__ */ jsx5(TableCell, { align: align(style?.textAlign), children }),
    img: ({ src, alt }) => typeof src === "string" ? /* @__PURE__ */ jsx5(
      Box4,
      {
        component: "img",
        src,
        alt: alt ?? "",
        loading: "lazy",
        sx: { maxWidth: "100%", borderRadius: 1, display: "block", ...spaced }
      }
    ) : null
  };
}
var COMPONENTS = { md: buildComponents("md"), sm: buildComponents("sm") };
var Markdown = memo(function Markdown2({ children, size = "md", components }) {
  return /* @__PURE__ */ jsx5(Box4, { sx: { minWidth: 0, overflowWrap: "anywhere" }, children: /* @__PURE__ */ jsx5(
    ReactMarkdown,
    {
      remarkPlugins: [remarkGfm],
      components: components ? { ...COMPONENTS[size], ...components } : COMPONENTS[size],
      children
    }
  ) });
});

// src/ui/blocks/basic.tsx
import { jsx as jsx6, jsxs as jsxs4 } from "react/jsx-runtime";
function TextBlock({ data }) {
  if (!data.text) return null;
  return /* @__PURE__ */ jsx6(Markdown, { children: data.text });
}
function ThinkingBlock({ data, status }) {
  const labels = useLabels();
  const streaming = status === "streaming";
  const [open, setOpen] = useState3(streaming);
  useEffect2(() => {
    if (!streaming) setOpen(false);
  }, [streaming]);
  const seconds = data.durationMs !== void 0 ? Math.round(data.durationMs / 1e3) : void 0;
  const title = streaming ? /* @__PURE__ */ jsx6(Shimmer, { children: labels.thinkingLive }) : seconds !== void 0 ? labels.thoughtFor(seconds) : labels.thought;
  return /* @__PURE__ */ jsx6(BlockShell, { icon: /* @__PURE__ */ jsx6(BrainIcon, {}), title, collapsible: true, open, onOpenChange: setOpen, busy: streaming, children: data.text ? /* @__PURE__ */ jsx6(
    Typography5,
    {
      variant: "body1",
      component: "div",
      sx: (t) => ({ whiteSpace: "pre-wrap", ...mode(t, { color: text5.default.b2 }) }),
      children: data.text
    }
  ) : null });
}
function ToolBlock({ data }) {
  const labels = useLabels();
  const running = data.status === "running";
  const items = data.input.map(([k, v]) => ({ key: k, label: humanizeKey(k), value: formatJsonish(v) }));
  if (data.summary) items.push({ key: "__returned", label: "returned", value: data.summary });
  else if (data.output !== void 0 && !running)
    items.push({ key: "__returned", label: "returned", value: formatJsonish(data.output) });
  if (data.error) {
    items.push({
      key: "__error",
      label: "error",
      value: /* @__PURE__ */ jsx6(Box5, { component: "span", sx: (t) => mode(t, { color: text5.error[3] }), children: data.error })
    });
  }
  const meta = running ? /* @__PURE__ */ jsxs4(Box5, { component: "span", sx: { display: "inline-flex", alignItems: "center", gap: 0.75 }, children: [
    /* @__PURE__ */ jsx6(CircularProgress, { size: 12, color: "secondary" }),
    labels.toolRunning
  ] }) : data.status === "error" ? /* @__PURE__ */ jsx6(Chip, { size: "sm", variant: "error", label: labels.toolFailed }) : data.durationMs !== void 0 ? formatDuration(data.durationMs) : void 0;
  return /* @__PURE__ */ jsx6(BlockShell, { icon: /* @__PURE__ */ jsx6(WrenchIcon, {}), title: data.title ?? data.name, meta, busy: running, "aria-label": data.name, children: items.length ? /* @__PURE__ */ jsx6(KeyValueList, { items }) : null });
}
function SourcesBlock({ data, actions }) {
  const labels = useLabels();
  const [checked, setChecked] = useState3(
    () => Object.fromEntries(data.items.map((i) => [i.id, i.selected ?? false]))
  );
  const title = data.title ?? labels.sources(data.items.length);
  return /* @__PURE__ */ jsx6(BlockShell, { icon: /* @__PURE__ */ jsx6(FilesIcon, {}), title, flushBody: true, children: /* @__PURE__ */ jsx6(List, { dense: true, children: data.items.map((item) => {
    const href = safeUrl(item.url);
    const primary = item.label;
    if (data.selectable) {
      return /* @__PURE__ */ jsx6(ListItem, { disablePadding: true, children: /* @__PURE__ */ jsxs4(
        ListItemButton,
        {
          role: "checkbox",
          "aria-checked": Boolean(checked[item.id]),
          onClick: () => {
            const next = !checked[item.id];
            setChecked((c) => ({ ...c, [item.id]: next }));
            actions.emit("source_toggle", { ...item, selected: next });
          },
          children: [
            /* @__PURE__ */ jsx6(ListItemIcon, { children: /* @__PURE__ */ jsx6(Checkbox, { size: "sm", checked: Boolean(checked[item.id]), tabIndex: -1, "aria-hidden": true }) }),
            /* @__PURE__ */ jsx6(ListItemText, { primary, secondary: item.description })
          ]
        }
      ) }, item.id);
    }
    return /* @__PURE__ */ jsx6(ListItem, { disablePadding: true, children: /* @__PURE__ */ jsxs4(
      ListItemButton,
      {
        ...href ? { component: "a", href, target: "_blank", rel: "noopener noreferrer" } : {},
        onClick: () => actions.emit("open_source", item),
        children: [
          /* @__PURE__ */ jsx6(ListItemIcon, { children: /* @__PURE__ */ jsx6(FileTextIcon, { size: 14 }) }),
          /* @__PURE__ */ jsx6(ListItemText, { primary, secondary: item.description })
        ]
      }
    ) }, item.id);
  }) }) });
}
function ErrorBlock({ data, actions }) {
  const canRetry = useCanRetry();
  return /* @__PURE__ */ jsx6(
    ErrorNotice,
    {
      title: data.title,
      message: data.message,
      retryable: data.retryable && canRetry,
      retryAfter: data.retryAfter,
      onRetry: canRetry ? actions.retry : void 0
    }
  );
}
function UnknownBlock({ block }) {
  const labels = useLabels();
  if (!isDev()) return null;
  const json = (() => {
    try {
      return JSON.stringify(block.data, null, 2).slice(0, 4e3);
    } catch {
      return String(block.data);
    }
  })();
  return /* @__PURE__ */ jsx6(Alert2, { severity: "warning", floating: true, title: `${labels.unknownBlock}: ${block.type}`, children: /* @__PURE__ */ jsx6(Box5, { component: "pre", sx: { m: 0, fontFamily: monoFont, whiteSpace: "pre-wrap", maxHeight: 240, overflow: "auto" }, children: json }) });
}
function BlockCrashNotice() {
  const labels = useLabels();
  return /* @__PURE__ */ jsx6(Alert2, { severity: "warning", floating: true, title: labels.blockCrashed });
}

// src/ui/blocks/hitl.tsx
import { Box as Box6, Button as Button2, Checkbox as Checkbox2, Chip as Chip2, Radio, RadioGroup, Stack as Stack2, Typography as Typography6 } from "@neofloai/atoms";
import { ListChecksIcon, WarningIcon } from "@neofloai/atoms/icons";
import { text as text6 } from "@neofloai/atoms/tokens";
import { useState as useState4 } from "react";
import { Fragment, jsx as jsx7, jsxs as jsxs5 } from "react/jsx-runtime";
var same = (a, b) => {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return a === b;
  }
};
function DecisionError() {
  const labels = useLabels();
  return /* @__PURE__ */ jsx7(Typography6, { variant: "body2", component: "span", sx: (t) => mode(t, { color: text6.error[3] }), children: labels.decisionFailed });
}
function ApprovalBlock({ data }) {
  const labels = useLabels();
  const hitl = useHitl();
  const [clicked, setClicked] = useState4(null);
  const decide = async (which) => {
    setClicked(which);
    try {
      await hitl.submit(which === "approve" ? data.approveValue : data.rejectValue);
    } finally {
      setClicked(null);
    }
  };
  const resolvedAs = hitl.isResolved ? same(hitl.decision, data.rejectValue) ? "reject" : "approve" : null;
  const live = hitl.isPending || hitl.isSubmitting;
  const tone = live ? data.tone === "danger" ? "danger" : data.tone === "warning" ? "warning" : "primary" : "default";
  let footer = null;
  if (resolvedAs) {
    footer = /* @__PURE__ */ jsx7(
      Chip2,
      {
        size: "sm",
        variant: resolvedAs === "approve" ? "success" : "secondary",
        label: resolvedAs === "approve" ? labels.approved : labels.rejected
      }
    );
  } else if (live) {
    footer = /* @__PURE__ */ jsxs5(Fragment, { children: [
      /* @__PURE__ */ jsx7(
        Button2,
        {
          size: "sm",
          variant: "secondary",
          appearance: "text",
          disabled: !hitl.canSubmit,
          loading: hitl.isSubmitting && clicked === "reject",
          onClick: () => void decide("reject"),
          children: data.rejectLabel ?? labels.reject
        }
      ),
      /* @__PURE__ */ jsx7(
        Button2,
        {
          size: "sm",
          variant: data.tone === "danger" ? "error" : "primary",
          disabled: !hitl.canSubmit,
          loading: hitl.isSubmitting && clicked === "approve",
          onClick: () => void decide("approve"),
          children: data.approveLabel ?? labels.approve
        }
      ),
      hitl.status === "failed" ? /* @__PURE__ */ jsx7(DecisionError, {}) : null
    ] });
  }
  return /* @__PURE__ */ jsx7(BlockShell, { icon: /* @__PURE__ */ jsx7(WarningIcon, {}), title: data.title, tone, footer, busy: hitl.isSubmitting, children: data.description || data.details.length ? /* @__PURE__ */ jsxs5(Stack2, { spacing: 1.5, children: [
    data.description ? /* @__PURE__ */ jsx7(Typography6, { variant: "body1", component: "div", sx: (t) => mode(t, { color: text6.default.b1 }), children: data.description }) : null,
    data.details.length ? /* @__PURE__ */ jsx7(
      KeyValueList,
      {
        items: data.details.map(([k, v]) => ({
          key: k,
          label: humanizeKey(k),
          value: typeof v === "string" ? v : formatJsonish(v)
        }))
      }
    ) : null
  ] }) : null });
}
function initialSelection(decision) {
  if (Array.isArray(decision)) return decision.map(String);
  if (typeof decision === "string") return [decision];
  return [];
}
function ChoiceBlock({ data }) {
  const labels = useLabels();
  const hitl = useHitl();
  const [selected, setSelected] = useState4(() => initialSelection(hitl.decision));
  const locked = !hitl.canSubmit;
  const tooFew = selected.length < data.min;
  const tooMany = data.max !== void 0 && selected.length > data.max;
  const live = hitl.isPending || hitl.isSubmitting;
  const toggle = (value) => setSelected((prev) => prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]);
  const footer = hitl.isResolved ? /* @__PURE__ */ jsx7(Chip2, { size: "sm", variant: "success", label: labels.submitted }) : live ? /* @__PURE__ */ jsxs5(Fragment, { children: [
    /* @__PURE__ */ jsx7(
      Button2,
      {
        size: "sm",
        disabled: locked || tooFew || tooMany,
        loading: hitl.isSubmitting,
        onClick: () => void hitl.submit(data.multiple ? selected : selected[0] ?? ""),
        children: data.submitLabel ?? labels.submit
      }
    ),
    tooMany && data.max !== void 0 ? /* @__PURE__ */ jsx7(Typography6, { variant: "body2", component: "span", sx: (t) => mode(t, { color: text6.error[3] }), children: labels.selectAtMost(data.max) }) : data.multiple && data.min > 1 && tooFew ? /* @__PURE__ */ jsx7(Typography6, { variant: "body2", component: "span", sx: (t) => mode(t, { color: text6.default.b3 }), children: labels.selectAtLeast(data.min) }) : null,
    hitl.status === "failed" ? /* @__PURE__ */ jsx7(DecisionError, {}) : null
  ] }) : null;
  return /* @__PURE__ */ jsx7(
    BlockShell,
    {
      icon: /* @__PURE__ */ jsx7(ListChecksIcon, {}),
      title: data.title,
      tone: live ? "primary" : "default",
      footer,
      busy: hitl.isSubmitting,
      children: /* @__PURE__ */ jsxs5(Stack2, { spacing: 1, children: [
        data.description ? /* @__PURE__ */ jsx7(Typography6, { variant: "body1", component: "div", sx: (t) => mode(t, { color: text6.default.b1 }), children: data.description }) : null,
        data.multiple ? /* @__PURE__ */ jsx7(Box6, { role: "group", "aria-label": data.title, sx: { display: "flex", flexDirection: "column", gap: 0.25 }, children: data.options.map((o) => /* @__PURE__ */ jsx7(
          Checkbox2,
          {
            label: o.label,
            checked: selected.includes(o.value),
            disabled: locked,
            onChange: () => toggle(o.value)
          },
          o.value
        )) }) : /* @__PURE__ */ jsx7(RadioGroup, { "aria-label": data.title, value: selected[0] ?? "", onChange: (_, value) => setSelected([value]), children: data.options.map((o) => /* @__PURE__ */ jsx7(Radio, { value: o.value, label: o.label, disabled: locked }, o.value)) })
      ] })
    }
  );
}

// src/ui/blocks/media.tsx
import {
  Box as Box7,
  Chip as Chip3,
  CircularProgress as CircularProgress2,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton as IconButton2,
  Skeleton,
  Stack as Stack3,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Tooltip,
  Typography as Typography7
} from "@neofloai/atoms";
import {
  ArrowsOutSimpleIcon,
  CheckIcon,
  DownloadSimpleIcon,
  FileTextIcon as FileTextIcon2,
  ImageBrokenIcon,
  MinusIcon,
  XIcon
} from "@neofloai/atoms/icons";
import { border as border3, icon as iconTokens2, surface as surface4, text as text7 } from "@neofloai/atoms/tokens";
import { useState as useState5 } from "react";
import { Fragment as Fragment2, jsx as jsx8, jsxs as jsxs6 } from "react/jsx-runtime";
var PREVIEW_LINES = 6;
var FORMAT_LABEL = { markdown: "Markdown", text: "Text", json: "JSON", csv: "CSV", code: "Code" };
function download(data) {
  if (typeof document === "undefined") return;
  const href = safeUrl(data.url);
  const a = document.createElement("a");
  if (href) {
    a.href = href;
  } else if (data.content !== void 0) {
    a.href = URL.createObjectURL(new Blob([data.content], { type: data.mimeType ?? "text/plain" }));
  } else return;
  a.download = data.title;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (!href) setTimeout(() => URL.revokeObjectURL(a.href), 1e3);
}
function ArtifactBlock({ data, actions, status }) {
  const labels = useLabels();
  const [open, setOpen] = useState5(false);
  const content = data.content ?? "";
  const lines = content.split("\n");
  const truncated = lines.length > PREVIEW_LINES;
  const canDownload = Boolean(safeUrl(data.url) || data.content !== void 0);
  const openFull = () => {
    setOpen(true);
    actions.emit("open_artifact", data);
  };
  return /* @__PURE__ */ jsxs6(Fragment2, { children: [
    /* @__PURE__ */ jsx8(
      BlockShell,
      {
        icon: /* @__PURE__ */ jsx8(FileTextIcon2, {}),
        title: data.title,
        busy: status === "streaming",
        actions: /* @__PURE__ */ jsxs6(Fragment2, { children: [
          /* @__PURE__ */ jsx8(Chip3, { size: "sm", variant: "secondary", label: FORMAT_LABEL[data.format] ?? data.format }),
          content ? /* @__PURE__ */ jsx8(Tooltip, { title: labels.openFull, children: /* @__PURE__ */ jsx8(IconButton2, { size: "sm", variant: "secondary", appearance: "text", "aria-label": labels.openFull, onClick: openFull, children: /* @__PURE__ */ jsx8(ArrowsOutSimpleIcon, {}) }) }) : null,
          canDownload ? /* @__PURE__ */ jsx8(Tooltip, { title: labels.download, children: /* @__PURE__ */ jsx8(
            IconButton2,
            {
              size: "sm",
              variant: "secondary",
              appearance: "text",
              "aria-label": labels.download,
              onClick: () => download(data),
              children: /* @__PURE__ */ jsx8(DownloadSimpleIcon, {})
            }
          ) }) : null
        ] }),
        children: content ? /* @__PURE__ */ jsx8(
          Box7,
          {
            component: "pre",
            sx: (t) => ({
              m: 0,
              fontFamily: monoFont,
              fontSize: t.typography.body2.fontSize,
              lineHeight: "22px",
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              ...mode(t, { color: text7.default.b2 }),
              ...truncated ? {
                maskImage: "linear-gradient(to bottom, black 60%, transparent)",
                WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent)"
              } : {}
            }),
            children: lines.slice(0, PREVIEW_LINES).join("\n")
          }
        ) : null
      }
    ),
    /* @__PURE__ */ jsxs6(Dialog, { open, onClose: () => setOpen(false), fullWidth: true, maxWidth: "md", scroll: "paper", children: [
      /* @__PURE__ */ jsx8(DialogTitle, { onClose: () => setOpen(false), slotProps: { closeButton: { "aria-label": labels.close } }, children: data.title }),
      /* @__PURE__ */ jsx8(DialogContent, { dividers: true, children: data.format === "markdown" ? /* @__PURE__ */ jsx8(Markdown, { size: "sm", children: content }) : /* @__PURE__ */ jsx8(Box7, { component: "pre", sx: { m: 0, fontFamily: monoFont, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }, children: content }) })
    ] })
  ] });
}
function ImageBlock({ data, actions }) {
  const labels = useLabels();
  const src = safeUrl(data.src, { allowDataImage: true });
  const [state, setState] = useState5(src ? "loading" : "error");
  const [open, setOpen] = useState5(false);
  return /* @__PURE__ */ jsxs6(Box7, { component: "figure", sx: { m: 0, maxWidth: 480 }, children: [
    /* @__PURE__ */ jsxs6(
      Box7,
      {
        component: "button",
        type: "button",
        disabled: state !== "ready",
        "aria-label": data.alt || data.caption || labels.openFull,
        onClick: () => {
          setOpen(true);
          actions.emit("open_image", data);
        },
        sx: (t) => ({
          display: "block",
          width: "100%",
          p: 0,
          border: "1px solid",
          borderRadius: 1.5,
          overflow: "hidden",
          cursor: state === "ready" ? "zoom-in" : "default",
          position: "relative",
          minHeight: state === "ready" ? void 0 : 168,
          ...mode(t, { backgroundColor: surface4.layers.card2, borderColor: border3.layers.card1 })
        }),
        children: [
          src && state !== "error" ? /* @__PURE__ */ jsx8(
            Box7,
            {
              component: "img",
              src,
              alt: data.alt,
              loading: "lazy",
              onLoad: () => setState("ready"),
              onError: () => setState("error"),
              sx: { display: "block", width: "100%", maxHeight: 360, objectFit: "contain", opacity: state === "ready" ? 1 : 0 }
            }
          ) : null,
          state === "loading" ? /* @__PURE__ */ jsx8(Skeleton, { variant: "rectangular", sx: { position: "absolute", inset: 0, height: "100%" } }) : null,
          state === "error" ? /* @__PURE__ */ jsxs6(
            Stack3,
            {
              spacing: 1,
              sx: (t) => ({
                position: "absolute",
                inset: 0,
                alignItems: "center",
                justifyContent: "center",
                ...mode(t, { color: iconTokens2.default.b3 })
              }),
              children: [
                /* @__PURE__ */ jsx8(ImageBrokenIcon, { size: 28 }),
                /* @__PURE__ */ jsx8(Typography7, { variant: "body2", children: labels.imageFailed })
              ]
            }
          ) : null
        ]
      }
    ),
    data.caption ? /* @__PURE__ */ jsx8(
      Typography7,
      {
        variant: "body2",
        component: "figcaption",
        sx: (t) => ({ mt: 1, ...mode(t, { color: text7.default.b3 }) }),
        children: data.caption
      }
    ) : null,
    /* @__PURE__ */ jsxs6(Dialog, { open, onClose: () => setOpen(false), maxWidth: "lg", children: [
      /* @__PURE__ */ jsx8(DialogTitle, { onClose: () => setOpen(false), slotProps: { closeButton: { "aria-label": labels.close } }, children: data.caption ?? data.alt ?? "" }),
      /* @__PURE__ */ jsx8(DialogContent, { children: src ? /* @__PURE__ */ jsx8(
        Box7,
        {
          component: "img",
          src,
          alt: data.alt,
          sx: { display: "block", maxWidth: "100%", maxHeight: "75vh", mx: "auto" }
        }
      ) : null })
    ] })
  ] });
}
function StepStatusIcon({ step }) {
  if (step.status === "running") return /* @__PURE__ */ jsx8(CircularProgress2, { size: 12 });
  const glyph = step.status === "done" ? /* @__PURE__ */ jsx8(CheckIcon, { size: 14 }) : step.status === "failed" ? /* @__PURE__ */ jsx8(XIcon, { size: 14 }) : step.status === "skipped" ? /* @__PURE__ */ jsx8(MinusIcon, { size: 14 }) : null;
  if (!glyph) return null;
  const color = step.status === "failed" ? iconTokens2.error[3] : iconTokens2.default.b3;
  return /* @__PURE__ */ jsx8(Box7, { component: "span", "aria-hidden": true, sx: (t) => ({ display: "inline-flex", ...mode(t, { color }) }), children: glyph });
}
function PlanBlock({ data }) {
  const labels = useLabels();
  const [openIds, setOpenIds] = useState5(
    () => new Set(data.steps.filter((s) => (s.status === "running" || s.status === "failed") && s.detail).map((s) => s.id))
  );
  const toggle = (id) => setOpenIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  return /* @__PURE__ */ jsxs6(Box7, { "aria-label": data.title ?? labels.planRunning, children: [
    data.title ? /* @__PURE__ */ jsx8(Typography7, { variant: "body1", weight: "medium", component: "div", sx: { mb: 1 }, children: data.title }) : null,
    /* @__PURE__ */ jsx8(Stepper, { activeStep: -1, children: data.steps.map((step) => {
      const hasDetail = Boolean(step.detail && (typeof step.detail === "string" || step.detail.length));
      const expanded = hasDetail && openIds.has(step.id);
      const label = step.status === "running" ? /* @__PURE__ */ jsx8(Shimmer, { children: step.title }) : /* @__PURE__ */ jsx8(Box7, { component: "span", children: step.title });
      return /* @__PURE__ */ jsxs6(Step, { completed: step.status === "done", active: step.status === "running", expanded, children: [
        /* @__PURE__ */ jsx8(StepLabel, { error: step.status === "failed", children: /* @__PURE__ */ jsxs6(
          Box7,
          {
            component: hasDetail ? "button" : "span",
            type: hasDetail ? "button" : void 0,
            "aria-expanded": hasDetail ? expanded : void 0,
            onClick: hasDetail ? () => toggle(step.id) : void 0,
            sx: {
              display: "flex",
              alignItems: "center",
              gap: 1,
              width: "100%",
              p: 0,
              border: 0,
              background: "none",
              font: "inherit",
              color: "inherit",
              textAlign: "left",
              cursor: hasDetail ? "pointer" : "default"
            },
            children: [
              /* @__PURE__ */ jsx8(Box7, { component: "span", sx: { flex: 1, minWidth: 0 }, children: label }),
              /* @__PURE__ */ jsx8(StepStatusIcon, { step })
            ]
          }
        ) }),
        hasDetail ? /* @__PURE__ */ jsx8(StepContent, { children: /* @__PURE__ */ jsx8(
          Box7,
          {
            sx: (t) => ({
              p: 1.5,
              borderRadius: 1,
              border: "1px solid",
              ...mode(t, { backgroundColor: surface4.layers.card2, borderColor: border3.layers.card2 })
            }),
            children: typeof step.detail === "string" ? /* @__PURE__ */ jsx8(Typography7, { variant: "body2", children: step.detail }) : /* @__PURE__ */ jsx8(
              KeyValueList,
              {
                items: (step.detail ?? []).map(([k, v]) => ({
                  key: k,
                  label: humanizeKey(k),
                  value: typeof v === "string" ? v : formatJsonish(v)
                }))
              }
            )
          }
        ) }) : null
      ] }, step.id);
    }) })
  ] });
}

// src/ui/blocks/table.tsx
import {
  Box as Box8,
  Table as Table2,
  TableBody as TableBody2,
  TableCell as TableCell2,
  TableContainer as TableContainer2,
  TableHead as TableHead2,
  TableRow as TableRow2,
  TableSortLabel,
  tableAmountType
} from "@neofloai/atoms";
import { TableIcon } from "@neofloai/atoms/icons";
import { useMemo, useState as useState6 } from "react";
import { jsx as jsx9, jsxs as jsxs7 } from "react/jsx-runtime";
var MAX_RENDERED_ROWS = 500;
function compare(a, b) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  const na = Number(a);
  const nb = Number(b);
  if (a !== "" && b !== "" && Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return String(a ?? "").localeCompare(String(b ?? ""), void 0, { numeric: true, sensitivity: "base" });
}
function DataTable({
  columns,
  rows,
  maxHeight = 360
}) {
  const [sort, setSort] = useState6(null);
  const sorted = useMemo(() => {
    const limited = rows.slice(0, MAX_RENDERED_ROWS);
    if (!sort) return limited;
    const out = [...limited].sort((x, y) => compare(x[sort.key], y[sort.key]));
    return sort.dir === "desc" ? out.reverse() : out;
  }, [rows, sort]);
  const onSort = (key) => setSort((s) => s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null);
  return /* @__PURE__ */ jsx9(TableContainer2, { sx: { maxHeight }, children: /* @__PURE__ */ jsxs7(Table2, { size: "sm", stickyHeader: true, children: [
    /* @__PURE__ */ jsx9(TableHead2, { children: /* @__PURE__ */ jsx9(TableRow2, { children: columns.map((c) => /* @__PURE__ */ jsx9(TableCell2, { align: c.align, sortDirection: sort?.key === c.key ? sort.dir : false, children: /* @__PURE__ */ jsx9(
      TableSortLabel,
      {
        active: sort?.key === c.key,
        direction: sort?.key === c.key ? sort.dir : "asc",
        onClick: () => onSort(c.key),
        children: c.label
      }
    ) }, c.key)) }) }),
    /* @__PURE__ */ jsx9(TableBody2, { children: sorted.map((row, i) => /* @__PURE__ */ jsx9(TableRow2, { children: columns.map((c) => {
      const value = formatValue(row[c.key], { format: c.format, currency: c.currency });
      const numeric = c.format === "currency" || c.format === "number" || c.format === "percent";
      return /* @__PURE__ */ jsx9(TableCell2, { align: c.align, children: numeric ? /* @__PURE__ */ jsx9(Box8, { component: "span", sx: tableAmountType, children: value }) : value }, c.key);
    }) }, i)) })
  ] }) });
}
function TableBlock({ data }) {
  const labels = useLabels();
  return /* @__PURE__ */ jsx9(BlockShell, { icon: /* @__PURE__ */ jsx9(TableIcon, {}), title: data.title ?? "", meta: labels.rows(data.totalRows), flushBody: true, children: data.columns.length ? /* @__PURE__ */ jsx9(DataTable, { columns: data.columns, rows: data.rows }) : null });
}
function tableToText(data) {
  const head = data.columns.map((c) => c.label).join("	");
  const body = data.rows.map(
    (r) => data.columns.map((c) => formatValue(r[c.key], { format: c.format, currency: c.currency })).join("	")
  );
  return [data.title, head, ...body].filter(Boolean).join("\n");
}

// src/ui/blocks/index.ts
var choiceTypes = BLOCK_TYPES.choice;
var approvalTypes = BLOCK_TYPES.approval;
var textBlock = defineBlock({
  name: "text",
  type: BLOCK_TYPES.text,
  category: "content",
  parse: parseText,
  render: TextBlock,
  toText: (d) => d.text
});
var thinkingBlock = defineBlock({
  name: "thinking",
  type: BLOCK_TYPES.thinking,
  category: ["reasoning", "thinking"],
  parse: parseThinking,
  render: ThinkingBlock,
  toText: () => ""
});
var toolCallBlock = defineBlock({
  name: "tool_call",
  type: BLOCK_TYPES.toolCall,
  category: "tool",
  parse: parseToolCall,
  render: ToolBlock,
  toText: () => ""
});
var tableBlock = defineBlock({
  name: "table",
  type: BLOCK_TYPES.table,
  parse: parseTable,
  render: TableBlock,
  toText: tableToText
});
var sourcesBlock = defineBlock({
  name: "sources",
  type: BLOCK_TYPES.sources,
  category: ["citation", "sources"],
  parse: parseSources,
  render: SourcesBlock,
  toText: () => ""
});
var approvalBlock = defineBlock({
  name: "approval",
  type: BLOCK_TYPES.approval,
  // Any other HITL block without options reads best as an approval.
  category: "hitl",
  parse: parseApproval,
  render: ApprovalBlock,
  toText: (d) => [d.title, d.description].filter(Boolean).join("\n")
});
var choiceBlock = defineBlock({
  name: "choice",
  type: BLOCK_TYPES.choice,
  // An unknown HITL type that carries options is a choice, not an approval.
  match: (b) => b.category === "hitl" && Array.isArray(b.options) && !approvalTypes.includes(b.type) && !choiceTypes.includes(b.type),
  parse: parseChoice,
  render: ChoiceBlock,
  toText: (d) => d.title
});
var errorBlock = defineBlock({
  name: "error",
  type: BLOCK_TYPES.error,
  category: "error",
  parse: parseError,
  render: ErrorBlock,
  toText: (d) => [d.title, d.message].filter(Boolean).join(": ")
});
var artifactBlock = defineBlock({
  name: "artifact",
  type: BLOCK_TYPES.artifact,
  parse: parseArtifact,
  render: ArtifactBlock,
  toText: (d) => d.content ?? d.title
});
var imageBlock = defineBlock({
  name: "image",
  type: BLOCK_TYPES.image,
  parse: parseImage,
  render: ImageBlock,
  toText: (d) => d.caption ?? d.alt
});
var planBlock = defineBlock({
  name: "plan",
  type: BLOCK_TYPES.plan,
  category: "plan",
  parse: parsePlan,
  applyDelta: applyPlanDelta,
  render: PlanBlock,
  toText: () => ""
});
var unknownBlock = defineBlock({ name: "unknown", match: () => false, render: UnknownBlock });
var defaultBlocks = [
  textBlock,
  thinkingBlock,
  toolCallBlock,
  tableBlock,
  sourcesBlock,
  approvalBlock,
  choiceBlock,
  errorBlock,
  artifactBlock,
  imageBlock,
  planBlock
];

// src/ui/history/ChatHistory.tsx
import {
  Alert as Alert3,
  Box as Box9,
  Button as Button3,
  Dialog as Dialog2,
  DialogActions,
  DialogContent as DialogContent2,
  DialogContentText,
  DialogTitle as DialogTitle2,
  IconButton as IconButton3,
  List as List2,
  ListItem as ListItem2,
  ListItemButton as ListItemButton2,
  ListItemText as ListItemText2,
  Menu,
  MenuItem,
  Skeleton as Skeleton2,
  Stack as Stack4,
  Switch,
  TextField,
  Typography as Typography8
} from "@neofloai/atoms";
import {
  ArchiveIcon,
  ArrowUUpLeftIcon,
  DotsThreeIcon,
  MagnifyingGlassIcon,
  NotePencilIcon,
  PencilSimpleIcon,
  TrashIcon
} from "@neofloai/atoms/icons";
import { border as border4, text as text8 } from "@neofloai/atoms/tokens";
import { useId as useId2, useState as useState7 } from "react";
import { jsx as jsx10, jsxs as jsxs8 } from "react/jsx-runtime";
var GROUP_LABEL = {
  today: "groupToday",
  yesterday: "groupYesterday",
  previous7: "groupPrevious7",
  previous30: "groupPrevious30",
  older: "groupOlder"
};
var visuallyHidden = {
  position: "absolute",
  width: 1,
  height: 1,
  p: 0,
  m: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0
};
function RenameDialog({ item, onClose }) {
  const labels = useLabels();
  const { renameConversation } = useChatActions();
  const [value, setValue] = useState7(item.title);
  const [saving, setSaving] = useState7(false);
  const submit = async () => {
    if (!value.trim()) return;
    setSaving(true);
    try {
      await renameConversation(item.id, value);
      onClose();
    } catch {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxs8(Dialog2, { open: true, onClose, fullWidth: true, maxWidth: "xs", children: [
    /* @__PURE__ */ jsx10(DialogTitle2, { onClose, slotProps: { closeButton: { "aria-label": labels.close } }, children: labels.renameTitle }),
    /* @__PURE__ */ jsx10(DialogContent2, { children: /* @__PURE__ */ jsx10(
      Box9,
      {
        component: "form",
        onSubmit: (e) => {
          e.preventDefault();
          void submit();
        },
        children: /* @__PURE__ */ jsx10(
          TextField,
          {
            autoFocus: true,
            fullWidth: true,
            label: labels.rename,
            value,
            maxLength: 200,
            onChange: (e) => setValue(e.target.value)
          }
        )
      }
    ) }),
    /* @__PURE__ */ jsxs8(DialogActions, { children: [
      /* @__PURE__ */ jsx10(Button3, { appearance: "text", variant: "secondary", size: "sm", onClick: onClose, children: labels.cancel }),
      /* @__PURE__ */ jsx10(Button3, { size: "sm", loading: saving, disabled: !value.trim(), onClick: () => void submit(), children: labels.save })
    ] })
  ] });
}
function DeleteDialog({ item, onClose }) {
  const labels = useLabels();
  const { deleteConversation } = useChatActions();
  const [busy, setBusy] = useState7(false);
  return /* @__PURE__ */ jsxs8(Dialog2, { open: true, onClose, role: "alertdialog", maxWidth: "xs", children: [
    /* @__PURE__ */ jsx10(DialogTitle2, { subtitle: item.title, onClose, slotProps: { closeButton: { "aria-label": labels.close } }, children: labels.deleteTitle }),
    /* @__PURE__ */ jsx10(DialogContent2, { children: /* @__PURE__ */ jsx10(DialogContentText, { children: labels.deleteBody }) }),
    /* @__PURE__ */ jsxs8(DialogActions, { children: [
      /* @__PURE__ */ jsx10(Button3, { appearance: "text", variant: "secondary", size: "sm", onClick: onClose, children: labels.cancel }),
      /* @__PURE__ */ jsx10(
        Button3,
        {
          variant: "error",
          size: "sm",
          loading: busy,
          onClick: () => {
            setBusy(true);
            deleteConversation(item.id).then(onClose, () => setBusy(false));
          },
          children: labels.delete
        }
      )
    ] })
  ] });
}
function ChatHistory({ onSelect, showNewChat = true }) {
  const labels = useLabels();
  const history = useConversations();
  const searchId = useId2();
  const [menu, setMenu] = useState7(null);
  const [renaming, setRenaming] = useState7(null);
  const [deleting, setDeleting] = useState7(null);
  const closeMenu = () => setMenu(null);
  const loading = history.status === "loading" && history.allItems.length === 0;
  const failed = history.status === "error" && history.allItems.length === 0;
  return /* @__PURE__ */ jsxs8(
    Box9,
    {
      component: "nav",
      "aria-label": labels.history,
      sx: { display: "flex", flexDirection: "column", height: "100%", minHeight: 0 },
      children: [
        /* @__PURE__ */ jsxs8(Stack4, { spacing: 1.25, sx: { p: 1.5 }, children: [
          showNewChat ? /* @__PURE__ */ jsx10(
            Button3,
            {
              size: "sm",
              variant: "secondary",
              appearance: "outline",
              startIcon: /* @__PURE__ */ jsx10(NotePencilIcon, {}),
              fullWidth: true,
              onClick: () => void history.create().catch(() => void 0),
              children: labels.newChat
            }
          ) : null,
          /* @__PURE__ */ jsxs8(Box9, { sx: { position: "relative" }, children: [
            /* @__PURE__ */ jsx10(Box9, { component: "label", htmlFor: searchId, sx: visuallyHidden, children: labels.searchChats }),
            /* @__PURE__ */ jsx10(
              TextField,
              {
                id: searchId,
                fullWidth: true,
                type: "search",
                placeholder: labels.searchChats,
                value: history.query,
                onChange: (e) => history.setQuery(e.target.value),
                startAdornment: /* @__PURE__ */ jsx10(MagnifyingGlassIcon, { size: 16 })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs8(Box9, { sx: { flex: 1, minHeight: 0, overflowY: "auto", px: 0.5, pb: 1 }, children: [
          loading ? /* @__PURE__ */ jsx10(Stack4, { spacing: 1, sx: { px: 1 }, "aria-hidden": true, children: Array.from({ length: 6 }, (_, i) => /* @__PURE__ */ jsx10(Skeleton2, { variant: "rounded", height: 36 }, i)) }) : null,
          failed ? /* @__PURE__ */ jsx10(Box9, { sx: { px: 1 }, children: /* @__PURE__ */ jsx10(
            Alert3,
            {
              severity: "error",
              title: labels.historyError,
              action: /* @__PURE__ */ jsx10(Button3, { size: "sm", variant: "error", appearance: "text", onClick: () => void history.refresh(), children: labels.tryAgain }),
              children: history.error?.message
            }
          ) }) : null,
          !loading && !failed && history.items.length === 0 ? /* @__PURE__ */ jsx10(
            Typography8,
            {
              variant: "body1",
              sx: (t) => ({ px: 1.5, py: 3, textAlign: "center", ...mode(t, { color: text8.default.b3 }) }),
              children: history.query ? labels.historyNoResults : labels.historyEmpty
            }
          ) : null,
          history.groups.map((group) => /* @__PURE__ */ jsxs8(Box9, { component: "section", "aria-label": labels[GROUP_LABEL[group.key]], sx: { mb: 1 }, children: [
            /* @__PURE__ */ jsx10(
              Typography8,
              {
                variant: "caption",
                component: "h3",
                sx: (t) => ({ px: 1.5, pt: 1.5, pb: 0.5, m: 0, ...mode(t, { color: text8.default.b3 }) }),
                children: labels[GROUP_LABEL[group.key]]
              }
            ),
            /* @__PURE__ */ jsx10(List2, { dense: true, children: group.items.map((item) => {
              const active = item.id === history.activeId;
              const running = history.isRunning(item.id);
              return /* @__PURE__ */ jsx10(
                ListItem2,
                {
                  disablePadding: true,
                  secondaryAction: /* @__PURE__ */ jsx10(
                    IconButton3,
                    {
                      size: "sm",
                      variant: "secondary",
                      appearance: "text",
                      "aria-label": labels.moreActions(item.title),
                      "aria-haspopup": "menu",
                      onClick: (e) => setMenu({ anchor: e.currentTarget, item }),
                      children: /* @__PURE__ */ jsx10(DotsThreeIcon, {})
                    }
                  ),
                  children: /* @__PURE__ */ jsx10(
                    ListItemButton2,
                    {
                      selected: active,
                      "aria-current": active ? "page" : void 0,
                      onClick: () => {
                        void history.select(item.id);
                        onSelect?.(item.id);
                      },
                      children: /* @__PURE__ */ jsx10(
                        ListItemText2,
                        {
                          primary: item.title,
                          secondary: running ? labels.running : item.archived ? labels.archive : void 0,
                          slotProps: { primary: { noWrap: true } }
                        }
                      )
                    }
                  )
                },
                item.id
              );
            }) })
          ] }, group.key))
        ] }),
        /* @__PURE__ */ jsx10(Box9, { sx: (t) => ({ px: 2, py: 1, borderTop: "1px solid", ...mode(t, { borderColor: border4.layers.card1 }) }), children: /* @__PURE__ */ jsx10(
          Switch,
          {
            size: "small",
            label: labels.showArchived,
            checked: history.showArchived,
            onChange: (_, checked) => history.setShowArchived(checked)
          }
        ) }),
        /* @__PURE__ */ jsxs8(
          Menu,
          {
            anchorEl: menu?.anchor ?? null,
            open: Boolean(menu),
            onClose: closeMenu,
            anchorOrigin: { vertical: "bottom", horizontal: "right" },
            transformOrigin: { vertical: "top", horizontal: "right" },
            children: [
              /* @__PURE__ */ jsxs8(
                MenuItem,
                {
                  onClick: () => {
                    if (menu) setRenaming(menu.item);
                    closeMenu();
                  },
                  children: [
                    /* @__PURE__ */ jsx10(PencilSimpleIcon, { size: 16 }),
                    labels.rename
                  ]
                }
              ),
              /* @__PURE__ */ jsxs8(
                MenuItem,
                {
                  onClick: () => {
                    if (menu) void history.archive(menu.item.id, !menu.item.archived).catch(() => void 0);
                    closeMenu();
                  },
                  children: [
                    menu?.item.archived ? /* @__PURE__ */ jsx10(ArrowUUpLeftIcon, { size: 16 }) : /* @__PURE__ */ jsx10(ArchiveIcon, { size: 16 }),
                    menu?.item.archived ? labels.unarchive : labels.archive
                  ]
                }
              ),
              /* @__PURE__ */ jsxs8(
                MenuItem,
                {
                  onClick: () => {
                    if (menu) setDeleting(menu.item);
                    closeMenu();
                  },
                  children: [
                    /* @__PURE__ */ jsx10(TrashIcon, { size: 16 }),
                    labels.delete
                  ]
                }
              )
            ]
          }
        ),
        renaming ? /* @__PURE__ */ jsx10(RenameDialog, { item: renaming, onClose: () => setRenaming(null) }) : null,
        deleting ? /* @__PURE__ */ jsx10(DeleteDialog, { item: deleting, onClose: () => setDeleting(null) }) : null
      ]
    }
  );
}

// src/ui/shell/Composer.tsx
import {
  Box as Box10,
  Button as Button4,
  Card as Card3,
  Checkbox as Checkbox3,
  Chip as Chip4,
  CircularProgress as CircularProgress3,
  IconButton as IconButton4,
  LinearProgress,
  Menu as Menu2,
  MenuItem as MenuItem2,
  Stack as Stack5,
  Tooltip as Tooltip2,
  Typography as Typography9
} from "@neofloai/atoms";
import { CaretDownIcon as CaretDownIcon2, FileIcon, FileTextIcon as FileTextIcon3, PaperclipIcon, PaperPlaneTiltIcon, StopIcon, XIcon as XIcon2 } from "@neofloai/atoms/icons";
import { border as border5, elevation, fontWeights, icon as iconTokens3, radius, surface as surface5, text as text9 } from "@neofloai/atoms/tokens";
import { forwardRef, useEffect as useEffect3, useId as useId3, useState as useState8 } from "react";
import { Fragment as Fragment3, jsx as jsx11, jsxs as jsxs9 } from "react/jsx-runtime";
function typeLabel(name, contentType) {
  const ext = name.includes(".") ? name.split(".").pop().toUpperCase() : "";
  if (ext && ext.length <= 5) return ext;
  if (contentType?.includes("/")) return contentType.split("/")[1].toUpperCase();
  return "File";
}
function FileCard({ name, size, contentType, status = "ready", progress, error, onRemove }) {
  const labels = useLabels();
  const detail = status === "uploading" ? labels.uploading : status === "error" ? error ?? labels.uploadFailed : [typeLabel(name, contentType), size !== void 0 ? formatBytes(size) : ""].filter(Boolean).join(" \xB7 ");
  return /* @__PURE__ */ jsxs9(Card3, { component: "article", "aria-label": name, sx: { width: 268, maxWidth: "100%" }, children: [
    /* @__PURE__ */ jsxs9(Stack5, { direction: "row", spacing: 1.25, sx: { alignItems: "center", px: 1.5, py: 1.25 }, children: [
      /* @__PURE__ */ jsx11(Box10, { "aria-hidden": true, sx: (t) => ({ display: "inline-flex", ...mode(t, { color: iconTokens3.default.b2 }) }), children: /* @__PURE__ */ jsx11(FileIcon, { size: 20 }) }),
      /* @__PURE__ */ jsxs9(Box10, { sx: { flex: 1, minWidth: 0 }, children: [
        /* @__PURE__ */ jsx11(Typography9, { variant: "body1", weight: "medium", noWrap: true, component: "div", children: name }),
        /* @__PURE__ */ jsx11(
          Typography9,
          {
            variant: "body2",
            noWrap: true,
            component: "div",
            sx: (t) => mode(t, { color: status === "error" ? text9.error[3] : text9.default.b3 }),
            children: detail
          }
        )
      ] }),
      onRemove ? /* @__PURE__ */ jsx11(
        IconButton4,
        {
          size: "sm",
          variant: "secondary",
          appearance: "text",
          "aria-label": labels.removeAttachment(name),
          onClick: onRemove,
          children: /* @__PURE__ */ jsx11(XIcon2, {})
        }
      ) : null
    ] }),
    status === "uploading" ? /* @__PURE__ */ jsx11(LinearProgress, { variant: progress ? "determinate" : "indeterminate", value: (progress ?? 0) * 100 }) : null
  ] });
}
function AttachmentCard({ attachment }) {
  return /* @__PURE__ */ jsx11(FileCard, { name: attachment.filename, size: attachment.size, contentType: attachment.content_type });
}
function AttachmentChip({ attachment, onRemove }) {
  const labels = useLabels();
  const icon = attachment.status === "uploading" ? /* @__PURE__ */ jsx11(CircularProgress3, { size: 12 }) : /* @__PURE__ */ jsx11(FileTextIcon3, {});
  return /* @__PURE__ */ jsx11(
    Tooltip2,
    {
      title: attachment.status === "error" ? attachment.error ?? labels.uploadFailed : `${attachment.name} \xB7 ${formatBytes(attachment.size)}`,
      children: /* @__PURE__ */ jsx11(
        Chip4,
        {
          dense: true,
          appearance: "outline",
          variant: attachment.status === "error" ? "error" : "primary",
          icon,
          label: attachment.name,
          onDelete: onRemove,
          "aria-label": attachment.name,
          sx: { maxWidth: 240 }
        }
      )
    }
  );
}
function ScopePicker() {
  const scope = useScope();
  const labels = useLabels();
  const [anchor, setAnchor] = useState8(null);
  if (!scope.enabled) return null;
  const { selected, allSelected } = scope.summary;
  const label = scope.status !== "ready" ? labels.scopeAll : allSelected ? labels.scopeAll : selected === 0 ? labels.scopeNone : labels.scopeSome(selected);
  const close = () => setAnchor(null);
  return /* @__PURE__ */ jsxs9(Fragment3, { children: [
    /* @__PURE__ */ jsx11(
      Button4,
      {
        size: "sm",
        variant: "secondary",
        appearance: "outline",
        startIcon: /* @__PURE__ */ jsx11(CaretDownIcon2, {}),
        "aria-haspopup": "menu",
        "aria-expanded": Boolean(anchor),
        "aria-label": `${labels.scopeLabel}: ${label}`,
        disabled: scope.status === "loading" || scope.groups.length === 0,
        onClick: (e) => setAnchor(e.currentTarget),
        children: label
      }
    ),
    /* @__PURE__ */ jsx11(
      Menu2,
      {
        anchorEl: anchor,
        open: Boolean(anchor),
        onClose: close,
        variant: "menu",
        anchorOrigin: { vertical: "top", horizontal: "left" },
        transformOrigin: { vertical: "bottom", horizontal: "left" },
        sx: { "& .MuiMenu-paper": { minWidth: 280, maxHeight: 380 } },
        children: scope.groups.flatMap((g) => {
          const state = scope.groupState(g.id);
          const action = state === "all" ? labels.scopeDeselectAll : labels.scopeSelectAll;
          return [
            /* @__PURE__ */ jsxs9(
              MenuItem2,
              {
                variant: "secondary",
                onClick: () => scope.setGroup(g.id, state !== "all"),
                "aria-label": `${g.label}: ${action}`,
                children: [
                  /* @__PURE__ */ jsx11(Typography9, { variant: "body2", weight: "medium", component: "span", sx: { flex: 1 }, children: g.label }),
                  /* @__PURE__ */ jsx11(
                    Typography9,
                    {
                      variant: "body2",
                      component: "span",
                      sx: (t) => ({ ml: 2, ...mode(t, { color: text9.primary[3] }) }),
                      children: action
                    }
                  )
                ]
              },
              `g:${g.id}`
            ),
            ...g.items.map((item) => {
              const checked = scope.isSelected(g.id, item.id);
              return /* @__PURE__ */ jsxs9(
                MenuItem2,
                {
                  role: "menuitemcheckbox",
                  "aria-checked": checked,
                  onClick: () => scope.toggle(g.id, item.id),
                  children: [
                    /* @__PURE__ */ jsx11(Checkbox3, { size: "sm", checked, tabIndex: -1, "aria-hidden": true, sx: { p: 0, mr: 1.25 } }),
                    item.label
                  ]
                },
                `${g.id}:${item.id}`
              );
            })
          ];
        })
      }
    )
  ] });
}
function RejectedNotice() {
  const [message, setMessage] = useState8(null);
  useChatEvent("warning", (w) => {
    if (w.code === "attachment_rejected") setMessage(w.message);
  });
  useEffect3(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 5e3);
    return () => clearTimeout(t);
  }, [message]);
  if (!message) return null;
  return /* @__PURE__ */ jsx11(Typography9, { role: "alert", variant: "body2", sx: (t) => mode(t, { color: text9.error[3] }), children: message });
}
function ComposerControls({ extraActions }) {
  const c = useComposerContext();
  const labels = useLabels();
  return /* @__PURE__ */ jsxs9(Stack5, { direction: "row", spacing: 1, sx: { alignItems: "center" }, children: [
    /* @__PURE__ */ jsx11(Composer.AttachmentInput, { asChild: true, children: /* @__PURE__ */ jsx11(IconButton4, { size: "sm", variant: "secondary", appearance: "text", "aria-label": labels.attach, children: /* @__PURE__ */ jsx11(PaperclipIcon, {}) }) }),
    /* @__PURE__ */ jsx11(ScopePicker, {}),
    /* @__PURE__ */ jsx11(Box10, { sx: { flex: 1 } }),
    extraActions,
    c.busy ? /* @__PURE__ */ jsx11(Composer.Cancel, { asChild: true, children: /* @__PURE__ */ jsx11(IconButton4, { size: "sm", variant: "secondary", "aria-label": labels.stop, children: /* @__PURE__ */ jsx11(StopIcon, { weight: "fill" }) }) }) : /* @__PURE__ */ jsx11(Composer.Send, { asChild: true, children: /* @__PURE__ */ jsx11(IconButton4, { size: "sm", "aria-label": labels.send, children: /* @__PURE__ */ jsx11(PaperPlaneTiltIcon, {}) }) })
  ] });
}
function ComposerAttachmentRow() {
  return /* @__PURE__ */ jsx11(Composer.Attachments, { children: (a, remove) => /* @__PURE__ */ jsx11(AttachmentChip, { attachment: a, onRemove: remove }, a.id) });
}
function ChatComposer({ placeholder, extraActions, footer, maxRows = 8, autoFocus }) {
  const [dragging, setDragging] = useState8(false);
  const hintId = useId3();
  return /* @__PURE__ */ jsxs9(Box10, { children: [
    /* @__PURE__ */ jsx11(Composer.Root, { asChild: true, children: /* @__PURE__ */ jsx11(DropZone, { onDragChange: setDragging, children: /* @__PURE__ */ jsxs9(
      Box10,
      {
        sx: (t) => ({
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
          px: 2,
          pt: 1.75,
          pb: 1.5,
          borderRadius: `${radius.lg}px`,
          border: "1px solid",
          transition: "border-color 120ms ease, box-shadow 120ms ease",
          ...mode(t, {
            backgroundColor: surface5.layers.card1,
            borderColor: dragging ? border5.primary.focus : border5.layers.card2
          }),
          boxShadow: elevation.small,
          "&:focus-within": mode(t, { borderColor: border5.primary.focus }),
          "& textarea": {
            width: "100%",
            border: 0,
            outline: 0,
            p: 0,
            m: 0,
            background: "transparent",
            fontFamily: "inherit",
            fontSize: t.typography.h6.fontSize,
            lineHeight: t.typography.h6.lineHeight,
            fontWeight: fontWeights.regular,
            ...mode(t, { color: text9.default.heading })
          },
          "& textarea::placeholder": { opacity: 1, ...mode(t, { color: text9.default.b3 }) },
          "& textarea:disabled": { cursor: "not-allowed" }
        }),
        children: [
          /* @__PURE__ */ jsx11(Stack5, { direction: "row", sx: { flexWrap: "wrap", gap: 0.75, "&:empty": { display: "none" } }, children: /* @__PURE__ */ jsx11(ComposerAttachmentRow, {}) }),
          /* @__PURE__ */ jsx11(Composer.Input, { placeholder, maxRows, autoFocus, "aria-describedby": hintId }),
          /* @__PURE__ */ jsx11(ComposerControls, { extraActions })
        ]
      }
    ) }) }),
    /* @__PURE__ */ jsxs9(Box10, { id: hintId, sx: { mt: 0.75, display: "flex", flexDirection: "column", gap: 0.5, alignItems: "center" }, children: [
      /* @__PURE__ */ jsx11(RejectedNotice, {}),
      footer
    ] })
  ] });
}
var DropZone = forwardRef(function DropZone2({ children, onDragChange, ...props }, ref) {
  const c = useComposerContext();
  return /* @__PURE__ */ jsx11(
    Box10,
    {
      component: "form",
      ref,
      noValidate: true,
      ...props,
      onDragOver: (e) => {
        if (!c.attachmentsEnabled || !e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        onDragChange(true);
      },
      onDragLeave: () => onDragChange(false),
      onDrop: (e) => {
        onDragChange(false);
        if (!c.attachmentsEnabled || !e.dataTransfer.files.length) return;
        e.preventDefault();
        c.addFiles(e.dataTransfer.files);
      },
      children
    }
  );
});

// src/ui/shell/ChatThread.tsx
import { Box as Box12, IconButton as IconButton6, Skeleton as Skeleton4, Stack as Stack7 } from "@neofloai/atoms";
import { ArrowDownIcon } from "@neofloai/atoms/icons";
import { elevation as elevation2 } from "@neofloai/atoms/tokens";
import { useEffect as useEffect4, useRef } from "react";

// src/ui/shell/Turn.tsx
import { Box as Box11, Button as Button5, Chip as Chip5, Fade, IconButton as IconButton5, Skeleton as Skeleton3, Stack as Stack6, Tooltip as Tooltip3, Typography as Typography10 } from "@neofloai/atoms";
import { CheckIcon as CheckIcon2, CopyIcon, LightningIcon } from "@neofloai/atoms/icons";
import { border as border6, radius as radius2, surface as surface6, text as text10 } from "@neofloai/atoms/tokens";
import { useState as useState9 } from "react";
import { Fragment as Fragment4, jsx as jsx12, jsxs as jsxs10 } from "react/jsx-runtime";
var BUSY2 = /* @__PURE__ */ new Set(["submitting", "streaming", "cancelling"]);
function UserTurn({ message }) {
  const body = messageText(message);
  return /* @__PURE__ */ jsx12(Message.Root, { asChild: true, children: /* @__PURE__ */ jsxs10(Box11, { sx: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }, children: [
    message.attachments?.length ? /* @__PURE__ */ jsx12(Stack6, { direction: "row", sx: { flexWrap: "wrap", gap: 1, justifyContent: "flex-end" }, children: message.attachments.map((a, i) => /* @__PURE__ */ jsx12(AttachmentCard, { attachment: a }, `${a.url}:${i}`)) }) : null,
    body ? /* @__PURE__ */ jsx12(
      Box11,
      {
        sx: (t) => ({
          maxWidth: "min(80%, 560px)",
          px: 2,
          py: 1.5,
          borderRadius: `${radius2.lg}px`,
          border: "1px solid",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          ...mode(t, {
            backgroundColor: surface6.layers.card2,
            borderColor: border6.layers.card1,
            color: text10.default.heading
          })
        }),
        children: /* @__PURE__ */ jsx12(Typography10, { variant: "h6", weight: "regular", component: "div", children: body })
      }
    ) : null
  ] }) });
}
function blockText(block, registry) {
  const def = registry.resolve(block.data);
  if (!def?.toText) return void 0;
  try {
    return def.toText(def.parse ? def.parse(block.data, block) : block.data, block);
  } catch {
    return void 0;
  }
}
function CopyButton({ message }) {
  const labels = useLabels();
  const { registry } = useChatContext();
  const [copied, setCopied] = useState9(false);
  const value = messageText(message, (b) => blockText(b, registry));
  if (!value || typeof navigator === "undefined" || !navigator.clipboard) return null;
  return /* @__PURE__ */ jsx12(Tooltip3, { title: copied ? labels.copied : labels.copy, children: /* @__PURE__ */ jsx12(
    IconButton5,
    {
      size: "sm",
      variant: "secondary",
      appearance: "text",
      "aria-label": labels.copy,
      onClick: () => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      },
      children: copied ? /* @__PURE__ */ jsx12(CheckIcon2, {}) : /* @__PURE__ */ jsx12(CopyIcon, {})
    }
  ) });
}
function AssistantTurn({ message }) {
  const labels = useLabels();
  const waiting = message.status === "streaming" && message.blocks.length === 0;
  const failed = message.status === "interrupted" || message.status === "error" && message.error;
  return /* @__PURE__ */ jsx12(Message.Root, { asChild: true, children: /* @__PURE__ */ jsxs10(
    Box11,
    {
      sx: {
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        minWidth: 0,
        "& .acu-turn-actions": { opacity: 0, transition: "opacity 120ms ease" },
        "&:hover .acu-turn-actions, & .acu-turn-actions:focus-within": { opacity: 1 }
      },
      children: [
        /* @__PURE__ */ jsx12(MessageBlocks, {}),
        waiting ? /* @__PURE__ */ jsx12(Shimmer, { children: labels.thinkingLive }) : null,
        failed ? /* @__PURE__ */ jsx12(
          ErrorNotice,
          {
            title: message.status === "interrupted" ? labels.interrupted : message.error?.message ?? labels.interrupted,
            message: message.status === "interrupted" ? message.error?.message : void 0,
            retryable: message.error?.retryable !== false,
            retryAfter: message.error?.retryAfter
          }
        ) : null,
        message.status === "cancelled" ? /* @__PURE__ */ jsx12(Typography10, { variant: "body2", sx: (t) => mode(t, { color: text10.default.b3 }), children: labels.stopped }) : null,
        message.status !== "streaming" ? /* @__PURE__ */ jsx12(Stack6, { direction: "row", spacing: 0.5, className: "acu-turn-actions", sx: { ml: -0.75 }, children: /* @__PURE__ */ jsx12(CopyButton, { message }) }) : null
      ]
    }
  ) });
}
function RunStatus() {
  const label = useThread((s) => BUSY2.has(s.run.status) ? s.run.statusLabel : void 0);
  return /* @__PURE__ */ jsx12(Box11, { "aria-live": "polite", "aria-atomic": "true", sx: { minHeight: 0 }, children: /* @__PURE__ */ jsx12(Fade, { in: Boolean(label), unmountOnExit: true, children: /* @__PURE__ */ jsx12(Box11, { sx: { display: "inline-flex" }, children: /* @__PURE__ */ jsx12(Chip5, { dense: true, appearance: "outline", variant: "secondary", icon: /* @__PURE__ */ jsx12(PulseDot, {}), label: label ?? "" }) }) }) });
}
function PendingTurn() {
  const labels = useLabels();
  const state = useThread(
    (s) => {
      const last = s.messages[s.messages.length - 1];
      const awaitingReply = last?.role === "user" || !last;
      return {
        submitting: s.run.status === "submitting" && awaitingReply,
        failedBeforeReply: s.run.status === "error" && last?.role === "user" ? s.run.error : void 0
      };
    },
    (a, b) => a.submitting === b.submitting && a.failedBeforeReply === b.failedBeforeReply
  );
  return /* @__PURE__ */ jsxs10(Fragment4, { children: [
    state.submitting ? /* @__PURE__ */ jsx12(Shimmer, { children: labels.thinkingLive }) : null,
    /* @__PURE__ */ jsx12(RunStatus, {}),
    state.failedBeforeReply ? /* @__PURE__ */ jsx12(
      ErrorNotice,
      {
        title: state.failedBeforeReply.message,
        retryable: state.failedBeforeReply.retryable,
        retryAfter: state.failedBeforeReply.retryAfter
      }
    ) : null
  ] });
}
function ChatSuggestions({ prompts }) {
  return /* @__PURE__ */ jsx12(Stack6, { direction: "row", sx: { flexWrap: "wrap", gap: 1, justifyContent: "center" }, children: /* @__PURE__ */ jsx12(Suggestions.Root, { prompts, children: (p, i) => /* @__PURE__ */ jsx12(Suggestions.Item, { prompt: p, asChild: true, children: /* @__PURE__ */ jsx12(Button5, { size: "sm", variant: "secondary", appearance: "outline", startIcon: /* @__PURE__ */ jsx12(LightningIcon, {}), children: p.label }) }, `${p.label}:${i}`) }) });
}
function WelcomeScreen() {
  const labels = useLabels();
  const meta = useThreadMeta();
  const loading = useThread((s) => s.loadStatus === "loading");
  return /* @__PURE__ */ jsxs10(Stack6, { spacing: 3, sx: { alignItems: "center", textAlign: "center", py: { xs: 6, sm: 10 } }, children: [
    loading ? /* @__PURE__ */ jsx12(Skeleton3, { variant: "text", width: 280, height: 36 }) : /* @__PURE__ */ jsx12(Typography10, { variant: "h4", component: "h2", sx: (t) => mode(t, { color: text10.default.heading }), children: meta.greeting || labels.welcomeTitle }),
    /* @__PURE__ */ jsx12(ChatSuggestions, {})
  ] });
}

// src/ui/shell/ChatThread.tsx
import { jsx as jsx13, jsxs as jsxs11 } from "react/jsx-runtime";
function ThreadSkeleton() {
  return /* @__PURE__ */ jsxs11(Stack7, { spacing: 3, "aria-hidden": true, children: [
    /* @__PURE__ */ jsx13(Skeleton4, { variant: "rounded", height: 48, width: "45%", sx: { alignSelf: "flex-end" } }),
    /* @__PURE__ */ jsxs11(Stack7, { spacing: 1, children: [
      /* @__PURE__ */ jsx13(Skeleton4, { variant: "text", width: "90%" }),
      /* @__PURE__ */ jsx13(Skeleton4, { variant: "text", width: "75%" }),
      /* @__PURE__ */ jsx13(Skeleton4, { variant: "text", width: "60%" })
    ] })
  ] });
}
function FollowOnSend() {
  const { scrollToBottom } = useThreadScroll();
  const lastUserId = useThread((s) => {
    const last = s.messages[s.messages.length - 1];
    return last?.role === "user" ? last.id : void 0;
  });
  const prev = useRef(lastUserId);
  useEffect4(() => {
    if (lastUserId && lastUserId !== prev.current) scrollToBottom("auto");
    prev.current = lastUserId;
  }, [lastUserId, scrollToBottom]);
  return null;
}
function LoadError() {
  const labels = useLabels();
  const error = useThread((s) => s.loadError);
  const id = useThread((s) => s.conversationId);
  const { selectConversation, newConversation } = useChatActions();
  return /* @__PURE__ */ jsx13(
    ErrorNotice,
    {
      title: labels.loadError,
      message: error?.message,
      onRetry: () => void (id ? selectConversation(id) : newConversation().catch(() => void 0))
    }
  );
}
function ChatThread({ components, maxWidth = 760 }) {
  const labels = useLabels();
  const loadStatus = useThread((s) => s.loadStatus);
  const empty = useThread((s) => s.messages.length === 0);
  const Welcome = components?.Welcome ?? WelcomeScreen;
  return /* @__PURE__ */ jsx13(Thread.Root, { asChild: true, children: /* @__PURE__ */ jsxs11(Box12, { sx: { position: "relative", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }, children: [
    /* @__PURE__ */ jsx13(FollowOnSend, {}),
    /* @__PURE__ */ jsx13(Thread.Viewport, { style: { flex: 1, minHeight: 0 }, children: /* @__PURE__ */ jsxs11(Box12, { sx: { maxWidth, mx: "auto", px: 2, pt: 3, pb: 2, display: "flex", flexDirection: "column", gap: 3 }, children: [
      loadStatus === "loading" && empty ? /* @__PURE__ */ jsx13(ThreadSkeleton, {}) : null,
      loadStatus === "error" ? /* @__PURE__ */ jsx13(LoadError, {}) : null,
      /* @__PURE__ */ jsx13(Thread.Empty, { children: /* @__PURE__ */ jsx13(Welcome, {}) }),
      /* @__PURE__ */ jsx13(
        Thread.Messages,
        {
          components: {
            UserMessage: components?.UserTurn ?? UserTurn,
            AssistantMessage: components?.AssistantTurn ?? AssistantTurn
          }
        }
      ),
      /* @__PURE__ */ jsx13(PendingTurn, {})
    ] }) }),
    /* @__PURE__ */ jsx13(Thread.ScrollToBottom, { asChild: true, children: /* @__PURE__ */ jsx13(
      IconButton6,
      {
        size: "sm",
        variant: "secondary",
        appearance: "outline",
        "aria-label": labels.jumpToLatest,
        sx: { position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", boxShadow: elevation2.medium },
        children: /* @__PURE__ */ jsx13(ArrowDownIcon, {})
      }
    ) })
  ] }) });
}

// src/ui/shell/AgenticChat.tsx
import { jsx as jsx14, jsxs as jsxs12 } from "react/jsx-runtime";
function ChatHeader({ title, actions, historyOpen, onToggleHistory }) {
  const labels = useLabels();
  const meta = useThreadMeta();
  const { newConversation } = useChatActions();
  return /* @__PURE__ */ jsxs12(
    Stack8,
    {
      component: "header",
      direction: "row",
      spacing: 1,
      sx: (t) => ({
        alignItems: "center",
        px: 1.5,
        py: 1,
        minHeight: 52,
        borderBottom: "1px solid",
        ...mode(t, { borderColor: border7.layers.card1 })
      }),
      children: [
        onToggleHistory ? /* @__PURE__ */ jsx14(Tooltip4, { title: historyOpen ? labels.closeHistory : labels.openHistory, children: /* @__PURE__ */ jsx14(
          IconButton7,
          {
            size: "sm",
            variant: "secondary",
            appearance: "text",
            "aria-label": historyOpen ? labels.closeHistory : labels.openHistory,
            "aria-expanded": historyOpen,
            onClick: onToggleHistory,
            children: /* @__PURE__ */ jsx14(SidebarSimpleIcon, {})
          }
        ) }) : null,
        /* @__PURE__ */ jsxs12(Box13, { sx: { flex: 1, minWidth: 0 }, children: [
          /* @__PURE__ */ jsx14(
            Typography11,
            {
              variant: "body1",
              weight: "medium",
              component: "h1",
              noWrap: true,
              sx: (t) => ({ m: 0, ...mode(t, { color: text11.default.heading }) }),
              children: title ?? meta.title
            }
          ),
          meta.subtitle ? /* @__PURE__ */ jsx14(Typography11, { variant: "body2", component: "div", noWrap: true, sx: (t) => mode(t, { color: text11.default.b3 }), children: meta.subtitle }) : null
        ] }),
        actions,
        /* @__PURE__ */ jsx14(Tooltip4, { title: labels.newChat, children: /* @__PURE__ */ jsx14(
          IconButton7,
          {
            size: "sm",
            variant: "secondary",
            appearance: "text",
            "aria-label": labels.newChat,
            onClick: () => void newConversation().catch(() => void 0),
            children: /* @__PURE__ */ jsx14(NotePencilIcon2, {})
          }
        ) })
      ]
    }
  );
}
var warnedTheme = false;
function checkTheme(theme) {
  if (warnedTheme) return;
  if (isDev() && !theme.vars) {
    warnedTheme = true;
    console.warn(
      "[agentic-chat] Wrap your app in <NeofloThemeProvider> from @neofloai/atoms; the chat renders with the wrong theme without it."
    );
  }
}
function useContainerWidth() {
  const ref = useRef2(null);
  const [width, setWidth] = useState10(null);
  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => entry && setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}
function ChatLayout({
  history = true,
  defaultHistoryOpen = true,
  header = true,
  title,
  headerActions,
  components,
  composerProps,
  maxWidth = 760,
  compactBelow = 720,
  className,
  sx
}) {
  const [rootRef, width] = useContainerWidth();
  const compact = width !== null && width < compactBelow;
  const [wideOpen, setWideOpen] = usePreference("historyOpen", defaultHistoryOpen);
  const [overlayOpen, setOverlayOpen] = useState10(false);
  const historyOpen = history && (compact ? overlayOpen : wideOpen);
  const toggleHistory = () => compact ? setOverlayOpen((o) => !o) : setWideOpen(!wideOpen);
  const Header = components?.Header ?? ChatHeader;
  const History = components?.History ?? ChatHistory;
  const ComposerSlot = components?.Composer ?? ChatComposer;
  return /* @__PURE__ */ jsxs12(
    Box13,
    {
      ref: rootRef,
      className,
      "data-agentic-chat": "",
      sx: [
        (t) => {
          checkTheme(t);
          return {
            display: "flex",
            height: "100%",
            minHeight: 0,
            position: "relative",
            overflow: "hidden",
            ...mode(t, { backgroundColor: surface7.layers.page, color: text11.default.b1 })
          };
        },
        ...Array.isArray(sx) ? sx : sx ? [sx] : []
      ],
      children: [
        historyOpen ? /* @__PURE__ */ jsx14(
          Box13,
          {
            sx: (t) => ({
              width: compact ? "min(320px, 85%)" : 280,
              flexShrink: 0,
              borderRight: "1px solid",
              ...mode(t, { borderColor: border7.layers.card1, backgroundColor: surface7.layers.card1 }),
              ...compact ? { position: "absolute", top: 0, bottom: 0, left: 0, zIndex: 2, boxShadow: elevation3.large } : {}
            }),
            children: /* @__PURE__ */ jsx14(History, { onSelect: compact ? () => setOverlayOpen(false) : void 0 })
          }
        ) : null,
        compact && historyOpen ? /* @__PURE__ */ jsx14(Box13, { "aria-hidden": true, onClick: () => setOverlayOpen(false), sx: { position: "absolute", inset: 0, zIndex: 1 } }) : null,
        /* @__PURE__ */ jsxs12(Box13, { sx: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }, children: [
          header ? /* @__PURE__ */ jsx14(
            Header,
            {
              title,
              actions: headerActions,
              historyOpen,
              onToggleHistory: history ? toggleHistory : void 0
            }
          ) : null,
          /* @__PURE__ */ jsx14(ChatThread, { components, maxWidth }),
          /* @__PURE__ */ jsx14(Box13, { sx: { px: 2, pb: 2, pt: 0.5 }, children: /* @__PURE__ */ jsx14(Box13, { sx: { maxWidth, mx: "auto" }, children: /* @__PURE__ */ jsx14(ComposerSlot, { ...composerProps }) }) })
        ] })
      ]
    }
  );
}
function AgenticChat(props) {
  const {
    history,
    defaultHistoryOpen,
    header,
    title,
    headerActions,
    components,
    composerProps,
    maxWidth,
    compactBelow,
    className,
    sx,
    blocks,
    fallbackBlock,
    blockErrorFallback,
    ...provider
  } = props;
  const allBlocks = useMemo2(() => [...defaultBlocks, ...blocks ?? []], [blocks]);
  return /* @__PURE__ */ jsx14(
    ChatProvider,
    {
      ...provider,
      blocks: allBlocks,
      fallbackBlock: fallbackBlock ?? unknownBlock,
      blockErrorFallback: blockErrorFallback ?? (() => /* @__PURE__ */ jsx14(BlockCrashNotice, {})),
      children: /* @__PURE__ */ jsx14(
        ChatLayout,
        {
          history,
          defaultHistoryOpen,
          header,
          title,
          headerActions,
          components,
          composerProps,
          maxWidth,
          compactBelow,
          className,
          sx
        }
      )
    }
  );
}
export {
  AgenticChat,
  ApprovalBlock,
  ArtifactBlock,
  AssistantTurn,
  AttachmentCard,
  BLOCK_ICON_PX,
  BLOCK_TYPES,
  BlockRenderer as Block,
  BlockContext,
  BlockCrashNotice,
  BlockErrorBoundary,
  BlockShell,
  ChatApiError,
  ChatComposer,
  ChatContext,
  ChatError,
  ChatHeader,
  ChatHistory,
  ChatProtocolError,
  ChatProvider,
  ChatStreamError,
  ChatSuggestions,
  ChatThread,
  ChatTimeoutError,
  ChoiceBlock,
  Composer,
  ConversationList,
  DEFAULT_REST_PATHS,
  DataTable,
  ErrorBlock,
  ErrorNotice,
  FileCard,
  Hitl,
  ImageBlock,
  KeyValueList,
  Markdown,
  Message,
  MessageBlocks,
  MessageContext,
  NEW_THREAD_KEY,
  PROTOCOL_VERSION,
  PendingTurn,
  PlanBlock,
  PulseDot,
  RetryButton,
  RunStatus,
  ScopePicker,
  Shimmer,
  SourcesBlock,
  SseParser,
  Suggestions,
  TableBlock,
  TextBlock,
  ThinkingBlock,
  Thread,
  ThreadContext,
  ThreadProvider,
  ToolBlock,
  UnknownBlock,
  UserTurn,
  WelcomeScreen,
  applyPlanDelta,
  approvalBlock,
  artifactBlock,
  choiceBlock,
  createBlockRegistry,
  createChatRuntime,
  createMemoryStorage,
  createPersister,
  createRestAdapter,
  createSafeStorage,
  createStore,
  createThreadState,
  createWebStorage,
  defaultApplyDelta,
  defaultBlocks,
  defaultLabels,
  defaultScopeToRequest,
  defineBlock,
  emptyMeta,
  errorBlock,
  filterConversations,
  formatBytes,
  formatDuration,
  formatJsonish,
  formatValue,
  frameScheduler,
  groupConversations,
  groupKeyFor,
  humanizeKey,
  imageBlock,
  interruptRun,
  isAbortError,
  isContentBlock,
  mergeWorkflowContexts,
  messageText,
  metaFromBootstrap,
  mode,
  monoFont,
  normalizeConversationDetail,
  normalizeMessages,
  parseApproval,
  parseArtifact,
  parseChart,
  parseChoice,
  parseError,
  parseImage,
  parsePlan,
  parseSources,
  parseStreamEvent,
  parseTable,
  parseText,
  parseThinking,
  parseToolCall,
  planBlock,
  readSse,
  reduceStreamEvent,
  safeUrl,
  selectAll,
  shallowEqual,
  sortConversations,
  sourcesBlock,
  summarizeScope,
  syncScheduler,
  tableBlock,
  textBlock,
  textFieldOf,
  thinkingBlock,
  toConversationItem,
  toErrorInfo,
  toolCallBlock,
  unknownBlock,
  useActiveConversationId,
  useBlock,
  useBlockActions,
  useCanRetry,
  useChatActions,
  useChatContext,
  useChatEvent,
  useChatRuntime,
  useComposer,
  useComposerContext,
  useConversations,
  useHitl,
  useHitlChoice,
  useIsBusy,
  useLabels,
  useMessage,
  useMessages,
  usePreference,
  useRun,
  useScope,
  useStoreSelector,
  useThread,
  useThreadHandle,
  useThreadMeta,
  useThreadScroll
};
//# sourceMappingURL=index.js.map