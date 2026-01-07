import { Type } from "@google/genai";
import { ModelOption, AnalysisResult } from '../../types';
import { cleanJsonString } from '../../utils';
import { MANAGER_SYSTEM_PROMPT } from './prompts';

export const executeManagerAnalysis = async (
  ai: any,
  model: ModelOption,
  query: string,
  context: string,
  budget: number
): Promise<AnalysisResult> => {
  const managerSchema = {
    type: Type.OBJECT,
    properties: {
      thought_process: { type: Type.STRING, description: "Brief explanation of why these supplementary experts were chosen." },
      experts: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            role: { type: Type.STRING },
            description: { type: Type.STRING },
            temperature: { type: Type.NUMBER },
            prompt: { type: Type.STRING }
          },
          required: ["role", "description", "temperature", "prompt"]
        }
      }
    },
    required: ["thought_process", "experts"]
  };

  const analysisResp = await ai.models.generateContent({
    model: model,
    contents: `Context:\n${context}\n\nCurrent Query: "${query}"`,
    config: {
      systemInstruction: MANAGER_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: managerSchema,
      thinkingConfig: { 
         includeThoughts: true, 
         thinkingBudget: budget 
      }
    }
  });

  const rawText = analysisResp.text || '{}';
  const cleanText = cleanJsonString(rawText);
  
  try {
    const analysisJson = JSON.parse(cleanText) as AnalysisResult;
    if (!analysisJson.experts || !Array.isArray(analysisJson.experts)) {
       throw new Error("Invalid schema structure");
    }
    return analysisJson;
  } catch (e) {
    console.error("JSON Parse Error:", e, rawText);
    return { thought_process: "Direct processing.", experts: [] };
  }
};
