import { ModelOption, ExpertResult } from '../../types';
import { getExpertSystemInstruction } from './prompts';
import { withRetry } from '../utils/retry';

export const streamExpertResponse = async (
  ai: any,
  model: ModelOption,
  expert: ExpertResult,
  context: string,
  budget: number,
  signal: AbortSignal,
  onChunk: (text: string, thought: string) => void
): Promise<void> => {
  // We wrap the stream initiation in retry. 
  // If the stream is successfully established but fails during iteration, 
  // we catch that separately.
  const streamResult = await withRetry(() => ai.models.generateContentStream({
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
  }));

  try {
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
  } catch (streamError) {
    console.error(`Stream interrupted for expert ${expert.role}:`, streamError);
    // We don't retry mid-stream automatically here to avoid complex state management,
    // but the initial connection is protected by withRetry.
    throw streamError;
  }
};
