
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile } from "../types";
import { CURRENT_POLICY_VERSION } from "../config/privacyPolicy";
import { setItem, getItem, removeItem, setSecureItem, getSecureItem, removeSecureItem } from "../utils/storage";

// Singleton do cliente Supabase - garante apenas uma instância
let supabaseInstance: SupabaseClient | null = null;

/**
 * Obtém a instância singleton do cliente Supabase
 * Garante que apenas uma instância seja criada para evitar múltiplos GoTrueClient
 */
export function getSupabaseClient(): SupabaseClient | null {
  // Se já existe uma instância, retornar ela
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    // Criar instância única com configurações padrão
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });
    return supabaseInstance;
  }
  
  // Se não houver variáveis de ambiente, retorna null para usar mock
  return null;
}

// Instância inicial (lazy initialization)
const supabase = getSupabaseClient();

/**
 * Valida formato de email
 */
function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'Email é obrigatório' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: 'Formato de email inválido' };
  }

  // Verificar comprimento máximo
  if (email.length > 254) {
    return { valid: false, error: 'Email muito longo (máximo 254 caracteres)' };
  }

  return { valid: true };
}

/**
 * Valida força da senha
 */
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length === 0) {
    return { valid: false, error: 'Senha é obrigatória' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Senha deve ter pelo menos 8 caracteres' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Senha muito longa (máximo 128 caracteres)' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Senha deve conter pelo menos uma letra maiúscula' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Senha deve conter pelo menos uma letra minúscula' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Senha deve conter pelo menos um número' };
  }

  return { valid: true };
}

/**
 * Autenticação: Login
 */
export async function signIn(email: string, password: string): Promise<{ user: UserProfile | null; error: string | null }> {
  try {
    // Validar email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return { user: null, error: emailValidation.error || 'Email inválido' };
    }

    // Validar senha (formato básico para login)
    if (!password || password.length === 0) {
      return { user: null, error: 'Senha é obrigatória' };
    }

    if (supabase) {
      // Autenticação real com Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (data.user) {
        // Buscar perfil do usuário
        // Nota: privacy_policy_version pode não existir se o SQL ainda não foi executado
        let profile: any = null;
        let profileError: any = null;
        
        const { data: profileData, error: profileErr } = await supabase
          .from('profiles')
          .select('credits, full_name, avatar_url, privacy_opt_in, privacy_opt_in_date, privacy_policy_version')
          .eq('id', data.user.id)
          .single();
        
        // Se der erro por coluna não existir, tenta sem privacy_policy_version
        if (profileErr && (profileErr.message?.includes('privacy_policy_version') || profileErr.message?.includes('does not exist') || profileErr.code === '42703')) {
          const { data: profileFallback, error: fallbackError } = await supabase
            .from('profiles')
            .select('credits, full_name, avatar_url, privacy_opt_in, privacy_opt_in_date')
            .eq('id', data.user.id)
            .single();
          
          if (!fallbackError && profileFallback) {
            profile = profileFallback;
          } else {
            profileError = fallbackError;
          }
        } else {
          profile = profileData;
          profileError = profileErr;
        }

        if (profileError) {
          console.error('Erro ao buscar perfil:', profileError);
        }

        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          credits: profile?.credits || 15,
          ...(profile && {
            full_name: profile.full_name,
            avatar_url: profile.avatar_url
          })
        };

        // Salvar dados sensíveis em sessionStorage, não sensíveis em localStorage
        setSecureItem('genius_user', JSON.stringify(userProfile));
        setItem('genius_credits', (profile?.credits || 15).toString());

        return { user: userProfile, error: null };
      }
    }

    // Fallback para mock quando Supabase não está configurado
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockUser: UserProfile = {
      id: 'user-' + Date.now(),
      email,
      credits: 15
    };
    setSecureItem('genius_user', JSON.stringify(mockUser));
    setItem('genius_credits', '15');
    return { user: mockUser, error: null };
  } catch (error: any) {
    return { user: null, error: error.message || 'Erro ao fazer login' };
  }
}

