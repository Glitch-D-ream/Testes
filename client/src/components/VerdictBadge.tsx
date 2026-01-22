import React from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface VerdictBadgeProps {
  verdict: 'REALISTA' | 'DUVIDOSA' | 'VAZIA';
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function VerdictBadge({ verdict, score, size = 'md' }: VerdictBadgeProps) {
  const getStyles = () => {
    switch (verdict) {
      case 'REALISTA':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-900',
          icon: <CheckCircle className="text-green-600" />,
          label: '✓ Promessa Realista'
        };
      case 'DUVIDOSA':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-900',
          icon: <Clock className="text-yellow-600" />,
          label: '? Promessa Duvidosa'
        };
      case 'VAZIA':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-900',
          icon: <AlertTriangle className="text-red-600" />,
          label: '✗ Promessa Vazia'
        };
    }
  };

  const styles = getStyles();
  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <div className={`rounded-lg border-2 ${styles.bg} ${styles.border} ${styles.text} ${sizeClasses[size]} flex items-center gap-2`}>
      {styles.icon}
      <span className="font-semibold">{styles.label}</span>
      <span className="ml-2 font-bold">{score}%</span>
    </div>
  );
}
