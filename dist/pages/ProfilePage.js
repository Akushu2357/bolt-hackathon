import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LearningDashboardService } from '../services/learningDashboardService';
import { User, Mail, Calendar, Trophy, Target, TrendingUp, BookOpen, MessageCircle, FileQuestion, Award, Edit3, Save, X, Brain, Flame, BarChart3, CheckCircle, Lightbulb, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
export default function ProfilePage() {
    const { user, loading } = useAuth();
    const [profile, setProfile] = useState(null);
    const [learningProgress, setLearningProgress] = useState([]);
    const [stats, setStats] = useState({
        totalChats: 0,
        totalQuizzes: 0,
        averageScore: 0,
        totalTopics: 0
    });
    const [editing, setEditing] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [loadingData, setLoadingData] = useState(true);
    // Learning Dashboard Data
    const [weaknesses, setWeaknesses] = useState([]);
    const [learningPath, setLearningPath] = useState([]);
    const [learningStats, setLearningStats] = useState({
        totalWeaknesses: 0,
        totalLearningSteps: 0,
        completedSteps: 0,
        overallProgress: 0,
        dayStreak: 0,
        currentLevel: 'Beginner'
    });
    // State for expandable sections
    const [expandedProgress, setExpandedProgress] = useState({});
    const [showAllProgress, setShowAllProgress] = useState(false);
    useEffect(() => {
        if (loading)
            return;
        if (user) {
            fetchAllData();
        }
    }, [user, loading]);
    const fetchAllData = async () => {
        try {
            setLoadingData(true);
            await Promise.all([
                fetchProfile(),
                fetchLearningProgress(),
                fetchStats(),
                fetchLearningDashboardData()
            ]);
        }
        catch (error) {
            console.error('Error fetching profile data:', error);
        }
        finally {
            setLoadingData(false);
        }
    };
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
            setEditedName(data?.full_name || '');
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
    };
    const fetchLearningDashboardData = async () => {
        if (!user)
            return;
        try {
            const [weaknessesData, learningPathData, statsData] = await Promise.all([
                LearningDashboardService.fetchWeaknesses(user),
                LearningDashboardService.fetchLearningPath(user),
                LearningDashboardService.getLearningStats(user)
            ]);
            setWeaknesses(weaknessesData);
            setLearningPath(learningPathData);
            setLearningStats(statsData);
        }
        catch (error) {
            console.error('Error fetching learning dashboard data:', error);
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
    const toggleProgressExpansion = (progressId) => {
        setExpandedProgress(prev => ({
            ...prev,
            [progressId]: !prev[progressId]
        }));
    };
    const displayedProgress = showAllProgress ? learningProgress : learningProgress.slice(0, 3);
    if (loading || loadingData) {
        return (_jsx("div", { className: "flex items-center justify-center h-96", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading profile..." })] }) }));
    }
    return (_jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsxs("div", { className: "lg:col-span-1 space-y-6", children: [_jsxs("div", { className: "card", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("div", { className: "w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(User, { className: "w-12 h-12 text-primary-600" }) }), editing ? (_jsxs("div", { className: "space-y-3", children: [_jsx("input", { type: "text", value: editedName, onChange: (e) => setEditedName(e.target.value), placeholder: "Enter your name", className: "input-field text-center" }), _jsxs("div", { className: "flex justify-center space-x-2", children: [_jsxs("button", { onClick: updateProfile, className: "btn-primary flex items-center space-x-1", children: [_jsx(Save, { className: "w-4 h-4" }), _jsx("span", { children: "Save" })] }), _jsxs("button", { onClick: () => {
                                                                setEditing(false);
                                                                setEditedName(profile?.full_name || '');
                                                            }, className: "btn-secondary flex items-center space-x-1", children: [_jsx(X, { className: "w-4 h-4" }), _jsx("span", { children: "Cancel" })] })] })] })) : (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-center space-x-2 mb-2", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: profile?.full_name || 'Student' }), _jsx("button", { onClick: () => setEditing(true), className: "p-1 hover:bg-gray-100 rounded", children: _jsx(Edit3, { className: "w-4 h-4 text-gray-500" }) })] }), _jsxs("div", { className: "flex items-center justify-center text-gray-600 mb-4", children: [_jsx(Mail, { className: "w-4 h-4 mr-2" }), _jsx("span", { className: "text-sm", children: profile?.email })] }), _jsxs("div", { className: "flex items-center justify-center text-gray-500", children: [_jsx(Calendar, { className: "w-4 h-4 mr-2" }), _jsxs("span", { className: "text-sm", children: ["Joined ", new Date(profile?.created_at || '').toLocaleDateString()] })] })] }))] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "text-center p-3 bg-blue-50 rounded-lg", children: [_jsx(MessageCircle, { className: "w-6 h-6 text-blue-600 mx-auto mb-1" }), _jsx("div", { className: "text-lg font-bold text-blue-900", children: stats.totalChats }), _jsx("div", { className: "text-xs text-blue-600", children: "Chats" })] }), _jsxs("div", { className: "text-center p-3 bg-green-50 rounded-lg", children: [_jsx(FileQuestion, { className: "w-6 h-6 text-green-600 mx-auto mb-1" }), _jsx("div", { className: "text-lg font-bold text-green-900", children: stats.totalQuizzes }), _jsx("div", { className: "text-xs text-green-600", children: "Quizzes" })] }), _jsxs("div", { className: "text-center p-3 bg-purple-50 rounded-lg", children: [_jsx(Award, { className: "w-6 h-6 text-purple-600 mx-auto mb-1" }), _jsxs("div", { className: "text-lg font-bold text-purple-900", children: [stats.averageScore, "%"] }), _jsx("div", { className: "text-xs text-purple-600", children: "Avg Score" })] }), _jsxs("div", { className: "text-center p-3 bg-orange-50 rounded-lg", children: [_jsx(BookOpen, { className: "w-6 h-6 text-orange-600 mx-auto mb-1" }), _jsx("div", { className: "text-lg font-bold text-orange-900", children: stats.totalTopics }), _jsx("div", { className: "text-xs text-orange-600", children: "Topics" })] })] })] }), _jsxs("div", { className: "card bg-gradient-to-br from-primary-50 to-blue-50 border-primary-200", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx(Brain, { className: "w-6 h-6 text-primary-600 mr-3" }), _jsx("h2", { className: "text-lg font-semibold text-primary-900", children: "Learning Overview" })] }), _jsxs("div", { className: "text-center mb-6", children: [_jsxs("div", { className: "text-4xl font-bold text-primary-600 mb-2", children: [learningStats.overallProgress, "%"] }), _jsx("p", { className: "text-primary-700 text-sm", children: "Overall Progress" }), _jsx("div", { className: "w-full bg-primary-200 rounded-full h-2 mt-3", children: _jsx("div", { className: "bg-primary-600 h-2 rounded-full transition-all duration-500", style: { width: `${learningStats.overallProgress}%` } }) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3 mb-4", children: [_jsxs("div", { className: "text-center p-3 bg-white/60 rounded-lg", children: [_jsx(Flame, { className: "w-5 h-5 text-orange-500 mx-auto mb-1" }), _jsx("div", { className: "text-lg font-bold text-orange-600", children: learningStats.dayStreak }), _jsx("div", { className: "text-xs text-orange-700", children: "Day Streak" })] }), _jsxs("div", { className: "text-center p-3 bg-white/60 rounded-lg", children: [_jsx(Trophy, { className: "w-5 h-5 text-yellow-500 mx-auto mb-1" }), _jsx("div", { className: "text-sm font-bold text-yellow-600", children: learningStats.currentLevel }), _jsx("div", { className: "text-xs text-yellow-700", children: "Level" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "text-center p-2 bg-red-50 rounded", children: [_jsx("div", { className: "text-sm font-bold text-red-600", children: learningStats.totalWeaknesses }), _jsx("div", { className: "text-xs text-red-700", children: "Weaknesses" })] }), _jsxs("div", { className: "text-center p-2 bg-green-50 rounded", children: [_jsx("div", { className: "text-sm font-bold text-green-600", children: learningStats.completedSteps }), _jsx("div", { className: "text-xs text-green-700", children: "Completed" })] })] })] })] }), _jsxs("div", { className: "lg:col-span-2 space-y-8", children: [_jsxs("div", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Target, { className: "w-6 h-6 text-red-600 mr-3" }), _jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Current Focus Areas" })] }), _jsxs("span", { className: "text-sm text-gray-500", children: [weaknesses.length, " areas"] })] }), weaknesses.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(Target, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No focus areas identified" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Take some quizzes or add areas you want to improve" })] })) : (_jsxs("div", { className: "space-y-4", children: [weaknesses.slice(0, 3).map((weakness) => (_jsxs("div", { className: "p-4 bg-red-50 border border-red-200 rounded-lg", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsx("h4", { className: "font-medium text-red-900", children: weakness.title }), _jsx("span", { className: "text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full", children: "Focus Area" })] }), _jsx("p", { className: "text-sm text-red-700 mb-3", children: weakness.description }), weakness.improve_action && (_jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded p-3", children: [_jsxs("div", { className: "flex items-center mb-1", children: [_jsx(Lightbulb, { className: "w-4 h-4 text-blue-600 mr-1" }), _jsx("span", { className: "text-sm font-medium text-blue-900", children: "Action Plan:" })] }), _jsx("p", { className: "text-sm text-blue-700", children: weakness.improve_action })] }))] }, weakness.id))), weaknesses.length > 3 && (_jsx("div", { className: "text-center", children: _jsxs("button", { className: "text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center mx-auto", children: ["View all ", weaknesses.length, " areas", _jsx(ArrowRight, { className: "w-4 h-4 ml-1" })] }) }))] }))] }), _jsxs("div", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(BookOpen, { className: "w-6 h-6 text-blue-600 mr-3" }), _jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Learning Path" })] }), _jsxs("div", { className: "text-sm text-gray-500", children: [learningStats.completedSteps, "/", learningStats.totalLearningSteps, " completed"] })] }), learningPath.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(BookOpen, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No learning path set" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Create a structured learning path to guide your progress" })] })) : (_jsxs("div", { className: "space-y-4", children: [learningPath.slice(0, 4).map((step, index) => (_jsxs("div", { className: `p-4 border-2 rounded-lg transition-all duration-200 ${step.completed
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-blue-50 border-blue-200'}`, children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: `w-6 h-6 rounded-full border-2 flex items-center justify-center ${step.completed
                                                                        ? 'bg-green-500 border-green-500'
                                                                        : 'border-blue-300'}`, children: step.completed ? (_jsx(CheckCircle, { className: "w-4 h-4 text-white" })) : (_jsx("span", { className: "text-xs font-medium text-blue-600", children: index + 1 })) }), _jsx("h4", { className: `font-medium ${step.completed ? 'text-green-900 line-through' : 'text-blue-900'}`, children: step.title })] }), step.completed && (_jsx("span", { className: "text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full", children: "\u2713 Done" }))] }), _jsx("p", { className: `text-sm ml-9 ${step.completed ? 'text-green-700' : 'text-blue-700'}`, children: step.description })] }, step.id))), learningPath.length > 4 && (_jsx("div", { className: "text-center", children: _jsxs("button", { className: "text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center mx-auto", children: ["View all ", learningPath.length, " steps", _jsx(ArrowRight, { className: "w-4 h-4 ml-1" })] }) }))] }))] }), _jsxs("div", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(TrendingUp, { className: "w-6 h-6 text-primary-600 mr-3" }), _jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Subject Progress" })] }), learningProgress.length > 3 && (_jsx("button", { onClick: () => setShowAllProgress(!showAllProgress), className: "flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium", children: showAllProgress ? (_jsxs(_Fragment, { children: ["Show Less", _jsx(ChevronUp, { className: "w-4 h-4 ml-1" })] })) : (_jsxs(_Fragment, { children: ["Show All (", learningProgress.length, ")", _jsx(ChevronDown, { className: "w-4 h-4 ml-1" })] })) }))] }), learningProgress.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(BarChart3, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No progress data yet" }), _jsx("p", { className: "text-gray-600", children: "Take some quizzes to start tracking your learning progress!" })] })) : (_jsx("div", { className: "space-y-6", children: displayedProgress.map((progress) => (_jsxs("div", { className: "border border-gray-200 rounded-lg overflow-hidden", children: [_jsxs("div", { className: "p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-200", onClick: () => toggleProgressExpansion(progress.id), children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: progress.topic }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("span", { className: `px-3 py-1 rounded-full text-sm font-medium ${getProgressColor(progress.progress_score)}`, children: [progress.progress_score, "%"] }), expandedProgress[progress.id] ? (_jsx(ChevronUp, { className: "w-5 h-5 text-gray-400" })) : (_jsx(ChevronDown, { className: "w-5 h-5 text-gray-400" }))] })] }), _jsx("div", { className: "mb-3", children: _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: `h-2 rounded-full transition-all duration-300 ${getProgressBarColor(progress.progress_score)}`, style: { width: `${progress.progress_score}%` } }) }) }), _jsxs("div", { className: "flex items-center justify-between text-sm text-gray-600", children: [_jsxs("span", { children: [progress.strengths.length, " strengths \u2022 ", progress.weak_areas.length, " areas to improve"] }), _jsxs("span", { children: ["Updated ", new Date(progress.last_updated).toLocaleDateString()] })] })] }), expandedProgress[progress.id] && (_jsx("div", { className: "border-t border-gray-200 p-4 sm:p-6 bg-gray-50", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium text-green-700 mb-3 flex items-center", children: [_jsx(Trophy, { className: "w-4 h-4 mr-1" }), "Strengths (", progress.strengths.length, ")"] }), progress.strengths.length > 0 ? (_jsx("div", { className: "space-y-2 max-h-40 overflow-y-auto", children: progress.strengths.map((strength, index) => (_jsx("div", { className: "text-xs text-green-600 bg-green-50 px-3 py-2 rounded border border-green-200", children: strength.length > 80 ? `${strength.substring(0, 80)}...` : strength }, index))) })) : (_jsx("p", { className: "text-xs text-gray-500 italic", children: "No strengths identified yet" }))] }), _jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium text-red-700 mb-3 flex items-center", children: [_jsx(Target, { className: "w-4 h-4 mr-1" }), "Areas to Focus (", progress.weak_areas.length, ")"] }), progress.weak_areas.length > 0 ? (_jsx("div", { className: "space-y-2 max-h-40 overflow-y-auto", children: progress.weak_areas.map((weakness, index) => (_jsx("div", { className: "text-xs text-red-600 bg-red-50 px-3 py-2 rounded border border-red-200", children: weakness.length > 80 ? `${weakness.substring(0, 80)}...` : weakness }, index))) })) : (_jsx("p", { className: "text-xs text-gray-500 italic", children: "No weak areas identified" }))] })] }) }))] }, progress.id))) }))] })] })] }) }));
}
