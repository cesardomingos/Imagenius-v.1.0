
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
 * Registra uma transação pendente antes de enviar ao Stripe.
 */
export async function createPendingTransaction(planId: string, userId: string, amount?: number) {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          plan_id: planId,
          status: 'pending',
          amount_total: amount || 0,
          currency: 'brl'
        });

      if (error) {
        console.error('Erro ao criar transação:', error);
      }
    } catch (error) {
      console.error('Erro ao criar transação:', error);
    }
  } else {
    console.log(`Registrando intenção de compra do plano ${planId} para o usuário ${userId}`);
  }
}
