export interface QuizChatContext {
  quizId: string;
  quizTitle: string;
  topic: string;
  difficulty: string;
  score: number;
  weakAreas: string[];
  strengths: string[];
  incorrectQuestions: Array<{
    question: string;
    userAnswer: string;
    correctAnswer: string;
    explanation: string;
  }>;
  gradingResults?: any[];
}

export interface ChatIntegrationData {
  fromQuiz: boolean;
  quizContext?: QuizChatContext;
  suggestedPrompts?: string[];
}

export class QuizChatIntegrationService {
  private static readonly STORAGE_KEY = 'tutorAI_quiz_chat_context';

  /**
   * Store quiz context for chat integration
   */
  static storeQuizContext(context: QuizChatContext): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(context));
    } catch (error) {
      console.error('Error storing quiz context:', error);
    }
  }

  /**
   * Retrieve and clear quiz context
   */
  static getAndClearQuizContext(): QuizChatContext | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        localStorage.removeItem(this.STORAGE_KEY);
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error retrieving quiz context:', error);
    }
    return null;
  }

  /**
   * Generate suggested prompts based on quiz performance
   */
  static generateSuggestedPrompts(context: QuizChatContext): string[] {
    const prompts: string[] = [];

    // Performance-based prompts
    if (context.score < 60) {
      prompts.push(`I scored ${context.score}% on my ${context.topic} quiz. Can you help me understand the key concepts I'm missing?`);
      prompts.push(`I'm struggling with ${context.topic}. Can you explain the fundamentals in simple terms?`);
    } else if (context.score < 80) {
      prompts.push(`I got ${context.score}% on my ${context.topic} quiz. Can you help me improve my understanding?`);
      prompts.push(`I have a decent grasp of ${context.topic} but made some mistakes. Can you help me fill the gaps?`);
    } else {
      prompts.push(`I did well on my ${context.topic} quiz (${context.score}%), but I want to deepen my understanding. What advanced topics should I explore?`);
      prompts.push(`Can you give me more challenging questions about ${context.topic}?`);
    }

    // Weak area specific prompts
    if (context.weakAreas.length > 0) {
      const topWeakAreas = context.weakAreas.slice(0, 3);
      prompts.push(`I need help understanding: ${topWeakAreas.join(', ')}`);
      prompts.push(`Can you explain ${topWeakAreas[0]} in detail with examples?`);
    }

    // Question-specific prompts
    if (context.incorrectQuestions.length > 0) {
      const firstIncorrect = context.incorrectQuestions[0];
      prompts.push(`I got this question wrong: "${firstIncorrect.question}". Can you explain why the correct answer is "${firstIncorrect.correctAnswer}"?`);
    }

    return prompts.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Create initial chat message with quiz context
   */
static createInitialChatMessage(context: QuizChatContext): string {
  const weakAreasText = context.weakAreas.length > 0 
    ? ` I particularly struggled with: ${context.weakAreas.slice(0, 3).join(', ')}.`
    : '';

  const performanceText = context.score >= 80 
    ? 'I did well but want to improve further.'
    : context.score >= 60 
    ? 'I have a basic understanding but need to strengthen some areas.'
    : 'I need help understanding the fundamental concepts.';

  // ✅ เพิ่ม fallback ตรงนี้:
  const topic = context.topic || 'my recent';
  const difficulty = context.difficulty || 'standard';

  return `Hi! I just completed a ${topic} quiz (${difficulty} difficulty) and scored ${context.score}%.${weakAreasText} ${performanceText} Can you help me improve my understanding?`;
}


  /**
   * Format quiz results for chat context
   */
  static formatQuizResultsForChat(
    quiz: any,
    selectedAnswers: any[],
    score: number,
    gradingResults?: any[]
  ): QuizChatContext {
    const weakAreas: string[] = [];
    const strengths: string[] = [];
    const incorrectQuestions: any[] = [];

    // Analyze each question
    quiz.questions.forEach((question: any, index: number) => {
      const userAnswer = selectedAnswers[index];
      const isCorrect = this.isAnswerCorrect(question, userAnswer);

      if (isCorrect) {
        strengths.push(this.extractConcept(question.question));
      } else {
        weakAreas.push(this.extractConcept(question.question));
        incorrectQuestions.push({
          question: question.question,
          userAnswer: this.formatUserAnswer(userAnswer, question),
          correctAnswer: this.formatCorrectAnswer(question.correct_answer, question),
          explanation: question.explanation || 'No explanation provided'
        });
      }
    });

    // Add weak areas from grading results if available
    if (gradingResults) {
      gradingResults.forEach(result => {
        if (result.weakAreas) {
          weakAreas.push(...result.weakAreas);
        }
      });
    }

    return {
      quizId: quiz.id,
      quizTitle: quiz.title,
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      score,
      weakAreas: [...new Set(weakAreas)], // Remove duplicates
      strengths: [...new Set(strengths)],
      incorrectQuestions,
      gradingResults
    };
  }

  private static isAnswerCorrect(question: any, userAnswer: any): boolean {
    // Simplified correctness check - you might want to use QuizScoringService here
    switch (question.type) {
      case 'single':
        return Array.isArray(userAnswer) && 
               Array.isArray(question.correct_answer) &&
               userAnswer.length === 1 &&
               question.correct_answer.includes(userAnswer[0]);
      case 'multiple':
        return Array.isArray(userAnswer) && 
               Array.isArray(question.correct_answer) &&
               userAnswer.sort().join(',') === question.correct_answer.sort().join(',');
      case 'true_false':
        return userAnswer === question.correct_answer;
      case 'open_ended':
        // For open-ended, we'd need grading results
        return false; // Default to incorrect for simplicity
      default:
        return false;
    }
  }

  private static extractConcept(questionText: string): string {
    // Extract the main concept from the question
    // This is a simplified implementation - you might want to make it more sophisticated
    const words = questionText.split(' ');
    if (words.length > 10) {
      return words.slice(0, 8).join(' ') + '...';
    }
    return questionText;
  }

  private static formatUserAnswer(userAnswer: any, question: any): string {
    if (question.type === 'open_ended') {
      return typeof userAnswer === 'string' ? userAnswer : 'No answer provided';
    }
    
    if (question.type === 'true_false') {
      return typeof userAnswer === 'boolean' ? (userAnswer ? 'True' : 'False') : 'No answer';
    }

    if (Array.isArray(userAnswer) && question.options) {
      return userAnswer.map(index => question.options[index] || 'Unknown').join(', ');
    }

    return 'No answer provided';
  }

  private static formatCorrectAnswer(correctAnswer: any, question: any): string {
    if (question.type === 'open_ended') {
      return typeof correctAnswer === 'string' ? correctAnswer : 'No model answer';
    }
    
    if (question.type === 'true_false') {
      return typeof correctAnswer === 'boolean' ? (correctAnswer ? 'True' : 'False') : 'Unknown';
    }

    if (Array.isArray(correctAnswer) && question.options) {
      return correctAnswer.map(index => question.options[index] || 'Unknown').join(', ');
    }

    return 'Unknown';
  }
}