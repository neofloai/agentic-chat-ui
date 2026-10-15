import { Box, Checkbox, Chip, Divider, Menu, MenuItem, Typography } from '@neofloai/atoms';
import { CaretDownIcon } from '@neofloai/atoms/icons';
import { radius, text } from '@neofloai/atoms/tokens';
import { useContext, useState, type ReactNode } from 'react';
import { ChatContext } from '../../react/context';
import { defaultLabels } from '../../react/labels';
import { mode, type AtomsTheme } from '../kit/tokens';

export interface ComposerPickerItem {
  /** Unique across the whole picker: `value` is a list of these. */
  id: string;
  label: ReactNode;
  /** A second, quieter line under the label. */
  description?: ReactNode;
  /** A 16px glyph before the label. */
  icon?: ReactNode;
  disabled?: boolean;
}

export interface ComposerPickerGroup {
  id: string;
  /** Heading above the group's items. */
  label?: ReactNode;
  /**
   * Multiple selection only: the heading also selects or clears every item in the group, and says
   * which on its right ("Select all" / "Deselect all").
   */
  selectAll?: boolean;
  items: ComposerPickerItem[];
}

export interface ComposerPickerProps {
  /** What is being picked, e.g. "Tools". The trigger's accessible name and the default summary use it. */
  name: string;
  /** The choices, in groups. */
  groups?: ComposerPickerGroup[];
  /** Shorthand for one group without a heading. */
  items?: ComposerPickerItem[];
  /** The ids of the selected items. */
  value: readonly string[];
  onChange: (value: string[]) => void;
  /** Checkboxes that stay open (default), or a single choice that closes the menu. @default true */
  multiple?: boolean;
  /**
   * The trigger's text. Defaults to `labels.pickerSummary(name, selected, total)` ("All tools",
   * "Tools (2)", "No tools") for multiple selection, and to the chosen item's label for single.
   */
  triggerLabel?: ReactNode;
  /** The heading's action text. @default labels.pickerSelectAll / labels.pickerDeselectAll */
  selectAllLabel?: string;
  deselectAllLabel?: string;
  /**
   * Under a rule at the bottom of the menu, e.g. a "Manage…" `MenuItem` that opens your own dialog.
   * A function receives `close` so it can shut the menu first.
   */
  footer?: ReactNode | ((close: () => void) => ReactNode);
  disabled?: boolean;
  /** The choices are loading: the trigger is disabled and marked busy. */
  loading?: boolean;
  /** @default 260 */
  menuMinWidth?: number;
}

/** Rows sit indented under their group's heading (Figma SourcePicker). */
const ROW_INDENT = 3.25;

/**
 * A pill in the composer that opens a menu of choices: workflows, tools, models, data sources, or
 * anything else a turn can be about. Controlled, and it knows nothing about what the items mean.
 * Figma: Composer-scope (the pill) and SourcePicker (the menu).
 * The built-in workflow picker (`ScopePicker`) is one of these; put your own in `ChatComposer`'s
 * `leadingActions` or `extraActions`.
 */
