
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number; // Distância do bottom para trigger (0-1)
  rootMargin?: string; // Margin para o root (ex: "100px")
  enabled?: boolean; // Se o infinite scroll está habilitado
}

/**
 * Hook para infinite scroll usando Intersection Observer
 * Detecta quando o usuário está próximo do final da lista
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  options: UseInfiniteScrollOptions = {}
): {
  sentinelRef: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
} {
  const { threshold = 0.1, rootMargin = '100px', enabled = true } = options;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!enabled || !sentinelRef.current) return;

    const sentinel = sentinelRef.current;

    // Criar observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isLoading) {
          setIsLoading(true);
          onLoadMore();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observerRef.current.observe(sentinel);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, threshold, rootMargin, onLoadMore, isLoading]);

  return {
    sentinelRef,
    isLoading,
    setIsLoading
  };
}

