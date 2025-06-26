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
  PieChart,
  Lock,
  LogIn
} from 'lucide-react';

import ScoreOverview from '../components/QuizResultsPage/ScoreOverview';
import PerformanceAnalysis from '../components/QuizResultsPage/PerformanceAnalysis';
import DetailedReview from '../components/QuizResultsPage/DetailedReview';
import Recommendations from '../components/QuizResultsPage/Recommendations';
import QuizPerformanceSidebar from '../components/QuizResultsPage/QuizPerformanceSidebar';
import QuizResultsActions from '../components/quiz/QuizResultsActions';
import GuestQuizLimitations from '../components/quiz/GuestQuizLimitations';
import GuestLimitModal from '../components/common/GuestLimitModal';
import { QuizScoringService } from '../services/quizScoringService';
import { QuizChatIntegrationService } from '../services/quizChatIntegrationService';
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
  const { user, loading } = useAuth();
  const [showAnswers, setShowAnswers] = useState(false);
  const [analysisText, setAnalysisText] = useState('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const state = location.state as QuizResultsState;

  useEffect(() => {
    if (!state) {
      navigate('/quiz');
      return;
    }
    generateAnalysis();
    if (loading) return;
    if (user) {
      fetchQuizStats();
    } else {
      setLoadingStats(false);
    }
  }, [state, navigate, user, loading]);

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
      
      // Calculate correct count using the new grading logic
      const correctCount = quiz.questions.filter((_, index) => getAnswerGrade(index) === 'correct').length;
      const partialCount = quiz.questions.filter((_, index) => getAnswerGrade(index) === 'partial').length;
      const incorrectCount = quiz.questions.filter((_, index) => getAnswerGrade(index) === 'incorrect').length;

      // Recalculate the actual score based on correct answers and partial credit
      const actualScore = Math.round(((correctCount + (partialCount * 0.5)) / quiz.questions.length) * 100);

      // Analyze strengths and weaknesses from current quiz
      const strengths = [];
      const weaknesses = [];
      
      quiz.questions.forEach((question, index) => {
        const grade = getAnswerGrade(index);
        
        if (grade === 'correct' || grade === 'partial') {
          // Identify topic/concept from question
          const concept = question.question.length > 60 
            ? question.question.substring(0, 60) + "..." 
            : question.question;
          strengths.push(concept);
        } else {
          const concept = question.question.length > 60 
            ? question.question.substring(0, 60) + "..." 
            : question.question;
          weaknesses.push(concept);
        }
      });

      // Extract weak areas from AI grading for more specific insights
      const aiWeakAreas = gradingResults ? 
        [...new Set(gradingResults.flatMap(r => r.weakAreas || []))] : [];
      
      const aiImprovements = gradingResults ? 
        [...new Set(gradingResults.flatMap(r => r.improvements || []))] : [];

      // Generate dynamic analysis
      let analysis = '';
      
      if (!user) {
        // Basic analysis for guest users
        analysis = `You completed the ${quiz.topic} quiz with a score of ${actualScore}% (${correctCount}/${quiz.questions.length} correct`;
        if (partialCount > 0) {
          analysis += `, ${partialCount} partial`;
        }
        analysis += `). `;
        
        if (actualScore >= 70) {
          analysis += `This shows good understanding of the topic. `;
        } else {
          analysis += `There's room for improvement in your understanding of this topic. `;
        }
        
        analysis += `Login to get detailed feedback, track your progress, and access unlimited quizzes!`;
      } else {
        // Dynamic analysis for authenticated users
        analysis = `Your performance on this ${quiz.topic} quiz (${quiz.difficulty} difficulty) resulted in a ${actualScore}% score. `;
        
        // Overall performance assessment
        if (actualScore >= 90) {
          analysis += `This demonstrates excellent mastery of the subject matter. `;
        } else if (actualScore >= 80) {
          analysis += `This indicates a solid understanding with room for minor improvements. `;
        } else if (actualScore >= 60) {
          analysis += `This shows a good foundation with several areas that need strengthening. `;
        } else {
          analysis += `This suggests you're still building your knowledge in this area. `;
        }

        // Strengths analysis
        if (correctCount > 0) {
          analysis += `Your strengths were evident in ${correctCount} question${correctCount > 1 ? 's' : ''} where you demonstrated clear understanding. `;
          
          if (partialCount > 0) {
            analysis += `Additionally, you showed partial understanding in ${partialCount} question${partialCount > 1 ? 's' : ''}, indicating you're on the right track but could benefit from more detailed explanations. `;
          }
        }

        // Areas to focus on
        if (incorrectCount > 0) {
          analysis += `There are ${incorrectCount} area${incorrectCount > 1 ? 's' : ''} that require your attention for improvement. `;
          
          // Add specific weak areas from AI grading if available
          if (aiWeakAreas.length > 0) {
            analysis += `Based on your responses, focus particularly on: ${aiWeakAreas.slice(0, 3).join(', ')}. `;
          }
        }

        // Question type analysis
        const questionTypes = quiz.questions.map(q => q.type);
        const hasOpenEnded = questionTypes.includes('open_ended');
        const hasMultiple = questionTypes.includes('multiple');
        
        if (hasOpenEnded && gradingResults) {
          const openEndedCorrect = gradingResults.filter(r => r.grade === 'correct').length;
          const openEndedPartial = gradingResults.filter(r => r.grade === 'partial').length;
          const openEndedTotal = gradingResults.length;
          
          if (openEndedCorrect > 0) {
            analysis += `Your open-ended responses showed strong analytical thinking in ${openEndedCorrect}/${openEndedTotal} questions. `;
          }
          if (openEndedPartial > 0) {
            analysis += `You partially understood ${openEndedPartial} open-ended concept${openEndedPartial > 1 ? 's' : ''} - work on providing more comprehensive explanations. `;
          }
        }

        // Improvement suggestions
        if (aiImprovements.length > 0) {
          analysis += `To improve, consider focusing on: ${aiImprovements.slice(0, 2).join(' and ')}. `;
        }

        // Next steps recommendation
        if (actualScore >= 80) {
          analysis += `You're ready to tackle more challenging questions or explore advanced topics in ${quiz.topic}.`;
        } else if (actualScore >= 60) {
          analysis += `Review the concepts you missed and consider taking additional practice quizzes to solidify your understanding.`;
        } else {
          analysis += `I recommend reviewing the fundamental concepts of ${quiz.topic} before attempting more advanced material.`;
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

  const getAnswerGrade = (questionIndex: number): 'correct' | 'partial' | 'incorrect' => {
    if (!state) return 'incorrect';
    
    const question = state.quiz.questions[questionIndex];
    const userAnswer = state.selectedAnswers[questionIndex];
    
    // For open-ended questions, check grading results by position
    if (question.type === 'open_ended' && state.gradingResults) {
      // Find the position of this open-ended question among all open-ended questions
      const openEndedQuestions = state.quiz.questions
        .map((q, index) => ({ question: q, index }))
        .filter(item => item.question.type === 'open_ended');
      
      const currentQuestionOpenEndedIndex = openEndedQuestions.findIndex(item => item.index === questionIndex);
      
      if (currentQuestionOpenEndedIndex >= 0 && currentQuestionOpenEndedIndex < state.gradingResults.length) {
        const gradingResult = state.gradingResults[currentQuestionOpenEndedIndex];
        return gradingResult.grade;
      }
    }
    
    // For other question types, use the existing logic
    return QuizScoringService.isQuestionCorrect(question, userAnswer, state.gradingResults) ? 'correct' : 'incorrect';
  };

  const isAnswerCorrect = (questionIndex: number): boolean => {
    return getAnswerGrade(questionIndex) === 'correct';
  };

  const retakeQuiz = () => {
    navigate('/quiz', { 
      state: { 
        startQuiz: state.quiz 
      } 
    });
  };

  const handleShowAnswers = () => {
    if (!user) {
      setShowLimitModal(true);
      return;
    }
    setShowAnswers(!showAnswers);
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
  
  // Calculate counts for different answer types
  const correctCount = quiz.questions.filter((_, index) => getAnswerGrade(index) === 'correct').length;
  const partialCount = quiz.questions.filter((_, index) => getAnswerGrade(index) === 'partial').length;
  const incorrectCount = quiz.questions.filter((_, index) => getAnswerGrade(index) === 'incorrect').length;
  
  // Use the original score from the quiz attempt (which includes AI grading) instead of recalculating
  const actualScore = originalScore || Math.round((correctCount / quiz.questions.length) * 100);

  // Create quiz context for chat integration
  const quizContext = QuizChatIntegrationService.formatQuizResultsForChat(
    quiz,
    selectedAnswers,
    actualScore,
    gradingResults
  );

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
            {!user && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-center space-x-2 text-blue-700">
                  <Lock className="w-5 h-5" />
                  <span className="font-medium">Limited Guest Access</span>
                </div>
                <p className="text-blue-600 text-sm mt-2">
                  Login to access detailed feedback, progress tracking, and unlimited quizzes!
                </p>
                <button
                  onClick={() => navigate('/auth')}
                  className="mt-3 btn-primary flex items-center space-x-2 mx-auto"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login for Full Access</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* AI Grading Summary for Open-Ended Questions - Only for authenticated users */}
        {user && gradingResults && gradingResults.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-xl shadow-lg border border-indigo-200 p-4 sm:p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
              <div className="relative">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">AI Grading Summary for Open-Ended Questions</h2>
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
              setShowAnswers={handleShowAnswers}
              retakeQuiz={retakeQuiz}
              partialCount={partialCount}
              quizContext={quizContext}        // ต้องมีตัวแปรนี้อยู่แล้วใน Parent
              showChatIntegration={true}       // ถ้าอยากแสดงปุ่ม Discuss
            />
            
            <PerformanceAnalysis
              loadingAnalysis={loadingAnalysis}
              analysisText={analysisText}
              quiz={quiz}
              selectedAnswers={selectedAnswers}
              gradingResults={gradingResults}
              getAnswerGrade={getAnswerGrade}
            />

            {/* Quiz Results Actions - Different for guest vs authenticated users
            <div className="mb-6 sm:mb-8">
              {user ? (
                <QuizResultsActions
                  quizContext={quizContext}
                  onRetakeQuiz={retakeQuiz}
                  showChatIntegration={true}
                />
              ) : (
                <GuestQuizLimitations
                  score={actualScore}
                  totalQuestions={quiz.questions.length}
                  correctCount={correctCount}
                  onRetakeQuiz={retakeQuiz}
                />
              )}
            </div> */}
            
            {showAnswers && user && (
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
          {/* Right Sidebar - Quiz Performance Stats - Only for authenticated users */}
          {user && (
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
          )}
        </div>
      </div>

      {/* Guest Limit Modal */}
      <GuestLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        limitType="results"
        title="Detailed Results Locked"
        message="Login to view detailed quiz analysis, track your progress, and access personalized learning insights!"
      />
    </div>
  );
}

// Export types for use in other components
export type { Question, QuizStats };