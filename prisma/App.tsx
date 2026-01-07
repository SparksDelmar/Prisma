import React, { useState, useEffect } from 'react';
import { ModelOption, AppConfig, ChatMessage } from './types';
import { getValidThinkingLevels } from './config';
import { useDeepThink } from './hooks/useDeepThink';
import { useChatSessions } from './hooks/useChatSessions';

import SettingsModal from './SettingsModal';
import Header from './components/Header';
import ChatInput from './components/InputSection';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

const App = () => {
  // Session Management
  const { 
    sessions, 
    currentSessionId, 
    setCurrentSessionId,
    createSession, 
    updateSessionMessages, 
    deleteSession,
    getSession
  } = useChatSessions();

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Active Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState('');

  // App Configuration
  const [selectedModel, setSelectedModel] = useState<ModelOption>('gemini-3-flash-preview');
  const [config, setConfig] = useState<AppConfig>({
    planningLevel: 'high',
    expertLevel: 'high',
    synthesisLevel: 'high',
    customApiKey: '',
    customBaseUrl: '',
    enableCustomApi: false
  });

  // Deep Think Engine
  const { 
    appState, 
    managerAnalysis, 
    experts, 
    finalOutput, 
    synthesisThoughts, 
    runDynamicDeepThink,
    stopDeepThink,
    resetDeepThink,
    processStartTime,
    processEndTime
  } = useDeepThink();

  // Handle Model Constraints
  useEffect(() => {
    const validLevels = getValidThinkingLevels(selectedModel);
    setConfig(prev => ({
      ...prev,
      planningLevel: validLevels.includes(prev.planningLevel) ? prev.planningLevel : 'low',
      expertLevel: validLevels.includes(prev.expertLevel) ? prev.expertLevel : 'low',
      synthesisLevel: validLevels.includes(prev.synthesisLevel) ? prev.synthesisLevel : 'high',
    }));
  }, [selectedModel]);

  // Sync Messages when switching sessions
  useEffect(() => {
    if (currentSessionId) {
      const session = getSession(currentSessionId);
      if (session) {
        setMessages(session.messages);
        setSelectedModel(session.model || 'gemini-3-flash-preview');
      }
    } else {
      setMessages([]);
    }
  }, [currentSessionId, getSession]);

  // Handle AI Completion
  useEffect(() => {
    if (appState === 'completed') {
      const finalizedMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: finalOutput,
        analysis: managerAnalysis,
        experts: experts,
        synthesisThoughts: synthesisThoughts,
        isThinking: false,
        totalDuration: (processStartTime && processEndTime) ? (processEndTime - processStartTime) : undefined
      };
      
      const newMessages = [...messages, finalizedMessage];
      setMessages(newMessages);

      if (currentSessionId) {
        updateSessionMessages(currentSessionId, newMessages);
      } else {
        createSession(newMessages, selectedModel);
      }

      resetDeepThink();
    }
  }, [appState, finalOutput, managerAnalysis, experts, synthesisThoughts, resetDeepThink, processStartTime, processEndTime, currentSessionId, messages, selectedModel, createSession, updateSessionMessages]);

  const handleRun = () => {
    if (!query.trim()) return;
    
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages); // Optimistic update
    
    // Manage Session Persistence
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      activeSessionId = createSession(newMessages, selectedModel);
    } else {
      updateSessionMessages(activeSessionId, newMessages);
    }

    // Run AI
    runDynamicDeepThink(query, messages, selectedModel, config);
    setQuery('');
  };

  const handleNewChat = () => {
    stopDeepThink();
    setCurrentSessionId(null);
    setMessages([]);
    setQuery('');
    resetDeepThink();
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleSelectSession = (id: string) => {
    stopDeepThink();
    resetDeepThink();
    setCurrentSessionId(id);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSession(id);
    if (currentSessionId === id) {
      handleNewChat();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        setConfig={setConfig}
        model={selectedModel}
      />

      <Header 
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onNewChat={handleNewChat}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
        />

        <main className="flex-1 flex flex-col min-w-0 bg-white relative">
          <ChatArea 
            messages={messages}
            appState={appState}
            managerAnalysis={managerAnalysis}
            experts={experts}
            finalOutput={finalOutput}
            processStartTime={processStartTime}
            processEndTime={processEndTime}
          />

          {/* Floating Footer Input */}
          <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none p-4 pb-6 flex justify-center bg-gradient-to-t from-white via-white/80 to-transparent">
            <div className="pointer-events-auto w-full max-w-4xl">
              <ChatInput 
                query={query} 
                setQuery={setQuery} 
                onRun={handleRun} 
                onStop={stopDeepThink}
                appState={appState} 
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;