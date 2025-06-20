export interface ChatSessionRow {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatSessionInsert {
  id?: string;
  user_id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatSessionUpdate {
  id?: string;
  user_id?: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatSessionTable {
  Row: ChatSessionRow;
  Insert: ChatSessionInsert;
  Update: ChatSessionUpdate;
}