/**
 * Componente de Skeleton Loader reutilizável
 */

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export function SkeletonLoader({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  count = 1
}: SkeletonLoaderProps) {
  const baseClasses = 'animate-pulse bg-slate-200 dark:bg-slate-700 rounded';
  
  const variantClasses = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: '',
    card: 'rounded-xl'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

/**
 * Skeleton para cards de imagem
 */
export function ImageCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
      <SkeletonLoader variant="rectangular" height={200} className="w-full" />
      <div className="p-4 space-y-3">
        <SkeletonLoader variant="text" width="80%" />
        <SkeletonLoader variant="text" width="60%" />
        <div className="flex gap-2 mt-4">
          <SkeletonLoader variant="rectangular" width={80} height={32} className="rounded-lg" />
          <SkeletonLoader variant="rectangular" width={80} height={32} className="rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton para galeria de imagens
 */
export function GallerySkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ImageCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton para perfil de usuário
 */
export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header do perfil */}
      <div className="flex items-center gap-4">
        <SkeletonLoader variant="circular" width={80} height={80} />
        <div className="flex-1 space-y-2">
          <SkeletonLoader variant="text" width="40%" height={24} />
          <SkeletonLoader variant="text" width="60%" height={16} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700">
        <SkeletonLoader variant="rectangular" width={100} height={40} className="rounded-t-lg" />
        <SkeletonLoader variant="rectangular" width={100} height={40} className="rounded-t-lg" />
        <SkeletonLoader variant="rectangular" width={100} height={40} className="rounded-t-lg" />
      </div>

      {/* Conteúdo */}
      <div className="space-y-4">
        <SkeletonLoader variant="text" width="100%" />
        <SkeletonLoader variant="text" width="90%" />
        <SkeletonLoader variant="text" width="95%" />
        <SkeletonLoader variant="rectangular" height={200} className="rounded-xl" />
      </div>
    </div>
  );
}

