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
            {/* Score Overview */}
            <div className={`card mb-6 sm:mb-8 ${getScoreBgColor(actualScore)}`}>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <Trophy className={`w-12 h-12 sm:w-16 sm:h-16 ${
                    actualScore >= 90 ? 'text-yellow-500' : 
                    actualScore >= 80 ? 'text-blue-500' : 
                    actualScore >= 60 ? 'text-yellow-600' : 'text-red-500'
                  }`} />
                </div>
                
                <div className={`text-4xl sm:text-5xl font-bold mb-2 ${getScoreColor(actualScore)}`}>
                  {actualScore}%
                </div>
                
                <p className="text-lg text-gray-700 mb-4">
                  {correctCount} out of {quiz.questions.length} questions correct
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
                    <div className="text-lg font-bold text-green-600">{correctCount}</div>
                    <div className="text-sm text-gray-600">Correct</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <XCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
                    <div className="text-lg font-bold text-red-600">{quiz.questions.length - correctCount}</div>
                    <div className="text-sm text-gray-600">Incorrect</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <Star className="w-6 h-6 text-primary-500 mx-auto mb-1" />
                    <div className="text-lg font-bold text-primary-600">{actualScore}%</div>
                    <div className="text-sm text-gray-600">Score</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={() => setShowAnswers(!showAnswers)}
                    className="btn-primary flex items-center justify-center space-x-2"
                  >
                    {showAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{showAnswers ? 'Hide' : 'Show'} Answers</span>
                  </button>
                  <button
                    onClick={retakeQuiz}
                    className="btn-secondary flex items-center justify-center space-x-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retake Quiz</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Performance Analysis */}
            <div className="card mb-6 sm:mb-8">
              <div className="flex items-center mb-4">
                <Brain className="w-6 h-6 text-primary-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Performance Analysis</h2>
              </div>
              
              {loadingAnalysis ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                  <span className="text-gray-600">Analyzing your performance...</span>
                </div>
              ) : (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 sm:p-6">
                  <div className="flex items-start">
                    <Lightbulb className="w-5 h-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-primary-800 leading-relaxed">{analysisText}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Answers */}
            {showAnswers && (
              <div className="card">
                <div className="flex items-center mb-6">
                  <BookOpen className="w-6 h-6 text-gray-700 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">Detailed Review</h2>
                </div>

                <div className="space-y-6">
                  {quiz.questions.map((question, index) => {
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
                            {/* Show options and answers for multiple choice questions */}
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

                            {/* Show open answer */}
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

                            {/* Explanation */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-start">
                                <Target className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
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
            )}

            {/* Recommendations */}
            <div className="card mt-6 sm:mt-8">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-6 h-6 text-primary-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Next Steps</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                  <h3 className="font-medium text-primary-900 mb-2">Continue Learning</h3>
                  <p className="text-sm text-primary-700 mb-3">
                    {actualScore >= 80 
                      ? 'Try a more challenging quiz or explore advanced topics.'
                      : 'Review the concepts you missed and practice similar questions.'
                    }
                  </p>
                  <button
                    onClick={() => navigate('/chat')}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Ask AI Tutor →
                  </button>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-medium text-green-900 mb-2">Practice More</h3>
                  <p className="text-sm text-green-700 mb-3">
                    Take more quizzes on {quiz.topic} to reinforce your learning.
                  </p>
                  <button
                    onClick={() => navigate('/quiz')}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    More Quizzes →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Quiz Performance Stats */}
          <div className="lg:w-80">
            <div className="card sticky top-8">
              <div className="flex items-center mb-4">
                <BarChart3 className="w-5 h-5 text-primary-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Quiz Performance</h2>
              </div>

              {loadingStats ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span className="text-sm text-gray-600">Loading stats...</span>
                </div>
              ) : quizStats ? (
                <div className="space-y-6">
                  {/* Overall Stats */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Overall Statistics</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{quizStats.totalQuizzes}</div>
                        <div className="text-xs text-blue-700">Total Quizzes</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{quizStats.averageScore}%</div>
                        <div className="text-xs text-green-700">Average Score</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg col-span-2">
                        <div className="text-lg font-bold text-yellow-600">{quizStats.bestScore}%</div>
                        <div className="text-xs text-yellow-700">Best Score</div>
                      </div>
                    </div>
                  </div>

                  {/* Current Quiz Performance */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Current Quiz</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Accuracy</span>
                        <span className="text-sm font-medium">{actualScore}%</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Questions</span>
                        <span className="text-sm font-medium">{correctCount}/{quiz.questions.length}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Difficulty</span>
                        <span className={`text-sm font-medium px-2 py-1 rounded text-xs ${
                          quiz.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                          quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {quiz.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Topic Performance */}
                  {Object.keys(quizStats.topicStats).length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Topic Performance</h3>
                      <div className="space-y-2">
                        {Object.entries(quizStats.topicStats).slice(0, 4).map(([topic, stats]) => (
                          <div key={topic} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate">{topic}</div>
                              <div className="text-xs text-gray-500">{stats.count} quiz{stats.count !== 1 ? 'es' : ''}</div>
                            </div>
                            <div className="text-sm font-medium text-gray-700">
                              {stats.avgScore}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Attempts */}
                  {quizStats.recentAttempts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Attempts</h3>
                      <div className="space-y-2">
                        {quizStats.recentAttempts.slice(0, 3).map((attempt, index) => (
                          <div key={index} className="p-2 bg-gray-50 rounded">
                            <div className="flex justify-between items-start mb-1">
                              <div className="text-sm font-medium text-gray-900 truncate flex-1 mr-2">
                                {attempt.title}
                              </div>
                              <div className={`text-sm font-medium ${
                                attempt.score >= 80 ? 'text-green-600' : 
                                attempt.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {attempt.score}%
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-xs text-gray-500">{attempt.topic}</div>
                              <div className="text-xs text-gray-500">{attempt.date}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Performance Trend */}
                  <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                    <div className="flex items-center mb-2">
                      <TrendingUp className="w-4 h-4 text-primary-600 mr-2" />
                      <span className="text-sm font-medium text-primary-900">Performance Insight</span>
                    </div>
                    <p className="text-xs text-primary-700">
                      {actualScore > quizStats.averageScore 
                        ? `Great job! This score is ${actualScore - quizStats.averageScore}% above your average.`
                        : actualScore === quizStats.averageScore
                        ? 'This score matches your average performance.'
                        : `This score is ${quizStats.averageScore - actualScore}% below your average. Keep practicing!`
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <PieChart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No statistics available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}