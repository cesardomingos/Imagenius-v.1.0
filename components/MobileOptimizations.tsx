
/**
 * Componente para otimizações específicas de mobile
 * Este arquivo contém utilitários e componentes para melhorar a experiência mobile
 */

import { useEffect, useState } from 'react';
import React from 'react';

/**
 * Hook para detectar se está em mobile
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

/**
 * Hook para detectar se está em tablet
 */
export function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  return isTablet;
}

/**
 * Componente para melhorar scroll em mobile
 */
export const MobileScrollContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`overflow-y-auto overscroll-contain ${className}`} style={{ WebkitOverflowScrolling: 'touch' }}>
      {children}
    </div>
  );
};

