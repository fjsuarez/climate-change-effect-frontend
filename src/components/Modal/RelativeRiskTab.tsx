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

interface RelativeRiskTabProps {
  nutsId: string;
}

export function RelativeRiskTab({ nutsId }: RelativeRiskTabProps) {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('20-44');
  const [showAllAgeGroups, setShowAllAgeGroups] = useState<boolean>(false);
  const [usePercentiles, setUsePercentiles] = useState<boolean>(false); // Default to temperature view
  const [hoveredPoint, setHoveredPoint] = useState<{
    temperature: number;
    percentile: number;
    relativeRisk: number;
  } | null>(null);

  // Fetch cities filtered by NUTS region
  const { data: cities, isLoading: isLoadingCities } = useQuery<Array<{code: string, name: string | null}>>({
    queryKey: ['cities', nutsId],
    queryFn: () => climateAPI.getCitiesByNuts(nutsId),
    enabled: !!nutsId,
  });

  // Set default city when cities are loaded
  useEffect(() => {
    if (cities && cities.length > 0) {
      setSelectedCity(cities[0].code);
    } else {
      setSelectedCity('');
    }
  }, [cities]);

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

  // Helper function to find closest percentile
  const findClosestPercentile = (data: Array<{ temperature: number; percentile: number; value: number }>, targetPercentile: number) => {
    let closest = data[0];
    let minDiff = Math.abs(data[0].percentile - targetPercentile);
    
    for (const point of data) {
      const diff = Math.abs(point.percentile - targetPercentile);
      if (diff < minDiff) {
        minDiff = diff;
        closest = point;
      }
    }
    return closest;
  };

  // Helper function to generate nice temperature ticks
  const generateTemperatureTicks = (data: Array<{ temperature: number; percentile: number; value: number }>) => {
    // Use temperatures at key percentiles (1st, 25th, 50th, 75th, 99th)
    const keyPercentiles = [1, 25, 50, 75, 99];
    return keyPercentiles.map(p => findClosestPercentile(data, p).temperature);
  };

  if (isLoadingCities) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-gray-500">Loading cities...</div>
      </div>
    );
  }

  if (!cities || cities.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-gray-500">No URAU cities found for this region.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="space-y-4">
        {/* City selector */}
        <div>
          <label
            htmlFor="city-select-modal"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            City (URAU Code)
          </label>
          <select
            id="city-select-modal"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {cities.map((city) => (
              <option key={city.code} value={city.code}>
                {city.code}{city.name ? ` (${city.name})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Age group selector - only shown when not comparing all */}
        <div>
          <label
            htmlFor="age-select-modal"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Age Group
          </label>
          <select
            id="age-select-modal"
            value={selectedAgeGroup}
            onChange={(e) => setSelectedAgeGroup(e.target.value)}
            disabled={showAllAgeGroups}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {AGE_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group} years
              </option>
            ))}
          </select>
        </div>

        {/* Toggle for showing all age groups */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center">
            <input
              id="show-all-toggle-modal"
              type="checkbox"
              checked={showAllAgeGroups}
              onChange={(e) => setShowAllAgeGroups(e.target.checked)}
              className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="show-all-toggle-modal"
              className="ml-2 block text-xs text-gray-700"
            >
              Compare all age groups
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="percentile-toggle-modal"
              type="checkbox"
              checked={usePercentiles}
              onChange={(e) => setUsePercentiles(e.target.checked)}
              className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="percentile-toggle-modal"
              className="ml-2 block text-xs text-gray-700"
            >
              Show percentiles
            </label>
          </div>
        </div>

        {/* Info */}
        {!showAllAgeGroups && bsplineData && (
          <div className="p-3 bg-blue-50 rounded-md">
            <p className="text-xs text-blue-800">
              <strong>MMT:</strong> {bsplineData.mmt.temperature.toFixed(2)}°C 
              ({bsplineData.mmt.percentile.toFixed(1)}th %ile)
            </p>
            {bsplineData.extreme_rr.rr_at_p01 && bsplineData.extreme_rr.rr_at_p99 && (
              <p className="text-xs text-blue-800 mt-1">
                <strong>Extreme RR:</strong> Cold (1st %ile): {bsplineData.extreme_rr.rr_at_p01.toFixed(2)} • 
                Heat (99th %ile): {bsplineData.extreme_rr.rr_at_p99.toFixed(2)}
              </p>
            )}
          </div>
        )}
        {showAllAgeGroups && allAgeGroupQueries.data && (
          <div className="p-3 bg-blue-50 rounded-md">
            <p className="text-xs text-blue-800">
              <strong>Comparing:</strong> All {AGE_GROUPS.length} age groups
            </p>
            <div className="mt-2">
              <p className="text-xs text-blue-700 font-semibold">MMT by age:</p>
              <div className="grid grid-cols-3 gap-1 mt-1">
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
      <div>
        {(isLoadingBSpline || allAgeGroupQueries.isLoading) ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            Loading B-spline curve{showAllAgeGroups ? 's' : ''}...
          </div>
        ) : showAllAgeGroups && allAgeGroupQueries.data ? (
          // Multi-line chart comparing all age groups
          (() => {
            const firstData = allAgeGroupQueries.data[0].data;
            const targetPercentiles = [1, 25, 50, 75, 99];
            const percentilePoints = targetPercentiles.map(p => findClosestPercentile(firstData, p));
            
            // For percentile mode: use temperatures at key percentiles
            // For temperature mode: also use temperatures at key percentiles (nice round-ish values)
            const tickTemperatures = percentilePoints.map(p => p.temperature);

            return (
              <div style={{ overflow: 'visible' }}>
                <ResponsiveContainer width="100%" height={420}>
                  <LineChart data={bsplineData.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="temperature"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      label={{ 
                        value: usePercentiles ? 'Temperature Percentile' : 'Temperature (°C)', 
                        position: 'insideBottom', 
                        offset: -10,
                        style: { fontSize: '12px' }
                      }}
                      tickFormatter={usePercentiles ? (temp: number) => {
                        // Find the exact percentile point for this tick
                        const point = percentilePoints.find(p => Math.abs(p.temperature - temp) < 0.01);
                        return point ? point.percentile.toFixed(0) : '';
                      } : (temp: number) => temp.toFixed(1)}
                      ticks={tickTemperatures}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                    domain={[0.5, 2]}
                    allowDataOverflow={true}
                    label={{ 
                      value: 'Relative Risk', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fontSize: '12px' }
                    }}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: '11px' }}
                    formatter={(value: number) => value.toFixed(3)}
                    labelFormatter={(label: number) => {
                      if (usePercentiles) {
                        const point = firstData.find(p => Math.abs(p.temperature - label) < 0.01);
                        return point ? `${point.percentile.toFixed(1)}th %ile (${label.toFixed(2)}°C)` : `${label.toFixed(2)}°C`;
                      }
                      return `${label.toFixed(2)}°C`;
                    }}
                  />
                  <Legend 
                    iconType="line" 
                    align="center"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                  
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
                    label={{ value: 'RR = 1', position: 'right', fill: '#6b7280', fontSize: 11 }}
                  />
                  
                  {/* Add reference lines for key percentile temperatures */}
                  {usePercentiles && (
                    <>
                      {tickTemperatures.map((temp: number, idx: number) => (
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
              </div>
            );
          })()
        ) : !showAllAgeGroups && bsplineData ? (
          // Single age group chart
          (() => {
            const targetPercentiles = [1, 25, 50, 75, 99];
            const percentilePoints = targetPercentiles.map(p => findClosestPercentile(bsplineData.data, p));
            
            // For percentile mode: use temperatures at key percentiles
            // For temperature mode: also use temperatures at key percentiles (nice round-ish values)
            const tickTemperatures = percentilePoints.map(p => p.temperature);

            // Get the color for the selected age group
            const ageGroupColor = AGE_GROUP_COLORS[selectedAgeGroup as keyof typeof AGE_GROUP_COLORS] || '#2563eb';

            return (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={bsplineData.data}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="temperature"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    label={{ 
                      value: usePercentiles ? 'Temperature Percentile' : 'Temperature (°C)', 
                      position: 'insideBottom',
                      offset: 0,
                      style: { fontSize: '12px', textAnchor: 'middle' }
                    }}
                    tickFormatter={usePercentiles ? (temp: number) => {
                      // Find the exact percentile point for this tick
                      const point = percentilePoints.find(p => Math.abs(p.temperature - temp) < 0.01);
                      return point ? point.percentile.toFixed(0) : '';
                    } : (temp: number) => temp.toFixed(1)}
                    ticks={tickTemperatures}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    domain={[0.5, 2]}
                    allowDataOverflow={true}
                    label={{ 
                      value: 'Relative Risk', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fontSize: '12px' }
                    }}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: '11px' }}
                    formatter={(value: number) => [`${value.toFixed(3)}`, 'RR']}
                    labelFormatter={(label: number) => {
                      if (usePercentiles) {
                        const point = bsplineData.data.find(p => Math.abs(p.temperature - label) < 0.01);
                        return point ? `${point.percentile.toFixed(1)}th %ile (${label.toFixed(2)}°C)` : `${label.toFixed(2)}°C`;
                      }
                      return `${label.toFixed(2)}°C`;
                    }}
                    cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '5 5' }}
                    content={(props: any) => {
                      if (props.active && props.payload && props.payload.length > 0) {
                        const data = props.payload[0].payload;
                        // Use a ref to update state without causing re-render during render
                        const newPoint = {
                          temperature: data.temperature,
                          percentile: data.percentile,
                          relativeRisk: data.value,
                        };
                        
                        // Schedule state update after render
                        setTimeout(() => {
                          setHoveredPoint((prev) => {
                            if (!prev || 
                                prev.temperature !== newPoint.temperature || 
                                prev.relativeRisk !== newPoint.relativeRisk) {
                              return newPoint;
                            }
                            return prev;
                          });
                        }, 0);
                        
                        // Render custom tooltip
                        return (
                          <div className="bg-white border border-gray-300 rounded shadow-lg p-2" style={{ fontSize: '11px' }}>
                            <p className="font-semibold">
                              {usePercentiles 
                                ? `${data.percentile.toFixed(1)}th %ile (${data.temperature.toFixed(2)}°C)`
                                : `${data.temperature.toFixed(2)}°C`
                              }
                            </p>
                            <p className="text-blue-600">RR: {data.value.toFixed(3)}</p>
                          </div>
                        );
                      }
                      // Schedule clearing hovered point when not hovering
                      setTimeout(() => {
                        setHoveredPoint(null);
                      }, 0);
                      return null;
                    }}
                  />
                  
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={ageGroupColor}
                    strokeWidth={2}
                    dot={false}
                    name="Relative Risk"
                  />
                  
                  {/* Horizontal line at RR = 1 */}
                  <ReferenceLine
                    y={1}
                    stroke="#6b7280"
                    strokeDasharray="5 5"
                    label={{ value: 'RR = 1', position: 'right', fill: '#6b7280', fontSize: 11 }}
                  />
                  
                  {/* Vertical line at MMT */}
                  <ReferenceLine
                    x={bsplineData.mmt.temperature}
                    stroke="#16a34a"
                    strokeDasharray="5 5"
                    label={{ 
                      value: `MMT: ${bsplineData.mmt.temperature.toFixed(1)}°C`, 
                      position: 'insideTopLeft',
                      fill: '#16a34a', 
                      fontSize: 11,
                      offset: 5
                    }}
                  />
                  
                  {/* Add reference lines for key percentile temperatures */}
                  {usePercentiles && (
                    <>
                      {tickTemperatures.map((temp: number, idx: number) => (
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
          <div className="text-center py-12 text-gray-500 text-sm">
            Select a city to view the B-spline curve.
          </div>
        )}
      </div>

      {/* Dynamic descriptive paragraph for single age group */}
      {!showAllAgeGroups && bsplineData && hoveredPoint && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-800 leading-relaxed">
            At <span className="font-semibold text-blue-700">{hoveredPoint.temperature.toFixed(1)}°C</span>
            {' '}(<span className="font-medium">{hoveredPoint.percentile.toFixed(1)}th percentile</span>), 
            a person aged <span className="font-semibold text-indigo-700">{selectedAgeGroup} years</span> is at{' '}
            <span className="font-bold text-lg text-red-600">{hoveredPoint.relativeRisk.toFixed(2)}×</span> the risk 
            of dying due to temperature-related causes compared to the optimal temperature 
            (<span className="font-medium text-green-700">{bsplineData.mmt.temperature.toFixed(1)}°C</span>, MMT).
          </p>
        </div>
      )}

      {/* Info paragraph when not hovering */}
      {!showAllAgeGroups && bsplineData && !hoveredPoint && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 italic">
            Hover over the curve to see the relative risk at different temperatures
          </p>
        </div>
      )}
    </div>
  );
}
