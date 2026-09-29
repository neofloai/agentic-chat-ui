import { Box, IconButton, Navbar, NeofloLogo, Tab, Tabs, Tooltip, Typography, useColorScheme } from '@neofloai/atoms';
import { GithubLogoIcon, MoonIcon, SunIcon } from '@neofloai/atoms/icons';
import { lazy, Suspense, useEffect, useState } from 'react';
import { ChatPage } from './ChatPage';

const GalleryPage = lazy(() => import('./GalleryPage').then((m) => ({ default: m.GalleryPage })));

type Route = 'chat' | 'gallery';

function useHashRoute(): [Route, (r: Route) => void] {
  const read = (): Route => (window.location.hash.replace(/^#\/?/, '') === 'gallery' ? 'gallery' : 'chat');
  const [route, setRoute] = useState<Route>(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return [route, (r) => (window.location.hash = `#/${r}`)];
}

function SchemeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  if (!mode) return <IconButton aria-label="Colour scheme" sx={{ visibility: 'hidden' }} />;
  const dark = (mode === 'system' ? systemMode : mode) === 'dark';
  return (
    <Tooltip title={dark ? 'Switch to light' : 'Switch to dark'}>
      <IconButton
        variant="secondary"
        appearance="text"
        size="sm"
        aria-label={dark ? 'Switch to light' : 'Switch to dark'}
        onClick={() => setMode(dark ? 'light' : 'dark')}
      >
        {dark ? <SunIcon /> : <MoonIcon />}
      </IconButton>
    </Tooltip>
  );
}

export function App() {
  const [route, go] = useHashRoute();
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Navbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <NeofloLogo size={22} />
          <Typography variant="body1" weight="medium" component="span">
            Agentic Chat
          </Typography>
          <Typography variant="caption" component="span" color="text.secondary">
            v{__VERSION__} · {__COMMIT__}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Tabs value={route} onChange={(_, v: Route) => go(v)} divider={false} aria-label="Playground sections">
            <Tab value="chat" label="Chat" />
            <Tab value="gallery" label="Gallery" />
          </Tabs>
        </Box>
        <SchemeToggle />
        <Tooltip title="Source on GitHub">
          <IconButton
            variant="secondary"
            appearance="text"
            size="sm"
            aria-label="Source on GitHub"
            onClick={() => window.open('https://github.com/neofloai/agentic-chat-ui', '_blank', 'noopener,noreferrer')}
          >
            <GithubLogoIcon />
          </IconButton>
        </Tooltip>
      </Navbar>
      <Box component="main" sx={{ flex: 1, minHeight: 0 }}>
        {route === 'chat' ? (
          <ChatPage />
        ) : (
          <Suspense fallback={null}>
            <GalleryPage />
          </Suspense>
        )}
      </Box>
    </Box>
  );
}
