import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
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
  X
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

  useEffect(() => {
    if (loading) return;
    if (user) {
      fetchProfile();
      fetchLearningProgress();
      fetchStats();
    } else {
      // Optionally, handle guest profile state here
    }
  }, [user, loading]);

  const fetchProfile = async () => {
    try {
      console.log('Fetching profile for user:', user);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      if (error) {
        console.error('Error fetching profile:', error);
      }
      console.log('Fetched profile:', data);
      setProfile(data);
      setEditedName(data?.full_name || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchLearningProgress = async () => {
    try {
      console.log('Fetching learning progress for user:', user);
      const { data, error } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', user!.id)
        .order('last_updated', { ascending: false });
      if (error) {
        console.error('Error fetching learning progress:', error);
      }
      console.log('Fetched learning progress:', data);
      setLearningProgress(data || []);
    } catch (error) {
      console.error('Error fetching learning progress:', error);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('Fetching stats for user:', user);
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
      console.log('Fetched stats:', { chatCount, quizAttempts, topics });
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

  if (loading) {
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
        {/* Profile Info */}
        <div className="lg:col-span-1">
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

            {/* Quick Stats */}
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
        </div>

        {/* Learning Progress */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Learning Progress</h2>
              <TrendingUp className="w-5 h-5 text-primary-600" />
            </div>

            {learningProgress.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No progress data yet</h3>
                <p className="text-gray-600">
                  Take some quizzes to start tracking your learning progress!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {learningProgress.map((progress) => (
                  <div key={progress.id} className="border border-gray-200 rounded-lg p-4">
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
                            {progress.strengths.slice(0, 3).map((strength, index) => (
                              <div key={index} className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                {strength}
                              </div>
                            ))}
                            {progress.strengths.length > 3 && (
                              <div className="text-xs text-green-600">
                                +{progress.strengths.length - 3} more
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
                            {progress.weak_areas.slice(0, 3).map((weakness, index) => (
                              <div key={index} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                {weakness}
                              </div>
                            ))}
                            {progress.weak_areas.length > 3 && (
                              <div className="text-xs text-red-600">
                                +{progress.weak_areas.length - 3} more
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