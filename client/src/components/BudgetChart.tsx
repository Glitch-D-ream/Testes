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
    <div className="grid grid-cols-2 gap-6">
      {/* Bar Chart */}
      <div>
        <h4 className="font-semibold mb-4">Execução Orçamentária</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
            <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
            <Tooltip
              contentStyle={{
                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                color: theme === 'dark' ? '#f3f4f6' : '#111827'
              }}
              formatter={(value: any) => `R$ ${value.toFixed(1)}B`}
            />
            <Legend />
            <Bar dataKey="Orçado" fill="#3b82f6" />
            <Bar dataKey="Executado" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <div>
        <h4 className="font-semibold mb-4">Taxa de Execução: {executionRate.toFixed(1)}%</h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => `${value.toFixed(1)}%`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
