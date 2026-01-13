
import { GoogleGenAI, Type } from "@google/genai";
import { ImageData } from "../types";
import { recordRequest } from "./quotaTracker";

/**
 * Obtém a API key do Gemini
 */
function getApiKey(): string {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY não configurada. Por favor, crie um arquivo .env na raiz do projeto com:\n" +
      "GEMINI_API_KEY=sua_chave_aqui\n\n" +
      "Obtenha sua chave em: https://aistudio.google.com/apikey"
    );
  }
  return apiKey;
}

/**
 * Sugere prompts baseados em uma ou mais imagens de referência.
 */
export async function suggestPrompts(images: ImageData[], themes: string[]): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
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

    const result = JSON.parse(response.text || "[]");
    // Registra a requisição bem-sucedida
    recordRequest();
    return result;
  } catch (error) {
    console.error("Error suggesting prompts:", error);
    return themes.flatMap(t => [
      `A coherent variation integrating provided references for ${t}`,
      `A cinematic expansion of the primary style focusing on ${t}`
    ]);
  }
}

/**
 * Aguarda um tempo determinado (em milissegundos)
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Gera a imagem final com coerência multi-referencial.
 * Inclui retry logic com backoff exponencial para lidar com rate limiting (429).
 */
export async function generateCoherentImage(
  images: ImageData[], 
  prompt: string, 
  retryCount: number = 0,
  maxRetries: number = 3
): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
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
        // Registra a requisição bem-sucedida
        recordRequest();
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    return null;
  } catch (error: any) {
    console.error("Error generating image:", error);
    
    // Verifica se é erro de quota/rate limit (429 ou RESOURCE_EXHAUSTED)
    const isRateLimitError = error?.status === 429 || 
                            error?.code === 429 ||
                            error?.status === 'RESOURCE_EXHAUSTED' ||
                            error?.error?.code === 429 ||
                            error?.error?.status === 'RESOURCE_EXHAUSTED' ||
                            error?.message?.includes('429') ||
                            error?.message?.toLowerCase().includes('quota') ||
                            error?.message?.toLowerCase().includes('rate limit') ||
                            error?.message?.toLowerCase().includes('too many requests');
    
    if (isRateLimitError && retryCount < maxRetries) {
      // Tenta extrair o tempo de retry sugerido pela API
      let waitTime = Math.pow(2, retryCount) * 2000; // Fallback: backoff exponencial
      
      try {
        // Procura por RetryInfo nos detalhes do erro
        const errorDetails = error?.error?.details || error?.details || [];
        const retryInfo = errorDetails.find((detail: any) => detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');
        
        if (retryInfo?.retryDelay) {
          // Converte o tempo de retry (formato "38s" ou similar)
          const retryDelayStr = retryInfo.retryDelay;
          const seconds = parseFloat(retryDelayStr.replace(/[^\d.]/g, ''));
          if (!isNaN(seconds)) {
            waitTime = Math.ceil(seconds * 1000); // Converte para milissegundos
            // Adiciona um buffer de segurança (10%)
            waitTime = Math.ceil(waitTime * 1.1);
          }
        } else if (error?.message) {
          // Tenta extrair do texto da mensagem (ex: "Please retry in 38.798615266s")
          const retryMatch = error.message.match(/retry in ([\d.]+)s/i);
          if (retryMatch) {
            const seconds = parseFloat(retryMatch[1]);
            if (!isNaN(seconds)) {
              waitTime = Math.ceil(seconds * 1000);
              waitTime = Math.ceil(waitTime * 1.1); // Buffer de 10%
            }
          }
        }
      } catch (parseError) {
        console.warn('Erro ao extrair tempo de retry, usando backoff padrão:', parseError);
      }
      
      const waitSeconds = Math.ceil(waitTime / 1000);
      console.log(`Quota/rate limit atingido. Aguardando ${waitSeconds}s antes de tentar novamente (tentativa ${retryCount + 1}/${maxRetries})...`);
      
      await delay(waitTime);
      
      // Retry com contador incrementado
      return generateCoherentImage(images, prompt, retryCount + 1, maxRetries);
    }
    
    // Se não for erro 429 ou esgotaram as tentativas, lança o erro
    throw error;
  }
}
