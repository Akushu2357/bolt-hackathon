import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
export default function Recommendations({ actualScore, quizTopic }) {
    const navigate = useNavigate();
    return (_jsxs("div", { className: "card mt-6 sm:mt-8", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx(TrendingUp, { className: "w-6 h-6 text-primary-600 mr-3" }), _jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Next Steps" })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsxs("div", { className: "p-4 bg-primary-50 rounded-lg border border-primary-200", children: [_jsx("h3", { className: "font-medium text-primary-900 mb-2", children: "Continue Learning" }), _jsx("p", { className: "text-sm text-primary-700 mb-3", children: actualScore >= 80
                                    ? 'Try a more challenging quiz or explore advanced topics.'
                                    : 'Review the concepts you missed and practice similar questions.' }), _jsx("button", { onClick: () => navigate('/chat'), className: "text-sm text-primary-600 hover:text-primary-700 font-medium", children: "Ask AI Tutor \u2192" })] }), _jsxs("div", { className: "p-4 bg-green-50 rounded-lg border border-green-200", children: [_jsx("h3", { className: "font-medium text-green-900 mb-2", children: "Practice More" }), _jsxs("p", { className: "text-sm text-green-700 mb-3", children: ["Take more quizzes on ", quizTopic, " to reinforce your learning."] }), _jsx("button", { onClick: () => navigate('/quiz'), className: "text-sm text-green-600 hover:text-green-700 font-medium", children: "More Quizzes \u2192" })] })] })] }));
}
