
# Schema do Supabase para o Imagenius

Execute o SQL abaixo no editor de consultas (SQL Editor) do seu projeto Supabase para configurar as tabelas de créditos e transações.

## 1. Tabela de Perfis (Usuários e Créditos)
Esta tabela armazena o saldo atual de cada usuário. Ela é vinculada automaticamente à tabela de autenticação do Supabase.

```sql
-- Criar tabela de perfis
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  credits INTEGER DEFAULT 5 NOT NULL CHECK (credits >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários podem ver o próprio perfil" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Gatilho para criar perfil automaticamente no cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits)
  VALUES (new.id, new.email, 5); -- Inicia com 5 créditos grátis
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 2. Tabela de Transações
Para manter um histórico de compras via Stripe.

```sql
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  stripe_session_id TEXT UNIQUE,
  plan_id TEXT NOT NULL,
  amount_total INTEGER NOT NULL, -- em centavos
  currency TEXT DEFAULT 'brl',
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas transações" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);
```

## 3. Função de Backend (Edge Function) para Webhook do Stripe
Abaixo está a lógica que você deve usar na sua Edge Function para atualizar os créditos:

```javascript
// Exemplo de lógica para o Webhook
const { data, error } = await supabase
  .from('profiles')
  .update({ credits: currentCredits + planCredits })
  .eq('id', userId);
```
