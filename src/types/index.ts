// Re-export all types for easy importing
export * from './database';
export * from './table_profiles';
export * from './table_chat_sessions';
export * from './table_chat_messages';
export * from './table_quizzes';
export * from './table_quiz_attempts';
export * from './table_learning_progress';
export * from './table_schedule';
export * from './table_weaknesses';
export * from './table_learning_path';

// Canonical Question and Quiz interfaces
export interface Question {
  id: string;
  type: 'single' | 'multiple' | 'true_false' | 'open_ended';
  question: string;
  options?: string[];
  explanation: string;
  correct_answer: number[] | string | boolean;
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: Question[];
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  score: number;
  completed_at: string;
  quiz: {
    title: string;
    topic: string;
  };
}