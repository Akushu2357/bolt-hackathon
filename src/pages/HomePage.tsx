import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ScheduleService, CreateScheduleItem } from '../services/scheduleService';
import { GuestLimitService } from '../services/guestLimitService';
import { 
  MessageCircle, 
  FileQuestion, 
  TrendingUp, 
  Target,
  Award,
  ArrowRight,
  Send,
  Bot,
  Calendar,
  Plus,
  CheckCircle,
  Star,
  Users,
  Zap,
  Shield,
  LogIn,
  Trash2,
  Edit3
} from 'lucide-react';

interface DashboardStats {
  totalChats: number;
  totalQuizzes: number;
  averageScore: number;
  weakAreas: string[];
}

interface StudyScheduleItem {
  id: string;
  title: string;
  subject: string;
  date: string;
  time: string;
  completed: boolean;
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalChats: 0,
    totalQuizzes: 0,
    averageScore: 0,
    weakAreas: []
  });
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [studySchedule, setStudySchedule] = useState<StudyScheduleItem[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [newScheduleItem, setNewScheduleItem] = useState<CreateScheduleItem>({
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
    } else {
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

    const mockSchedule: StudyScheduleItem[] = [
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
        weakAreas: uniqueWeakAreas.slice(0, 3)
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudySchedule = async () => {
    if (!user) return;
    
    try {
      setScheduleLoading(true);
      const scheduleItems = await ScheduleService.fetchUpcomingScheduleItems(user, 10);
      
      // Convert to the format expected by the component
      const formattedItems: StudyScheduleItem[] = scheduleItems.map(item => ({
        id: item.id,
        title: item.title,
        subject: item.subject,
        date: item.date,
        time: item.time,
        completed: item.completed
      }));
      
      setStudySchedule(formattedItems);
    } catch (error) {
      console.error('Error fetching study schedule:', error);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

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

        if (error) throw error;

        // Add the initial message to the session
        await supabase
          .from('chat_messages')
          .insert({
            session_id: newSession.id,
            role: 'user',
            content: chatInput
          });

        // Navigate to chat with the session ID and trigger bot response
        navigate(`/chat/${newSession.id}`, {
          state: {
            initialMessage: chatInput,
            triggerBotResponse: true
          }
        });
      } else {
        // For guest users, navigate to chat with the message in state
        
      }
    } catch (error) {
      console.error('Error creating chat session:', error);
    } finally {
      setChatLoading(false);
      setChatInput(''); // Clear input after successful submission
    }
  };

  const addScheduleItem = async () => {
    if (!newScheduleItem.title || !newScheduleItem.subject || !newScheduleItem.date || !newScheduleItem.time) return;

    if (user) {
      // For authenticated users, use the ScheduleService
      try {
        setScheduleLoading(true);
        await ScheduleService.createScheduleItem(user, newScheduleItem);
        await fetchStudySchedule(); // Refresh the schedule
        setNewScheduleItem({ title: '', subject: '', date: '', time: '' });
        setShowScheduleForm(false);
      } catch (error) {
        console.error('Error creating schedule item:', error);
      } finally {
        setScheduleLoading(false);
      }
    } else {
      // For guest users, add to local state
      const newItem: StudyScheduleItem = {
        id: `guest-${Date.now()}`,
        ...newScheduleItem,
        completed: false
      };

      setStudySchedule([...studySchedule, newItem]);
      setNewScheduleItem({ title: '', subject: '', date: '', time: '' });
      setShowScheduleForm(false);
    }
  };

  const toggleScheduleItem = async (id: string) => {
    if (user) {
      // For authenticated users, use the ScheduleService
      try {
        await ScheduleService.toggleScheduleItemCompletion(user, id);
        await fetchStudySchedule(); // Refresh the schedule
      } catch (error) {
        console.error('Error toggling schedule item:', error);
      }
    } else {
      // For guest users, update local state
      setStudySchedule(schedule =>
        schedule.map(item =>
          item.id === id ? { ...item, completed: !item.completed } : item
        )
      );
    }
  };

  const deleteScheduleItem = async (id: string) => {
    if (user) {
      // For authenticated users, use the ScheduleService
      try {
        setScheduleLoading(true);
        await ScheduleService.deleteScheduleItem(user, id);
        await fetchStudySchedule(); // Refresh the schedule
      } catch (error) {
        console.error('Error deleting schedule item:', error);
      } finally {
        setScheduleLoading(false);
      }
    } else {
      // For guest users, remove from local state
      setStudySchedule(schedule => schedule.filter(item => item.id !== id));
    }
  };

  const startEditingScheduleItem = (item: StudyScheduleItem) => {
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
    if (!editingScheduleId || !newScheduleItem.title || !newScheduleItem.subject || !newScheduleItem.date || !newScheduleItem.time) return;

    if (user) {
      // For authenticated users, use the ScheduleService
      try {
        setScheduleLoading(true);
        await ScheduleService.updateScheduleItem(user, editingScheduleId, newScheduleItem);
        await fetchStudySchedule(); // Refresh the schedule
        setNewScheduleItem({ title: '', subject: '', date: '', time: '' });
        setShowScheduleForm(false);
        setEditingScheduleId(null);
      } catch (error) {
        console.error('Error updating schedule item:', error);
      } finally {
        setScheduleLoading(false);
      }
    } else {
      // For guest users, update local state
      setStudySchedule(schedule =>
        schedule.map(item =>
          item.id === editingScheduleId ? { ...item, ...newScheduleItem } : item
        )
      );
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
  const isDateInPast = (dateString: string): boolean => {
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
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                Learn Smarter with AI
              </h1>
              <p className="text-xl sm:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
                Personalized tutoring, interactive quizzes, and progress tracking - all powered by advanced AI technology
              </p>
              
              {/* Chat Input for Logged-out Users */}
              <div className="max-w-2xl mx-auto mb-8">
                <form onSubmit={handleChatSubmit} className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Try asking: 'Explain photosynthesis' or 'Help me with calculus'"
                    className="flex-1 px-6 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                    disabled={chatLoading}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || chatLoading}
                    className="px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {chatLoading ? (
                      <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Ask AI Tutor</span>
                      </>
                    )}
                  </button>
                </form>
                <p className="text-primary-200 text-sm mt-3">
                  Get {guestUsage.chats.remaining} free chat requests • No signup required
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/quiz"
                  className="px-8 py-4 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <FileQuestion className="w-5 h-5" />
                  <span>Try Free Quiz</span>
                </Link>
                <Link
                  to="/auth"
                  className="px-8 py-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 border border-white border-opacity-30"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Login for Full Access</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Why Choose TutorAI?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Experience the future of personalized learning with our AI-powered platform
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Tutoring</h3>
                <p className="text-gray-600">
                  Get instant, personalized explanations and guidance from our advanced AI tutor
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Personalized Learning</h3>
                <p className="text-gray-600">
                  Adaptive quizzes and content tailored to your learning style and progress
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Progress Tracking</h3>
                <p className="text-gray-600">
                  Monitor your learning journey with detailed analytics and insights
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Instant Feedback</h3>
                <p className="text-gray-600">
                  Get immediate responses and corrections to accelerate your learning
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Safe & Secure</h3>
                <p className="text-gray-600">
                  Your data and privacy are protected with enterprise-grade security
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Community Support</h3>
                <p className="text-gray-600">
                  Join thousands of learners in our supportive educational community
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of students who are already learning smarter with TutorAI
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/auth"
                className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Star className="w-5 h-5" />
                <span>Get Started Free</span>
              </Link>
              <button
                onClick={() => {
                  const element = document.querySelector('.hero-section');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 text-white font-semibold rounded-lg transition-colors duration-200"
              >
                Try Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Logged-in user view
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

      {/* Chat Bot Section */}
      <div className="mb-8">
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center mr-3">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary-900">AI Tutor Assistant</h2>
              <p className="text-sm text-primary-700">What would you like to learn about today?</p>
            </div>
          </div>
          
          <form onSubmit={handleChatSubmit} className="flex space-x-3">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask me anything... e.g., 'Explain photosynthesis' or 'Help me with calculus'"
              className="flex-1 px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              disabled={chatLoading}
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {chatLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{chatLoading ? 'Starting...' : 'Ask'}</span>
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* My Study Schedule Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary-600" />
                My Study Schedule
              </h2>
              <button
                onClick={() => setShowScheduleForm(true)}
                className="btn-primary flex items-center space-x-2 text-sm"
                disabled={scheduleLoading}
              >
                <Plus className="w-4 h-4" />
                <span>Add Lesson</span>
              </button>
            </div>

            {showScheduleForm && (
              <div className="card mb-4 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingScheduleId ? 'Edit Study Session' : 'Add New Study Session'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Lesson title"
                    value={newScheduleItem.title}
                    onChange={(e) => setNewScheduleItem({...newScheduleItem, title: e.target.value})}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Subject"
                    value={newScheduleItem.subject}
                    onChange={(e) => setNewScheduleItem({...newScheduleItem, subject: e.target.value})}
                    className="input-field"
                  />
                  <input
                    type="date"
                    value={newScheduleItem.date}
                    onChange={(e) => setNewScheduleItem({...newScheduleItem, date: e.target.value})}
                    className="input-field"
                  />
                  <input
                    type="time"
                    value={newScheduleItem.time}
                    onChange={(e) => setNewScheduleItem({...newScheduleItem, time: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={editingScheduleId ? updateScheduleItem : addScheduleItem}
                    className="btn-primary"
                    disabled={scheduleLoading}
                  >
                    {scheduleLoading ? 'Saving...' : editingScheduleId ? 'Update Session' : 'Add Session'}
                  </button>
                  <button
                    onClick={cancelScheduleForm}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="card">
              {scheduleLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading schedule...</p>
                </div>
              ) : studySchedule.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No study sessions scheduled</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first study session to start organizing your learning
                  </p>
                  <button
                    onClick={() => setShowScheduleForm(true)}
                    className="btn-primary"
                  >
                    Add Study Session
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {studySchedule.map((item) => {
                    const isPastDate = isDateInPast(item.date);
                    
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 ${
                          item.completed
                            ? 'bg-green-50 border-green-200'
                            : isPastDate
                            ? 'bg-red-50 border-red-200'
                            : 'bg-white border-gray-200 hover:border-primary-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleScheduleItem(item.id)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
                              item.completed
                                ? 'bg-green-500 border-green-500'
                                : isPastDate
                                ? 'border-red-300 hover:border-red-500'
                                : 'border-gray-300 hover:border-primary-500'
                            }`}
                          >
                            {item.completed && <CheckCircle className="w-4 h-4 text-white" />}
                          </button>
                          <div>
                            <h4 className={`font-medium ${
                              item.completed 
                                ? 'text-green-700 line-through' 
                                : isPastDate
                                ? 'text-red-700'
                                : 'text-gray-900'
                            }`}>
                              {item.title}
                            </h4>
                            <p className={`text-sm ${
                              isPastDate && !item.completed
                                ? 'text-red-600'
                                : 'text-gray-600'
                            }`}>
                              {item.subject} • {new Date(item.date).toLocaleDateString()} at {item.time}
                              {isPastDate && !item.completed && (
                                <span className="ml-2 text-red-500 font-medium">(Past Due)</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.completed && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              Completed
                            </span>
                          )}
                          {user && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => startEditingScheduleItem(item)}
                                className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteScheduleItem(item.id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
              Consistency is key! Try to stick to your study schedule and review your weak areas regularly for better retention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}