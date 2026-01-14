
/**
 * Script para popular a galeria com imagens de exemplo
 * 
 * NOTA: Este script deve ser executado manualmente após criar imagens de exemplo.
 * 
 * Para usar:
 * 1. Gere 20-30 imagens de alta qualidade usando o próprio Imagenius
 * 2. Salve as URLs das imagens e prompts
 * 3. Execute este script com os dados
 * 
 * Ou use o SQL direto no Supabase:
 */

export interface SeedImage {
  image_url: string;
  prompt: string;
  author_email?: string;
  is_example?: boolean;
}

/**
 * Exemplos de imagens para seed (substitua com URLs reais)
 */
export const SEED_IMAGES: SeedImage[] = [
  {
    image_url: 'https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=Exemplo+1',
    prompt: 'Uma paisagem futurista com arquitetura minimalista, estilo cyberpunk, cores vibrantes',
    is_example: true
  },
  {
    image_url: 'https://via.placeholder.com/800x600/7C3AED/FFFFFF?text=Exemplo+2',
    prompt: 'Retrato de personagem fantástico com iluminação dramática, estilo concept art',
    is_example: true
  },
  {
    image_url: 'https://via.placeholder.com/800x600/EC4899/FFFFFF?text=Exemplo+3',
    prompt: 'Cena de cidade noturna com neons, estilo blade runner, atmosfera cinematográfica',
    is_example: true
  },
  // Adicione mais exemplos aqui...
];

/**
 * SQL para inserir imagens de exemplo diretamente no banco
 * 
 * Execute este SQL no Supabase SQL Editor:
 */
export const SEED_SQL = `
-- Inserir imagens de exemplo na galeria comunitária
-- Substitua os valores de image_url e prompt com dados reais

INSERT INTO community_arts (image_url, prompt, author_email, is_shared, created_at)
VALUES
  ('https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=Exemplo+1', 'Uma paisagem futurista com arquitetura minimalista, estilo cyberpunk, cores vibrantes', 'exemplo@imagenius.com', true, NOW()),
  ('https://via.placeholder.com/800x600/7C3AED/FFFFFF?text=Exemplo+2', 'Retrato de personagem fantástico com iluminação dramática, estilo concept art', 'exemplo@imagenius.com', true, NOW()),
  ('https://via.placeholder.com/800x600/EC4899/FFFFFF?text=Exemplo+3', 'Cena de cidade noturna com neons, estilo blade runner, atmosfera cinematográfica', 'exemplo@imagenius.com', true, NOW())
  -- Adicione mais linhas aqui com suas imagens reais
ON CONFLICT DO NOTHING;

-- Nota: Você precisará gerar as imagens primeiro usando o Imagenius
-- e então atualizar este SQL com as URLs reais das imagens geradas
`;

/**
 * Função para inserir imagens de exemplo via API (se necessário)
 * 
 * Esta função pode ser chamada do frontend em modo desenvolvimento
 * para popular a galeria com exemplos
 */
export async function seedGalleryImages(images: SeedImage[]): Promise<void> {
  // Esta função seria implementada se necessário
  // Por enquanto, use o SQL direto no Supabase
  console.log('Use o SQL fornecido acima para inserir imagens de exemplo no banco de dados.');
  console.log('Ou gere as imagens usando o próprio Imagenius e insira manualmente.');
}

