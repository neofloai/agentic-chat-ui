import type { ContentBlock } from '../../core/protocol/types';
import {
  applyPlanDelta,
  BLOCK_TYPES,
  parseApproval,
  parseArtifact,
  parseChoice,
  parseError,
  parseFallback,
  parseImage,
  parsePlan,
  parseSources,
  parseTable,
  parseText,
  parseThinking,
  parseToolCall,
  type ApprovalData,
  type ArtifactData,
  type ChoiceData,
  type ErrorData,
  type ImageData,
  type PlanData,
  type SourcesData,
  type TableData,
  type TextData,
  type ThinkingData,
  type ToolCallData,
} from '../../blocks/parsers';
import { defineBlock } from '../../registry/registry';
import type { BlockDefinition } from '../../registry/types';
import { ErrorBlock, SourcesBlock, TextBlock, ThinkingBlock, ToolBlock, UnknownBlock } from './basic';
import { ApprovalBlock, ChoiceBlock } from './hitl';
import { ArtifactBlock, ImageBlock, PlanBlock } from './media';
import { TableBlock, tableToText } from './table';

const choiceTypes: readonly string[] = BLOCK_TYPES.choice;
const approvalTypes: readonly string[] = BLOCK_TYPES.approval;

export const textBlock = defineBlock<TextData>({
  name: 'text',
  type: BLOCK_TYPES.text,
  category: 'content',
  parse: parseText,
  render: TextBlock,
  toText: (d) => d.text,
});

export const thinkingBlock = defineBlock<ThinkingData>({
  name: 'thinking',
  type: BLOCK_TYPES.thinking,
  category: ['reasoning', 'thinking'],
  parse: parseThinking,
  render: ThinkingBlock,
  toText: () => '',
});

export const toolCallBlock = defineBlock<ToolCallData>({
  name: 'tool_call',
  type: BLOCK_TYPES.toolCall,
  category: 'tool',
  parse: parseToolCall,
  render: ToolBlock,
  toText: () => '',
});

export const tableBlock = defineBlock<TableData>({
  name: 'table',
  type: BLOCK_TYPES.table,
  parse: parseTable,
  render: TableBlock,
  toText: tableToText,
});

export const sourcesBlock = defineBlock<SourcesData>({
  name: 'sources',
  type: BLOCK_TYPES.sources,
  category: ['citation', 'sources'],
  parse: parseSources,
  render: SourcesBlock,
  toText: () => '',
});

export const approvalBlock = defineBlock<ApprovalData>({
  name: 'approval',
  type: BLOCK_TYPES.approval,
  // Any other HITL block without options reads best as an approval.
  category: 'hitl',
  parse: parseApproval,
  render: ApprovalBlock,
  toText: (d) => [d.title, d.description].filter(Boolean).join('\n'),
});

export const choiceBlock = defineBlock<ChoiceData>({
  name: 'choice',
  type: BLOCK_TYPES.choice,
  // An unknown HITL type that carries options is a choice, not an approval.
  match: (b: ContentBlock) =>
    b.category === 'hitl' && Array.isArray(b.options) && !approvalTypes.includes(b.type) && !choiceTypes.includes(b.type),
  parse: parseChoice,
  render: ChoiceBlock,
  toText: (d) => d.title,
});

export const errorBlock = defineBlock<ErrorData>({
  name: 'error',
  type: BLOCK_TYPES.error,
  category: 'error',
  parse: parseError,
  render: ErrorBlock,
  toText: (d) => [d.title, d.message].filter(Boolean).join(': '),
});

export const artifactBlock = defineBlock<ArtifactData>({
  name: 'artifact',
  type: BLOCK_TYPES.artifact,
  parse: parseArtifact,
  render: ArtifactBlock,
  toText: (d) => d.content ?? d.title,
});

export const imageBlock = defineBlock<ImageData>({
  name: 'image',
  type: BLOCK_TYPES.image,
  parse: parseImage,
  render: ImageBlock,
  toText: (d) => d.caption ?? d.alt,
});

export const planBlock = defineBlock<PlanData>({
  name: 'plan',
  type: BLOCK_TYPES.plan,
  category: 'plan',
  parse: parsePlan,
  applyDelta: applyPlanDelta,
  render: PlanBlock,
  toText: () => '',
});

/** Renders blocks nobody claimed: `fallback_text` when the block has it, else JSON in development only. */
export const unknownBlock = defineBlock({
  name: 'unknown',
  match: () => false,
  render: UnknownBlock,
  toText: (_d, block) => parseFallback(block.data).text ?? '',
});

/** Every built-in block except charts (import `chartBlock` from `@neofloai/agentic-chat/charts`). */
export const defaultBlocks: readonly BlockDefinition[] = [
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
  planBlock,
];

export { TextBlock, ThinkingBlock, ToolBlock, SourcesBlock, ErrorBlock, UnknownBlock, BlockCrashNotice } from './basic';
export { ApprovalBlock, ChoiceBlock } from './hitl';
export { ArtifactBlock, ImageBlock, PlanBlock } from './media';
export { TableBlock, DataTable, tableToText } from './table';
export { Markdown, type MarkdownProps, type MarkdownSize } from './Markdown';
