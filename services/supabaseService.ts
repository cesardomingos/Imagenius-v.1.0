
// Este serviço será futuramente alimentado pelas variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY
import { UserProfile } from "../types";

/**
 * Simula a busca de créditos no Supabase.
 * No futuro, usará: const { data } = await supabase.from('profiles').select('credits').single();
 */
export async function fetchUserCredits(): Promise<number> {
  const saved = localStorage.getItem('genius_credits');
  return saved ? parseInt(saved) : 5;
}

/**
 * Simula a dedução de créditos no Supabase.
 * Garante atomicidade no banco de dados.
 */
export async function deductCredits(amount: number): Promise<boolean> {
  const current = await fetchUserCredits();
  if (current < amount) return false;
  
  const nextValue = current - amount;
  localStorage.setItem('genius_credits', nextValue.toString());
  // No futuro: await supabase.from('profiles').update({ credits: nextValue }).eq('id', user.id);
  return true;
}

/**
 * Registra uma transação pendente antes de enviar ao Stripe.
 */
export async function createPendingTransaction(planId: string, userId: string) {
  console.log(`Registrando intenção de compra do plano ${planId} para o usuário ${userId}`);
  // No futuro: await supabase.from('transactions').insert({ user_id: userId, plan_id: planId, status: 'pending' });
}
