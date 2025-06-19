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

interface Question {
  id: string;
  type: 'single' | 'multiple' | 'true_false' | 'open_answer';
  question: string;
  options?: string[];
  explanation: string;
  correct_answer: number[];
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
  selectedAnswers: (number[] | string)[];
  score: number;
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
      const { quiz, selectedAnswers } = state;
      
      // Calculate correct score properly
      const correctCount = quiz.questions.filter((q, index) => {
        if (q.type === 'open_answer') {
          // For open answers, check if user provided an answer
          const answer = selectedAnswers[index];
          return typeof answer === 'string' && answer.trim().length > 0;
        }
        
        const userAnswer = selectedAnswers[index] as number[];
        const correctAnswer = q.correct_answer;
        
        if (q.type === 'single' || q.type === 'true_false') {
          return userAnswer.length === 1 && userAnswer[0] === correctAnswer[0];
        } else if (q.type === 'multiple') {
          const userSet = new Set(userAnswer);
          const correctSet = new Set(correctAnswer);
          return userSet.size === correctSet.size && 
                 [...userSet].every(x => correctSet.has(x));
        }
        return false;
      }).length;

      // Recalculate the actual score based on correct answers
      const actualScore = Math.round((correctCount / quiz.questions.length) * 100);

      const incorrectQuestions = quiz.questions.filter((q, index) => {
        if (q.type === 'open_answer') {
          const answer = selectedAnswers[index];
          return !(typeof answer === 'string' && answer.trim().length > 0);
        }
        
        const userAnswer = selectedAnswers[index] as number[];
        const correctAnswer = q.correct_answer;
        
        if (q.type === 'single' || q.type === 'true_false') {
          return !(userAnswer.length === 1 && userAnswer[0] === correctAnswer[0]);
        } else if (q.type === 'multiple') {
          const userSet = new Set(userAnswer);
          const correctSet = new Set(correctAnswer);
          return !(userSet.size === correctSet.size && 
                   [...userSet].every(x => correctSet.has(x)));
        }
        return false;
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
      if (missedTypes.includes('open_answer')) {
        analysis += ` Work on articulating your thoughts clearly for open-ended questions.`;
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
    
    if (question.type === 'open_answer') {
      return typeof userAnswer === 'string' && userAnswer.trim().length > 0;
    }
    
    const userAnswerArray = userAnswer as number[];
    const correctAnswer = question.correct_answer;
    
    if (question.type === 'single' || question.type === 'true_false') {
      return userAnswerArray.length === 1 && userAnswerArray[0] === correctAnswer[0];
    } else if (question.type === 'multiple') {
      const userSet = new Set(userAnswerArray);
      const correctSet = new Set(correctAnswer);
      return userSet.size === correctSet.size && 
             [...userSet].every(x => correctSet.has(x));
    }
    
    return false;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 80) return 'bg-blue-50 border-blue-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
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

  const { quiz, selectedAnswers } = state;
  const correctCount = quiz.questions.filter((_, index) => isAnswerCorrect(index)).length;
  const actualScore = Math.round((correctCount / quiz.questions.length) * 100);

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