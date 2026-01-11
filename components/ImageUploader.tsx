
import React, { useRef } from 'react';

interface ImageUploaderProps {
  onUpload: (base64: string, mimeType: string) => void;
  label?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload, label = "Clique para enviar" }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;

    // Security: File Type Validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Tipo de arquivo não suportado. Use JPG, PNG ou WEBP.");
      return;
    }

    // Security: File Size Validation
    if (file.size > MAX_FILE_SIZE) {
      alert("O arquivo é muito grande. O limite é de 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const base64Data = result.split(',')[1];
      onUpload(base64Data, file.type);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      alert("Erro ao ler o arquivo. Tente novamente.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <label className="flex flex-col items-center justify-center w-full h-48 border-4 border-slate-200 border-dashed rounded-[2.5rem] cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-indigo-300 transition-all duration-300 group">
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/>
            </svg>
          </div>
          <p className="mb-1 text-sm text-slate-600 font-bold">{label}</p>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">JPG, PNG ou WEBP (Max 5MB)</p>
        </div>
        <input 
          id="file-upload-input"
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange} 
        />
      </label>
    </div>
  );
};

export default ImageUploader;
