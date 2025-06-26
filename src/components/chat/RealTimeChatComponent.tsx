import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  AlertCircle, 
  Play, 
  HelpCircle,
  Zap,
  MessageSquare
} from 'lucide-react';
import { ChatApiService, ChatMessage } from '../../services/chatApiService';
import { GuestLimitService } from '../../services/guestLimitService';
import { QuizChatContext } from '../../services/quizChatIntegrationService';
import GuestLimitModal from '../common/GuestLimitModal';

interface RealTimeChatComponentProps {
  sessionId: string;
  initialMessages?: ChatMessage[];
  onMessageSent?: (message: ChatMessage) => void;
  onQuizGenerated?: (quizId: string) => void;
  quizContext?: QuizChatContext | null;
}

export default function RealTimeChatComponent({
  sessionId,
  initialMessages = [],
  onMessageSent,
  onQuizGenerated,
  quizContext
}: RealTimeChatComponentProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCommands, setShowCommands] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [hasProcessedInitialMessage, setHasProcessedInitialMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const messageContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (messages.length === 0 && initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);


  // Update messages when initialMessages change
  useEffect(() => {
    if (!hasProcessedInitialMessage && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage.role === 'user' &&
        lastMessage.id.includes('homepage_') &&
        !lastMessage.metadata?.processedFromHomepage
      ) {
        setHasProcessedInitialMessage(true);
        handleBotResponse(lastMessage.content);
      }
    }
  }, [messages, hasProcessedInitialMessage]);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
    onMessageSent?.(message);
  }, [onMessageSent]);

  const removeTypingIndicator = useCallback(() => {
    setMessages(prev => prev.filter(msg => !msg.metadata?.isTyping));
  }, []);

  // Separate function to handle bot response
  const handleBotResponse = async (messageText: string) => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    // Add typing indicator
    const typingIndicator = ChatApiService.createTypingIndicator();
    setMessages(prev => [...prev, typingIndicator]);

    try {
      // Create context from current messages
      const contextMessages = messages.filter(msg => !msg.metadata?.isTyping).slice(-5);
      const context = contextMessages.map(msg => `${msg.role}: ${msg.content}`);

      if (quizContext) {
        context.unshift(`Quiz context: User completed a ${quizContext.topic} quiz (${quizContext.difficulty} difficulty) with ${quizContext.score}% score. Weak areas: ${quizContext.weakAreas.join(', ')}`);
      }

      const assistantMessage = await ChatApiService.sendMessage(
        messageText,
        sessionId,
        context
      );

      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.metadata?.isTyping));

      // Add assistant response
      setMessages(prev => [...prev, assistantMessage]);
      onMessageSent?.(assistantMessage);

      if (assistantMessage.type === 'quiz' && assistantMessage.metadata?.quizId) {
        onQuizGenerated?.(assistantMessage.metadata.quizId);
      }

    } catch (error) {
      console.error('Error getting bot response:', error);

      setMessages(prev => prev.filter(msg => !msg.metadata?.isTyping));

      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        type: 'error',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      };

      setMessages(prev => [...prev, errorMessage]);
      setError(error instanceof Error ? error.message : 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    if (!ChatApiService.validateMessage(inputMessage)) {
      setError('Message is too long or empty');
      return;
    }

    if (!user && !GuestLimitService.canPerformAction('chat')) {
      setShowLimitModal(true);
      return;
    }

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    const messageToSend = inputMessage.trim();
    setInputMessage('');
    setError(null);

    // Add user message
    setMessages(prev => [...prev, userMessage]);
    onMessageSent?.(userMessage);

    // Handle bot response
    await handleBotResponse(messageToSend);

    if (!user) {
      GuestLimitService.incrementUsage('chat');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuizStart = (quizId: string) => {
    // Navigate to quiz page with the generated quiz
    navigate('/quiz', { 
      state: { 
        startQuizId: quizId 
      } 
    });
  };

  const insertCommand = (command: string) => {
    setInputMessage(command);
    setShowCommands(false);
    inputRef.current?.focus();
  };

  const insertQuizPrompt = (prompt: string) => {
    setInputMessage(prompt);
    inputRef.current?.focus();
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    const isTyping = message.metadata?.isTyping;
    const isError = message.type === 'error';
    const isQuiz = message.type === 'quiz';

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isUser 
                ? 'bg-primary-600' 
                : isError
                ? 'bg-red-100'
                : 'bg-gray-200'
            }`}>
              {isUser ? (
                <User className="w-4 h-4 text-white" />
              ) : isError ? (
                <AlertCircle className="w-4 h-4 text-red-600" />
              ) : (
                <Bot className="w-4 h-4 text-gray-600" />
              )}
            </div>
          </div>

          {/* Message Content */}
          <div className={`px-4 py-3 rounded-lg ${
              isUser
                ? 'bg-primary-600 text-white max-w-md'
              : isError
              ? 'bg-red-50 text-red-900 border border-red-200'
              : isQuiz
              ? 'bg-gradient-to-br from-green-50 to-blue-50 text-gray-900 border border-green-200 max-w-md'
              : 'bg-gray-100 text-gray-900 max-w-md'
          }`}>
            {isTyping ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">TutorAI is typing...</span>
              </div>
            ) : (
              <>
                <div className={`whitespace-pre-wrap text-sm ${isUser ? 'text-end' : ''}`}>
                  {message.content}
                </div>
                
                {/* Quiz Action Button */}
                {isQuiz && message.metadata?.quizId && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <button
                      onClick={() => handleQuizStart(message.metadata!.quizId!)}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start Quiz</span>
                    </button>
                  </div>
                )}
                
                {/* Timestamp */}
                <div className={`text-xs mt-2 ${
                  isUser ? 'text-primary-200' : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const canSendMessage = user || GuestLimitService.canPerformAction('chat');
  const guestUsage = GuestLimitService.getUsageSummary();

  // Generate quiz-specific welcome message
  const getWelcomeMessage = () => {
    if (quizContext) {
      return {
        title: `Quiz Discussion: ${quizContext.quizTitle}`,
        subtitle: `Let's discuss your ${quizContext.score}% performance and improve your understanding of ${quizContext.topic}`,
        suggestions: [
          `Explain the concepts I missed in my ${quizContext.topic} quiz`,
          `Help me understand my weak areas: ${quizContext.weakAreas.slice(0, 2).join(', ')}`,
          `Give me practice questions for ${quizContext.topic}`,
          `Create a study plan for improving in ${quizContext.topic}`
        ]
      };
    }

    return {
      title: 'Welcome to TutorAI Chat!',
      subtitle: 'What would you like to learn about today?',
      suggestions: [
        '/create-quiz mathematics medium',
        'Explain photosynthesis',
        'Help me with calculus',
        'Generate a science quiz'
      ]
    };
  };

  const welcomeContent = getWelcomeMessage();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {quizContext ? `Quiz Discussion` : 'TutorAI Chat'}
            </h3>
            <p className="text-sm text-red-600">
              {user ? '' : `*${guestUsage.chats.remaining} messages left`}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowCommands(!showCommands)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          title="Show commands"
        >
          <HelpCircle className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Commands Panel */}
      {showCommands && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="text-sm text-blue-900 mb-3 font-medium">Quick Commands:</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => insertCommand('/create-quiz mathematics medium')}
              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full text-xs transition-colors duration-200"
            >
              /create-quiz mathematics medium
            </button>
            <button
              onClick={() => insertCommand('/quiz science')}
              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full text-xs transition-colors duration-200"
            >
              /quiz science
            </button>
            <button
              onClick={() => insertCommand('/create-quiz history easy')}
              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full text-xs transition-colors duration-200"
            >
              /create-quiz history easy
            </button>
          </div>
          <div className="text-xs text-blue-600 mt-2">
            Type <code>/create-quiz [topic] [difficulty]</code> to generate a custom quiz
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={messageContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {welcomeContent.title}
            </h3>
            <p className="text-gray-600 mb-4">
              {welcomeContent.subtitle}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {welcomeContent.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => insertQuizPrompt(suggestion)}
                  className="px-4 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg text-sm transition-colors duration-200"
                >
                  {suggestion.startsWith('/') ? (
                    <>
                      <Zap className="w-4 h-4 inline mr-1" />
                      {suggestion}
                    </>
                  ) : (
                    suggestion
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        {!canSendMessage ? (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">
              You've used all {guestUsage.chats.total} free chats. Login to continue!
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="btn-primary"
            >
              Login for Unlimited Access
            </button>
          </div>
        ) : (
          <div className="flex space-x-3 justify-center items-center">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={quizContext 
                  ? `Ask about "${quizContext.topic}"`
                  : "Ask me anything."
                }
                className="w-full resize-none input-field text-sm"
                rows={1}
                disabled={isLoading}
                maxLength={2000}
              />
              
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 flex items-center space-x-2 mb-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          
        )}
      </div>

      {/* Guest Limit Modal */}
      <GuestLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        limitType="chat"
      />
    </div>
  );
}