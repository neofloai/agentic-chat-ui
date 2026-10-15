"use client";
"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }















































var _chunk66NT7LEDcjs = require('./chunk-66NT7LED.cjs');


































var _chunk2SSFULSQcjs = require('./chunk-2SSFULSQ.cjs');




var _chunkD7SVFE66cjs = require('./chunk-D7SVFE66.cjs');





















var _chunkE6FMLYAFcjs = require('./chunk-E6FMLYAF.cjs');






var _chunkR7CUDWRTcjs = require('./chunk-R7CUDWRT.cjs');










var _chunk5JR2Q366cjs = require('./chunk-5JR2Q366.cjs');








var _chunkZNIBBZSNcjs = require('./chunk-ZNIBBZSN.cjs');

// src/ui/shell/AgenticChat.tsx
var _atoms = require('@neofloai/atoms');
var _icons = require('@neofloai/atoms/icons');
var _tokens = require('@neofloai/atoms/tokens');
var _react = require('react');

// src/ui/blocks/basic.tsx


















// src/ui/kit/BlockShell.tsx




var _jsxruntime = require('react/jsx-runtime');
var PRIMARY_TINT = { light: _tokens.surface.primary.subtle.light, dark: _tokens.surface.soft.default.dark };
var TONES = {
  primary: { bg: PRIMARY_TINT, line: _tokens.border.primary.default, glyph: _tokens.icon.primary[3] },
  warning: { bg: _tokens.surface.warning.subtle, line: _tokens.border.warning.default, glyph: _tokens.icon.warning[3] },
  danger: { bg: _tokens.surface.error.subtle, line: _tokens.border.error.default, glyph: _tokens.icon.error[3] }
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
  const [innerOpen, setInnerOpen] = _react.useState.call(void 0, defaultOpen);
  const isOpen = _nullishCoalesce(open, () => ( innerOpen));
  const bodyId = _react.useId.call(void 0, );
  const toggle = () => {
    const next = !isOpen;
    if (open === void 0) setInnerOpen(next);
    _optionalChain([onOpenChange, 'optionalCall', _2 => _2(next)]);
  };
  const hasBody = children !== void 0 && children !== null && children !== false;
  const indentBody = !flushBody && (_nullishCoalesce(indent, () => ( Boolean(icon))));
  const toneSpec = tone === "default" ? void 0 : TONES[tone];
  const bodySx = (theme) => ({
    pt: flushBody ? 1.5 : 1.25,
    pl: indentBody ? `calc(${_chunkD7SVFE66cjs.BLOCK_ICON_PX}px + ${theme.spacing(1.25)})` : 0,
    mx: flushBody ? -2 : 0,
    mb: flushBody ? -2 : 0,
    minWidth: 0
  });
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    _atoms.Card,
    {
      component: "section",
      "aria-label": ariaLabel,
      "aria-busy": busy || void 0,
      sx: (theme) => ({
        overflow: "hidden",
        ...toneSpec ? _chunkD7SVFE66cjs.mode.call(void 0, theme, { backgroundColor: toneSpec.bg, borderColor: toneSpec.line }) : {}
      }),
      children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.CardContent, { children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
          _atoms.Stack,
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
              icon ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                _atoms.Box,
                {
                  "aria-hidden": true,
                  sx: (theme) => ({
                    display: "inline-flex",
                    flexShrink: 0,
                    "& svg": { width: _chunkD7SVFE66cjs.BLOCK_ICON_PX, height: _chunkD7SVFE66cjs.BLOCK_ICON_PX },
                    ..._chunkD7SVFE66cjs.mode.call(void 0, theme, { color: _nullishCoalesce(_optionalChain([toneSpec, 'optionalAccess', _3 => _3.glyph]), () => ( _tokens.icon.default.b2)) })
                  }),
                  children: icon
                }
              ) : null,
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                _atoms.Typography,
                {
                  variant: "body1",
                  weight: "medium",
                  component: "div",
                  sx: (theme) => ({
                    flex: 1,
                    minWidth: 0,
                    overflowWrap: "anywhere",
                    ..._chunkD7SVFE66cjs.mode.call(void 0, theme, { color: _tokens.text.default.heading })
                  }),
                  children: title
                }
              ),
              meta !== void 0 && meta !== null ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                _atoms.Typography,
                {
                  variant: "body2",
                  component: "div",
                  sx: (theme) => ({ flexShrink: 0, whiteSpace: "nowrap", ..._chunkD7SVFE66cjs.mode.call(void 0, theme, { color: _tokens.text.default.b3 }) }),
                  children: meta
                }
              ) : null,
              actions ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Stack, { direction: "row", spacing: 0.5, sx: { flexShrink: 0 }, onClick: (e) => e.stopPropagation(), children: actions }) : null,
              collapsible ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                _atoms.IconButton,
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
                  children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.CaretDownIcon, { style: { transition: "transform 150ms ease", transform: isOpen ? "rotate(180deg)" : void 0 } })
                }
              ) : null
            ]
          }
        ),
        hasBody ? collapsible ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Collapse, { in: isOpen, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { id: bodyId, sx: bodySx, children }) }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { sx: bodySx, children }) : null,
        footer ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _atoms.Stack,
          {
            direction: "row",
            spacing: 1,
            sx: (theme) => ({
              mt: 1.5,
              flexWrap: "wrap",
              alignItems: "center",
              pl: indentBody ? `calc(${_chunkD7SVFE66cjs.BLOCK_ICON_PX}px + ${theme.spacing(1.25)})` : 0
            }),
            children: footer
          }
        ) : null
      ] })
    }
  );
}

// src/ui/kit/helpers.tsx




var BUSY = /* @__PURE__ */ new Set(["submitting", "streaming", "cancelling"]);
function useCanRetry() {
  return _chunk66NT7LEDcjs.useThread.call(void 0, (s) => {
    if (BUSY.has(s.run.status)) return false;
    const last = s.messages[s.messages.length - 1];
    return s.run.status === "error" || _optionalChain([last, 'optionalAccess', _4 => _4.status]) === "error" || _optionalChain([last, 'optionalAccess', _5 => _5.status]) === "interrupted";
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
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const [left, setLeft] = _react.useState.call(void 0, () => Math.ceil(_nullishCoalesce(retryAfter, () => ( 0))));
  _react.useEffect.call(void 0, () => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1e3);
    return () => clearTimeout(t);
  }, [left]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Button, { size: "sm", variant: "error", appearance: "text", disabled: left > 0, onClick: onRetry, children: left > 0 ? labels.tryAgainIn(left) : labels.tryAgain });
}
function ErrorNotice({
  title,
  message,
  retryable = true,
  retryAfter,
  onRetry,
  action,
  requestId
}) {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const canRetry = useCanRetry();
  const { retry } = _chunk66NT7LEDcjs.useChatActions.call(void 0, );
  const handler = _nullishCoalesce(onRetry, () => ( (() => void retry())));
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    _atoms.Alert,
    {
      severity: "error",
      floating: true,
      title,
      action: _nullishCoalesce(action, () => ( (retryable && (onRetry || canRetry) ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, RetryButton, { retryAfter, onRetry: handler }) : void 0))),
      children: [
        message,
        requestId ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { component: "span", sx: (t) => ({ display: "block", mt: 0.5, ..._chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.b3 }) }), children: labels.errorReference(requestId) }) : null
      ]
    }
  );
}
function ReconnectButton({ sourceId }) {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const { reconnect } = _chunk66NT7LEDcjs.useChatActions.call(void 0, );
  const sourceLabel = _chunk66NT7LEDcjs.useSourceLabel.call(void 0, sourceId);
  const [busy, setBusy] = _react.useState.call(void 0, false);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    _atoms.Button,
    {
      size: "sm",
      variant: "error",
      appearance: "text",
      loading: busy,
      onClick: () => {
        setBusy(true);
        void reconnect().finally(() => setBusy(false));
      },
      children: labels.reconnect(sourceLabel)
    }
  );
}
function TurnErrorNotice({ error, title, message }) {
  const runtime = _chunk66NT7LEDcjs.useChatRuntime.call(void 0, );
  const reconnect = error.action === "reconnect" && runtime.config.canReconnect;
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    ErrorNotice,
    {
      title: _nullishCoalesce(title, () => ( error.message)),
      message,
      retryable: error.action ? error.action === "retry" : error.retryable !== false,
      retryAfter: error.retryAfter,
      action: reconnect ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ReconnectButton, { sourceId: error.sourceId }) : void 0,
      requestId: error.requestId
    }
  );
}

// src/ui/kit/KeyValueList.tsx



function KeyValueList({ items }) {
  if (!items.length) return null;
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    _atoms.Box,
    {
      component: "dl",
      sx: {
        display: "grid",
        gridTemplateColumns: "minmax(56px, max-content) minmax(0, 1fr)",
        columnGap: 1.25,
        rowGap: 1,
        m: 0
      },
      children: items.map((item) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Box, { sx: { display: "contents" }, children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _atoms.Typography,
          {
            variant: "body2",
            component: "dt",
            sx: (theme) => ({ minWidth: 0, overflowWrap: "anywhere", ..._chunkD7SVFE66cjs.mode.call(void 0, theme, { color: _tokens.text.default.b3 }) }),
            children: _nullishCoalesce(item.label, () => ( item.key))
          }
        ),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _atoms.Typography,
          {
            variant: "body2",
            component: "dd",
            sx: (theme) => ({
              m: 0,
              minWidth: 0,
              overflowWrap: "anywhere",
              ..._chunkD7SVFE66cjs.mode.call(void 0, theme, { color: _tokens.text.default.b1 })
            }),
            children: item.value
          }
        )
      ] }, item.key))
    }
  );
}

// src/ui/kit/Shimmer.tsx



