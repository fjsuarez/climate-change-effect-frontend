// Shared metric configuration with human-readable labels, units, and formatting

export interface MetricConfig {
  unit: string;
  label: string;
  decimals: number;
}

export const METRIC_CONFIG: Record<string, MetricConfig> = {
  temp_era5_q50: { unit: '°C', label: 'Mean Temperature (ERA5)', decimals: 1 },
  temp_rcp45: { unit: '°C', label: 'Temperature - RCP 4.5 (Moderate Emissions)', decimals: 1 },
  temp_rcp85: { unit: '°C', label: 'Temperature - RCP 8.5 (High Emissions)', decimals: 1 },
  mortality_rate: { unit: ' per 100k', label: 'Mortality Rate', decimals: 1 },
  pm10: { unit: ' µg/m³', label: 'Particulate Matter (PM10)', decimals: 1 },
  O3: { unit: ' µg/m³', label: 'Ozone (O₃)', decimals: 1 },
  NOx: { unit: ' µg/m³', label: 'Nitrogen Oxides (NOx)', decimals: 1 },
  population_density: { unit: ' per km²', label: 'Population Density', decimals: 0 },
};

/**
 * Get the display label for a metric
 */
export function getMetricLabel(metric: string): string {
  return METRIC_CONFIG[metric]?.label || metric.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Format a metric value with the appropriate unit and decimals
 */
export function formatMetricValue(metric: string, value: number): string {
  const config = METRIC_CONFIG[metric];
  if (!config) {
    return value.toFixed(2);
  }
  return `${value.toFixed(config.decimals)}${config.unit}`;
}
