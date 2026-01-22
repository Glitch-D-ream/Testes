import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface PromiseRadarChartProps {
  data: Array<{
    category: string;
    count: number;
    viability: number;
  }>;
  title?: string;
}

export function PromiseRadarChart({ data, title }: PromiseRadarChartProps) {
  return (
    <div className="w-full h-96 bg-white rounded-lg shadow-md p-6">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="category" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          <Radar
            name="Viabilidade (%)"
            dataKey="viability"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.6}
          />
          <Radar
            name="Quantidade"
            dataKey="count"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.3}
          />
          <Legend />
          <Tooltip
            formatter={(value) => {
              if (typeof value === 'number') {
                return value.toFixed(1);
              }
              return value;
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