var gradient = (from, to) => `linear-gradient(90deg, ${from} 0%, ${to} 45%, ${from} 90%)`;
function Shimmer({
  children,
  variant = "body1",
  bar = false
}) {
  const sweep = {
    light: gradient(_tokens.text.default.b3.light, _tokens.text.default.b1.light),
    dark: gradient(_tokens.text.default.b3.dark, _tokens.text.default.b1.dark)
  };
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Box, { role: "status", "aria-live": "polite", sx: { minWidth: 0 }, children: [
    children ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      _atoms.Typography,
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
          ..._chunkD7SVFE66cjs.mode.call(void 0, theme, { backgroundImage: sweep }),
          "@media (prefers-reduced-motion: reduce)": {
            animation: "none",
            ..._chunkD7SVFE66cjs.mode.call(void 0, theme, { color: _tokens.text.default.b2 })
          }
        }),
        children
      }
    ) : null,
    bar ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      _atoms.Box,
      {
        "aria-hidden": true,
        sx: (theme) => ({
          mt: 1.25,
          height: 8,
          borderRadius: 999,
          overflow: "hidden",
          position: "relative",
          ..._chunkD7SVFE66cjs.mode.call(void 0, theme, { backgroundColor: _tokens.surface.layers.card3 }),
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            width: "40%",
            "@keyframes acu-bar": { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(250%)" } },
            animation: "acu-bar 1.6s ease-in-out infinite",
            ..._chunkD7SVFE66cjs.mode.call(void 0, theme, {
              backgroundImage: {
                light: `linear-gradient(90deg, transparent, ${_tokens.surface.layers.page.light}, transparent)`,
                dark: `linear-gradient(90deg, transparent, ${_tokens.surface.layers.card6OnColor.dark}, transparent)`
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
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    _atoms.Box,
    {
      component: "span",
      "aria-hidden": true,
      sx: (theme) => ({
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        flexShrink: 0,
        ..._chunkD7SVFE66cjs.mode.call(void 0, theme, { backgroundColor: _tokens.surface.primary.default }),
        "@keyframes acu-pulse": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.35 } },
        animation: "acu-pulse 1.2s ease-in-out infinite",
        "@media (prefers-reduced-motion: reduce)": { animation: "none" }
      })
    }
  );
}

// src/ui/blocks/Markdown.tsx















var _reactmarkdown = require('react-markdown'); var _reactmarkdown2 = _interopRequireDefault(_reactmarkdown);
var _remarkgfm = require('remark-gfm'); var _remarkgfm2 = _interopRequireDefault(_remarkgfm);

var isExternal = (href) => Boolean(href && /^https?:\/\//i.test(href));
function align(a) {
  return a === "left" || a === "center" || a === "right" ? a : void 0;
}
function buildComponents(size) {
  const body = size === "md" ? { variant: "h6", weight: "regular" } : { variant: "body1" };
  const spaced = { "&:not(:last-child)": { mb: size === "md" ? 1.5 : 1 } };
  return {
    p: ({ children }) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { ...body, component: "p", sx: (t) => ({ ...spaced, ..._chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.b1 }) }), children }),
    h1: ({ children }) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "h5", component: "h3", sx: { mt: 2, mb: 1, "&:first-of-type": { mt: 0 } }, children }),
    h2: ({ children }) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "h6", component: "h4", sx: { mt: 2, mb: 1, "&:first-of-type": { mt: 0 } }, children }),
    h3: ({ children }) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "body1", weight: "semibold", component: "h5", sx: { mt: 1.5, mb: 0.75 }, children }),
    h4: ({ children }) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "body1", weight: "semibold", component: "h6", sx: { mt: 1.5, mb: 0.75 }, children }),
    h5: ({ children }) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "body1", weight: "medium", component: "h6", sx: { mt: 1, mb: 0.5 }, children }),
    h6: ({ children }) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "body1", weight: "medium", component: "h6", sx: { mt: 1, mb: 0.5 }, children }),
    a: ({ href, children }) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      _atoms.Link,
      {
        href,
        target: isExternal(href) ? "_blank" : void 0,
        rel: isExternal(href) ? "noopener noreferrer" : void 0,
        children
      }
    ),
    ul: ({ children }) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { component: "ul", sx: { pl: 3, my: 0, ...spaced }, children }),
    ol: ({ children, start }) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { component: "ol", start, sx: { pl: 3, my: 0, ...spaced }, children }),
    li: ({ children }) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      _atoms.Typography,
      {
        ...body,
        component: "li",
        sx: (t) => ({ "&:not(:last-child)": { mb: 0.5 }, ..._chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.b1 }) }),
        children
      }
    ),
    blockquote: ({ children }) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      _atoms.Box,
      {
        component: "blockquote",
        sx: (t) => ({
          m: 0,
          pl: 1.5,
          borderLeft: "2px solid",
          ...spaced,
          ..._chunkD7SVFE66cjs.mode.call(void 0, t, { borderColor: _tokens.border.layers.card3, color: _tokens.text.default.b2 })
        }),
        children
      }
    ),
    hr: () => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Divider, { sx: { my: 2 } }),
    code: ({ className, children }) => {
      const block = /language-/.test(_nullishCoalesce(className, () => ( ""))) || String(_nullishCoalesce(children, () => ( ""))).includes("\n");
      if (block) return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "code", { className, children });
      return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        _atoms.Box,
        {
          component: "code",
          sx: (t) => ({
            fontFamily: _chunkD7SVFE66cjs.monoFont,
            fontSize: "0.9em",
            px: 0.5,
            py: 0.125,
            borderRadius: 0.5,
            ..._chunkD7SVFE66cjs.mode.call(void 0, t, { backgroundColor: _tokens.surface.layers.card2, color: _tokens.text.default.heading })
          }),
          children
        }
      );
    },
    pre: ({ children }) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      _atoms.Box,
      {
        component: "pre",
        sx: (t) => ({
          m: 0,
          p: 1.5,
          overflowX: "auto",
          borderRadius: 1,
          border: "1px solid",
          fontFamily: _chunkD7SVFE66cjs.monoFont,
          fontSize: t.typography.body2.fontSize,
          lineHeight: t.typography.body2.lineHeight,
          ...spaced,
          ..._chunkD7SVFE66cjs.mode.call(void 0, t, { backgroundColor: _tokens.surface.layers.card2, borderColor: _tokens.border.layers.card2, color: _tokens.text.default.heading }),
          "& code": { fontFamily: "inherit" }
        }),
        children
      }
    ),
    table: ({ children }) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Card, { sx: { ...spaced }, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.TableContainer, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Table, { size: "sm", children }) }) }),
    thead: ({ children }) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.TableHead, { children }),
    tbody: ({ children }) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.TableBody, { children }),
    tr: ({ children }) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.TableRow, { children }),
    th: ({ children, style }) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.TableCell, { align: align(_optionalChain([style, 'optionalAccess', _6 => _6.textAlign])), children }),
    td: ({ children, style }) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.TableCell, { align: align(_optionalChain([style, 'optionalAccess', _7 => _7.textAlign])), children }),
    img: ({ src, alt }) => typeof src === "string" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      _atoms.Box,
      {
        component: "img",
        src,
        alt: _nullishCoalesce(alt, () => ( "")),
        loading: "lazy",
        sx: { maxWidth: "100%", borderRadius: 1, display: "block", ...spaced }
      }
    ) : null
  };
}
var COMPONENTS = { md: buildComponents("md"), sm: buildComponents("sm") };
var Markdown = _react.memo.call(void 0, function Markdown2({ children, size = "md", components }) {
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { sx: { minWidth: 0, overflowWrap: "anywhere" }, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    _reactmarkdown2.default,
    {
      remarkPlugins: [_remarkgfm2.default],
      components: components ? { ...COMPONENTS[size], ...components } : COMPONENTS[size],
      children
    }
  ) });
});

// src/ui/blocks/basic.tsx

function TextBlock({ data }) {
  if (!data.text) return null;
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Markdown, { children: data.text });
}
function ThinkingBlock({ data, status }) {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const streaming = status === "streaming";
  const [open, setOpen] = _react.useState.call(void 0, streaming);
  _react.useEffect.call(void 0, () => {
    if (!streaming) setOpen(false);
  }, [streaming]);
  const seconds = data.durationMs !== void 0 ? Math.round(data.durationMs / 1e3) : void 0;
  const title = streaming ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Shimmer, { children: labels.thinkingLive }) : seconds !== void 0 ? labels.thoughtFor(seconds) : labels.thought;
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, BlockShell, { icon: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.BrainIcon, {}), title, collapsible: true, open, onOpenChange: setOpen, busy: streaming, children: data.text ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    _atoms.Typography,
    {
      variant: "body1",
      component: "div",
      sx: (t) => ({ whiteSpace: "pre-wrap", ..._chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.b2 }) }),
      children: data.text
    }
  ) : null });
}
var MAX_RESULTS_SHOWN = 5;
function ToolResults({ results, total }) {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const shown = results.slice(0, MAX_RESULTS_SHOWN);
  const more = Math.max(0, total - shown.length);
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Box, { component: "span", sx: { display: "flex", flexDirection: "column", gap: 0.5 }, children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { children: labels.toolResults(total) }),
    shown.map((r, i) => {
      const href = safeUrl(r.url);
      return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Box, { component: "span", sx: { display: "block" }, children: [
        href ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Link, { href, target: "_blank", rel: "noopener noreferrer", children: r.title }) : r.title,
        r.snippet ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { component: "span", sx: (t) => ({ display: "block", ..._chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.b3 }) }), children: r.snippet }) : null
      ] }, `${r.title}:${i}`);
    }),
    more ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { component: "span", sx: (t) => _chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.b3 }), children: labels.toolMoreResults(more) }) : null
  ] });
}
function ToolBlock({ data }) {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const running = data.status === "running";
  const items = data.input.map(([k, v]) => ({ key: k, label: _chunkE6FMLYAFcjs.humanizeKey.call(void 0, k), value: _chunkE6FMLYAFcjs.formatJsonish.call(void 0, v) }));
  if (data.results) {
    const total = _nullishCoalesce(data.resultCount, () => ( data.results.length));
    items.push({ key: "__returned", label: "returned", value: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ToolResults, { results: data.results, total }) });
  } else if (data.summary) items.push({ key: "__returned", label: "returned", value: data.summary });
  else if (data.output !== void 0 && !running)
    items.push({ key: "__returned", label: "returned", value: _chunkE6FMLYAFcjs.formatJsonish.call(void 0, data.output) });
  if (data.error) {
    items.push({
      key: "__error",
      label: "error",
      value: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { component: "span", sx: (t) => _chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.error[3] }), children: data.error })
    });
  }
  const meta = running ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Box, { component: "span", sx: { display: "inline-flex", alignItems: "center", gap: 0.75 }, children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.CircularProgress, { size: 12, color: "secondary" }),
    labels.toolRunning
  ] }) : data.status === "error" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Chip, { size: "sm", variant: "error", label: labels.toolFailed }) : data.status === "interrupted" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Chip, { size: "sm", variant: "warning", label: labels.toolInterrupted }) : data.durationMs !== void 0 ? formatDuration(data.durationMs) : void 0;
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, BlockShell, { icon: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.WrenchIcon, {}), title: _nullishCoalesce(data.title, () => ( data.name)), meta, busy: running, "aria-label": data.name, children: items.length ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, KeyValueList, { items }) : null });
}
function SourcesBlock({ data, actions }) {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const [checked, setChecked] = _react.useState.call(void 0, 
    () => Object.fromEntries(data.items.map((i) => [i.id, _nullishCoalesce(i.selected, () => ( false))]))
  );
  const title = _nullishCoalesce(data.title, () => ( labels.sources(data.items.length)));
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, BlockShell, { icon: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.FilesIcon, {}), title, flushBody: true, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.List, { dense: true, children: data.items.map((item) => {
    const href = safeUrl(item.url);
    const primary = item.label;
    if (data.selectable) {
      return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.ListItem, { disablePadding: true, children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
        _atoms.ListItemButton,
        {
          role: "checkbox",
          "aria-checked": Boolean(checked[item.id]),
          onClick: () => {
            const next = !checked[item.id];
            setChecked((c) => ({ ...c, [item.id]: next }));
            actions.emit("source_toggle", { ...item, selected: next });
          },
          children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.ListItemIcon, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Checkbox, { size: "sm", checked: Boolean(checked[item.id]), tabIndex: -1, "aria-hidden": true }) }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.ListItemText, { primary, secondary: item.description })
          ]
        }
      ) }, item.id);
    }
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.ListItem, { disablePadding: true, children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
      _atoms.ListItemButton,
      {
        ...href ? { component: "a", href, target: "_blank", rel: "noopener noreferrer" } : {},
        onClick: () => actions.emit("open_source", item),
        children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.ListItemIcon, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.FileTextIcon, { size: 14 }) }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.ListItemText, { primary, secondary: item.description })
        ]
      }
    ) }, item.id);
  }) }) });
}
function ErrorBlock({ data, actions }) {
  const canRetry = useCanRetry();
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const fallback = _chunkE6FMLYAFcjs.parseFallback.call(void 0, block.data).text;
  if (fallback) return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Markdown, { children: fallback });
  if (!_chunk66NT7LEDcjs.isDev.call(void 0, )) return null;
  const json = (() => {
    try {
      return JSON.stringify(block.data, null, 2).slice(0, 4e3);
    } catch (e2) {
      return String(block.data);
    }
  })();
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Alert, { severity: "warning", floating: true, title: `${labels.unknownBlock}: ${block.type}`, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { component: "pre", sx: { m: 0, fontFamily: _chunkD7SVFE66cjs.monoFont, whiteSpace: "pre-wrap", maxHeight: 240, overflow: "auto" }, children: json }) });
}
function BlockCrashNotice() {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Alert, { severity: "warning", floating: true, title: labels.blockCrashed });
}

