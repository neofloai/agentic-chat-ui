import type {
  CancelResult,
  ConversationBootstrap,
  ConversationDetail,
  ConversationPatch,
  ConversationSummary,
  SendMessageBody,
  StreamEvent,
  UpdatedConversation,
} from '../protocol/types';

export interface ProtocolWarning {
  code: 'malformed_event' | 'invalid_event' | 'unknown_event' | 'non_stream_response';
  message: string;
  data?: unknown;
}

export interface SendMessageOptions {
  signal: AbortSignal;
  /** Called for recoverable protocol problems (a malformed event, an unknown type). */
  onWarning?: (warning: ProtocolWarning) => void;
}

/**
 * The single seam between the chat UI and a backend. `createRestAdapter` implements it for
 * any schema-v1 server. A backend that doesn't follow the schema can still plug in by
 * implementing this interface and mapping its own payloads.
 */
export interface ChatAdapter {
  /** Row 1: POST /v1/conversation */
  createConversation(): Promise<ConversationBootstrap>;
  /** Row 2: GET /v1/conversations */
  listConversations(): Promise<ConversationSummary[]>;
  /** Row 3: GET /v1/conversations/{id} */
  getConversation(conversationId: string): Promise<ConversationDetail>;
  /** Row 4: PATCH /v1/conversations/{id} */
  updateConversation(conversationId: string, patch: ConversationPatch): Promise<UpdatedConversation>;
  /** Row 5: DELETE /v1/conversations/{id} */
  deleteConversation(conversationId: string): Promise<void>;
  /** Row 6: POST /v1/conversations/{id}/messages, streamed as parsed events. */
  sendMessage(conversationId: string, body: SendMessageBody, options: SendMessageOptions): AsyncIterable<StreamEvent>;
  /** Row 7: POST /v1/conversations/{id}/messages/cancel */
  cancelMessage(conversationId: string, messageId: string): Promise<CancelResult>;
}
