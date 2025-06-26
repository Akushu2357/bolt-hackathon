import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Target, BookOpen, TrendingUp, Plus, Edit3, Trash2, CheckCircle, Flame, Award, BarChart3, Lightbulb, X, Save } from 'lucide-react';
import { LearningDashboardService } from '../services/learningDashboardService';
export default function LearningDashboardPage() {
    const { user } = useAuth();
    const [weaknesses, setWeaknesses] = useState([]);
    const [learningPath, setLearningPath] = useState([]);
    const [stats, setStats] = useState({
        totalWeaknesses: 0,
        totalLearningSteps: 0,
        completedSteps: 0,
        overallProgress: 0,
        dayStreak: 0,
        currentLevel: 'Beginner'
    });
    const [loading, setLoading] = useState(true);
    // Form states
    const [showWeaknessForm, setShowWeaknessForm] = useState(false);
    const [showLearningStepForm, setShowLearningStepForm] = useState(false);
    const [editingWeakness, setEditingWeakness] = useState(null);
    const [editingLearningStep, setEditingLearningStep] = useState(null);
    const [newWeakness, setNewWeakness] = useState({
        title: '',
        description: '',
        improve_action: ''
    });
    const [newLearningStep, setNewLearningStep] = useState({
        title: '',
        description: ''
    });
    useEffect(() => {
        if (user) {
            fetchAllData();
        }
    }, [user]);
    const fetchAllData = async () => {
        if (!user)
            return;
        try {
            setLoading(true);
            const [weaknessesData, learningPathData, statsData] = await Promise.all([
                LearningDashboardService.fetchWeaknesses(user),
                LearningDashboardService.fetchLearningPath(user),
                LearningDashboardService.getLearningStats(user)
            ]);
            setWeaknesses(weaknessesData);
            setLearningPath(learningPathData);
            setStats(statsData);
        }
        catch (error) {
            console.error('Error fetching learning data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    // Weakness Management
    const handleCreateWeakness = async () => {
        if (!user || !newWeakness.title.trim())
            return;
        try {
            await LearningDashboardService.createWeakness(user, newWeakness);
            setNewWeakness({ title: '', description: '', improve_action: '' });
            setShowWeaknessForm(false);
            fetchAllData();
        }
        catch (error) {
            console.error('Error creating weakness:', error);
        }
    };
    const handleUpdateWeakness = async () => {
        if (!user || !editingWeakness)
            return;
        try {
            const updates = {
                title: newWeakness.title,
                description: newWeakness.description,
                improve_action: newWeakness.improve_action
            };
            await LearningDashboardService.updateWeakness(user, editingWeakness.id, updates);
            setEditingWeakness(null);
            setNewWeakness({ title: '', description: '', improve_action: '' });
            setShowWeaknessForm(false);
            fetchAllData();
        }
        catch (error) {
            console.error('Error updating weakness:', error);
        }
    };
    const handleDeleteWeakness = async (weaknessId) => {
        if (!user || !confirm('Are you sure you want to delete this weakness?'))
            return;
        try {
            await LearningDashboardService.deleteWeakness(user, weaknessId);
            fetchAllData();
        }
        catch (error) {
            console.error('Error deleting weakness:', error);
        }
    };
    const startEditingWeakness = (weakness) => {
        setEditingWeakness(weakness);
        setNewWeakness({
            title: weakness.title,
            description: weakness.description,
            improve_action: weakness.improve_action || ''
        });
        setShowWeaknessForm(true);
    };
    // Learning Step Management
    const handleCreateLearningStep = async () => {
        if (!user || !newLearningStep.title.trim())
            return;
        try {
            await LearningDashboardService.createLearningStep(user, newLearningStep);
            setNewLearningStep({ title: '', description: '' });
            setShowLearningStepForm(false);
            fetchAllData();
        }
        catch (error) {
            console.error('Error creating learning step:', error);
        }
    };
    const handleUpdateLearningStep = async () => {
        if (!user || !editingLearningStep)
            return;
        try {
            const updates = {
                title: newLearningStep.title,
                description: newLearningStep.description
            };
            await LearningDashboardService.updateLearningStep(user, editingLearningStep.id, updates);
            setEditingLearningStep(null);
            setNewLearningStep({ title: '', description: '' });
            setShowLearningStepForm(false);
            fetchAllData();
        }
        catch (error) {
            console.error('Error updating learning step:', error);
        }
    };
    const handleToggleLearningStep = async (stepId) => {
        if (!user)
            return;
        try {
            await LearningDashboardService.toggleLearningStepCompletion(user, stepId);
            fetchAllData();
        }
        catch (error) {
            console.error('Error toggling learning step:', error);
        }
    };
    const handleDeleteLearningStep = async (stepId) => {
        if (!user || !confirm('Are you sure you want to delete this learning step?'))
            return;
        try {
            await LearningDashboardService.deleteLearningStep(user, stepId);
            fetchAllData();
        }
        catch (error) {
            console.error('Error deleting learning step:', error);
        }
    };
    const startEditingLearningStep = (step) => {
        setEditingLearningStep(step);
        setNewLearningStep({
            title: step.title,
            description: step.description
        });
        setShowLearningStepForm(true);
    };
    const cancelForms = () => {
        setShowWeaknessForm(false);
        setShowLearningStepForm(false);
        setEditingWeakness(null);
        setEditingLearningStep(null);
        setNewWeakness({ title: '', description: '', improve_action: '' });
        setNewLearningStep({ title: '', description: '' });
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-96", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading learning dashboard..." })] }) }));
    }
    return (_jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-4 lg:mb-0", children: "Learning" }), _jsxs("div", { className: "grid grid-cols-3 gap-4 lg:gap-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-2 mx-auto", children: _jsx(Flame, { className: "w-6 h-6 text-orange-600" }) }), _jsx("div", { className: "text-sm text-gray-600", children: "Day Streak" }), _jsx("div", { className: "text-2xl font-bold text-orange-600", children: stats.dayStreak })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-2 mx-auto", children: _jsx(Award, { className: "w-6 h-6 text-blue-600" }) }), _jsx("div", { className: "text-sm text-gray-600", children: "Level" }), _jsx("div", { className: "text-2xl font-bold text-blue-600", children: stats.currentLevel })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-2 mx-auto", children: _jsx(BarChart3, { className: "w-6 h-6 text-green-600" }) }), _jsx("div", { className: "text-sm text-gray-600", children: "Progress" }), _jsxs("div", { className: "text-2xl font-bold text-green-600", children: [stats.overallProgress, "%"] })] })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsx("div", { className: "lg:col-span-1", children: _jsxs("div", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("h2", { className: "text-xl font-semibold text-gray-900 flex items-center", children: [_jsx(Target, { className: "w-5 h-5 mr-2 text-red-600" }), "Weaknesses"] }), _jsxs("button", { onClick: () => setShowWeaknessForm(true), className: "btn-primary text-sm flex items-center space-x-1", children: [_jsx(Plus, { className: "w-4 h-4" }), _jsx("span", { children: "Add" })] })] }), showWeaknessForm && (_jsxs("div", { className: "mb-6 p-4 bg-gray-50 rounded-lg border", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: editingWeakness ? 'Edit Weakness' : 'Add New Weakness' }), _jsxs("div", { className: "space-y-4", children: [_jsx("input", { type: "text", placeholder: "Weakness title", value: newWeakness.title, onChange: (e) => setNewWeakness({ ...newWeakness, title: e.target.value }), className: "input-field" }), _jsx("textarea", { placeholder: "Description", value: newWeakness.description, onChange: (e) => setNewWeakness({ ...newWeakness, description: e.target.value }), className: "input-field resize-none", rows: 3 }), _jsx("textarea", { placeholder: "Improvement action (optional)", value: newWeakness.improve_action, onChange: (e) => setNewWeakness({ ...newWeakness, improve_action: e.target.value }), className: "input-field resize-none", rows: 2 }), _jsxs("div", { className: "flex space-x-3", children: [_jsxs("button", { onClick: editingWeakness ? handleUpdateWeakness : handleCreateWeakness, className: "btn-primary flex items-center space-x-1", children: [_jsx(Save, { className: "w-4 h-4" }), _jsx("span", { children: editingWeakness ? 'Update' : 'Add' })] }), _jsxs("button", { onClick: cancelForms, className: "btn-secondary flex items-center space-x-1", children: [_jsx(X, { className: "w-4 h-4" }), _jsx("span", { children: "Cancel" })] })] })] })] })), _jsx("div", { className: "space-y-4", children: weaknesses.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(Target, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No weaknesses identified" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Add areas you want to improve to track your progress" }), _jsx("button", { onClick: () => setShowWeaknessForm(true), className: "btn-primary", children: "Add First Weakness" })] })) : (weaknesses.map((weakness) => (_jsxs("div", { className: "p-4 bg-red-50 border border-red-200 rounded-lg", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsx("h4", { className: "font-medium text-red-900", children: weakness.title }), _jsxs("div", { className: "flex space-x-1", children: [_jsx("button", { onClick: () => startEditingWeakness(weakness), className: "p-1 text-red-600 hover:text-red-800 transition-colors", title: "Edit", children: _jsx(Edit3, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleDeleteWeakness(weakness.id), className: "p-1 text-red-600 hover:text-red-800 transition-colors", title: "Remove", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }), _jsx("p", { className: "text-sm text-red-700 mb-3", children: weakness.description }), weakness.improve_action && (_jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded p-3", children: [_jsxs("div", { className: "flex items-center mb-1", children: [_jsx(Lightbulb, { className: "w-4 h-4 text-blue-600 mr-1" }), _jsx("span", { className: "text-sm font-medium text-blue-900", children: "Improvement Action:" })] }), _jsx("p", { className: "text-sm text-blue-700", children: weakness.improve_action })] }))] }, weakness.id)))) })] }) }), _jsx("div", { className: "lg:col-span-1", children: _jsxs("div", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("h2", { className: "text-xl font-semibold text-gray-900 flex items-center", children: [_jsx(BookOpen, { className: "w-5 h-5 mr-2 text-blue-600" }), "Learning Path"] }), _jsxs("button", { onClick: () => setShowLearningStepForm(true), className: "btn-primary text-sm flex items-center space-x-1", children: [_jsx(Plus, { className: "w-4 h-4" }), _jsx("span", { children: "New Step" })] })] }), showLearningStepForm && (_jsxs("div", { className: "mb-6 p-4 bg-gray-50 rounded-lg border", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: editingLearningStep ? 'Edit Learning Step' : 'Add New Step' }), _jsxs("div", { className: "space-y-4", children: [_jsx("input", { type: "text", placeholder: "Step title", value: newLearningStep.title, onChange: (e) => setNewLearningStep({ ...newLearningStep, title: e.target.value }), className: "input-field" }), _jsx("textarea", { placeholder: "Description", value: newLearningStep.description, onChange: (e) => setNewLearningStep({ ...newLearningStep, description: e.target.value }), className: "input-field resize-none", rows: 3 }), _jsxs("div", { className: "flex space-x-3", children: [_jsxs("button", { onClick: editingLearningStep ? handleUpdateLearningStep : handleCreateLearningStep, className: "btn-primary flex items-center space-x-1", children: [_jsx(Save, { className: "w-4 h-4" }), _jsx("span", { children: editingLearningStep ? 'Update' : 'Add' })] }), _jsxs("button", { onClick: cancelForms, className: "btn-secondary flex items-center space-x-1", children: [_jsx(X, { className: "w-4 h-4" }), _jsx("span", { children: "Cancel" })] })] })] })] })), _jsx("div", { className: "space-y-4", children: learningPath.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(BookOpen, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No learning path set" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Create a structured learning path to guide your progress" }), _jsx("button", { onClick: () => setShowLearningStepForm(true), className: "btn-primary", children: "Add First Step" })] })) : (learningPath.map((step) => (_jsxs("div", { className: `p-4 border-2 rounded-lg transition-all duration-200 ${step.completed
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-blue-50 border-blue-200'}`, children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsx("h4", { className: `font-medium ${step.completed ? 'text-green-900 line-through' : 'text-blue-900'}`, children: step.title }), _jsxs("div", { className: "flex space-x-1", children: [_jsx("button", { onClick: () => startEditingLearningStep(step), className: `p-1 transition-colors ${step.completed
                                                                    ? 'text-green-600 hover:text-green-800'
                                                                    : 'text-blue-600 hover:text-blue-800'}`, title: "Edit", children: _jsx(Edit3, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleDeleteLearningStep(step.id), className: `p-1 transition-colors ${step.completed
                                                                    ? 'text-green-600 hover:text-green-800'
                                                                    : 'text-blue-600 hover:text-blue-800'}`, title: "Remove", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }), _jsx("p", { className: `text-sm mb-3 ${step.completed ? 'text-green-700' : 'text-blue-700'}`, children: step.description }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("button", { onClick: () => handleToggleLearningStep(step.id), className: `btn-primary text-sm flex items-center space-x-1 ${step.completed
                                                            ? 'bg-green-600 hover:bg-green-700'
                                                            : 'bg-blue-600 hover:bg-blue-700'}`, children: [_jsx(CheckCircle, { className: "w-4 h-4" }), _jsx("span", { children: step.completed ? 'Completed' : 'Mark Complete' })] }), step.completed && (_jsx("span", { className: "text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full", children: "\u2713 Done" }))] })] }, step.id)))) })] }) }), _jsx("div", { className: "lg:col-span-1", children: _jsxs("div", { className: "card", children: [_jsxs("div", { className: "flex items-center mb-6", children: [_jsx(TrendingUp, { className: "w-5 h-5 mr-2 text-green-600" }), _jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Progress Overview" })] }), _jsxs("div", { className: "text-center mb-8", children: [_jsxs("div", { className: "text-6xl font-bold text-blue-600 mb-2", children: [stats.overallProgress, "%"] }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Overall Completion" }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-3 mb-6", children: _jsx("div", { className: "bg-blue-600 h-3 rounded-full transition-all duration-500", style: { width: `${stats.overallProgress}%` } }) }), _jsx("p", { className: "text-blue-600 font-medium", children: "Stay consistent and watch your knowledge bloom!" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-6", children: [_jsxs("div", { className: "text-center p-4 bg-red-50 rounded-lg", children: [_jsx("div", { className: "text-2xl font-bold text-red-600", children: stats.totalWeaknesses }), _jsx("div", { className: "text-sm text-red-700", children: "Weaknesses" })] }), _jsxs("div", { className: "text-center p-4 bg-blue-50 rounded-lg", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: stats.totalLearningSteps }), _jsx("div", { className: "text-sm text-blue-700", children: "Learning Steps" })] }), _jsxs("div", { className: "text-center p-4 bg-green-50 rounded-lg", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: stats.completedSteps }), _jsx("div", { className: "text-sm text-green-700", children: "Completed" })] }), _jsxs("div", { className: "text-center p-4 bg-orange-50 rounded-lg", children: [_jsx("div", { className: "text-2xl font-bold text-orange-600", children: stats.dayStreak }), _jsx("div", { className: "text-sm text-orange-700", children: "Day Streak" })] })] }), _jsxs("div", { className: "bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200", children: [_jsxs("div", { className: "flex items-center mb-2", children: [_jsx(Award, { className: "w-5 h-5 text-blue-600 mr-2" }), _jsxs("span", { className: "font-medium text-blue-900", children: ["Current Level: ", stats.currentLevel] })] }), _jsx("p", { className: "text-sm text-blue-700", children: stats.overallProgress === 0
                                                ? "Start your learning journey today!"
                                                : stats.overallProgress < 25
                                                    ? "Great start! Keep building momentum."
                                                    : stats.overallProgress < 50
                                                        ? "You're making solid progress!"
                                                        : stats.overallProgress < 75
                                                            ? "Excellent work! You're more than halfway there."
                                                            : stats.overallProgress < 100
                                                                ? "Almost there! Push through to the finish."
                                                                : "Congratulations! You've completed your learning path!" })] })] }) })] })] }));
}
