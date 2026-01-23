import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimitPersistent } from "../_shared/rateLimiter.ts";
import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@1.34.0";

/**
 * Obtém headers CORS baseado na origem da requisição
 * Valida contra lista de origens permitidas da variável de ambiente
 */
function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = Deno.env.get("ALLOWED_ORIGINS")?.split(",").map(o => o.trim()) || [];
  
  // Se não houver origens configuradas, permitir todas (desenvolvimento)
  // Em produção, sempre configurar ALLOWED_ORIGINS
  const isAllowed = allowedOrigins.length === 0 || (origin && allowedOrigins.includes(origin));
  const allowedOrigin = isAllowed && origin ? origin : (allowedOrigins[0] || "*");
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Credentials": isAllowed && origin ? "true" : "false",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

interface RequestBody {
  images: Array<{ data: string; mimeType: string }>;
  themes: string[];
  templateId?: string;
}

const ENDPOINT_NAME = 'suggest-prompts';

function validateImageSize(base64Data: string, maxSizeMB: number = 10): boolean {
  const sizeInBytes = (base64Data.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  return sizeInMB <= maxSizeMB;
}

/**
 * Valida MIME type usando magic bytes (primeiros bytes do arquivo)
 * Previne upload de arquivos maliciosos disfarçados como imagens
 */
function validateMimeTypeBackend(base64Data: string, mimeType: string): boolean {
  // Magic bytes para tipos de imagem comuns
  const IMAGE_SIGNATURES: Record<string, string[]> = {
    'image/png': ['89504E47'],
    'image/jpeg': ['FFD8FF', 'FFD8FFE0', 'FFD8FFE1', 'FFD8FFE2'],
    'image/jpg': ['FFD8FF', 'FFD8FFE0', 'FFD8FFE1', 'FFD8FFE2'],
    'image/webp': ['52494646'],
  };

  try {
    // Decodificar primeiros 4 bytes do base64
    const binaryString = atob(base64Data.substring(0, 20)); // Pegar mais bytes para garantir
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Converter primeiros 4 bytes para hex
    const hex = Array.from(bytes.slice(0, 4))
      .map(b => b.toString(16).padStart(2, '0').toUpperCase())
      .join('');

    // Verificar se o hex corresponde ao MIME type declarado
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(mimeType)) {
      return false;
    }

    const signatures = IMAGE_SIGNATURES[mimeType] || [];
    for (const sig of signatures) {
      if (hex.startsWith(sig)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Erro ao validar MIME type:", error);
    return false;
  }
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  
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
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente com service role para rate limiting (bypass RLS)
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

    // Rate limiting persistente
    const rateLimit = await checkRateLimitPersistent(supabase, user.id, ENDPOINT_NAME);
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

    // Validar tamanho e tipo das imagens
    for (const img of images) {
      if (!validateImageSize(img.data, 10)) {
        return new Response(
          JSON.stringify({ error: "Imagem muito grande. Tamanho máximo: 10MB" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validar MIME type usando magic bytes
      if (!validateMimeTypeBackend(img.data, img.mimeType)) {
        return new Response(
          JSON.stringify({ error: "Tipo de arquivo inválido ou corrompido. Use PNG, JPG, JPEG ou WEBP." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validar templateId se fornecido
    const VALID_TEMPLATE_IDS = [
      'company-presentation',
      'pitch-deck',
      'enhance',
      'restore',
      'ecommerce-product',
      'restaurant-food',
      'social-media-post',
      'mascot-2d',
      'mascot-3d',
      'game-concept-art'
    ];

    if (body.templateId && !VALID_TEMPLATE_IDS.includes(body.templateId)) {
      return new Response(
        JSON.stringify({ error: "Template inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Preparar instrução para Gemini
    const themesString = themes.join(", ");
    const isMulti = images.length > 1;

    // Se templateId foi fornecido, usar instrução do template
    let systemInstruction: string;
    
    if (body.templateId) {
      // Mapear templateId para instrução especializada
      const templateInstructions: Record<string, string> = {
        'company-presentation': `Create business presentation visuals maintaining brand consistency. Professional layouts, corporate colors, clean typography. Themes: [${themesString}]. Output 2 prompts per theme as JSON array.`,
        
        'pitch-deck': `Create investor-ready pitch deck visuals. Bold graphics, data visualization, startup aesthetics. Themes: [${themesString}]. Output 2 prompts per theme as JSON array.`,
        
        'enhance': `Enhance image quality: upscale resolution, improve sharpness, enhance colors, reduce noise. Maintain original style. Themes: [${themesString}]. Output 2 prompts per theme as JSON array.`,
        
        'restore': `Restore damaged images: remove scratches, fix tears, colorize old photos, reduce noise. Maintain authenticity. Themes: [${themesString}]. Output 2 prompts per theme as JSON array.`,
        
        'ecommerce-product': `Create consistent product photos: clean backgrounds, consistent lighting, professional style. Themes: [${themesString}]. Output 2 prompts per theme as JSON array.`,
        
        'restaurant-food': `Create appetizing food photos: professional styling, consistent lighting, restaurant branding. Themes: [${themesString}]. Output 2 prompts per theme as JSON array.`,
        
        'social-media-post': `Create engaging social media posts with visual consistency. Modern aesthetics, platform-optimized. Themes: [${themesString}]. Output 2 prompts per theme as JSON array.`,
        
        'mascot-2d': `Create consistent 2D mascot designs. Maintain character identity, proportions, style. Themes: [${themesString}]. Output 2 prompts per theme as JSON array.`,
        
        'mascot-3d': `Create consistent 3D character designs. Maintain character identity, proportions, 3D style. Themes: [${themesString}]. Output 2 prompts per theme as JSON array.`,
        
        'game-concept-art': `Create consistent game concept art. Maintain art style and visual language. Themes: [${themesString}]. Output 2 prompts per theme as JSON array.`
      };
      
      systemInstruction = templateInstructions[body.templateId] || 
        `${isMulti ? 'Fuse ideas from multiple images' : 'Preserve visual DNA and style coherence'}. Maintain aesthetic consistency. Themes: [${themesString}]. Output 2 prompts per theme as JSON array.`;
    } else {
      // Instrução padrão
      systemInstruction = `${isMulti ? 'Fuse ideas from multiple images' : 'Preserve visual DNA and style coherence'}. Maintain aesthetic consistency. Themes: [${themesString}]. Output 2 prompts per theme as JSON array.`;
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
        thinkingConfig: { thinkingBudget: 2000 }, // Reduzido de 4000 para 2000 para melhor performance
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
    
    // Detectar erro de WORKER_LIMIT (recursos insuficientes do Supabase)
    const errorMessage = error.message || error.toString() || "";
    const errorCode = error.code || "";
    const isWorkerLimit = errorMessage.includes("WORKER_LIMIT") || 
                          errorMessage.includes("not having enough compute resources") ||
                          errorCode === "WORKER_LIMIT";
    
    if (isWorkerLimit) {
      return new Response(
        JSON.stringify({ 
          error: "Servidor temporariamente sobrecarregado. Por favor, tente novamente em alguns instantes.",
          code: "WORKER_LIMIT",
          retryAfter: 30
        }),
        { 
          status: 503, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": "30"
          } 
        }
      );
    }
    
    // Detectar erro de modelo sobrecarregado do Gemini
    if (errorMessage.includes("overloaded") || errorMessage.includes("UNAVAILABLE") || errorCode === 503) {
      return new Response(
        JSON.stringify({ 
          error: "O modelo de IA está temporariamente sobrecarregado. Por favor, tente novamente em alguns instantes.",
          code: "MODEL_OVERLOADED",
          retryAfter: 30
        }),
        { 
          status: 503, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": "30"
          } 
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

