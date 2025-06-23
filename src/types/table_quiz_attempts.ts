export interface QuizAttemptRow {
  id: string;
  quiz_id: string;
  user_id: string;
  answers: any;
  score: number;
  completed_at: string;
}

export interface QuizAttemptInsert {
  id?: string;
  quiz_id: string;
  user_id: string;
  answers: any;
  score: number;
  completed_at?: string;
}

export interface QuizAttemptUpdate {
  id?: string;
  quiz_id?: string;
  user_id?: string;
  answers?: any;
  score?: number;
  completed_at?: string;
}

export interface QuizAttemptTable {
  Row: QuizAttemptRow;
  Insert: QuizAttemptInsert;
  Update: QuizAttemptUpdate;
}