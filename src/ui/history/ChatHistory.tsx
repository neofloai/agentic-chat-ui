import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@neofloai/atoms';
import {
  ArchiveIcon,
  ArrowUUpLeftIcon,
  DotsThreeIcon,
  MagnifyingGlassIcon,
  NotePencilIcon,
  PencilSimpleIcon,
  TrashIcon,
} from '@neofloai/atoms/icons';
import { border, text } from '@neofloai/atoms/tokens';
import { useId, useState } from 'react';
import type { ConversationGroupKey, ConversationItem } from '../../core/store/types';
import { useChatActions, useConversations, useLabels } from '../../react/hooks';
import type { ChatLabels } from '../../react/labels';
import { mode, type AtomsTheme } from '../kit/tokens';

const GROUP_LABEL: Record<ConversationGroupKey, keyof ChatLabels> = {
  today: 'groupToday',
  yesterday: 'groupYesterday',
  previous7: 'groupPrevious7',
  previous30: 'groupPrevious30',
  older: 'groupOlder',
};

const visuallyHidden = {
  position: 'absolute',
  width: 1,
  height: 1,
  p: 0,
  m: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;

function RenameDialog({ item, onClose }: { item: ConversationItem; onClose: () => void }) {
  const labels = useLabels();
  const { renameConversation } = useChatActions();
  const [value, setValue] = useState(item.title);
  const [saving, setSaving] = useState(false);
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
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle onClose={onClose} slotProps={{ closeButton: { 'aria-label': labels.close } }}>
        {labels.renameTitle}
      </DialogTitle>
      <DialogContent>
        <Box
          component="form"
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            void submit();
          }}
        >
          <TextField
            autoFocus
            fullWidth
            label={labels.rename}
            value={value}
            maxLength={200}
            onChange={(e) => setValue(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button appearance="text" variant="secondary" size="sm" onClick={onClose}>
          {labels.cancel}
        </Button>
        <Button size="sm" loading={saving} disabled={!value.trim()} onClick={() => void submit()}>
          {labels.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteDialog({ item, onClose }: { item: ConversationItem; onClose: () => void }) {
  const labels = useLabels();
  const { deleteConversation } = useChatActions();
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open onClose={onClose} role="alertdialog" maxWidth="xs">
      <DialogTitle subtitle={item.title} onClose={onClose} slotProps={{ closeButton: { 'aria-label': labels.close } }}>
        {labels.deleteTitle}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{labels.deleteBody}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button appearance="text" variant="secondary" size="sm" onClick={onClose}>
          {labels.cancel}
        </Button>
        <Button
          variant="error"
          size="sm"
          loading={busy}
          onClick={() => {
            setBusy(true);
            deleteConversation(item.id).then(onClose, () => setBusy(false));
          }}
        >
          {labels.delete}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export interface ChatHistoryProps {
  /** Called after a conversation is picked (e.g. to close an overlay on small screens). */
  onSelect?: (conversationId: string) => void;
  /** Show the New chat button at the top. @default true */
  showNewChat?: boolean;
}

/** The conversation list: search, recency groups, rename/archive/delete, archived toggle. */
export function ChatHistory({ onSelect, showNewChat = true }: ChatHistoryProps) {
  const labels = useLabels();
  const history = useConversations();
  const searchId = useId();
  const [menu, setMenu] = useState<{ anchor: HTMLElement; item: ConversationItem } | null>(null);
  const [renaming, setRenaming] = useState<ConversationItem | null>(null);
  const [deleting, setDeleting] = useState<ConversationItem | null>(null);

  const closeMenu = () => setMenu(null);
  const loading = history.status === 'loading' && history.allItems.length === 0;
  const failed = history.status === 'error' && history.allItems.length === 0;

  return (
    <Box
      component="nav"
      aria-label={labels.history}
      sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
    >
      <Stack spacing={1.25} sx={{ p: 1.5 }}>
        {showNewChat ? (
          <Button
            size="sm"
            variant="secondary"
            appearance="outline"
            startIcon={<NotePencilIcon />}
            fullWidth
            onClick={() => void history.create().catch(() => undefined)}
          >
            {labels.newChat}
          </Button>
        ) : null}
        <Box sx={{ position: 'relative' }}>
          <Box component="label" htmlFor={searchId} sx={visuallyHidden}>
            {labels.searchChats}
          </Box>
          <TextField
            id={searchId}
            fullWidth
            type="search"
            placeholder={labels.searchChats}
            value={history.query}
            onChange={(e) => history.setQuery(e.target.value)}
            startAdornment={<MagnifyingGlassIcon size={16} />}
          />
        </Box>
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 0.5, pb: 1 }}>
        {loading ? (
          <Stack spacing={1} sx={{ px: 1 }} aria-hidden>
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} variant="rounded" height={36} />
            ))}
          </Stack>
        ) : null}
        {failed ? (
          <Box sx={{ px: 1 }}>
            <Alert
              severity="error"
              title={labels.historyError}
              action={
                <Button size="sm" variant="error" appearance="text" onClick={() => void history.refresh()}>
                  {labels.tryAgain}
                </Button>
              }
            >
              {history.error?.message}
            </Alert>
          </Box>
        ) : null}
        {!loading && !failed && history.items.length === 0 ? (
          <Typography
            variant="body1"
            sx={(t: AtomsTheme) => ({ px: 1.5, py: 3, textAlign: 'center', ...mode(t, { color: text.default.b3 }) })}
          >
            {history.query ? labels.historyNoResults : labels.historyEmpty}
          </Typography>
        ) : null}
        {history.groups.map((group) => (
          <Box key={group.key} component="section" aria-label={labels[GROUP_LABEL[group.key]] as string} sx={{ mb: 1 }}>
            <Typography
              variant="caption"
              component="h3"
              sx={(t: AtomsTheme) => ({ px: 1.5, pt: 1.5, pb: 0.5, m: 0, ...mode(t, { color: text.default.b3 }) })}
            >
              {labels[GROUP_LABEL[group.key]] as string}
            </Typography>
            <List dense>
              {group.items.map((item) => {
                const active = item.id === history.activeId;
                const running = history.isRunning(item.id);
                return (
                  <ListItem
                    key={item.id}
                    disablePadding
                    secondaryAction={
                      <IconButton
                        size="sm"
                        variant="secondary"
                        appearance="text"
                        aria-label={labels.moreActions(item.title)}
                        aria-haspopup="menu"
                        onClick={(e) => setMenu({ anchor: e.currentTarget, item })}
                      >
                        <DotsThreeIcon />
                      </IconButton>
                    }
                  >
                    <ListItemButton
                      selected={active}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => {
                        void history.select(item.id);
                        onSelect?.(item.id);
                      }}
                    >
                      <ListItemText
                        primary={item.title}
                        secondary={running ? labels.running : item.archived ? labels.archive : undefined}
                        slotProps={{ primary: { noWrap: true } }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      <Box sx={(t: AtomsTheme) => ({ px: 2, py: 1, borderTop: '1px solid', ...mode(t, { borderColor: border.layers.card1 }) })}>
        <Switch
          size="small"
          label={labels.showArchived}
          checked={history.showArchived}
          onChange={(_, checked) => history.setShowArchived(checked)}
        />
      </Box>

      <Menu
        anchorEl={menu?.anchor ?? null}
        open={Boolean(menu)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            if (menu) setRenaming(menu.item);
            closeMenu();
          }}
        >
          <PencilSimpleIcon size={16} />
          {labels.rename}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menu) void history.archive(menu.item.id, !menu.item.archived).catch(() => undefined);
            closeMenu();
          }}
        >
          {menu?.item.archived ? <ArrowUUpLeftIcon size={16} /> : <ArchiveIcon size={16} />}
          {menu?.item.archived ? labels.unarchive : labels.archive}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menu) setDeleting(menu.item);
            closeMenu();
          }}
        >
          <TrashIcon size={16} />
          {labels.delete}
        </MenuItem>
      </Menu>
      {renaming ? <RenameDialog item={renaming} onClose={() => setRenaming(null)} /> : null}
      {deleting ? <DeleteDialog item={deleting} onClose={() => setDeleting(null)} /> : null}
    </Box>
  );
}
