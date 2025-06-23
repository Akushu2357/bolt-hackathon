import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Mail, Calendar, Trophy, Target, TrendingUp, BookOpen, MessageCircle, FileQuestion, Award, Edit3, Save, X } from 'lucide-react';
export default function ProfilePage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [learningProgress, setLearningProgress] = useState([]);
    const [stats, setStats] = useState({
        totalChats: 0,
        totalQuizzes: 0,
        averageScore: 0,
        totalTopics: 0
    });
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editedName, setEditedName] = useState('');
    useEffect(() => {
        if (user) {
            fetchProfile();
            fetchLearningProgress();
            fetchStats();
        }
    }, [user]);
    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            if (error)
                throw error;
            setProfile(data);
            setEditedName(data.full_name || '');
        }
        catch (error) {
            console.error('Error fetching profile:', error);
        }
    };
    const fetchLearningProgress = async () => {
        try {
            const { data, error } = await supabase
                .from('learning_progress')
                .select('*')
                .eq('user_id', user.id)
                .order('last_updated', { ascending: false });
            if (error)
                throw error;
            setLearningProgress(data || []);
        }
        catch (error) {
            console.error('Error fetching learning progress:', error);
        }
    };
    const fetchStats = async () => {
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
            // Fetch unique topics
            const { data: topics } = await supabase
                .from('learning_progress')
                .select('topic')
                .eq('user_id', user.id);
            const averageScore = quizAttempts && quizAttempts.length > 0
                ? quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizAttempts.length
                : 0;
            const uniqueTopics = new Set(topics?.map(t => t.topic) || []);
            setStats({
                totalChats: chatCount || 0,
                totalQuizzes: quizAttempts?.length || 0,
                averageScore: Math.round(averageScore),
                totalTopics: uniqueTopics.size
            });
        }
        catch (error) {
            console.error('Error fetching stats:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const updateProfile = async () => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: editedName })
                .eq('id', user.id);
            if (error)
                throw error;
            setProfile(prev => prev ? { ...prev, full_name: editedName } : null);
            setEditing(false);
        }
        catch (error) {
            console.error('Error updating profile:', error);
        }
    };
    const getProgressColor = (score) => {
        if (score >= 80)
            return 'text-green-600 bg-green-100';
        if (score >= 60)
            return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };
    const getProgressBarColor = (score) => {
        if (score >= 80)
            return 'bg-green-500';
        if (score >= 60)
            return 'bg-yellow-500';
        return 'bg-red-500';
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-96", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading profile..." })] }) }));
    }
    return (_jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsx("div", { className: "lg:col-span-1", children: _jsxs("div", { className: "card", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("div", { className: "w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(User, { className: "w-12 h-12 text-primary-600" }) }), editing ? (_jsxs("div", { className: "space-y-3", children: [_jsx("input", { type: "text", value: editedName, onChange: (e) => setEditedName(e.target.value), placeholder: "Enter your name", className: "input-field text-center" }), _jsxs("div", { className: "flex justify-center space-x-2", children: [_jsxs("button", { onClick: updateProfile, className: "btn-primary flex items-center space-x-1", children: [_jsx(Save, { className: "w-4 h-4" }), _jsx("span", { children: "Save" })] }), _jsxs("button", { onClick: () => {
                                                            setEditing(false);
                                                            setEditedName(profile?.full_name || '');
                                                        }, className: "btn-secondary flex items-center space-x-1", children: [_jsx(X, { className: "w-4 h-4" }), _jsx("span", { children: "Cancel" })] })] })] })) : (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-center space-x-2 mb-2", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: profile?.full_name || 'Student' }), _jsx("button", { onClick: () => setEditing(true), className: "p-1 hover:bg-gray-100 rounded", children: _jsx(Edit3, { className: "w-4 h-4 text-gray-500" }) })] }), _jsxs("div", { className: "flex items-center justify-center text-gray-600 mb-4", children: [_jsx(Mail, { className: "w-4 h-4 mr-2" }), _jsx("span", { className: "text-sm", children: profile?.email })] }), _jsxs("div", { className: "flex items-center justify-center text-gray-500", children: [_jsx(Calendar, { className: "w-4 h-4 mr-2" }), _jsxs("span", { className: "text-sm", children: ["Joined ", new Date(profile?.created_at || '').toLocaleDateString()] })] })] }))] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "text-center p-3 bg-blue-50 rounded-lg", children: [_jsx(MessageCircle, { className: "w-6 h-6 text-blue-600 mx-auto mb-1" }), _jsx("div", { className: "text-lg font-bold text-blue-900", children: stats.totalChats }), _jsx("div", { className: "text-xs text-blue-600", children: "Chats" })] }), _jsxs("div", { className: "text-center p-3 bg-green-50 rounded-lg", children: [_jsx(FileQuestion, { className: "w-6 h-6 text-green-600 mx-auto mb-1" }), _jsx("div", { className: "text-lg font-bold text-green-900", children: stats.totalQuizzes }), _jsx("div", { className: "text-xs text-green-600", children: "Quizzes" })] }), _jsxs("div", { className: "text-center p-3 bg-purple-50 rounded-lg", children: [_jsx(Award, { className: "w-6 h-6 text-purple-600 mx-auto mb-1" }), _jsxs("div", { className: "text-lg font-bold text-purple-900", children: [stats.averageScore, "%"] }), _jsx("div", { className: "text-xs text-purple-600", children: "Avg Score" })] }), _jsxs("div", { className: "text-center p-3 bg-orange-50 rounded-lg", children: [_jsx(BookOpen, { className: "w-6 h-6 text-orange-600 mx-auto mb-1" }), _jsx("div", { className: "text-lg font-bold text-orange-900", children: stats.totalTopics }), _jsx("div", { className: "text-xs text-orange-600", children: "Topics" })] })] })] }) }), _jsx("div", { className: "lg:col-span-2", children: _jsxs("div", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Learning Progress" }), _jsx(TrendingUp, { className: "w-5 h-5 text-primary-600" })] }), learningProgress.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Trophy, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No progress data yet" }), _jsx("p", { className: "text-gray-600", children: "Take some quizzes to start tracking your learning progress!" })] })) : (_jsx("div", { className: "space-y-6", children: learningProgress.map((progress) => (_jsxs("div", { className: "border border-gray-200 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: progress.topic }), _jsxs("span", { className: `px-3 py-1 rounded-full text-sm font-medium ${getProgressColor(progress.progress_score)}`, children: [progress.progress_score, "%"] })] }), _jsx("div", { className: "mb-4", children: _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: `h-2 rounded-full transition-all duration-300 ${getProgressBarColor(progress.progress_score)}`, style: { width: `${progress.progress_score}%` } }) }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium text-green-700 mb-2 flex items-center", children: [_jsx(Trophy, { className: "w-4 h-4 mr-1" }), "Strengths (", progress.strengths.length, ")"] }), progress.strengths.length > 0 ? (_jsxs("div", { className: "space-y-1", children: [progress.strengths.slice(0, 3).map((strength, index) => (_jsx("div", { className: "text-xs text-green-600 bg-green-50 px-2 py-1 rounded", children: strength }, index))), progress.strengths.length > 3 && (_jsxs("div", { className: "text-xs text-green-600", children: ["+", progress.strengths.length - 3, " more"] }))] })) : (_jsx("p", { className: "text-xs text-gray-500", children: "No strengths identified yet" }))] }), _jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium text-red-700 mb-2 flex items-center", children: [_jsx(Target, { className: "w-4 h-4 mr-1" }), "Areas to Focus (", progress.weak_areas.length, ")"] }), progress.weak_areas.length > 0 ? (_jsxs("div", { className: "space-y-1", children: [progress.weak_areas.slice(0, 3).map((weakness, index) => (_jsx("div", { className: "text-xs text-red-600 bg-red-50 px-2 py-1 rounded", children: weakness }, index))), progress.weak_areas.length > 3 && (_jsxs("div", { className: "text-xs text-red-600", children: ["+", progress.weak_areas.length - 3, " more"] }))] })) : (_jsx("p", { className: "text-xs text-gray-500", children: "No weak areas identified" }))] })] }), _jsxs("div", { className: "mt-3 text-xs text-gray-500", children: ["Last updated: ", new Date(progress.last_updated).toLocaleDateString()] })] }, progress.id))) }))] }) })] }) }));
}
