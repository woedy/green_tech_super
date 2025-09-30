import { UserSummary } from "./project";

export interface ProjectChatAttachment {
  id: string;
  file: string | null;
  uploaded_at: string;
}

export interface ProjectChatReceipt {
  user: UserSummary;
  read_at: string;
}

export interface ProjectChatMessage {
  id: string;
  project: string;
  quote: string | null;
  sender: UserSummary;
  body: string;
  attachments: ProjectChatAttachment[];
  metadata?: Record<string, unknown> | null;
  created_at: string;
  edited_at: string | null;
  receipts: ProjectChatReceipt[];
}

export interface ProjectChatTypingEvent {
  user_id: number | string;
  is_typing: boolean;
}

export interface ProjectChatReadEvent {
  message_id: string;
  user_id: number | string;
  read_at: string;
}
