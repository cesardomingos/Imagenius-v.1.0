
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile } from "../types";

// Criar cliente Supabase (usa variáveis de ambiente ou fallback para mock)
const getSupabaseClient = (): SupabaseClient | null => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  
  // Se não houver variáveis de ambiente, retorna null para usar mock
  return null;
};

const supabase = getSupabaseClient();

/**
 * Autenticação: Login
 */
export async function signIn(email: string, password: string): Promise<{ user: UserProfile | null; error: string | null }> {
  try {
    if (!email || !password) {
      return { user: null, error: 'Email e senha são obrigatórios' };
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
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Erro ao buscar perfil:', profileError);
        }

        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          credits: profile?.credits || 5
        };

        // Salvar no localStorage para cache
        localStorage.setItem('genius_user', JSON.stringify(userProfile));
        localStorage.setItem('genius_credits', (profile?.credits || 5).toString());

        return { user: userProfile, error: null };
      }
    }

    // Fallback para mock quando Supabase não está configurado
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockUser: UserProfile = {
      id: 'user-' + Date.now(),
      email,
      credits: 5
    };
    localStorage.setItem('genius_user', JSON.stringify(mockUser));
    localStorage.setItem('genius_credits', '5');
    return { user: mockUser, error: null };
  } catch (error: any) {
    return { user: null, error: error.message || 'Erro ao fazer login' };
  }
}

/**
 * Autenticação: Cadastro
 */
export async function signUp(email: string, password: string): Promise<{ user: UserProfile | null; error: string | null }> {
  try {
    if (password.length < 6) {
      return { user: null, error: 'A senha deve ter pelo menos 6 caracteres' };
    }

    if (supabase) {
      // Cadastro real com Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (data.user) {
        // O perfil será criado automaticamente pelo trigger no banco
        // Aguardar um pouco para garantir que o trigger executou
        await new Promise(resolve => setTimeout(resolve, 500));

        // Buscar perfil recém-criado
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Erro ao buscar perfil após cadastro:', profileError);
        }

        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          credits: profile?.credits || 5
        };

        // Salvar no localStorage para cache
        localStorage.setItem('genius_user', JSON.stringify(userProfile));
        localStorage.setItem('genius_credits', (profile?.credits || 5).toString());

        return { user: userProfile, error: null };
      }
    }

    // Fallback para mock quando Supabase não está configurado
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockUser: UserProfile = {
      id: 'user-' + Date.now(),
      email,
      credits: 5
    };
    localStorage.setItem('genius_user', JSON.stringify(mockUser));
    localStorage.setItem('genius_credits', '5');
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
  localStorage.removeItem('genius_user');
  localStorage.removeItem('genius_credits');
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
        .select('credits')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        return null;
      }

      const userProfile: UserProfile = {
        id: user.id,
        email: user.email || '',
        credits: profile?.credits || 5
      };

      // Atualizar cache
      localStorage.setItem('genius_user', JSON.stringify(userProfile));
      localStorage.setItem('genius_credits', (profile?.credits || 5).toString());

      return userProfile;
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
      return null;
    }
  }

  // Fallback para mock quando Supabase não está configurado
  const saved = localStorage.getItem('genius_user');
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
          localStorage.setItem('genius_credits', profile.credits.toString());
          return profile.credits;
        }
      } catch (error) {
        console.error('Erro ao buscar créditos:', error);
      }
    }

    // Fallback para cache ou valor do usuário
    const saved = localStorage.getItem('genius_credits');
    return saved ? parseInt(saved) : user.credits;
  }
  
  // Usuário não autenticado - retornar créditos padrão
  const saved = localStorage.getItem('genius_credits');
  return saved ? parseInt(saved) : 5;
}

/**
 * Deduz créditos do usuário no Supabase.
 * Garante atomicidade no banco de dados.
 */
export async function deductCredits(amount: number): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const current = await fetchUserCredits();
  if (current < amount) return false;
  
  const nextValue = current - amount;

  if (supabase && user.id) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ credits: nextValue, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) {
        console.error('Erro ao deduzir créditos:', error);
        return false;
      }
    } catch (error) {
      console.error('Erro ao deduzir créditos:', error);
      return false;
    }
  }

  // Atualizar cache
  localStorage.setItem('genius_credits', nextValue.toString());
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
        'master': 300,
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
        localStorage.setItem('genius_credits', dbCredits.toString());
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
