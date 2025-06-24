import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Target, 
  BookOpen, 
  TrendingUp, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle,
  Flame,
  Award,
  BarChart3,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { 
  LearningDashboardService, 
  Weakness, 
  LearningStep, 
  LearningStats,
  CreateWeakness,
  CreateLearningStep,
  UpdateWeakness,
  UpdateLearningStep
} from '../services/learningDashboardService';

export default function LearningDashboardPage() {
  const { user } = useAuth();
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [learningPath, setLearningPath] = useState<LearningStep[]>([]);
  const [stats, setStats] = useState<LearningStats>({
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
  const [editingWeakness, setEditingWeakness] = useState<Weakness | null>(null);
  const [editingLearningStep, setEditingLearningStep] = useState<LearningStep | null>(null);
  
  const [newWeakness, setNewWeakness] = useState<CreateWeakness>({
    title: '',
    description: '',
    improve_action: ''
  });
  
  const [newLearningStep, setNewLearningStep] = useState<CreateLearningStep>({
    title: '',
    description: ''
  });

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    if (!user) return;
    
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
    } catch (error) {
      console.error('Error fetching learning data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Weakness Management
  const handleCreateWeakness = async () => {
    if (!user || !newWeakness.title.trim()) return;
    
    try {
      await LearningDashboardService.createWeakness(user, newWeakness);
      setNewWeakness({ title: '', description: '', improve_action: '' });
      setShowWeaknessForm(false);
      fetchAllData();
    } catch (error) {
      console.error('Error creating weakness:', error);
    }
  };

  const handleUpdateWeakness = async () => {
    if (!user || !editingWeakness) return;
    
    try {
      const updates: UpdateWeakness = {
        title: newWeakness.title,
        description: newWeakness.description,
        improve_action: newWeakness.improve_action
      };
      
      await LearningDashboardService.updateWeakness(user, editingWeakness.id, updates);
      setEditingWeakness(null);
      setNewWeakness({ title: '', description: '', improve_action: '' });
      setShowWeaknessForm(false);
      fetchAllData();
    } catch (error) {
      console.error('Error updating weakness:', error);
    }
  };

  const handleDeleteWeakness = async (weaknessId: string) => {
    if (!user) return;
    
    try {
      await LearningDashboardService.deleteWeakness(user, weaknessId);
      fetchAllData();
    } catch (error) {
      console.error('Error deleting weakness:', error);
    }
  };

  const startEditingWeakness = (weakness: Weakness) => {
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
    if (!user || !newLearningStep.title.trim()) return;
    
    try {
      await LearningDashboardService.createLearningStep(user, newLearningStep);
      setNewLearningStep({ title: '', description: '' });
      setShowLearningStepForm(false);
      fetchAllData();
    } catch (error) {
      console.error('Error creating learning step:', error);
    }
  };

  const handleUpdateLearningStep = async () => {
    if (!user || !editingLearningStep) return;
    
    try {
      const updates: UpdateLearningStep = {
        title: newLearningStep.title,
        description: newLearningStep.description
      };
      
      await LearningDashboardService.updateLearningStep(user, editingLearningStep.id, updates);
      setEditingLearningStep(null);
      setNewLearningStep({ title: '', description: '' });
      setShowLearningStepForm(false);
      fetchAllData();
    } catch (error) {
      console.error('Error updating learning step:', error);
    }
  };

  const handleToggleLearningStep = async (stepId: string) => {
    if (!user) return;
    
    try {
      await LearningDashboardService.toggleLearningStepCompletion(user, stepId);
      fetchAllData();
    } catch (error) {
      console.error('Error toggling learning step:', error);
    }
  };

  const handleDeleteLearningStep = async (stepId: string) => {
    if (!user) return;
    
    try {
      await LearningDashboardService.deleteLearningStep(user, stepId);
      fetchAllData();
    } catch (error) {
      console.error('Error deleting learning step:', error);
    }
  };

  const startEditingLearningStep = (step: LearningStep) => {
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
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading learning dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Stats */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Learning</h1>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-2">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">{stats.dayStreak}</div>
              <div className="text-sm text-gray-600">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-2">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{stats.currentLevel}</div>
              <div className="text-sm text-gray-600">Level</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-2">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.overallProgress}%</div>
              <div className="text-sm text-gray-600">Progress</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weaknesses Section */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Target className="w-5 h-5 mr-2 text-red-600" />
                Weaknesses
              </h2>
              <button
                onClick={() => setShowWeaknessForm(true)}
                className="btn-primary text-sm flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {/* Weakness Form */}
            {showWeaknessForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingWeakness ? 'Edit Weakness' : 'Add New Weakness'}
                </h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Weakness title"
                    value={newWeakness.title}
                    onChange={(e) => setNewWeakness({...newWeakness, title: e.target.value})}
                    className="input-field"
                  />
                  <textarea
                    placeholder="Description"
                    value={newWeakness.description}
                    onChange={(e) => setNewWeakness({...newWeakness, description: e.target.value})}
                    className="input-field resize-none"
                    rows={3}
                  />
                  <textarea
                    placeholder="Improvement action (optional)"
                    value={newWeakness.improve_action}
                    onChange={(e) => setNewWeakness({...newWeakness, improve_action: e.target.value})}
                    className="input-field resize-none"
                    rows={2}
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={editingWeakness ? handleUpdateWeakness : handleCreateWeakness}
                      className="btn-primary"
                    >
                      {editingWeakness ? 'Update' : 'Add'} Weakness
                    </button>
                    <button
                      onClick={cancelForms}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Weaknesses List */}
            <div className="space-y-4">
              {weaknesses.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No weaknesses identified</h3>
                  <p className="text-gray-600 mb-4">
                    Add areas you want to improve to track your progress
                  </p>
                  <button
                    onClick={() => setShowWeaknessForm(true)}
                    className="btn-primary"
                  >
                    Add First Weakness
                  </button>
                </div>
              ) : (
                weaknesses.map((weakness) => (
                  <div key={weakness.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-red-900">{weakness.title}</h4>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => startEditingWeakness(weakness)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteWeakness(weakness.id)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-red-700 mb-3">{weakness.description}</p>
                    {weakness.improve_action && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <div className="flex items-center mb-1">
                          <Lightbulb className="w-4 h-4 text-blue-600 mr-1" />
                          <span className="text-sm font-medium text-blue-900">Improvement Action:</span>
                        </div>
                        <p className="text-sm text-blue-700">{weakness.improve_action}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add weakness input at bottom */}
            {!showWeaknessForm && weaknesses.length > 0 && (
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Weakness title"
                  className="input-field text-gray-500"
                  onClick={() => setShowWeaknessForm(true)}
                  readOnly
                />
              </div>
            )}
          </div>
        </div>

        {/* Learning Path Section */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                Learning Path
              </h2>
              <button
                onClick={() => setShowLearningStepForm(true)}
                className="btn-primary text-sm flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>New Step</span>
              </button>
            </div>

            {/* Learning Step Form */}
            {showLearningStepForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingLearningStep ? 'Edit Learning Step' : 'Add New Step'}
                </h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Step title"
                    value={newLearningStep.title}
                    onChange={(e) => setNewLearningStep({...newLearningStep, title: e.target.value})}
                    className="input-field"
                  />
                  <textarea
                    placeholder="Description"
                    value={newLearningStep.description}
                    onChange={(e) => setNewLearningStep({...newLearningStep, description: e.target.value})}
                    className="input-field resize-none"
                    rows={3}
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={editingLearningStep ? handleUpdateLearningStep : handleCreateLearningStep}
                      className="btn-primary"
                    >
                      {editingLearningStep ? 'Update' : 'Add'} Step
                    </button>
                    <button
                      onClick={cancelForms}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Learning Steps List */}
            <div className="space-y-4">
              {learningPath.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No learning path set</h3>
                  <p className="text-gray-600 mb-4">
                    Create a structured learning path to guide your progress
                  </p>
                  <button
                    onClick={() => setShowLearningStepForm(true)}
                    className="btn-primary"
                  >
                    Add First Step
                  </button>
                </div>
              ) : (
                learningPath.map((step) => (
                  <div 
                    key={step.id} 
                    className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                      step.completed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className={`font-medium ${
                        step.completed ? 'text-green-900 line-through' : 'text-blue-900'
                      }`}>
                        {step.title}
                      </h4>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => startEditingLearningStep(step)}
                          className={`p-1 transition-colors ${
                            step.completed 
                              ? 'text-green-600 hover:text-green-800' 
                              : 'text-blue-600 hover:text-blue-800'
                          }`}
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLearningStep(step.id)}
                          className={`p-1 transition-colors ${
                            step.completed 
                              ? 'text-green-600 hover:text-green-800' 
                              : 'text-blue-600 hover:text-blue-800'
                          }`}
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className={`text-sm mb-3 ${
                      step.completed ? 'text-green-700' : 'text-blue-700'
                    }`}>
                      {step.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleToggleLearningStep(step.id)}
                        className={`btn-primary text-sm flex items-center space-x-1 ${
                          step.completed 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{step.completed ? 'Completed' : 'Mark Complete'}</span>
                      </button>
                      {step.completed && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          ✓ Done
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Progress Overview Section */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex items-center mb-6">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Progress Overview</h2>
            </div>

            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-blue-600 mb-2">
                {stats.overallProgress}%
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Completion</h3>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${stats.overallProgress}%` }}
                ></div>
              </div>

              <p className="text-blue-600 font-medium">
                Stay consistent and watch your knowledge bloom!
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.totalWeaknesses}</div>
                <div className="text-sm text-red-700">Weaknesses</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalLearningSteps}</div>
                <div className="text-sm text-blue-700">Learning Steps</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.completedSteps}</div>
                <div className="text-sm text-green-700">Completed</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.dayStreak}</div>
                <div className="text-sm text-orange-700">Day Streak</div>
              </div>
            </div>

            {/* Motivational Message */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center mb-2">
                <Award className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-900">Current Level: {stats.currentLevel}</span>
              </div>
              <p className="text-sm text-blue-700">
                {stats.overallProgress === 0 
                  ? "Start your learning journey today!"
                  : stats.overallProgress < 25
                  ? "Great start! Keep building momentum."
                  : stats.overallProgress < 50
                  ? "You're making solid progress!"
                  : stats.overallProgress < 75
                  ? "Excellent work! You're more than halfway there."
                  : stats.overallProgress < 100
                  ? "Almost there! Push through to the finish."
                  : "Congratulations! You've completed your learning path!"
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}