import { ModelOption, ExpertResult } from '../../types';
import { getExpertSystemInstruction } from './prompts';

export const streamExpertResponse = async (
  ai: any,
  model: ModelOption,
  expert: ExpertResult,
  context: string,
  budget: number,
  signal: AbortSignal,
  onChunk: (text: string, thought: string) => void
): Promise<void> => {
  const streamResult = await ai.models.generateContentStream({
    model: model,
    contents: expert.prompt,
    config: {
      systemInstruction: getExpertSystemInstruction(expert.role, expert.description, context),
      temperature: expert.temperature,
      thinkingConfig: { 
          thinkingBudget: budget,
          includeThoughts: true 
      }
    }
  });

  for await (const chunk of streamResult) {
     if (signal.aborted) break;

     let chunkText = "";
     let chunkThought = "";

     if (chunk.candidates?.[0]?.content?.parts) {
         for (const part of chunk.candidates[0].content.parts) {
             if (part.thought) {
                 chunkThought += (part.text || "");
             } else if (part.text) {
                 chunkText += part.text;
             }
         }
         onChunk(chunkText, chunkThought);
     }
  }
};
