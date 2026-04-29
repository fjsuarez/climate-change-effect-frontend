'use client';

import React from 'react';
import { getMetricLabel, formatMetricValue } from '@/lib/metricConfig';

interface MapLegendProps {
  minValue: number;
  maxValue: number;
  metric: string;
  diverging?: boolean;
}

export function MapLegend({ minValue, maxValue, metric, diverging = false }: MapLegendProps) {
  const label = getMetricLabel(metric);

  const formatValue = (value: number) => {
    if (diverging) {
      // Show as % change from baseline
      const pct = ((value - 1) * 100);
      return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
    }
    return formatMetricValue(metric, value);
  };

  const gradient = diverging
    ? 'linear-gradient(to right, #2563eb 0%, #f9fafb 50%, #dc2626 100%)'
    : 'linear-gradient(to right, #0000ff 0%, #00ffff 33%, #ffff00 67%, #ff0000 100%)';

  return (
    <div className="absolute bottom-20 md:bottom-24 left-6 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 min-w-[200px]">
      <div className="text-sm font-semibold mb-3 text-gray-700">
        {label}
      </div>

      {/* Gradient bar */}
      <div className="relative h-8 rounded overflow-hidden mb-2">
        <div className="absolute inset-0" style={{ background: gradient }} />
        {diverging && (
          <div className="absolute inset-y-0" style={{ left: '50%', width: 1, background: '#374151' }} />
        )}
      </div>

      {/* Value labels */}
      <div className="flex justify-between text-xs text-gray-600">
        <span>{formatValue(minValue)}</span>
        {diverging && <span className="text-gray-400">baseline</span>}
        <span>{formatValue(maxValue)}</span>
      </div>

      {/* Data range */}
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
