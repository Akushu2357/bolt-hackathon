import { ProfileTable } from './table_profiles';
import { ChatSessionTable } from './table_chat_sessions';
import { ChatMessageTable } from './table_chat_messages';
import { QuizTable } from './table_quizzes';
import { QuizAttemptTable } from './table_quiz_attempts';
import { LearningProgressTable } from './table_learning_progress';
import { ScheduleTable } from './table_schedule';
import { WeaknessTable } from './table_weaknesses';
import { LearningPathTable } from './table_learning_path';

export type Database = {
  public: {
    Tables: {
      profiles: ProfileTable;
      chat_sessions: ChatSessionTable;
      chat_messages: ChatMessageTable;
      quizzes: QuizTable;
      quiz_attempts: QuizAttemptTable;
      learning_progress: LearningProgressTable;
      schedule: ScheduleTable;
      weaknesses: WeaknessTable;
      learning_path: LearningPathTable;
    };
  };
};