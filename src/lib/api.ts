// API client for backend communication

import type {
  GeoJSONResponse,
  MetricSnapshot,
  TimeSeriesResponse,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ClimateAPI {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch all regions with optional geometry simplification
   */
  async getRegions(tolerance?: number): Promise<GeoJSONResponse> {
    const params = new URLSearchParams();
    if (tolerance) {
      params.append('tolerance', tolerance.toString());
    }

    const url = `${this.baseUrl}/api/v1/regions${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch regions: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch metric snapshot for a specific year and week
   */
  async getMetricSnapshot(
    metric: string,
    year: number,
    week: number
  ): Promise<MetricSnapshot> {
    const params = new URLSearchParams({
      metric,
      year: year.toString(),
      week: week.toString(),
    });

    const url = `${this.baseUrl}/api/v1/metrics/snapshot?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch metric snapshot: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch global min/max range for a metric across all time periods
   */
  async getMetricRange(metric: string): Promise<{
    metric: string;
    min_value: number;
    max_value: number;
  }> {
    const params = new URLSearchParams({ metric });
    const url = `${this.baseUrl}/api/v1/metrics/range?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch metric range: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch time series data for a specific region
   */
  async getTimeSeries(
    nutsId: string,
    metric1: string,
    metric2?: string
  ): Promise<TimeSeriesResponse> {
    const params = new URLSearchParams({
      metric1,
    });

    if (metric2) {
      params.append('metric2', metric2);
    }

    const url = `${this.baseUrl}/api/v1/timeseries/${nutsId}?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch time series: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${this.baseUrl}/health-check`);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const climateAPI = new ClimateAPI(API_BASE_URL);
