import { GoogleGenAI } from "@google/genai";

export const getAI = (config?: { apiKey?: string; baseUrl?: string }) => {
  const options: any = {
    apiKey: config?.apiKey || process.env.API_KEY,
  };
  
  if (config?.baseUrl) {
    options.baseUrl = config.baseUrl;
  }

  return new GoogleGenAI(options);
};