// src/ui/blocks/hitl.tsx





var same = (a, b) => {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch (e3) {
    return a === b;
  }
};
function DecisionError() {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "body2", component: "span", sx: (t) => _chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.error[3] }), children: labels.decisionFailed });
}
function ApprovalBlock({ data }) {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const hitl = _chunk66NT7LEDcjs.useHitl.call(void 0, );
  const [clicked, setClicked] = _react.useState.call(void 0, null);
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
    footer = /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      _atoms.Chip,
      {
        size: "sm",
        variant: resolvedAs === "approve" ? "success" : "secondary",
        label: resolvedAs === "approve" ? labels.approved : labels.rejected
      }
    );
  } else if (live) {
    footer = /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        _atoms.Button,
        {
          size: "sm",
          variant: "secondary",
          appearance: "text",
          disabled: !hitl.canSubmit,
          loading: hitl.isSubmitting && clicked === "reject",
          onClick: () => void decide("reject"),
          children: _nullishCoalesce(data.rejectLabel, () => ( labels.reject))
        }
      ),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        _atoms.Button,
        {
          size: "sm",
          variant: data.tone === "danger" ? "error" : "primary",
          disabled: !hitl.canSubmit,
          loading: hitl.isSubmitting && clicked === "approve",
          onClick: () => void decide("approve"),
          children: _nullishCoalesce(data.approveLabel, () => ( labels.approve))
        }
      ),
      hitl.status === "failed" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, DecisionError, {}) : null
    ] });
  }
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, BlockShell, { icon: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.WarningIcon, {}), title: data.title, tone, footer, busy: hitl.isSubmitting, children: data.description || data.details.length ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Stack, { spacing: 1.5, children: [
    data.description ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "body1", component: "div", sx: (t) => _chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.b1 }), children: data.description }) : null,
    data.details.length ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      KeyValueList,
      {
        items: data.details.map(([k, v]) => ({
          key: k,
          label: _chunkE6FMLYAFcjs.humanizeKey.call(void 0, k),
          value: typeof v === "string" ? v : _chunkE6FMLYAFcjs.formatJsonish.call(void 0, v)
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
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const hitl = _chunk66NT7LEDcjs.useHitl.call(void 0, );
  const [selected, setSelected] = _react.useState.call(void 0, () => initialSelection(hitl.decision));
  const locked = !hitl.canSubmit;
  const tooFew = selected.length < data.min;
  const tooMany = data.max !== void 0 && selected.length > data.max;
  const live = hitl.isPending || hitl.isSubmitting;
  const toggle = (value) => setSelected((prev) => prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]);
  const footer = hitl.isResolved ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Chip, { size: "sm", variant: "success", label: labels.submitted }) : live ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      _atoms.Button,
      {
        size: "sm",
        disabled: locked || tooFew || tooMany,
        loading: hitl.isSubmitting,
        onClick: () => void hitl.submit(data.multiple ? selected : _nullishCoalesce(selected[0], () => ( ""))),
        children: _nullishCoalesce(data.submitLabel, () => ( labels.submit))
      }
    ),
    tooMany && data.max !== void 0 ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "body2", component: "span", sx: (t) => _chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.error[3] }), children: labels.selectAtMost(data.max) }) : data.multiple && data.min > 1 && tooFew ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "body2", component: "span", sx: (t) => _chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.b3 }), children: labels.selectAtLeast(data.min) }) : null,
    hitl.status === "failed" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, DecisionError, {}) : null
  ] }) : null;
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    BlockShell,
    {
      icon: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.ListChecksIcon, {}),
      title: data.title,
      tone: live ? "primary" : "default",
      footer,
      busy: hitl.isSubmitting,
      children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Stack, { spacing: 1, children: [
        data.description ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "body1", component: "div", sx: (t) => _chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.b1 }), children: data.description }) : null,
        data.multiple ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { role: "group", "aria-label": data.title, sx: { display: "flex", flexDirection: "column", gap: 0.25 }, children: data.options.map((o) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _atoms.Checkbox,
          {
            label: o.label,
            checked: selected.includes(o.value),
            disabled: locked,
            onChange: () => toggle(o.value)
          },
          o.value
        )) }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.RadioGroup, { "aria-label": data.title, value: _nullishCoalesce(selected[0], () => ( "")), onChange: (_, value) => setSelected([value]), children: data.options.map((o) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Radio, { value: o.value, label: o.label, disabled: locked }, o.value)) })
      ] })
    }
  );
}

// src/ui/blocks/media.tsx





























var PREVIEW_LINES = 6;
var FORMAT_LABEL = { markdown: "Markdown", text: "Text", json: "JSON", csv: "CSV", code: "Code" };
function download(data) {
  if (typeof document === "undefined") return;
  const href = safeUrl(data.url);
  const a = document.createElement("a");
  if (href) {
    a.href = href;
  } else if (data.content !== void 0) {
    a.href = URL.createObjectURL(new Blob([data.content], { type: _nullishCoalesce(data.mimeType, () => ( "text/plain")) }));
  } else return;
  a.download = data.title;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (!href) setTimeout(() => URL.revokeObjectURL(a.href), 1e3);
}
function ArtifactBlock({ data, actions, status }) {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const [open, setOpen] = _react.useState.call(void 0, false);
  const content = _nullishCoalesce(data.content, () => ( ""));
  const lines = content.split("\n");
  const truncated = lines.length > PREVIEW_LINES;
  const canDownload = Boolean(safeUrl(data.url) || data.content !== void 0);
  const openFull = () => {
    setOpen(true);
    actions.emit("open_artifact", data);
  };
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      BlockShell,
      {
        icon: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.FileTextIcon, {}),
        title: data.title,
        busy: status === "streaming",
        actions: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Chip, { size: "sm", variant: "secondary", label: _nullishCoalesce(FORMAT_LABEL[data.format], () => ( data.format)) }),
          content ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Tooltip, { title: labels.openFull, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.IconButton, { size: "sm", variant: "secondary", appearance: "text", "aria-label": labels.openFull, onClick: openFull, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.ArrowsOutSimpleIcon, {}) }) }) : null,
          canDownload ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Tooltip, { title: labels.download, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _atoms.IconButton,
            {
              size: "sm",
              variant: "secondary",
              appearance: "text",
              "aria-label": labels.download,
              onClick: () => download(data),
              children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.DownloadSimpleIcon, {})
            }
          ) }) : null
        ] }),
        children: content ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _atoms.Box,
          {
            component: "pre",
            sx: (t) => ({
              m: 0,
              fontFamily: _chunkD7SVFE66cjs.monoFont,
              fontSize: t.typography.body2.fontSize,
              lineHeight: "22px",
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              ..._chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.b2 }),
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
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Dialog, { open, onClose: () => setOpen(false), fullWidth: true, maxWidth: "md", scroll: "paper", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.DialogTitle, { onClose: () => setOpen(false), slotProps: { closeButton: { "aria-label": labels.close } }, children: data.title }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.DialogContent, { dividers: true, children: data.format === "markdown" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Markdown, { size: "sm", children: content }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { component: "pre", sx: { m: 0, fontFamily: _chunkD7SVFE66cjs.monoFont, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }, children: content }) })
    ] })
  ] });
}
function ImageBlock({ data, actions }) {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const src = safeUrl(data.src, { allowDataImage: true });
  const [state, setState] = _react.useState.call(void 0, src ? "loading" : "error");
  const [open, setOpen] = _react.useState.call(void 0, false);
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Box, { component: "figure", sx: { m: 0, maxWidth: 480 }, children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
      _atoms.Box,
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
          ..._chunkD7SVFE66cjs.mode.call(void 0, t, { backgroundColor: _tokens.surface.layers.card2, borderColor: _tokens.border.layers.card1 })
        }),
        children: [
          src && state !== "error" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _atoms.Box,
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
          state === "loading" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Skeleton, { variant: "rectangular", sx: { position: "absolute", inset: 0, height: "100%" } }) : null,
          state === "error" ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
            _atoms.Stack,
            {
              spacing: 1,
              sx: (t) => ({
                position: "absolute",
                inset: 0,
                alignItems: "center",
                justifyContent: "center",
                ..._chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.icon.default.b3 })
              }),
              children: [
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.ImageBrokenIcon, { size: 28 }),
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "body2", children: labels.imageFailed })
              ]
            }
          ) : null
        ]
      }
    ),
    data.caption ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      _atoms.Typography,
      {
        variant: "body2",
        component: "figcaption",
        sx: (t) => ({ mt: 1, ..._chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.b3 }) }),
        children: data.caption
      }
    ) : null,
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Dialog, { open, onClose: () => setOpen(false), maxWidth: "lg", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.DialogTitle, { onClose: () => setOpen(false), slotProps: { closeButton: { "aria-label": labels.close } }, children: _nullishCoalesce(_nullishCoalesce(data.caption, () => ( data.alt)), () => ( "")) }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.DialogContent, { children: src ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        _atoms.Box,
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
  if (step.status === "running") return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.CircularProgress, { size: 12 });
  const glyph = step.status === "done" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.CheckIcon, { size: 14 }) : step.status === "failed" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.XIcon, { size: 14 }) : step.status === "skipped" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.MinusIcon, { size: 14 }) : null;
  if (!glyph) return null;
  const color = step.status === "failed" ? _tokens.icon.error[3] : _tokens.icon.default.b3;
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { component: "span", "aria-hidden": true, sx: (t) => ({ display: "inline-flex", ..._chunkD7SVFE66cjs.mode.call(void 0, t, { color }) }), children: glyph });
}
function PlanBlock({ data }) {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const [openIds, setOpenIds] = _react.useState.call(void 0, 
    () => new Set(data.steps.filter((s) => (s.status === "running" || s.status === "failed") && s.detail).map((s) => s.id))
  );
  const toggle = (id) => setOpenIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Box, { "aria-label": _nullishCoalesce(data.title, () => ( labels.planRunning)), children: [
    data.title ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "body1", weight: "medium", component: "div", sx: { mb: 1 }, children: data.title }) : null,
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Stepper, { activeStep: -1, children: data.steps.map((step) => {
      const hasDetail = Boolean(step.detail && (typeof step.detail === "string" || step.detail.length));
      const expanded = hasDetail && openIds.has(step.id);
      const label = step.status === "running" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Shimmer, { children: step.title }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { component: "span", children: step.title });
      return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Step, { completed: step.status === "done", active: step.status === "running", expanded, children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.StepLabel, { error: step.status === "failed", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
          _atoms.Box,
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
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { component: "span", sx: { flex: 1, minWidth: 0 }, children: label }),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, StepStatusIcon, { step })
            ]
          }
        ) }),
        hasDetail ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.StepContent, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _atoms.Box,
          {
            sx: (t) => ({
              p: 1.5,
              borderRadius: 1,
              border: "1px solid",
              ..._chunkD7SVFE66cjs.mode.call(void 0, t, { backgroundColor: _tokens.surface.layers.card2, borderColor: _tokens.border.layers.card2 })
            }),
            children: typeof step.detail === "string" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "body2", children: step.detail }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              KeyValueList,
              {
                items: (_nullishCoalesce(step.detail, () => ( []))).map(([k, v]) => ({
                  key: k,
                  label: _chunkE6FMLYAFcjs.humanizeKey.call(void 0, k),
                  value: typeof v === "string" ? v : _chunkE6FMLYAFcjs.formatJsonish.call(void 0, v)
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














var MAX_RENDERED_ROWS = 500;
function compare(a, b) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  const na = Number(a);
  const nb = Number(b);
  if (a !== "" && b !== "" && Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return String(_nullishCoalesce(a, () => ( ""))).localeCompare(String(_nullishCoalesce(b, () => ( ""))), void 0, { numeric: true, sensitivity: "base" });
}
function DataTable({
  columns,
  rows,
  maxHeight = 360
}) {
  const [sort, setSort] = _react.useState.call(void 0, null);
  const sorted = _react.useMemo.call(void 0, () => {
    const limited = rows.slice(0, MAX_RENDERED_ROWS);
    if (!sort) return limited;
    const out = [...limited].sort((x, y) => compare(x[sort.key], y[sort.key]));
    return sort.dir === "desc" ? out.reverse() : out;
  }, [rows, sort]);
  const onSort = (key) => setSort((s) => _optionalChain([s, 'optionalAccess', _8 => _8.key]) !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.TableContainer, { sx: { maxHeight }, children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Table, { size: "sm", stickyHeader: true, children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.TableHead, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.TableRow, { children: columns.map((c) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.TableCell, { align: c.align, sortDirection: _optionalChain([sort, 'optionalAccess', _9 => _9.key]) === c.key ? sort.dir : false, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      _atoms.TableSortLabel,
      {
        active: _optionalChain([sort, 'optionalAccess', _10 => _10.key]) === c.key,
        direction: _optionalChain([sort, 'optionalAccess', _11 => _11.key]) === c.key ? sort.dir : "asc",
        onClick: () => onSort(c.key),
        children: c.label
      }
    ) }, c.key)) }) }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.TableBody, { children: sorted.map((row, i) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.TableRow, { children: columns.map((c) => {
      const value = _chunkE6FMLYAFcjs.formatValue.call(void 0, row[c.key], { format: c.format, currency: c.currency });
      const numeric = c.format === "currency" || c.format === "number" || c.format === "percent";
      return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.TableCell, { align: c.align, children: numeric ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { component: "span", sx: _atoms.tableAmountType, children: value }) : value }, c.key);
    }) }, i)) })
  ] }) });
}
function TableBlock({ data }) {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, BlockShell, { icon: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.TableIcon, {}), title: _nullishCoalesce(data.title, () => ( "")), meta: labels.rows(data.totalRows), flushBody: true, children: data.columns.length ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, DataTable, { columns: data.columns, rows: data.rows }) : null });
}
function tableToText(data) {
  const head = data.columns.map((c) => c.label).join("	");
  const body = data.rows.map(
    (r) => data.columns.map((c) => _chunkE6FMLYAFcjs.formatValue.call(void 0, r[c.key], { format: c.format, currency: c.currency })).join("	")
  );
  return [data.title, head, ...body].filter(Boolean).join("\n");
}

