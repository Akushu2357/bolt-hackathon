import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  CheckCircle, 
  BookOpen,
  Menu,
  LogIn,
  Lock
} from 'lucide-react';
import QuizHeader from '../components/QuizPage/QuizHeader';
import QuizQuestion from '../components/QuizPage/QuizQuestion';
import QuizList from '../components/QuizPage/QuizList';
import CreateQuizForm from '../components/QuizPage/CreateQuizForm';
import RecentAttemptsSidebar from '../components/QuizPage/RecentAttemptsSidebar';
import GuestLimitModal from '../components/common/GuestLimitModal';
import { QuizService, QuizSettings } from '../services/quizService';
import { QuizDataService } from '../services/quizDataService';
import { QuizScoringService } from '../services/quizScoringService';
import { LearningProgressService } from '../services/learningProgressService';
import { GuestLimitService } from '../services/guestLimitService';
import { Question, Quiz, QuizAttempt } from '../types';

export default function QuizPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number[] | string | boolean)[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuizTopic, setNewQuizTopic] = useState('');
  const [newQuizDifficulty, setNewQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [showSidebar, setShowSidebar] = useState(false);
  const [guestQuizzes, setGuestQuizzes] = useState<Quiz[]>([]);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalType, setLimitModalType] = useState<'quiz' | 'quizAttempt'>('quiz');
  const [quizSettings, setQuizSettings] = useState<QuizSettings>({
    numberOfQuestions: 5,
    numberOfChoices: 4,
    questionTypes: {
      multipleChoice: true,
      trueFalse: false,
      openEnded: false
    }
  });
  
  useEffect(() => {
    if (user) {
      fetchQuizzes();
      fetchAttempts();
    } else {
      // Load guest quizzes from localStorage
      loadGuestQuizzes();
    }
  }, [user]);

  const loadGuestQuizzes = () => {
    try {
      const savedQuizzes = localStorage.getItem('guestQuizzes');
      if (savedQuizzes) {
        const parsedQuizzes = JSON.parse(savedQuizzes);
        setGuestQuizzes(parsedQuizzes);
      } else {
        setGuestQuizzes([]);
      }
    } catch (error) {
      console.error('Error loading guest quizzes:', error);
      setGuestQuizzes([]);
    }
  };

  const saveGuestQuizzes = (quizzes: Quiz[]) => {
    try {
      localStorage.setItem('guestQuizzes', JSON.stringify(quizzes));
    } catch (error) {
      console.error('Error saving guest quizzes:', error);
    }
  };
  
  // Handle starting a quiz from navigation state
  useEffect(() => {
    if (location.state?.startQuiz) {
      startQuiz(location.state.startQuiz);
      // Clear the state to prevent re-triggering
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate]);

  const fetchQuizzes = async () => {
    if (!user) return;
    try {
      const data = await QuizDataService.fetchQuizzes(user);
      setQuizzes(data);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  const fetchAttempts = async () => {
    if (!user) return;
    try {
      const data = await QuizDataService.fetchAttempts(user);
      setAttempts(data);
    } catch (error) {
      console.error('Error fetching attempts:', error);
    }
  };

  const generateQuiz = async () => {
    if (!newQuizTopic.trim()) return;

    // Check guest limits for quiz generation
    if (!user && !GuestLimitService.canPerformAction('quiz')) {
      setLimitModalType('quiz');
      setShowLimitModal(true);
      return;
    }

    setLoading(true);
    try {
      if (user) {
        // Get user's weak areas for this topic to focus on
        const weakAreas = await QuizService.getUserWeakAreas(user.id, newQuizTopic);
        
        // Generate questions using the quiz service
        const response = await QuizService.generateQuestions({
          topic: newQuizTopic,
          difficulty: newQuizDifficulty,
          contexts: weakAreas.slice(0, 3), // Use top 3 weak areas as context
          settings: quizSettings
        });

        // Save the quiz to database
        const savedQuiz = await QuizDataService.saveQuiz(
          user.id,
          `${newQuizTopic} Quiz`,
          newQuizTopic,
          newQuizDifficulty,
          response.questions
        );

        setQuizzes([savedQuiz, ...quizzes]);
      } else {
        // For guest users, use the real QuizService but store locally
        try {
          const response = await QuizService.generateQuestions({
            topic: newQuizTopic,
            difficulty: newQuizDifficulty,
            contexts: [], // No weak areas for guests
            settings: quizSettings
          });

          const guestQuiz: Quiz = {
            id: `guest-${Date.now()}`,
            title: `${newQuizTopic} Quiz`,
            topic: newQuizTopic,
            difficulty: newQuizDifficulty,
            questions: response.questions,
            created_at: new Date().toISOString()
          };

          const updatedGuestQuizzes = [guestQuiz, ...guestQuizzes];
          setGuestQuizzes(updatedGuestQuizzes);
          saveGuestQuizzes(updatedGuestQuizzes);
          
          // Increment guest usage
          GuestLimitService.incrementUsage('quiz');
        } catch (error) {
          console.error('Error generating quiz for guest, falling back to mock:', error);
        }
      }

      setShowCreateForm(false);
      setNewQuizTopic('');
    } catch (error) {
      console.error('Error generating quiz:', error);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (quiz: Quiz) => {
    // Check guest limits for quiz attempts
    if (!user && !GuestLimitService.canPerformAction('quizAttempt')) {
      setLimitModalType('quizAttempt');
      setShowLimitModal(true);
      return;
    }

    setCurrentQuiz(quiz);
    setCurrentQuestionIndex(0);
    // Initialize answers based on question type
    const initialAnswers = quiz.questions.map(question => {
      switch (question.type) {
        case 'open_ended':
          return '';
        case 'true_false':
          return false;
        default:
          return [];
      }
    });
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

  const selectTrueFalseAnswer = (value: boolean) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = value;
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

    try {
      // Calculate score using the scoring service
      const scoringResult = await QuizScoringService.calculateScore(currentQuiz, selectedAnswers);
      
      if (user) {
        // Save quiz attempt for authenticated users
        await QuizDataService.saveQuizAttempt(
          currentQuiz.id,
          user.id,
          selectedAnswers,
          scoringResult.score
        );

        // Update learning progress
        await LearningProgressService.updateLearningProgress(
          user.id,
          currentQuiz,
          selectedAnswers,
          scoringResult.score,
          scoringResult.gradingResults
        );
        
        fetchAttempts();
      } else {
        // For guest users, just increment the attempt counter
        GuestLimitService.incrementUsage('quizAttempt');
      }
      
      // Navigate to results page with quiz data
      navigate('/quiz-results', {
        state: {
          quiz: currentQuiz,
          selectedAnswers: selectedAnswers,
          score: scoringResult.score,
          gradingResults: scoringResult.gradingResults
        }
      });
      
    } catch (error) {
      console.error('Error finishing quiz:', error);
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
    
    switch (currentQuestion.type) {
      case 'open_ended':
        return typeof currentAnswer === 'string' && currentAnswer.trim().length > 0;
      case 'true_false':
        return typeof currentAnswer === 'boolean';
      default:
        return Array.isArray(currentAnswer) && currentAnswer.length > 0;
    }
  };

  const renderQuestionInput = (question: Question) => {
    const currentAnswer = selectedAnswers[currentQuestionIndex];

    switch (question.type) {
      case 'single':
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

      case 'true_false':
        return (
          <div className="space-y-3">
            {['True', 'False'].map((option, index) => {
              const value = index === 0;
              return (
                <button
                  key={index}
                  onClick={() => selectTrueFalseAnswer(value)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                    currentAnswer === value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                      currentAnswer === value
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300'
                    }`}>
                      {currentAnswer === value && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-gray-900">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        );

      case 'open_ended':
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

  const availableQuizzes = user ? quizzes : guestQuizzes;
  const guestUsage = GuestLimitService.getUsageSummary();
  const canGenerateQuiz = user || GuestLimitService.canPerformAction('quiz');

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
            <p className="text-gray-600">
              {user ? 'Test your knowledge and track your progress' : 'Test your knowledge - Login for detailed analysis'}
            </p>
            {!user && (
              <div className="mt-2 text-sm text-gray-500">
                Quiz generation: {guestUsage.quizzes.remaining}/{guestUsage.quizzes.total} remaining
              </div>
            )}
          </div>
          <div className="flex space-x-3">
            {!user && (
              <button
                onClick={() => navigate('/auth')}
                className="btn-secondary flex items-center space-x-2"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="btn-secondary lg:hidden"
            >
              <Menu className="w-4 h-4" />
            </button>
            <button
              onClick={() => canGenerateQuiz ? setShowCreateForm(true) : setShowLimitModal(true)}
              className={`btn-primary flex items-center space-x-2 ${!canGenerateQuiz ? 'opacity-75' : ''}`}
            >
              {!canGenerateQuiz && <Lock className="w-4 h-4" />}
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Generate Quiz</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

        {/* Guest limit warning */}
        {!user && !canGenerateQuiz && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center space-x-2 text-orange-700">
              <Lock className="w-5 h-5" />
              <span className="font-medium">Quiz Generation Limit Reached</span>
            </div>
            <p className="text-orange-600 text-sm mt-2">
              You've used your free quiz generation. Login to create unlimited quizzes and access detailed analytics!
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="mt-3 btn-primary text-sm"
            >
              Login for Unlimited Access
            </button>
          </div>
        )}

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
            settings={quizSettings}
            onSettingsChange={setQuizSettings}
          />
        )}

        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Available Quizzes</h2>
            {availableQuizzes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
                <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {!user && !canGenerateQuiz ? 'Quiz Limit Reached' : 'No quizzes yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {!user && !canGenerateQuiz 
                    ? 'You\'ve used your free quiz generation. Login for unlimited access!'
                    : 'Generate your first quiz to start testing your knowledge'
                  }
                </p>
                {canGenerateQuiz ? (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="btn-primary"
                  >
                    Generate Quiz
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/auth')}
                    className="btn-primary"
                  >
                    Login for Unlimited Quizzes
                  </button>
                )}
              </div>
            ) : (
              <QuizList
                quizzes={availableQuizzes}
                onStart={startQuiz}
                getDifficultyColor={getDifficultyColor}
              />
            )}
          </div>

          {/* Sidebar - Only show for authenticated users */}
          {user && (
            <RecentAttemptsSidebar
              attempts={attempts}
              showSidebar={showSidebar}
              onClose={() => setShowSidebar(false)}
            />
          )}
        </div>
      </div>

      {/* Guest Limit Modal */}
      <GuestLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        limitType={limitModalType}
      />
    </div>
  );
}