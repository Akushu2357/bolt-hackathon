import { supabase } from '../lib/supabase';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type?: 'text' | 'quiz' | 'error';
  metadata?: {
    quizId?: string;
    isTyping?: boolean;
    error?: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  isActive: boolean;
}

export interface QuizGenerationRequest {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  numberOfQuestions?: number;
  context?: string;
}

export class ChatApiService {
  private static readonly API_BASE_URL = import.meta.env.VITE_SUPABASE_URL;

  /**
   * Get authentication headers for API requests
   */
  private static async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    };
  }

  /**
   * Send a message to the chat API and get a response
   */
  static async sendMessage(
    message: string,
    sessionId: string,
    context?: string[]
  ): Promise<ChatMessage> {
    try {
      // Check if message is a quiz generation command
      if (message.startsWith('/create-quiz') || message.startsWith('/quiz')) {
        return await this.handleQuizCommand(message, sessionId);
      }

      // Use secure edge function for AI chat
      return await this.sendToSecureAI(message, context);
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message. Please try again.');
    }
  }

  /**
   * Send message to secure AI edge function
   */
  private static async sendToSecureAI(
    message: string,
    context?: string[]
  ): Promise<ChatMessage> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.API_BASE_URL}/functions/v1/chat-ai`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          context: context || [],
          sessionId: `session_${Date.now()}`
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: data.response || data.message || 'I apologize, but I encountered an issue processing your request.',
        timestamp: new Date().toISOString(),
        type: 'text'
      };
    } catch (error) {
      console.error('Error calling secure AI function:', error);
      // Fallback to mock response
      return await this.sendToMockAPI(message);
    }
  }

  /**
   * Fallback mock API for development/demo
   */
  private static async sendToMockAPI(message: string): Promise<ChatMessage> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const responses = [
      "That's a great question! Let me help you understand this concept better.",
      "I can see you're working on this topic. Here's a clear explanation...",
      "Excellent! Let me break this down step by step for you.",
      "This is an important concept in your studies. Here's how it works...",
      "I'd be happy to help you with that! Let me provide some guidance.",
      "That's a thoughtful question. Here's what you need to know...",
      "Great topic to explore! Let me give you a comprehensive explanation.",
      "I can help clarify that for you. Here's the key information..."
    ];

    // Check for quiz-related keywords
    const quizKeywords = ['quiz', 'test', 'questions', 'assessment', 'practice'];
    const hasQuizKeyword = quizKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    let response = responses[Math.floor(Math.random() * responses.length)];

    if (hasQuizKeyword) {
      response += "\n\nIf you'd like to create a quiz on this topic, you can use the command:\n`/create-quiz [topic] [difficulty]`\n\nFor example: `/create-quiz mathematics medium`";
    }

    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
      type: 'text'
    };
  }

  /**
   * Handle quiz generation commands
   */
  private static async handleQuizCommand(
    command: string,
    sessionId: string
  ): Promise<ChatMessage> {
    try {
      // Parse command safely
      const parts = command.trim().split(' ');
      const validDifficulties = ['easy', 'medium', 'hard'];
      const maybeDifficulty = parts[parts.length - 1];
      const hasValidDifficulty = validDifficulties.includes(maybeDifficulty);

      const finalDifficulty = hasValidDifficulty ? maybeDifficulty : 'medium';
      const topic = hasValidDifficulty
        ? parts.slice(1, parts.length - 1).join(' ')
        : parts.slice(1).join(' ');

      if (!topic.trim()) {
        return {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: `❌ Please specify a topic for the quiz.\n\nExample: \`/create-quiz mathematics medium\``,
          timestamp: new Date().toISOString(),
          type: 'error'
        };
      }

      const quizRequest: QuizGenerationRequest = {
        topic,
        difficulty: finalDifficulty as 'easy' | 'medium' | 'hard',
        numberOfQuestions: 5,
        context: `Generated from chat command: ${command}`
      };

      const quiz = await this.generateQuizFromChat(quizRequest);

      return {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `🎯 **Quiz Generated: ${topic}**\n\nDifficulty: ${finalDifficulty}\nQuestions: ${quiz.questions.length}\n\nClick the button below to start the quiz!`,
        timestamp: new Date().toISOString(),
        type: 'quiz',
        metadata: {
          quizId: quiz.id
        }
      };
    } catch (error) {
      console.error('Error generating quiz from command:', error);
      return {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `❌ Sorry, I couldn't generate a quiz right now. Please try again later or check your command format.\n\nExample: \`/create-quiz mathematics medium\``,
        timestamp: new Date().toISOString(),
        type: 'error',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Generate quiz from chat context
   */
  private static async generateQuizFromChat(
    request: QuizGenerationRequest
  ): Promise<any> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.API_BASE_URL}/functions/v1/generate-questions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        topic: request.topic,
        difficulty: request.difficulty,
        contexts: request.context ? [request.context] : [],
        settings: {
          numberOfQuestions: request.numberOfQuestions || 5,
          numberOfChoices: 4,
          questionTypes: {
            multipleChoice: true,
            trueFalse: false,
            openEnded: false
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Quiz generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Create a temporary quiz object for the chat
    const quiz = {
      id: `chat_quiz_${Date.now()}`,
      title: `${request.topic} Quiz`,
      topic: request.topic,
      difficulty: request.difficulty,
      questions: data.questions,
      created_at: new Date().toISOString()
    };

    // Store in localStorage for guest users or database for authenticated users
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Save to database for authenticated users
      const { data: savedQuiz, error } = await supabase
        .from('quizzes')
        .insert({
          user_id: user.id,
          title: quiz.title,
          topic: quiz.topic,
          difficulty: quiz.difficulty,
          questions: quiz.questions
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving quiz to database:', error);
        // Continue with temporary quiz
      } else {
        quiz.id = savedQuiz.id;
      }
    } else {
      // Store in localStorage for guest users
      const guestQuizzes = JSON.parse(localStorage.getItem('guestQuizzes') || '[]');
      guestQuizzes.unshift(quiz);
      localStorage.setItem('guestQuizzes', JSON.stringify(guestQuizzes));
    }

    return quiz;
  }

  /**
   * Get typing indicator
   */
  static createTypingIndicator(): ChatMessage {
    return {
      id: `typing_${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      type: 'text',
      metadata: {
        isTyping: true
      }
    };
  }

  /**
   * Validate message content
   */
  static validateMessage(message: string): boolean {
    return message.trim().length > 0 && message.length <= 2000;
  }

  /**
   * Extract quiz commands from message
   */
  static isQuizCommand(message: string): boolean {
    return message.startsWith('/create-quiz') || message.startsWith('/quiz');
  }

  /**
   * Get available commands help
   */
  static getCommandsHelp(): string {
    return `**Available Commands:**
    
🎯 **Quiz Commands:**
• \`/create-quiz [topic] [difficulty]\` - Generate a custom quiz
• \`/quiz [topic]\` - Generate a quiz with default settings

**Examples:**
• \`/create-quiz mathematics medium\`
• \`/create-quiz history easy\`
• \`/quiz science\`

**Difficulty levels:** easy, medium, hard`;
  }
}