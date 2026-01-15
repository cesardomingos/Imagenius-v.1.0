import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  logSecurityEvent,
  extractRequestInfo,
  createRateLimitEvent,
  createInvalidOriginEvent,
  createInvalidMimeEvent,
  createPromptSanitizedEvent,
  createInvalidTemplateEvent,
  createTimeoutEvent,
  createErrorEvent
} from "../_shared/securityLogger.ts";
import { createSanitizedErrorResponse, isProduction } from "../_shared/errorSanitizer.ts";
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
  prompt: string;
  mode: 'single' | 'studio';
}

// Rate limiting simples em memória (em produção, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const MAX_REQUESTS_PER_MINUTE = 10;

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

/**
 * Sanitiza prompt usando validação de comprimento e moderação de conteúdo
 */
function sanitizePrompt(prompt: string, userId?: string): string {
  const MAX_PROMPT_LENGTH = 2000;
  
  // Validar comprimento
  if (prompt.length > MAX_PROMPT_LENGTH) {
    throw new Error(`Prompt muito longo. Máximo de ${MAX_PROMPT_LENGTH} caracteres.`);
  }

  // Lista expandida de padrões bloqueados
  const blockedPatterns = [
    /nude|naked|explicit|nsfw|porn|sex/gi,
    /genital|breast|penis|vagina/gi,
    /violence|kill|murder|death|suicide|torture|gore/gi,
    /weapon|gun|knife|bomb|explosive/gi,
    /hate|discrimination|racism|sexism|homophobia/gi,
    /nazi|kkk|fascist/gi,
    /drug|marijuana|cocaine|heroin/gi,
    /illegal|crime|theft|robbery/gi,
    /spam|scam|phishing|malware|virus/gi,
  ];
  
  let sanitized = prompt.trim();
  let wasModified = false;

  // Aplicar filtros
  for (const pattern of blockedPatterns) {
    if (pattern.test(sanitized)) {
      sanitized = sanitized.replace(pattern, '[conteúdo filtrado]');
      wasModified = true;
    }
  }

  // Remover caracteres suspeitos
  const suspiciousChars = /[^\x20-\x7E\u00A0-\uFFFF]/g;
  const before = sanitized;
  sanitized = sanitized.replace(suspiciousChars, '');
  if (sanitized !== before) {
    wasModified = true;
  }

  // Logar tentativas de bypass
  if (wasModified && userId) {
    console.warn('[Content Moderation] Prompt modificado', {
      userId,
      originalLength: prompt.length,
      sanitizedLength: sanitized.length
    });
  }
  
  return sanitized.trim();
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const requestInfo = extractRequestInfo(req);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Validar origem e logar se inválida
  const allowedOrigins = Deno.env.get("ALLOWED_ORIGINS")?.split(",").map(o => o.trim()) || [];
  if (allowedOrigins.length > 0 && origin && !allowedOrigins.includes(origin)) {
    await logSecurityEvent(createInvalidOriginEvent(origin, requestInfo.ip, requestInfo.userAgent));
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
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

    // Criar cliente para validar usuário (usa anon key com token do usuário)
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

    // Criar cliente para storage usando service_role (bypass RLS)
    // Isso é seguro porque já validamos que o usuário está autenticado
    const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

    // Rate limiting persistente
    const rateLimit = await checkRateLimit(supabase, user.id, ENDPOINT_NAME);
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
    const { images, prompt, mode } = body;

    if (!images || images.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma imagem fornecida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!prompt || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Prompt não fornecido" }),
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

    // Sanitizar prompt com validação de comprimento
    let sanitizedPrompt: string;
    try {
      sanitizedPrompt = sanitizePrompt(prompt, user.id);
    } catch (error: any) {
      return new Response(
        JSON.stringify({ error: error.message || "Prompt inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Preparar instrução para Gemini em formato JSON estruturado
    const isMulti = mode === 'studio' && images.length > 1;
    
    // Criar objeto JSON estruturado para o prompt
    const promptStructure = {
      task: isMulti ? "idea_fusion" : "dna_preservation",
      mode: mode,
      instruction: sanitizedPrompt,
      image_count: images.length,
      requirements: {
        preserve_style: true,
        maintain_coherence: true,
        quality: "high"
      }
    };

    // Converter para string JSON formatada
    const instruction = JSON.stringify(promptStructure, null, 2);

    const imageParts = images.map(img => ({
      inlineData: { data: img.data, mimeType: img.mimeType }
    }));

    // Chamar Gemini API com prompt em formato JSON
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    
    // Construir prompt final com contexto JSON
    const finalPrompt = `Generate an image following this JSON specification:
${instruction}

Interpret the instruction field and create the image accordingly. Maintain visual coherence and style consistency.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [...imageParts, { text: finalPrompt }]
      }
    });

    // Extrair imagem gerada
    let imageBase64: string | null = null;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageBase64 = part.inlineData.data;
        break;
      }
    }

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Não foi possível gerar a imagem" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upload para Supabase Storage
    const imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
    const fileName = `${user.id}/${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('generated-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError);
      // Retornar base64 como fallback se upload falhar
      return new Response(
        JSON.stringify({ 
          imageUrl: `data:image/png;base64,${imageBase64}`,
          warning: "Upload para storage falhou, retornando base64"
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('generated-images')
      .getPublicUrl(fileName);

    return new Response(
      JSON.stringify({ 
        imageUrl: urlData.publicUrl,
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

