'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { climateAPI } from '@/lib/api';
import type { BSplineEvaluation } from '@/lib/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const AGE_GROUPS = ['20-44', '45-64', '65-74', '75-84', '85+'];
const AGE_GROUP_COLORS = {
  '20-44': '#3b82f6',  // Blue
  '45-64': '#10b981',  // Green
  '65-74': '#f59e0b',  // Orange
  '75-84': '#ef4444',  // Red
  '85+': '#8b5cf6',    // Purple
};

export default function CoefficientsPage() {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('20-44');
  const [showAllAgeGroups, setShowAllAgeGroups] = useState<boolean>(false);
  const [usePercentiles, setUsePercentiles] = useState<boolean>(true);

  // Fetch cities
  const { data: cities, isLoading: isLoadingCities } = useQuery<Array<{code: string, name: string | null}>>({
    queryKey: ['cities'],
    queryFn: () => climateAPI.getCities(),
  });

  // Set default city when cities are loaded
  useEffect(() => {
    if (cities && cities.length > 0 && !selectedCity) {
      setSelectedCity(cities[0].code);
    }
  }, [cities, selectedCity]);

  // Fetch B-spline evaluation for selected city and age group (single mode)
  const { data: bsplineData, isLoading: isLoadingBSpline } = useQuery<BSplineEvaluation>({
    queryKey: ['bspline', selectedCity, selectedAgeGroup],
    queryFn: () => climateAPI.evaluateBSpline(selectedCity, selectedAgeGroup),
    enabled: !!selectedCity && !!selectedAgeGroup && !showAllAgeGroups,
  });

  // Fetch B-spline evaluations for all age groups (comparison mode)
  const allAgeGroupQueries = useQuery({
    queryKey: ['bspline-all', selectedCity],
    queryFn: async () => {
      const results = await Promise.all(
        AGE_GROUPS.map((ageGroup) =>
          climateAPI.evaluateBSpline(selectedCity, ageGroup)
        )
      );
      return results;
    },
    enabled: !!selectedCity && showAllAgeGroups,
  });

  if (isLoadingCities) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading cities data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Temperature-Mortality Exposure-Response Curves
          </h1>
          <p className="text-gray-600">
            Quadratic B-spline curves showing temperature-mortality relationships centered at the 
            MMT (Minimum Mortality Temperature). Knots are placed at the 10th, 75th, and 90th 
            percentiles of each city's temperature distribution.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* City selector */}
            <div>
              <label
                htmlFor="city-select"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                City (URAU Code)
              </label>
              <select
                id="city-select"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {cities?.map((city) => (
                  <option key={city.code} value={city.code}>
                    {city.code}{city.name ? ` (${city.name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Age group selector - only shown when not comparing all */}
            <div>
              <label
                htmlFor="age-select"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Age Group
              </label>
              <select
                id="age-select"
                value={selectedAgeGroup}
                onChange={(e) => setSelectedAgeGroup(e.target.value)}
                disabled={showAllAgeGroups}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {AGE_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group} years
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggle for showing all age groups */}
          <div className="mt-4 flex items-center gap-6">
            <div className="flex items-center">
              <input
                id="show-all-toggle"
                type="checkbox"
                checked={showAllAgeGroups}
                onChange={(e) => setShowAllAgeGroups(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="show-all-toggle"
                className="ml-2 block text-sm text-gray-700"
              >
                Compare all age groups
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="percentile-toggle"
                type="checkbox"
                checked={usePercentiles}
                onChange={(e) => setUsePercentiles(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="percentile-toggle"
                className="ml-2 block text-sm text-gray-700"
              >
                Show percentiles (instead of temperature)
              </label>
            </div>
          </div>

          {/* Info */}
          {!showAllAgeGroups && bsplineData && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>City:</strong> {bsplineData.urau_code} •{' '}
                <strong>Age Group:</strong> {bsplineData.agegroup} years
              </p>
              <p className="text-sm text-blue-800 mt-1">
                <strong>MMT (Minimum Mortality Temperature):</strong> {bsplineData.mmt.temperature.toFixed(2)}°C 
                ({bsplineData.mmt.percentile.toFixed(1)}th percentile)
              </p>
              <p className="text-sm text-blue-800 mt-1">
                <strong>Knots:</strong> 10th: {bsplineData.knots.p10.toFixed(1)}°C, 
                75th: {bsplineData.knots.p75.toFixed(1)}°C, 
                90th: {bsplineData.knots.p90.toFixed(1)}°C
              </p>
              {bsplineData.extreme_rr.rr_at_p01 && bsplineData.extreme_rr.rr_at_p99 && (
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Extreme RR:</strong> Cold (1st %ile, {bsplineData.extreme_rr.temp_at_p01.toFixed(1)}°C): {bsplineData.extreme_rr.rr_at_p01.toFixed(3)} • 
                  Heat (99th %ile, {bsplineData.extreme_rr.temp_at_p99.toFixed(1)}°C): {bsplineData.extreme_rr.rr_at_p99.toFixed(3)}
                </p>
              )}
            </div>
          )}
          {showAllAgeGroups && allAgeGroupQueries.data && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>City:</strong> {selectedCity} •{' '}
                <strong>Comparing:</strong> All {AGE_GROUPS.length} age groups
              </p>
              <p className="text-sm text-blue-800 mt-1">
                <strong>Temperature range:</strong>{' '}
                {allAgeGroupQueries.data[0]?.data[0]?.temperature.toFixed(1)}°C to{' '}
                {allAgeGroupQueries.data[0]?.data[allAgeGroupQueries.data[0]?.data.length - 1]?.temperature.toFixed(1)}°C
              </p>
              <div className="mt-2">
                <p className="text-xs text-blue-700 font-semibold">MMT by age group:</p>
                <div className="grid grid-cols-5 gap-2 mt-1">
                  {allAgeGroupQueries.data.map((ageData, idx) => (
                    <div key={AGE_GROUPS[idx]} className="text-xs text-blue-700">
                      <span className="font-medium">{AGE_GROUPS[idx]}:</span> {ageData.mmt.temperature.toFixed(1)}°C
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Temperature-Mortality B-Spline Curve{showAllAgeGroups ? 's' : ''}
          </h2>
          
          {(isLoadingBSpline || allAgeGroupQueries.isLoading) ? (
            <div className="text-center py-12 text-gray-500">
              Loading B-spline curve{showAllAgeGroups ? 's' : ''}...
            </div>
          ) : showAllAgeGroups && allAgeGroupQueries.data ? (
            // Multi-line chart comparing all age groups
            (() => {
              // Find temperatures corresponding to specific percentiles
              const firstData = allAgeGroupQueries.data[0].data;
              
              // Find the closest point to each target percentile
              const findClosestPercentile = (targetPercentile: number) => {
                let closest = firstData[0];
                let minDiff = Math.abs(firstData[0].percentile - targetPercentile);
                
                for (const point of firstData) {
                  const diff = Math.abs(point.percentile - targetPercentile);
                  if (diff < minDiff) {
                    minDiff = diff;
                    closest = point;
                  }
                }
                return closest;
              };
              
              const percentileTicks = usePercentiles 
                ? [1, 25, 50, 75, 99].map(p => findClosestPercentile(p).temperature)
                : undefined;

              return (
                <ResponsiveContainer width="100%" height={500}>
                  <LineChart
                    margin={{ top: 5, right: 30, left: 60, bottom: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="temperature"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      label={{ 
                        value: usePercentiles ? 'Temperature Percentile' : 'Temperature (°C)', 
                        position: 'insideBottom', 
                        offset: -40 
                      }}
                      tickFormatter={usePercentiles ? (temp: number) => {
                        const point = firstData.find(p => Math.abs(p.temperature - temp) < 0.5);
                        return point ? point.percentile.toFixed(0) : '';
                      } : (temp: number) => temp.toFixed(1)}
                      ticks={percentileTicks}
                    />
                    <YAxis
                      domain={[0.5, 2]}
                      allowDataOverflow={true}
                  label={{ value: 'Relative Risk (RR)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value: number) => value.toFixed(4)}
                  labelFormatter={(label: number) => {
                    if (usePercentiles) {
                      const firstData = allAgeGroupQueries.data[0].data;
                      const point = firstData.find(p => Math.abs(p.temperature - label) < 0.01);
                      return point ? `${point.percentile.toFixed(1)}th percentile (${label.toFixed(2)}°C)` : `${label.toFixed(2)}°C`;
                    }
                    return `${label.toFixed(2)}°C`;
                  }}
                />
                <Legend iconType="line" align="center" />
                
                {/* Plot one line for each age group */}
                {allAgeGroupQueries.data.map((ageGroupData, idx) => (
                  <Line
                    key={AGE_GROUPS[idx]}
                    data={ageGroupData.data}
                    type="monotone"
                    dataKey="value"
                    name={`${AGE_GROUPS[idx]} years`}
                    stroke={AGE_GROUP_COLORS[AGE_GROUPS[idx] as keyof typeof AGE_GROUP_COLORS]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
                
                {/* Horizontal line at RR = 1 */}
                <ReferenceLine
                  y={1}
                  stroke="#6b7280"
                  strokeDasharray="5 5"
                  label={{ value: 'RR = 1', position: 'right', fill: '#6b7280' }}
                />
                
                {/* Add reference lines for specific percentiles */}
                {usePercentiles && percentileTicks && (
                  <>
                    {percentileTicks.map((temp, idx) => (
                      <ReferenceLine
                        key={[1, 25, 50, 75, 99][idx]}
                        x={temp}
                        stroke="#d1d5db"
                        strokeDasharray="3 3"
                      />
                    ))}
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
              );
            })()
          ) : !showAllAgeGroups && bsplineData ? (
            // Single age group chart
            (() => {
              // Find temperatures corresponding to specific percentiles
              
              // Find the closest point to each target percentile
              const findClosestPercentile = (targetPercentile: number) => {
                let closest = bsplineData.data[0];
                let minDiff = Math.abs(bsplineData.data[0].percentile - targetPercentile);
                
                for (const point of bsplineData.data) {
                  const diff = Math.abs(point.percentile - targetPercentile);
                  if (diff < minDiff) {
                    minDiff = diff;
                    closest = point;
                  }
                }
                return closest;
              };
              
              const percentileTicks = usePercentiles 
                ? [1, 25, 50, 75, 99].map(p => findClosestPercentile(p).temperature)
                : undefined;

              return (
                <ResponsiveContainer width="100%" height={500}>
                  <LineChart
                    data={bsplineData.data}
                    margin={{ top: 5, right: 30, left: 60, bottom: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="temperature"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      label={{ 
                        value: usePercentiles ? 'Temperature Percentile' : 'Temperature (°C)', 
                        position: 'insideBottom', 
                        offset: -40 
                      }}
                      tickFormatter={usePercentiles ? (temp: number) => {
                        const point = bsplineData.data.find(p => Math.abs(p.temperature - temp) < 0.5);
                        return point ? point.percentile.toFixed(0) : '';
                      } : (temp: number) => temp.toFixed(1)}
                      ticks={percentileTicks}
                    />
                    <YAxis
                      domain={[0.5, 2]}
                      allowDataOverflow={true}
                  label={{ value: 'Relative Risk (RR)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value: number) => value.toFixed(4)}
                  labelFormatter={(label: number) => {
                    if (usePercentiles) {
                      const point = bsplineData.data.find(p => Math.abs(p.temperature - label) < 0.01);
                      return point ? `${point.percentile.toFixed(1)}th percentile (${label.toFixed(2)}°C)` : `${label.toFixed(2)}°C`;
                    }
                    return `${label.toFixed(2)}°C`;
                  }}
                />
                <Legend iconType="line" align="center" />
                <Line
                  type="monotone"
                  dataKey="value"
                  name={`${bsplineData.agegroup} years`}
                  stroke={AGE_GROUP_COLORS[bsplineData.agegroup as keyof typeof AGE_GROUP_COLORS]}
                  strokeWidth={3}
                  dot={false}
                />
                {/* MMT reference line - green, solid */}
                <ReferenceLine
                  x={bsplineData.mmt.temperature}
                  stroke="#10b981"
                  strokeWidth={2}
                  label={{ 
                    value: usePercentiles 
                      ? `MMT: ${bsplineData.mmt.percentile.toFixed(1)}`
                      : `MMT: ${bsplineData.mmt.temperature.toFixed(1)}°C`, 
                    position: 'top',
                    fill: '#10b981',
                    fontWeight: 'bold'
                  }}
                />
                {/* Horizontal line at RR = 1 */}
                <ReferenceLine
                  y={1}
                  stroke="#6b7280"
                  strokeDasharray="5 5"
                  label={{ value: 'RR = 1', position: 'right', fill: '#6b7280' }}
                />
                
                {/* Add reference lines for specific percentiles */}
                {usePercentiles && percentileTicks && (
                  <>
                    {percentileTicks.map((temp, idx) => (
                      <ReferenceLine
                        key={[1, 25, 50, 75, 99][idx]}
                        x={temp}
                        stroke="#d1d5db"
                        strokeDasharray="3 3"
                      />
                    ))}
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
              );
            })()
          ) : (
            <div className="text-center py-12 text-gray-500">
              No data available
            </div>
          )}
          
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              About {showAllAgeGroups ? 'these curves' : 'this curve'}:
            </h3>
            <p className="text-sm text-gray-600">
              {showAllAgeGroups ? (
                <>
                  These exposure-response curves are natural quadratic B-splines (degree 2) with knots 
                  at the 10th, 75th, and 90th percentiles. Each curve is centered at its 
                  <strong> MMT (Minimum Mortality Temperature)</strong>, identified within the 25th-75th 
                  percentile range, where <strong>RR = 1</strong> by definition. Older age groups typically 
                  show higher vulnerability to both extreme cold and heat, with steeper curves and higher 
                  relative risks at temperature extremes.
                </>
              ) : (
                <>
                  This exposure-response curve is a natural quadratic B-spline (degree 2) with knots 
                  at the 10th, 75th, and 90th percentiles of the temperature distribution. The curve is 
                  centered at the <strong>MMT (Minimum Mortality Temperature)</strong>, shown by the green 
                  vertical line. The MMT is identified as the temperature with the lowest mortality risk 
                  within the 25th-75th percentile range. At the MMT, <strong>RR = 1</strong> by definition, 
                  and all other relative risks are interpreted relative to this optimal temperature. Gray 
                  dashed lines show the knot locations where the spline changes flexibility.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Back to main map */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ← Back to Climate Map
          </a>
        </div>
      </div>
    </div>
  );
}
