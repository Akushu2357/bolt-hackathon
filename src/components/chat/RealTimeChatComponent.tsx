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
import GuestLimitModal from '../common/GuestLimitModal';

interface RealTimeChatComponentProps {
  sessionId: string;
  initialMessages?: ChatMessage[];
  onMessageSent?: (message: ChatMessage) => void;
  onQuizGenerated?: (quizId: string) => void;
}

export default function RealTimeChatComponent({
  sessionId,
  initialMessages = [],
  onMessageSent,
  onQuizGenerated
}: RealTimeChatComponentProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCommands, setShowCommands] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
    onMessageSent?.(message);
  }, [onMessageSent]);

  const removeTypingIndicator = useCallback(() => {
    setMessages(prev => prev.filter(msg => !msg.metadata?.isTyping));
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Validate message
    if (!ChatApiService.validateMessage(inputMessage)) {
      setError('Message is too long or empty');
      return;
    }

    // Check guest limits
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

    // Clear input and error
    const messageToSend = inputMessage.trim();
    setInputMessage('');
    setError(null);
    setIsLoading(true);

    // Add user message
    addMessage(userMessage);

    // Add typing indicator
    const typingIndicator = ChatApiService.createTypingIndicator();
    addMessage(typingIndicator);

    try {
      // Get conversation context (last 5 messages)
      const context = messages
        .slice(-5)
        .filter(msg => !msg.metadata?.isTyping)
        .map(msg => `${msg.role}: ${msg.content}`);

      // Send message to API
      const assistantMessage = await ChatApiService.sendMessage(
        messageToSend,
        sessionId,
        context
      );

      // Remove typing indicator
      removeTypingIndicator();

      // Add assistant response
      addMessage(assistantMessage);

      // Handle quiz generation
      if (assistantMessage.type === 'quiz' && assistantMessage.metadata?.quizId) {
        onQuizGenerated?.(assistantMessage.metadata.quizId);
      }

      // Increment guest usage
      if (!user) {
        GuestLimitService.incrementUsage('chat');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove typing indicator
      removeTypingIndicator();

      // Add error message
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        type: 'error',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };

      addMessage(errorMessage);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
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
              ? 'bg-primary-600 text-white'
              : isError
              ? 'bg-red-50 text-red-900 border border-red-200'
              : isQuiz
              ? 'bg-gradient-to-br from-green-50 to-blue-50 text-gray-900 border border-green-200'
              : 'bg-gray-100 text-gray-900'
          }`}>
            {isTyping ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">TutorAI is typing...</span>
              </div>
            ) : (
              <>
                <div className="whitespace-pre-wrap text-sm">
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
                  {new Date(message.timestamp).toLocaleTimeString()}
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
              TutorAI Chat
            </h3>
            <p className="text-sm text-gray-600">
              {user ? 'Unlimited access' : `${guestUsage.chats.remaining} messages left`}
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to TutorAI Chat!
            </h3>
            <p className="text-gray-600 mb-4">
              Ask me anything or use commands to generate quizzes
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => insertCommand('/create-quiz mathematics medium')}
                className="px-4 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg text-sm transition-colors duration-200"
              >
                <Zap className="w-4 h-4 inline mr-1" />
                Generate Math Quiz
              </button>
              <button
                onClick={() => setInputMessage('Explain photosynthesis')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors duration-200"
              >
                Ask about Science
              </button>
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
          <div className="flex space-x-3">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything or type /create-quiz to generate a quiz..."
                className="w-full resize-none input-field text-sm"
                rows={1}
                disabled={isLoading}
                maxLength={2000}
              />
              {!user && (
                <div className="text-xs text-gray-500 mt-1">
                  {guestUsage.chats.remaining}/{guestUsage.chats.total} free messages remaining
                </div>
              )}
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 flex items-center space-x-2"
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