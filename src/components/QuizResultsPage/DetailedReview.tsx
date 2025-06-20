import { BookOpen, CheckCircle, XCircle, Target, Lightbulb, AlertTriangle, Brain } from 'lucide-react';
import { QuizScoringService } from '../../services/quizScoringService';
import { GradedQuestion } from '../../services/gradingService';

interface Question {
  id: string;
  type: 'single' | 'multiple' | 'true_false' | 'open_ended';
  question: string;
  options?: string[];
  explanation: string;
  correct_answer: number[] | string | boolean;
}

interface DetailedReviewProps {
  quizQuestions: Question[];
  selectedAnswers: (number[] | string | boolean)[];
  isAnswerCorrect: (index: number) => boolean;
  expandedQuestion: number | null;
  setExpandedQuestion: (index: number | null) => void;
  gradingResults?: GradedQuestion[];
}

export default function DetailedReview({ 
  quizQuestions, 
  selectedAnswers, 
  isAnswerCorrect, 
  expandedQuestion, 
  setExpandedQuestion,
  gradingResults 
}: DetailedReviewProps) {
  
  const getGradingResult = (questionIndex: number): GradedQuestion | undefined => {
    if (!gradingResults) return undefined;
    
    // For open-ended questions, we need to match by position in the grading results array
    // since grading results are returned in the same order as the questions were sent
    const openEndedQuestions = quizQuestions
      .map((q, index) => ({ question: q, index }))
      .filter(item => item.question.type === 'open_ended');
    
    const currentQuestionOpenEndedIndex = openEndedQuestions.findIndex(item => item.index === questionIndex);
    
    if (currentQuestionOpenEndedIndex >= 0 && currentQuestionOpenEndedIndex < gradingResults.length) {
      return gradingResults[currentQuestionOpenEndedIndex];
    }
    
    return undefined;
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'correct': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'incorrect': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

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
          const feedback = QuizScoringService.getAnswerFeedback(question, userAnswer, gradingResults);
          const gradingResult = getGradingResult(index);
          
          return (
            <div key={`${question.id}-${index}`} className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className={`p-4 sm:p-6 cursor-pointer transition-colors duration-200 ${
                  isCorrect ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'
                }`}
                onClick={() => setExpandedQuestion(isExpanded ? null : index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-2 flex-wrap gap-2">
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
                      {gradingResult && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getGradeColor(gradingResult.grade)}`}>
                          AI: {gradingResult.grade} ({Math.round(gradingResult.score * 100)}%)
                        </span>
                      )}
                      {feedback.score !== undefined && (
                        <span className="text-sm ml-2 px-2 py-1 bg-gray-100 rounded">
                          Score: {Math.round(feedback.score * 100)}%
                        </span>
                      )}
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
                  {/* Show answer options for multiple choice questions */}
                  {question.options && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-3">Answer Options:</h4>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => {
                          const isUserSelected = Array.isArray(userAnswer) && userAnswer.includes(optionIndex);
                          const isCorrectOption = Array.isArray(question.correct_answer) && 
                                                question.correct_answer.includes(optionIndex);
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

                  {/* Show true/false answers */}
                  {question.type === 'true_false' && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Your Answer:</h4>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-gray-800">
                          {typeof userAnswer === 'boolean' ? (userAnswer ? 'True' : 'False') : 'No answer provided'}
                        </p>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2 mt-3">Correct Answer:</h4>
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-green-800">
                          {typeof question.correct_answer === 'boolean' ? 
                            (question.correct_answer ? 'True' : 'False') : 
                            String(question.correct_answer)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Show open-ended answers with AI feedback */}
                  {question.type === 'open_ended' && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Your Answer:</h4>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-gray-800">
                          {typeof userAnswer === 'string' ? userAnswer : 'No answer provided'}
                        </p>
                      </div>
                      
                      {/* AI Grading Feedback */}
                      {gradingResult && (
                        <div className="mt-4 space-y-3">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h5 className="font-medium text-blue-900 mb-2 flex items-center">
                              <Brain className="w-4 h-4 mr-1" />
                              AI Feedback:
                            </h5>
                            <p className="text-blue-800 text-sm leading-relaxed">
                              {gradingResult.feedback}
                            </p>
                          </div>

                          {/* Specific Improvements */}
                          {gradingResult.improvements && gradingResult.improvements.length > 0 && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                              <h5 className="font-medium text-orange-900 mb-2 flex items-center">
                                <Lightbulb className="w-4 h-4 mr-1" />
                                Suggestions for Improvement:
                              </h5>
                              <ul className="space-y-1">
                                {gradingResult.improvements.map((improvement, idx) => (
                                  <li key={idx} className="text-sm text-orange-700 flex items-start">
                                    <span className="text-orange-500 mr-2">•</span>
                                    {improvement}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Weak Areas */}
                          {gradingResult.weakAreas && gradingResult.weakAreas.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <h5 className="font-medium text-red-900 mb-2 flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                Areas to Focus On:
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {gradingResult.weakAreas.map((area, idx) => (
                                  <span key={idx} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                                    {area}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Model Answer */}
                      {typeof question.correct_answer === 'string' && (
                        <>
                          <h4 className="font-medium text-gray-900 mb-2 mt-4">Model Answer:</h4>
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-green-800 text-sm">
                              {question.correct_answer}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Show general explanation for non-open-ended questions */}
                  {question.type !== 'open_ended' && (
                    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border border-blue-200 rounded-lg p-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 pointer-events-none"></div>
                      <div className="relative flex items-start">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                          <Target className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900 mb-2">General Explanation:</h4>
                          <p className="text-blue-800 text-sm leading-relaxed">
                            {feedback.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}