export interface QuizRow {
  id: string;
  user_id: string;
  title: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: any;
  created_at: string;
}

export interface QuizInsert {
  id?: string;
  user_id: string;
  title: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: any;
  created_at?: string;
}

export interface QuizUpdate {
  id?: string;
  user_id?: string;
  title?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  questions?: any;
  created_at?: string;
}

export interface QuizTable {
  Row: QuizRow;
  Insert: QuizInsert;
  Update: QuizUpdate;
}