export function ComposerPicker({
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
  menuMinWidth = 260,
}: ComposerPickerProps) {
  // Works outside a ChatProvider too (a picker in your own toolbar), with the default strings.
  const labels = useContext(ChatContext)?.labels ?? defaultLabels;
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);

  const sections: ComposerPickerGroup[] = groups ?? (items ? [{ id: '', items }] : []);
  const options = sections.flatMap((g) => g.items);
  const selected = new Set(value);
  const count = options.filter((o) => selected.has(o.id)).length;
  const summary =
    triggerLabel ??
    (multiple ? labels.pickerSummary(name, count, options.length) : (options.find((o) => selected.has(o.id))?.label ?? name));

  const toggle = (id: string) => onChange(selected.has(id) ? value.filter((v) => v !== id) : [...value, id]);
  const choose = (id: string) => {
    close();
    if (!selected.has(id) || value.length !== 1) onChange([id]);
  };
  const setGroup = (group: ComposerPickerGroup, on: boolean) => {
    // Disabled items keep whatever state they have.
    const ids = new Set(group.items.filter((i) => !i.disabled).map((i) => i.id));
    const rest = value.filter((v) => !ids.has(v));
    onChange(on ? [...rest, ...ids] : rest);
  };

  const row = (item: ComposerPickerItem, indent: boolean) => {
    const on = selected.has(item.id);
    const rowSx = indent ? { pl: ROW_INDENT } : undefined;
    const content = (
      <>
        {item.icon ? (
          <Box component="span" aria-hidden sx={{ display: 'inline-flex', mr: 1 }}>
            {item.icon}
          </Box>
        ) : null}
        <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
          <Box component="span" sx={{ display: 'block' }}>
            {item.label}
          </Box>
          {item.description ? (
            <Typography
              variant="caption"
              component="span"
              sx={(t: AtomsTheme) => ({ display: 'block', whiteSpace: 'normal', ...mode(t, { color: text.default.b3 }) })}
            >
              {item.description}
            </Typography>
          ) : null}
        </Box>
      </>
    );
    return multiple ? (
      <MenuItem
        key={item.id}
        role="menuitemcheckbox"
        aria-checked={on}
        disabled={item.disabled}
        onClick={() => toggle(item.id)}
        sx={rowSx}
      >
        <Checkbox size="sm" checked={on} tabIndex={-1} aria-hidden sx={{ p: 0, mr: 1.25 }} />
        {content}
      </MenuItem>
    ) : (
      <MenuItem
        key={item.id}
        role="menuitemradio"
        aria-checked={on}
        selected={on}
        disabled={item.disabled}
        onClick={() => choose(item.id)}
        sx={rowSx}
      >
        {content}
      </MenuItem>
    );
  };

  // Menu takes a flat list of children (MUI warns about fragments), so build one.
  const children: ReactNode[] = [];
  sections.forEach((group, index) => {
    // A heading separates groups well enough (Figma SourcePicker); a rule only when there is none.
    if (index > 0) {
      children.push(
        group.label ? (
          <Box key={`d:${group.id}`} role="presentation" sx={{ height: 8 }} />
        ) : (
          <Divider key={`d:${group.id}`} sx={{ my: 0.5 }} />
        ),
      );
    }
    if (multiple && group.selectAll) {
      // The heading is the group's select-all control, with the action named on its right.
      const enabled = group.items.filter((i) => !i.disabled);
      const all = enabled.length > 0 && enabled.every((i) => selected.has(i.id));
      const action = all ? (deselectAllLabel ?? labels.pickerDeselectAll) : (selectAllLabel ?? labels.pickerSelectAll);
      children.push(
        <MenuItem
          key={`h:${group.id}`}
          variant="secondary"
          disabled={enabled.length === 0}
          aria-label={typeof group.label === 'string' ? `${group.label}: ${action}` : action}
          onClick={() => setGroup(group, !all)}
        >
          <Typography
            variant="body2"
            weight="medium"
            component="span"
            sx={(t: AtomsTheme) => ({ flex: 1, ...mode(t, { color: text.default.b1 }) })}
          >
            {group.label}
          </Typography>
          <Typography
            variant="body2"
            component="span"
            sx={(t: AtomsTheme) => ({ ml: 2, ...mode(t, { color: text.primary[3] }) })}
          >
            {action}
          </Typography>
        </MenuItem>,
      );
    } else if (group.label) {
      children.push(
        <Typography
          key={`h:${group.id}`}
          role="presentation"
          variant="body2"
          weight="medium"
          component="div"
          sx={(t: AtomsTheme) => ({ px: 1.25, py: 0.75, ...mode(t, { color: text.default.b1 }) })}
        >
          {group.label}
        </Typography>,
      );
    }
    const indent = Boolean(group.label);
    children.push(...group.items.map((item) => row(item, indent)));
  });
  const footerContent = typeof footer === 'function' ? footer(close) : footer;
  if (footerContent) {
    children.push(<Divider key="footer-rule" sx={{ my: 0.5 }} />);
    children.push(<Box key="footer">{footerContent}</Box>);
  }

  return (
    <>
      <Chip
        dense
        variant="secondary"
        appearance="outline"
        icon={<CaretDownIcon size={14} />}
        label={summary}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        aria-label={typeof summary === 'string' ? `${name}: ${summary}` : name}
        aria-busy={loading || undefined}
        disabled={disabled || loading || options.length === 0}
        onClick={(e) => setAnchor(e.currentTarget)}
        // Figma's Composer-scope pill is fully round.
        sx={{ flexShrink: 0, borderRadius: `${radius.full}px`, '& .MuiChip-icon': { fontSize: 14, width: 14, height: 14 } }}
      />
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        variant="menu"
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        sx={{ '& .MuiMenu-paper': { minWidth: menuMinWidth, maxHeight: 420, mt: -1 } }}
      >
        {children}
      </Menu>
    </>
  );
}
