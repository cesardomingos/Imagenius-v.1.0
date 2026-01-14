import React, { useState, useEffect } from 'react';
import { fetchCommunityArts, toggleLike, CommunityArt as CommunityArtType } from '../services/communityService';

interface CommunityGalleryProps {
  arts?: CommunityArtType[];
}

const CommunityGallery: React.FC<CommunityGalleryProps> = ({ arts: initialArts }) => {
  const [arts, setArts] = useState<CommunityArtType[]>(initialArts || []);
  const [loading, setLoading] = useState<boolean>(!initialArts);
  const [selectedArt, setSelectedArt] = useState<CommunityArtType | null>(null);

  // Carregar artes da comunidade ao montar o componente
  useEffect(() => {
    if (!initialArts) {
      loadArts();
    }
  }, []);

  const loadArts = async () => {
    setLoading(true);
    try {
      const fetchedArts = await fetchCommunityArts(20, 0);
      setArts(fetchedArts);
    } catch (error) {
      console.error('Erro ao carregar artes da comunidade:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async (artId: string) => {
    // Otimistic update
    setArts(prevArts => 
      prevArts.map(art => {
        if (art.id === artId) {
          const newLiked = !art.user_liked;
          const newLikesCount = newLiked 
            ? (art.likes_count || 0) + 1 
            : Math.max((art.likes_count || 0) - 1, 0);
          
          return {
            ...art,
            user_liked: newLiked,
            likes_count: newLikesCount
          };
        }
        return art;
      })
    );

    // Fazer a chamada real
    const result = await toggleLike(artId);
    
    if (!result.success) {
      // Reverter em caso de erro
      setArts(prevArts => 
        prevArts.map(art => {
          if (art.id === artId) {
            const originalLiked = !art.user_liked;
            const originalLikesCount = originalLiked 
              ? Math.max((art.likes_count || 0) - 1, 0)
              : (art.likes_count || 0) + 1;
            
            return {
              ...art,
              user_liked: originalLiked,
              likes_count: originalLikesCount
            };
          }
          return art;
        })
      );
      console.error('Erro ao fazer toggle de like:', result.error);
    } else {
      // Atualizar com o valor real do servidor
      setArts(prevArts => 
        prevArts.map(art => {
          if (art.id === artId) {
            return {
              ...art,
              likes_count: result.likesCount
            };
          }
          return art;
        })
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d atrás`;
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  };

  const getAuthorName = (art: CommunityArtType): string => {
    if (art.author_email) {
      return art.author_email.split('@')[0];
    }
    return 'Usuário Anônimo';
  };

  // Empty State
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              Galeria da <span className="text-genius-gradient">Comunidade</span>
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              Obras compartilhadas por outros gênios da comunidade
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (arts.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              Galeria da <span className="text-genius-gradient">Comunidade</span>
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              Obras compartilhadas por outros gênios da comunidade
            </p>
          </div>
        </div>
        
        {/* Empty State */}
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h4 className="text-2xl font-black text-slate-900">Nenhuma obra compartilhada ainda</h4>
              <p className="text-slate-500 font-medium">
                Seja o primeiro a compartilhar sua criação na galeria comunitária!
              </p>
            </div>
            <div className="pt-4">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Crie sua primeira obra e compartilhe com a comunidade
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header da Galeria Comunitária */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Galeria da <span className="text-genius-gradient">Comunidade</span>
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Obras compartilhadas por outros gênios da comunidade
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-sm font-black text-indigo-600">{arts.length} obras</span>
        </div>
      </div>

      {/* Grid de Artes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {arts.map((art) => {
          const authorName = getAuthorName(art);
          const isLiked = art.user_liked || false;
          const displayLikes = art.likes_count || 0;
          
          return (
            <div
              key={art.id}
              className="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 transition-all hover:shadow-2xl dark:hover:shadow-slate-900/50 hover:-translate-y-1 animate-in zoom-in-95 duration-500"
            >
              {/* Imagem */}
              <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-700">
                {art.author_email?.includes('exemplo') && (
                  <div className="absolute top-2 left-2 z-10 bg-indigo-600 text-white text-[9px] font-black px-2 py-1 rounded-lg">
                    EXEMPLO
                  </div>
                )}
                <img
                  src={art.image_url}
                  alt={art.prompt}
                  className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-700"
                  onClick={() => setSelectedArt(art)}
                  onError={(e) => {
                    // Fallback para imagem quebrada
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Imagem+Indisponível';
                  }}
                />
                {/* Overlay no hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white text-sm font-bold line-clamp-2 drop-shadow-lg">
                      "{art.prompt}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Informações */}
              <div className="p-4 space-y-3">
                {/* Autor e Data */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-700">
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-300">
                        {authorName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">{authorName}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{formatDate(art.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Prompt (truncado) */}
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic leading-relaxed">
                  "{art.prompt}"
                </p>

                {/* Ações */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleLike(art.id);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                      isLiked
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <svg
                      className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`}
                      fill={isLiked ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span className="text-xs font-bold">{displayLikes}</span>
                  </button>
                  <button
                    onClick={() => setSelectedArt(art)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Detalhes */}
      {selectedArt && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setSelectedArt(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-indigo-200">
                  <span className="text-lg font-black text-indigo-600">
                    {getAuthorName(selectedArt).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-black text-slate-900">{getAuthorName(selectedArt)}</p>
                  <p className="text-xs text-slate-500">{formatDate(selectedArt.created_at)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedArt(null)}
                className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="flex flex-col md:flex-row gap-6 p-6 overflow-auto max-h-[calc(90vh-100px)]">
              {/* Imagem */}
              <div className="flex-1">
                <img
                  src={selectedArt.image_url}
                  alt={selectedArt.prompt}
                  className="w-full rounded-2xl shadow-lg border border-slate-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Imagem+Indisponível';
                  }}
                />
              </div>

            {/* Informações */}
            <div className="w-full md:w-80 space-y-6">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2">
                  Prompt Utilizado
                </label>
                <p className="text-slate-800 text-base italic leading-relaxed bg-slate-50 p-4 rounded-xl">
                  "{selectedArt.prompt}"
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                <button
                  onClick={() => handleToggleLike(selectedArt.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    selectedArt.user_liked
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <svg
                    className={`w-5 h-5 ${selectedArt.user_liked ? 'fill-current' : ''}`}
                    fill={selectedArt.user_liked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span className="font-bold">
                    {selectedArt.likes_count || 0}
                  </span>
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityGallery;

