import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ChatMessage } from '../services/chatApiService';

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useChatSession(sessionId?: string) {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load session and messages
  useEffect(() => {
    if (user && sessionId) {
      loadSession(sessionId);
    } else if (!user) {
      // For guest users, load from localStorage
      loadGuestMessages();
    } else {
      setLoading(false);
    }
  }, [user, sessionId]);

  const loadSession = async (id: string) => {
    try {
      setLoading(true);
      
      // Load session details
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', id)
        .eq('user_id', user!.id)
        .single();

      if (sessionError) throw sessionError;
      setCurrentSession(session);

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Convert to ChatMessage format
      const chatMessages: ChatMessage[] = messagesData.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.created_at,
        type: 'text'
      }));

      setMessages(chatMessages);
    } catch (err) {
      console.error('Error loading session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const loadGuestMessages = () => {
    try {
      const savedMessages = localStorage.getItem('guestMessages');
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
      }
    } catch (err) {
      console.error('Error loading guest messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveMessage = useCallback(async (message: ChatMessage) => {
    if (user && currentSession) {
      // Save to database for authenticated users
      try {
        await supabase
          .from('chat_messages')
          .insert({
            session_id: currentSession.id,
            role: message.role,
            content: message.content
          });

        // Update session timestamp
        await supabase
          .from('chat_sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', currentSession.id);

      } catch (err) {
        console.error('Error saving message:', err);
      }
    } else if (!user) {
      // Save to localStorage for guest users
      try {
        const updatedMessages = [...messages, message];
        setMessages(updatedMessages);
        localStorage.setItem('guestMessages', JSON.stringify(updatedMessages));
      } catch (err) {
        console.error('Error saving guest message:', err);
      }
    }
  }, [user, currentSession, messages]);

  const createNewSession = useCallback(async (title: string = 'New Chat') => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title
        })
        .select()
        .single();

      if (error) throw error;
      
      setCurrentSession(data);
      setMessages([]);
      return data;
    } catch (err) {
      console.error('Error creating session:', err);
      setError(err instanceof Error ? err.message : 'Failed to create session');
      return null;
    }
  }, [user]);

  const updateSessionTitle = useCallback(async (title: string) => {
    if (!user || !currentSession) return;

    try {
      await supabase
        .from('chat_sessions')
        .update({ title })
        .eq('id', currentSession.id);

      setCurrentSession(prev => prev ? { ...prev, title } : null);
    } catch (err) {
      console.error('Error updating session title:', err);
    }
  }, [user, currentSession]);

  return {
    currentSession,
    messages,
    loading,
    error,
    saveMessage,
    createNewSession,
    updateSessionTitle,
    setMessages
  };
}