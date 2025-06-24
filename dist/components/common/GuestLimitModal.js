import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { X, Lock, LogIn, Star } from 'lucide-react';
import { GuestLimitService } from '../../services/guestLimitService';
export default function GuestLimitModal({ isOpen, onClose, limitType, title, message }) {
    const navigate = useNavigate();
    if (!isOpen)
        return null;
    const handleLogin = () => {
        onClose();
        navigate('/auth');
    };
    const getDefaultContent = () => {
        const usage = GuestLimitService.getUsageSummary();
        switch (limitType) {
            case 'chat':
                return {
                    title: 'Chat Limit Reached',
                    message: `You've used all ${usage.chats.total} free chat messages. Login to get unlimited access to our AI tutor!`,
                    icon: _jsx(Lock, { className: "w-12 h-12 text-primary-500" })
                };
            case 'quiz':
                return {
                    title: 'Quiz Generation Limit Reached',
                    message: `You've generated ${usage.quizzes.total} free quizzes. Login to create unlimited custom quizzes!`,
                    icon: _jsx(Lock, { className: "w-12 h-12 text-primary-500" })
                };
            case 'quizAttempt':
                return {
                    title: 'Quiz Attempt Limit Reached',
                    message: `You've taken ${usage.quizAttempts.total} free quiz attempts. Login to take unlimited quizzes!`,
                    icon: _jsx(Lock, { className: "w-12 h-12 text-primary-500" })
                };
            case 'results':
                return {
                    title: 'Detailed Results Locked',
                    message: 'Login to view detailed quiz analysis, track your progress, and access personalized learning insights!',
                    icon: _jsx(Lock, { className: "w-12 h-12 text-primary-500" })
                };
            default:
                return {
                    title: 'Feature Locked',
                    message: 'Login to access this feature and unlock the full TutorAI experience!',
                    icon: _jsx(Lock, { className: "w-12 h-12 text-primary-500" })
                };
        }
    };
    // Get usage summary once so it's available in JSX
    const usage = GuestLimitService.getUsageSummary();
    const content = {
        title: title || getDefaultContent().title,
        message: message || getDefaultContent().message,
        icon: getDefaultContent().icon
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative", children: [_jsx("button", { onClick: onClose, className: "absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors", children: _jsx(X, { className: "w-5 h-5" }) }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mb-4", children: content.icon }), _jsx("h2", { className: "text-xl font-bold text-gray-900 mb-3", children: content.title }), _jsx("p", { className: "text-gray-600 mb-6", children: content.message }), limitType !== 'results' && (_jsxs("div", { className: "bg-gray-50 rounded-lg p-4 mb-6", children: [_jsx("h3", { className: "text-sm font-medium text-gray-700 mb-3", children: "Your Usage" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Chat Messages:" }), _jsxs("span", { className: "font-medium", children: [usage.chats.used, "/", usage.chats.total] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Quiz Generation:" }), _jsxs("span", { className: "font-medium", children: [usage.quizzes.used, "/", usage.quizzes.total] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Quiz Attempts:" }), _jsxs("span", { className: "font-medium", children: [usage.quizAttempts.used, "/", usage.quizAttempts.total] })] })] })] })), _jsxs("div", { className: "space-y-3", children: [_jsxs("button", { onClick: handleLogin, className: "w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2", children: [_jsx(LogIn, { className: "w-5 h-5" }), _jsx("span", { children: "Login for Unlimited Access" })] }), _jsxs("div", { className: "flex items-center justify-center space-x-2 text-sm text-gray-500", children: [_jsx(Star, { className: "w-4 h-4 text-yellow-500" }), _jsx("span", { children: "Free account \u2022 No credit card required" })] }), _jsx("button", { onClick: onClose, className: "w-full text-gray-600 hover:text-gray-800 font-medium py-2 transition-colors duration-200", children: "Continue as Guest" })] })] })] }) }));
}
