import { Box, Typography } from '@neofloai/atoms';
import { text } from '@neofloai/atoms/tokens';
import type { ReactNode } from 'react';
import { mode, type AtomsTheme } from './tokens';

export interface KeyValueItem {
  key: string;
  label?: ReactNode;
  value: ReactNode;
}

/** Muted keys against values (Figma "Block-kv"), as a semantic description list. */
export function KeyValueList({ items }: { items: KeyValueItem[] }) {
  if (!items.length) return null;
  return (
    <Box
      component="dl"
      sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(56px, max-content) minmax(0, 1fr)',
        columnGap: 1.25,
        rowGap: 1,
        m: 0,
      }}
    >
      {items.map((item) => (
        <Box key={item.key} sx={{ display: 'contents' }}>
          <Typography
            variant="body2"
            component="dt"
            sx={(theme: AtomsTheme) => ({ minWidth: 0, overflowWrap: 'anywhere', ...mode(theme, { color: text.default.b3 }) })}
          >
            {item.label ?? item.key}
          </Typography>
          <Typography
            variant="body2"
            component="dd"
            sx={(theme: AtomsTheme) => ({
              m: 0,
              minWidth: 0,
              overflowWrap: 'anywhere',
              ...mode(theme, { color: text.default.b1 }),
            })}
          >
            {item.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
