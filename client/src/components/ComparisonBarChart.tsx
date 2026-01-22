import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ComparisonData {
  category: string;
  politician1: number;
  politician2: number;
}

interface ComparisonBarChartProps {
  data: ComparisonData[];
  politician1Name: string;
  politician2Name: string;
  title?: string;
}

export function ComparisonBarChart({
  data,
  politician1Name,
  politician2Name,
  title,
}: ComparisonBarChartProps) {
  return (
    <div className="w-full h-96 bg-white rounded-lg shadow-md p-6">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="category" />
          <YAxis domain={[0, 100]} />
          <Tooltip
            formatter={(value) => {
              if (typeof value === 'number') {
                return `${value.toFixed(1)}%`;
              }
              return value;
            }}
          />
          <Legend />
          <Bar dataKey="politician1" name={politician1Name} fill="#3b82f6" />
          <Bar dataKey="politician2" name={politician2Name} fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
