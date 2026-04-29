// Custom hooks for data fetching with React Query

import { useQuery } from '@tanstack/react-query';
import { climateAPI, mortalityMultiplierAPI } from '@/lib/api';
import type { ClimateMetric, MetricSnapshot } from '@/lib/types';
import type { AgeGroup } from '@/lib/api';

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
  week: number,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['metric-snapshot', metric, year, week],
    queryFn: () => climateAPI.getMetricSnapshot(metric, year, week),
    enabled,
    staleTime: 1000 * 60 * 5,
    placeholderData: (previousData: MetricSnapshot | undefined) => previousData,
  });
}

/**
 * Hook to fetch global min/max range for a metric
 */
export function useMetricRange(metric: ClimateMetric, enabled: boolean = true) {
  return useQuery({
    queryKey: ['metric-range', metric],
    queryFn: () => climateAPI.getMetricRange(metric),
    enabled,
    staleTime: Infinity,
  });
}

/**
 * Hook to fetch time series data for a region
 */
export function useTimeSeries(
  nutsId: string | null,
  metric1: ClimateMetric,
  metric2?: ClimateMetric,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['timeseries', nutsId, metric1, metric2],
    queryFn: () => {
      if (!nutsId) throw new Error('No region selected');
      return climateAPI.getTimeSeries(nutsId, metric1, metric2);
    },
    enabled: !!nutsId && enabled,
    staleTime: 1000 * 60 * 5,
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

/**
 * Hook to fetch cities with ERF (Exposure-Response Function) data and coordinates
 */
export function useCitiesWithERF() {
  return useQuery({
    queryKey: ['cities-with-erf'],
    queryFn: () => climateAPI.getCitiesWithERF(),
    staleTime: Infinity, // Cities don't change, cache forever
  });
}

/**
 * Hook to fetch mortality multiplier data for a country and age group
 */
export function useMortalityMultiplier(
  countryCode: string | null,
  ageGroup: AgeGroup = '65-74'
) {
  return useQuery({
    queryKey: ['mortality-multiplier', countryCode, ageGroup],
    queryFn: () => {
      if (!countryCode) throw new Error('No country selected');
      return mortalityMultiplierAPI.getByCountry(countryCode, ageGroup);
    },
    enabled: !!countryCode,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Hook to fetch mortality multiplier snapshot for choropleth map
 */
export function useMortalitySnapshot(
  year: number,
  rcpScenario: string,
  ageGroup: AgeGroup,
  enabled: boolean
) {
  return useQuery({
    queryKey: ['mortality-snapshot', year, rcpScenario, ageGroup],
    queryFn: () => mortalityMultiplierAPI.getSnapshot(year, rcpScenario, ageGroup),
    enabled,
    staleTime: 1000 * 60 * 60,
  });
}
