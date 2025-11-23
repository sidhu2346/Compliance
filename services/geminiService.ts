import { GoogleGenAI, Chat, GenerateContentResponse, LiveSession } from "@google/genai";
import { MODEL_CHAT, MODEL_IMAGE, SYSTEM_INSTRUCTION } from '../constants';

// Ensure API Key exists
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-build' });

// Chat Service
export const createChat = (): Chat => {
  return ai.chats.create({
    model: MODEL_CHAT,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      // Using search grounding for demonstration
      tools: [{ googleSearch: {} }]
    }
  });
};

// Image Generation Service
export const generateImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_IMAGE,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any, 
          // imageSize not supported for flash-image, using default
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};

// Expose the AI instance for Live API usage in component
export { ai };
