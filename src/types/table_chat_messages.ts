export interface ChatMessageRow {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatMessageInsert {
  id?: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface ChatMessageUpdate {
  id?: string;
  session_id?: string;
  role?: 'user' | 'assistant';
  content?: string;
  created_at?: string;
}

export interface ChatMessageTable {
  Row: ChatMessageRow;
  Insert: ChatMessageInsert;
  Update: ChatMessageUpdate;
}