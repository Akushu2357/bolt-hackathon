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
    </div>
  );
}