import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TrendData {
  date: string;
  viability: number;
  count: number;
}

interface TrendLineChartProps {
  data: TrendData[];
  title?: string;
}

export function TrendLineChart({ data, title }: TrendLineChartProps) {
  return (
    <div className="w-full h-96 bg-white rounded-lg shadow-md p-6">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" domain={[0, 100]} />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip
            formatter={(value) => {
              if (typeof value === 'number') {
                return value.toFixed(1);
              }
              return value;
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="viability"
            name="Viabilidade Média (%)"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6' }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="count"
            name="Quantidade de Análises"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
