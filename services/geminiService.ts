
import { GoogleGenAI, Type } from "@google/genai";
import { ImageData } from "../types";

/**
 * Sugere prompts baseados em uma ou mais imagens de referência.
 */
export async function suggestPrompts(images: ImageData[], themes: string[]): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const themesString = themes.join(", ");
  const isMulti = images.length > 1;

  const systemPrompt = isMulti 
    ? `You are an AI Image Specialist. I've provided ${images.length} images. 
       The FIRST image is the PRIMARY style/character reference. 
       The OTHERS are CONTEXT/ELEMENT references (objects, backgrounds, colors).
       Based on these ideas: [${themesString}], generate exactly 2 detailed prompts per idea that integrate elements from the context images into the primary style.
       Return a flat JSON array of strings.`
    : `Based on the provided reference image and these themes: [${themesString}], 
       generate exactly 2 unique prompts per idea that maintain visual style.
       Return a flat JSON array of strings.`;

  const imageParts = images.map(img => ({
    inlineData: { data: img.data, mimeType: img.mimeType }
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [...imageParts, { text: systemPrompt }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error suggesting prompts:", error);
    return themes.flatMap(t => [
      `A coherent variation integrating provided references for ${t}`,
      `A cinematic expansion of the primary style focusing on ${t}`
    ]);
  }
}

/**
 * Gera a imagem final com coerência multi-referencial.
 */
export async function generateCoherentImage(images: ImageData[], prompt: string): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isMulti = images.length > 1;

  const instruction = isMulti
    ? `PRIMARY STYLE: Image 1. CONTEXT ELEMENTS: Images 2 to ${images.length}. 
       Apply the following prompt to create a NEW image that merges these elements: ${prompt}. 
       Ensure high resolution and perfect artistic coherence.`
    : `Maintain the style of the reference image but modify it according to: ${prompt}.`;

  const imageParts = images.map(img => ({
    inlineData: { data: img.data, mimeType: img.mimeType }
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [...imageParts, { text: instruction }]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}
