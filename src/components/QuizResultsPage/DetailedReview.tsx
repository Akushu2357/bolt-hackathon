import React from 'react';
import { BookOpen, CheckCircle, XCircle, Target } from 'lucide-react';
import type { Question } from '../../pages/QuizResultsPage';

interface DetailedReviewProps {
  quizQuestions: Question[];
  selectedAnswers: (number[] | string)[];
  isAnswerCorrect: (index: number) => boolean;
  expandedQuestion: number | null;
  setExpandedQuestion: (index: number | null) => void;
}

export default function DetailedReview({ quizQuestions, selectedAnswers, isAnswerCorrect, expandedQuestion, setExpandedQuestion }: DetailedReviewProps) {
  return (
    <div className="card">
      <div className="flex items-center mb-6">
        <BookOpen className="w-6 h-6 text-gray-700 mr-3" />
        <h2 className="text-xl font-semibold text-gray-900">Detailed Review</h2>
      </div>
      <div className="space-y-6">
        {quizQuestions.map((question, index) => {
          const isCorrect = isAnswerCorrect(index);
          const userAnswer = selectedAnswers[index];
          const isExpanded = expandedQuestion === index;
          return (
            <div key={question.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className={`p-4 sm:p-6 cursor-pointer transition-colors duration-200 ${
                  isCorrect ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'
                }`}
                onClick={() => setExpandedQuestion(isExpanded ? null : index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-2">
                      <span className="text-sm font-medium text-gray-500 mr-3">
                        Question {index + 1}
                      </span>
                      <div className={`flex items-center ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {isCorrect ? (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-1" />
                        )}
                        <span className="text-sm font-medium">
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {question.question}
                    </h3>
                  </div>
                  <div className="ml-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCorrect ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 sm:p-6 bg-white">
                  {question.options && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-3">Answer Options:</h4>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => {
                          const isUserSelected = Array.isArray(userAnswer) && userAnswer.includes(optionIndex);
                          const isCorrectOption = question.correct_answer.includes(optionIndex);
                          return (
                            <div
                              key={optionIndex}
                              className={`p-3 rounded-lg border-2 ${
                                isCorrectOption && isUserSelected
                                  ? 'border-green-500 bg-green-50'
                                  : isCorrectOption
                                  ? 'border-green-500 bg-green-50'
                                  : isUserSelected
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-gray-900">{option}</span>
                                <div className="flex items-center space-x-2">
                                  {isUserSelected && (
                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                      Your Answer
                                    </span>
                                  )}
                                  {isCorrectOption && (
                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                      Correct
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {question.type === 'open_answer' && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Your Answer:</h4>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-gray-800">
                          {typeof userAnswer === 'string' ? userAnswer : 'No answer provided'}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border border-blue-200 rounded-lg p-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 pointer-events-none"></div>
                    <div className="relative flex items-start">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900 mb-2">Explanation:</h4>
                        <p className="text-blue-800 text-sm leading-relaxed">
                          {question.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
