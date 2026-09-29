import { Box, Card, CardContent, Collapse, IconButton, Stack, Typography } from '@neofloai/atoms';
import { CaretDownIcon } from '@neofloai/atoms/icons';
import { border, surface, text, icon as iconTokens, type ModeToken } from '@neofloai/atoms/tokens';
import { useId, useState, type ReactNode } from 'react';
import { BLOCK_ICON_PX, mode, type AtomsTheme } from './tokens';

export type BlockTone = 'default' | 'primary' | 'warning' | 'danger';

export interface BlockShellProps {
  /** An 18px glyph from `@neofloai/atoms/icons`. */
  icon?: ReactNode;
  title: ReactNode;
  /** Right-aligned, quiet text: a duration, a row count. */
  meta?: ReactNode;
  /** Right-aligned controls (icon buttons). */
  actions?: ReactNode;
  collapsible?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Tints the card for blocks that need attention, from the role's subtle surface tokens. */
  tone?: BlockTone;
  /** Indent the body under the title (the default when there's an icon). */
  indent?: boolean;
  /** A row of buttons under the body. */
  footer?: ReactNode;
  busy?: boolean;
  /** Body content. */
  children?: ReactNode;
  'aria-label'?: string;
  /** Drop the body padding, for edge-to-edge content such as a table. */
  flushBody?: boolean;
}

// In dark mode `primary.subtle` is a saturated indigo that swallows a primary button, so the
// attention tint there is the soft primary-tinted neutral instead.
const PRIMARY_TINT: ModeToken = { light: surface.primary.subtle.light, dark: surface.soft.default.dark };

const TONES: Record<Exclude<BlockTone, 'default'>, { bg: ModeToken; line: ModeToken; glyph: ModeToken }> = {
  primary: { bg: PRIMARY_TINT, line: border.primary.default, glyph: iconTokens.primary[3] },
  warning: { bg: surface.warning.subtle, line: border.warning.default, glyph: iconTokens.warning[3] },
  danger: { bg: surface.error.subtle, line: border.error.default, glyph: iconTokens.error[3] },
};

/**
 * The card every block shares (Figma "div.Block"): a head of icon, title and meta or caret,
 * then a body indented under the title. Exported so custom cards look native.
 */
export function BlockShell({
  icon,
  title,
  meta,
  actions,
  collapsible,
  open,
  defaultOpen = true,
  onOpenChange,
  tone = 'default',
  indent,
  footer,
  busy,
  children,
  flushBody,
  'aria-label': ariaLabel,
}: BlockShellProps) {
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const isOpen = open ?? innerOpen;
  const bodyId = useId();
  const toggle = () => {
    const next = !isOpen;
    if (open === undefined) setInnerOpen(next);
    onOpenChange?.(next);
  };
  const hasBody = children !== undefined && children !== null && children !== false;
  const indentBody = !flushBody && (indent ?? Boolean(icon));
  const toneSpec = tone === 'default' ? undefined : TONES[tone];

  const bodySx = (theme: AtomsTheme) => ({
    pt: flushBody ? 1.5 : 1.25,
    pl: indentBody ? `calc(${BLOCK_ICON_PX}px + ${theme.spacing(1.25)})` : 0,
    mx: flushBody ? -2 : 0,
    mb: flushBody ? -2 : 0,
    minWidth: 0,
  });

  return (
    <Card
      component="section"
      aria-label={ariaLabel}
      aria-busy={busy || undefined}
      sx={(theme: AtomsTheme) => ({
        overflow: 'hidden',
        ...(toneSpec ? mode(theme, { backgroundColor: toneSpec.bg, borderColor: toneSpec.line }) : {}),
      })}
    >
      <CardContent>
        <Stack
          direction="row"
          spacing={1.25}
          onClick={collapsible ? toggle : undefined}
          sx={{
            alignItems: 'center',
            minHeight: 20,
            cursor: collapsible ? 'pointer' : undefined,
            userSelect: collapsible ? 'none' : undefined,
          }}
        >
          {icon ? (
            <Box
              aria-hidden
              sx={(theme: AtomsTheme) => ({
                display: 'inline-flex',
                flexShrink: 0,
                '& svg': { width: BLOCK_ICON_PX, height: BLOCK_ICON_PX },
                ...mode(theme, { color: toneSpec?.glyph ?? iconTokens.default.b2 }),
              })}
            >
              {icon}
            </Box>
          ) : null}
          <Typography
            variant="body1"
            weight="medium"
            component="div"
            sx={(theme: AtomsTheme) => ({
              flex: 1,
              minWidth: 0,
              overflowWrap: 'anywhere',
              ...mode(theme, { color: text.default.heading }),
            })}
          >
            {title}
          </Typography>
          {meta !== undefined && meta !== null ? (
            <Typography
              variant="body2"
              component="div"
              sx={(theme: AtomsTheme) => ({ flexShrink: 0, whiteSpace: 'nowrap', ...mode(theme, { color: text.default.b3 }) })}
            >
              {meta}
            </Typography>
          ) : null}
          {actions ? (
            <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
              {actions}
            </Stack>
          ) : null}
          {collapsible ? (
            <IconButton
              size="sm"
              variant="secondary"
              appearance="text"
              aria-expanded={isOpen}
              aria-controls={bodyId}
              aria-label={typeof title === 'string' ? title : 'Toggle details'}
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
              sx={{ my: -0.75, mr: -0.75 }}
            >
              <CaretDownIcon style={{ transition: 'transform 150ms ease', transform: isOpen ? 'rotate(180deg)' : undefined }} />
            </IconButton>
          ) : null}
        </Stack>
        {hasBody ? (
          collapsible ? (
            <Collapse in={isOpen}>
              <Box id={bodyId} sx={bodySx}>
                {children}
              </Box>
            </Collapse>
          ) : (
            <Box sx={bodySx}>{children}</Box>
          )
        ) : null}
        {footer ? (
          <Stack
            direction="row"
            spacing={1}
            sx={(theme: AtomsTheme) => ({
              mt: 1.5,
              flexWrap: 'wrap',
              alignItems: 'center',
              pl: indentBody ? `calc(${BLOCK_ICON_PX}px + ${theme.spacing(1.25)})` : 0,
            })}
          >
            {footer}
          </Stack>
        ) : null}
      </CardContent>
    </Card>
  );
}
