'use client';

import React from 'react';
import { METRIC_CONFIG, getMetricLabel, formatMetricValue } from '@/lib/metricConfig';

interface MapLegendProps {
  minValue: number;
  maxValue: number;
  metric: string;
}

export function MapLegend({ minValue, maxValue, metric }: MapLegendProps) {
  // Get metric configuration
  const label = getMetricLabel(metric);
  const formatValue = (value: number) => formatMetricValue(metric, value);

  return (
    <div className="absolute bottom-20 md:bottom-24 left-6 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 min-w-[200px]">
      <div className="text-sm font-semibold mb-3 text-gray-700">
        {label}
      </div>
      
      {/* Gradient bar */}
      <div className="relative h-8 rounded overflow-hidden mb-2">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, #0000ff 0%, #00ffff 33%, #ffff00 67%, #ff0000 100%)',
          }}
        />
      </div>

      {/* Value labels */}
      <div className="flex justify-between text-xs text-gray-600">
        <span>{formatValue(minValue)}</span>
        <span>{formatValue(maxValue)}</span>
      </div>

      {/* Data range indicator */}
      <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Min:</span>
          <span className="font-medium">{formatValue(minValue)}</span>
        </div>
        <div className="flex justify-between">
          <span>Max:</span>
          <span className="font-medium">{formatValue(maxValue)}</span>
        </div>
      </div>

      {/* No data indicator */}
      <div className="mt-2 pt-2 border-t border-gray-200 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-800 rounded border border-gray-400" />
          <span className="text-gray-600">No data</span>
        </div>
      </div>
    </div>
  );
}
