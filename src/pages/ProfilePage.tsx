import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LearningDashboardService, Weakness, LearningStep, LearningStats } from '../services/learningDashboardService';
import { 
  User, 
  Mail, 
  Calendar, 
  Trophy, 
  Target, 
  TrendingUp,
  BookOpen,
  MessageCircle,
  FileQuestion,
  Award,
  Edit3,
  Save,
  X,
  Brain,
  Flame,
  BarChart3,
  CheckCircle,
  Clock,
  Lightbulb,
  ArrowRight,
  Plus
} from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface LearningProgress {
  id: string;
  topic: string;
  weak_areas: string[];
  strengths: string[];
  progress_score: number;
  last_updated: string;
}

interface Stats {
  totalChats: number;
  totalQuizzes: number;
  averageScore: number;
  totalTopics: number;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [learningProgress, setLearningProgress] = useState<LearningProgress[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalChats: 0,
    totalQuizzes: 0,
    averageScore: 0,
    totalTopics: 0
  });
  const [editing, setEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  // Learning Dashboard Data
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [learningPath, setLearningPath] = useState<LearningStep[]>([]);
  const [learningStats, setLearningStats] = useState<LearningStats>({
    totalWeaknesses: 0,
    totalLearningSteps: 0,
    completedSteps: 0,
    overallProgress: 0,
    dayStreak: 0,
    currentLevel: 'Beginner'
  });

  useEffect(() => {
    if (loading) return;
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
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      setProfile(data);
      setEditedName(data?.full_name || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchLearningProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', user!.id)
        .order('last_updated', { ascending: false });
      if (error) throw error;
      setLearningProgress(data || []);
    } catch (error) {
      console.error('Error fetching learning progress:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch chat sessions count
      const { count: chatCount } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      // Fetch quiz attempts
      const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select('score')
        .eq('user_id', user!.id);

      // Fetch unique topics
      const { data: topics } = await supabase
        .from('learning_progress')
        .select('topic')
        .eq('user_id', user!.id);

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
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchLearningDashboardData = async () => {
    if (!user) return;
    
    try {
      const [weaknessesData, learningPathData, statsData] = await Promise.all([
        LearningDashboardService.fetchWeaknesses(user),
        LearningDashboardService.fetchLearningPath(user),
        LearningDashboardService.getLearningStats(user)
      ]);
      
      setWeaknesses(weaknessesData);
      setLearningPath(learningPathData);
      setLearningStats(statsData);
    } catch (error) {
      console.error('Error fetching learning dashboard data:', error);
    }
  };

  const updateProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editedName })
        .eq('id', user!.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, full_name: editedName } : null);
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info & Quick Stats */}
        <div className="lg:col-span-1 space-y-6">
          {/* Basic Profile Card */}
          <div className="card">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-12 h-12 text-primary-600" />
              </div>
              
              {editing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Enter your name"
                    className="input-field text-center"
                  />
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={updateProfile}
                      className="btn-primary flex items-center space-x-1"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setEditedName(profile?.full_name || '');
                      }}
                      className="btn-secondary flex items-center space-x-1"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {profile?.full_name || 'Student'}
                    </h1>
                    <button
                      onClick={() => setEditing(true)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Edit3 className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  <div className="flex items-center justify-center text-gray-600 mb-4">
                    <Mail className="w-4 h-4 mr-2" />
                    <span className="text-sm">{profile?.email}</span>
                  </div>
                  <div className="flex items-center justify-center text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      Joined {new Date(profile?.created_at || '').toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <MessageCircle className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-blue-900">{stats.totalChats}</div>
                <div className="text-xs text-blue-600">Chats</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <FileQuestion className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-green-900">{stats.totalQuizzes}</div>
                <div className="text-xs text-green-600">Quizzes</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <Award className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-purple-900">{stats.averageScore}%</div>
                <div className="text-xs text-purple-600">Avg Score</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <BookOpen className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-orange-900">{stats.totalTopics}</div>
                <div className="text-xs text-orange-600">Topics</div>
              </div>
            </div>
          </div>

          {/* Learning Stats Card */}
          <div className="card bg-gradient-to-br from-primary-50 to-blue-50 border-primary-200">
            <div className="flex items-center mb-4">
              <Brain className="w-6 h-6 text-primary-600 mr-3" />
              <h2 className="text-lg font-semibold text-primary-900">Learning Overview</h2>
            </div>
            
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-primary-600 mb-2">
                {learningStats.overallProgress}%
              </div>
              <p className="text-primary-700 text-sm">Overall Progress</p>
              
              {/* Progress Bar */}
              <div className="w-full bg-primary-200 rounded-full h-2 mt-3">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${learningStats.overallProgress}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center p-3 bg-white/60 rounded-lg">
                <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-orange-600">{learningStats.dayStreak}</div>
                <div className="text-xs text-orange-700">Day Streak</div>
              </div>
              <div className="text-center p-3 bg-white/60 rounded-lg">
                <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                <div className="text-sm font-bold text-yellow-600">{learningStats.currentLevel}</div>
                <div className="text-xs text-yellow-700">Level</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 bg-red-50 rounded">
                <div className="text-sm font-bold text-red-600">{learningStats.totalWeaknesses}</div>
                <div className="text-xs text-red-700">Weaknesses</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="text-sm font-bold text-green-600">{learningStats.completedSteps}</div>
                <div className="text-xs text-green-700">Completed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Current Weaknesses */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Target className="w-6 h-6 text-red-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Current Focus Areas</h2>
              </div>
              <span className="text-sm text-gray-500">{weaknesses.length} areas</span>
            </div>

            {weaknesses.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No focus areas identified</h3>
                <p className="text-gray-600 mb-4">
                  Take some quizzes or add areas you want to improve
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {weaknesses.slice(0, 3).map((weakness) => (
                  <div key={weakness.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-red-900">{weakness.title}</h4>
                      <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                        Focus Area
                      </span>
                    </div>
                    <p className="text-sm text-red-700 mb-3">{weakness.description}</p>
                    {weakness.improve_action && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <div className="flex items-center mb-1">
                          <Lightbulb className="w-4 h-4 text-blue-600 mr-1" />
                          <span className="text-sm font-medium text-blue-900">Action Plan:</span>
                        </div>
                        <p className="text-sm text-blue-700">{weakness.improve_action}</p>
                      </div>
                    )}
                  </div>
                ))}
                {weaknesses.length > 3 && (
                  <div className="text-center">
                    <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center mx-auto">
                      View all {weaknesses.length} areas
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Learning Path Progress */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <BookOpen className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Learning Path</h2>
              </div>
              <div className="text-sm text-gray-500">
                {learningStats.completedSteps}/{learningStats.totalLearningSteps} completed
              </div>
            </div>

            {learningPath.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No learning path set</h3>
                <p className="text-gray-600 mb-4">
                  Create a structured learning path to guide your progress
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {learningPath.slice(0, 4).map((step, index) => (
                  <div 
                    key={step.id} 
                    className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                      step.completed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          step.completed 
                            ? 'bg-green-500 border-green-500' 
                            : 'border-blue-300'
                        }`}>
                          {step.completed ? (
                            <CheckCircle className="w-4 h-4 text-white" />
                          ) : (
                            <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                          )}
                        </div>
                        <h4 className={`font-medium ${
                          step.completed ? 'text-green-900 line-through' : 'text-blue-900'
                        }`}>
                          {step.title}
                        </h4>
                      </div>
                      {step.completed && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          ✓ Done
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ml-9 ${
                      step.completed ? 'text-green-700' : 'text-blue-700'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                ))}
                {learningPath.length > 4 && (
                  <div className="text-center">
                    <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center mx-auto">
                      View all {learningPath.length} steps
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subject Progress */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Subject Progress</h2>
              <TrendingUp className="w-5 h-5 text-primary-600" />
            </div>

            {learningProgress.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No progress data yet</h3>
                <p className="text-gray-600">
                  Take some quizzes to start tracking your learning progress!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {learningProgress.map((progress) => (
                  <div key={progress.id} className="border border-gray-200 rounded-lg p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-900">{progress.topic}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getProgressColor(progress.progress_score)}`}>
                        {progress.progress_score}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(progress.progress_score)}`}
                          style={{ width: `${progress.progress_score}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Strengths */}
                      <div>
                        <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center">
                          <Trophy className="w-4 h-4 mr-1" />
                          Strengths ({progress.strengths.length})
                        </h4>
                        {progress.strengths.length > 0 ? (
                          <div className="space-y-1">
                            {progress.strengths.slice(0, 2).map((strength, index) => (
                              <div key={index} className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                {strength.length > 60 ? `${strength.substring(0, 60)}...` : strength}
                              </div>
                            ))}
                            {progress.strengths.length > 2 && (
                              <div className="text-xs text-green-600">
                                +{progress.strengths.length - 2} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">No strengths identified yet</p>
                        )}
                      </div>

                      {/* Weak Areas */}
                      <div>
                        <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center">
                          <Target className="w-4 h-4 mr-1" />
                          Areas to Focus ({progress.weak_areas.length})
                        </h4>
                        {progress.weak_areas.length > 0 ? (
                          <div className="space-y-1">
                            {progress.weak_areas.slice(0, 2).map((weakness, index) => (
                              <div key={index} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                {weakness.length > 60 ? `${weakness.substring(0, 60)}...` : weakness}
                              </div>
                            ))}
                            {progress.weak_areas.length > 2 && (
                              <div className="text-xs text-red-600">
                                +{progress.weak_areas.length - 2} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">No weak areas identified</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      Last updated: {new Date(progress.last_updated).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}