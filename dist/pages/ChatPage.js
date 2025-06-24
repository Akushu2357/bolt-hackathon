import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Send, Bot, User, Plus, MessageCircle, Trash2, X, LogIn } from 'lucide-react';
import GuestLimitModal from '../components/common/GuestLimitModal';
import { GuestLimitService } from '../services/guestLimitService';
export default function ChatPage() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [currentSession, setCurrentSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [showSidebar, setShowSidebar] = useState(false);
    const [guestMessages, setGuestMessages] = useState([]);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const messagesEndRef = useRef(null);
    useEffect(() => {
        // Check for initial message from URL params (for logged-out users)
        const urlParams = new URLSearchParams(location.search);
        const initialMessage = urlParams.get('message');
        if (initialMessage && !user) {
            setInputMessage(initialMessage);
            // Clear the URL parameter
            navigate('/chat', { replace: true });
        }
        if (user) {
            fetchSessions();
        }
        else {
            // For guest users, load from localStorage
            const savedGuestMessages = localStorage.getItem('guestMessages');
            if (savedGuestMessages) {
                setGuestMessages(JSON.parse(savedGuestMessages));
            }
            setLoadingSessions(false);
        }
    }, [user, location.search, navigate]);
    useEffect(() => {
        if (currentSession) {
            fetchMessages(currentSession.id);
        }
    }, [currentSession]);
    useEffect(() => {
        scrollToBottom();
    }, [messages, guestMessages]);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    const fetchSessions = async () => {
        try {
            const { data, error } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });
            if (error)
                throw error;
            setSessions(data || []);
            if (data && data.length > 0) {
                setCurrentSession(data[0]);
            }
        }
        catch (error) {
            console.error('Error fetching sessions:', error);
        }
        finally {
            setLoadingSessions(false);
        }
    };
    const fetchMessages = async (sessionId) => {
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true });
            if (error)
                throw error;
            setMessages(data || []);
        }
        catch (error) {
            console.error('Error fetching messages:', error);
        }
    };
    const createNewSession = async () => {
        if (!user)
            return;
        try {
            const { data, error } = await supabase
                .from('chat_sessions')
                .insert({
                user_id: user.id,
                title: 'New Chat Session'
            })
                .select()
                .single();
            if (error)
                throw error;
            const newSession = data;
            setSessions([newSession, ...sessions]);
            setCurrentSession(newSession);
            setMessages([]);
            setShowSidebar(false);
        }
        catch (error) {
            console.error('Error creating session:', error);
        }
    };
    const deleteSession = async (sessionId) => {
        if (!user)
            return;
        try {
            await supabase
                .from('chat_messages')
                .delete()
                .eq('session_id', sessionId);
            await supabase
                .from('chat_sessions')
                .delete()
                .eq('id', sessionId);
            const updatedSessions = sessions.filter(s => s.id !== sessionId);
            setSessions(updatedSessions);
            if (currentSession?.id === sessionId) {
                setCurrentSession(updatedSessions[0] || null);
                setMessages([]);
            }
        }
        catch (error) {
            console.error('Error deleting session:', error);
        }
    };
    const sendMessage = async () => {
        if (!inputMessage.trim() || loading)
            return;
        // Check guest limits
        if (!user && !GuestLimitService.canPerformAction('chat')) {
            setShowLimitModal(true);
            return;
        }
        const userMessage = inputMessage.trim();
        setInputMessage('');
        setLoading(true);
        try {
            if (user && currentSession) {
                // Logged-in user flow
                const userMsg = {
                    id: Date.now().toString(),
                    role: 'user',
                    content: userMessage,
                    created_at: new Date().toISOString()
                };
                setMessages(prev => [...prev, userMsg]);
                await supabase
                    .from('chat_messages')
                    .insert({
                    session_id: currentSession.id,
                    role: 'user',
                    content: userMessage
                });
                const aiResponse = await generateAIResponse(userMessage);
                const aiMsg = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: aiResponse,
                    created_at: new Date().toISOString()
                };
                setMessages(prev => [...prev, aiMsg]);
                await supabase
                    .from('chat_messages')
                    .insert({
                    session_id: currentSession.id,
                    role: 'assistant',
                    content: aiResponse
                });
                if (messages.length === 0) {
                    const title = userMessage.length > 50
                        ? userMessage.substring(0, 50) + '...'
                        : userMessage;
                    await supabase
                        .from('chat_sessions')
                        .update({ title })
                        .eq('id', currentSession.id);
                    setSessions(prev => prev.map(s => s.id === currentSession.id ? { ...s, title } : s));
                }
            }
            else {
                // Guest user flow
                const userMsg = {
                    id: Date.now().toString(),
                    role: 'user',
                    content: userMessage,
                    created_at: new Date().toISOString()
                };
                const newGuestMessages = [...guestMessages, userMsg];
                setGuestMessages(newGuestMessages);
                const aiResponse = await generateAIResponse(userMessage);
                const aiMsg = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: aiResponse,
                    created_at: new Date().toISOString()
                };
                const finalMessages = [...newGuestMessages, aiMsg];
                setGuestMessages(finalMessages);
                // Increment guest usage
                GuestLimitService.incrementUsage('chat');
                // Save to localStorage
                localStorage.setItem('guestMessages', JSON.stringify(finalMessages));
            }
        }
        catch (error) {
            console.error('Error sending message:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const generateAIResponse = async (message) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const responses = [
            `Great question! Let me help you understand this concept better. ${message.toLowerCase().includes('math') ? 'Mathematics is all about patterns and logical thinking.' : 'This is an interesting topic to explore.'}`,
            `I'd be happy to explain that! Let's break this down step by step to make it easier to understand.`,
            `That's a thoughtful question. Here's how I would approach this problem...`,
            `Excellent! This is a fundamental concept. Let me provide you with a clear explanation and some examples.`,
            `I can see you're thinking deeply about this. Let me guide you through the solution process.`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };
    const displayMessages = user ? messages : guestMessages;
    const canSendMessage = user || GuestLimitService.canPerformAction('chat');
    const guestUsage = GuestLimitService.getUsageSummary();
    if (loadingSessions) {
        return (_jsx("div", { className: "flex items-center justify-center h-96", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading chat..." })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8", children: _jsxs("div", { className: "flex h-[calc(100vh-8rem)] sm:h-[calc(100vh-12rem)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden", children: [user && (_jsxs("div", { className: `${showSidebar ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out lg:transition-none`, children: [_jsxs("div", { className: "p-4 border-b border-gray-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Chats" }), _jsx("button", { onClick: () => setShowSidebar(false), className: "lg:hidden p-1 hover:bg-gray-100 rounded", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("button", { onClick: createNewSession, className: "w-full btn-primary flex items-center justify-center space-x-2", children: [_jsx(Plus, { className: "w-4 h-4" }), _jsx("span", { children: "New Chat" })] })] }), _jsx("div", { className: "flex-1 overflow-y-auto", children: sessions.length === 0 ? (_jsxs("div", { className: "p-4 text-center text-gray-500", children: [_jsx(MessageCircle, { className: "w-8 h-8 mx-auto mb-2 text-gray-400" }), _jsx("p", { className: "text-sm", children: "No chat sessions yet" })] })) : (_jsx("div", { className: "p-2", children: sessions.map((session) => (_jsxs("div", { className: `group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-200 ${currentSession?.id === session.id
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'hover:bg-gray-50'}`, onClick: () => {
                                                setCurrentSession(session);
                                                setShowSidebar(false);
                                            }, children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium truncate", children: session.title }), _jsx("p", { className: "text-xs text-gray-500", children: new Date(session.created_at).toLocaleDateString() })] }), _jsx("button", { onClick: (e) => {
                                                        e.stopPropagation();
                                                        deleteSession(session.id);
                                                    }, className: "opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all duration-200", children: _jsx(Trash2, { className: "w-4 h-4 text-red-500" }) })] }, session.id))) })) })] })), showSidebar && (_jsx("div", { className: "lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40", onClick: () => setShowSidebar(false) })), _jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [_jsx("div", { className: "p-4 border-b border-gray-200 bg-white", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "font-semibold text-gray-900 truncate pl-12 lg:pl-0", children: user ? (currentSession?.title || 'AI Tutor Chat') : 'AI Tutor Chat (Guest Mode)' }), !user && (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("span", { className: "text-sm text-gray-600", children: [guestUsage.chats.remaining, "/", guestUsage.chats.total, " free chats left"] }), _jsxs("button", { onClick: () => navigate('/auth'), className: "btn-primary text-sm flex items-center space-x-1", children: [_jsx(LogIn, { className: "w-4 h-4" }), _jsx("span", { children: "Login" })] })] }))] }) }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [displayMessages.length === 0 ? (_jsxs("div", { className: "text-center py-8 sm:py-12", children: [_jsx(Bot, { className: "w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: user ? 'Start a conversation' : 'Welcome to TutorAI!' }), _jsx("p", { className: "text-gray-600", children: user
                                                        ? 'Ask me anything! I\'m here to help you learn.'
                                                        : `You have ${guestUsage.chats.remaining} free chat${guestUsage.chats.remaining !== 1 ? 's' : ''} remaining. Login for unlimited access!` })] })) : (displayMessages.map((message) => (_jsx("div", { className: `flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`, children: _jsxs("div", { className: `flex max-w-[85%] sm:max-w-3xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`, children: [_jsx("div", { className: `flex-shrink-0 ${message.role === 'user' ? 'ml-2 sm:ml-3' : 'mr-2 sm:mr-3'}`, children: _jsx("div", { className: `w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${message.role === 'user'
                                                                ? 'bg-primary-600'
                                                                : 'bg-gray-200'}`, children: message.role === 'user' ? (_jsx(User, { className: "w-3 h-3 sm:w-4 sm:h-4 text-white" })) : (_jsx(Bot, { className: "w-3 h-3 sm:w-4 sm:h-4 text-gray-600" })) }) }), _jsx("div", { className: `px-3 py-2 sm:px-4 sm:py-2 rounded-lg ${message.role === 'user'
                                                            ? 'bg-primary-600 text-white'
                                                            : 'bg-gray-100 text-gray-900'}`, children: _jsx("p", { className: "whitespace-pre-wrap text-sm sm:text-base", children: message.content }) })] }) }, message.id)))), loading && (_jsx("div", { className: "flex justify-start", children: _jsxs("div", { className: "flex max-w-3xl", children: [_jsx("div", { className: "flex-shrink-0 mr-2 sm:mr-3", children: _jsx("div", { className: "w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex items-center justify-center", children: _jsx(Bot, { className: "w-3 h-3 sm:w-4 sm:h-4 text-gray-600" }) }) }), _jsx("div", { className: "px-3 py-2 sm:px-4 sm:py-2 rounded-lg bg-gray-100", children: _jsxs("div", { className: "flex space-x-1", children: [_jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce" }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.1s' } }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.2s' } })] }) })] }) })), _jsx("div", { ref: messagesEndRef })] }), _jsx("div", { className: "border-t border-gray-200 p-4", children: !canSendMessage ? (_jsxs("div", { className: "text-center py-4", children: [_jsxs("p", { className: "text-gray-600 mb-4", children: ["You've used all ", guestUsage.chats.total, " free chats. Login to continue chatting!"] }), _jsxs("button", { onClick: () => navigate('/auth'), className: "btn-primary flex items-center justify-center space-x-2 mx-auto", children: [_jsx(LogIn, { className: "w-4 h-4" }), _jsx("span", { children: "Login for Unlimited Access" })] })] })) : (_jsxs("div", { className: "flex space-x-2 sm:space-x-4", children: [_jsx("textarea", { value: inputMessage, onChange: (e) => setInputMessage(e.target.value), onKeyPress: handleKeyPress, placeholder: "Ask me anything...", className: "flex-1 resize-none input-field text-sm sm:text-base", rows: 1, disabled: loading }), _jsx("button", { onClick: sendMessage, disabled: !inputMessage.trim() || loading, className: "btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-3 sm:px-4", children: _jsx(Send, { className: "w-4 h-4" }) })] })) })] })] }) }), _jsx(GuestLimitModal, { isOpen: showLimitModal, onClose: () => setShowLimitModal(false), limitType: "chat" })] }));
}
