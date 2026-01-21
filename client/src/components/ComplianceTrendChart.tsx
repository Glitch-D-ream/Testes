import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

export interface ComplianceTrendData {
  date: string;
  fulfilled: number;
  pending: number;
  failed: number;
  complianceRate: number;
}

export interface ComplianceTrendChartProps {
  data: ComplianceTrendData[];
  title?: string;
}

/**
 * Gráfico de tendências de cumprimento ao longo do tempo
 * Mostra taxa de cumprimento (%) e evolução de promessas
 */
export const ComplianceTrendChart: React.FC<ComplianceTrendChartProps> = ({
  data,
  title = 'Tendência de Cumprimento de Promessas',
}) => {
  return (
    <div className="w-full h-full bg-card rounded-lg p-6 shadow-sm border border-border">
      {title && (
        <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      )}
      
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <YAxis 
            tick={{ fill: '#64748b', fontSize: 12 }}
            label={{ value: 'Taxa de Cumprimento (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f1f5f9',
            }}
            formatter={(value) => {
              if (typeof value === 'number') {
                return value.toFixed(1) + '%';
              }
              return value;
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Area 
            type="monotone" 
            dataKey="complianceRate" 
            stroke="#10b981" 
            fillOpacity={1} 
            fill="url(#colorCompliance)"
            name="Taxa de Cumprimento"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
