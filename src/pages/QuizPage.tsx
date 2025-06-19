import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
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
  RotateCcw,
  Menu,
  X
} from 'lucide-react';
import QuizHeader from '../components/QuizPage/QuizHeader';
import QuizQuestion from '../components/QuizPage/QuizQuestion';
import QuizList from '../components/QuizPage/QuizList';
import CreateQuizForm from '../components/QuizPage/CreateQuizForm';
import RecentAttemptsSidebar from '../components/QuizPage/RecentAttemptsSidebar';

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
  const location = useLocation();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number[] | string)[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuizTopic, setNewQuizTopic] = useState('');
  const [newQuizDifficulty, setNewQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (user) {
      fetchQuizzes();
      fetchAttempts();
    }
  }, [user]);

  // Handle starting a quiz from navigation state
  useEffect(() => {
    if (location.state?.startQuiz) {
      startQuiz(location.state.startQuiz);
      // Clear the state to prevent re-triggering
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate]);

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
    return [
      {
        id: 'q1',
        type: 'single',
        question: `What is the most fundamental concept in ${topic}?`,
        options: ['Basic principle A', 'Basic principle B', 'Basic principle C', 'Basic principle D'],
        correct_answer: [0],
        explanation: `This is the correct answer because it represents the core principle of ${topic}.`
      },
      {
        id: 'q2',
        type: 'multiple',
        question: `Which of the following are important aspects of ${topic}? (Select all that apply)`,
        options: ['Aspect A', 'Aspect B', 'Aspect C', 'Aspect D'],
        correct_answer: [0, 2],
        explanation: `Aspects A and C are both crucial components of ${topic}.`
      },
      {
        id: 'q3',
        type: 'true_false',
        question: `${topic} is considered a fundamental subject in modern education.`,
        options: ['True', 'False'],
        correct_answer: [0],
        explanation: `This statement is true because ${topic} plays a vital role in education.`
      },
      {
        id: 'q4',
        type: 'open_answer',
        question: `Explain in your own words why ${topic} is important in today's world.`,
        correct_answer: [],
        explanation: `This is an open-ended question designed to test your understanding and ability to articulate the importance of ${topic}.`
      }
    ];
  };

  const startQuiz = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setCurrentQuestionIndex(0);
    // Initialize answers based on question type
    const initialAnswers = quiz.questions.map(question => 
      question.type === 'open_answer' ? '' : []
    );
    setSelectedAnswers(initialAnswers);
    setShowSidebar(false);
  };

  const selectSingleAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = [answerIndex];
    setSelectedAnswers(newAnswers);
  };

  const selectMultipleAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    const currentAnswers = Array.isArray(newAnswers[currentQuestionIndex]) 
      ? newAnswers[currentQuestionIndex] as number[]
      : [];
    
    if (currentAnswers.includes(answerIndex)) {
      newAnswers[currentQuestionIndex] = currentAnswers.filter(i => i !== answerIndex);
    } else {
      newAnswers[currentQuestionIndex] = [...currentAnswers, answerIndex];
    }
    setSelectedAnswers(newAnswers);
  };

  const setOpenAnswer = (answer: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answer;
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

      await updateLearningProgress(score);
      
      // Navigate to results page with quiz data
      navigate('/quiz-results', {
        state: {
          quiz: currentQuiz,
          selectedAnswers: selectedAnswers,
          score: score
        }
      });
      
      fetchAttempts();
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
    }
  };

  const calculateScore = (): number => {
    if (!currentQuiz) return 0;
    
    let correct = 0;
    let totalQuestions = 0;

    currentQuiz.questions.forEach((question, index) => {
      if (question.type === 'open_answer') {
        // For open answers, give partial credit if answer exists
        const answer = selectedAnswers[index];
        if (typeof answer === 'string' && answer.trim().length > 0) {
          correct += 0.5; // Give 50% credit for attempting open answer
        }
      } else {
        totalQuestions++;
        const userAnswer = selectedAnswers[index] as number[];
        const correctAnswer = question.correct_answer;
        
        if (question.type === 'single' || question.type === 'true_false') {
          if (userAnswer.length === 1 && userAnswer[0] === correctAnswer[0]) {
            correct++;
          }
        } else if (question.type === 'multiple') {
          const userSet = new Set(userAnswer);
          const correctSet = new Set(correctAnswer);
          if (userSet.size === correctSet.size && 
              [...userSet].every(x => correctSet.has(x))) {
            correct++;
          }
        }
      }
    });
    
    return Math.round((correct / Math.max(totalQuestions, currentQuiz.questions.length)) * 100);
  };

  const updateLearningProgress = async (score: number) => {
    if (!currentQuiz) return;

    const weakAreas: string[] = [];
    const strengths: string[] = [];

    currentQuiz.questions.forEach((question, index) => {
      if (question.type !== 'open_answer') {
        const userAnswer = selectedAnswers[index] as number[];
        const correctAnswer = question.correct_answer;
        let isCorrect = false;

        if (question.type === 'single' || question.type === 'true_false') {
          isCorrect = userAnswer.length === 1 && userAnswer[0] === correctAnswer[0];
        } else if (question.type === 'multiple') {
          const userSet = new Set(userAnswer);
          const correctSet = new Set(correctAnswer);
          isCorrect = userSet.size === correctSet.size && 
                     [...userSet].every(x => correctSet.has(x));
        }

        if (isCorrect) {
          strengths.push(`${currentQuiz.topic} - Question ${index + 1}`);
        } else {
          weakAreas.push(`${currentQuiz.topic} - Question ${index + 1}`);
        }
      }
    });

    try {
      const { data: existingProgress } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', user!.id)
        .eq('topic', currentQuiz.topic)
        .single();

      if (existingProgress) {
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
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const isAnswerSelected = () => {
    const currentAnswer = selectedAnswers[currentQuestionIndex];
    const currentQuestion = currentQuiz!.questions[currentQuestionIndex];
    
    if (currentQuestion.type === 'open_answer') {
      return typeof currentAnswer === 'string' && currentAnswer.trim().length > 0;
    } else {
      return Array.isArray(currentAnswer) && currentAnswer.length > 0;
    }
  };

  const renderQuestionInput = (question: Question) => {
    const currentAnswer = selectedAnswers[currentQuestionIndex];

    switch (question.type) {
      case 'single':
      case 'true_false':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => selectSingleAnswer(index)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  Array.isArray(currentAnswer) && currentAnswer.includes(index)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                    Array.isArray(currentAnswer) && currentAnswer.includes(index)
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  }`}>
                    {Array.isArray(currentAnswer) && currentAnswer.includes(index) && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="text-gray-900">{option}</span>
                </div>
              </button>
            ))}
          </div>
        );

      case 'multiple':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">Select all that apply:</p>
            {question.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => selectMultipleAnswer(index)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  Array.isArray(currentAnswer) && currentAnswer.includes(index)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded border-2 mr-3 flex items-center justify-center ${
                    Array.isArray(currentAnswer) && currentAnswer.includes(index)
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  }`}>
                    {Array.isArray(currentAnswer) && currentAnswer.includes(index) && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="text-gray-900">{option}</span>
                </div>
              </button>
            ))}
          </div>
        );

      case 'open_answer':
        return (
          <div>
            <textarea
              value={typeof currentAnswer === 'string' ? currentAnswer : ''}
              onChange={(e) => setOpenAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full h-32 p-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none resize-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              Provide a detailed explanation in your own words.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  if (currentQuiz) {
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Quiz Header */}
            <QuizHeader
              title={currentQuiz.title}
              current={currentQuestionIndex + 1}
              total={currentQuiz.questions.length}
              progress={progress}
              onExit={resetQuiz}
            />
            {/* Question Content */}
            <div className="p-4 sm:p-6">
              <QuizQuestion
                question={currentQuestion}
                currentAnswer={selectedAnswers[currentQuestionIndex]}
                renderInput={renderQuestionInput}
              />
              {/* Navigation */}
              <div className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
                >
                  Previous
                </button>
                <button
                  onClick={nextQuestion}
                  disabled={!isAnswerSelected()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                >
                  {currentQuestionIndex === currentQuiz.questions.length - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quizzes</h1>
            <p className="text-gray-600">Test your knowledge and track your progress</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="btn-secondary lg:hidden"
            >
              <Menu className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Generate Quiz</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

        {/* Create Quiz Form */}
        {showCreateForm && (
          <CreateQuizForm
            topic={newQuizTopic}
            difficulty={newQuizDifficulty}
            loading={loading}
            onTopicChange={setNewQuizTopic}
            onDifficultyChange={setNewQuizDifficulty}
            onGenerate={generateQuiz}
            onCancel={() => {
              setShowCreateForm(false);
              setNewQuizTopic('');
              setNewQuizDifficulty('medium');
            }}
          />
        )}

        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Available Quizzes</h2>
            {quizzes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
                <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
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
              <QuizList
                quizzes={quizzes}
                onStart={startQuiz}
                getDifficultyColor={getDifficultyColor}
              />
            )}
          </div>

          {/* Sidebar */}
          <RecentAttemptsSidebar
            attempts={attempts}
            showSidebar={showSidebar}
            onClose={() => setShowSidebar(false)}
          />
        </div>
      </div>
    </div>
  );
}