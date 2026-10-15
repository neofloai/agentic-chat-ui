"use client";

// src/ui/kit/tokens.ts
import { fontFamilies } from "@neofloai/atoms/tokens";
var isModeToken = (v) => typeof v === "object" && v !== null && "light" in v && "dark" in v;
function mode(theme, styles) {
  const light = {};
  const dark = {};
  for (const [key, value] of Object.entries(styles)) {
    if (value === void 0) continue;
    if (isModeToken(value)) {
      light[key] = value.light;
      dark[key] = value.dark;
    } else {
      light[key] = value;
    }
  }
  return Object.keys(dark).length ? { ...light, ...theme.applyStyles("dark", dark) } : light;
}
var monoFont = fontFamilies.product.mono;
var BLOCK_ICON_PX = 18;

export {
  mode,
  monoFont,
  BLOCK_ICON_PX
};
//# sourceMappingURL=chunk-MSRCL6UC.js.map