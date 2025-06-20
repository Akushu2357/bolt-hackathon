export interface LearningProgressRow {
  id: string;
  user_id: string;
  topic: string;
  weak_areas: string[];
  strengths: string[];
  progress_score: number;
  last_updated: string;
}

export interface LearningProgressInsert {
  id?: string;
  user_id: string;
  topic: string;
  weak_areas?: string[];
  strengths?: string[];
  progress_score?: number;
  last_updated?: string;
}

export interface LearningProgressUpdate {
  id?: string;
  user_id?: string;
  topic?: string;
  weak_areas?: string[];
  strengths?: string[];
  progress_score?: number;
  last_updated?: string;
}

export interface LearningProgressTable {
  Row: LearningProgressRow;
  Insert: LearningProgressInsert;
  Update: LearningProgressUpdate;
}