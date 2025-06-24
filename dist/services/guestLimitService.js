/**
 * Service to manage guest user limitations
 */
export class GuestLimitService {
    static STORAGE_KEY = 'tutorAI_guest_usage';
    static LIMITS = {
        maxChats: 5,
        maxQuizzes: 1, // Changed from 3 to 1
        maxQuizAttempts: 5
    };
    /**
     * Get current guest usage from localStorage
     */
    static getGuestUsage() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        }
        catch (error) {
            console.error('Error reading guest usage:', error);
        }
        return {
            chatsUsed: 0,
            quizzesGenerated: 0,
            quizAttempts: 0
        };
    }
    /**
     * Save guest usage to localStorage
     */
    static saveGuestUsage(usage) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usage));
        }
        catch (error) {
            console.error('Error saving guest usage:', error);
        }
    }
    /**
     * Get guest limits
     */
    static getLimits() {
        return { ...this.LIMITS };
    }
    /**
     * Check if guest can perform an action
     */
    static canPerformAction(action) {
        const usage = this.getGuestUsage();
        const limits = this.getLimits();
        switch (action) {
            case 'chat':
                return usage.chatsUsed < limits.maxChats;
            case 'quiz':
                return usage.quizzesGenerated < limits.maxQuizzes;
            case 'quizAttempt':
                return usage.quizAttempts < limits.maxQuizAttempts;
            default:
                return false;
        }
    }
    /**
     * Increment usage counter for an action
     */
    static incrementUsage(action) {
        const usage = this.getGuestUsage();
        switch (action) {
            case 'chat':
                usage.chatsUsed++;
                break;
            case 'quiz':
                usage.quizzesGenerated++;
                break;
            case 'quizAttempt':
                usage.quizAttempts++;
                break;
        }
        this.saveGuestUsage(usage);
    }
    /**
     * Get remaining usage for an action
     */
    static getRemainingUsage(action) {
        const usage = this.getGuestUsage();
        const limits = this.getLimits();
        switch (action) {
            case 'chat':
                return Math.max(0, limits.maxChats - usage.chatsUsed);
            case 'quiz':
                return Math.max(0, limits.maxQuizzes - usage.quizzesGenerated);
            case 'quizAttempt':
                return Math.max(0, limits.maxQuizAttempts - usage.quizAttempts);
            default:
                return 0;
        }
    }
    /**
     * Reset guest usage (useful for testing or admin purposes)
     */
    static resetGuestUsage() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
    /**
     * Get usage summary for display
     */
    static getUsageSummary() {
        const usage = this.getGuestUsage();
        const limits = this.getLimits();
        return {
            chats: {
                used: usage.chatsUsed,
                remaining: limits.maxChats - usage.chatsUsed,
                total: limits.maxChats
            },
            quizzes: {
                used: usage.quizzesGenerated,
                remaining: limits.maxQuizzes - usage.quizzesGenerated,
                total: limits.maxQuizzes
            },
            quizAttempts: {
                used: usage.quizAttempts,
                remaining: limits.maxQuizAttempts - usage.quizAttempts,
                total: limits.maxQuizAttempts
            }
        };
    }
}
