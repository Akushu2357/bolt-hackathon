import { Database } from './database';

export type LearningProgress = Database['public']['Tables']['learning_progress']['Row'];
export type LearningProgressInsert = Database['public']['Tables']['learning_progress']['Insert'];
export type LearningProgressUpdate = Database['public']['Tables']['learning_progress']['Update'];