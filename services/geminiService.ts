
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Suggests multiple prompts based on a reference image and a list of user themes.
 */
export async function suggestPrompts(imageData: string, mimeType: string, themes: string[]): Promise<string[]> {
  // Always use process.env.API_KEY directly when initializing the GoogleGenAI client instance.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const themesString = themes.join(", ");
  const prompt = `Based on the attached reference image and these specific themes: [${themesString}], 
  generate 4 unique and detailed image generation prompts in English. 
  Each prompt should explore a different combination of the provided themes while maintaining the visual style, character, or core mood of the original image.
  Return the output as a JSON array of 4 strings.`;

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

    // Access the .text property directly (do not call as a method).
    const result = JSON.parse(response.text || "[]");
    return result;
  } catch (error) {
    console.error("Error suggesting prompts:", error);
    return [
      `A high-quality variation of the reference image incorporating ${themesString}`,
      `A cinematic artistic reimagining focusing on ${themes[0] || 'visual style'}`,
      `A detailed stylistic expansion based on ${themes[1] || 'context'}`,
      `An avant-garde interpretation of the source image.`
    ];
  }
}

/**
 * Generates a new image based on a reference image and a chosen prompt.
 */
export async function generateCoherentImage(referenceImageData: string, mimeType: string, prompt: string): Promise<string | null> {
  // Always use process.env.API_KEY directly when initializing the GoogleGenAI client instance.
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

    // Iterate through all parts to find the image part as per guidelines.
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