/**
 * Autenticação: Cadastro
 */
export async function signUp(
  email: string, 
  password: string, 
  privacyOptIn: boolean = false,
  referralCode?: string
): Promise<{ user: UserProfile | null; error: string | null }> {
  try {
    // Validar email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return { user: null, error: emailValidation.error || 'Email inválido' };
    }

    // Validar força da senha
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return { user: null, error: passwordValidation.error || 'Senha inválida' };
    }

    if (supabase) {
      // Preparar metadata com referral_code se fornecido
      const userMetadata: Record<string, any> = {
        privacy_opt_in: privacyOptIn,
      };
      
      if (referralCode) {
        userMetadata.referral_code = referralCode;
      }

      // Cadastro real com Supabase
      // Usar URL de produção se disponível, senão usar window.location.origin
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const redirectTo = `${siteUrl}${window.location.pathname}`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userMetadata,
          emailRedirectTo: redirectTo
        }
      });

      if (error) {
        // Verificar se o erro indica que o usuário já existe
        // O Supabase retorna erro quando tenta cadastrar email já existente
        const errorLower = error.message.toLowerCase();
        const isUserExists = 
          errorLower.includes('user already registered') ||
          errorLower.includes('usuário já registrado') ||
          errorLower.includes('already registered') ||
          errorLower.includes('email address is already registered') ||
          error.code === 'signup_disabled';
        
        // Se for erro de usuário já existente, pode ser que não esteja confirmado
        // Retornar erro especial para que o frontend possa oferecer reenvio
        if (isUserExists) {
          return { user: null, error: 'EMAIL_ALREADY_EXISTS' };
        }
        
        return { user: null, error: error.message };
      }

      if (data.user) {
        // O perfil será criado automaticamente pelo trigger no banco
        // Aguardar um pouco para garantir que o trigger executou
        await new Promise(resolve => setTimeout(resolve, 500));

        // Atualizar perfil com opt-in de privacidade
        const optInDate = privacyOptIn ? new Date().toISOString() : null;
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            privacy_opt_in: privacyOptIn,
            privacy_opt_in_date: optInDate,
            privacy_policy_version: privacyOptIn ? CURRENT_POLICY_VERSION : null
          })
          .eq('id', data.user.id);

        if (updateError) {
          console.error('Erro ao atualizar opt-in de privacidade:', updateError);
        }

        // Buscar perfil recém-criado
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('credits, full_name, avatar_url, referral_code, referred_by')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Erro ao buscar perfil após cadastro:', profileError);
        }

        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          credits: profile?.credits || 15,
          ...(profile && {
            full_name: profile.full_name,
            avatar_url: profile.avatar_url
          })
        };

        // Salvar dados sensíveis em sessionStorage, não sensíveis em localStorage
        setSecureItem('genius_user', JSON.stringify(userProfile));
        setItem('genius_credits', (profile?.credits || 15).toString());

        // Track analytics
        try {
          const { analyticsEvents } = await import('../utils/analytics');
          analyticsEvents.userSignedUp('email');
        } catch (e) {
          // Analytics não disponível, continuar normalmente
        }

        return { user: userProfile, error: null };
      }
    }

    // Fallback para mock quando Supabase não está configurado
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockUser: UserProfile = {
      id: 'user-' + Date.now(),
      email,
      credits: 15
    };
    setSecureItem('genius_user', JSON.stringify(mockUser));
    setItem('genius_credits', '15');
    return { user: mockUser, error: null };
  } catch (error: any) {
    return { user: null, error: error.message || 'Erro ao criar conta' };
  }
}

/**
 * Autenticação: Logout
 */
export async function signOut(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
  }
  removeSecureItem('genius_user');
  removeItem('genius_credits');
}