// src/ui/blocks/index.ts
var choiceTypes = _chunkE6FMLYAFcjs.BLOCK_TYPES.choice;
var approvalTypes = _chunkE6FMLYAFcjs.BLOCK_TYPES.approval;
var textBlock = _chunkE6FMLYAFcjs.defineBlock.call(void 0, {
  name: "text",
  type: _chunkE6FMLYAFcjs.BLOCK_TYPES.text,
  category: "content",
  parse: _chunkE6FMLYAFcjs.parseText,
  render: TextBlock,
  toText: (d) => d.text
});
var thinkingBlock = _chunkE6FMLYAFcjs.defineBlock.call(void 0, {
  name: "thinking",
  type: _chunkE6FMLYAFcjs.BLOCK_TYPES.thinking,
  category: ["reasoning", "thinking"],
  parse: _chunkE6FMLYAFcjs.parseThinking,
  render: ThinkingBlock,
  toText: () => ""
});
var toolCallBlock = _chunkE6FMLYAFcjs.defineBlock.call(void 0, {
  name: "tool_call",
  type: _chunkE6FMLYAFcjs.BLOCK_TYPES.toolCall,
  category: "tool",
  parse: _chunkE6FMLYAFcjs.parseToolCall,
  render: ToolBlock,
  toText: () => ""
});
var tableBlock = _chunkE6FMLYAFcjs.defineBlock.call(void 0, {
  name: "table",
  type: _chunkE6FMLYAFcjs.BLOCK_TYPES.table,
  parse: _chunkE6FMLYAFcjs.parseTable,
  render: TableBlock,
  toText: tableToText
});
var sourcesBlock = _chunkE6FMLYAFcjs.defineBlock.call(void 0, {
  name: "sources",
  type: _chunkE6FMLYAFcjs.BLOCK_TYPES.sources,
  category: ["citation", "sources"],
  parse: _chunkE6FMLYAFcjs.parseSources,
  render: SourcesBlock,
  toText: () => ""
});
var approvalBlock = _chunkE6FMLYAFcjs.defineBlock.call(void 0, {
  name: "approval",
  type: _chunkE6FMLYAFcjs.BLOCK_TYPES.approval,
  // Any other HITL block without options reads best as an approval.
  category: "hitl",
  parse: _chunkE6FMLYAFcjs.parseApproval,
  render: ApprovalBlock,
  toText: (d) => [d.title, d.description].filter(Boolean).join("\n")
});
var choiceBlock = _chunkE6FMLYAFcjs.defineBlock.call(void 0, {
  name: "choice",
  type: _chunkE6FMLYAFcjs.BLOCK_TYPES.choice,
  // An unknown HITL type that carries options is a choice, not an approval.
  match: (b) => b.category === "hitl" && Array.isArray(b.options) && !approvalTypes.includes(b.type) && !choiceTypes.includes(b.type),
  parse: _chunkE6FMLYAFcjs.parseChoice,
  render: ChoiceBlock,
  toText: (d) => d.title
});
var errorBlock = _chunkE6FMLYAFcjs.defineBlock.call(void 0, {
  name: "error",
  type: _chunkE6FMLYAFcjs.BLOCK_TYPES.error,
  category: "error",
  parse: _chunkE6FMLYAFcjs.parseError,
  render: ErrorBlock,
  toText: (d) => [d.title, d.message].filter(Boolean).join(": ")
});
var artifactBlock = _chunkE6FMLYAFcjs.defineBlock.call(void 0, {
  name: "artifact",
  type: _chunkE6FMLYAFcjs.BLOCK_TYPES.artifact,
  parse: _chunkE6FMLYAFcjs.parseArtifact,
  render: ArtifactBlock,
  toText: (d) => _nullishCoalesce(d.content, () => ( d.title))
});
var imageBlock = _chunkE6FMLYAFcjs.defineBlock.call(void 0, {
  name: "image",
  type: _chunkE6FMLYAFcjs.BLOCK_TYPES.image,
  parse: _chunkE6FMLYAFcjs.parseImage,
  render: ImageBlock,
  toText: (d) => _nullishCoalesce(d.caption, () => ( d.alt))
});
var planBlock = _chunkE6FMLYAFcjs.defineBlock.call(void 0, {
  name: "plan",
  type: _chunkE6FMLYAFcjs.BLOCK_TYPES.plan,
  category: "plan",
  parse: _chunkE6FMLYAFcjs.parsePlan,
  applyDelta: _chunkE6FMLYAFcjs.applyPlanDelta,
  render: PlanBlock,
  toText: () => ""
});
var unknownBlock = _chunkE6FMLYAFcjs.defineBlock.call(void 0, {
  name: "unknown",
  match: () => false,
  render: UnknownBlock,
  toText: (_d, block) => _nullishCoalesce(_chunkE6FMLYAFcjs.parseFallback.call(void 0, block.data).text, () => ( ""))
});
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
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const { renameConversation } = _chunk66NT7LEDcjs.useChatActions.call(void 0, );
  const [value, setValue] = _react.useState.call(void 0, item.title);
  const [saving, setSaving] = _react.useState.call(void 0, false);
  const submit = async () => {
    if (!value.trim()) return;
    setSaving(true);
    try {
      await renameConversation(item.id, value);
      onClose();
    } catch (e4) {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Dialog, { open: true, onClose, fullWidth: true, maxWidth: "xs", children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.DialogTitle, { onClose, slotProps: { closeButton: { "aria-label": labels.close } }, children: labels.renameTitle }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.DialogContent, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      _atoms.Box,
      {
        component: "form",
        onSubmit: (e) => {
          e.preventDefault();
          void submit();
        },
        children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _atoms.TextField,
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
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.DialogActions, { children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Button, { appearance: "text", variant: "secondary", size: "sm", onClick: onClose, children: labels.cancel }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Button, { size: "sm", loading: saving, disabled: !value.trim(), onClick: () => void submit(), children: labels.save })
    ] })
  ] });
}
function DeleteDialog({ item, onClose }) {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const { deleteConversation } = _chunk66NT7LEDcjs.useChatActions.call(void 0, );
  const [busy, setBusy] = _react.useState.call(void 0, false);
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Dialog, { open: true, onClose, role: "alertdialog", maxWidth: "xs", children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.DialogTitle, { subtitle: item.title, onClose, slotProps: { closeButton: { "aria-label": labels.close } }, children: labels.deleteTitle }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.DialogContent, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.DialogContentText, { children: labels.deleteBody }) }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.DialogActions, { children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Button, { appearance: "text", variant: "secondary", size: "sm", onClick: onClose, children: labels.cancel }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        _atoms.Button,
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
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const history = _chunk66NT7LEDcjs.useConversations.call(void 0, );
  const searchId = _react.useId.call(void 0, );
  const [menu, setMenu] = _react.useState.call(void 0, null);
  const [renaming, setRenaming] = _react.useState.call(void 0, null);
  const [deleting, setDeleting] = _react.useState.call(void 0, null);
  const closeMenu = () => setMenu(null);
  const loading = history.status === "loading" && history.allItems.length === 0;
  const failed = history.status === "error" && history.allItems.length === 0;
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    _atoms.Box,
    {
      component: "nav",
      "aria-label": labels.history,
      sx: { display: "flex", flexDirection: "column", height: "100%", minHeight: 0 },
      children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Stack, { spacing: 1.25, sx: { p: 1.5 }, children: [
          showNewChat ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _atoms.Button,
            {
              size: "sm",
              variant: "secondary",
              appearance: "outline",
              startIcon: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.NotePencilIcon, {}),
              fullWidth: true,
              onClick: () => void history.create().catch(() => void 0),
              children: labels.newChat
            }
          ) : null,
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Box, { sx: { position: "relative" }, children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { component: "label", htmlFor: searchId, sx: visuallyHidden, children: labels.searchChats }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              _atoms.TextField,
              {
                id: searchId,
                fullWidth: true,
                type: "search",
                placeholder: labels.searchChats,
                value: history.query,
                onChange: (e) => history.setQuery(e.target.value),
                startAdornment: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.MagnifyingGlassIcon, { size: 16 })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Box, { sx: { flex: 1, minHeight: 0, overflowY: "auto", px: 0.5, pb: 1 }, children: [
          loading ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Stack, { spacing: 1, sx: { px: 1 }, "aria-hidden": true, children: Array.from({ length: 6 }, (_, i) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Skeleton, { variant: "rounded", height: 36 }, i)) }) : null,
          failed ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { sx: { px: 1 }, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _atoms.Alert,
            {
              severity: "error",
              title: labels.historyError,
              action: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Button, { size: "sm", variant: "error", appearance: "text", onClick: () => void history.refresh(), children: labels.tryAgain }),
              children: _optionalChain([history, 'access', _12 => _12.error, 'optionalAccess', _13 => _13.message])
            }
          ) }) : null,
          !loading && !failed && history.items.length === 0 ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _atoms.Typography,
            {
              variant: "body1",
              sx: (t) => ({ px: 1.5, py: 3, textAlign: "center", ..._chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.b3 }) }),
              children: history.query ? labels.historyNoResults : labels.historyEmpty
            }
          ) : null,
          history.groups.map((group) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Box, { component: "section", "aria-label": labels[GROUP_LABEL[group.key]], sx: { mb: 1 }, children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              _atoms.Typography,
              {
                variant: "caption",
                component: "h3",
                sx: (t) => ({ px: 1.5, pt: 1.5, pb: 0.5, m: 0, ..._chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.b3 }) }),
                children: labels[GROUP_LABEL[group.key]]
              }
            ),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.List, { dense: true, children: group.items.map((item) => {
              const active = item.id === history.activeId;
              const running = history.isRunning(item.id);
              return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                _atoms.ListItem,
                {
                  disablePadding: true,
                  secondaryAction: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                    _atoms.IconButton,
                    {
                      size: "sm",
                      variant: "secondary",
                      appearance: "text",
                      "aria-label": labels.moreActions(item.title),
                      "aria-haspopup": "menu",
                      onClick: (e) => setMenu({ anchor: e.currentTarget, item }),
                      children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.DotsThreeIcon, {})
                    }
                  ),
                  children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                    _atoms.ListItemButton,
                    {
                      selected: active,
                      "aria-current": active ? "page" : void 0,
                      onClick: () => {
                        void history.select(item.id);
                        _optionalChain([onSelect, 'optionalCall', _14 => _14(item.id)]);
                      },
                      children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                        _atoms.ListItemText,
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
        history.canArchive ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { sx: (t) => ({ px: 2, py: 1, borderTop: "1px solid", ..._chunkD7SVFE66cjs.mode.call(void 0, t, { borderColor: _tokens.border.layers.card1 }) }), children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _atoms.Switch,
          {
            size: "small",
            label: labels.showArchived,
            checked: history.showArchived,
            onChange: (_, checked) => history.setShowArchived(checked)
          }
        ) }) : null,
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
          _atoms.Menu,
          {
            anchorEl: _nullishCoalesce(_optionalChain([menu, 'optionalAccess', _15 => _15.anchor]), () => ( null)),
            open: Boolean(menu),
            onClose: closeMenu,
            anchorOrigin: { vertical: "bottom", horizontal: "right" },
            transformOrigin: { vertical: "top", horizontal: "right" },
            children: [
              /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
                _atoms.MenuItem,
                {
                  onClick: () => {
                    if (menu) setRenaming(menu.item);
                    closeMenu();
                  },
                  children: [
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.PencilSimpleIcon, { size: 16 }),
                    labels.rename
                  ]
                }
              ),
              history.canArchive ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
                _atoms.MenuItem,
                {
                  onClick: () => {
                    if (menu) void history.archive(menu.item.id, !menu.item.archived).catch(() => void 0);
                    closeMenu();
                  },
                  children: [
                    _optionalChain([menu, 'optionalAccess', _16 => _16.item, 'access', _17 => _17.archived]) ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.ArrowUUpLeftIcon, { size: 16 }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.ArchiveIcon, { size: 16 }),
                    _optionalChain([menu, 'optionalAccess', _18 => _18.item, 'access', _19 => _19.archived]) ? labels.unarchive : labels.archive
                  ]
                }
              ) : null,
              /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
                _atoms.MenuItem,
                {
                  onClick: () => {
                    if (menu) setDeleting(menu.item);
                    closeMenu();
                  },
                  children: [
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.TrashIcon, { size: 16 }),
                    labels.delete
                  ]
                }
              )
            ]
          }
        ),
        renaming ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, RenameDialog, { item: renaming, onClose: () => setRenaming(null) }) : null,
        deleting ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, DeleteDialog, { item: deleting, onClose: () => setDeleting(null) }) : null
      ]
    }
  );
}

