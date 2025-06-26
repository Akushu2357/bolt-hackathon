import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, MessageCircle, Trash2, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import RealTimeChatComponent from '../components/chat/RealTimeChatComponent';
import QuizContextBanner from '../components/chat/QuizContextBanner';
import QuizSuggestedPrompts from '../components/chat/QuizSuggestedPrompts';
import { useChatSession } from '../hooks/useChatSession';
import { QuizChatIntegrationService } from '../services/quizChatIntegrationService';
export default function ChatPage() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { sessionId } = useParams();
    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [showSidebar, setShowSidebar] = useState(false);
    const [activeSessionId, setActiveSessionId] = useState(sessionId);
    const [quizContext, setQuizContext] = useState(null);
    const [showQuizBanner, setShowQuizBanner] = useState(false);
    const { currentSession, messages, loading: sessionLoading, error: sessionError, saveMessage, createNewSession, updateSessionTitle, setMessages } = useChatSession(activeSessionId);
    useEffect(() => {
        if (user) {
            fetchSessions();
        }
        else {
            setLoadingSessions(false);
        }
    }, [user]);
    // Handle quiz integration from navigation state
    useEffect(() => {
        const { state } = location;
        // Handle quiz context from navigation state
        if (state?.fromQuiz && state?.quizContext) {
            setQuizContext(state.quizContext);
            setShowQuizBanner(true);
            const autoMessage = QuizChatIntegrationService.createInitialChatMessage(state.quizContext);
            const userMessage = {
                id: `quiz_auto_${Date.now()}`,
                role: 'user',
                content: autoMessage,
                timestamp: new Date().toISOString(),
                type: 'text',
            };
            setMessages([userMessage]);
            navigate(location.pathname, { replace: true });
            return;
        }
        // Handle stored context from previous session
        const storedContext = QuizChatIntegrationService.getAndClearQuizContext();
        if (storedContext) {
            setQuizContext(storedContext);
            setShowQuizBanner(true);
            const autoMessage = QuizChatIntegrationService.createInitialChatMessage(storedContext);
            const userMessage = {
                id: `quiz_stored_${Date.now()}`,
                role: 'user',
                content: autoMessage,
                timestamp: new Date().toISOString(),
                type: 'text',
            };
            setMessages([userMessage]);
        }
    }, [location, navigate, setMessages]);
    const fetchSessions = async () => {
        if (!user)
            return;
        try {
            const { data, error } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });
            if (error)
                throw error;
            setSessions(data || []);
            // If no active session and we have sessions, select the first one
            if (!activeSessionId && data && data.length > 0) {
                setActiveSessionId(data[0].id);
                navigate(`/chat/${data[0].id}`, { replace: true });
            }
        }
        catch (error) {
            console.error('Error fetching sessions:', error);
        }
        finally {
            setLoadingSessions(false);
        }
    };
    const handleCreateNewSession = async () => {
        const newSession = await createNewSession();
        if (newSession) {
            setSessions([newSession, ...sessions]);
            setActiveSessionId(newSession.id);
            navigate(`/chat/${newSession.id}`);
            setShowSidebar(false);
            // Clear quiz context when starting new session
            setQuizContext(null);
            setShowQuizBanner(false);
        }
    };
    const handleSelectSession = (session) => {
        setActiveSessionId(session.id);
        navigate(`/chat/${session.id}`);
        setShowSidebar(false);
        // Clear quiz context when switching sessions
        setQuizContext(null);
        setShowQuizBanner(false);
    };
    const handleDeleteSession = async (sessionId) => {
        if (!user)
            return;
        try {
            // Delete messages first
            await supabase
                .from('chat_messages')
                .delete()
                .eq('session_id', sessionId);
            // Delete session
            await supabase
                .from('chat_sessions')
                .delete()
                .eq('id', sessionId);
            const updatedSessions = sessions.filter(s => s.id !== sessionId);
            setSessions(updatedSessions);
            // If we deleted the active session, switch to another or create new
            if (activeSessionId === sessionId) {
                if (updatedSessions.length > 0) {
                    setActiveSessionId(updatedSessions[0].id);
                    navigate(`/chat/${updatedSessions[0].id}`);
                }
                else {
                    setActiveSessionId(undefined);
                    navigate('/chat');
                }
            }
        }
        catch (error) {
            console.error('Error deleting session:', error);
        }
    };
    const handleMessageSent = async (message) => {
        await saveMessage(message);
        // Update session title if it's the first user message
        if (message.role === 'user' && currentSession && messages.length <= 1) {
            const title = message.content.length > 50
                ? message.content.substring(0, 50) + '...'
                : message.content;
            await updateSessionTitle(title);
            // Update local sessions list
            setSessions(prev => prev.map(s => s.id === currentSession.id ? { ...s, title } : s));
        }
    };
    const handleQuizGenerated = (quizId) => {
        // Navigate to quiz page with the generated quiz
        navigate('/quiz', {
            state: {
                startQuizId: quizId
            }
        });
    };
    const handlePromptSelect = (prompt) => {
        // This will be handled by the RealTimeChatComponent
        // We can pass this down as a prop if needed
    };
    const handleDismissQuizBanner = () => {
        setShowQuizBanner(false);
        setQuizContext(null);
    };
    if (loadingSessions || sessionLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-96", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading chat..." })] }) }));
    }
    return (_jsx("div", { className: "h-screen overflow-hidden bg-gray-50", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8", children: _jsxs("div", { className: "flex h-full max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-12rem)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden", children: [user && (_jsxs("div", { className: `${showSidebar ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out lg:transition-none`, children: [_jsxs("div", { className: "p-4 border-b border-gray-200", children: [_jsx("div", { className: "flex items-center justify-between mb-4", children: _jsxs("h2", { className: "text-lg font-semibold text-gray-900 flex items-center", children: [_jsx(Sparkles, { className: "w-5 h-5 mr-2 text-primary-600" }), "AI Chats"] }) }), _jsxs("button", { onClick: handleCreateNewSession, className: "w-full btn-primary flex items-center justify-center space-x-2", children: [_jsx(Plus, { className: "w-4 h-4" }), _jsx("span", { children: "New Chat" })] })] }), _jsx("div", { className: "flex-1 overflow-y-auto", children: sessions.length === 0 ? (_jsxs("div", { className: "p-4 text-center text-gray-500", children: [_jsx(MessageCircle, { className: "w-8 h-8 mx-auto mb-2 text-gray-400" }), _jsx("p", { className: "text-sm", children: "No chat sessions yet" }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: "Create your first chat to get started" })] })) : (_jsx("div", { className: "p-2", children: sessions.map((session) => (_jsxs("div", { className: `group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-200 ${activeSessionId === session.id
                                            ? 'bg-primary-50 text-primary-700 border border-primary-200'
                                            : 'hover:bg-gray-50'}`, onClick: () => handleSelectSession(session), children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium truncate", children: session.title }), _jsx("p", { className: "text-xs text-gray-500", children: new Date(session.updated_at).toLocaleDateString() })] }), _jsx("button", { onClick: (e) => {
                                                    e.stopPropagation();
                                                    handleDeleteSession(session.id);
                                                }, className: "opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all duration-200", children: _jsx(Trash2, { className: "w-4 h-4 text-red-500" }) })] }, session.id))) })) })] })), showSidebar && (_jsx("div", { className: "lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40", onClick: () => setShowSidebar(false) })), user && (_jsx("button", { onClick: () => setShowSidebar(!showSidebar), className: `lg:hidden fixed top-1/3 z-40 bg-white border border-gray-200 rounded-r-lg shadow-md pt-7 pe-1 pb-7 transition-transform duration-300 ${showSidebar ? 'translate-x-80' : 'translate-x-0'}`, style: { left: 0 }, children: showSidebar ? (_jsx(ChevronLeft, { className: "w-5 h-5 text-gray-600" })) : (_jsx(ChevronRight, { className: "w-5 h-5 text-gray-600" })) })), _jsx("div", { className: "flex-1 flex flex-col overflow-hidden", children: sessionError ? (_jsx("div", { className: "flex-1 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(MessageCircle, { className: "w-6 h-6 text-red-600" }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "Error Loading Chat" }), _jsx("p", { className: "text-gray-600 mb-4", children: sessionError }), _jsx("button", { onClick: () => window.location.reload(), className: "btn-primary", children: "Retry" })] }) })) : (_jsxs(_Fragment, { children: [showQuizBanner && quizContext && (_jsx("div", { className: "shrink-0 p-4 border-b border-gray-200 bg-white", children: _jsx(QuizContextBanner, { quizContext: quizContext, onDismiss: handleDismissQuizBanner }) })), quizContext && messages.length === 0 && (_jsx("div", { className: "shrink-0 p-4 border-b border-gray-200 bg-white", children: _jsx(QuizSuggestedPrompts, { quizContext: quizContext, onPromptSelect: handlePromptSelect }) })), _jsx("div", { className: "flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-white", children: _jsx(RealTimeChatComponent, { sessionId: activeSessionId || 'guest', initialMessages: messages, onMessageSent: handleMessageSent, onQuizGenerated: handleQuizGenerated, quizContext: quizContext }) })] })) })] }) }) }));
}
