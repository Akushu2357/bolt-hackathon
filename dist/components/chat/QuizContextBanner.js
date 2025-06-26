import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { X, Trophy, Target, ChevronDown, ChevronUp } from 'lucide-react';
export default function QuizContextBanner({ quizContext, onDismiss }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const getScoreColor = (score) => {
        if (score >= 80)
            return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 60)
            return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };
    const getPerformanceMessage = (score) => {
        if (score >= 80)
            return 'Great job! Let\'s discuss how to master this topic.';
        if (score >= 60)
            return 'Good effort! Let\'s work on improving your understanding.';
        return 'Let\'s work together to strengthen your knowledge in this area.';
    };
    return (_jsx("div", { className: `border rounded-lg p-4 mb-4 ${getScoreColor(quizContext.score)}`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-start space-x-3 flex-1", children: [_jsx("div", { className: "w-10 h-10 bg-white rounded-lg flex items-center justify-center", children: _jsx(Trophy, { className: "w-5 h-5 text-primary-600" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-1", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: "Quiz Discussion Mode" }), _jsxs("span", { className: "text-sm px-2 py-1 bg-white rounded-full font-medium", children: [quizContext.score, "%"] })] }), _jsxs("p", { className: "text-sm text-gray-700 mb-2", children: [quizContext.quizTitle, " \u2022 ", quizContext.difficulty, " difficulty"] }), _jsx("p", { className: "text-sm text-gray-600", children: getPerformanceMessage(quizContext.score) }), isExpanded && (_jsxs("div", { className: "mt-4 space-y-3", children: [quizContext.weakAreas.length > 0 && (_jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium text-gray-700 mb-2 flex items-center", children: [_jsx(Target, { className: "w-4 h-4 mr-1" }), "Areas to Focus On:"] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [quizContext.weakAreas.slice(0, 5).map((area, index) => (_jsx("span", { className: "text-xs px-2 py-1 bg-white rounded-full text-gray-600 border", children: area }, index))), quizContext.weakAreas.length > 5 && (_jsxs("span", { className: "text-xs px-2 py-1 bg-white rounded-full text-gray-500 border", children: ["+", quizContext.weakAreas.length - 5, " more"] }))] })] })), quizContext.incorrectQuestions.length > 0 && (_jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium text-gray-700 mb-2", children: ["Questions to Review: ", quizContext.incorrectQuestions.length] }), _jsx("div", { className: "text-xs text-gray-600", children: "Ask me about any specific question you'd like to understand better." })] }))] }))] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: () => setIsExpanded(!isExpanded), className: "p-1 hover:bg-white rounded transition-colors duration-200", title: isExpanded ? 'Show less' : 'Show more', children: isExpanded ? (_jsx(ChevronUp, { className: "w-4 h-4 text-gray-500" })) : (_jsx(ChevronDown, { className: "w-4 h-4 text-gray-500" })) }), _jsx("button", { onClick: onDismiss, className: "p-1 hover:bg-white rounded transition-colors duration-200", title: "Dismiss", children: _jsx(X, { className: "w-4 h-4 text-gray-500" }) })] })] }) }));
}
