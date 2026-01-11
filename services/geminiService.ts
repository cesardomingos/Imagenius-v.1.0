
import { GoogleGenAI, Type } from "@google/genai";
import { ImageData } from "../types";
import { CONFIG } from "./config";
import { sanitizeInput } from "../utils/security";

/**
 * Sugere prompts utilizando o modelo Pro com Thinking Config e sanitização rigorosa.
 */
export async function suggestPrompts(images: ImageData[], themes: string[]): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Sanitização de cada tema individualmente
  const safeThemes = themes
    .map(t => sanitizeInput(t, 100))
    .filter(t => t.length > 0)
    .join(", ");

  const isMulti = images.length > 1;

  const systemPrompt = isMulti 
    ? `You are a professional visual director. 
       Reference 1 is the primary aesthetic anchor. Other images are context. 
       Themes requested: [${safeThemes}]. 
       Task: Generate exactly 2 sophisticated prompts per theme that maintain the visual soul of Reference 1.
       Return a flat JSON array of strings only.`
    : `Maintain style from reference. Create 2 unique prompts for: [${safeThemes}].
       Return a flat JSON array of strings only.`;

  const imageParts = images.map(img => ({
    inlineData: { data: img.data, mimeType: img.mimeType }
  }));

  try {
    const response = await ai.models.generateContent({
      model: CONFIG.MODELS.TEXT,
      contents: {
        parts: [...imageParts, { text: systemPrompt }]
      },
      config: {
        thinkingConfig: { thinkingBudget: 4000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("[Security] Request failed at suggestion layer");
    if (error instanceof Error && error.message.includes("Requested entity was not found")) {
      throw new Error("API_KEY_ERROR");
    }
    throw new Error("SERVICE_UNAVAILABLE");
  }
}

/**
 * Gera a imagem final com alta resolução e prompt sanitizado.
 */
export async function generateCoherentImage(images: ImageData[], prompt: string): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const sanitizedPrompt = sanitizeInput(prompt, 800);

  const imageParts = images.map(img => ({
    inlineData: { data: img.data, mimeType: img.mimeType }
  }));

  try {
    const response = await ai.models.generateContent({
      model: CONFIG.MODELS.IMAGE,
      contents: {
        parts: [...imageParts, { text: sanitizedPrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
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
    console.error("[Security] Request failed at generation layer");
    if (error instanceof Error && error.message.includes("Requested entity was not found")) {
      throw new Error("API_KEY_ERROR");
    }
    throw error;
  }
}
