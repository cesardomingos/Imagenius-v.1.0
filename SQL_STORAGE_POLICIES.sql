-- ============================================
-- Configuração do Storage Bucket e Políticas RLS
-- ============================================
-- Execute este script no SQL Editor do Supabase para configurar
-- o bucket de imagens geradas e suas políticas de segurança.

-- 1. Criar o bucket 'generated-images' (se não existir)
-- Nota: Buckets são criados via Dashboard ou API, mas podemos verificar se existe
-- Se o bucket já existir, este comando será ignorado

-- IMPORTANTE: Crie o bucket manualmente no Dashboard do Supabase:
-- Storage > Create a new bucket
-- Nome: generated-images
-- Public: true (para permitir acesso público às imagens)
-- File size limit: 10MB (ou o valor desejado)
-- Allowed MIME types: image/*

-- 2. Habilitar RLS no storage.objects
-- (RLS já está habilitado por padrão no Supabase Storage)

-- Remover políticas antigas se existirem (para evitar conflitos)
DROP POLICY IF EXISTS "Usuários podem fazer upload em seus próprios diretórios" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem ler suas próprias imagens" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias imagens" ON storage.objects;
DROP POLICY IF EXISTS "Imagens são públicas para leitura" ON storage.objects;

-- 3. Política: Usuários autenticados podem fazer upload em seus próprios diretórios
-- O caminho deve seguir o formato: {user_id}/{filename}
CREATE POLICY "Usuários podem fazer upload em seus próprios diretórios"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'generated-images' 
  AND (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- 4. Política: Usuários podem ler suas próprias imagens
CREATE POLICY "Usuários podem ler suas próprias imagens"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'generated-images' 
  AND (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- 5. Política: Usuários podem deletar suas próprias imagens
CREATE POLICY "Usuários podem deletar suas próprias imagens"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'generated-images' 
  AND (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- 6. Política: Permitir leitura pública de imagens (opcional)
-- Descomente as linhas abaixo se quiser que as imagens sejam acessíveis publicamente
-- CREATE POLICY "Imagens são públicas para leitura"
-- ON storage.objects
-- FOR SELECT
-- TO public
-- USING (bucket_id = 'generated-images');

-- 7. NOTA SOBRE SERVICE_ROLE:
-- Se a edge function usar SUPABASE_SERVICE_ROLE_KEY, ela automaticamente bypassa RLS
-- Não é necessário criar políticas específicas para service_role
-- A edge function já foi atualizada para usar service_role quando disponível

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Certifique-se de que o bucket 'generated-images' existe no Dashboard
-- 2. Se você quiser usar service_role na edge function (recomendado para produção),
--    atualize a edge function para usar SUPABASE_SERVICE_ROLE_KEY ao invés de SUPABASE_ANON_KEY
-- 3. As políticas acima garantem que usuários só podem acessar arquivos em seus próprios diretórios
-- 4. O formato do caminho deve ser: {user_id}/{filename}.png

