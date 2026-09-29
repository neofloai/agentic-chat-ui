/// <reference types="vite/client" />

declare const __PAGES__: boolean;
declare const __VERSION__: string;
declare const __COMMIT__: string;

interface ImportMetaEnv {
  readonly VITE_CHAT_BASE_URL?: string;
  readonly VITE_CHAT_TOKEN?: string;
}
