import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  CheckCircle, 
  XCircle, 
  Trophy, 
  Target, 
  TrendingUp,
  ArrowLeft,
  Eye,
  EyeOff,
  Brain,
  Lightbulb,
  BookOpen,
  RotateCcw,
  AlertCircle,
  Star,
  Clock,
  Award,
  BarChart3,
  PieChart
} from 'lucide-react';

import ScoreOverview from '../components/QuizResultsPage/ScoreOverview';
import PerformanceAnalysis from '../components/QuizResultsPage/PerformanceAnalysis';
import DetailedReview from '../components/QuizResultsPage/DetailedReview';
import Recommendations from '../components/QuizResultsPage/Recommendations';
import QuizPerformanceSidebar from '../components/QuizResultsPage/QuizPerformanceSidebar';
import { QuizScoringService } from '../services/quizScoringService';
import { GradedQuestion } from '../services/gradingService';

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

interface QuizResultsState {
  quiz: Quiz;
  selectedAnswers: (number[] | string | boolean)[];
  score: number;
  gradingResults?: GradedQuestion[];
}

interface QuizStats {
  totalQuizzes: number;
  averageScore: number;
  bestScore: number;
  topicStats: { [key: string]: { count: number; avgScore: number } };
  recentAttempts: Array<{
    title: string;
    score: number;
    date: string;
    topic: string;
  }>;
}

