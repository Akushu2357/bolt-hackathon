import React from 'react';
import { Brain, Lightbulb, Trophy, Target } from 'lucide-react';
import { GradedQuestion } from '../../services/gradingService';

interface Question {
  id: string;
  type: 'single' | 'multiple' | 'true_false' | 'open_ended';
  question: string;
  options?: string[];
  explanation: string;
  correct_answer: number[] | string | boolean;
}

interface Quiz {
  id: string;
  title: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: Question[];
}

interface PerformanceAnalysisProps {
  loadingAnalysis: boolean;
  analysisText: string;
  quiz?: Quiz;
  selectedAnswers?: (number[] | string | boolean)[];
  gradingResults?: GradedQuestion[];
  getAnswerGrade?: (questionIndex: number) => 'correct' | 'partial' | 'incorrect';
}

export default function PerformanceAnalysis({ 
  loadingAnalysis, 
  analysisText, 
  quiz,
  selectedAnswers,
  gradingResults,
  getAnswerGrade
}: PerformanceAnalysisProps) {
  
  // Analyze current quiz performance to extract strengths and weaknesses
  const analyzeCurrentQuiz = () => {
    if (!quiz || !selectedAnswers || !getAnswerGrade) {
      return { strengths: [], weaknesses: [] };
    }

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    quiz.questions.forEach((question, index) => {
      const grade = getAnswerGrade(index);
      const userAnswer = selectedAnswers[index];
      
      // Build answer string safely for all types
      let answerString = '';
      if (question.type === 'open_ended') {
        answerString = typeof userAnswer === 'string' ? userAnswer : '';
      } else if (Array.isArray(userAnswer)) {
        answerString = userAnswer
          .map((value) => question.options && question.options[value] !== undefined ? question.options[value] : value)
          .join(', ');
      } else if (typeof userAnswer === 'boolean') {
        answerString = userAnswer ? 'True' : 'False';
      } else if (
        typeof userAnswer === 'number' &&
        question.options &&
        question.options[userAnswer] !== undefined
      ) {
        answerString = question.options[userAnswer];
      } else {
        answerString = String(userAnswer);
      }

      // Create formatted entry: "question: answer"
      let entryString = `${question.question}: ${answerString}`;
      
      // For open-ended questions, add AI feedback if available
      if (question.type === 'open_ended' && gradingResults) {
        const openEndedQuestions = quiz.questions
          .map((q, idx) => ({ question: q, index: idx }))
          .filter(item => item.question.type === 'open_ended');
        
        const currentQuestionOpenEndedIndex = openEndedQuestions.findIndex(item => item.index === index);
        
        if (currentQuestionOpenEndedIndex >= 0 && currentQuestionOpenEndedIndex < gradingResults.length) {
          const gradingResult = gradingResults[currentQuestionOpenEndedIndex];
          if (gradingResult.feedback) {
            entryString += `: ${gradingResult.feedback}`;
          }
        }
      }
      
      if (grade === 'correct' || grade === 'partial') {
        strengths.push(entryString);
      } else {
        weaknesses.push(entryString);
        
        // Add specific weak areas from grading results for open-ended questions
        if (question.type === 'open_ended' && gradingResults) {
          const openEndedQuestions = quiz.questions
            .map((q, idx) => ({ question: q, index: idx }))
            .filter(item => item.question.type === 'open_ended');
          
          const currentQuestionOpenEndedIndex = openEndedQuestions.findIndex(item => item.index === index);
          
          if (currentQuestionOpenEndedIndex >= 0 && currentQuestionOpenEndedIndex < gradingResults.length) {
            const gradingResult = gradingResults[currentQuestionOpenEndedIndex];
            if (gradingResult.weakAreas && gradingResult.weakAreas.length > 0) {
              gradingResult.weakAreas.forEach(area => {
                weaknesses.push(area);
              });
            }
          }
        }
      }
    });

    // Remove duplicates
    const uniqueStrengths = [...new Set(strengths)];
    const uniqueWeaknesses = [...new Set(weaknesses)];

    return { strengths: uniqueStrengths, weaknesses: uniqueWeaknesses };
  };

  const { strengths, weaknesses } = analyzeCurrentQuiz();

  return (
    <div className="bg-gradient-to-br from-primary-50 via-white to-blue-50 rounded-xl shadow-lg border border-primary-200 p-4 sm:p-6 mb-6 sm:mb-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-blue-500/5 pointer-events-none"></div>
      <div className="relative">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Performance Analysis</h2>
        </div>
        
        {loadingAnalysis ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-3"></div>
            <span className="text-gray-600">Analyzing your performance...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* AI Analysis */}
            <div className="bg-white/80 backdrop-blur-sm border border-primary-200 rounded-lg p-4 sm:p-6">
              <div className="flex items-start">
                <Lightbulb className="w-5 h-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-primary-800 leading-relaxed">{analysisText}</p>
              </div>
            </div>

            {/* Strengths and Areas to Focus from Current Quiz */}
            {(strengths.length > 0 || weaknesses.length > 0) && (
              <div className="bg-white/80 backdrop-blur-sm border border-primary-200 rounded-lg p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <div>
                    <h4 className="text-sm font-medium text-green-700 mb-3 flex items-center">
                      <Trophy className="w-4 h-4 mr-1" />
                      What You Got Right ({strengths.length})
                    </h4>
                    {strengths.length > 0 ? (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {strengths.slice(0, 5).map((strength, index) => (
                          <div key={index} className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded border border-green-200">
                            {strength.length > 80 ? `${strength.substring(0, 80)}...` : strength}
                          </div>
                        ))}
                        {strengths.length > 5 && (
                          <p className="text-xs text-green-600 font-medium">
                            +{strengths.length - 5} more correct answers
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">No correct answers in this quiz</p>
                    )}
                  </div>

                  {/* Areas to Focus */}
                  <div>
                    <h4 className="text-sm font-medium text-red-700 mb-3 flex items-center">
                      <Target className="w-4 h-4 mr-1" />
                      Areas to Review ({weaknesses.length})
                    </h4>
                    {weaknesses.length > 0 ? (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {weaknesses.slice(0, 5).map((weakness, index) => (
                          <div key={index} className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded border border-red-200">
                            {weakness.length > 80 ? `${weakness.substring(0, 80)}...` : weakness}
                          </div>
                        ))}
                        {weaknesses.length > 5 && (
                          <p className="text-xs text-red-600 font-medium">
                            +{weaknesses.length - 5} more areas to review
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">All answers were correct!</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
