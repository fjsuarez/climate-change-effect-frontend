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
        <XAxis type="number" dataKey="x" name={data.metric1}>
          <Label value={data.metric1} position="insideBottom" offset={-5} />
        </XAxis>
        <YAxis type="number" dataKey="y" name={data.metric2}>
          <Label value={data.metric2} angle={-90} position="insideLeft" />
        </YAxis>
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter data={scatterData} fill="#8884d8" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
