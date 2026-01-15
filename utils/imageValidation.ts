
export interface ValidationResult {
  valid: boolean;
  error?: string;
  resizedData?: string;
}

/**
 * Magic bytes para tipos de imagem comuns
 */
const IMAGE_SIGNATURES: Record<string, string[]> = {
  'image/png': ['89504E47'],
  'image/jpeg': ['FFD8FF', 'FFD8FFE0', 'FFD8FFE1', 'FFD8FFE2'],
  'image/jpg': ['FFD8FF', 'FFD8FFE0', 'FFD8FFE1', 'FFD8FFE2'],
  'image/webp': ['52494646'],
};

/**
 * Valida o tamanho de uma imagem em base64
 */
export function validateImageSize(base64Data: string, maxSizeMB: number = 10): boolean {
  // Calcular tamanho aproximado (base64 é ~33% maior que binário)
  const sizeInBytes = (base64Data.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  return sizeInMB <= maxSizeMB;
}

/**
 * Valida o tipo MIME real do arquivo usando magic bytes
 */
export async function validateMimeType(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer.slice(0, 4));
      const hex = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0').toUpperCase())
        .join('');

      // Verificar se o hex corresponde a algum tipo de imagem conhecido
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      for (const type of validTypes) {
        const signatures = IMAGE_SIGNATURES[type] || [];
        for (const sig of signatures) {
          if (hex.startsWith(sig)) {
            // Verificar se o tipo MIME do arquivo corresponde
            resolve(file.type === type || file.type === '' || validTypes.includes(file.type));
            return;
          }
        }
      }
      resolve(false);
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
}

/**
 * Remove metadados EXIF de uma imagem redesenhand-a em um canvas
 * Isso remove automaticamente todos os metadados EXIF, GPS, etc.
 */
export function removeExifMetadata(
  base64Data: string,
  mimeType: string = 'image/png'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Criar canvas com as mesmas dimensões da imagem
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Não foi possível criar contexto do canvas'));
        return;
      }

      // Desenhar imagem no canvas (isso remove todos os metadados)
      ctx.drawImage(img, 0, 0);
      
      // Converter para o formato desejado (PNG por padrão remove EXIF)
      // Usar o mimeType original se for PNG, caso contrário usar PNG para garantir remoção
      const outputMimeType = mimeType === 'image/png' ? 'image/png' : 'image/png';
      const cleanedBase64 = canvas.toDataURL(outputMimeType);
      
      // Remover o prefixo data:image/png;base64,
      const base64DataOnly = cleanedBase64.split(',')[1];
      resolve(base64DataOnly);
    };

    img.onerror = () => {
      reject(new Error('Erro ao carregar imagem para remoção de EXIF'));
    };

    // Converter base64 para data URL para o Image
    // Detectar mimeType do base64 ou usar o fornecido
    const dataUrl = base64Data.includes(',') 
      ? base64Data 
      : `data:${mimeType};base64,${base64Data}`;
    img.src = dataUrl;
  });
}

/**
 * Redimensiona uma imagem se necessário
 * Também remove metadados EXIF e aplica compressão de qualidade
 */
export function resizeImageIfNeeded(
  base64Data: string,
  maxWidth: number = 2048,
  maxHeight: number = 2048,
  removeExif: boolean = true,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Se a imagem já está dentro dos limites e não precisa remover EXIF, retornar original
      if (width <= maxWidth && height <= maxHeight && !removeExif) {
        resolve(base64Data);
        return;
      }

      // Calcular novas dimensões mantendo aspect ratio (se necessário)
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      // Criar canvas para redimensionar, remover EXIF e comprimir
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Não foi possível criar contexto do canvas'));
        return;
      }

      // Melhorar qualidade de renderização
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Determinar formato de saída baseado no tamanho original
      // JPEG com qualidade para imagens grandes, PNG para pequenas
      const useJPEG = (width * height) > 500000; // ~700x700 pixels
      const mimeType = useJPEG ? 'image/jpeg' : 'image/png';
      const outputQuality = useJPEG ? quality : undefined; // PNG não usa quality
      
      // Converter de volta para base64 com compressão
      const compressedBase64 = canvas.toDataURL(mimeType, outputQuality);
      // Remover o prefixo data:image/...;base64,
      const base64DataOnly = compressedBase64.split(',')[1];
      resolve(base64DataOnly);
    };

    img.onerror = () => {
      reject(new Error('Erro ao carregar imagem para redimensionamento'));
    };

    // Converter base64 para data URL para o Image
    const dataUrl = base64Data.includes(',') 
      ? base64Data 
      : `data:image/png;base64,${base64Data}`;
    img.src = dataUrl;
  });
}

/**
 * Valida um arquivo de imagem completo
 */
export async function validateImageFile(file: File, maxSizeMB: number = 10): Promise<ValidationResult> {
  // Validar tamanho do arquivo
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB. Tamanho atual: ${fileSizeMB.toFixed(2)}MB`
    };
  }

  // Validar tipo MIME
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não suportado. Tipos permitidos: PNG, JPG, JPEG, WEBP`
    };
  }

  // Validar magic bytes
  const isValidMime = await validateMimeType(file);
  if (!isValidMime) {
    return {
      valid: false,
      error: 'Arquivo não é uma imagem válida ou está corrompido'
    };
  }

  return { valid: true };
}

