import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Bot, User, Loader2, AlertCircle, Play, HelpCircle, Zap, MessageSquare } from 'lucide-react';
import { ChatApiService } from '../../services/chatApiService';
import { GuestLimitService } from '../../services/guestLimitService';
import GuestLimitModal from '../common/GuestLimitModal';
export default function RealTimeChatComponent({ sessionId, initialMessages = [], onMessageSent, onQuizGenerated, quizContext }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [messages, setMessages] = useState(initialMessages);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showCommands, setShowCommands] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    // Auto-scroll to bottom when new messages arrive
    const messageContainerRef = useRef(null);
    const scrollToBottom = () => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);
    // Handle prefilled message from URL parameter
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const prefilledMessage = urlParams.get('prefill');
        if (prefilledMessage) {
            setInputMessage(decodeURIComponent(prefilledMessage));
            // Clear the URL parameter
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate]);
    // Load guest messages on mount for guest users
    useEffect(() => {
        if (!user && messages.length === 0) {
            try {
                const savedMessages = localStorage.getItem('guestMessages');
                if (savedMessages) {
                    const parsedMessages = JSON.parse(savedMessages);
                    if (Array.isArray(parsedMessages)) {
                        setMessages(parsedMessages);
                    }
                }
            }
            catch (err) {
                console.error('Error loading guest messages:', err);
            }
        }
    }, [user, messages.length]);
    // Update messages when initialMessages change
    useEffect(() => {
        if (initialMessages.length > 0 && messages.length === 0) {
            setMessages(initialMessages);
        }
    }, [initialMessages, messages.length]);
    const addMessage = useCallback((message) => {
        setMessages(prev => {
            const newMessages = [...prev, message];
            // Save to localStorage for guest users
            if (!user) {
                try {
                    localStorage.setItem('guestMessages', JSON.stringify(newMessages));
                }
                catch (err) {
                    console.error('Error saving guest messages:', err);
                }
            }
            return newMessages;
        });
        onMessageSent?.(message);
    }, [onMessageSent, user]);
    const removeTypingIndicator = useCallback(() => {
        setMessages(prev => {
            const filtered = prev.filter(msg => !msg.metadata?.isTyping);
            // Update localStorage for guest users
            if (!user) {
                try {
                    localStorage.setItem('guestMessages', JSON.stringify(filtered));
                }
                catch (err) {
                    console.error('Error updating guest messages:', err);
                }
            }
            return filtered;
        });
    }, [user]);
    // Handle bot response
    const handleBotResponse = async (messageText) => {
        if (isLoading)
            return;
        setIsLoading(true);
        setError(null);
        // Add typing indicator
        const typingIndicator = ChatApiService.createTypingIndicator();
        setMessages(prev => [...prev, typingIndicator]);
        try {
            // Create context from current messages (ไม่รวม typing indicator)
            const contextMessages = messages.filter(msg => !msg.metadata?.isTyping).slice(-5);
            const context = contextMessages.map(msg => `${msg.role}: ${msg.content}`);
            if (quizContext) {
                context.unshift(`Quiz context: User completed a ${quizContext.topic} quiz (${quizContext.difficulty} difficulty) with ${quizContext.score}% score. Weak areas: ${quizContext.weakAreas.join(', ')}`);
            }
            const assistantMessage = await ChatApiService.sendMessage(messageText, sessionId, context);
            // Remove typing indicator and add assistant response
            setMessages(prev => {
                const filtered = prev.filter(msg => !msg.metadata?.isTyping);
                const newMessages = [...filtered, assistantMessage];
                // Save to localStorage for guest users
                if (!user) {
                    try {
                        localStorage.setItem('guestMessages', JSON.stringify(newMessages));
                    }
                    catch (err) {
                        console.error('Error saving guest messages:', err);
                    }
                }
                return newMessages;
            });
            onMessageSent?.(assistantMessage);
            if (assistantMessage.type === 'quiz' && assistantMessage.metadata?.quizId) {
                onQuizGenerated?.(assistantMessage.metadata.quizId);
            }
        }
        catch (error) {
            console.error('Error getting bot response:', error);
            // Remove typing indicator and add error message
            const errorMessage = {
                id: `error_${Date.now()}`,
                role: 'assistant',
                content: `❌ Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date().toISOString(),
                type: 'error',
                metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
            setMessages(prev => {
                const filtered = prev.filter(msg => !msg.metadata?.isTyping);
                const newMessages = [...filtered, errorMessage];
                // Save to localStorage for guest users
                if (!user) {
                    try {
                        localStorage.setItem('guestMessages', JSON.stringify(newMessages));
                    }
                    catch (err) {
                        console.error('Error saving guest messages:', err);
                    }
                }
                return newMessages;
            });
            setError(error instanceof Error ? error.message : 'Failed to get response');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading)
            return;
        if (!ChatApiService.validateMessage(inputMessage)) {
            setError('Message is too long or empty');
            return;
        }
        if (!user && !GuestLimitService.canPerformAction('chat')) {
            setShowLimitModal(true);
            return;
        }
        const userMessage = {
            id: `user_${Date.now()}`,
            role: 'user',
            content: inputMessage.trim(),
            timestamp: new Date().toISOString(),
            type: 'text'
        };
        const messageToSend = inputMessage.trim();
        setInputMessage('');
        setError(null);
        // Add user message
        addMessage(userMessage);
        // Handle bot response
        await handleBotResponse(messageToSend);
        if (!user) {
            GuestLimitService.incrementUsage('chat');
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    const handleQuizStart = (quizId) => {
        // Navigate to quiz page with the generated quiz
        navigate('/quiz', {
            state: {
                startQuizId: quizId
            }
        });
    };
    const insertCommand = (command) => {
        setInputMessage(command);
        setShowCommands(false);
        inputRef.current?.focus();
    };
    const insertQuizPrompt = (prompt) => {
        setInputMessage(prompt);
        inputRef.current?.focus();
    };
    const renderMessage = (message) => {
        const isUser = message.role === 'user';
        const isTyping = message.metadata?.isTyping;
        const isError = message.type === 'error';
        const isQuiz = message.type === 'quiz';
        return (_jsx("div", { className: `flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`, children: _jsxs("div", { className: `flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`, children: [_jsx("div", { className: `flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`, children: _jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center ${isUser
                                ? 'bg-primary-600'
                                : isError
                                    ? 'bg-red-100'
                                    : 'bg-gray-200'}`, children: isUser ? (_jsx(User, { className: "w-4 h-4 text-white" })) : isError ? (_jsx(AlertCircle, { className: "w-4 h-4 text-red-600" })) : (_jsx(Bot, { className: "w-4 h-4 text-gray-600" })) }) }), _jsx("div", { className: `px-4 py-3 rounded-lg ${isUser
                            ? 'bg-primary-600 text-white max-w-md'
                            : isError
                                ? 'bg-red-50 text-red-900 border border-red-200'
                                : isQuiz
                                    ? 'bg-gradient-to-br from-green-50 to-blue-50 text-gray-900 border border-green-200 max-w-md'
                                    : 'bg-gray-100 text-gray-900 max-w-md'}`, children: isTyping ? (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), _jsx("span", { className: "text-sm", children: "TutorAI is typing..." })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: `whitespace-pre-wrap text-sm ${isUser ? 'text-end' : ''}`, children: message.content }), isQuiz && message.metadata?.quizId && (_jsx("div", { className: "mt-3 pt-3 border-t border-green-200", children: _jsxs("button", { onClick: () => handleQuizStart(message.metadata.quizId), className: "flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium", children: [_jsx(Play, { className: "w-4 h-4" }), _jsx("span", { children: "Start Quiz" })] }) })), _jsx("div", { className: `text-xs mt-2 ${isUser ? 'text-primary-200' : 'text-gray-500'}`, children: new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })] })) })] }) }, message.id));
    };
    const canSendMessage = user || GuestLimitService.canPerformAction('chat');
    const guestUsage = GuestLimitService.getUsageSummary();
    // Generate quiz-specific welcome message
    const getWelcomeMessage = () => {
        if (quizContext) {
            return {
                title: `Quiz Discussion: ${quizContext.quizTitle}`,
                subtitle: `Let's discuss your ${quizContext.score}% performance and improve your understanding of ${quizContext.topic}`,
                suggestions: [
                    `Explain the concepts I missed in my ${quizContext.topic} quiz`,
                    `Help me understand my weak areas: ${quizContext.weakAreas.slice(0, 2).join(', ')}`,
                    `Give me practice questions for ${quizContext.topic}`,
                    `Create a study plan for improving in ${quizContext.topic}`
                ]
            };
        }
        return {
            title: 'Welcome to TutorAI Chat!',
            subtitle: 'What would you like to learn about today?',
            suggestions: [
                '/create-quiz mathematics medium',
                'Explain photosynthesis',
                'Help me with calculus',
                'Generate a science quiz'
            ]
        };
    };
    const welcomeContent = getWelcomeMessage();
    return (_jsxs("div", { className: "flex flex-col h-full bg-white", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-200 bg-white", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center", children: _jsx(MessageSquare, { className: "w-5 h-5 text-white" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900", children: quizContext ? `Quiz Discussion` : 'TutorAI Chat' }), _jsx("p", { className: "text-sm text-red-600", children: user ? '' : `*${guestUsage.chats.remaining} messages left` })] })] }), _jsx("button", { onClick: () => setShowCommands(!showCommands), className: "p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200", title: "Show commands", children: _jsx(HelpCircle, { className: "w-5 h-5 text-gray-600" }) })] }), showCommands && (_jsxs("div", { className: "p-4 bg-blue-50 border-b border-blue-200", children: [_jsx("div", { className: "text-sm text-blue-900 mb-3 font-medium", children: "Quick Commands:" }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("button", { onClick: () => insertCommand('/create-quiz mathematics medium'), className: "px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full text-xs transition-colors duration-200", children: "/create-quiz mathematics medium" }), _jsx("button", { onClick: () => insertCommand('/quiz science'), className: "px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full text-xs transition-colors duration-200", children: "/quiz science" }), _jsx("button", { onClick: () => insertCommand('/create-quiz history easy'), className: "px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full text-xs transition-colors duration-200", children: "/create-quiz history easy" })] }), _jsxs("div", { className: "text-xs text-blue-600 mt-2", children: ["Type ", _jsx("code", { children: "/create-quiz [topic] [difficulty]" }), " to generate a custom quiz"] })] })), error && (_jsx("div", { className: "p-3 bg-red-50 border-b border-red-200", children: _jsxs("div", { className: "flex items-center space-x-2 text-red-700", children: [_jsx(AlertCircle, { className: "w-4 h-4" }), _jsx("span", { className: "text-sm", children: error })] }) })), _jsxs("div", { ref: messageContainerRef, className: "flex-1 overflow-y-auto p-4 space-y-4", children: [messages.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Bot, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: welcomeContent.title }), _jsx("p", { className: "text-gray-600 mb-4", children: welcomeContent.subtitle }), _jsx("div", { className: "flex flex-wrap justify-center gap-2", children: welcomeContent.suggestions.map((suggestion, index) => (_jsx("button", { onClick: () => insertQuizPrompt(suggestion), className: "px-4 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg text-sm transition-colors duration-200", children: suggestion.startsWith('/') ? (_jsxs(_Fragment, { children: [_jsx(Zap, { className: "w-4 h-4 inline mr-1" }), suggestion] })) : (suggestion) }, index))) })] })) : (messages.map(renderMessage)), _jsx("div", { ref: messagesEndRef })] }), _jsx("div", { className: "border-t border-gray-200 p-4", children: !canSendMessage ? (_jsxs("div", { className: "text-center py-4", children: [_jsxs("p", { className: "text-gray-600 mb-4", children: ["You've used all ", guestUsage.chats.total, " free chats. Login to continue!"] }), _jsx("button", { onClick: () => navigate('/auth'), className: "btn-primary", children: "Login for Unlimited Access" })] })) : (_jsxs("div", { className: "flex space-x-3 justify-center items-center", children: [_jsx("div", { className: "flex-1", children: _jsx("textarea", { ref: inputRef, value: inputMessage, onChange: (e) => setInputMessage(e.target.value), onKeyPress: handleKeyPress, placeholder: quizContext
                                    ? `Ask about "${quizContext.topic}"`
                                    : "Ask me anything.", className: "w-full resize-none input-field text-sm", rows: 1, disabled: isLoading, maxLength: 2000 }) }), _jsx("button", { onClick: handleSendMessage, disabled: !inputMessage.trim() || isLoading, className: "btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 flex items-center space-x-2 mb-2", children: isLoading ? (_jsx(Loader2, { className: "w-4 h-4 animate-spin" })) : (_jsx(Send, { className: "w-4 h-4" })) })] })) }), _jsx(GuestLimitModal, { isOpen: showLimitModal, onClose: () => setShowLimitModal(false), limitType: "chat" })] }));
}