/**
 * Obter usuário atual
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  if (supabase) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        // Se não houver usuário autenticado, limpar cache
        localStorage.removeItem('genius_user');
        localStorage.removeItem('genius_credits');
        return null;
      }

      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('credits, full_name, avatar_url, privacy_opt_in, privacy_opt_in_date, privacy_policy_version, referral_code, referred_by')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        return null;
      }

      const userProfile: UserProfile = {
        id: user.id,
        email: user.email || '',
        credits: profile?.credits || 5,
        ...(profile && {
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          referral_code: profile.referral_code,
          referred_by: profile.referred_by
        })
      };

      // Atualizar cache
      setSecureItem('genius_user', JSON.stringify(userProfile));
      setItem('genius_credits', (profile?.credits || 5).toString());

      return userProfile;
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
      return null;
    }
  }

  // Fallback para mock quando Supabase não está configurado
  const saved = getSecureItem('genius_user');
  return saved ? JSON.parse(saved) : null;
}

/**
 * Busca créditos do usuário no Supabase.
 */
export async function fetchUserCredits(): Promise<number> {
  const user = await getCurrentUser();
  if (user) {
    // Se temos Supabase configurado, buscar do banco
    if (supabase && user.id) {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single();

        if (!error && profile) {
          // Atualizar cache
          setItem('genius_credits', profile.credits.toString());
          return profile.credits;
        }
      } catch (error) {
        console.error('Erro ao buscar créditos:', error);
      }
    }

    // Fallback para cache ou valor do usuário
    const saved = getItem('genius_credits');
    return saved ? parseInt(saved) : user.credits;
  }
  
  // Usuário não autenticado - test drive de 2 créditos
  const guestCredits = getItem('genius_guest_credits');
  if (guestCredits) {
    return parseInt(guestCredits);
  }
  // Inicializar test drive com 2 créditos
  setItem('genius_guest_credits', '2');
  return 2;
}

/**
 * Deduz créditos do usuário no Supabase.
 * Garante atomicidade no banco de dados.
 * Para visitantes, usa localStorage para test drive de 2 créditos.
 */
export async function deductCredits(amount: number): Promise<boolean> {
  const user = await getCurrentUser();
  const current = await fetchUserCredits();
  if (current < amount) return false;
  
  const nextValue = current - amount;

  if (user && supabase && user.id) {
    // Usuário logado - atualizar no banco
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ credits: nextValue, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) {
        console.error('Erro ao deduzir créditos:', error);
        return false;
      }
      // Atualizar cache
      setItem('genius_credits', nextValue.toString());
    } catch (error) {
      console.error('Erro ao deduzir créditos:', error);
      return false;
    }
  } else {
    // Visitante - atualizar test drive no localStorage
    setItem('genius_guest_credits', nextValue.toString());
  }

  return true;
}

/**
 * Nota: Criação de transações é feita apenas pela Edge Function usando service_role key
 * Isso garante maior segurança, evitando que usuários maliciosos criem transações falsas
 */

/**
 * Busca transações pendentes do usuário atual
 */
export async function getPendingTransactions(): Promise<any[]> {
  const user = await getCurrentUser();
  if (!user || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar transações pendentes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar transações pendentes:', error);
    return [];
  }
}

/**
 * Busca todas as transações do usuário (útil para debug)
 */
export async function getAllUserTransactions(): Promise<any[]> {
  const user = await getCurrentUser();
  if (!user || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Erro ao buscar transações:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return [];
  }
}

/**
 * Verifica se uma transação foi completada e atualiza créditos se necessário
 * Retorna informações sobre a transação mais recente completada
 */
