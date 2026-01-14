
import React, { useEffect, useState } from 'react';

interface SuccessAnimationProps {
  isVisible: boolean;
  message?: string;
  onComplete?: () => void;
}

const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  isVisible,
  message = 'Sucesso!',
  onComplete
}) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        if (onComplete) {
          setTimeout(onComplete, 300); // Wait for fade out
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 fade-in duration-300">
        <div className="flex flex-col items-center gap-4">
          {/* Success Checkmark Animation */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 bg-green-100 dark:bg-green-900/30 rounded-full animate-ping opacity-75"></div>
            <div className="relative w-20 h-20 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center">
              <svg 
                className="w-12 h-12 text-white animate-in zoom-in-95 duration-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="3" 
                  d="M5 13l4 4L19 7"
                  strokeDasharray="24"
                  strokeDashoffset="24"
                  style={{
                    animation: 'drawCheck 0.6s ease-out 0.3s forwards'
                  }}
                />
              </svg>
            </div>
          </div>
          
          {/* Message */}
          <p className="text-xl font-black text-slate-900 dark:text-white text-center">
            {message}
          </p>
        </div>
      </div>
      
      <style>{`
        @keyframes drawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default SuccessAnimation;

