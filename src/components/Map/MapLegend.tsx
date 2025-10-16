'use client';

import React from 'react';

interface MapLegendProps {
  minValue: number;
  maxValue: number;
  metric: string;
}

// Metric configuration with units and formatting
const METRIC_CONFIG: Record<string, { unit: string; label: string; decimals: number }> = {
  temp_era5_q05: { unit: '°C', label: 'Temperature (ERA5 Q05)', decimals: 1 },
  temp_era5_q50: { unit: '°C', label: 'Temperature (ERA5 Q50)', decimals: 1 },
  temp_era5_q95: { unit: '°C', label: 'Temperature (ERA5 Q95)', decimals: 1 },
  temp_rcp45: { unit: '°C', label: 'Temperature (RCP 4.5)', decimals: 1 },
  temp_rcp85: { unit: '°C', label: 'Temperature (RCP 8.5)', decimals: 1 },
  mortality_rate: { unit: ' per 100k', label: 'Mortality Rate', decimals: 1 },
  population_density: { unit: ' per km²', label: 'Population Density', decimals: 0 },
  population: { unit: '', label: 'Population', decimals: 0 },
  pm10: { unit: ' µg/m³', label: 'PM10', decimals: 1 },
  O3: { unit: ' µg/m³', label: 'Ozone (O₃)', decimals: 1 },
  NOx: { unit: ' µg/m³', label: 'NOx', decimals: 1 },
};

export function MapLegend({ minValue, maxValue, metric }: MapLegendProps) {
  // Get metric configuration
  const config = METRIC_CONFIG[metric] || { 
    unit: '', 
    label: metric.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    decimals: 2 
  };

  const formatValue = (value: number) => {
    return `${value.toFixed(config.decimals)}${config.unit}`;
  };

  return (
    <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 min-w-[200px]">
      <div className="text-sm font-semibold mb-3 text-gray-700">
        {config.label}
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
