
import React, { useState } from 'react';
import { GeneratedImage } from '../types';

interface GalleryProps {
  images: GeneratedImage[];
  isBatching?: boolean;
  pendingCount?: number;
}

const Gallery: React.FC<GalleryProps> = ({ images, isBatching, pendingCount = 0 }) => {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  const downloadImage = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `generated-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (images.length === 0 && !isBatching) {
    return (
      <div className="text-center py-20">
        <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <p className="text-slate-500">Nenhuma imagem gerada ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Progressive Loading Skeletons */}
        {Array.from({ length: Math.max(0, pendingCount) }).map((_, i) => (
          <div key={`pending-${i}`} className="relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 animate-pulse">
            <div className="w-full h-72 bg-slate-200 flex items-center justify-center">
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="h-2 w-20 bg-slate-200 rounded"></div>
              <div className="h-4 w-full bg-slate-200 rounded"></div>
              <div className="h-4 w-2/3 bg-slate-200 rounded"></div>
            </div>
          </div>
        ))}

        {/* Real Images with Entrance Animation */}
        {images.map((img) => (
          <div 
            key={img.id} 
            className="group relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 transition-all hover:shadow-xl animate-in zoom-in-95 duration-700 ease-out"
          >
            <img 
              src={img.url} 
              alt="Generated Result" 
              className="w-full h-72 object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
              onClick={() => setSelectedImage(img)}
            />
            <div className="p-4">
              <p className="text-xs text-slate-400 mb-1">{new Date(img.timestamp).toLocaleString()}</p>
              <p className="text-sm text-slate-700 line-clamp-2 italic">"{img.prompt}"</p>
              
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => setSelectedImage(img)}
                  className="flex-grow bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Ver Detalhes
                </button>
                <button 
                  onClick={() => downloadImage(img.url, img.id)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors"
                  title="Download"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 flex justify-between items-center border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Resultado Detalhado</h3>
              <button onClick={() => setSelectedImage(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="flex-grow overflow-auto p-4 md:p-8 flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-2/3">
                <img src={selectedImage.url} alt="Full View" className="w-full rounded-2xl shadow-lg border border-slate-200" />
              </div>
              <div className="w-full md:w-1/3 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Prompt Utilizado</label>
                  <p className="text-slate-800 text-lg italic leading-relaxed">"{selectedImage.prompt}"</p>
                </div>
                <div className="pt-4 space-y-3">
                  <button 
                    onClick={() => downloadImage(selectedImage.url, selectedImage.id)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    Fazer Download
                  </button>
                  <p className="text-center text-xs text-slate-400">Clique na imagem para ampliar se necessário.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
