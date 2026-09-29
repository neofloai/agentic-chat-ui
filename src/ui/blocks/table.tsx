import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  tableAmountType,
} from '@neofloai/atoms';
import { TableIcon } from '@neofloai/atoms/icons';
import { useMemo, useState } from 'react';
import type { TableColumn, TableData } from '../../blocks/parsers';
import { formatValue } from '../../blocks/format';
import type { BlockRenderProps } from '../../registry/types';
import { useLabels } from '../../react/hooks';
import { BlockShell } from '../kit/BlockShell';

const MAX_RENDERED_ROWS = 500;

function compare(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const na = Number(a);
  const nb = Number(b);
  if (a !== '' && b !== '' && Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true, sensitivity: 'base' });
}

/** A sortable Atoms `Table`. Also renders markdown-free result sets from other blocks. */
export function DataTable({
  columns,
  rows,
  maxHeight = 360,
}: {
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  maxHeight?: number;
}) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const sorted = useMemo(() => {
    const limited = rows.slice(0, MAX_RENDERED_ROWS);
    if (!sort) return limited;
    const out = [...limited].sort((x, y) => compare(x[sort.key], y[sort.key]));
    return sort.dir === 'desc' ? out.reverse() : out;
  }, [rows, sort]);

  const onSort = (key: string) =>
    setSort((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null));

  return (
    <TableContainer sx={{ maxHeight }}>
      <Table size="sm" stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableCell key={c.key} align={c.align} sortDirection={sort?.key === c.key ? sort.dir : false}>
                <TableSortLabel
                  active={sort?.key === c.key}
                  direction={sort?.key === c.key ? sort.dir : 'asc'}
                  onClick={() => onSort(c.key)}
                >
                  {c.label}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((row, i) => (
            <TableRow key={i}>
              {columns.map((c) => {
                const value = formatValue(row[c.key], { format: c.format, currency: c.currency });
                const numeric = c.format === 'currency' || c.format === 'number' || c.format === 'percent';
                return (
                  <TableCell key={c.key} align={c.align}>
                    {numeric ? (
                      <Box component="span" sx={tableAmountType}>
                        {value}
                      </Box>
                    ) : (
                      value
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/** Figma TableBlock: a titled result set with its row count. */
export function TableBlock({ data }: BlockRenderProps<TableData>) {
  const labels = useLabels();
  return (
    <BlockShell icon={<TableIcon />} title={data.title ?? ''} meta={labels.rows(data.totalRows)} flushBody>
      {data.columns.length ? <DataTable columns={data.columns} rows={data.rows} /> : null}
    </BlockShell>
  );
}

export function tableToText(data: TableData): string {
  const head = data.columns.map((c) => c.label).join('\t');
  const body = data.rows.map((r) =>
    data.columns.map((c) => formatValue(r[c.key], { format: c.format, currency: c.currency })).join('\t'),
  );
  return [data.title, head, ...body].filter(Boolean).join('\n');
}
