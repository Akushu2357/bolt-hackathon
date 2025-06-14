export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          created_at?: string;
        };
      };
      quizzes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          topic: string;
          difficulty: 'easy' | 'medium' | 'hard';
          questions: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          topic: string;
          difficulty: 'easy' | 'medium' | 'hard';
          questions: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          topic?: string;
          difficulty?: 'easy' | 'medium' | 'hard';
          questions?: any;
          created_at?: string;
        };
      };
      quiz_attempts: {
        Row: {
          id: string;
          quiz_id: string;
          user_id: string;
          answers: any;
          score: number;
          completed_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          user_id: string;
          answers: any;
          score: number;
          completed_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          user_id?: string;
          answers?: any;
          score?: number;
          completed_at?: string;
        };
      };
      learning_progress: {
        Row: {
          id: string;
          user_id: string;
          topic: string;
          weak_areas: string[];
          strengths: string[];
          progress_score: number;
          last_updated: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic: string;
          weak_areas?: string[];
          strengths?: string[];
          progress_score?: number;
          last_updated?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          topic?: string;
          weak_areas?: string[];
          strengths?: string[];
          progress_score?: number;
          last_updated?: string;
        };
      };
    };
  };
};