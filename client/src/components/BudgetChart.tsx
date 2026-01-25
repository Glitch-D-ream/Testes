import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface BudgetChartProps {
  totalBudget: number;
  executedBudget: number;
  executionRate: number;
  theme: 'light' | 'dark';
}

export default function BudgetChart({ totalBudget, executedBudget, executionRate, theme }: BudgetChartProps) {
  const data = [
    {
      name: 'Orçamento',
      Orçado: totalBudget / 1e9,
      Executado: executedBudget / 1e9,
    }
  ];

  const pieData = [
    { name: 'Executado', value: executionRate },
    { name: 'Não Executado', value: 100 - executionRate }
  ];

  const COLORS = ['#10b981', '#ef4444'];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-lg">Execução Orçamentária</h4>
            <span className="text-xs font-medium px-2 py-1 rounded bg-blue-100 text-blue-700">Valores em Bilhões</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="name" hide />
              <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  color: theme === 'dark' ? '#f3f4f6' : '#111827'
                }}
                formatter={(value: any) => [`R$ ${value.toFixed(2)}B`, '']}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" />
              <Bar dataKey="Orçado" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              <Bar dataKey="Executado" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-lg">Eficiência Fiscal</h4>
            <div className={`text-sm font-bold px-3 py-1 rounded-full ${executionRate > 70 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {executionRate.toFixed(1)}%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: any) => [`${value.toFixed(1)}%`, '']} 
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-500">Executado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-500">Pendente</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-blue-900/20 text-blue-200' : 'bg-blue-50 text-blue-700'} text-sm flex items-start gap-3`}>
        <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>
          <strong>Nota Técnica:</strong> Os dados acima são extraídos em tempo real do <strong>SICONFI (Tesouro Nacional)</strong>. 
          A taxa de execução reflete a capacidade real do ente público de transformar orçamento em entregas efetivas para a sociedade.
        </p>
      </div>
    </div>
  );
}
