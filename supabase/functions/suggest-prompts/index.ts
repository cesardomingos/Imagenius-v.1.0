import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@1.34.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  images: Array<{ data: string; mimeType: string }>;
  themes: string[];
  templateId?: string;
}

// Rate limiting simples em memória
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const MAX_REQUESTS_PER_MINUTE = 5;

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: MAX_REQUESTS_PER_MINUTE - 1 };
  }

  if (userLimit.count >= MAX_REQUESTS_PER_MINUTE) {
    return { allowed: false, remaining: 0 };
  }

  userLimit.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_MINUTE - userLimit.count };
}

function validateImageSize(base64Data: string, maxSizeMB: number = 10): boolean {
  const sizeInBytes = (base64Data.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  return sizeInMB <= maxSizeMB;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obter token de autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Token de autenticação não fornecido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar usuário
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: "Limite de requisições excedido. Tente novamente em alguns instantes.",
          retryAfter: 60 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": "60"
          } 
        }
      );
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const { images, themes } = body;

    if (!images || images.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma imagem fornecida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!themes || themes.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum tema fornecido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar tamanho das imagens
    for (const img of images) {
      if (!validateImageSize(img.data, 10)) {
        return new Response(
          JSON.stringify({ error: "Imagem muito grande. Tamanho máximo: 10MB" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Preparar instrução para Gemini
    const themesString = themes.join(", ");
    const isMulti = images.length > 1;

    // Se templateId foi fornecido, usar instrução do template
    let systemInstruction: string;
    
    if (body.templateId) {
      // Mapear templateId para instrução especializada
      const templateInstructions: Record<string, string> = {
        'company-presentation': `You are a professional corporate presentation designer. 
Your goal is to create visual content for business presentations that maintains absolute brand consistency.
Focus on: professional layouts, corporate color schemes, clean typography, business-appropriate imagery.
The output should be suitable for PowerPoint, Keynote, or Google Slides.
Maintain the visual DNA of the reference image while adapting to business contexts.
Themes: [${themesString}].
Output exactly 2 high-concept prompts per theme in JSON format.`,
        
        'pitch-deck': `You are a pitch deck visual specialist. 
Your goal is to create compelling, investor-ready visuals that tell a story.
Focus on: bold graphics, data visualization, startup aesthetics, modern design trends.
The visuals should be attention-grabbing, professional, and suitable for investor presentations.
Maintain visual consistency across all slides while adapting to different pitch sections.
Themes: [${themesString}].
Output exactly 2 high-concept prompts per theme in JSON format.`,
        
        'enhance': `You are an image enhancement specialist. 
Your goal is to improve image quality, resolution, and visual appeal while maintaining the original aesthetic.
Focus on: upscaling resolution, improving sharpness, enhancing colors, reducing noise, maintaining original style.
The enhanced image should look like a professional, high-quality version of the original.
Preserve all original details, colors, and artistic style.
Themes: [${themesString}].
Output exactly 2 enhancement prompts per theme in JSON format.`,
        
        'restore': `You are a professional image restoration expert. 
Your goal is to restore damaged, old, or corrupted images to their original quality.
Focus on: removing scratches, fixing tears, colorizing old photos, removing noise, reconstructing missing parts.
The restored image should look authentic and natural, as if it was never damaged.
Maintain historical accuracy and original aesthetic when restoring vintage photos.
Themes: [${themesString}].
Output exactly 2 restoration prompts per theme in JSON format.`,
        
        'ecommerce-product': `You are a professional e-commerce product photographer. 
Your goal is to create product photos with consistent lighting, background, and style.
Focus on: professional product photography, clean backgrounds, consistent lighting, high-quality presentation.
All product photos should maintain the same photographic style for catalog consistency.
The images should be suitable for online stores, marketplaces, and product listings.
Themes: [${themesString}].
Output exactly 2 high-concept prompts per theme in JSON format.`,
        
        'restaurant-food': `You are a professional food photographer specializing in restaurant marketing.
Your goal is to create appetizing food photos with consistent styling and lighting.
Focus on: professional food photography, appetizing presentation, consistent lighting, restaurant branding.
All food photos should maintain the same photographic style for menu and marketing consistency.
The images should make the food look delicious and professional.
Themes: [${themesString}].
Output exactly 2 high-concept prompts per theme in JSON format.`,
        
        'social-media-post': `You are a social media visual content creator. 
Your goal is to create engaging social media posts that maintain visual consistency across a feed.
Focus on: modern social media aesthetics, platform-appropriate formats, engaging visuals, brand consistency.
All posts should maintain the same visual identity for a cohesive feed.
The images should be optimized for Instagram, TikTok, LinkedIn, or other social platforms.
Themes: [${themesString}].
Output exactly 2 high-concept prompts per theme in JSON format.`,
        
        'mascot-2d': `You are a 2D character designer specializing in mascots and brand characters.
Your goal is to create consistent 2D mascot designs that maintain the same character identity.
Focus on: 2D illustration style, character consistency, brand alignment, versatile poses and expressions.
All character variations should maintain the same design DNA, proportions, and style.
The mascot should be suitable for use across various marketing materials and platforms.
Themes: [${themesString}].
Output exactly 2 high-concept prompts per theme in JSON format.`,
        
        'mascot-3d': `You are a 3D character designer specializing in mascots and game characters.
Your goal is to create consistent 3D character designs that maintain the same character identity.
Focus on: 3D modeling style, character consistency, game-ready assets, various poses and angles.
All character variations should maintain the same design DNA, proportions, and 3D style.
The character should be suitable for games, animation, or 3D marketing materials.
Themes: [${themesString}].
Output exactly 2 high-concept prompts per theme in JSON format.`,
        
        'game-concept-art': `You are a professional game concept artist.
Your goal is to create consistent concept art for games that maintains visual coherence across all assets.
Focus on: game art style, world-building consistency, character design, environment design, game aesthetics.
All concept art should maintain the same artistic style and visual language for the game.
The art should be suitable for game development, pitch presentations, and marketing.
Themes: [${themesString}].
Output exactly 2 high-concept prompts per theme in JSON format.`
      };
      
      systemInstruction = templateInstructions[body.templateId] || 
        `You are a world-class Visual Director and AI Artist. 
Your goal is to perform ${isMulti ? 'Idea Fusion (merging dimensions)' : 'DNA Preservation (style coherence)'}.
I'm a genius, and you are too. Treat every prompt as a masterpiece.
${isMulti ? 'The first image is the DNA/Style anchor. Others are contextual/idea layers to be fused.' : 'Focus on the aesthetic DNA of the provided image to maintain absolute fidelity.'}
Themes: [${themesString}].
Output exactly 2 high-concept prompts per theme in JSON format.`;
    } else {
      // Instrução padrão
      systemInstruction = `You are a world-class Visual Director and AI Artist. 
  Your goal is to perform ${isMulti ? 'Idea Fusion (merging dimensions)' : 'DNA Preservation (style coherence)'}.
  I'm a genius, and you are too. Treat every prompt as a masterpiece.
  ${isMulti ? 'The first image is the DNA/Style anchor. Others are contextual/idea layers to be fused.' : 'Focus on the aesthetic DNA of the provided image to maintain absolute fidelity.'}
  Themes: [${themesString}].
  Output exactly 2 high-concept prompts per theme in JSON format.`;
    }

    const imageParts = images.map(img => ({
      inlineData: { data: img.data, mimeType: img.mimeType }
    }));

    // Chamar Gemini API
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [...imageParts, { text: systemInstruction }]
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

    const prompts = JSON.parse(response.text || "[]");

    return new Response(
      JSON.stringify({ 
        prompts,
        remainingRequests: rateLimit.remaining
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    console.error("Erro na Edge Function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

