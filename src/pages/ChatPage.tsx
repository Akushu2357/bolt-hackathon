import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, MessageCircle, Trash2, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import RealTimeChatComponent from '../components/chat/RealTimeChatComponent';
import QuizContextBanner from '../components/chat/QuizContextBanner';
import QuizSuggestedPrompts from '../components/chat/QuizSuggestedPrompts';
import { useChatSession } from '../hooks/useChatSession';
import { ChatApiService, ChatMessage } from '../services/chatApiService';
import { QuizChatIntegrationService, QuizChatContext } from '../services/quizChatIntegrationService';

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(sessionId);
  const [quizContext, setQuizContext] = useState<QuizChatContext | null>(null);
  const [showQuizBanner, setShowQuizBanner] = useState(false);
  const [hasProcessedInitialMessage, setHasProcessedInitialMessage] = useState(false);

  const {
    currentSession,
    messages,
    loading: sessionLoading,
    error: sessionError,
    saveMessage,
    createNewSession,
    updateSessionTitle,
    setMessages
  } = useChatSession(activeSessionId);

  useEffect(() => {
    if (user) {
      fetchSessions();
    } else {
      setLoadingSessions(false);
    }
  }, [user]);

  // Handle initial message from HomePage and trigger bot response
  useEffect(() => {
    // Prevent processing the same initial message multiple times
    if (hasProcessedInitialMessage) return;

    const { state } = location as {
      state?: {
        fromQuiz?: boolean;
        quizContext?: QuizChatContext;
        initialMessage?: string;
        triggerBotResponse?: boolean;
      };
    };

    // Case 1: From HomePage with initial message and trigger bot response
    if (state?.initialMessage && state?.triggerBotResponse) {
      const userMessage: ChatMessage = {
        id: `homepage_${Date.now()}`,
        role: 'user',
        content: state.initialMessage,
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      setMessages([userMessage]);
      setHasProcessedInitialMessage(true);
      
      // Trigger bot response automatically after a short delay to ensure message is set
      setTimeout(() => {
        handleSendMessageFromHomePage(state.initialMessage!);
      }, 100);
      
      // Clear state to prevent re-triggering
      navigate(location.pathname, { replace: true });
      return;
    }

    // Case 2: From quiz with context
    if (state?.fromQuiz) {
      if (state.quizContext) {
        setQuizContext(state.quizContext);
        setShowQuizBanner(true);
      }

      if (state.initialMessage) {
        const userMessage: ChatMessage = {
          id: `quiz_initial_${Date.now()}`,
          role: 'user',
          content: state.initialMessage,
          timestamp: new Date().toISOString(),
          type: 'text',
        };
        setMessages([userMessage]);
        setHasProcessedInitialMessage(true);
      } else if (state.quizContext) {
        const autoMessage = QuizChatIntegrationService.createInitialChatMessage(state.quizContext);
        const userMessage: ChatMessage = {
          id: `quiz_auto_${Date.now()}`,
          role: 'user',
          content: autoMessage,
          timestamp: new Date().toISOString(),
          type: 'text',
        };
        setMessages([userMessage]);
        setHasProcessedInitialMessage(true);
      }

      navigate(location.pathname, { replace: true });
      return;
    }

    // Case 3: Stored context from previous session
    const storedContext = QuizChatIntegrationService.getAndClearQuizContext();
    if (storedContext) {
      setQuizContext(storedContext);
      setShowQuizBanner(true);

      const autoMessage = QuizChatIntegrationService.createInitialChatMessage(storedContext);
      const userMessage: ChatMessage = {
        id: `quiz_stored_${Date.now()}`,
        role: 'user',
        content: autoMessage,
        timestamp: new Date().toISOString(),
        type: 'text',
      };
      setMessages([userMessage]);
      setHasProcessedInitialMessage(true);
      return;
    }

    // Case 4: Guest with URL param (legacy support)
    const urlParams = new URLSearchParams(location.search);
    const urlInitialMessage = urlParams.get('message');

    if (urlInitialMessage && !user && !hasProcessedInitialMessage) {
      const userMessage: ChatMessage = {
        id: `initial_${Date.now()}`,
        role: 'user',
        content: urlInitialMessage,
        timestamp: new Date().toISOString(),
        type: 'text',
      };
      setMessages([userMessage]);
      setHasProcessedInitialMessage(true);

      // Trigger bot response for URL param messages
      setTimeout(() => {
        handleSendMessageFromHomePage(urlInitialMessage);
      }, 100);

      navigate('/chat', { replace: true });
    }
  }, [location, navigate, user, setMessages, hasProcessedInitialMessage]);

  // Function to handle sending message from HomePage and getting bot response
  const handleSendMessageFromHomePage = async (text: string) => {
    try {
      // Create context for the message
      const context = quizContext 
        ? [`Quiz context: User completed a ${quizContext.topic} quiz (${quizContext.difficulty} difficulty) with ${quizContext.score}% score. Weak areas: ${quizContext.weakAreas.join(', ')}`]
        : [];

      // Send to AI and get response
      const botReply = await ChatApiService.sendMessage(text, activeSessionId || 'guest', context);
      
      // Add bot response to messages
      setMessages(prev => [...prev, botReply]);
      
      // Save bot message if user is authenticated
      if (user && activeSessionId) {
        await saveMessage(botReply);
      }
    } catch (error) {
      console.error('Error getting bot response:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        type: 'error',
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const fetchSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
      
      // If no active session and we have sessions, select the first one
      if (!activeSessionId && data && data.length > 0) {
        setActiveSessionId(data[0].id);
        navigate(`/chat/${data[0].id}`, { replace: true });
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleCreateNewSession = async () => {
    const newSession = await createNewSession();
    if (newSession) {
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
      navigate(`/chat/${newSession.id}`);
      setShowSidebar(false);
      // Clear quiz context when starting new session
      setQuizContext(null);
      setShowQuizBanner(false);
      // Reset the processed flag for new sessions
      setHasProcessedInitialMessage(false);
    }
  };

  const handleSelectSession = (session: ChatSession) => {
    setActiveSessionId(session.id);
    navigate(`/chat/${session.id}`);
    setShowSidebar(false);
    // Clear quiz context when switching sessions
    setQuizContext(null);
    setShowQuizBanner(false);
    // Reset the processed flag for session switches
    setHasProcessedInitialMessage(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return;

    try {
      // Delete messages first
      await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionId);

      // Delete session
      await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(updatedSessions);
      
      // If we deleted the active session, switch to another or create new
      if (activeSessionId === sessionId) {
        if (updatedSessions.length > 0) {
          setActiveSessionId(updatedSessions[0].id);
          navigate(`/chat/${updatedSessions[0].id}`);
        } else {
          setActiveSessionId(undefined);
          navigate('/chat');
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleMessageSent = async (message: ChatMessage) => {
    await saveMessage(message);
    
    // Update session title if it's the first user message
    if (message.role === 'user' && currentSession && messages.length <= 1) {
      const title = message.content.length > 50 
        ? message.content.substring(0, 50) + '...' 
        : message.content;
      
      await updateSessionTitle(title);
      
      // Update local sessions list
      setSessions(prev => 
        prev.map(s => s.id === currentSession.id ? { ...s, title } : s)
      );
    }
  };

  const handleQuizGenerated = (quizId: string) => {
    // Navigate to quiz page with the generated quiz
    navigate('/quiz', { 
      state: { 
        startQuizId: quizId 
      } 
    });
  };

  const handlePromptSelect = (prompt: string) => {
    // This will be handled by the RealTimeChatComponent
    // We can pass this down as a prop if needed
  };

  const handleDismissQuizBanner = () => {
    setShowQuizBanner(false);
    setQuizContext(null);
  };

  if (loadingSessions || sessionLoading) {
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
    <div className="h-screen overflow-hidden bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex h-full max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-12rem)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Sidebar - Only show for logged-in users */}
          {user && (
            <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out lg:transition-none`}>
              {/* Sidebar Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-primary-600" />
                    AI Chats
                  </h2>
                </div>
                <button
                  onClick={handleCreateNewSession}
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
                    <p className="text-xs text-gray-400 mt-1">Create your first chat to get started</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                          activeSessionId === session.id
                            ? 'bg-primary-50 text-primary-700 border border-primary-200'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleSelectSession(session)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {session.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(session.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
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

          {/* Sidebar Toggle Button (left side) */}
          {user && (
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`lg:hidden fixed top-1/3 z-40 bg-white border border-gray-200 rounded-r-lg shadow-md pt-7 pe-1 pb-7 transition-transform duration-300 ${
                showSidebar ? 'translate-x-80' : 'translate-x-0'
              }`}
              style={{ left: 0 }}
            >
              {showSidebar ? (
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              )}
            </button>
          )}

          {/* Chat Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {sessionError ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Error Loading Chat
                  </h3>
                  <p className="text-gray-600 mb-4">{sessionError}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="btn-primary"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Quiz Context Banner (Fixed) */}
                {showQuizBanner && quizContext && (
                  <div className="shrink-0 p-4 border-b border-gray-200 bg-white">
                    <QuizContextBanner
                      quizContext={quizContext}
                      onDismiss={handleDismissQuizBanner}
                    />
                  </div>
                )}

                {/* Quiz Suggested Prompts (Fixed) */}
                {quizContext && messages.length === 0 && (
                  <div className="shrink-0 p-4 border-b border-gray-200 bg-white">
                    <QuizSuggestedPrompts
                      quizContext={quizContext}
                      onPromptSelect={handlePromptSelect}
                    />
                  </div>
                )}

                {/* Chat Messages (Scrollable) */}
                <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-white">
                  <RealTimeChatComponent
                    sessionId={activeSessionId || 'guest'}
                    initialMessages={messages}
                    onMessageSent={handleMessageSent}
                    onQuizGenerated={handleQuizGenerated}
                    quizContext={quizContext}
                  />
                </div>

              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}