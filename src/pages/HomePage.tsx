import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  MessageCircle, 
  FileQuestion, 
  TrendingUp, 
  Target,
  BookOpen,
  Award,
  Clock,
  ArrowRight
} from 'lucide-react';

interface DashboardStats {
  totalChats: number;
  totalQuizzes: number;
  averageScore: number;
  weakAreas: string[];
}

export default function HomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalChats: 0,
    totalQuizzes: 0,
    averageScore: 0,
    weakAreas: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
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

      // Fetch learning progress
      const { data: learningProgress } = await supabase
        .from('learning_progress')
        .select('weak_areas')
        .eq('user_id', user!.id);

      const averageScore = quizAttempts && quizAttempts.length > 0
        ? quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizAttempts.length
        : 0;

      const allWeakAreas = learningProgress?.flatMap(progress => progress.weak_areas || []) || [];
      const uniqueWeakAreas = [...new Set(allWeakAreas)];

      setStats({
        totalChats: chatCount || 0,
        totalQuizzes: quizAttempts?.length || 0,
        averageScore: Math.round(averageScore),
        weakAreas: uniqueWeakAreas.slice(0, 3) // Show top 3 weak areas
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Start Chat',
      description: 'Ask questions and get personalized explanations',
      icon: MessageCircle,
      href: '/chat',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      title: 'Take Quiz',
      description: 'Test your knowledge and identify weak areas',
      icon: FileQuestion,
      href: '/quiz',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      title: 'View Progress',
      description: 'Track your learning journey and achievements',
      icon: TrendingUp,
      href: '/profile',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    }
  ];

  const recentTopics = [
    'Mathematics - Algebra',
    'Physics - Mechanics',
    'Chemistry - Organic',
    'Biology - Cell Structure'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.user_metadata?.full_name || 'Student'}! 👋
        </h1>
        <p className="text-gray-600">
          Ready to continue your learning journey? Let's make today productive!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Chats</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : stats.totalChats}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileQuestion className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Quizzes Taken</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : stats.totalQuizzes}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : `${stats.averageScore}%`}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Focus Areas</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : stats.weakAreas.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.href}
                  className="card hover:shadow-md transition-all duration-200 group"
                >
                  <div className={`w-12 h-12 ${action.color} ${action.hoverColor} rounded-lg flex items-center justify-center mb-4 transition-colors duration-200`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {action.description}
                  </p>
                  <div className="flex items-center text-primary-600 text-sm font-medium group-hover:text-primary-700">
                    Get started
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Topics</h3>
            <div className="space-y-3">
              {recentTopics.map((topic, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-700">{topic}</span>
                  </div>
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Weak Areas */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas to Focus</h3>
            {loading ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : stats.weakAreas.length > 0 ? (
              <div className="space-y-2">
                {stats.weakAreas.map((area, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <span className="text-sm text-red-700">{area}</span>
                    <Target className="w-4 h-4 text-red-500" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                Take some quizzes to identify areas for improvement!
              </p>
            )}
          </div>

          {/* Learning Tip */}
          <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
            <h3 className="text-lg font-semibold text-primary-900 mb-2">💡 Learning Tip</h3>
            <p className="text-primary-700 text-sm">
              Regular practice with quizzes helps identify knowledge gaps and reinforces learning. 
              Try taking a quiz after each chat session!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}