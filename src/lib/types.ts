// TypeScript types matching the backend API

import type { Feature, Polygon, MultiPolygon } from 'geojson';

export interface RegionProperties {
  NUTS_ID: string;
  name?: string;
  value?: number | null;
  [key: string]: unknown;
}

export type Region = Feature<Polygon | MultiPolygon, RegionProperties>;

export interface GeoJSONResponse {
  type: 'FeatureCollection';
  features: Region[];
}

export interface MetricSnapshot {
  [nutsId: string]: number;  // Simple dict: {NUTS_ID: value}
}

export interface TimeSeriesDataPoint {
  year: number;
  week: number;
  metric1_value: number;
  metric2_value?: number;
}

export interface TimeSeriesResponse {
  nuts_id: string;
  metric1: string;
  metric2?: string;
  data: TimeSeriesDataPoint[];
}

// UI State types
export interface MapState {
  selectedRegion: string | null;
  selectedMetric: string;
  selectedYear: number;
  selectedWeek: number;
  zoom: number;
  center: [number, number];
}

export interface ChartConfig {
  metric1: string;
  metric2?: string;
  showComparison: boolean;
}

// Available climate metrics (update based on your actual data)
export const CLIMATE_METRICS = [
  'temp_era5_q50',
  'temp_rcp45',
  'temp_rcp85',
  'mortality_rate',
  'pm10',
  'O3',
  'NOx',
  'population_density',
] as const;

export type ClimateMetric = typeof CLIMATE_METRICS[number];

// Date range configuration
export const DATE_RANGE = {
  minYear: 1990,
  maxYear: 2100,
  minWeek: 1,
  maxWeek: 52,
} as const;
