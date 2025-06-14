import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  Plus, 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Trophy,
  BookOpen,
  Target,
  RotateCcw
} from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: Question[];
  created_at: string;
}

interface QuizAttempt {
  id: string;
  quiz_id: string;
  score: number;
  completed_at: string;
  quiz: {
    title: string;
    topic: string;
  };
}

export default function QuizPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuizTopic, setNewQuizTopic] = useState('');
  const [newQuizDifficulty, setNewQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  useEffect(() => {
    if (user) {
      fetchQuizzes();
      fetchAttempts();
    }
  }, [user]);

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  const fetchAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quiz:quizzes(title, topic)
        `)
        .eq('user_id', user!.id)
        .order('completed_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAttempts(data || []);
    } catch (error) {
      console.error('Error fetching attempts:', error);
    }
  };

  const generateQuiz = async () => {
    if (!newQuizTopic.trim()) return;

    setLoading(true);
    try {
      // Generate mock questions (replace with actual AI generation)
      const questions: Question[] = generateMockQuestions(newQuizTopic, newQuizDifficulty);
      
      const { data, error } = await supabase
        .from('quizzes')
        .insert({
          user_id: user!.id,
          title: `${newQuizTopic} Quiz`,
          topic: newQuizTopic,
          difficulty: newQuizDifficulty,
          questions: questions
        })
        .select()
        .single();

      if (error) throw error;

      setQuizzes([data, ...quizzes]);
      setShowCreateForm(false);
      setNewQuizTopic('');
    } catch (error) {
      console.error('Error generating quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockQuestions = (topic: string, difficulty: string): Question[] => {
    // Mock question generation - replace with actual AI API
    const baseQuestions = [
      {
        question: `What is a fundamental concept in ${topic}?`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_answer: 0,
        explanation: `This is the correct answer because it represents the core principle of ${topic}.`
      },
      {
        question: `Which of the following best describes ${topic}?`,
        options: ['Description A', 'Description B', 'Description C', 'Description D'],
        correct_answer: 1,
        explanation: `This description accurately captures the essence of ${topic}.`
      },
      {
        question: `In ${topic}, what is the most important factor to consider?`,
        options: ['Factor A', 'Factor B', 'Factor C', 'Factor D'],
        correct_answer: 2,
        explanation: `This factor is crucial for understanding ${topic} properly.`
      }
    ];

    return baseQuestions.map((q, index) => ({
      ...q,
      id: `q${index + 1}`,
      question: q.question.replace('${topic}', topic)
    }));
  };

  const startQuiz = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers(new Array(quiz.questions.length).fill(-1));
    setShowResults(false);
  };

  const selectAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < currentQuiz!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    if (!currentQuiz) return;

    const score = calculateScore();
    
    try {
      await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: currentQuiz.id,
          user_id: user!.id,
          answers: selectedAnswers,
          score: score
        });

      // Update learning progress based on quiz results
      await updateLearningProgress(score);
      
      setShowResults(true);
      fetchAttempts();
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
    }
  };

  const calculateScore = (): number => {
    if (!currentQuiz) return 0;
    
    let correct = 0;
    currentQuiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_answer) {
        correct++;
      }
    });
    
    return Math.round((correct / currentQuiz.questions.length) * 100);
  };

  const updateLearningProgress = async (score: number) => {
    if (!currentQuiz) return;

    const weakAreas: string[] = [];
    const strengths: string[] = [];

    currentQuiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] !== question.correct_answer) {
        weakAreas.push(`${currentQuiz.topic} - Question ${index + 1}`);
      } else {
        strengths.push(`${currentQuiz.topic} - Question ${index + 1}`);
      }
    });

    try {
      const { data: existingProgress } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', user!.id)
        .eq('topic', currentQuiz.topic)
        .maybeSingle();

      if (existingProgress) {
        // Update existing progress
        await supabase
          .from('learning_progress')
          .update({
            weak_areas: [...new Set([...existingProgress.weak_areas, ...weakAreas])],
            strengths: [...new Set([...existingProgress.strengths, ...strengths])],
            progress_score: Math.max(existingProgress.progress_score, score),
            last_updated: new Date().toISOString()
          })
          .eq('id', existingProgress.id);
      } else {
        // Create new progress record
        await supabase
          .from('learning_progress')
          .insert({
            user_id: user!.id,
            topic: currentQuiz.topic,
            weak_areas: weakAreas,
            strengths: strengths,
            progress_score: score
          });
      }
    } catch (error) {
      console.error('Error updating learning progress:', error);
    }
  };

  const resetQuiz = () => {
    setCurrentQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowResults(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (currentQuiz && !showResults) {
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          {/* Quiz Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentQuiz.title}</h1>
              <p className="text-gray-600">
                Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
              </p>
            </div>
            <button
              onClick={resetQuiz}
              className="btn-secondary"
            >
              Exit Quiz
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {currentQuestion.question}
            </h2>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => selectAnswer(index)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedAnswers[currentQuestionIndex] === index
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                      selectedAnswers[currentQuestionIndex] === index
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedAnswers[currentQuestionIndex] === index && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-gray-900">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={nextQuestion}
              disabled={selectedAnswers[currentQuestionIndex] === -1}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestionIndex === currentQuiz.questions.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResults && currentQuiz) {
    const score = calculateScore();
    const correctAnswers = currentQuiz.questions.filter((q, index) => 
      selectedAnswers[index] === q.correct_answer
    ).length;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card text-center">
          <div className="mb-8">
            <Trophy className={`w-16 h-16 mx-auto mb-4 ${
              score >= 80 ? 'text-yellow-500' : score >= 60 ? 'text-gray-400' : 'text-red-500'
            }`} />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
            <p className="text-xl text-gray-600">
              You scored {score}% ({correctAnswers}/{currentQuiz.questions.length})
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {currentQuiz.questions.length - correctAnswers}
              </div>
              <div className="text-sm text-gray-600">Incorrect</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{score}%</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={resetQuiz}
              className="btn-primary mr-4"
            >
              Back to Quizzes
            </button>
            <button
              onClick={() => startQuiz(currentQuiz)}
              className="btn-secondary"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quizzes</h1>
          <p className="text-gray-600">Test your knowledge and track your progress</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Quiz</span>
        </button>
      </div>

      {/* Create Quiz Form */}
      {showCreateForm && (
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate New Quiz</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic
              </label>
              <input
                type="text"
                value={newQuizTopic}
                onChange={(e) => setNewQuizTopic(e.target.value)}
                placeholder="e.g., Mathematics, Physics, History"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={newQuizDifficulty}
                onChange={(e) => setNewQuizDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="input-field"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={generateQuiz}
              disabled={!newQuizTopic.trim() || loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Quiz'}
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Available Quizzes */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Quizzes</h2>
          {quizzes.length === 0 ? (
            <div className="card text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes yet</h3>
              <p className="text-gray-600 mb-4">
                Generate your first quiz to start testing your knowledge
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
              >
                Generate Quiz
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="card hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {quiz.title}
                      </h3>
                      <p className="text-gray-600 mb-2">{quiz.topic}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                          {quiz.difficulty}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {quiz.questions.length} questions
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => startQuiz(quiz)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Attempts */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Attempts</h2>
          {attempts.length === 0 ? (
            <div className="card text-center py-8">
              <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">No attempts yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attempts.map((attempt) => (
                <div key={attempt.id} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {attempt.quiz.title}
                    </h4>
                    <div className={`flex items-center ${
                      attempt.score >= 80 ? 'text-green-600' : 
                      attempt.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {attempt.score >= 80 ? (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-1" />
                      )}
                      <span className="text-sm font-medium">{attempt.score}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(attempt.completed_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}