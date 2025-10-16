// Custom hooks for data fetching with React Query

import { useQuery } from '@tanstack/react-query';
import { climateAPI } from '@/lib/api';
import type { ClimateMetric, MetricSnapshot } from '@/lib/types';

/**
 * Hook to fetch regions with optional geometry simplification
 */
export function useRegions(tolerance?: number) {
  return useQuery({
    queryKey: ['regions', tolerance],
    queryFn: () => climateAPI.getRegions(tolerance),
    staleTime: 1000 * 60 * 60, // 1 hour - regions don't change often
  });
}

/**
 * Hook to fetch metric snapshot
 */
export function useMetricSnapshot(
  metric: ClimateMetric,
  year: number,
  week: number
) {
  return useQuery({
    queryKey: ['metric-snapshot', metric, year, week],
    queryFn: () => climateAPI.getMetricSnapshot(metric, year, week),
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: (previousData: MetricSnapshot | undefined) => previousData, // Keep previous data while loading
  });
}

/**
 * Hook to fetch global min/max range for a metric
 */
export function useMetricRange(metric: ClimateMetric) {
  return useQuery({
    queryKey: ['metric-range', metric],
    queryFn: () => climateAPI.getMetricRange(metric),
    staleTime: Infinity, // Range doesn't change, cache forever
  });
}

/**
 * Hook to fetch time series data for a region
 */
export function useTimeSeries(
  nutsId: string | null,
  metric1: ClimateMetric,
  metric2?: ClimateMetric
) {
  return useQuery({
    queryKey: ['timeseries', nutsId, metric1, metric2],
    queryFn: () => {
      if (!nutsId) throw new Error('No region selected');
      return climateAPI.getTimeSeries(nutsId, metric1, metric2);
    },
    enabled: !!nutsId, // Only run query if nutsId is provided
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to check API health
 */
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health-check'],
    queryFn: () => climateAPI.healthCheck(),
    refetchInterval: 1000 * 60, // Check every minute
  });
}
