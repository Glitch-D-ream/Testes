import { TrendingUp, AlertTriangle, TrendingDown } from 'lucide-react';

interface ViabilityBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ViabilityBadge({ score, size = 'md' }: ViabilityBadgeProps) {
  const getViabilityLevel = (score: number) => {
    if (score >= 0.8) return { label: 'Altamente Viável', color: 'bg-green-100 text-green-800', icon: TrendingUp };
    if (score >= 0.6) return { label: 'Viável', color: 'bg-blue-100 text-blue-800', icon: TrendingUp };
    if (score >= 0.4) return { label: 'Moderada', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    if (score >= 0.2) return { label: 'Baixa', color: 'bg-orange-100 text-orange-800', icon: TrendingDown };
    return { label: 'Muito Baixa', color: 'bg-red-100 text-red-800', icon: TrendingDown };
  };

  const { label, color, icon: Icon } = getViabilityLevel(score);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  return (
    <div className={`${color} ${sizeClasses[size]} rounded-full flex items-center gap-2 font-semibold inline-flex`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} />
      {label}
    </div>
  );
}
