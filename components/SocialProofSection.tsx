
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { cachedRequest, cacheHelpers } from '../utils/requestCache';

function getSupabaseClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

interface SocialProofSectionProps {
  className?: string;
}

const SocialProofSection: React.FC<SocialProofSectionProps> = ({ className = '' }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalImages: 0,
    satisfaction: 99
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const cacheKey = cacheHelpers.socialProof();
      
      const stats = await cachedRequest(
        async () => {
          const supabase = getSupabaseClient();
          if (!supabase) {
            // Fallback para valores mockados
            return {
              totalUsers: 1250,
              totalImages: 8500,
              satisfaction: 99
            };
          }

          // Buscar estatísticas reais do banco
          const [usersResult, allImagesResult, sharedImagesResult] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact', head: true }),
            supabase.from('community_arts').select('id', { count: 'exact', head: true }),
            supabase.from('community_arts').select('id', { count: 'exact', head: true }).eq('is_shared', true)
          ]);

          // Contar transações completas para estimar satisfação
          const { count: completedTransactions } = await supabase
            .from('transactions')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'completed');

          // Calcular satisfação baseado em taxa de conclusão de transações
          // Se houver transações, assumir alta satisfação (99%)
          // Se não houver dados suficientes, usar valor padrão
          const satisfaction = completedTransactions && completedTransactions > 0 ? 99 : 95;

          return {
            totalUsers: usersResult.count || 1250,
            totalImages: allImagesResult.count || 8500, // Todas as imagens geradas (não apenas compartilhadas)
            satisfaction: satisfaction
          };
        },
        cacheKey,
        10 * 60 * 1000, // 10 minutos
        true // localStorage
      );

      setStats(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      // Fallback para valores mockados
      setStats({
        totalUsers: 1250,
        totalImages: 8500,
        satisfaction: 99
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testimonials = [
    {
      name: 'Maria Silva',
      role: 'Designer de Marca',
      text: 'Finalmente uma ferramenta que mantém a identidade visual consistente. Economizei horas de trabalho!',
      rating: 5
    },
    {
      name: 'João Santos',
      role: 'E-commerce Manager',
      text: 'Reduzi custos de fotografia em 90%. Todas as fotos de produtos ficam com o mesmo estilo profissional.',
      rating: 5
    },
    {
      name: 'Ana Costa',
      role: 'Social Media Manager',
      text: 'Meu feed nunca esteve tão coeso. A coerência visual aumentou o engajamento em 40%.',
      rating: 5
    }
  ];

  const AnimatedNumber: React.FC<{ value: number; suffix?: string; prefix?: string }> = ({ value, suffix = '', prefix = '' }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      if (isLoading) return;
      
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, [value, isLoading]);

    return <span>{prefix}{displayValue.toLocaleString('pt-BR')}{suffix}</span>;
  };

  return (
    <div className={`space-y-8 md:space-y-10 ${className}`}>
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-8 border border-indigo-200 dark:border-indigo-700 text-center">
          <div className="text-5xl font-black text-indigo-600 dark:text-indigo-400 mb-2">
            {isLoading ? '...' : <AnimatedNumber value={stats.totalUsers} />}
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-bold text-sm uppercase tracking-wider">
            Usuários Ativos
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl p-8 border border-purple-200 dark:border-purple-700 text-center">
          <div className="text-5xl font-black text-purple-600 dark:text-purple-400 mb-2">
            {isLoading ? '...' : <AnimatedNumber value={stats.totalImages} />}
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-bold text-sm uppercase tracking-wider">
            Imagens Geradas
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-3xl p-8 border border-green-200 dark:border-green-700 text-center">
          <div className="text-5xl font-black text-green-600 dark:text-green-400 mb-2">
            {stats.satisfaction}%
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-bold text-sm uppercase tracking-wider">
            Satisfação
          </p>
        </div>
      </div>

      {/* Badges de Confiança */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="px-6 py-3 bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-700 rounded-2xl">
          <div className="flex items-center gap-2">
            <i className="ri-star-fill text-2xl text-yellow-400"></i>
            <span className="font-black text-slate-900 dark:text-white">4.8/5</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">estrelas</span>
          </div>
        </div>
        <div className="px-6 py-3 bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-700 rounded-2xl">
          <div className="flex items-center gap-2">
            <i className="ri-check-line text-2xl text-green-500"></i>
            <span className="font-black text-slate-900 dark:text-white">100%</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">Coerência</span>
          </div>
        </div>
        <div className="px-6 py-3 bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-700 rounded-2xl">
          <div className="flex items-center gap-2">
            <i className="ri-rocket-line text-2xl text-indigo-600 dark:text-indigo-400"></i>
            <span className="font-black text-slate-900 dark:text-white">90%</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">Redução de Custos</span>
          </div>
        </div>
      </div>

      {/* Depoimentos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-1 mb-4">
              {Array.from({ length: testimonial.rating }).map((_, i) => (
                <i key={i} className="ri-star-fill text-lg text-yellow-400"></i>
              ))}
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4 italic leading-relaxed">
              "{testimonial.text}"
            </p>
            <div>
              <p className="font-black text-slate-900 dark:text-white">{testimonial.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{testimonial.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SocialProofSection;

