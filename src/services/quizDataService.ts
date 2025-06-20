import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface Question {
  id: string;
  question: string;
  options?: string[];
  correct_answer: number | number[] | boolean | string;
  type: 'single' | 'multiple' | 'true_false' | 'open_ended';
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: Question[];
  created_at: string;
}

interface QuizAttempt {
  id: string;
  quiz_id: string;
  score: number;
  completed_at: string;
  quiz: {
    title: string;
    topic: string;
  };
}

export class QuizDataService {
  static async fetchQuizzes(user: User): Promise<Quiz[]> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      throw error;
    }
  }

  static async fetchAttempts(user: User): Promise<QuizAttempt[]> {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quiz:quizzes(title, topic)
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching attempts:', error);
      throw error;
    }
  }

  static async fetchWeakAreasCount(user: User): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('learning_progress')
        .select('weak_areas')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const allWeakAreas = data?.flatMap(progress => progress.weak_areas || []) || [];
      const uniqueWeakAreas = [...new Set(allWeakAreas)];
      return uniqueWeakAreas.length;
    } catch (error) {
      console.error('Error fetching weak areas count:', error);
      throw error;
    }
  }

  static async saveQuizAttempt(
    quizId: string, 
    userId: string, 
    answers: (number | number[] | boolean | string)[], 
    score: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          user_id: userId,
          answers: answers,
          score: score
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
      throw error;
    }
  }

  static async saveQuiz(
    userId: string,
    title: string,
    topic: string,
    difficulty: 'easy' | 'medium' | 'hard',
    questions: Question[]
  ): Promise<Quiz> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .insert({
          user_id: userId,
          title: title,
          topic: topic,
          difficulty: difficulty,
          questions: questions
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving quiz:', error);
      throw error;
    }
  }
}