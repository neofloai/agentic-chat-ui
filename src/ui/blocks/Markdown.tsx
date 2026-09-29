import {
  Box,
  Card,
  Divider,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@neofloai/atoms';
import { border, surface, text } from '@neofloai/atoms/tokens';
import { memo, type ComponentProps } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { mode, monoFont, type AtomsTheme } from '../kit/tokens';

export type MarkdownSize = 'md' | 'sm';

const isExternal = (href?: string) => Boolean(href && /^https?:\/\//i.test(href));

function align(a: unknown): 'left' | 'center' | 'right' | undefined {
  return a === 'left' || a === 'center' || a === 'right' ? a : undefined;
}

function buildComponents(size: MarkdownSize): Components {
  const body = size === 'md' ? ({ variant: 'h6', weight: 'regular' } as const) : ({ variant: 'body1' } as const);
  const spaced = { '&:not(:last-child)': { mb: size === 'md' ? 1.5 : 1 } };
  return {
    p: ({ children }) => (
      <Typography {...body} component="p" sx={(t: AtomsTheme) => ({ ...spaced, ...mode(t, { color: text.default.b1 }) })}>
        {children}
      </Typography>
    ),
    h1: ({ children }) => (
      <Typography variant="h5" component="h3" sx={{ mt: 2, mb: 1, '&:first-of-type': { mt: 0 } }}>
        {children}
      </Typography>
    ),
    h2: ({ children }) => (
      <Typography variant="h6" component="h4" sx={{ mt: 2, mb: 1, '&:first-of-type': { mt: 0 } }}>
        {children}
      </Typography>
    ),
    h3: ({ children }) => (
      <Typography variant="body1" weight="semibold" component="h5" sx={{ mt: 1.5, mb: 0.75 }}>
        {children}
      </Typography>
    ),
    h4: ({ children }) => (
      <Typography variant="body1" weight="semibold" component="h6" sx={{ mt: 1.5, mb: 0.75 }}>
        {children}
      </Typography>
    ),
    h5: ({ children }) => (
      <Typography variant="body1" weight="medium" component="h6" sx={{ mt: 1, mb: 0.5 }}>
        {children}
      </Typography>
    ),
    h6: ({ children }) => (
      <Typography variant="body1" weight="medium" component="h6" sx={{ mt: 1, mb: 0.5 }}>
        {children}
      </Typography>
    ),
    a: ({ href, children }) => (
      <Link
        href={href}
        target={isExternal(href) ? '_blank' : undefined}
        rel={isExternal(href) ? 'noopener noreferrer' : undefined}
      >
        {children}
      </Link>
    ),
    ul: ({ children }) => (
      <Box component="ul" sx={{ pl: 3, my: 0, ...spaced }}>
        {children}
      </Box>
    ),
    ol: ({ children, start }) => (
      <Box component="ol" start={start} sx={{ pl: 3, my: 0, ...spaced }}>
        {children}
      </Box>
    ),
    li: ({ children }) => (
      <Typography
        {...body}
        component="li"
        sx={(t: AtomsTheme) => ({ '&:not(:last-child)': { mb: 0.5 }, ...mode(t, { color: text.default.b1 }) })}
      >
        {children}
      </Typography>
    ),
    blockquote: ({ children }) => (
      <Box
        component="blockquote"
        sx={(t: AtomsTheme) => ({
          m: 0,
          pl: 1.5,
          borderLeft: '2px solid',
          ...spaced,
          ...mode(t, { borderColor: border.layers.card3, color: text.default.b2 }),
        })}
      >
        {children}
      </Box>
    ),
    hr: () => <Divider sx={{ my: 2 }} />,
    code: ({ className, children }) => {
      const block = /language-/.test(className ?? '') || String(children ?? '').includes('\n');
      if (block) return <code className={className}>{children}</code>;
      return (
        <Box
          component="code"
          sx={(t: AtomsTheme) => ({
            fontFamily: monoFont,
            fontSize: '0.9em',
            px: 0.5,
            py: 0.125,
            borderRadius: 0.5,
            ...mode(t, { backgroundColor: surface.layers.card2, color: text.default.heading }),
          })}
        >
          {children}
        </Box>
      );
    },
    pre: ({ children }) => (
      <Box
        component="pre"
        sx={(t: AtomsTheme) => ({
          m: 0,
          p: 1.5,
          overflowX: 'auto',
          borderRadius: 1,
          border: '1px solid',
          fontFamily: monoFont,
          fontSize: t.typography.body2.fontSize,
          lineHeight: t.typography.body2.lineHeight,
          ...spaced,
          ...mode(t, { backgroundColor: surface.layers.card2, borderColor: border.layers.card2, color: text.default.heading }),
          '& code': { fontFamily: 'inherit' },
        })}
      >
        {children}
      </Box>
    ),
    table: ({ children }) => (
      <Card sx={{ ...spaced }}>
        <TableContainer>
          <Table size="sm">{children}</Table>
        </TableContainer>
      </Card>
    ),
    thead: ({ children }) => <TableHead>{children}</TableHead>,
    tbody: ({ children }) => <TableBody>{children}</TableBody>,
    tr: ({ children }) => <TableRow>{children}</TableRow>,
    th: ({ children, style }) => <TableCell align={align(style?.textAlign)}>{children}</TableCell>,
    td: ({ children, style }) => <TableCell align={align(style?.textAlign)}>{children}</TableCell>,
    img: ({ src, alt }) =>
      typeof src === 'string' ? (
        <Box
          component="img"
          src={src}
          alt={alt ?? ''}
          loading="lazy"
          sx={{ maxWidth: '100%', borderRadius: 1, display: 'block', ...spaced }}
        />
      ) : null,
  };
}

const COMPONENTS: Record<MarkdownSize, Components> = { md: buildComponents('md'), sm: buildComponents('sm') };

export interface MarkdownProps {
  children: string;
  size?: MarkdownSize;
  /** Extra react-markdown component overrides. */
  components?: Components;
}

/**
 * Markdown on the Atoms type scale. Raw HTML is never rendered and unsafe URLs are dropped
 * (react-markdown's default URL transform), so model output can't inject markup.
 */
export const Markdown = memo(function Markdown({ children, size = 'md', components }: MarkdownProps) {
  return (
    <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components ? { ...COMPONENTS[size], ...components } : COMPONENTS[size]}
      >
        {children}
      </ReactMarkdown>
    </Box>
  );
});

export type MarkdownComponents = ComponentProps<typeof ReactMarkdown>['components'];
