import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, RotateCcw, BookOpen, ArrowRight } from 'lucide-react';
import { QuizChatIntegrationService, QuizChatContext } from '../../services/quizChatIntegrationService';

interface QuizResultsActionsProps {
  quizContext: QuizChatContext;
  onRetakeQuiz: () => void;
  showChatIntegration?: boolean;
}

export default function QuizResultsActions({ 
  quizContext, 
  onRetakeQuiz, 
  showChatIntegration = true 
}: QuizResultsActionsProps) {
  const navigate = useNavigate();

  const handleDiscussWithAI = () => {
    // Store quiz context for chat integration
    QuizChatIntegrationService.storeQuizContext(quizContext);
    
    // Navigate to chat with integration flag
    navigate('/chat', {
      state: {
        fromQuiz: true,
        quizContext
      }
    });
  };

  const getSuggestedPrompts = () => {
    return QuizChatIntegrationService.generateSuggestedPrompts(quizContext);
  };

  if (!showChatIntegration) {
    return (
      <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
        <button
          onClick={onRetakeQuiz}
          className="btn-secondary flex items-center justify-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retake Quiz</span>
        </button>
        <button
          onClick={() => navigate('/quiz')}
          className="btn-primary flex items-center justify-center space-x-2"
        >
          <BookOpen className="w-4 h-4" />
          <span>More Quizzes</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Actions */}
      <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
        <button
          onClick={handleDiscussWithAI}
          className="btn-primary flex items-center justify-center space-x-2"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Discuss with AI Tutor</span>
        </button>
        <button
          onClick={onRetakeQuiz}
          className="btn-secondary flex items-center justify-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retake Quiz</span>
        </button>
      </div>

      {/* Suggested Discussion Topics */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-xl border border-blue-200 p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
          <MessageCircle className="w-4 h-4 mr-2" />
          Suggested Discussion Topics:
        </h3>
        <div className="space-y-2">
          {getSuggestedPrompts().slice(0, 3).map((prompt, index) => (
            <button
              key={index}
              onClick={() => {
                QuizChatIntegrationService.storeQuizContext(quizContext);
                navigate('/chat', {
                  state: {
                    fromQuiz: true,
                    quizContext,
                    initialMessage: prompt
                  }
                });
              }}
              className="w-full text-left p-3 bg-white hover:bg-blue-50 border border-blue-200 hover:border-blue-300 rounded-lg transition-all duration-200 text-sm text-blue-800 hover:text-blue-900"
            >
              <div className="flex items-center justify-between">
                <span className="flex-1 pr-2">{prompt}</span>
                <ArrowRight className="w-4 h-4 text-blue-500" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}