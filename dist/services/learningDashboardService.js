import { supabase } from '../lib/supabase';
export class LearningDashboardService {
    // Weakness Management
    static async fetchWeaknesses(user) {
        try {
            const { data, error } = await supabase
                .from('weaknesses')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            console.error('Error fetching weaknesses:', error);
            throw error;
        }
    }
    static async createWeakness(user, weakness) {
        try {
            const { data, error } = await supabase
                .from('weaknesses')
                .insert({
                user_id: user.id,
                title: weakness.title,
                description: weakness.description,
                improve_action: weakness.improve_action
            })
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error creating weakness:', error);
            throw error;
        }
    }
    static async updateWeakness(user, weaknessId, updates) {
        try {
            const { data, error } = await supabase
                .from('weaknesses')
                .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
                .eq('id', weaknessId)
                .eq('user_id', user.id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error updating weakness:', error);
            throw error;
        }
    }
    static async deleteWeakness(user, weaknessId) {
        try {
            const { error } = await supabase
                .from('weaknesses')
                .delete()
                .eq('id', weaknessId)
                .eq('user_id', user.id);
            if (error)
                throw error;
        }
        catch (error) {
            console.error('Error deleting weakness:', error);
            throw error;
        }
    }
    // Learning Path Management
    static async fetchLearningPath(user) {
        try {
            const { data, error } = await supabase
                .from('learning_path')
                .select('*')
                .eq('user_id', user.id)
                .order('order_index', { ascending: true });
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            console.error('Error fetching learning path:', error);
            throw error;
        }
    }
    static async createLearningStep(user, step) {
        try {
            // Get the next order index if not provided
            let orderIndex = step.order_index;
            if (orderIndex === undefined) {
                const { data: existingSteps } = await supabase
                    .from('learning_path')
                    .select('order_index')
                    .eq('user_id', user.id)
                    .order('order_index', { ascending: false })
                    .limit(1);
                orderIndex = existingSteps && existingSteps.length > 0
                    ? existingSteps[0].order_index + 1
                    : 0;
            }
            const { data, error } = await supabase
                .from('learning_path')
                .insert({
                user_id: user.id,
                title: step.title,
                description: step.description,
                order_index: orderIndex,
                completed: false
            })
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error creating learning step:', error);
            throw error;
        }
    }
    static async updateLearningStep(user, stepId, updates) {
        try {
            const { data, error } = await supabase
                .from('learning_path')
                .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
                .eq('id', stepId)
                .eq('user_id', user.id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error updating learning step:', error);
            throw error;
        }
    }
    static async toggleLearningStepCompletion(user, stepId) {
        try {
            // First get the current step to toggle its completion status
            const { data: currentStep, error: fetchError } = await supabase
                .from('learning_path')
                .select('completed')
                .eq('id', stepId)
                .eq('user_id', user.id)
                .single();
            if (fetchError)
                throw fetchError;
            const { data, error } = await supabase
                .from('learning_path')
                .update({
                completed: !currentStep.completed,
                updated_at: new Date().toISOString()
            })
                .eq('id', stepId)
                .eq('user_id', user.id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error toggling learning step completion:', error);
            throw error;
        }
    }
    static async deleteLearningStep(user, stepId) {
        try {
            const { error } = await supabase
                .from('learning_path')
                .delete()
                .eq('id', stepId)
                .eq('user_id', user.id);
            if (error)
                throw error;
        }
        catch (error) {
            console.error('Error deleting learning step:', error);
            throw error;
        }
    }
    // Statistics and Progress
    static async getLearningStats(user) {
        try {
            // Fetch weaknesses count
            const { count: weaknessCount } = await supabase
                .from('weaknesses')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);
            // Fetch learning path stats
            const { data: learningSteps } = await supabase
                .from('learning_path')
                .select('completed')
                .eq('user_id', user.id);
            const totalSteps = learningSteps?.length || 0;
            const completedSteps = learningSteps?.filter(step => step.completed).length || 0;
            const overallProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
            // Calculate day streak (simplified - you might want to implement proper streak logic)
            const dayStreak = await this.calculateDayStreak(user);
            // Determine current level based on progress
            const currentLevel = this.determineLevel(overallProgress, completedSteps);
            return {
                totalWeaknesses: weaknessCount || 0,
                totalLearningSteps: totalSteps,
                completedSteps,
                overallProgress,
                dayStreak,
                currentLevel
            };
        }
        catch (error) {
            console.error('Error getting learning stats:', error);
            throw error;
        }
    }
    static async calculateDayStreak(user) {
        try {
            // Get recent quiz attempts and chat sessions to calculate streak
            const today = new Date();
            const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const { data: recentActivity } = await supabase
                .from('quiz_attempts')
                .select('completed_at')
                .eq('user_id', user.id)
                .gte('completed_at', sevenDaysAgo.toISOString())
                .order('completed_at', { ascending: false });
            // Simple streak calculation - count unique days with activity
            const uniqueDays = new Set();
            recentActivity?.forEach(activity => {
                const date = new Date(activity.completed_at).toDateString();
                uniqueDays.add(date);
            });
            return uniqueDays.size;
        }
        catch (error) {
            console.error('Error calculating day streak:', error);
            return 0;
        }
    }
    static determineLevel(progress, completedSteps) {
        if (completedSteps === 0)
            return 'Beginner';
        if (progress < 25)
            return 'Beginner';
        if (progress < 50)
            return 'Intermediate';
        if (progress < 75)
            return 'Advanced';
        return 'Expert';
    }
    // Generate learning recommendations based on weaknesses
    static async generateLearningRecommendations(user) {
        try {
            const weaknesses = await this.fetchWeaknesses(user);
            const recommendations = [];
            weaknesses.forEach((weakness, index) => {
                if (weakness.improve_action) {
                    recommendations.push({
                        title: `Improve: ${weakness.title}`,
                        description: weakness.improve_action,
                        order_index: index
                    });
                }
                else {
                    recommendations.push({
                        title: `Study: ${weakness.title}`,
                        description: `Focus on understanding ${weakness.description}`,
                        order_index: index
                    });
                }
            });
            return recommendations;
        }
        catch (error) {
            console.error('Error generating learning recommendations:', error);
            throw error;
        }
    }
}
