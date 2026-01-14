
import React, { useRef } from 'react';

interface ImageUploaderProps {
  onUpload: (base64: string, mimeType: string) => void;
  label?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload, label = "Clique para enviar" }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const base64Data = result.split(',')[1];
        onUpload(base64Data, file.type);
        // Limpar o input para permitir o mesmo arquivo se necessário
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <label className="flex flex-col items-center justify-center w-full h-48 border-4 border-slate-200 dark:border-slate-700 border-dashed rounded-[2.5rem] cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 group">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/>
            </svg>
          </div>
          <p className="mb-2 text-sm text-slate-600 dark:text-slate-300 font-bold">{label}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">PNG, JPG ou JPEG</p>
        </div>
        <input 
          id="file-upload-input"
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept="image/*"
          onChange={handleFileChange} 
        />
      </label>
    </div>
  );
};

export default ImageUploader;
