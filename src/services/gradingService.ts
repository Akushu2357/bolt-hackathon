import { supabase } from '../lib/supabase';

export interface GradingRequestItem {
  question: string;
  answer: string;
  context?: string;
}

export interface GradedQuestion {
  question: string;
  answer: string;
  grade: 'correct' | 'incorrect' | 'partial';
  score: number; // 0-1 scale
  feedback: string;
  improvements: string[];
  weakAreas: string[];
}

export interface GradingResponse {
  graded: GradedQuestion[];
  metadata: {
    graded_at: string;
    total_questions: number;
    average_score: number;
  };
}

export class GradingService {
  private static getApiUrl(): string {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL is not configured');
    }
    return `${supabaseUrl}/functions/v1/grading-open-ended`;
  }

  private static async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    };
  }

  static async gradeOpenEndedQuestions(
    items: GradingRequestItem[]
  ): Promise<GradingResponse> {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Input must be a non-empty array of questions');
    }
    
    const apiUrl = this.getApiUrl();
    const headers = await this.getAuthHeaders();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(items),
    });

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } catch {
        try {
          const errorText = await response.text();
          if (errorText) errorMsg = errorText;
        } catch {}
      }
      throw new Error(errorMsg);
    }

    const data: GradingResponse = await response.json();
    if (!data.graded || !Array.isArray(data.graded)) {
      throw new Error('Invalid response format: missing graded array');
    }
    return data;
  }

  /**
   * Get weak areas from grading results for learning progress tracking
   */
  static extractWeakAreasFromGrading(gradingResults: GradedQuestion[]): string[] {
    const weakAreas: string[] = [];
    
    gradingResults.forEach(result => {
      if (result.grade === 'incorrect' || result.grade === 'partial') {
        // Add specific weak areas identified by the AI (don't add question text here)
        if (result.weakAreas && result.weakAreas.length > 0) {
          weakAreas.push(...result.weakAreas);
        }
      }
    });
    
    return [...new Set(weakAreas)]; // Remove duplicates
  }

  /**
   * Get improvement suggestions from grading results
   */
  static extractImprovements(gradingResults: GradedQuestion[]): string[] {
    const improvements: string[] = [];
    
    gradingResults.forEach(result => {
      if (result.improvements && result.improvements.length > 0) {
        improvements.push(...result.improvements);
      }
    });
    
    return [...new Set(improvements)]; // Remove duplicates
  }
}