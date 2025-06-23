import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ScheduleService } from '../services/scheduleService';
import { GuestLimitService } from '../services/guestLimitService';
import { MessageCircle, FileQuestion, TrendingUp, Target, Award, ArrowRight, Send, Bot, Calendar, Plus, CheckCircle, Star, Users, Zap, Shield, LogIn, Trash2, Edit3 } from 'lucide-react';
export default function HomePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalChats: 0,
        totalQuizzes: 0,
        averageScore: 0,
        weakAreas: []
    });
    const [loading, setLoading] = useState(true);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [studySchedule, setStudySchedule] = useState([]);
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [editingScheduleId, setEditingScheduleId] = useState(null);
    const [newScheduleItem, setNewScheduleItem] = useState({
        title: '',
        subject: '',
        date: '',
        time: ''
    });
    const [scheduleLoading, setScheduleLoading] = useState(false);
    useEffect(() => {
        if (user) {
            fetchDashboardStats();
            fetchStudySchedule();
        }
        else {
            // For guest users, load mock data
            loadGuestData();
            setLoading(false);
        }
    }, [user]);
    const loadGuestData = () => {
        // Mock data for guest users
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const mockSchedule = [
            {
                id: 'guest-1',
                title: 'Try AI Chat',
                subject: 'Getting Started',
                date: today.toISOString().split('T')[0],
                time: '10:00',
                completed: false
            },
            {
                id: 'guest-2',
                title: 'Take Sample Quiz',
                subject: 'Assessment',
                date: today.toISOString().split('T')[0],
                time: '14:00',
                completed: false
            },
            {
                id: 'guest-3',
                title: 'Past Study Session',
                subject: 'Mathematics',
                date: yesterday.toISOString().split('T')[0],
                time: '09:00',
                completed: false
            },
            {
                id: 'guest-4',
                title: 'Future Learning',
                subject: 'Science',
                date: tomorrow.toISOString().split('T')[0],
                time: '16:00',
                completed: false
            }
        ];
        setStudySchedule(mockSchedule);
    };
    const fetchDashboardStats = async () => {
        try {
            // Fetch chat sessions count
            const { count: chatCount } = await supabase
                .from('chat_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);
            // Fetch quiz attempts
            const { data: quizAttempts } = await supabase
                .from('quiz_attempts')
                .select('score')
                .eq('user_id', user.id);
            // Fetch learning progress
            const { data: learningProgress } = await supabase
                .from('learning_progress')
                .select('weak_areas')
                .eq('user_id', user.id);
            const averageScore = quizAttempts && quizAttempts.length > 0
                ? quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizAttempts.length
                : 0;
            const allWeakAreas = learningProgress?.flatMap(progress => progress.weak_areas || []) || [];
            const uniqueWeakAreas = [...new Set(allWeakAreas)];
            setStats({
                totalChats: chatCount || 0,
                totalQuizzes: quizAttempts?.length || 0,
                averageScore: Math.round(averageScore),
                weakAreas: uniqueWeakAreas.slice(0, 3)
            });
        }
        catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const fetchStudySchedule = async () => {
        if (!user)
            return;
        try {
            setScheduleLoading(true);
            const scheduleItems = await ScheduleService.fetchUpcomingScheduleItems(user, 10);
            // Convert to the format expected by the component
            const formattedItems = scheduleItems.map(item => ({
                id: item.id,
                title: item.title,
                subject: item.subject,
                date: item.date,
                time: item.time,
                completed: item.completed
            }));
            setStudySchedule(formattedItems);
        }
        catch (error) {
            console.error('Error fetching study schedule:', error);
        }
        finally {
            setScheduleLoading(false);
        }
    };
    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || chatLoading)
            return;
        setChatLoading(true);
        try {
            if (user) {
                // Create new chat session for logged-in users
                const { data: newSession, error } = await supabase
                    .from('chat_sessions')
                    .insert({
                    user_id: user.id,
                    title: chatInput.length > 50 ? chatInput.substring(0, 50) + '...' : chatInput
                })
                    .select()
                    .single();
                if (error)
                    throw error;
                // Add the initial message to the session
                await supabase
                    .from('chat_messages')
                    .insert({
                    session_id: newSession.id,
                    role: 'user',
                    content: chatInput
                });
                navigate('/chat');
            }
            else {
                // For logged-out users, navigate to chat with query parameter
                navigate(`/chat?message=${encodeURIComponent(chatInput)}`);
            }
        }
        catch (error) {
            console.error('Error creating chat session:', error);
        }
        finally {
            setChatLoading(false);
        }
    };
    const addScheduleItem = async () => {
        if (!newScheduleItem.title || !newScheduleItem.subject || !newScheduleItem.date || !newScheduleItem.time)
            return;
        if (user) {
            // For authenticated users, use the ScheduleService
            try {
                setScheduleLoading(true);
                await ScheduleService.createScheduleItem(user, newScheduleItem);
                await fetchStudySchedule(); // Refresh the schedule
                setNewScheduleItem({ title: '', subject: '', date: '', time: '' });
                setShowScheduleForm(false);
            }
            catch (error) {
                console.error('Error creating schedule item:', error);
            }
            finally {
                setScheduleLoading(false);
            }
        }
        else {
            // For guest users, add to local state
            const newItem = {
                id: `guest-${Date.now()}`,
                ...newScheduleItem,
                completed: false
            };
            setStudySchedule([...studySchedule, newItem]);
            setNewScheduleItem({ title: '', subject: '', date: '', time: '' });
            setShowScheduleForm(false);
        }
    };
    const toggleScheduleItem = async (id) => {
        if (user) {
            // For authenticated users, use the ScheduleService
            try {
                await ScheduleService.toggleScheduleItemCompletion(user, id);
                await fetchStudySchedule(); // Refresh the schedule
            }
            catch (error) {
                console.error('Error toggling schedule item:', error);
            }
        }
        else {
            // For guest users, update local state
            setStudySchedule(schedule => schedule.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
        }
    };
    const deleteScheduleItem = async (id) => {
        if (user) {
            // For authenticated users, use the ScheduleService
            try {
                setScheduleLoading(true);
                await ScheduleService.deleteScheduleItem(user, id);
                await fetchStudySchedule(); // Refresh the schedule
            }
            catch (error) {
                console.error('Error deleting schedule item:', error);
            }
            finally {
                setScheduleLoading(false);
            }
        }
        else {
            // For guest users, remove from local state
            setStudySchedule(schedule => schedule.filter(item => item.id !== id));
        }
    };
    const startEditingScheduleItem = (item) => {
        setEditingScheduleId(item.id);
        setNewScheduleItem({
            title: item.title,
            subject: item.subject,
            date: item.date,
            time: item.time
        });
        setShowScheduleForm(true);
    };
    const updateScheduleItem = async () => {
        if (!editingScheduleId || !newScheduleItem.title || !newScheduleItem.subject || !newScheduleItem.date || !newScheduleItem.time)
            return;
        if (user) {
            // For authenticated users, use the ScheduleService
            try {
                setScheduleLoading(true);
                await ScheduleService.updateScheduleItem(user, editingScheduleId, newScheduleItem);
                await fetchStudySchedule(); // Refresh the schedule
                setNewScheduleItem({ title: '', subject: '', date: '', time: '' });
                setShowScheduleForm(false);
                setEditingScheduleId(null);
            }
            catch (error) {
                console.error('Error updating schedule item:', error);
            }
            finally {
                setScheduleLoading(false);
            }
        }
        else {
            // For guest users, update local state
            setStudySchedule(schedule => schedule.map(item => item.id === editingScheduleId ? { ...item, ...newScheduleItem } : item));
            setNewScheduleItem({ title: '', subject: '', date: '', time: '' });
            setShowScheduleForm(false);
            setEditingScheduleId(null);
        }
    };
    const cancelScheduleForm = () => {
        setShowScheduleForm(false);
        setEditingScheduleId(null);
        setNewScheduleItem({ title: '', subject: '', date: '', time: '' });
    };
    // Helper function to check if a date is in the past
    const isDateInPast = (dateString) => {
        const today = new Date();
        const itemDate = new Date(dateString);
        today.setHours(0, 0, 0, 0);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate < today;
    };
    // Get guest usage summary for display
    const guestUsage = GuestLimitService.getUsageSummary();
    // Logged-out user view
    if (!user) {
        return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("div", { className: "bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-4xl sm:text-5xl lg:text-6xl font-bold mb-6", children: "Learn Smarter with AI" }), _jsx("p", { className: "text-xl sm:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto", children: "Personalized tutoring, interactive quizzes, and progress tracking - all powered by advanced AI technology" }), _jsxs("div", { className: "max-w-2xl mx-auto mb-8", children: [_jsxs("form", { onSubmit: handleChatSubmit, className: "flex flex-col sm:flex-row gap-4", children: [_jsx("input", { type: "text", value: chatInput, onChange: (e) => setChatInput(e.target.value), placeholder: "Try asking: 'Explain photosynthesis' or 'Help me with calculus'", className: "flex-1 px-6 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50", disabled: chatLoading }), _jsx("button", { type: "submit", disabled: !chatInput.trim() || chatLoading, className: "px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2", children: chatLoading ? (_jsx("div", { className: "w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" })) : (_jsxs(_Fragment, { children: [_jsx(Send, { className: "w-5 h-5" }), _jsx("span", { children: "Ask AI Tutor" })] })) })] }), _jsxs("p", { className: "text-primary-200 text-sm mt-3", children: ["Get ", guestUsage.chats.remaining, " free chat requests \u2022 No signup required"] })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [_jsxs(Link, { to: "/quiz", className: "px-8 py-4 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2", children: [_jsx(FileQuestion, { className: "w-5 h-5" }), _jsx("span", { children: "Try Free Quiz" })] }), _jsxs(Link, { to: "/auth", className: "px-8 py-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 border border-white border-opacity-30", children: [_jsx(LogIn, { className: "w-5 h-5" }), _jsx("span", { children: "Login for Full Access" })] })] })] }) }) }), _jsx("div", { className: "py-16 sm:py-24", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-3xl sm:text-4xl font-bold text-gray-900 mb-4", children: "Why Choose TutorAI?" }), _jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "Experience the future of personalized learning with our AI-powered platform" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8", children: [_jsxs("div", { className: "text-center p-6", children: [_jsx("div", { className: "w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Bot, { className: "w-8 h-8 text-blue-600" }) }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-2", children: "AI-Powered Tutoring" }), _jsx("p", { className: "text-gray-600", children: "Get instant, personalized explanations and guidance from our advanced AI tutor" })] }), _jsxs("div", { className: "text-center p-6", children: [_jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Target, { className: "w-8 h-8 text-green-600" }) }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Personalized Learning" }), _jsx("p", { className: "text-gray-600", children: "Adaptive quizzes and content tailored to your learning style and progress" })] }), _jsxs("div", { className: "text-center p-6", children: [_jsx("div", { className: "w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(TrendingUp, { className: "w-8 h-8 text-purple-600" }) }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Progress Tracking" }), _jsx("p", { className: "text-gray-600", children: "Monitor your learning journey with detailed analytics and insights" })] }), _jsxs("div", { className: "text-center p-6", children: [_jsx("div", { className: "w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Zap, { className: "w-8 h-8 text-yellow-600" }) }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Instant Feedback" }), _jsx("p", { className: "text-gray-600", children: "Get immediate responses and corrections to accelerate your learning" })] }), _jsxs("div", { className: "text-center p-6", children: [_jsx("div", { className: "w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Shield, { className: "w-8 h-8 text-red-600" }) }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Safe & Secure" }), _jsx("p", { className: "text-gray-600", children: "Your data and privacy are protected with enterprise-grade security" })] }), _jsxs("div", { className: "text-center p-6", children: [_jsx("div", { className: "w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Users, { className: "w-8 h-8 text-indigo-600" }) }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Community Support" }), _jsx("p", { className: "text-gray-600", children: "Join thousands of learners in our supportive educational community" })] })] })] }) }), _jsx("div", { className: "bg-gray-900 text-white py-16", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center", children: [_jsx("h2", { className: "text-3xl sm:text-4xl font-bold mb-4", children: "Ready to Transform Your Learning?" }), _jsx("p", { className: "text-xl text-gray-300 mb-8 max-w-2xl mx-auto", children: "Join thousands of students who are already learning smarter with TutorAI" }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [_jsxs(Link, { to: "/auth", className: "px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2", children: [_jsx(Star, { className: "w-5 h-5" }), _jsx("span", { children: "Get Started Free" })] }), _jsx("button", { onClick: () => {
                                            const element = document.querySelector('.hero-section');
                                            element?.scrollIntoView({ behavior: 'smooth' });
                                        }, className: "px-8 py-4 bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 text-white font-semibold rounded-lg transition-colors duration-200", children: "Try Demo" })] })] }) })] }));
    }
    // Logged-in user view
    return (_jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("div", { className: "mb-8", children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: ["Welcome back, ", user?.user_metadata?.full_name || 'Student', "! \uD83D\uDC4B"] }), _jsx("p", { className: "text-gray-600", children: "Ready to continue your learning journey? Let's make today productive!" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: [_jsx("div", { className: "card", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center", children: _jsx(MessageCircle, { className: "w-6 h-6 text-blue-600" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Chats" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: loading ? '...' : stats.totalChats })] })] }) }), _jsx("div", { className: "card", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center", children: _jsx(FileQuestion, { className: "w-6 h-6 text-green-600" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Quizzes Taken" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: loading ? '...' : stats.totalQuizzes })] })] }) }), _jsx("div", { className: "card", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center", children: _jsx(Award, { className: "w-6 h-6 text-purple-600" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Average Score" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: loading ? '...' : `${stats.averageScore}%` })] })] }) }), _jsx("div", { className: "card", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center", children: _jsx(Target, { className: "w-6 h-6 text-orange-600" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Focus Areas" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: loading ? '...' : stats.weakAreas.length })] })] }) })] }), _jsx("div", { className: "mb-8", children: _jsxs("div", { className: "card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx("div", { className: "w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center mr-3", children: _jsx(Bot, { className: "w-5 h-5 text-white" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-primary-900", children: "AI Tutor Assistant" }), _jsx("p", { className: "text-sm text-primary-700", children: "What would you like to learn about today?" })] })] }), _jsxs("form", { onSubmit: handleChatSubmit, className: "flex space-x-3", children: [_jsx("input", { type: "text", value: chatInput, onChange: (e) => setChatInput(e.target.value), placeholder: "Ask me anything... e.g., 'Explain photosynthesis' or 'Help me with calculus'", className: "flex-1 px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white", disabled: chatLoading }), _jsxs("button", { type: "submit", disabled: !chatInput.trim() || chatLoading, className: "px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2", children: [chatLoading ? (_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" })) : (_jsx(Send, { className: "w-4 h-4" })), _jsx("span", { children: chatLoading ? 'Starting...' : 'Ask' })] })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsxs("div", { className: "lg:col-span-2", children: [_jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h2", { className: "text-xl font-semibold text-gray-900 flex items-center", children: [_jsx(Calendar, { className: "w-5 h-5 mr-2 text-primary-600" }), "My Study Schedule"] }), _jsxs("button", { onClick: () => setShowScheduleForm(true), className: "btn-primary flex items-center space-x-2 text-sm", disabled: scheduleLoading, children: [_jsx(Plus, { className: "w-4 h-4" }), _jsx("span", { children: "Add Lesson" })] })] }), showScheduleForm && (_jsxs("div", { className: "card mb-4 bg-gray-50", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: editingScheduleId ? 'Edit Study Session' : 'Add New Study Session' }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4", children: [_jsx("input", { type: "text", placeholder: "Lesson title", value: newScheduleItem.title, onChange: (e) => setNewScheduleItem({ ...newScheduleItem, title: e.target.value }), className: "input-field" }), _jsx("input", { type: "text", placeholder: "Subject", value: newScheduleItem.subject, onChange: (e) => setNewScheduleItem({ ...newScheduleItem, subject: e.target.value }), className: "input-field" }), _jsx("input", { type: "date", value: newScheduleItem.date, onChange: (e) => setNewScheduleItem({ ...newScheduleItem, date: e.target.value }), className: "input-field" }), _jsx("input", { type: "time", value: newScheduleItem.time, onChange: (e) => setNewScheduleItem({ ...newScheduleItem, time: e.target.value }), className: "input-field" })] }), _jsxs("div", { className: "flex space-x-3", children: [_jsx("button", { onClick: editingScheduleId ? updateScheduleItem : addScheduleItem, className: "btn-primary", disabled: scheduleLoading, children: scheduleLoading ? 'Saving...' : editingScheduleId ? 'Update Session' : 'Add Session' }), _jsx("button", { onClick: cancelScheduleForm, className: "btn-secondary", children: "Cancel" })] })] })), _jsx("div", { className: "card", children: scheduleLoading ? (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading schedule..." })] })) : studySchedule.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(Calendar, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No study sessions scheduled" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Create your first study session to start organizing your learning" }), _jsx("button", { onClick: () => setShowScheduleForm(true), className: "btn-primary", children: "Add Study Session" })] })) : (_jsx("div", { className: "space-y-3", children: studySchedule.map((item) => {
                                                const isPastDate = isDateInPast(item.date);
                                                return (_jsxs("div", { className: `flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 ${item.completed
                                                        ? 'bg-green-50 border-green-200'
                                                        : isPastDate
                                                            ? 'bg-red-50 border-red-200'
                                                            : 'bg-white border-gray-200 hover:border-primary-200'}`, children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("button", { onClick: () => toggleScheduleItem(item.id), className: `w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${item.completed
                                                                        ? 'bg-green-500 border-green-500'
                                                                        : isPastDate
                                                                            ? 'border-red-300 hover:border-red-500'
                                                                            : 'border-gray-300 hover:border-primary-500'}`, children: item.completed && _jsx(CheckCircle, { className: "w-4 h-4 text-white" }) }), _jsxs("div", { children: [_jsx("h4", { className: `font-medium ${item.completed
                                                                                ? 'text-green-700 line-through'
                                                                                : isPastDate
                                                                                    ? 'text-red-700'
                                                                                    : 'text-gray-900'}`, children: item.title }), _jsxs("p", { className: `text-sm ${isPastDate && !item.completed
                                                                                ? 'text-red-600'
                                                                                : 'text-gray-600'}`, children: [item.subject, " \u2022 ", new Date(item.date).toLocaleDateString(), " at ", item.time, isPastDate && !item.completed && (_jsx("span", { className: "ml-2 text-red-500 font-medium", children: "(Past Due)" }))] })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [item.completed && (_jsx("span", { className: "text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full", children: "Completed" })), user && (_jsxs("div", { className: "flex space-x-1", children: [_jsx("button", { onClick: () => startEditingScheduleItem(item), className: "p-1 text-gray-400 hover:text-primary-600 transition-colors", title: "Edit", children: _jsx(Edit3, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => deleteScheduleItem(item.id), className: "p-1 text-gray-400 hover:text-red-600 transition-colors", title: "Delete", children: _jsx(Trash2, { className: "w-4 h-4" }) })] }))] })] }, item.id));
                                            }) })) })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Quick Actions" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs(Link, { to: "/chat", className: "card hover:shadow-md transition-all duration-200 group", children: [_jsx("div", { className: "w-12 h-12 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center justify-center mb-4 transition-colors duration-200", children: _jsx(MessageCircle, { className: "w-6 h-6 text-white" }) }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "Continue Chat" }), _jsx("p", { className: "text-gray-600 text-sm mb-4", children: "Resume your conversation with the AI tutor" }), _jsxs("div", { className: "flex items-center text-primary-600 text-sm font-medium group-hover:text-primary-700", children: ["Open chat", _jsx(ArrowRight, { className: "w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" })] })] }), _jsxs(Link, { to: "/quiz", className: "card hover:shadow-md transition-all duration-200 group", children: [_jsx("div", { className: "w-12 h-12 bg-green-500 hover:bg-green-600 rounded-lg flex items-center justify-center mb-4 transition-colors duration-200", children: _jsx(FileQuestion, { className: "w-6 h-6 text-white" }) }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "Take Quiz" }), _jsx("p", { className: "text-gray-600 text-sm mb-4", children: "Test your knowledge and identify weak areas" }), _jsxs("div", { className: "flex items-center text-primary-600 text-sm font-medium group-hover:text-primary-700", children: ["Start quiz", _jsx(ArrowRight, { className: "w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" })] })] })] })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "card", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Areas to Focus" }), loading ? (_jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "h-4 bg-gray-200 rounded animate-pulse" }), _jsx("div", { className: "h-4 bg-gray-200 rounded animate-pulse" }), _jsx("div", { className: "h-4 bg-gray-200 rounded animate-pulse" })] })) : stats.weakAreas.length > 0 ? (_jsx("div", { className: "space-y-2", children: stats.weakAreas.map((area, index) => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-red-50 rounded-lg", children: [_jsx("span", { className: "text-sm text-red-700", children: area }), _jsx(Target, { className: "w-4 h-4 text-red-500" })] }, index))) })) : (_jsx("p", { className: "text-gray-500 text-sm", children: "Take some quizzes to identify areas for improvement!" }))] }), _jsxs("div", { className: "card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200", children: [_jsx("h3", { className: "text-lg font-semibold text-primary-900 mb-2", children: "\uD83D\uDCA1 Learning Tip" }), _jsx("p", { className: "text-primary-700 text-sm", children: "Consistency is key! Try to stick to your study schedule and review your weak areas regularly for better retention." })] })] })] })] }));
}
