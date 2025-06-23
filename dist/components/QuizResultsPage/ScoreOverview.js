import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Trophy, CheckCircle, XCircle, Star, Eye, EyeOff, RotateCcw, AlertTriangle, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
const getScoreColor = (score) => {
    if (score >= 90)
        return 'text-green-600';
    if (score >= 80)
        return 'text-blue-600';
    if (score >= 60)
        return 'text-yellow-600';
    return 'text-red-600';
};
const getScoreBgColor = (score) => {
    if (score >= 90)
        return 'bg-green-50 border-green-200';
    if (score >= 80)
        return 'bg-blue-50 border-blue-200';
    if (score >= 60)
        return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
};
export default function ScoreOverview({ actualScore, correctCount, totalQuestions, showAnswers, setShowAnswers, retakeQuiz, partialCount = 0 }) {
    const { user } = useAuth();
    const incorrectCount = totalQuestions - correctCount - partialCount;
    return (_jsx("div", { className: `card mb-6 sm:mb-8 ${getScoreBgColor(actualScore)}`, children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "flex justify-center mb-4", children: _jsx(Trophy, { className: `w-12 h-12 sm:w-16 sm:h-16 ${actualScore >= 90 ? 'text-yellow-500' :
                            actualScore >= 80 ? 'text-blue-500' :
                                actualScore >= 60 ? 'text-yellow-600' : 'text-red-500'}` }) }), _jsxs("div", { className: `text-4xl sm:text-5xl font-bold mb-2 ${getScoreColor(actualScore)}`, children: [actualScore, "%"] }), _jsx("p", { className: "text-lg text-gray-700 mb-4", children: partialCount > 0 ? (_jsxs(_Fragment, { children: [correctCount, " correct, ", partialCount, " partial credit, ", incorrectCount, " incorrect out of ", totalQuestions, " questions"] })) : (_jsxs(_Fragment, { children: [correctCount, " out of ", totalQuestions, " questions correct"] })) }), _jsxs("div", { className: `grid ${partialCount > 0 ? 'grid-cols-1 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'} gap-4 mb-6`, children: [_jsxs("div", { className: "text-center p-3 bg-white rounded-lg", children: [_jsx(CheckCircle, { className: "w-6 h-6 text-green-500 mx-auto mb-1" }), _jsx("div", { className: "text-lg font-bold text-green-600", children: correctCount }), _jsx("div", { className: "text-sm text-gray-600", children: "Correct" })] }), partialCount > 0 && (_jsxs("div", { className: "text-center p-3 bg-white rounded-lg", children: [_jsx(AlertTriangle, { className: "w-6 h-6 text-yellow-500 mx-auto mb-1" }), _jsx("div", { className: "text-lg font-bold text-yellow-600", children: partialCount }), _jsx("div", { className: "text-sm text-gray-600", children: "Partial Credit" })] })), _jsxs("div", { className: "text-center p-3 bg-white rounded-lg", children: [_jsx(XCircle, { className: "w-6 h-6 text-red-500 mx-auto mb-1" }), _jsx("div", { className: "text-lg font-bold text-red-600", children: incorrectCount }), _jsx("div", { className: "text-sm text-gray-600", children: "Incorrect" })] }), _jsxs("div", { className: "text-center p-3 bg-white rounded-lg", children: [_jsx(Star, { className: "w-6 h-6 text-primary-500 mx-auto mb-1" }), _jsxs("div", { className: "text-lg font-bold text-primary-600", children: [actualScore, "%"] }), _jsx("div", { className: "text-sm text-gray-600", children: "Score" })] })] }), _jsxs("div", { className: "flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4", children: [_jsxs("button", { onClick: () => setShowAnswers(!showAnswers), className: `btn-primary flex items-center justify-center space-x-2 ${!user ? 'opacity-75' : ''}`, children: [!user && _jsx(Lock, { className: "w-4 h-4" }), showAnswers ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }), _jsxs("span", { children: [showAnswers ? 'Hide' : 'Show', " ", user ? 'Answers' : 'Detailed Results'] })] }), _jsxs("button", { onClick: retakeQuiz, className: "btn-secondary flex items-center justify-center space-x-2", children: [_jsx(RotateCcw, { className: "w-4 h-4" }), _jsx("span", { children: "Retake Quiz" })] })] }), !user && (_jsx("p", { className: "text-sm text-gray-600 mt-4", children: "Login to view detailed explanations and track your progress over time" }))] }) }));
}
