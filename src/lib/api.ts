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

  /**
   * Fetch B-spline coefficients data
   */
  async getCoefficients(): Promise<BSplineCoefficient[]> {
    const url = `${this.baseUrl}/api/v1/coefficients`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch coefficients: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch unique city codes with names
   */
  async getCities(): Promise<Array<{code: string, name: string | null}>> {
    const url = `${this.baseUrl}/api/v1/coefficients/cities`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch cities: ${response.statusText}`);
    }

    const data = await response.json();
    return data.cities;
  }

  /**
   * Fetch URAU codes filtered by NUTS region with names
   */
  async getCitiesByNuts(nutsId: string): Promise<Array<{code: string, name: string | null}>> {
    const url = `${this.baseUrl}/api/v1/coefficients/cities/by-nuts/${nutsId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch cities for NUTS ${nutsId}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.cities;
  }

  /**
   * Evaluate B-spline curve for a specific city and age group
   */
  async evaluateBSpline(
    urauCode: string,
    agegroup: string
  ): Promise<BSplineEvaluation> {
    const params = new URLSearchParams({
      urau_code: urauCode,
      agegroup: agegroup,
    });

    const url = `${this.baseUrl}/api/v1/bspline/evaluate?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to evaluate B-spline: ${response.statusText}`);
    }

    return response.json();
  }
}

// B-Spline coefficient type
export interface BSplineCoefficient {
  urau_code: string;
  agegroup: string;
  b1: number;
  b2: number;
  b3: number;
  b4: number;
  b5: number;
}

// B-Spline evaluation result
export interface BSplineEvaluation {
  urau_code: string;
  agegroup: string;
  knots: {
    p10: number;
    p75: number;
    p90: number;
  };
  mmt: {
    temperature: number;
    percentile: number;
    relative_risk: number;  // Always 1.0 by definition
  };
  extreme_rr: {
    rr_at_p01: number | null;
    rr_at_p99: number | null;
    temp_at_p01: number;
    temp_at_p99: number;
  };
  data: Array<{
    temperature: number;
    percentile: number;
    value: number;
  }>;
}

// Export singleton instance
export const climateAPI = new ClimateAPI(API_BASE_URL);
