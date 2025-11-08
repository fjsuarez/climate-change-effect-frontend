'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
} from 'recharts';
import type { TimeSeriesResponse } from '@/lib/types';
import { getMetricLabel } from '@/lib/metricConfig';

interface ScatterPlotProps {
  data: TimeSeriesResponse;
  height?: number;
}

export default function ScatterPlot({ data, height = 300 }: ScatterPlotProps) {
  if (!data.metric2) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Please select a second metric for scatter plot
      </div>
    );
  }

  const metric1Label = getMetricLabel(data.metric1);
  const metric2Label = getMetricLabel(data.metric2);

  // Transform data for scatter plot
  const scatterData = data.data
    .filter((point) => point.metric2_value !== undefined)
    .map((point) => ({
      x: point.metric1_value,
      y: point.metric2_value!,
    }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          type="number" 
          dataKey="x" 
          name={metric1Label}
          tick={{ fontSize: 12 }}
          label={{ 
            value: metric1Label, 
            position: 'insideBottom', 
            offset: -5,
            style: { fontSize: 11, textAnchor: 'middle' }
          }}
        />
        <YAxis 
          type="number" 
          dataKey="y" 
          name={metric2Label}
          tick={{ fontSize: 12 }}
          label={{ 
            value: metric2Label, 
            angle: -90, 
            position: 'insideLeft',
            style: { fontSize: 11, textAnchor: 'middle' }
          }}
        />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter data={scatterData} fill="#8884d8" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
