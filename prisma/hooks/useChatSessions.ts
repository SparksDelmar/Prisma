import { useState, useEffect, useCallback } from 'react';
import { ChatSession, ChatMessage, ModelOption } from '../types';

export const useChatSessions = () => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      // Migrate from old key (deepthink-sessions) if present, otherwise use new key (prisma-sessions)
      const saved = localStorage.getItem('prisma-sessions') || localStorage.getItem('deepthink-sessions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('prisma-sessions', JSON.stringify(sessions));
  }, [sessions]);

  const getSession = useCallback((id: string) => {
    return sessions.find(s => s.id === id);
  }, [sessions]);

  const createSession = useCallback((initialMessages: ChatMessage[], model: ModelOption) => {
    const newId = Date.now().toString();
    const title = initialMessages[0].content.slice(0, 40) + (initialMessages[0].content.length > 40 ? '...' : '');
    
    const newSession: ChatSession = {
      id: newId,
      title,
      messages: initialMessages,
      createdAt: Date.now(),
      model
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    return newId;
  }, []);

  const updateSessionMessages = useCallback((sessionId: string, messages: ChatMessage[]) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, messages } : s
    ));
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  }, [currentSessionId]);

  const clearCurrentSession = useCallback(() => {
    setCurrentSessionId(null);
  }, []);

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    createSession,
    updateSessionMessages,
    deleteSession,
    clearCurrentSession,
    getSession
  };
};