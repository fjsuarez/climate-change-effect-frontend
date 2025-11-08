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
import { getMetricLabel, METRIC_CONFIG } from '@/lib/metricConfig';

interface TimeSeriesChartProps {
  data: TimeSeriesResponse;
  height?: number;
}

export default function TimeSeriesChart({ data, height = 300 }: TimeSeriesChartProps) {
  // Transform data for Recharts with descriptive labels
  const metric1Label = getMetricLabel(data.metric1);
  const metric2Label = data.metric2 ? getMetricLabel(data.metric2) : '';
  
  // Check if metrics have different units (for dual Y-axis)
  const metric1Unit = METRIC_CONFIG[data.metric1]?.unit || '';
  const metric2Unit = data.metric2 ? (METRIC_CONFIG[data.metric2]?.unit || '') : '';
  const useDualAxis = data.metric2 && metric1Unit !== metric2Unit;
  
  const chartData = data.data.map((point) => ({
    date: `${point.year}-W${point.week.toString().padStart(2, '0')}`,
    [metric1Label]: point.metric1_value,
    ...(data.metric2 && point.metric2_value !== undefined
      ? { [metric2Label]: point.metric2_value }
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
        {/* Primary Y-axis (left) */}
        <YAxis 
          yAxisId="left"
          tick={{ fontSize: 12 }}
          label={{ 
            value: `${metric1Label}${metric1Unit ? ` (${metric1Unit.trim()})` : ''}`, 
            angle: -90, 
            position: 'insideLeft',
            style: { fontSize: 11, textAnchor: 'middle' }
          }}
        />
        {/* Secondary Y-axis (right) - only if different units */}
        {useDualAxis && (
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            label={{ 
              value: `${metric2Label}${metric2Unit ? ` (${metric2Unit.trim()})` : ''}`, 
              angle: 90, 
              position: 'insideRight',
              style: { fontSize: 11, textAnchor: 'middle' }
            }}
          />
        )}
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey={metric1Label}
          stroke="#8884d8"
          strokeWidth={2}
          dot={false}
          yAxisId="left"
        />
        {data.metric2 && (
          <Line
            type="monotone"
            dataKey={metric2Label}
            stroke="#82ca9d"
            strokeWidth={2}
            dot={false}
            yAxisId={useDualAxis ? "right" : "left"}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
