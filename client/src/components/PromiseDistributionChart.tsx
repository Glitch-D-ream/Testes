import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface PromiseDistributionData {
  category: string;
  count: number;
  fulfilled: number;
  pending: number;
  failed: number;
}

export interface PromiseDistributionChartProps {
  data: PromiseDistributionData[];
  title?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

/**
 * Gráfico de distribuição de promessas por categoria
 * Mostra total de promessas e status (cumpridas, pendentes, falhadas)
 */
export const PromiseDistributionChart: React.FC<PromiseDistributionChartProps> = ({
  data,
  title = 'Distribuição de Promessas por Categoria',
}) => {
  return (
    <div className="w-full h-full bg-card rounded-lg p-6 shadow-sm border border-border">
      {title && (
        <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      )}
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="category" 
            tick={{ fill: '#64748b', fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f1f5f9',
            }}
            formatter={(value) => value.toLocaleString('pt-BR')}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="square"
          />
          <Bar dataKey="fulfilled" stackId="a" fill={COLORS[1]} name="Cumpridas" />
          <Bar dataKey="pending" stackId="a" fill={COLORS[2]} name="Pendentes" />
          <Bar dataKey="failed" stackId="a" fill={COLORS[3]} name="Falhadas" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
