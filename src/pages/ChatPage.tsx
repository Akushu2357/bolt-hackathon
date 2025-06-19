import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Send, 
  Bot, 
  User, 
  Plus, 
  MessageCircle, 
  ChevronRight, 
  ChevronLeft, 
  X,
  Check,
  CheckCheck,
  Circle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { mockChatSessions, getFormattedTime, getMessageTime, MockChatSession, MockMessage } from '../data/mockChatData';

export default function ChatPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<MockChatSession[]>(mockChatSessions);
  const [currentSession, setCurrentSession] = useState<MockChatSession | null>(mockChatSessions[0]);
  const [messages, setMessages] = useState<MockMessage[]>(mockChatSessions[0]?.messages || []);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentSession) {
      setMessages(currentSession.messages);
      // Mark messages as read when switching to a session
      markSessionAsRead(currentSession.id);
    }
  }, [currentSession]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const markSessionAsRead = (sessionId: string) => {
    setSessions(prevSessions => 
      prevSessions.map(session => 
        session.id === sessionId 
          ? { ...session, unreadCount: 0 }
          : session
      )
    );
  };

  const createNewSession = () => {
    const newSession: MockChatSession = {
      id: `new-${Date.now()}`,
      title: 'New Chat Session',
      lastMessage: '',
      timestamp: new Date().toISOString(),
      unreadCount: 0,
      isOnline: true,
      messages: []
    };
    
    setSessions([newSession, ...sessions]);
    setCurrentSession(newSession);
    setMessages([]);
    setShowSidebar(false);
  };

  const selectSession = (session: MockChatSession) => {
    setCurrentSession(session);
    setShowSidebar(false);
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !currentSession || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setLoading(true);

    // Add user message
    const newUserMessage: MockMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    // Simulate AI response after a delay
    setTimeout(() => {
      const aiResponse: MockMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `Thank you for your question: "${userMessage}". This is a mock response. In the real implementation, this would be replaced with actual AI-generated content.`,
        timestamp: new Date().toISOString(),
        status: 'delivered'
      };

      const finalMessages = [...updatedMessages, aiResponse];
      setMessages(finalMessages);

      // Update the session with new messages
      const updatedSession = {
        ...currentSession,
        messages: finalMessages,
        lastMessage: aiResponse.content,
        timestamp: aiResponse.timestamp
      };

      setSessions(prevSessions =>
        prevSessions.map(session =>
          session.id === currentSession.id ? updatedSession : session
        )
      );

      setCurrentSession(updatedSession);
      setLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return <Circle className="w-3 h-3 text-gray-300" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex h-[calc(100vh-8rem)] sm:h-[calc(100vh-12rem)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
          
          {/* Mobile Sidebar Toggle Button */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`lg:hidden fixed top-1/4 -translate-y-1/2 z-50 bg-white border border-gray-200 rounded-r-lg shadow-md p-3 transition-all duration-300 ${
              showSidebar ? 'left-80' : 'left-0'
            }`}
          >
            {showSidebar ? (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Sidebar */}
          <div className={`${
            showSidebar ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:relative inset-y-0 left-0 z-40 w-80 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out lg:transition-none`}>
            
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="lg:hidden p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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
                      className={`group flex items-start p-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-50 ${
                        currentSession?.id === session.id
                          ? 'bg-primary-50 border-l-4 border-primary-500'
                          : ''
                      }`}
                      onClick={() => selectSession(session)}
                    >
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center relative">
                          <Bot className="w-5 h-5 text-primary-600" />
                          {session.isOnline ? (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white">
                              <Wifi className="w-2 h-2 text-white absolute top-0 left-0" />
                            </div>
                          ) : (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 rounded-full border-2 border-white">
                              <WifiOff className="w-2 h-2 text-white absolute top-0 left-0" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {session.title}
                          </h3>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">
                              {getFormattedTime(session.timestamp)}
                            </span>
                            {session.unreadCount > 0 && (
                              <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                                <span className="text-xs text-white font-medium">
                                  {session.unreadCount > 9 ? '9+' : session.unreadCount}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 truncate">
                          {session.lastMessage || 'No messages yet'}
                        </p>
                        
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center space-x-1">
                            <span className={`w-2 h-2 rounded-full ${
                              session.isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`}></span>
                            <span className="text-xs text-gray-500">
                              {session.isOnline ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Overlay for mobile */}
          {showSidebar && (
            <div 
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30" 
              onClick={() => setShowSidebar(false)}
            ></div>
          )}

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {currentSession ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center relative">
                      <Bot className="w-4 h-4 text-primary-600" />
                      {currentSession.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {currentSession.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {currentSession.isOnline ? 'Online' : 'Last seen recently'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <Bot className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Start a conversation
                      </h3>
                      <p className="text-gray-600">
                        Ask me anything! I'm here to help you learn.
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
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
                            <div className={`flex items-center justify-between mt-1 space-x-2 ${
                              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                            }`}>
                              <span className={`text-xs ${
                                message.role === 'user' ? 'text-primary-200' : 'text-gray-500'
                              }`}>
                                {getMessageTime(message.timestamp)}
                              </span>
                              {message.role === 'user' && (
                                <div className="flex items-center">
                                  {getStatusIcon(message.status)}
                                </div>
                              )}
                            </div>
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
                  <div className="flex space-x-2 sm:space-x-4">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message here... (Mock interface - messages won't be saved)"
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
                  <p className="text-xs text-gray-500 mt-2">
                    This is a mock interface. Messages are not saved and will reset on page refresh.
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <MessageCircle className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No chat selected
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm sm:text-base">
                    Select a chat session from the sidebar to start messaging
                  </p>
                  <button
                    onClick={createNewSession}
                    className="btn-primary"
                  >
                    Start New Chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}