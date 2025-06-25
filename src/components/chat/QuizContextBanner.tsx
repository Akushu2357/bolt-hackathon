import React, { useState } from 'react';
import { X, Trophy, Target, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { QuizChatContext } from '../../services/quizChatIntegrationService';

interface QuizContextBannerProps {
  quizContext: QuizChatContext;
  onDismiss: () => void;
}

export default function QuizContextBanner({ quizContext, onDismiss }: QuizContextBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getPerformanceMessage = (score: number) => {
    if (score >= 80) return 'Great job! Let\'s discuss how to master this topic.';
    if (score >= 60) return 'Good effort! Let\'s work on improving your understanding.';
    return 'Let\'s work together to strengthen your knowledge in this area.';
  };

  return (
    <div className={`border rounded-lg p-4 mb-4 ${getScoreColor(quizContext.score)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900">Quiz Discussion Mode</h3>
              <span className="text-sm px-2 py-1 bg-white rounded-full font-medium">
                {quizContext.score}%
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              {quizContext.quizTitle} • {quizContext.difficulty} difficulty
            </p>
            <p className="text-sm text-gray-600">
              {getPerformanceMessage(quizContext.score)}
            </p>

            {/* Expandable Details */}
            {isExpanded && (
              <div className="mt-4 space-y-3">
                {quizContext.weakAreas.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Target className="w-4 h-4 mr-1" />
                      Areas to Focus On:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {quizContext.weakAreas.slice(0, 5).map((area, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 bg-white rounded-full text-gray-600 border"
                        >
                          {area}
                        </span>
                      ))}
                      {quizContext.weakAreas.length > 5 && (
                        <span className="text-xs px-2 py-1 bg-white rounded-full text-gray-500 border">
                          +{quizContext.weakAreas.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {quizContext.incorrectQuestions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Questions to Review: {quizContext.incorrectQuestions.length}
                    </h4>
                    <div className="text-xs text-gray-600">
                      Ask me about any specific question you'd like to understand better.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white rounded transition-colors duration-200"
            title={isExpanded ? 'Show less' : 'Show more'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-white rounded transition-colors duration-200"
            title="Dismiss"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
}