export type ModelOption = 'gemini-3-flash-preview' | 'gemini-3-pro-preview';
export type ThinkingLevel = 'minimal' | 'low' | 'medium' | 'high';

export type ExpertConfig = {
  id: string;
  role: string;
  description: string;
  temperature: number;
  prompt: string;
};

export type ExpertResult = ExpertConfig & {
  status: 'pending' | 'thinking' | 'completed' | 'error';
  content?: string;
  thoughts?: string; 
  thoughtProcess?: string; 
  startTime?: number;
  endTime?: number;
};

export type AnalysisResult = {
  thought_process: string;
  experts: Omit<ExpertConfig, 'id'>[];
};

export type AppState = 'idle' | 'analyzing' | 'experts_working' | 'synthesizing' | 'completed';

export type AppConfig = {
  planningLevel: ThinkingLevel;
  expertLevel: ThinkingLevel;
  synthesisLevel: ThinkingLevel;
  customApiKey?: string;
  customBaseUrl?: string;
  enableCustomApi?: boolean;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'model';
  content: string;
  // DeepThink Artifacts (only for model messages)
  analysis?: AnalysisResult | null;
  experts?: ExpertResult[];
  synthesisThoughts?: string;
  isThinking?: boolean;
  totalDuration?: number; // Total time in ms
};

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  model: ModelOption;
};