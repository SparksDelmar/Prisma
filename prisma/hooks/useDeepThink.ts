import { useState, useRef, useCallback } from 'react';
import { getAI } from '../api';
import { getThinkingBudget } from '../config';
import { AppConfig, ModelOption, AppState, AnalysisResult, ExpertResult, ChatMessage } from '../types';

import { executeManagerAnalysis } from '../services/deepThink/manager';
import { streamExpertResponse } from '../services/deepThink/expert';
import { streamSynthesisResponse } from '../services/deepThink/synthesis';

export const useDeepThink = () => {
  const [appState, setAppState] = useState<AppState>('idle');
  const [managerAnalysis, setManagerAnalysis] = useState<AnalysisResult | null>(null);
  const [experts, setExperts] = useState<ExpertResult[]>([]);
  const [finalOutput, setFinalOutput] = useState('');
  const [synthesisThoughts, setSynthesisThoughts] = useState('');
  
  // Timing state
  const [processStartTime, setProcessStartTime] = useState<number | null>(null);
  const [processEndTime, setProcessEndTime] = useState<number | null>(null);

  // Refs for data consistency during high-frequency streaming updates
  const expertsDataRef = useRef<ExpertResult[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopDeepThink = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setAppState('idle');
    setProcessEndTime(Date.now());
  }, []);

  const resetDeepThink = useCallback(() => {
    setAppState('idle');
    setManagerAnalysis(null);
    setExperts([]);
    expertsDataRef.current = [];
    setFinalOutput('');
    setSynthesisThoughts('');
    setProcessStartTime(null);
    setProcessEndTime(null);
    abortControllerRef.current = null;
  }, []);

  // Helper: Orchestrate a single expert's lifecycle (Start -> Stream -> End)
  const runExpertLifecycle = async (
    expert: ExpertResult,
    index: number,
    ai: any,
    model: ModelOption,
    context: string,
    budget: number,
    signal: AbortSignal
  ): Promise<ExpertResult> => {
    if (signal.aborted) return expert;

    // 1. Mark as thinking
    const startTime = Date.now();
    expertsDataRef.current[index] = { 
        ...expert, 
        status: 'thinking',
        startTime
    };
    setExperts([...expertsDataRef.current]);

    try {
      // 2. Stream execution via service
      let fullContent = "";
      let fullThoughts = "";

      await streamExpertResponse(
        ai,
        model,
        expert,
        context,
        budget,
        signal,
        (textChunk, thoughtChunk) => {
          fullContent += textChunk;
          fullThoughts += thoughtChunk;

          // Update Ref & State live
          expertsDataRef.current[index] = { 
             ...expertsDataRef.current[index], 
             thoughts: fullThoughts,
             content: fullContent 
          };
          setExperts([...expertsDataRef.current]);
        }
      );
      
      if (signal.aborted) return expertsDataRef.current[index];

      // 3. Mark as completed
      expertsDataRef.current[index] = { 
          ...expertsDataRef.current[index], 
          status: 'completed',
          endTime: Date.now()
      };
      setExperts([...expertsDataRef.current]);

      return expertsDataRef.current[index];

    } catch (error) {
       console.error(`Expert ${expert.role} error:`, error);
       if (!signal.aborted) {
           expertsDataRef.current[index] = { 
               ...expertsDataRef.current[index], 
               status: 'error', 
               content: "Failed to generate response.",
               endTime: Date.now()
           };
           setExperts([...expertsDataRef.current]);
       }
       return expertsDataRef.current[index];
    }
  };

  const runDynamicDeepThink = async (
    query: string, 
    history: ChatMessage[],
    model: ModelOption, 
    config: AppConfig
  ) => {
    if (!query.trim()) return;

    // Reset previous run
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setAppState('analyzing');
    setManagerAnalysis(null);
    setExperts([]);
    expertsDataRef.current = [];
    setFinalOutput('');
    setSynthesisThoughts('');
    
    setProcessStartTime(Date.now());
    setProcessEndTime(null);
    
    const ai = getAI({
      apiKey: config.enableCustomApi ? config.customApiKey : undefined,
      baseUrl: (config.enableCustomApi && config.customBaseUrl) ? config.customBaseUrl : undefined
    });

    try {
      const recentHistory = history.slice(-5).map(msg => 
        `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.content}`
      ).join('\n');

      // --- 1. Initialize Primary Expert IMMEDIATELY ---
      const primaryExpert: ExpertResult = {
        id: 'expert-0',
        role: "Primary Responder",
        description: "Directly addresses the user's original query.",
        temperature: 1, 
        prompt: query, 
        status: 'pending'
      };

      expertsDataRef.current = [primaryExpert];
      setExperts([primaryExpert]);

      // --- 2. Start Parallel Execution ---
      
      // Task A: Run Primary Expert (Index 0)
      const primaryExpertTask = runExpertLifecycle(
        primaryExpert,
        0,
        ai,
        model,
        recentHistory,
        getThinkingBudget(config.expertLevel, model),
        signal
      );

      // Task B: Run Manager Analysis via Service
      const managerTask = executeManagerAnalysis(
        ai, 
        model, 
        query, 
        recentHistory, 
        getThinkingBudget(config.planningLevel, model)
      );

      // Wait for Manager Analysis
      const analysisJson = await managerTask;

      if (signal.aborted) return;
      setManagerAnalysis(analysisJson);

      // --- 3. Initialize & Run Supplementary Experts ---
      
      const generatedExperts: ExpertResult[] = analysisJson.experts.map((exp, idx) => ({
        ...exp,
        id: `expert-${idx + 1}`,
        status: 'pending'
      }));

      // Update state: Keep Primary (0) and append new ones
      const currentPrimary = expertsDataRef.current[0];
      const allExperts = [currentPrimary, ...generatedExperts];
      expertsDataRef.current = allExperts;
      setExperts([...allExperts]);
      
      setAppState('experts_working');

      // Task C: Run Supplementary Experts (Offset indices by 1)
      const supplementaryTasks = generatedExperts.map((exp, idx) => 
        runExpertLifecycle(
            exp,
            idx + 1, 
            ai,
            model,
            recentHistory,
            getThinkingBudget(config.expertLevel, model),
            signal
        )
      );

      // --- 4. Wait for ALL Experts ---
      const allResults = await Promise.all([primaryExpertTask, ...supplementaryTasks]);

      if (signal.aborted) return;

      // --- 5. Synthesis ---
      setAppState('synthesizing');

      let fullFinalText = '';
      let fullFinalThoughts = '';

      await streamSynthesisResponse(
        ai,
        model,
        query,
        recentHistory,
        allResults,
        getThinkingBudget(config.synthesisLevel, model),
        signal,
        (textChunk, thoughtChunk) => {
            fullFinalText += textChunk;
            fullFinalThoughts += thoughtChunk;
            setFinalOutput(fullFinalText);
            setSynthesisThoughts(fullFinalThoughts);
        }
      );

      if (!signal.aborted) {
        setAppState('completed');
        setProcessEndTime(Date.now());
      }

    } catch (e: any) {
      if (signal.aborted) {
        console.log('Operation aborted by user');
      } else {
        console.error(e);
        setAppState('idle');
        setProcessEndTime(Date.now());
      }
    } finally {
       abortControllerRef.current = null;
    }
  };

  return {
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
  };
};
