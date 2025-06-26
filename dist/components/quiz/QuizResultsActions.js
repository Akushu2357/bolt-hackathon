import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { MessageCircle, RotateCcw, BookOpen } from 'lucide-react';
import { QuizChatIntegrationService } from '../../services/quizChatIntegrationService';
export default function QuizResultsActions({ quizContext, onRetakeQuiz, showChatIntegration = true }) {
    const navigate = useNavigate();
    const handleDiscussWithAI = () => {
        // Store quiz context for chat integration
        QuizChatIntegrationService.storeQuizContext(quizContext);
        // Navigate to chat with integration flag
        navigate('/chat', {
            state: {
                fromQuiz: true,
                quizContext
            }
        });
    };
    const getSuggestedPrompts = () => {
        return QuizChatIntegrationService.generateSuggestedPrompts(quizContext);
    };
    if (!showChatIntegration) {
        return (_jsxs("div", { className: "flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4", children: [_jsxs("button", { onClick: onRetakeQuiz, className: "btn-secondary flex items-center justify-center space-x-2", children: [_jsx(RotateCcw, { className: "w-4 h-4" }), _jsx("span", { children: "Retake Quiz" })] }), _jsxs("button", { onClick: () => navigate('/quiz'), className: "btn-primary flex items-center justify-center space-x-2", children: [_jsx(BookOpen, { className: "w-4 h-4" }), _jsx("span", { children: "More Quizzes" })] })] }));
    }
    return (_jsx("div", { className: "space-y-6", children: _jsx("div", { className: "flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4", children: _jsxs("button", { onClick: handleDiscussWithAI, className: "btn-primary flex items-center justify-center space-x-2", children: [_jsx(MessageCircle, { className: "w-4 h-4" }), _jsx("span", { children: "Discuss with AI Tutor" })] }) }) }));
}
