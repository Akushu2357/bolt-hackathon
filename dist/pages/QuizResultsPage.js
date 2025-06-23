import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Target, ArrowLeft, Brain, Lightbulb, AlertCircle, Lock, LogIn } from 'lucide-react';
import ScoreOverview from '../components/QuizResultsPage/ScoreOverview';
import PerformanceAnalysis from '../components/QuizResultsPage/PerformanceAnalysis';
import DetailedReview from '../components/QuizResultsPage/DetailedReview';
import Recommendations from '../components/QuizResultsPage/Recommendations';
import QuizPerformanceSidebar from '../components/QuizResultsPage/QuizPerformanceSidebar';
import GuestLimitModal from '../components/common/GuestLimitModal';
import { QuizScoringService } from '../services/quizScoringService';
export default function QuizResultsPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showAnswers, setShowAnswers] = useState(false);
    const [analysisText, setAnalysisText] = useState('');
    const [loadingAnalysis, setLoadingAnalysis] = useState(true);
    const [expandedQuestion, setExpandedQuestion] = useState(null);
    const [quizStats, setQuizStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const state = location.state;
    useEffect(() => {
        if (!state) {
            navigate('/quiz');
            return;
        }
        generateAnalysis();
        if (user) {
            fetchQuizStats();
        }
        else {
            setLoadingStats(false);
        }
    }, [state, navigate, user]);
    const fetchQuizStats = async () => {
        if (!user)
            return;
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
            if (error)
                throw error;
            if (attempts && attempts.length > 0) {
                const totalQuizzes = attempts.length;
                const averageScore = Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalQuizzes);
                const bestScore = Math.max(...attempts.map(a => a.score));
                // Calculate topic statistics
                const topicStats = {};
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
                    topicStats[topic].avgScore = Math.round(topicStats[topic].avgScore / topicStats[topic].count);
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
            }
            else {
                setQuizStats({
                    totalQuizzes: 0,
                    averageScore: 0,
                    bestScore: 0,
                    topicStats: {},
                    recentAttempts: []
                });
            }
        }
        catch (error) {
            console.error('Error fetching quiz stats:', error);
        }
        finally {
            setLoadingStats(false);
        }
    };
    const generateAnalysis = async () => {
        if (!state)
            return;
        setLoadingAnalysis(true);
        try {
            const { quiz, selectedAnswers, gradingResults } = state;
            // Calculate correct count using the new grading logic
            const correctCount = quiz.questions.filter((_, index) => getAnswerGrade(index) === 'correct').length;
            const partialCount = quiz.questions.filter((_, index) => getAnswerGrade(index) === 'partial').length;
            // Recalculate the actual score based on correct answers and partial credit
            const actualScore = Math.round(((correctCount + (partialCount * 0.5)) / quiz.questions.length) * 100);
            const incorrectQuestions = quiz.questions.filter((_, index) => {
                return getAnswerGrade(index) === 'incorrect';
            });
            // Generate basic analysis for guest users, detailed for authenticated users
            let analysis = '';
            if (!user) {
                // Basic analysis for guest users
                if (actualScore >= 80) {
                    analysis = `Great job! You scored ${actualScore}% on this ${quiz.topic} quiz. You got ${correctCount} out of ${quiz.questions.length} questions correct. `;
                    analysis += `Login to get detailed feedback, track your progress, and access unlimited quizzes!`;
                }
                else if (actualScore >= 60) {
                    analysis = `Good effort! You scored ${actualScore}% on this ${quiz.topic} quiz. You got ${correctCount} out of ${quiz.questions.length} questions correct. `;
                    analysis += `Login to see detailed explanations, identify weak areas, and improve your understanding!`;
                }
                else {
                    analysis = `You scored ${actualScore}% on this ${quiz.topic} quiz. You got ${correctCount} out of ${quiz.questions.length} questions correct. `;
                    analysis += `Login to access detailed feedback, personalized learning recommendations, and unlimited practice quizzes!`;
                }
            }
            else {
                // Detailed analysis for authenticated users (existing logic)
                if (actualScore >= 90) {
                    analysis = `🎉 Outstanding performance! You've demonstrated excellent mastery of ${quiz.topic}. Your ${actualScore}% score shows you have a strong understanding of the core concepts. `;
                    if (incorrectQuestions.length > 0) {
                        analysis += `Focus on reviewing the ${incorrectQuestions.length} question(s) you missed to achieve perfect understanding. `;
                    }
                    if (partialCount > 0) {
                        analysis += `You received partial credit on ${partialCount} question(s), showing good understanding that can be refined. `;
                    }
                    analysis += `Consider challenging yourself with harder difficulty levels or exploring advanced topics in ${quiz.topic}.`;
                }
                else if (actualScore >= 80) {
                    analysis = `👏 Great job! Your ${actualScore}% score indicates solid understanding of ${quiz.topic}. You're on the right track with ${correctCount} fully correct answers out of ${quiz.questions.length}. `;
                    if (partialCount > 0) {
                        analysis += `You also received partial credit on ${partialCount} question(s), which shows you're grasping the concepts but can improve your explanations. `;
                    }
                    if (incorrectQuestions.length > 0) {
                        analysis += `Review the ${incorrectQuestions.length} areas where you had difficulty - these represent opportunities for growth. `;
                    }
                    analysis += `With a bit more practice, you'll master this topic completely.`;
                }
                else if (actualScore >= 60) {
                    analysis = `📚 Good effort! You scored ${actualScore}%, showing you understand the basics of ${quiz.topic}. You got ${correctCount} questions fully right`;
                    if (partialCount > 0) {
                        analysis += ` and ${partialCount} partially correct`;
                    }
                    analysis += `, which is a solid foundation. `;
                    analysis += `Focus on the ${incorrectQuestions.length} questions you missed - understanding these concepts will significantly improve your knowledge. `;
                    analysis += `Consider reviewing the explanations and taking additional practice quizzes to strengthen your understanding.`;
                }
                else {
                    analysis = `💪 Don't worry - learning is a journey! Your ${actualScore}% score shows you're building foundational knowledge in ${quiz.topic}. `;
                    analysis += `You got ${correctCount} questions fully correct`;
                    if (partialCount > 0) {
                        analysis += ` and ${partialCount} partially correct`;
                    }
                    analysis += `, which means you're already grasping some key concepts. `;
                    analysis += `Focus on understanding the explanations for the questions you missed. Consider reviewing the basic concepts and taking the quiz again to track your improvement.`;
                }
                // Add specific recommendations based on question types missed (only for authenticated users)
                const missedTypes = incorrectQuestions.map(q => q.type);
                if (missedTypes.includes('multiple')) {
                    analysis += ` Pay special attention to multiple-choice questions - they often test comprehensive understanding of topics.`;
                }
                if (missedTypes.includes('open_ended')) {
                    analysis += ` Work on articulating your thoughts clearly for open-ended questions.`;
                }
                // Add insights from grading results if available (only for authenticated users)
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
            }
            setAnalysisText(analysis);
        }
        catch (error) {
            console.error('Error generating analysis:', error);
            setAnalysisText('Unable to generate detailed analysis at this time. Please review your answers below.');
        }
        finally {
            setLoadingAnalysis(false);
        }
    };
    const getAnswerGrade = (questionIndex) => {
        if (!state)
            return 'incorrect';
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
    const isAnswerCorrect = (questionIndex) => {
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
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(AlertCircle, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-2", children: "No Quiz Results Found" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Please take a quiz first to see your results." }), _jsx("button", { onClick: () => navigate('/quiz'), className: "btn-primary", children: "Go to Quizzes" })] }) }));
    }
    const { quiz, selectedAnswers, gradingResults, score: originalScore } = state;
    // Calculate counts for different answer types
    const correctCount = quiz.questions.filter((_, index) => getAnswerGrade(index) === 'correct').length;
    const partialCount = quiz.questions.filter((_, index) => getAnswerGrade(index) === 'partial').length;
    const incorrectCount = quiz.questions.filter((_, index) => getAnswerGrade(index) === 'incorrect').length;
    // Use the original score from the quiz attempt (which includes AI grading) instead of recalculating
    const actualScore = originalScore || Math.round((correctCount / quiz.questions.length) * 100);
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8", children: [_jsxs("div", { className: "mb-6 sm:mb-8", children: [_jsxs("button", { onClick: () => navigate('/quiz'), className: "flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors duration-200", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "Back to Quizzes"] }), _jsxs("div", { className: "text-center", children: [_jsxs("h1", { className: "text-2xl sm:text-3xl font-bold text-gray-900 mb-2", children: ["Quiz Results: ", quiz.title] }), _jsxs("p", { className: "text-gray-600", children: [quiz.topic, " \u2022 ", quiz.difficulty, " difficulty"] }), !user && (_jsxs("div", { className: "mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-center space-x-2 text-blue-700", children: [_jsx(Lock, { className: "w-5 h-5" }), _jsx("span", { className: "font-medium", children: "Limited Guest Access" })] }), _jsx("p", { className: "text-blue-600 text-sm mt-2", children: "Login to access detailed feedback, progress tracking, and unlimited quizzes!" }), _jsxs("button", { onClick: () => navigate('/auth'), className: "mt-3 btn-primary flex items-center space-x-2 mx-auto", children: [_jsx(LogIn, { className: "w-4 h-4" }), _jsx("span", { children: "Login for Full Access" })] })] }))] })] }), user && gradingResults && gradingResults.length > 0 && (_jsx("div", { className: "mb-6 sm:mb-8", children: _jsxs("div", { className: "bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-xl shadow-lg border border-indigo-200 p-4 sm:p-6 relative overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 pointer-events-none" }), _jsxs("div", { className: "relative", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3", children: _jsx(Brain, { className: "w-5 h-5 text-white" }) }), _jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "AI Grading Summary for Open-Ended Questions" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-4", children: [_jsxs("div", { className: "text-center p-3 bg-green-50 rounded-lg border border-green-200", children: [_jsx("div", { className: "text-lg font-bold text-green-600", children: gradingResults.filter(r => r.grade === 'correct').length }), _jsx("div", { className: "text-sm text-green-700", children: "Fully Correct" })] }), _jsxs("div", { className: "text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200", children: [_jsx("div", { className: "text-lg font-bold text-yellow-600", children: gradingResults.filter(r => r.grade === 'partial').length }), _jsx("div", { className: "text-sm text-yellow-700", children: "Partial Credit" })] }), _jsxs("div", { className: "text-center p-3 bg-red-50 rounded-lg border border-red-200", children: [_jsx("div", { className: "text-lg font-bold text-red-600", children: gradingResults.filter(r => r.grade === 'incorrect').length }), _jsx("div", { className: "text-sm text-red-700", children: "Needs Work" })] })] }), gradingResults.some(r => r.improvements && r.improvements.length > 0) && (_jsxs("div", { className: "mb-4", children: [_jsxs("h3", { className: "text-sm font-medium text-indigo-900 mb-2 flex items-center", children: [_jsx(Lightbulb, { className: "w-4 h-4 mr-1" }), "Key Improvement Areas:"] }), _jsx("div", { className: "flex flex-wrap gap-2", children: [...new Set(gradingResults.flatMap(r => r.improvements || []))].slice(0, 5).map((improvement, idx) => (_jsx("span", { className: "text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full", children: improvement }, idx))) })] })), gradingResults.some(r => r.weakAreas && r.weakAreas.length > 0) && (_jsxs("div", { children: [_jsxs("h3", { className: "text-sm font-medium text-purple-900 mb-2 flex items-center", children: [_jsx(Target, { className: "w-4 h-4 mr-1" }), "Concepts to Review:"] }), _jsx("div", { className: "flex flex-wrap gap-2", children: [...new Set(gradingResults.flatMap(r => r.weakAreas || []))].slice(0, 5).map((area, idx) => (_jsx("span", { className: "text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full", children: area }, idx))) })] }))] })] }) })), _jsxs("div", { className: "flex flex-col lg:flex-row gap-6 sm:gap-8", children: [_jsxs("div", { className: "flex-1", children: [_jsx(ScoreOverview, { actualScore: actualScore, correctCount: correctCount, totalQuestions: quiz.questions.length, showAnswers: showAnswers, setShowAnswers: handleShowAnswers, retakeQuiz: retakeQuiz, partialCount: partialCount }), _jsx(PerformanceAnalysis, { loadingAnalysis: loadingAnalysis, analysisText: analysisText }), showAnswers && user && (_jsx(DetailedReview, { quizQuestions: quiz.questions, selectedAnswers: selectedAnswers, isAnswerCorrect: isAnswerCorrect, expandedQuestion: expandedQuestion, setExpandedQuestion: setExpandedQuestion, gradingResults: gradingResults })), _jsx(Recommendations, { actualScore: actualScore, quizTopic: quiz.topic })] }), user && (_jsx("div", { className: "lg:w-80", children: _jsx(QuizPerformanceSidebar, { loadingStats: loadingStats, quizStats: quizStats, actualScore: actualScore, correctCount: correctCount, totalQuestions: quiz.questions.length, quizDifficulty: quiz.difficulty }) }))] })] }), _jsx(GuestLimitModal, { isOpen: showLimitModal, onClose: () => setShowLimitModal(false), limitType: "results", title: "Detailed Results Locked", message: "Login to view detailed quiz analysis, track your progress, and access personalized learning insights!" })] }));
}