// src/ui/shell/Composer.tsx





// src/ui/shell/ComposerPicker.tsx





var ROW_INDENT = 3.25;
function ComposerPicker({
  name,
  groups,
  items,
  value,
  onChange,
  multiple = true,
  triggerLabel,
  selectAllLabel,
  deselectAllLabel,
  footer,
  disabled,
  loading,
  menuMinWidth = 260
}) {
  const labels = _nullishCoalesce(_optionalChain([_react.useContext.call(void 0, _chunk66NT7LEDcjs.ChatContext), 'optionalAccess', _20 => _20.labels]), () => ( _chunk66NT7LEDcjs.defaultLabels));
  const [anchor, setAnchor] = _react.useState.call(void 0, null);
  const close = () => setAnchor(null);
  const sections = _nullishCoalesce(groups, () => ( (items ? [{ id: "", items }] : [])));
  const options = sections.flatMap((g) => g.items);
  const selected = new Set(value);
  const count = options.filter((o) => selected.has(o.id)).length;
  const summary = _nullishCoalesce(triggerLabel, () => ( (multiple ? labels.pickerSummary(name, count, options.length) : _nullishCoalesce(_optionalChain([options, 'access', _21 => _21.find, 'call', _22 => _22((o) => selected.has(o.id)), 'optionalAccess', _23 => _23.label]), () => ( name)))));
  const toggle = (id) => onChange(selected.has(id) ? value.filter((v) => v !== id) : [...value, id]);
  const choose = (id) => {
    close();
    if (!selected.has(id) || value.length !== 1) onChange([id]);
  };
  const setGroup = (group, on) => {
    const ids = new Set(group.items.filter((i) => !i.disabled).map((i) => i.id));
    const rest = value.filter((v) => !ids.has(v));
    onChange(on ? [...rest, ...ids] : rest);
  };
  const row = (item, indent) => {
    const on = selected.has(item.id);
    const rowSx = indent ? { pl: ROW_INDENT } : void 0;
    const content = /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
      item.icon ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { component: "span", "aria-hidden": true, sx: { display: "inline-flex", mr: 1 }, children: item.icon }) : null,
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Box, { component: "span", sx: { flex: 1, minWidth: 0 }, children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { component: "span", sx: { display: "block" }, children: item.label }),
        item.description ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _atoms.Typography,
          {
            variant: "caption",
            component: "span",
            sx: (t) => ({ display: "block", whiteSpace: "normal", ..._chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.b3 }) }),
            children: item.description
          }
        ) : null
      ] })
    ] });
    return multiple ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
      _atoms.MenuItem,
      {
        role: "menuitemcheckbox",
        "aria-checked": on,
        disabled: item.disabled,
        onClick: () => toggle(item.id),
        sx: rowSx,
        children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Checkbox, { size: "sm", checked: on, tabIndex: -1, "aria-hidden": true, sx: { p: 0, mr: 1.25 } }),
          content
        ]
      },
      item.id
    ) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      _atoms.MenuItem,
      {
        role: "menuitemradio",
        "aria-checked": on,
        selected: on,
        disabled: item.disabled,
        onClick: () => choose(item.id),
        sx: rowSx,
        children: content
      },
      item.id
    );
  };
  const children = [];
  sections.forEach((group, index) => {
    if (index > 0) {
      children.push(
        group.label ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { role: "presentation", sx: { height: 8 } }, `d:${group.id}`) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Divider, { sx: { my: 0.5 } }, `d:${group.id}`)
      );
    }
    if (multiple && group.selectAll) {
      const enabled = group.items.filter((i) => !i.disabled);
      const all = enabled.length > 0 && enabled.every((i) => selected.has(i.id));
      const action = all ? _nullishCoalesce(deselectAllLabel, () => ( labels.pickerDeselectAll)) : _nullishCoalesce(selectAllLabel, () => ( labels.pickerSelectAll));
      children.push(
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
          _atoms.MenuItem,
          {
            variant: "secondary",
            disabled: enabled.length === 0,
            "aria-label": typeof group.label === "string" ? `${group.label}: ${action}` : action,
            onClick: () => setGroup(group, !all),
            children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                _atoms.Typography,
                {
                  variant: "body2",
                  weight: "medium",
                  component: "span",
                  sx: (t) => ({ flex: 1, ..._chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.b1 }) }),
                  children: group.label
                }
              ),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                _atoms.Typography,
                {
                  variant: "body2",
                  component: "span",
                  sx: (t) => ({ ml: 2, ..._chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.primary[3] }) }),
                  children: action
                }
              )
            ]
          },
          `h:${group.id}`
        )
      );
    } else if (group.label) {
      children.push(
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _atoms.Typography,
          {
            role: "presentation",
            variant: "body2",
            weight: "medium",
            component: "div",
            sx: (t) => ({ px: 1.25, py: 0.75, ..._chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.b1 }) }),
            children: group.label
          },
          `h:${group.id}`
        )
      );
    }
    const indent = Boolean(group.label);
    children.push(...group.items.map((item) => row(item, indent)));
  });
  const footerContent = typeof footer === "function" ? footer(close) : footer;
  if (footerContent) {
    children.push(/* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Divider, { sx: { my: 0.5 } }, "footer-rule"));
    children.push(/* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { children: footerContent }, "footer"));
  }
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      _atoms.Chip,
      {
        dense: true,
        variant: "secondary",
        appearance: "outline",
        icon: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.CaretDownIcon, { size: 14 }),
        label: summary,
        "aria-haspopup": "menu",
        "aria-expanded": Boolean(anchor),
        "aria-label": typeof summary === "string" ? `${name}: ${summary}` : name,
        "aria-busy": loading || void 0,
        disabled: disabled || loading || options.length === 0,
        onClick: (e) => setAnchor(e.currentTarget),
        sx: { flexShrink: 0, borderRadius: `${_tokens.radius.full}px`, "& .MuiChip-icon": { fontSize: 14, width: 14, height: 14 } }
      }
    ),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      _atoms.Menu,
      {
        anchorEl: anchor,
        open: Boolean(anchor),
        onClose: close,
        variant: "menu",
        anchorOrigin: { vertical: "top", horizontal: "left" },
        transformOrigin: { vertical: "bottom", horizontal: "left" },
        sx: { "& .MuiMenu-paper": { minWidth: menuMinWidth, maxHeight: 420, mt: -1 } },
        children
      }
    )
  ] });
}

// src/ui/shell/Composer.tsx

function typeLabel(name, contentType) {
  const ext = name.includes(".") ? name.split(".").pop().toUpperCase() : "";
  if (ext && ext.length <= 5) return ext;
  if (_optionalChain([contentType, 'optionalAccess', _24 => _24.includes, 'call', _25 => _25("/")])) return contentType.split("/")[1].toUpperCase();
  return "File";
}
function FileCard({ name, size, contentType, status = "ready", progress, error, onRemove }) {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const detail = status === "uploading" ? labels.uploading : status === "error" ? _nullishCoalesce(error, () => ( labels.uploadFailed)) : [typeLabel(name, contentType), size !== void 0 ? _chunk2SSFULSQcjs.formatBytes.call(void 0, size) : ""].filter(Boolean).join(" \xB7 ");
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Card, { component: "article", "aria-label": name, sx: { width: 268, maxWidth: "100%" }, children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Stack, { direction: "row", spacing: 1.25, sx: { alignItems: "center", px: 1.5, py: 1.25 }, children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { "aria-hidden": true, sx: (t) => ({ display: "inline-flex", ..._chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.icon.default.b2 }) }), children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.FileIcon, { size: 20 }) }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Box, { sx: { flex: 1, minWidth: 0 }, children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "body1", weight: "medium", noWrap: true, component: "div", children: name }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _atoms.Typography,
          {
            variant: "body2",
            noWrap: true,
            component: "div",
            sx: (t) => _chunkD7SVFE66cjs.mode.call(void 0, t, { color: status === "error" ? _tokens.text.error[3] : _tokens.text.default.b3 }),
            children: detail
          }
        )
      ] }),
      onRemove ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        _atoms.IconButton,
        {
          size: "sm",
          variant: "secondary",
          appearance: "text",
          "aria-label": labels.removeAttachment(name),
          onClick: onRemove,
          children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.XIcon, {})
        }
      ) : null
    ] }),
    status === "uploading" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.LinearProgress, { variant: progress ? "determinate" : "indeterminate", value: (_nullishCoalesce(progress, () => ( 0))) * 100 }) : null
  ] });
}
function AttachmentCard({ attachment }) {
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, FileCard, { name: attachment.filename, size: attachment.size, contentType: attachment.content_type });
}
function AttachmentChip({ attachment, onRemove }) {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const icon = attachment.status === "uploading" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.CircularProgress, { size: 12 }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.FileTextIcon, {});
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    _atoms.Tooltip,
    {
      title: attachment.status === "error" ? _nullishCoalesce(attachment.error, () => ( labels.uploadFailed)) : `${attachment.name} \xB7 ${_chunk2SSFULSQcjs.formatBytes.call(void 0, attachment.size)}`,
      children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        _atoms.Chip,
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
var SCOPE_SEP = "";
function ScopePicker() {
  const scope = _chunk66NT7LEDcjs.useScope.call(void 0, );
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  if (!scope.enabled) return null;
  const { selected, allSelected } = scope.summary;
  const summary = scope.status !== "ready" || allSelected ? labels.scopeAll : selected === 0 ? labels.scopeNone : labels.scopeSome(selected);
  const value = Object.entries(scope.selection).flatMap(([groupId, ids]) => ids.map((id) => groupId + SCOPE_SEP + id));
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    ComposerPicker,
    {
      name: labels.scopeLabel,
      triggerLabel: summary,
      selectAllLabel: labels.scopeSelectAll,
      deselectAllLabel: labels.scopeDeselectAll,
      loading: scope.status === "loading",
      groups: scope.groups.map((g) => ({
        id: g.id,
        label: g.label,
        selectAll: true,
        items: g.items.map((item) => ({ id: g.id + SCOPE_SEP + item.id, label: item.label }))
      })),
      value,
      onChange: (next) => {
        const selection = Object.fromEntries(scope.groups.map((g) => [g.id, []]));
        for (const key of next) {
          const [groupId, id] = key.split(SCOPE_SEP);
          (selection[groupId] ??= []).push(id);
        }
        scope.setSelection(selection);
      }
    }
  );
}
function TooLongNotice() {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const { tooLong, maxChars } = _chunk66NT7LEDcjs.useComposer.call(void 0, );
  if (!tooLong || !maxChars) return null;
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { role: "alert", variant: "body2", sx: (t) => _chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.error[3] }), children: labels.messageTooLong(maxChars) });
}
function RejectedNotice() {
  const [message, setMessage] = _react.useState.call(void 0, null);
  _chunk66NT7LEDcjs.useChatEvent.call(void 0, "warning", (w) => {
    if (w.code === "attachment_rejected") setMessage(w.message);
  });
  _react.useEffect.call(void 0, () => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 5e3);
    return () => clearTimeout(t);
  }, [message]);
  if (!message) return null;
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { role: "alert", variant: "body2", sx: (t) => _chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.error[3] }), children: message });
}
function ComposerControls({ leadingActions, extraActions, scopePicker }) {
  const c = _chunk66NT7LEDcjs.useComposerContext.call(void 0, );
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Stack, { direction: "row", spacing: 1, sx: { alignItems: "center" }, children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunk66NT7LEDcjs.Composer.AttachmentInput, { asChild: true, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.IconButton, { size: "sm", variant: "secondary", appearance: "text", "aria-label": labels.attach, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.PaperclipIcon, {}) }) }),
    scopePicker === void 0 ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ScopePicker, {}) : scopePicker || null,
    leadingActions,
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { sx: { flex: 1 } }),
    extraActions,
    c.busy ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunk66NT7LEDcjs.Composer.Cancel, { asChild: true, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.IconButton, { size: "sm", variant: "secondary", "aria-label": labels.stop, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.StopIcon, { weight: "fill" }) }) }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunk66NT7LEDcjs.Composer.Send, { asChild: true, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.IconButton, { size: "sm", "aria-label": labels.send, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.PaperPlaneTiltIcon, {}) }) })
  ] });
}
function ComposerAttachmentRow() {
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunk66NT7LEDcjs.Composer.Attachments, { children: (a, remove) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, AttachmentChip, { attachment: a, onRemove: remove }, a.id) });
}
function ChatComposer({
  placeholder,
  leadingActions,
  extraActions,
  scopePicker,
  footer,
  maxRows = 8,
  autoFocus
}) {
  const [dragging, setDragging] = _react.useState.call(void 0, false);
  const hintId = _react.useId.call(void 0, );
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Box, { children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunk66NT7LEDcjs.Composer.Root, { asChild: true, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, DropZone, { onDragChange: setDragging, children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
      _atoms.Box,
      {
        sx: (t) => ({
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
          px: 2,
          pt: 1.75,
          pb: 1.5,
          borderRadius: `${_tokens.radius.lg}px`,
          border: "1px solid",
          transition: "border-color 120ms ease, box-shadow 120ms ease",
          ..._chunkD7SVFE66cjs.mode.call(void 0, t, {
            backgroundColor: _tokens.surface.layers.card1,
            borderColor: dragging ? _tokens.border.primary.focus : _tokens.border.layers.card2
          }),
          boxShadow: _tokens.elevation.small,
          "&:focus-within": _chunkD7SVFE66cjs.mode.call(void 0, t, { borderColor: _tokens.border.primary.focus }),
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
            fontWeight: _tokens.fontWeights.regular,
            ..._chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.heading })
          },
          "& textarea::placeholder": { opacity: 1, ..._chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.b3 }) },
          "& textarea:disabled": { cursor: "not-allowed" }
        }),
        children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Stack, { direction: "row", sx: { flexWrap: "wrap", gap: 0.75, "&:empty": { display: "none" } }, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ComposerAttachmentRow, {}) }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunk66NT7LEDcjs.Composer.Input, { placeholder, maxRows, autoFocus, "aria-describedby": hintId }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ComposerControls, { leadingActions, extraActions, scopePicker })
        ]
      }
    ) }) }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Box, { id: hintId, sx: { mt: 0.75, display: "flex", flexDirection: "column", gap: 0.5, alignItems: "center" }, children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, RejectedNotice, {}),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TooLongNotice, {}),
      footer
    ] })
  ] });
}
var DropZone = _react.forwardRef.call(void 0, function DropZone2({ children, onDragChange, ...props }, ref) {
  const c = _chunk66NT7LEDcjs.useComposerContext.call(void 0, );
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    _atoms.Box,
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





// src/ui/shell/Turn.tsx





var BUSY2 = /* @__PURE__ */ new Set(["submitting", "streaming", "cancelling"]);
function UserTurn({ message }) {
  const body = _chunk66NT7LEDcjs.messageText.call(void 0, message);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunk66NT7LEDcjs.Message.Root, { asChild: true, children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Box, { sx: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }, children: [
    _optionalChain([message, 'access', _26 => _26.attachments, 'optionalAccess', _27 => _27.length]) ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Stack, { direction: "row", sx: { flexWrap: "wrap", gap: 1, justifyContent: "flex-end" }, children: message.attachments.map((a, i) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, AttachmentCard, { attachment: a }, `${a.url}:${i}`)) }) : null,
    body ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      _atoms.Box,
      {
        sx: (t) => ({
          maxWidth: "min(80%, 560px)",
          px: 2,
          py: 1.5,
          borderRadius: `${_tokens.radius.lg}px`,
          border: "1px solid",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          ..._chunkD7SVFE66cjs.mode.call(void 0, t, {
            backgroundColor: _tokens.surface.layers.card2,
            borderColor: _tokens.border.layers.card1,
            color: _tokens.text.default.heading
          })
        }),
        children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "h6", weight: "regular", component: "div", children: body })
      }
    ) : null
  ] }) });
}
function blockText(block, registry) {
  const def = registry.resolve(block.data);
  if (!_optionalChain([def, 'optionalAccess', _28 => _28.toText])) return void 0;
  try {
    return def.toText(def.parse ? def.parse(block.data, block) : block.data, block);
  } catch (e5) {
    return void 0;
  }
}
function CopyButton({ message }) {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const { registry } = _chunk66NT7LEDcjs.useChatContext.call(void 0, );
  const [copied, setCopied] = _react.useState.call(void 0, false);
  const value = _chunk66NT7LEDcjs.messageText.call(void 0, message, (b) => blockText(b, registry));
  if (!value || typeof navigator === "undefined" || !navigator.clipboard) return null;
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Tooltip, { title: copied ? labels.copied : labels.copy, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    _atoms.IconButton,
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
      children: copied ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.CheckIcon, {}) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.CopyIcon, {})
    }
  ) });
}
function AssistantTurn({ message }) {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const waiting = message.status === "streaming" && message.blocks.length === 0;
  const failed = message.status === "interrupted" || message.status === "error" && message.error;
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunk66NT7LEDcjs.Message.Root, { asChild: true, children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    _atoms.Box,
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
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunk66NT7LEDcjs.MessageBlocks, {}),
        waiting ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Shimmer, { children: labels.thinkingLive }) : null,
        failed && message.error ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          TurnErrorNotice,
          {
            error: message.error,
            title: message.status === "interrupted" ? labels.interrupted : message.error.message,
            message: message.status === "interrupted" ? message.error.message : void 0
          }
        ) : failed ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ErrorNotice, { title: labels.interrupted }) : null,
        message.status === "cancelled" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "body2", sx: (t) => _chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.b3 }), children: labels.stopped }) : null,
        message.status !== "streaming" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Stack, { direction: "row", spacing: 0.5, className: "acu-turn-actions", sx: { ml: -0.75 }, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, CopyButton, { message }) }) : null
      ]
    }
  ) });
}
function RunStatus() {
  const label = _chunk66NT7LEDcjs.useThread.call(void 0, (s) => BUSY2.has(s.run.status) ? s.run.statusLabel : void 0);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { "aria-live": "polite", "aria-atomic": "true", sx: { minHeight: 0 }, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Fade, { in: Boolean(label), unmountOnExit: true, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { sx: { display: "inline-flex" }, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Chip, { dense: true, appearance: "outline", variant: "secondary", icon: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, PulseDot, {}), label: _nullishCoalesce(label, () => ( "")) }) }) }) });
}
function PendingTurn() {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const state = _chunk66NT7LEDcjs.useThread.call(void 0, 
    (s) => {
      const last = s.messages[s.messages.length - 1];
      const awaitingReply = _optionalChain([last, 'optionalAccess', _29 => _29.role]) === "user" || !last;
      return {
        submitting: s.run.status === "submitting" && awaitingReply,
        failedBeforeReply: s.run.status === "error" && _optionalChain([last, 'optionalAccess', _30 => _30.role]) === "user" ? s.run.error : void 0
      };
    },
    (a, b) => a.submitting === b.submitting && a.failedBeforeReply === b.failedBeforeReply
  );
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
    state.submitting ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Shimmer, { children: labels.thinkingLive }) : null,
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, RunStatus, {}),
    state.failedBeforeReply ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TurnErrorNotice, { error: state.failedBeforeReply }) : null
  ] });
}
function ChatSuggestions({ prompts }) {
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Stack, { direction: "row", sx: { flexWrap: "wrap", gap: 1, justifyContent: "center" }, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunk66NT7LEDcjs.Suggestions.Root, { prompts, children: (p, i) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunk66NT7LEDcjs.Suggestions.Item, { prompt: p, asChild: true, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Button, { size: "sm", variant: "secondary", appearance: "outline", startIcon: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.LightningIcon, {}), children: p.label }) }, `${p.label}:${i}`) }) });
}
function WelcomeScreen() {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const meta = _chunk66NT7LEDcjs.useThreadMeta.call(void 0, );
  const loading = _chunk66NT7LEDcjs.useThread.call(void 0, (s) => s.loadStatus === "loading");
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Stack, { spacing: 3, sx: { alignItems: "center", textAlign: "center", py: { xs: 6, sm: 10 } }, children: [
    loading ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Skeleton, { variant: "text", width: 280, height: 36 }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "h4", component: "h2", sx: (t) => _chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.heading }), children: meta.greeting || labels.welcomeTitle }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ChatSuggestions, {})
  ] });
}

