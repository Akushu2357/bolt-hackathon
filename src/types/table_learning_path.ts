export interface LearningPathRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  completed: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface LearningPathInsert {
  id?: string;
  user_id: string;
  title: string;
  description: string;
  completed?: boolean;
  order_index?: number;
  created_at?: string;
  updated_at?: string;
}

export interface LearningPathUpdate {
  id?: string;
  user_id?: string;
  title?: string;
  description?: string;
  completed?: boolean;
  order_index?: number;
  created_at?: string;
  updated_at?: string;
}

export interface LearningPathTable {
  Row: LearningPathRow;
  Insert: LearningPathInsert;
  Update: LearningPathUpdate;
}