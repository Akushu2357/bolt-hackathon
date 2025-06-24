import { supabase } from '../lib/supabase';
export class QuizService {
    static getApiUrl() {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl) {
            throw new Error('VITE_SUPABASE_URL is not configured');
        }
        return `${supabaseUrl}/functions/v1/generate-questions`;
    }
    static async getAuthHeaders() {
        const { data: { session } } = await supabase.auth.getSession();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        };
    }
    static async generateQuestions(request) {
        try {
            const apiUrl = this.getApiUrl();
            const headers = await this.getAuthHeaders();
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(request),
            });
            if (!response.ok) {
                // Try to parse error as JSON, fallback to text
                let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                }
                catch {
                    try {
                        const errorText = await response.text();
                        if (errorText)
                            errorMsg = errorText;
                    }
                    catch { }
                }
                throw new Error(errorMsg);
            }
            const data = await response.json();
            // Validate response structure
            if (!data.questions || !Array.isArray(data.questions)) {
                throw new Error('Invalid response format: missing questions array');
            }
            return data;
        }
        catch (error) {
            console.error('Error generating questions:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to generate quiz questions');
        }
    }
    static convertToQuizFormat(questions) {
        // Questions are already in the correct format from the edge function
        return questions;
    }
    static async getUserWeakAreas(userId, topic) {
        try {
            let query = supabase
                .from('learning_progress')
                .select('weak_areas')
                .eq('user_id', userId);
            if (topic) {
                query = query.eq('topic', topic);
            }
            const { data, error } = await query;
            if (error) {
                console.error('Error fetching weak areas:', error);
                return [];
            }
            // Flatten and deduplicate weak areas
            const allWeakAreas = data?.flatMap(progress => progress.weak_areas || []) || [];
            return [...new Set(allWeakAreas)];
        }
        catch (error) {
            console.error('Error getting user weak areas:', error);
            return [];
        }
    }
}
