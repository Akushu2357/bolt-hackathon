import React from 'react';
import { User, Bot, AlertCircle, Play } from 'lucide-react';
import { ChatMessage } from '../../services/chatApiService';

interface MessageBubbleProps {
  message: ChatMessage;
  onQuizStart?: (quizId: string) => void;
}

export default function MessageBubble({ message, onQuizStart }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isError = message.type === 'error';
  const isQuiz = message.type === 'quiz';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
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
          <div className="whitespace-pre-wrap text-sm">
            {message.content}
          </div>
          
          {/* Quiz Action Button */}
          {isQuiz && message.metadata?.quizId && onQuizStart && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <button
                onClick={() => onQuizStart(message.metadata!.quizId!)}
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
        </div>
      </div>
    </div>
  );
}