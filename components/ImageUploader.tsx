
import React, { useRef, useState } from 'react';
import { validateImageFile, resizeImageIfNeeded } from '../utils/imageValidation';

interface ImageUploaderProps {
  onUpload: (base64: string, mimeType: string) => void;
  label?: string;
  onError?: (error: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onUpload, 
  label = "Clique para enviar",
  onError 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<{ original: number; estimated: number } | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsValidating(true);
    setPreview(null);
    setFileSize(null);

    // Calcular tamanho original
    const originalSize = file.size;
    
    // Estimar tamanho após processamento (base64 é ~33% maior, mas PNG comprimido pode ser menor)
    const estimatedSize = originalSize * 0.8; // Estimativa conservadora
    setFileSize({ original: originalSize, estimated: estimatedSize });

    try {
      // Validar arquivo
      const validation = await validateImageFile(file, 10);
      
      if (!validation.valid) {
        const errorMsg = validation.error || 'Arquivo inválido';
        if (onError) {
          onError(errorMsg);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsValidating(false);
        setFileSize(null);
        return;
      }

      // Ler arquivo
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const result = event.target?.result as string;
          let base64Data = result.split(',')[1];
          
          // Mostrar preview
          setPreview(result);
          
          // Redimensionar se necessário (isso também remove EXIF)
          base64Data = await resizeImageIfNeeded(base64Data, 2048, 2048, true);
          
          // Calcular tamanho final aproximado
          const finalSize = (base64Data.length * 3) / 4; // Base64 para bytes
          setFileSize({ original: originalSize, estimated: finalSize });
          
          onUpload(base64Data, file.type);
          
          // Limpar o input para permitir o mesmo arquivo se necessário
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error: any) {
          const errorMsg = error.message || 'Erro ao processar imagem';
          if (onError) {
            onError(errorMsg);
          }
          setFileSize(null);
        } finally {
          setIsValidating(false);
        }
      };
      
      reader.onerror = () => {
        if (onError) {
          onError('Erro ao ler arquivo');
        }
        setIsValidating(false);
        setFileSize(null);
      };
      
      reader.readAsDataURL(file);
    } catch (error: any) {
      const errorMsg = error.message || 'Erro ao validar arquivo';
      if (onError) {
        onError(errorMsg);
      }
      setIsValidating(false);
      setFileSize(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full space-y-4">
      {preview && (
        <div className="relative w-full max-w-md rounded-2xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-700 shadow-lg">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-auto"
          />
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-black px-2 py-1 rounded-lg">
            ✓ Válido
          </div>
          {fileSize && (
            <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-3 py-2 rounded-lg">
              <div className="flex items-center justify-between">
                <span>Tamanho:</span>
                <div className="flex items-center gap-2">
                  {fileSize.original !== fileSize.estimated && (
                    <span className="text-slate-300 line-through">
                      {formatFileSize(fileSize.original)}
                    </span>
                  )}
                  <span className="font-black">
                    {formatFileSize(fileSize.estimated)}
                  </span>
                  {fileSize.original > fileSize.estimated && (
                    <span className="text-green-400 text-[10px]">
                      ↓ {((1 - fileSize.estimated / fileSize.original) * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <label className={`flex flex-col items-center justify-center w-full h-48 border-4 border-slate-200 dark:border-slate-700 border-dashed rounded-[2.5rem] cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 group ${isValidating ? 'opacity-50 cursor-wait' : ''}`}>
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isValidating ? (
            <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl shadow-sm flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-500 dark:text-indigo-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </div>
          ) : (
            <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/>
              </svg>
            </div>
          )}
          <p className="mb-2 text-sm text-slate-600 dark:text-slate-300 font-bold">
            {isValidating ? 'Validando imagem...' : label}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">
            PNG, JPG, JPEG ou WEBP (máx. 10MB)
          </p>
        </div>
        <input 
          id="file-upload-input"
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFileChange}
          disabled={isValidating}
        />
      </label>
    </div>
  );
};

export default ImageUploader;
