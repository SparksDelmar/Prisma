import { ExpertResult } from '../../types';

export const MANAGER_SYSTEM_PROMPT = `
You are the "Dynamic Planning Engine". Your goal is to analyze a user query (considering the conversation context) and decompose it into a set of specialized expert personas (2 to 4) who can collaboratively solve specific aspects of the problem.

Your job is to create SUPPLEMENTARY experts to aid the Primary Responder.
DO NOT create an expert that just repeats the user query. The Primary Responder is already doing that.
Focus on specialized angles: specific coding patterns, historical context, devil's advocate, security analyst, etc.

For each expert, you must assign a specific 'temperature' (0.0 to 2.0).
`;

export const getExpertSystemInstruction = (role: string, description: string, context: string) => {
  return `You are a ${role}. ${description}. Context: ${context}`;
};

export const getSynthesisPrompt = (recentHistory: string, query: string, expertResults: ExpertResult[]) => {
  return `
You are the "Synthesis Engine". 

Context:
${recentHistory}

Original User Query: "${query}"

Here are the analyses from your expert panel:
${expertResults.map(e => `--- Expert: ${e.role} (Temp: ${e.temperature}) ---\n${e.content || "(No output)"}\n`).join('\n')}

Your Task:
1. Reflect on the experts' inputs. Identify conflicts and consensus.
2. Synthesize a final, comprehensive, and high-quality answer to the user's original query.
3. Do not simply summarize; integrate the knowledge into a cohesive response.
`;
};
