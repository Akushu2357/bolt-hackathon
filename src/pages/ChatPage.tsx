import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Send, Bot, User, Plus, MessageCircle, Trash2, Menu, X, LogIn, Settings, Zap } from 'lucide-react';
import GuestLimitModal from '../components/common/GuestLimitModal';
import { GuestLimitService } from '../services/guestLimitService';
import { AIChatService, ChatMessage as AIChatMessage } from '../services/aiChatService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [guestMessages, setGuestMessages] = useState<Message[]>([]);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [aiProvider, setAiProvider] = useState<'openai' | 'groq' | 'anthropic'>('groq');
  const [providerStatus, setProviderStatus] = useState<Record<string, { available: boolean; name: string }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check provider status
    setProviderStatus(AIChatService.getProviderStatus());
    
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
    } else {
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
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
      
      if (data && data.length > 0) {
        setCurrentSession(data[0]);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const createNewSession = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title: 'New Chat Session'
        })
        .select()
        .single();

      if (error) throw error;
      
      const newSession = data;
      setSessions([newSession, ...sessions]);
      setCurrentSession(newSession);
      setMessages([]);
      setShowSidebar(false);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!user) return;

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
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

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
        const userMsg: Message = {
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

        // Convert messages to AI chat format for context
        const conversationHistory: AIChatMessage[] = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        // Generate AI response using the selected provider
        const aiResponse = await AIChatService.generateResponse(
          userMessage, 
          conversationHistory, 
          aiProvider
        );
        
        const aiMsg: Message = {
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

          setSessions(prev => 
            prev.map(s => s.id === currentSession.id ? { ...s, title } : s)
          );
        }
      } else {
        // Guest user flow
        const userMsg: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: userMessage,
          created_at: new Date().toISOString()
        };

        const newGuestMessages = [...guestMessages, userMsg];
        setGuestMessages(newGuestMessages);

        // Convert guest messages to AI chat format for context
        const conversationHistory: AIChatMessage[] = guestMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        // Generate AI response using the selected provider
        const aiResponse = await AIChatService.generateResponse(
          userMessage, 
          conversationHistory, 
          aiProvider
        );
        
        const aiMsg: Message = {
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
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const displayMessages = user ? messages : guestMessages;
  const canSendMessage = user || GuestLimitService.canPerformAction('chat');
  const guestUsage = GuestLimitService.getUsageSummary();

  if (loadingSessions) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex h-[calc(100vh-8rem)] sm:h-[calc(100vh-12rem)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Sidebar - Only show for logged-in users */}
          {user && (
            <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out lg:transition-none`}>
              {/* Sidebar Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="AI Settings"
                    >
                      <Settings className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setShowSidebar(false)}
                      className="lg:hidden p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* AI Provider Settings */}
                {showSettings && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">AI Provider</h3>
                    <div className="space-y-2">
                      {Object.entries(providerStatus).map(([key, status]) => (
                        <label key={key} className="flex items-center">
                          <input
                            type="radio"
                            name="aiProvider"
                            value={key}
                            checked={aiProvider === key}
                            onChange={(e) => setAiProvider(e.target.value as any)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">{status.name}</span>
                          {status.available ? (
                            <Zap className="w-3 h-3 text-green-500 ml-1" />
                          ) : (
                            <span className="text-xs text-gray-400 ml-1">(No API key)</span>
                          )}
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Add API keys to .env file to enable real AI responses
                    </p>
                  </div>
                )}

                <button
                  onClick={createNewSession}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Chat</span>
                </button>
              </div>
              
              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto">
                {sessions.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No chat sessions yet</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                          currentSession?.id === session.id
                            ? 'bg-primary-50 text-primary-700'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          setCurrentSession(session);
                          setShowSidebar(false);
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {session.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(session.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Overlay for mobile */}
          {showSidebar && (
            <div 
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" 
              onClick={() => setShowSidebar(false)}
            ></div>
          )}

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {user && (
                    <button
                      onClick={() => setShowSidebar(true)}
                      className="lg:hidden p-1 hover:bg-gray-100 rounded"
                    >
                      <Menu className="w-5 h-5" />
                    </button>
                  )}
                  <h3 className="font-semibold text-gray-900 truncate">
                    {user ? (currentSession?.title || 'AI Tutor Chat') : 'AI Tutor Chat (Guest Mode)'}
                  </h3>
                  {providerStatus[aiProvider]?.available && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <Zap className="w-4 h-4" />
                      <span className="text-xs font-medium">{providerStatus[aiProvider].name}</span>
                    </div>
                  )}
                </div>
                {!user && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {guestUsage.chats.remaining}/{guestUsage.chats.total} free chats left
                    </span>
                    <button
                      onClick={() => navigate('/auth')}
                      className="btn-primary text-sm flex items-center space-x-1"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Login</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {displayMessages.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Bot className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {user ? 'Start a conversation' : 'Welcome to TutorAI!'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {user 
                      ? 'Ask me anything! I\'m here to help you learn.'
                      : `You have ${guestUsage.chats.remaining} free chat${guestUsage.chats.remaining !== 1 ? 's' : ''} remaining. Login for unlimited access!`
                    }
                  </p>
                  {!providerStatus[aiProvider]?.available && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-md mx-auto">
                      <p className="text-sm text-yellow-700">
                        💡 <strong>Tip:</strong> Add API keys to .env file for real AI responses!
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                displayMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-[85%] sm:max-w-3xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-2 sm:ml-3' : 'mr-2 sm:mr-3'}`}>
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user' 
                            ? 'bg-primary-600' 
                            : 'bg-gray-200'
                        }`}>
                          {message.role === 'user' ? (
                            <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          ) : (
                            <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                          )}
                        </div>
                      </div>
                      <div className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="whitespace-pre-wrap text-sm sm:text-base">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex max-w-3xl">
                    <div className="flex-shrink-0 mr-2 sm:mr-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                      </div>
                    </div>
                    <div className="px-3 py-2 sm:px-4 sm:py-2 rounded-lg bg-gray-100">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
              {!canSendMessage ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">
                    You've used all {guestUsage.chats.total} free chats. Login to continue chatting!
                  </p>
                  <button
                    onClick={() => navigate('/auth')}
                    className="btn-primary flex items-center justify-center space-x-2 mx-auto"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login for Unlimited Access</span>
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2 sm:space-x-4">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    className="flex-1 resize-none input-field text-sm sm:text-base"
                    rows={1}
                    disabled={loading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || loading}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-3 sm:px-4"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Guest Limit Modal */}
      <GuestLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        limitType="chat"
      />
    </div>
  );
}