import { TrendingUp, AlertTriangle, TrendingDown } from 'lucide-react';

interface ViabilityBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ViabilityBadge({ score, size = 'md' }: ViabilityBadgeProps) {
  const getViabilityLevel = (score: number) => {
    if (score >= 0.8) return { label: 'Altamente Viável', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800', icon: TrendingUp };
    if (score >= 0.6) return { label: 'Viável', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800', icon: TrendingUp };
    if (score >= 0.4) return { label: 'Moderada', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800', icon: AlertTriangle };
    if (score >= 0.2) return { label: 'Baixa', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800', icon: TrendingDown };
    return { label: 'Muito Baixa', color: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800', icon: TrendingDown };
  };

  const { label, color, icon: Icon } = getViabilityLevel(score);

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  return (
    <div className={`${color} ${sizeClasses[size]} rounded-full flex items-center gap-1.5 font-black uppercase tracking-widest border inline-flex shadow-sm`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      {label}
    </div>
  );
}
