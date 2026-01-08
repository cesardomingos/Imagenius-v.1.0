
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Suggests multiple prompts based on a reference image and a list of user themes.
 * Now generates 2 prompts per theme.
 */
export async function suggestPrompts(imageData: string, mimeType: string, themes: string[]): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const themesString = themes.join(", ");
  const prompt = `Based on the attached reference image and these specific theme ideas: [${themesString}], 
  generate exactly 2 unique and detailed image generation prompts in English FOR EACH of the provided ideas. 
  Each prompt should explore a variation of the specific idea while maintaining the visual style, character, or core mood of the original image.
  Return the output as a flat JSON array of strings.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: imageData, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        }
      }
    });

    const result = JSON.parse(response.text || "[]");
    return result;
  } catch (error) {
    console.error("Error suggesting prompts:", error);
    return themes.flatMap(t => [
      `A high-quality variation of the reference image incorporating ${t}`,
      `A cinematic artistic reimagining focusing on ${t}`
    ]);
  }
}

/**
 * Generates a new image based on a reference image and a chosen prompt.
 */
export async function generateCoherentImage(referenceImageData: string, mimeType: string, prompt: string): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: referenceImageData, mimeType } },
          { text: `Maintain the style and core visual elements of the reference image but modify it according to this prompt: ${prompt}. Ensure high resolution and artistic coherence.` }
        ]
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