// src/ui/shell/ChatThread.tsx

function ThreadSkeleton() {
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Stack, { spacing: 3, "aria-hidden": true, children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Skeleton, { variant: "rounded", height: 48, width: "45%", sx: { alignSelf: "flex-end" } }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Stack, { spacing: 1, children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Skeleton, { variant: "text", width: "90%" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Skeleton, { variant: "text", width: "75%" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Skeleton, { variant: "text", width: "60%" })
    ] })
  ] });
}
function FollowOnSend() {
  const { scrollToBottom } = _chunk66NT7LEDcjs.useThreadScroll.call(void 0, );
  const lastUserId = _chunk66NT7LEDcjs.useThread.call(void 0, (s) => {
    const last = s.messages[s.messages.length - 1];
    return _optionalChain([last, 'optionalAccess', _31 => _31.role]) === "user" ? last.id : void 0;
  });
  const prev = _react.useRef.call(void 0, lastUserId);
  _react.useEffect.call(void 0, () => {
    if (lastUserId && lastUserId !== prev.current) scrollToBottom("auto");
    prev.current = lastUserId;
  }, [lastUserId, scrollToBottom]);
  return null;
}
function LoadError() {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const error = _chunk66NT7LEDcjs.useThread.call(void 0, (s) => s.loadError);
  const id = _chunk66NT7LEDcjs.useThread.call(void 0, (s) => s.conversationId);
  const { selectConversation, newConversation } = _chunk66NT7LEDcjs.useChatActions.call(void 0, );
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    ErrorNotice,
    {
      title: labels.loadError,
      message: _optionalChain([error, 'optionalAccess', _32 => _32.message]),
      onRetry: () => void (id ? selectConversation(id) : newConversation().catch(() => void 0))
    }
  );
}
function ChatThread({ components, maxWidth = 760 }) {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const loadStatus = _chunk66NT7LEDcjs.useThread.call(void 0, (s) => s.loadStatus);
  const empty = _chunk66NT7LEDcjs.useThread.call(void 0, (s) => s.messages.length === 0);
  const Welcome = _nullishCoalesce(_optionalChain([components, 'optionalAccess', _33 => _33.Welcome]), () => ( WelcomeScreen));
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunk66NT7LEDcjs.Thread.Root, { asChild: true, children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Box, { sx: { position: "relative", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }, children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, FollowOnSend, {}),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunk66NT7LEDcjs.Thread.Viewport, { style: { flex: 1, minHeight: 0 }, children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Box, { sx: { maxWidth, mx: "auto", px: 2, pt: 3, pb: 2, display: "flex", flexDirection: "column", gap: 3 }, children: [
      loadStatus === "loading" && empty ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ThreadSkeleton, {}) : null,
      loadStatus === "error" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, LoadError, {}) : null,
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunk66NT7LEDcjs.Thread.Empty, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Welcome, {}) }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        _chunk66NT7LEDcjs.Thread.Messages,
        {
          components: {
            UserMessage: _nullishCoalesce(_optionalChain([components, 'optionalAccess', _34 => _34.UserTurn]), () => ( UserTurn)),
            AssistantMessage: _nullishCoalesce(_optionalChain([components, 'optionalAccess', _35 => _35.AssistantTurn]), () => ( AssistantTurn))
          }
        }
      ),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, PendingTurn, {})
    ] }) }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunk66NT7LEDcjs.Thread.ScrollToBottom, { asChild: true, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      _atoms.IconButton,
      {
        size: "sm",
        variant: "secondary",
        appearance: "outline",
        "aria-label": labels.jumpToLatest,
        sx: { position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", boxShadow: _tokens.elevation.medium },
        children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.ArrowDownIcon, {})
      }
    ) })
  ] }) });
}

