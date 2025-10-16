'use client';

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
import type { TimeSeriesResponse } from '@/lib/types';

interface TimeSeriesChartProps {
  data: TimeSeriesResponse;
  height?: number;
}

export default function TimeSeriesChart({ data, height = 300 }: TimeSeriesChartProps) {
  // Transform data for Recharts
  const chartData = data.data.map((point) => ({
    date: `${point.year}-W${point.week.toString().padStart(2, '0')}`,
    [data.metric1]: point.metric1_value,
    ...(data.metric2 && point.metric2_value !== undefined
      ? { [data.metric2]: point.metric2_value }
      : {}),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey={data.metric1}
          stroke="#8884d8"
          strokeWidth={2}
          dot={false}
        />
        {data.metric2 && (
          <Line
            type="monotone"
            dataKey={data.metric2}
            stroke="#82ca9d"
            strokeWidth={2}
            dot={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