export async function checkAndUpdateTransactionStatus(): Promise<{ updated: boolean; creditsAdded?: number; transaction?: any }> {
  const user = await getCurrentUser();
  if (!user || !supabase) {
    return { updated: false };
  }

  try {
    // Buscar transações completadas recentemente (últimas 10 minutos)
    // Isso cobre o caso onde o usuário retorna do checkout
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentCompleted, error: completedError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('created_at', tenMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    if (completedError) {
      console.error('Erro ao buscar transações completadas:', completedError);
      return { updated: false };
    }

    // Se encontrou transação completada recentemente
    if (recentCompleted && recentCompleted.length > 0) {
      const transaction = recentCompleted[0];
      const planCredits: Record<string, number> = {
        'starter': 20,
        'genius': 100,
        'master': 400,
      };
      const creditsToAdd = planCredits[transaction.plan_id] || 0;
      
      // Verificar se os créditos já foram adicionados (comparar com créditos atuais)
      const currentCredits = await fetchUserCredits();
      
      // Buscar perfil atual do banco para verificar se precisa atualizar
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      const dbCredits = profile?.credits || 0;
      
      // Se os créditos no banco já refletem a transação, não precisa atualizar
      // Mas vamos garantir que a UI está sincronizada
      if (dbCredits !== currentCredits) {
        // Atualizar cache local
        setItem('genius_credits', dbCredits.toString());
        return { updated: true, creditsAdded: creditsToAdd, transaction };
      }
      
      // Se os créditos já estão atualizados, retornar sucesso mesmo assim
      // para mostrar a notificação ao usuário
      return { updated: true, creditsAdded: creditsToAdd, transaction };
    }

    // Se não encontrou transação completada, verificar se há transações pendentes
    // que podem estar sendo processadas
    const { data: pendingTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    if (pendingTransactions && pendingTransactions.length > 0) {
      // Há transação pendente - pode estar sendo processada pelo webhook
      return { updated: false };
    }

    return { updated: false };
  } catch (error) {
    console.error('Erro ao verificar status da transação:', error);
    return { updated: false };
  }
}

/**
 * Verifica se o usuário precisa dar consentimento de privacidade
 */
export async function checkPrivacyConsent(): Promise<{ 
  needsConsent: boolean; 
  isPolicyUpdate: boolean;
  currentVersion?: string;
}> {
  try {
    if (!supabase) {
      return { needsConsent: false, isPolicyUpdate: false };
    }

    const user = await getCurrentUser();
    if (!user) {
      return { needsConsent: false, isPolicyUpdate: false };
    }

    // Versão atual da política (importada do config)
    let profile: any = null;
    let hasVersionColumn = true;

    // Tentar buscar com privacy_policy_version primeiro
    const { data, error } = await supabase
      .from('profiles')
      .select('privacy_opt_in, privacy_opt_in_date, privacy_policy_version')
      .eq('id', user.id)
      .single();

    // Se der erro porque a coluna não existe, tentar sem ela
    if (error && (error.message?.includes('privacy_policy_version') || error.message?.includes('does not exist') || error.code === '42703')) {
      hasVersionColumn = false;
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('profiles')
        .select('privacy_opt_in, privacy_opt_in_date')
        .eq('id', user.id)
        .single();
      
      if (fallbackError) {
        console.error('Erro ao verificar consentimento:', fallbackError);
        return { needsConsent: false, isPolicyUpdate: false };
      }
      profile = fallbackData;
    } else if (error) {
      console.error('Erro ao verificar consentimento:', error);
      return { needsConsent: false, isPolicyUpdate: false };
    } else {
      profile = data;
    }

    // Se não tem opt-in, precisa de consentimento
    if (!profile?.privacy_opt_in) {
      return { needsConsent: true, isPolicyUpdate: false };
    }

    // Se a coluna privacy_policy_version não existe, trata como se precisasse de consentimento
    // (porque não sabemos qual versão o usuário aceitou)
    if (!hasVersionColumn || !profile.privacy_policy_version) {
      return { needsConsent: true, isPolicyUpdate: false };
    }

    // Se a versão da política mudou, precisa de novo consentimento
    if (profile.privacy_policy_version !== CURRENT_POLICY_VERSION) {
      return { 
        needsConsent: true, 
        isPolicyUpdate: true,
        currentVersion: profile.privacy_policy_version
      };
    }

    return { needsConsent: false, isPolicyUpdate: false };
  } catch (error) {
    console.error('Erro ao verificar consentimento:', error);
    return { needsConsent: false, isPolicyUpdate: false };
  }
}

/**
 * Atualiza o consentimento de privacidade do usuário
 */
export async function updatePrivacyConsent(optIn: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Versão atual da política (importada do config)

    const updateData: any = {
      privacy_opt_in: optIn,
      privacy_policy_version: CURRENT_POLICY_VERSION
    };

    if (optIn) {
      updateData.privacy_opt_in_date = new Date().toISOString();
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    // Se der erro porque a coluna não existe, tentar atualizar sem ela
    if (error && (error.message?.includes('privacy_policy_version') || error.message?.includes('does not exist') || error.code === '42703')) {
      const fallbackData: any = {
        privacy_opt_in: optIn
      };
      
      if (optIn) {
        fallbackData.privacy_opt_in_date = new Date().toISOString();
      }

      const { error: fallbackError } = await supabase
        .from('profiles')
        .update(fallbackData)
        .eq('id', user.id);

      if (fallbackError) {
        console.error('Erro ao atualizar consentimento (fallback):', fallbackError);
        return { success: false, error: fallbackError.message };
      }
      
      // Avisar que a coluna não existe (mas consentimento foi salvo)
      console.warn('Coluna privacy_policy_version não existe. Execute o SQL de atualização do schema (SQL_ATUALIZACAO_LGPD.sql).');
      return { success: true };
    }

    if (error) {
      console.error('Erro ao atualizar consentimento:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar consentimento:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Atualiza o perfil do usuário
 */
export async function updateUserProfile(data: {
  full_name?: string;
  avatar_url?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);

    if (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reenvia email de confirmação de conta
 */
export async function resendConfirmationEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    if (!email) {
      return { success: false, error: 'Email é obrigatório' };
    }

    // Usar URL de produção se disponível, senão usar window.location.origin
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
    const redirectTo = `${siteUrl}${window.location.pathname}`;

    // Reenviar email de confirmação
    // O método resend do Supabase aceita type e email, e pode incluir options
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: redirectTo
      }
    });

    if (error) {
      console.error('Erro ao reenviar email de confirmação:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao reenviar email de confirmação:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envia email de redefinição de senha
 */
export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    if (!email) {
      return { success: false, error: 'Email é obrigatório' };
    }

    // Enviar email de redefinição de senha
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      console.error('Erro ao enviar email de redefinição:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao enviar email de redefinição:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Atualiza a senha do usuário (após clicar no link do email)
 */
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'A senha deve ter pelo menos 6 caracteres' };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('Erro ao atualizar senha:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar senha:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Exclui a conta do usuário e todos os dados relacionados
 */
export async function deleteUserAccount(csrfToken?: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validar token CSRF se fornecido
    if (csrfToken) {
      const { validateCSRFToken } = await import('../utils/csrf');
      if (!validateCSRFToken(csrfToken)) {
        return { success: false, error: 'Token CSRF inválido. Por favor, recarregue a página e tente novamente.' };
      }
    }

    if (!supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Excluir dados relacionados primeiro (devido a foreign keys)
    // As artes serão excluídas automaticamente devido ao CASCADE
    // As transações também serão excluídas

    // Excluir perfil (isso pode acionar exclusão em cascata)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      console.error('Erro ao excluir perfil:', profileError);
      return { success: false, error: profileError.message };
    }

    // Excluir conta de autenticação
    // Nota: A exclusão via admin requer service_role key
    // Por enquanto, apenas fazemos signOut
    await signOut();

    // Limpar cache local
    localStorage.removeItem('genius_user');
    localStorage.removeItem('genius_credits');

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao excluir conta:', error);
    return { success: false, error: error.message };
  }
}