// src/ui/shell/AgenticChat.tsx

function ChatHeader({ title, actions, historyOpen, onToggleHistory }) {
  const labels = _chunk66NT7LEDcjs.useLabels.call(void 0, );
  const meta = _chunk66NT7LEDcjs.useThreadMeta.call(void 0, );
  const { newConversation } = _chunk66NT7LEDcjs.useChatActions.call(void 0, );
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    _atoms.Stack,
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
        ..._chunkD7SVFE66cjs.mode.call(void 0, t, { borderColor: _tokens.border.layers.card1 })
      }),
      children: [
        onToggleHistory ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Tooltip, { title: historyOpen ? labels.closeHistory : labels.openHistory, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _atoms.IconButton,
          {
            size: "sm",
            variant: "secondary",
            appearance: "text",
            "aria-label": historyOpen ? labels.closeHistory : labels.openHistory,
            "aria-expanded": historyOpen,
            onClick: onToggleHistory,
            children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.SidebarSimpleIcon, {})
          }
        ) }) : null,
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Box, { sx: { flex: 1, minWidth: 0 }, children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _atoms.Typography,
            {
              variant: "body1",
              weight: "medium",
              component: "h1",
              noWrap: true,
              sx: (t) => ({ m: 0, ..._chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.heading }) }),
              children: _nullishCoalesce(title, () => ( meta.title))
            }
          ),
          meta.subtitle ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Typography, { variant: "body2", component: "div", noWrap: true, sx: (t) => _chunkD7SVFE66cjs.mode.call(void 0, t, { color: _tokens.text.default.b3 }), children: meta.subtitle }) : null
        ] }),
        actions,
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Tooltip, { title: labels.newChat, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _atoms.IconButton,
          {
            size: "sm",
            variant: "secondary",
            appearance: "text",
            "aria-label": labels.newChat,
            onClick: () => void newConversation().catch(() => void 0),
            children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _icons.NotePencilIcon, {})
          }
        ) })
      ]
    }
  );
}
var warnedTheme = false;
function checkTheme(theme) {
  if (warnedTheme) return;
  if (_chunk66NT7LEDcjs.isDev.call(void 0, ) && !theme.vars) {
    warnedTheme = true;
    console.warn(
      "[agentic-chat] Wrap your app in <NeofloThemeProvider> from @neofloai/atoms; the chat renders with the wrong theme without it."
    );
  }
}
function useContainerWidth() {
  const ref = _react.useRef.call(void 0, null);
  const [width, setWidth] = _react.useState.call(void 0, null);
  _chunk66NT7LEDcjs.useIsomorphicLayoutEffect.call(void 0, () => {
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
  const [wideOpen, setWideOpen] = _chunk66NT7LEDcjs.usePreference.call(void 0, "historyOpen", defaultHistoryOpen);
  const [overlayOpen, setOverlayOpen] = _react.useState.call(void 0, false);
  const historyOpen = history && (compact ? overlayOpen : wideOpen);
  const toggleHistory = () => compact ? setOverlayOpen((o) => !o) : setWideOpen(!wideOpen);
  const Header = _nullishCoalesce(_optionalChain([components, 'optionalAccess', _36 => _36.Header]), () => ( ChatHeader));
  const History = _nullishCoalesce(_optionalChain([components, 'optionalAccess', _37 => _37.History]), () => ( ChatHistory));
  const ComposerSlot = _nullishCoalesce(_optionalChain([components, 'optionalAccess', _38 => _38.Composer]), () => ( ChatComposer));
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    _atoms.Box,
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
            ..._chunkD7SVFE66cjs.mode.call(void 0, t, { backgroundColor: _tokens.surface.layers.page, color: _tokens.text.default.b1 })
          };
        },
        ...Array.isArray(sx) ? sx : sx ? [sx] : []
      ],
      children: [
        historyOpen ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _atoms.Box,
          {
            sx: (t) => ({
              width: compact ? "min(320px, 85%)" : 280,
              flexShrink: 0,
              borderRight: "1px solid",
              ..._chunkD7SVFE66cjs.mode.call(void 0, t, { borderColor: _tokens.border.layers.card1, backgroundColor: _tokens.surface.layers.card1 }),
              ...compact ? { position: "absolute", top: 0, bottom: 0, left: 0, zIndex: 2, boxShadow: _tokens.elevation.large } : {}
            }),
            children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, History, { onSelect: compact ? () => setOverlayOpen(false) : void 0 })
          }
        ) : null,
        compact && historyOpen ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { "aria-hidden": true, onClick: () => setOverlayOpen(false), sx: { position: "absolute", inset: 0, zIndex: 1 } }) : null,
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _atoms.Box, { sx: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }, children: [
          header ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            Header,
            {
              title,
              actions: headerActions,
              historyOpen,
              onToggleHistory: history ? toggleHistory : void 0
            }
          ) : null,
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ChatThread, { components, maxWidth }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { sx: { px: 2, pb: 2, pt: 0.5 }, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _atoms.Box, { sx: { maxWidth, mx: "auto" }, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ComposerSlot, { ...composerProps }) }) })
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
  const allBlocks = _react.useMemo.call(void 0, () => [...defaultBlocks, ..._nullishCoalesce(blocks, () => ( []))], [blocks]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    _chunk66NT7LEDcjs.ChatProvider,
    {
      ...provider,
      blocks: allBlocks,
      fallbackBlock: _nullishCoalesce(fallbackBlock, () => ( unknownBlock)),
      blockErrorFallback: _nullishCoalesce(blockErrorFallback, () => ( (() => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, BlockCrashNotice, {})))),
      children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
















































































































































































exports.AgenticChat = AgenticChat; exports.ApprovalBlock = ApprovalBlock; exports.ArtifactBlock = ArtifactBlock; exports.AssistantTurn = AssistantTurn; exports.AttachmentCard = AttachmentCard; exports.BLOCK_ICON_PX = _chunkD7SVFE66cjs.BLOCK_ICON_PX; exports.BLOCK_TYPES = _chunkE6FMLYAFcjs.BLOCK_TYPES; exports.Block = _chunk66NT7LEDcjs.BlockRenderer; exports.BlockContext = _chunk66NT7LEDcjs.BlockContext; exports.BlockCrashNotice = BlockCrashNotice; exports.BlockErrorBoundary = _chunk66NT7LEDcjs.BlockErrorBoundary; exports.BlockShell = BlockShell; exports.ChatApiError = _chunkZNIBBZSNcjs.ChatApiError; exports.ChatComposer = ChatComposer; exports.ChatContext = _chunk66NT7LEDcjs.ChatContext; exports.ChatError = _chunkZNIBBZSNcjs.ChatError; exports.ChatHeader = ChatHeader; exports.ChatHistory = ChatHistory; exports.ChatProtocolError = _chunkZNIBBZSNcjs.ChatProtocolError; exports.ChatProvider = _chunk66NT7LEDcjs.ChatProvider; exports.ChatStreamError = _chunkZNIBBZSNcjs.ChatStreamError; exports.ChatSuggestions = ChatSuggestions; exports.ChatThread = ChatThread; exports.ChatTimeoutError = _chunkZNIBBZSNcjs.ChatTimeoutError; exports.ChoiceBlock = ChoiceBlock; exports.Composer = _chunk66NT7LEDcjs.Composer; exports.ComposerPicker = ComposerPicker; exports.ConversationList = _chunk66NT7LEDcjs.ConversationList; exports.DEFAULT_REST_PATHS = _chunk5JR2Q366cjs.DEFAULT_REST_PATHS; exports.DataTable = DataTable; exports.ERROR_CODES = _chunk5JR2Q366cjs.ERROR_CODES; exports.ErrorBlock = ErrorBlock; exports.ErrorNotice = ErrorNotice; exports.FileCard = FileCard; exports.Hitl = _chunk66NT7LEDcjs.Hitl; exports.ImageBlock = ImageBlock; exports.KeyValueList = KeyValueList; exports.Markdown = Markdown; exports.Message = _chunk66NT7LEDcjs.Message; exports.MessageBlocks = _chunk66NT7LEDcjs.MessageBlocks; exports.MessageContext = _chunk66NT7LEDcjs.MessageContext; exports.NEW_THREAD_KEY = _chunk2SSFULSQcjs.NEW_THREAD_KEY; exports.PROTOCOL_VERSION = _chunk5JR2Q366cjs.PROTOCOL_VERSION; exports.PendingTurn = PendingTurn; exports.PlanBlock = PlanBlock; exports.PulseDot = PulseDot; exports.RetryButton = RetryButton; exports.RunStatus = RunStatus; exports.STANDARD_REVISION = _chunk5JR2Q366cjs.STANDARD_REVISION; exports.ScopePicker = ScopePicker; exports.Shimmer = Shimmer; exports.SourcesBlock = SourcesBlock; exports.SseParser = _chunk5JR2Q366cjs.SseParser; exports.Suggestions = _chunk66NT7LEDcjs.Suggestions; exports.TOOL_CALL_TYPES = _chunk2SSFULSQcjs.TOOL_CALL_TYPES; exports.TableBlock = TableBlock; exports.TextBlock = TextBlock; exports.ThinkingBlock = ThinkingBlock; exports.Thread = _chunk66NT7LEDcjs.Thread; exports.ThreadContext = _chunk66NT7LEDcjs.ThreadContext; exports.ThreadProvider = _chunk66NT7LEDcjs.ThreadProvider; exports.ToolBlock = ToolBlock; exports.TurnErrorNotice = TurnErrorNotice; exports.UnknownBlock = UnknownBlock; exports.UserTurn = UserTurn; exports.WelcomeScreen = WelcomeScreen; exports.applyPlanDelta = _chunkE6FMLYAFcjs.applyPlanDelta; exports.approvalBlock = approvalBlock; exports.artifactBlock = artifactBlock; exports.choiceBlock = choiceBlock; exports.createBlockRegistry = _chunkE6FMLYAFcjs.createBlockRegistry; exports.createChatRuntime = _chunk2SSFULSQcjs.createChatRuntime; exports.createMemoryStorage = _chunk2SSFULSQcjs.createMemoryStorage; exports.createPersister = _chunk2SSFULSQcjs.createPersister; exports.createRestAdapter = _chunk5JR2Q366cjs.createRestAdapter; exports.createSafeStorage = _chunk2SSFULSQcjs.createSafeStorage; exports.createStore = _chunk2SSFULSQcjs.createStore; exports.createThreadState = _chunk2SSFULSQcjs.createThreadState; exports.createWebStorage = _chunk2SSFULSQcjs.createWebStorage; exports.defaultApplyDelta = _chunk2SSFULSQcjs.defaultApplyDelta; exports.defaultBlocks = defaultBlocks; exports.defaultLabels = _chunk66NT7LEDcjs.defaultLabels; exports.defaultScopeToRequest = _chunk2SSFULSQcjs.defaultScopeToRequest; exports.defineBlock = _chunkE6FMLYAFcjs.defineBlock; exports.emptyMeta = _chunk2SSFULSQcjs.emptyMeta; exports.errorBlock = errorBlock; exports.errorInfoFromCode = _chunk2SSFULSQcjs.errorInfoFromCode; exports.filterConversations = _chunk2SSFULSQcjs.filterConversations; exports.formatBytes = _chunk2SSFULSQcjs.formatBytes; exports.formatDuration = formatDuration; exports.formatJsonish = _chunkE6FMLYAFcjs.formatJsonish; exports.formatValue = _chunkE6FMLYAFcjs.formatValue; exports.frameScheduler = _chunk2SSFULSQcjs.frameScheduler; exports.groupConversations = _chunk2SSFULSQcjs.groupConversations; exports.groupKeyFor = _chunk2SSFULSQcjs.groupKeyFor; exports.humanizeKey = _chunkE6FMLYAFcjs.humanizeKey; exports.imageBlock = imageBlock; exports.interruptRun = _chunk2SSFULSQcjs.interruptRun; exports.isAbortError = _chunkZNIBBZSNcjs.isAbortError; exports.isContentBlock = _chunk5JR2Q366cjs.isContentBlock; exports.knownSources = _chunkR7CUDWRTcjs.knownSources; exports.linkToolResults = _chunk2SSFULSQcjs.linkToolResults; exports.mergeWorkflowContexts = _chunk2SSFULSQcjs.mergeWorkflowContexts; exports.messageText = _chunk66NT7LEDcjs.messageText; exports.metaFromBootstrap = _chunk2SSFULSQcjs.metaFromBootstrap; exports.mode = _chunkD7SVFE66cjs.mode; exports.monoFont = _chunkD7SVFE66cjs.monoFont; exports.normalizeConfig = _chunkR7CUDWRTcjs.normalizeConfig; exports.normalizeConversationDetail = _chunk2SSFULSQcjs.normalizeConversationDetail; exports.normalizeMessages = _chunk2SSFULSQcjs.normalizeMessages; exports.parseApproval = _chunkE6FMLYAFcjs.parseApproval; exports.parseArtifact = _chunkE6FMLYAFcjs.parseArtifact; exports.parseChart = _chunkE6FMLYAFcjs.parseChart; exports.parseChoice = _chunkE6FMLYAFcjs.parseChoice; exports.parseError = _chunkE6FMLYAFcjs.parseError; exports.parseFallback = _chunkE6FMLYAFcjs.parseFallback; exports.parseImage = _chunkE6FMLYAFcjs.parseImage; exports.parsePlan = _chunkE6FMLYAFcjs.parsePlan; exports.parseSources = _chunkE6FMLYAFcjs.parseSources; exports.parseStreamEvent = _chunk5JR2Q366cjs.parseStreamEvent; exports.parseTable = _chunkE6FMLYAFcjs.parseTable; exports.parseText = _chunkE6FMLYAFcjs.parseText; exports.parseThinking = _chunkE6FMLYAFcjs.parseThinking; exports.parseToolCall = _chunkE6FMLYAFcjs.parseToolCall; exports.planBlock = planBlock; exports.readErrorEnvelope = _chunkZNIBBZSNcjs.readErrorEnvelope; exports.readSse = _chunk5JR2Q366cjs.readSse; exports.reduceStreamEvent = _chunk2SSFULSQcjs.reduceStreamEvent; exports.resolveCapabilities = _chunkR7CUDWRTcjs.resolveCapabilities; exports.safeUrl = safeUrl; exports.scopeGroupsFromWorkflows = _chunkR7CUDWRTcjs.scopeGroupsFromWorkflows; exports.selectAll = _chunk2SSFULSQcjs.selectAll; exports.selectedModelOf = _chunk2SSFULSQcjs.selectedModelOf; exports.shallowEqual = _chunk66NT7LEDcjs.shallowEqual; exports.sortConversations = _chunk2SSFULSQcjs.sortConversations; exports.sourcesBlock = sourcesBlock; exports.stripCredentials = _chunkR7CUDWRTcjs.stripCredentials; exports.summarizeScope = _chunk2SSFULSQcjs.summarizeScope; exports.syncScheduler = _chunk2SSFULSQcjs.syncScheduler; exports.tableBlock = tableBlock; exports.textBlock = textBlock; exports.textFieldOf = _chunk2SSFULSQcjs.textFieldOf; exports.thinkingBlock = thinkingBlock; exports.toConversationItem = _chunk2SSFULSQcjs.toConversationItem; exports.toErrorInfo = _chunk2SSFULSQcjs.toErrorInfo; exports.toolCallBlock = toolCallBlock; exports.unknownBlock = unknownBlock; exports.useActiveConversationId = _chunk66NT7LEDcjs.useActiveConversationId; exports.useBlock = _chunk66NT7LEDcjs.useBlock; exports.useBlockActions = _chunk66NT7LEDcjs.useBlockActions; exports.useCanRetry = useCanRetry; exports.useCapabilities = _chunk66NT7LEDcjs.useCapabilities; exports.useChatActions = _chunk66NT7LEDcjs.useChatActions; exports.useChatConfig = _chunk66NT7LEDcjs.useChatConfig; exports.useChatContext = _chunk66NT7LEDcjs.useChatContext; exports.useChatEvent = _chunk66NT7LEDcjs.useChatEvent; exports.useChatRuntime = _chunk66NT7LEDcjs.useChatRuntime; exports.useComposer = _chunk66NT7LEDcjs.useComposer; exports.useComposerContext = _chunk66NT7LEDcjs.useComposerContext; exports.useConversations = _chunk66NT7LEDcjs.useConversations; exports.useHitl = _chunk66NT7LEDcjs.useHitl; exports.useHitlChoice = _chunk66NT7LEDcjs.useHitlChoice; exports.useIsBusy = _chunk66NT7LEDcjs.useIsBusy; exports.useLabels = _chunk66NT7LEDcjs.useLabels; exports.useMessage = _chunk66NT7LEDcjs.useMessage; exports.useMessages = _chunk66NT7LEDcjs.useMessages; exports.usePreference = _chunk66NT7LEDcjs.usePreference; exports.useRun = _chunk66NT7LEDcjs.useRun; exports.useScope = _chunk66NT7LEDcjs.useScope; exports.useSourceLabel = _chunk66NT7LEDcjs.useSourceLabel; exports.useStoreSelector = _chunk66NT7LEDcjs.useStoreSelector; exports.useThread = _chunk66NT7LEDcjs.useThread; exports.useThreadHandle = _chunk66NT7LEDcjs.useThreadHandle; exports.useThreadMeta = _chunk66NT7LEDcjs.useThreadMeta; exports.useThreadScroll = _chunk66NT7LEDcjs.useThreadScroll;
//# sourceMappingURL=index.cjs.map