import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, CheckCircle, BookOpen, Menu, LogIn, Lock } from 'lucide-react';
import QuizHeader from '../components/QuizPage/QuizHeader';
import QuizQuestion from '../components/QuizPage/QuizQuestion';
import QuizList from '../components/QuizPage/QuizList';
import CreateQuizForm from '../components/QuizPage/CreateQuizForm';
import RecentAttemptsSidebar from '../components/QuizPage/RecentAttemptsSidebar';
import GuestLimitModal from '../components/common/GuestLimitModal';
import { QuizService } from '../services/quizService';
import { QuizDataService } from '../services/quizDataService';
import { QuizScoringService } from '../services/quizScoringService';
import { LearningProgressService } from '../services/learningProgressService';
import { GuestLimitService } from '../services/guestLimitService';
export default function QuizPage() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [attempts, setAttempts] = useState([]);
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newQuizTopic, setNewQuizTopic] = useState('');
    const [newQuizDifficulty, setNewQuizDifficulty] = useState('medium');
    const [showSidebar, setShowSidebar] = useState(false);
    const [guestQuizzes, setGuestQuizzes] = useState([]);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [limitModalType, setLimitModalType] = useState('quiz');
    const [quizSettings, setQuizSettings] = useState({
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
        }
        else {
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
            }
            else {
                setGuestQuizzes([]);
            }
        }
        catch (error) {
            console.error('Error loading guest quizzes:', error);
            setGuestQuizzes([]);
        }
    };
    const saveGuestQuizzes = (quizzes) => {
        try {
            localStorage.setItem('guestQuizzes', JSON.stringify(quizzes));
        }
        catch (error) {
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
        if (!user)
            return;
        try {
            const data = await QuizDataService.fetchQuizzes(user);
            setQuizzes(data);
        }
        catch (error) {
            console.error('Error fetching quizzes:', error);
        }
    };
    const fetchAttempts = async () => {
        if (!user)
            return;
        try {
            const data = await QuizDataService.fetchAttempts(user);
            setAttempts(data);
        }
        catch (error) {
            console.error('Error fetching attempts:', error);
        }
    };
    const generateQuiz = async () => {
        if (!newQuizTopic.trim())
            return;
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
                const savedQuiz = await QuizDataService.saveQuiz(user.id, `${newQuizTopic} Quiz`, newQuizTopic, newQuizDifficulty, response.questions);
                setQuizzes([savedQuiz, ...quizzes]);
            }
            else {
                // For guest users, use the real QuizService but store locally
                try {
                    const response = await QuizService.generateQuestions({
                        topic: newQuizTopic,
                        difficulty: newQuizDifficulty,
                        contexts: [], // No weak areas for guests
                        settings: quizSettings
                    });
                    const guestQuiz = {
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
                }
                catch (error) {
                    console.error('Error generating quiz for guest, falling back to mock:', error);
                }
            }
            setShowCreateForm(false);
            setNewQuizTopic('');
        }
        catch (error) {
            console.error('Error generating quiz:', error);
            // You might want to show an error message to the user here
        }
        finally {
            setLoading(false);
        }
    };
    const startQuiz = (quiz) => {
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
    const selectSingleAnswer = (answerIndex) => {
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestionIndex] = [answerIndex];
        setSelectedAnswers(newAnswers);
    };
    const selectMultipleAnswer = (answerIndex) => {
        const newAnswers = [...selectedAnswers];
        const currentAnswers = Array.isArray(newAnswers[currentQuestionIndex])
            ? newAnswers[currentQuestionIndex]
            : [];
        if (currentAnswers.includes(answerIndex)) {
            newAnswers[currentQuestionIndex] = currentAnswers.filter(i => i !== answerIndex);
        }
        else {
            newAnswers[currentQuestionIndex] = [...currentAnswers, answerIndex];
        }
        setSelectedAnswers(newAnswers);
    };
    const selectTrueFalseAnswer = (value) => {
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestionIndex] = value;
        setSelectedAnswers(newAnswers);
    };
    const setOpenAnswer = (answer) => {
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestionIndex] = answer;
        setSelectedAnswers(newAnswers);
    };
    const nextQuestion = () => {
        if (currentQuestionIndex < currentQuiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
        else {
            finishQuiz();
        }
    };
    const finishQuiz = async () => {
        if (!currentQuiz)
            return;
        try {
            // Calculate score using the scoring service
            const scoringResult = await QuizScoringService.calculateScore(currentQuiz, selectedAnswers);
            if (user) {
                // Save quiz attempt for authenticated users
                await QuizDataService.saveQuizAttempt(currentQuiz.id, user.id, selectedAnswers, scoringResult.score);
                // Update learning progress
                await LearningProgressService.updateLearningProgress(user.id, currentQuiz, selectedAnswers, scoringResult.score, scoringResult.gradingResults);
                fetchAttempts();
            }
            else {
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
        }
        catch (error) {
            console.error('Error finishing quiz:', error);
        }
    };
    const resetQuiz = () => {
        setCurrentQuiz(null);
        setCurrentQuestionIndex(0);
        setSelectedAnswers([]);
    };
    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'easy': return 'text-green-600 bg-green-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'hard': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };
    const isAnswerSelected = () => {
        const currentAnswer = selectedAnswers[currentQuestionIndex];
        const currentQuestion = currentQuiz.questions[currentQuestionIndex];
        switch (currentQuestion.type) {
            case 'open_ended':
                return typeof currentAnswer === 'string' && currentAnswer.trim().length > 0;
            case 'true_false':
                return typeof currentAnswer === 'boolean';
            default:
                return Array.isArray(currentAnswer) && currentAnswer.length > 0;
        }
    };
    const renderQuestionInput = (question) => {
        const currentAnswer = selectedAnswers[currentQuestionIndex];
        switch (question.type) {
            case 'single':
                return (_jsx("div", { className: "space-y-3", children: question.options?.map((option, index) => (_jsx("button", { onClick: () => selectSingleAnswer(index), className: `w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${Array.isArray(currentAnswer) && currentAnswer.includes(index)
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`, children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${Array.isArray(currentAnswer) && currentAnswer.includes(index)
                                        ? 'border-primary-500 bg-primary-500'
                                        : 'border-gray-300'}`, children: Array.isArray(currentAnswer) && currentAnswer.includes(index) && (_jsx("div", { className: "w-2 h-2 bg-white rounded-full" })) }), _jsx("span", { className: "text-gray-900", children: option })] }) }, index))) }));
            case 'multiple':
                return (_jsxs("div", { className: "space-y-3", children: [_jsx("p", { className: "text-sm text-gray-600 mb-4", children: "Select all that apply:" }), question.options?.map((option, index) => (_jsx("button", { onClick: () => selectMultipleAnswer(index), className: `w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${Array.isArray(currentAnswer) && currentAnswer.includes(index)
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`, children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `w-6 h-6 rounded border-2 mr-3 flex items-center justify-center ${Array.isArray(currentAnswer) && currentAnswer.includes(index)
                                            ? 'border-primary-500 bg-primary-500'
                                            : 'border-gray-300'}`, children: Array.isArray(currentAnswer) && currentAnswer.includes(index) && (_jsx(CheckCircle, { className: "w-4 h-4 text-white" })) }), _jsx("span", { className: "text-gray-900", children: option })] }) }, index)))] }));
            case 'true_false':
                return (_jsx("div", { className: "space-y-3", children: ['True', 'False'].map((option, index) => {
                        const value = index === 0;
                        return (_jsx("button", { onClick: () => selectTrueFalseAnswer(value), className: `w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${currentAnswer === value
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`, children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${currentAnswer === value
                                            ? 'border-primary-500 bg-primary-500'
                                            : 'border-gray-300'}`, children: currentAnswer === value && (_jsx("div", { className: "w-2 h-2 bg-white rounded-full" })) }), _jsx("span", { className: "text-gray-900", children: option })] }) }, index));
                    }) }));
            case 'open_ended':
                return (_jsxs("div", { children: [_jsx("textarea", { value: typeof currentAnswer === 'string' ? currentAnswer : '', onChange: (e) => setOpenAnswer(e.target.value), placeholder: "Type your answer here...", className: "w-full h-32 p-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none resize-none" }), _jsx("p", { className: "text-sm text-gray-500 mt-2", children: "Provide a detailed explanation in your own words." })] }));
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
        return (_jsx("div", { className: "min-h-screen bg-gray-50", children: _jsx("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8", children: _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200", children: [_jsx(QuizHeader, { title: currentQuiz.title, current: currentQuestionIndex + 1, total: currentQuiz.questions.length, progress: progress, onExit: resetQuiz }), _jsxs("div", { className: "p-4 sm:p-6", children: [_jsx(QuizQuestion, { question: currentQuestion, renderInput: renderQuestionInput }), _jsxs("div", { className: "flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 sm:space-x-4", children: [_jsx("button", { onClick: () => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1)), disabled: currentQuestionIndex === 0, className: "btn-secondary disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1", children: "Previous" }), _jsx("button", { onClick: nextQuestion, disabled: !isAnswerSelected(), className: "btn-primary disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2", children: currentQuestionIndex === currentQuiz.questions.length - 1 ? 'Finish' : 'Next' })] })] })] }) }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl sm:text-3xl font-bold text-gray-900", children: "Quizzes" }), _jsx("p", { className: "text-gray-600", children: user ? 'Test your knowledge and track your progress' : 'Test your knowledge - Login for detailed analysis' }), !user && (_jsxs("div", { className: "mt-2 text-sm text-gray-500", children: ["Quiz generation: ", guestUsage.quizzes.remaining, "/", guestUsage.quizzes.total, " remaining"] }))] }), _jsxs("div", { className: "flex space-x-3", children: [!user && (_jsxs("button", { onClick: () => navigate('/auth'), className: "btn-secondary flex items-center space-x-2", children: [_jsx(LogIn, { className: "w-4 h-4" }), _jsx("span", { className: "hidden sm:inline", children: "Login" })] })), _jsx("button", { onClick: () => setShowSidebar(!showSidebar), className: "btn-secondary lg:hidden", children: _jsx(Menu, { className: "w-4 h-4" }) }), _jsxs("button", { onClick: () => canGenerateQuiz ? setShowCreateForm(true) : setShowLimitModal(true), className: `btn-primary flex items-center space-x-2 ${!canGenerateQuiz ? 'opacity-75' : ''}`, children: [!canGenerateQuiz && _jsx(Lock, { className: "w-4 h-4" }), _jsx(Plus, { className: "w-4 h-4" }), _jsx("span", { className: "hidden sm:inline", children: "Generate Quiz" }), _jsx("span", { className: "sm:hidden", children: "New" })] })] })] }), !user && !canGenerateQuiz && (_jsxs("div", { className: "mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-2 text-orange-700", children: [_jsx(Lock, { className: "w-5 h-5" }), _jsx("span", { className: "font-medium", children: "Quiz Generation Limit Reached" })] }), _jsx("p", { className: "text-orange-600 text-sm mt-2", children: "You've used your free quiz generation. Login to create unlimited quizzes and access detailed analytics!" }), _jsx("button", { onClick: () => navigate('/auth'), className: "mt-3 btn-primary text-sm", children: "Login for Unlimited Access" })] })), showCreateForm && (_jsx(CreateQuizForm, { topic: newQuizTopic, difficulty: newQuizDifficulty, loading: loading, onTopicChange: setNewQuizTopic, onDifficultyChange: setNewQuizDifficulty, onGenerate: generateQuiz, onCancel: () => {
                            setShowCreateForm(false);
                            setNewQuizTopic('');
                            setNewQuizDifficulty('medium');
                        }, settings: quizSettings, onSettingsChange: setQuizSettings })), _jsxs("div", { className: "flex flex-col lg:flex-row gap-6 sm:gap-8", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h2", { className: "text-lg sm:text-xl font-semibold text-gray-900 mb-4", children: "Available Quizzes" }), availableQuizzes.length === 0 ? (_jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center", children: [_jsx(BookOpen, { className: "w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: !user && !canGenerateQuiz ? 'Quiz Limit Reached' : 'No quizzes yet' }), _jsx("p", { className: "text-gray-600 mb-4", children: !user && !canGenerateQuiz
                                                    ? 'You\'ve used your free quiz generation. Login for unlimited access!'
                                                    : 'Generate your first quiz to start testing your knowledge' }), canGenerateQuiz ? (_jsx("button", { onClick: () => setShowCreateForm(true), className: "btn-primary", children: "Generate Quiz" })) : (_jsx("button", { onClick: () => navigate('/auth'), className: "btn-primary", children: "Login for Unlimited Quizzes" }))] })) : (_jsx(QuizList, { quizzes: availableQuizzes, onStart: startQuiz, getDifficultyColor: getDifficultyColor }))] }), user && (_jsx(RecentAttemptsSidebar, { attempts: attempts, showSidebar: showSidebar, onClose: () => setShowSidebar(false) }))] })] }), _jsx(GuestLimitModal, { isOpen: showLimitModal, onClose: () => setShowLimitModal(false), limitType: limitModalType })] }));
}
