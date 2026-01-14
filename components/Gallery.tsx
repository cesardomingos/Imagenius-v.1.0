
import React, { useState, useEffect } from 'react';
import { GeneratedImage } from '../types';
import { shareArt, checkIfArtIsShared } from '../services/communityService';
import Tooltip from './Tooltip';

interface GalleryProps {
  images: GeneratedImage[];
  isBatching?: boolean;
  pendingCount?: number;
  currentPage?: number;
  totalItems?: number;
  pageSize?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
  onCompare?: (originalUrl: string, generatedUrl: string) => void;
}

interface GalleryProps {
  images: GeneratedImage[];
  isBatching?: boolean;
  pendingCount?: number;
  currentPage?: number;
  totalItems?: number;
  pageSize?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const Gallery: React.FC<GalleryProps> = ({ 
  images, 
  isBatching, 
  pendingCount = 0,
  currentPage = 1,
  totalItems = 0,
  pageSize = 20,
  onLoadMore,
  hasMore = false,
  onCompare
}) => {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [isShared, setIsShared] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const downloadImage = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `generated-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Verificar se a imagem selecionada já está compartilhada
  useEffect(() => {
    if (selectedImage) {
      checkIfArtIsShared(selectedImage.url).then(result => {
        if (result.success) {
          setIsShared(result.isShared);
        }
      });
      setShareMessage(null);
    } else {
      setIsShared(false);
      setShareMessage(null);
    }
  }, [selectedImage]);

  const handleShareArt = async () => {
    if (!selectedImage) return;

    setIsSharing(true);
    setShareMessage(null);

    // Iniciar compartilhamento de forma assíncrona (não bloqueia o fechamento do modal)
    shareArt(selectedImage.url, selectedImage.prompt)
      .then(result => {
        if (result.success) {
          setIsShared(true);
          // Se o modal ainda estiver aberto, mostrar mensagem
          if (selectedImage) {
            setShareMessage('Arte compartilhada com sucesso com a comunidade! 🎨');
            setTimeout(() => setShareMessage(null), 5000);
          }
        } else {
          // Se o modal ainda estiver aberto, mostrar erro
          if (selectedImage) {
            setShareMessage(result.error || 'Erro ao compartilhar arte. Tente novamente.');
            setTimeout(() => setShareMessage(null), 5000);
          }
        }
      })
      .catch(error => {
        console.error('Erro ao compartilhar arte:', error);
        // Se o modal ainda estiver aberto, mostrar erro
        if (selectedImage) {
          setShareMessage('Erro ao compartilhar arte. Tente novamente.');
          setTimeout(() => setShareMessage(null), 5000);
        }
      })
      .finally(() => {
        setIsSharing(false);
      });
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
            className="group relative bg-slate-50 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 transition-all hover:shadow-xl dark:hover:shadow-slate-900/50 animate-in zoom-in-95 duration-700 ease-out"
          >
            <img 
              src={img.url} 
              alt="Generated Result" 
              className="w-full h-72 object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
              onClick={() => setSelectedImage(img)}
            />
            <div className="p-4">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{new Date(img.timestamp).toLocaleString()}</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 italic">"{img.prompt}"</p>
              
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => setSelectedImage(img)}
                  className="flex-grow bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Ver Detalhes
                </button>
                <button 
                  onClick={() => downloadImage(img.url, img.id)}
                  className="bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white p-2 rounded-lg transition-colors"
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
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white">Resultado Detalhado</h3>
              <button onClick={() => setSelectedImage(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="flex-grow overflow-auto p-4 md:p-8 flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-2/3">
                <img src={selectedImage.url} alt="Full View" className="w-full rounded-2xl shadow-lg border border-slate-200" />
              </div>
              <div className="w-full md:w-1/3 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Prompt Utilizado</label>
                  <p className="text-slate-800 dark:text-slate-200 text-lg italic leading-relaxed">"{selectedImage.prompt}"</p>
                </div>
                <div className="pt-4 space-y-3">
                  <button 
                    onClick={() => downloadImage(selectedImage.url, selectedImage.id)}
                    className="w-full bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    Fazer Download
                  </button>
                  
                  <Tooltip content={isShared ? "Esta imagem já está compartilhada na galeria comunitária." : "Compartilhe sua criação na galeria comunitária para inspirar outros usuários."}>
                    <button 
                      onClick={handleShareArt}
                      disabled={isSharing || isShared}
                      className={`w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                        isShared
                          ? 'bg-green-50 text-green-600 border-2 border-green-200 cursor-not-allowed'
                          : isSharing
                          ? 'bg-indigo-400 text-white cursor-wait'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                    {isSharing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Compartilhando...
                      </>
                    ) : isShared ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                        Já Compartilhada
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                        Compartilhar com a Comunidade
                      </>
                    )}
                  </button>
                  </Tooltip>
                  
                  {shareMessage && (
                    <div className={`p-3 rounded-lg text-sm font-medium ${
                      shareMessage.includes('sucesso') || shareMessage.includes('🎨')
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {shareMessage}
                    </div>
                  )}
                  
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500">Clique na imagem para ampliar se necessário.</p>
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
