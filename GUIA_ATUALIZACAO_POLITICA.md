# Guia de Atualização de Política de Privacidade

Este guia explica como atualizar a Política de Privacidade e garantir que todos os usuários sejam solicitados a dar um novo consentimento.

## Como Funciona

O sistema rastreia a versão da política de privacidade que cada usuário aceitou. Quando você atualiza a política:

1. O sistema detecta que a versão mudou
2. Um modal aparece automaticamente no próximo login do usuário
3. O usuário deve aceitar os novos termos para continuar

## Passo a Passo para Atualizar a Política

### 1. Atualizar o Conteúdo das Políticas

Edite os arquivos:
- `components/PrivacyPolicy.tsx` - Política de Privacidade
- `components/TermsOfService.tsx` - Termos de Uso

### 2. Incrementar a Versão

Edite o arquivo `config/privacyPolicy.ts`:

```typescript
// Antes (exemplo)
export const CURRENT_POLICY_VERSION = '1.0.0';

// Depois (exemplo)
export const CURRENT_POLICY_VERSION = '1.1.0'; // ou '2.0.0' para mudanças maiores
```

**Regras de Versionamento:**
- **MAJOR** (1.0.0 → 2.0.0): Mudanças significativas que definitivamente requerem novo consentimento
- **MINOR** (1.0.0 → 1.1.0): Mudanças menores que podem requerer novo consentimento
- **PATCH** (1.0.0 → 1.0.1): Correções que geralmente não requerem novo consentimento

### 3. Documentar as Mudanças

No mesmo arquivo, adicione uma entrada no changelog:

```typescript
export const POLICY_CHANGELOG: Record<string, string> = {
  '1.0.0': 'Versão inicial da Política de Privacidade e Termos de Uso',
  '1.1.0': 'Adicionada seção sobre uso de cookies e tecnologias de rastreamento'
};
```

### 4. Atualizar a Data

```typescript
export const POLICY_LAST_UPDATED = '2024-02-15'; // Data da atualização
```

### 5. Deploy

Após fazer o deploy:
- Todos os usuários que fizerem login verão o modal de consentimento
- O modal mostrará "Políticas Atualizadas" em vez de apenas "Consentimento de Privacidade"
- Os usuários precisarão aceitar os novos termos para continuar

## Verificação

Após o deploy, teste:

1. Faça login com uma conta existente que já tinha dado consentimento
2. O modal deve aparecer automaticamente
3. O modal deve indicar que as políticas foram atualizadas
4. Após aceitar, o consentimento deve ser salvo com a nova versão

## Banco de Dados

O sistema salva automaticamente:
- `privacy_opt_in`: true/false
- `privacy_opt_in_date`: data do consentimento
- `privacy_policy_version`: versão da política aceita (ex: "1.0.0")

## Consultas Úteis

### Ver usuários que precisam dar novo consentimento:

```sql
SELECT id, email, privacy_opt_in, privacy_policy_version
FROM profiles
WHERE privacy_policy_version != '1.1.0' -- Versão atual
   OR privacy_opt_in = false;
```

### Ver estatísticas de consentimento:

```sql
SELECT 
  privacy_policy_version,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE privacy_opt_in = true) as com_consentimento,
  COUNT(*) FILTER (WHERE privacy_opt_in = false) as sem_consentimento
FROM profiles
GROUP BY privacy_policy_version;
```

## Notas Importantes

1. **Não force consentimento**: O modal permite recusar, mas em produção você pode querer fazer logout do usuário se ele recusar
2. **Teste sempre**: Teste em ambiente de desenvolvimento antes de fazer deploy
3. **Comunicação**: Considere avisar os usuários por email sobre atualizações importantes
4. **Histórico**: Mantenha um histórico das versões e mudanças para auditoria

## Exemplo Completo

```typescript
// config/privacyPolicy.ts

export const CURRENT_POLICY_VERSION = '1.1.0';
export const POLICY_LAST_UPDATED = '2024-02-15';

export const POLICY_CHANGELOG: Record<string, string> = {
  '1.0.0': 'Versão inicial da Política de Privacidade e Termos de Uso',
  '1.1.0': 'Adicionada seção sobre compartilhamento de dados com parceiros e atualização sobre uso de IA'
};
```

Após atualizar e fazer deploy, todos os usuários verão o modal na próxima vez que fizerem login.

