import { Database } from './database';

export type Quiz = Database['public']['Tables']['quizzes']['Row'];
export type QuizInsert = Database['public']['Tables']['quizzes']['Insert'];
export type QuizUpdate = Database['public']['Tables']['quizzes']['Update'];

export type QuizAttempt = Database['public']['Tables']['quiz_attempts']['Row'];
export type QuizAttemptInsert = Database['public']['Tables']['quiz_attempts']['Insert'];
export type QuizAttemptUpdate = Database['public']['Tables']['quiz_attempts']['Update'];

export interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}