export default function QuizResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAnswers, setShowAnswers] = useState(false);
  const [analysisText, setAnalysisText] = useState('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const state = location.state as QuizResultsState;

  useEffect(() => {
    if (!state) {
      navigate('/quiz');
      return;
    }
    generateAnalysis();
    fetchQuizStats();
  }, [state, navigate]);

  const fetchQuizStats = async () => {
    if (!user) return;

    try {
      // Fetch all quiz attempts with quiz details
      const { data: attempts, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quiz:quizzes(title, topic, difficulty)
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      if (attempts && attempts.length > 0) {
        const totalQuizzes = attempts.length;
        const averageScore = Math.round(
          attempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalQuizzes
        );
        const bestScore = Math.max(...attempts.map(a => a.score));

        // Calculate topic statistics
        const topicStats: { [key: string]: { count: number; avgScore: number } } = {};
        attempts.forEach(attempt => {
          const topic = attempt.quiz?.topic || 'Unknown';
          if (!topicStats[topic]) {
            topicStats[topic] = { count: 0, avgScore: 0 };
          }
          topicStats[topic].count++;
          topicStats[topic].avgScore += attempt.score;
        });

        // Calculate averages for topics
        Object.keys(topicStats).forEach(topic => {
          topicStats[topic].avgScore = Math.round(
            topicStats[topic].avgScore / topicStats[topic].count
          );
        });

        // Get recent attempts (last 5)
        const recentAttempts = attempts.slice(0, 5).map(attempt => ({
          title: attempt.quiz?.title || 'Unknown Quiz',
          score: attempt.score,
          date: new Date(attempt.completed_at).toLocaleDateString(),
          topic: attempt.quiz?.topic || 'Unknown'
        }));

        setQuizStats({
          totalQuizzes,
          averageScore,
          bestScore,
          topicStats,
          recentAttempts
        });
      } else {
        setQuizStats({
          totalQuizzes: 0,
          averageScore: 0,
          bestScore: 0,
          topicStats: {},
          recentAttempts: []
        });
      }
    } catch (error) {
      console.error('Error fetching quiz stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const generateAnalysis = async () => {
    if (!state) return;

    setLoadingAnalysis(true);
    try {
      const { quiz, selectedAnswers, gradingResults } = state;
      
      // Calculate correct count using the scoring service
      const correctCount = quiz.questions.filter((q, index) => {
        return QuizScoringService.isQuestionCorrect(q, selectedAnswers[index], gradingResults);
      }).length;

      // Recalculate the actual score based on correct answers
      const actualScore = Math.round((correctCount / quiz.questions.length) * 100);

      const incorrectQuestions = quiz.questions.filter((q, index) => {
        return !QuizScoringService.isQuestionCorrect(q, selectedAnswers[index], gradingResults);
      });

      // Generate personalized analysis using the actual score
      let analysis = '';
      
      if (actualScore >= 90) {
        analysis = `🎉 Outstanding performance! You've demonstrated excellent mastery of ${quiz.topic}. Your ${actualScore}% score shows you have a strong understanding of the core concepts. `;
        if (incorrectQuestions.length > 0) {
          analysis += `Focus on reviewing the ${incorrectQuestions.length} question(s) you missed to achieve perfect understanding. `;
        }
        analysis += `Consider challenging yourself with harder difficulty levels or exploring advanced topics in ${quiz.topic}.`;
      } else if (actualScore >= 80) {
        analysis = `👏 Great job! Your ${actualScore}% score indicates solid understanding of ${quiz.topic}. You're on the right track with ${correctCount} correct answers out of ${quiz.questions.length}. `;
        if (incorrectQuestions.length > 0) {
          analysis += `Review the ${incorrectQuestions.length} areas where you had difficulty - these represent opportunities for growth. `;
        }
        analysis += `With a bit more practice, you'll master this topic completely.`;
      } else if (actualScore >= 60) {
        analysis = `📚 Good effort! You scored ${actualScore}%, showing you understand the basics of ${quiz.topic}. You got ${correctCount} questions right, which is a solid foundation. `;
        analysis += `Focus on the ${incorrectQuestions.length} questions you missed - understanding these concepts will significantly improve your knowledge. `;
        analysis += `Consider reviewing the explanations and taking additional practice quizzes to strengthen your understanding.`;
      } else {
        analysis = `💪 Don't worry - learning is a journey! Your ${actualScore}% score shows you're building foundational knowledge in ${quiz.topic}. `;
        analysis += `You got ${correctCount} questions correct, which means you're already grasping some key concepts. `;
        analysis += `Focus on understanding the explanations for the questions you missed. Consider reviewing the basic concepts and taking the quiz again to track your improvement.`;
      }

      // Add specific recommendations based on question types missed
      const missedTypes = incorrectQuestions.map(q => q.type);
      if (missedTypes.includes('multiple')) {
        analysis += ` Pay special attention to multiple-choice questions - they often test comprehensive understanding of topics.`;
      }
      if (missedTypes.includes('open_ended')) {
        analysis += ` Work on articulating your thoughts clearly for open-ended questions.`;
      }

      // Add insights from grading results if available
      if (gradingResults && gradingResults.length > 0) {
        const partialCredits = gradingResults.filter(r => r.grade === 'partial').length;
        const incorrectOpenEnded = gradingResults.filter(r => r.grade === 'incorrect').length;
        const correctOpenEnded = gradingResults.filter(r => r.grade === 'correct').length;
        
        if (partialCredits > 0) {
          analysis += ` You received partial credit on ${partialCredits} open-ended question(s), showing good understanding that can be improved with more detail and clarity.`;
        }
        
        if (correctOpenEnded > 0) {
          analysis += ` Your ${correctOpenEnded} fully correct open-ended answer(s) demonstrate strong analytical and communication skills.`;
        }
        
        // Extract common weak areas from AI grading
        const allWeakAreas = gradingResults.flatMap(r => r.weakAreas || []);
        const uniqueWeakAreas = [...new Set(allWeakAreas)];
        if (uniqueWeakAreas.length > 0) {
          analysis += ` Key areas to focus on: ${uniqueWeakAreas.slice(0, 3).join(', ')}.`;
        }
      }

      setAnalysisText(analysis);
    } catch (error) {
      console.error('Error generating analysis:', error);
      setAnalysisText('Unable to generate detailed analysis at this time. Please review your answers below.');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const isAnswerCorrect = (questionIndex: number): boolean => {
    if (!state) return false;
    
    const question = state.quiz.questions[questionIndex];
    const userAnswer = state.selectedAnswers[questionIndex];
    
    return QuizScoringService.isQuestionCorrect(question, userAnswer, state.gradingResults);
  };

  const retakeQuiz = () => {
    navigate('/quiz', { 
      state: { 
        startQuiz: state.quiz 
      } 
    });
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Quiz Results Found</h2>
          <p className="text-gray-600 mb-4">Please take a quiz first to see your results.</p>
          <button
            onClick={() => navigate('/quiz')}
            className="btn-primary"
          >
            Go to Quizzes
          </button>
        </div>
      </div>
    );
  }

  const { quiz, selectedAnswers, gradingResults, score: originalScore } = state;
  const correctCount = quiz.questions.filter((_, index) => isAnswerCorrect(index)).length;
  
  // Use the original score from the quiz attempt (which includes AI grading) instead of recalculating
  const actualScore = originalScore || Math.round((correctCount / quiz.questions.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/quiz')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quizzes
          </button>
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Quiz Results: {quiz.title}
            </h1>
            <p className="text-gray-600">{quiz.topic} • {quiz.difficulty} difficulty</p>
          </div>
        </div>

        {/* AI Grading Summary for Open-Ended Questions */}
        {gradingResults && gradingResults.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-xl shadow-lg border border-indigo-200 p-4 sm:p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
              <div className="relative">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">AI Grading Summary</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-lg font-bold text-green-600">
                      {gradingResults.filter(r => r.grade === 'correct').length}
                    </div>
                    <div className="text-sm text-green-700">Fully Correct</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-lg font-bold text-yellow-600">
                      {gradingResults.filter(r => r.grade === 'partial').length}
                    </div>
                    <div className="text-sm text-yellow-700">Partial Credit</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-lg font-bold text-red-600">
                      {gradingResults.filter(r => r.grade === 'incorrect').length}
                    </div>
                    <div className="text-sm text-red-700">Needs Work</div>
                  </div>
                </div>

                {/* Overall Improvements */}
                {gradingResults.some(r => r.improvements && r.improvements.length > 0) && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-indigo-900 mb-2 flex items-center">
                      <Lightbulb className="w-4 h-4 mr-1" />
                      Key Improvement Areas:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {[...new Set(gradingResults.flatMap(r => r.improvements || []))].slice(0, 5).map((improvement, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                          {improvement}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weak Areas */}
                {gradingResults.some(r => r.weakAreas && r.weakAreas.length > 0) && (
                  <div>
                    <h3 className="text-sm font-medium text-purple-900 mb-2 flex items-center">
                      <Target className="w-4 h-4 mr-1" />
                      Concepts to Review:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {[...new Set(gradingResults.flatMap(r => r.weakAreas || []))].slice(0, 5).map((area, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <ScoreOverview
              actualScore={actualScore}
              correctCount={correctCount}
              totalQuestions={quiz.questions.length}
              showAnswers={showAnswers}
              setShowAnswers={setShowAnswers}
              retakeQuiz={retakeQuiz}
            />
            <PerformanceAnalysis
              loadingAnalysis={loadingAnalysis}
              analysisText={analysisText}
            />
            {showAnswers && (
              <DetailedReview
                quizQuestions={quiz.questions}
                selectedAnswers={selectedAnswers}
                isAnswerCorrect={isAnswerCorrect}
                expandedQuestion={expandedQuestion}
                setExpandedQuestion={setExpandedQuestion}
                gradingResults={gradingResults}
              />
            )}
            <Recommendations actualScore={actualScore} quizTopic={quiz.topic} />
          </div>
          {/* Right Sidebar - Quiz Performance Stats */}
          <div className="lg:w-80">
            <QuizPerformanceSidebar
              loadingStats={loadingStats}
              quizStats={quizStats}
              actualScore={actualScore}
              correctCount={correctCount}
              totalQuestions={quiz.questions.length}
              quizDifficulty={quiz.difficulty}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Export types for use in other components
export type { Question, QuizStats };