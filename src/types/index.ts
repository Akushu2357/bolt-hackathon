// Re-export all types for easy importing
export * from './database';
export * from './table_profiles';
export * from './table_chat_sessions';
export * from './table_chat_messages';
export * from './table_quizzes';
export * from './table_quiz_attempts';
export * from './table_learning_progress';
export * from './table_schedule';

// Additional types
export interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number | number[];
  type?: 'single' | 'multiple';
  explanation: string;
}