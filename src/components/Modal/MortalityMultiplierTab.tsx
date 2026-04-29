'use client';

import React, { useState, useMemo } from 'react';
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
import { useMortalityMultiplier } from '@/hooks/useClimateData';
import type { AgeGroup } from '@/lib/api';

interface MortalityMultiplierTabProps {
  /** NUTS region ID — country code extracted from first 2 chars (e.g. "AT1" → "AT") */
  nutsId: string;
}

const AGE_GROUPS: AgeGroup[] = ['20-44', '45-64', '65-74', '75-84', '85+'];

const RCP_COLORS: Record<string, string> = {
  'RCP 2.6': '#22c55e',
  'RCP 4.5': '#f59e0b',
  'RCP 7.0': '#ef4444',
};

type Component = 'total' | 'heat' | 'cold';

const COMPONENT_KEYS: Record<Component, 'multiplier_total' | 'multiplier_heat' | 'multiplier_cold'> = {
  total: 'multiplier_total',
  heat:  'multiplier_heat',
  cold:  'multiplier_cold',
};

const COMPONENT_LABELS: Record<Component, string> = {
  total: 'Total',
  heat:  'Heat',
  cold:  'Cold',
};

export const MortalityMultiplierTab: React.FC<MortalityMultiplierTabProps> = ({ nutsId }) => {
  const countryCode = nutsId.slice(0, 2).toUpperCase();

  const [ageGroup, setAgeGroup] = useState<AgeGroup>('65-74');
  const [component, setComponent] = useState<Component>('total');

  const { data, isLoading, error } = useMortalityMultiplier(countryCode, ageGroup);

  // Pivot data: [{year, 'RCP 2.6': val, 'RCP 4.5': val, 'RCP 7.0': val}, ...]
  const chartData = useMemo(() => {
    if (!data) return [];
    const key = COMPONENT_KEYS[component];
    const byYear: Record<number, Record<string, number>> = {};
    for (const row of data.data) {
      if (!byYear[row.year]) byYear[row.year] = { year: row.year };
      byYear[row.year][row.rcp_scenario] = row[key];
    }
    return Object.values(byYear).sort((a, b) => a.year - b.year);
  }, [data, component]);

  const rcpScenarios = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.data.map(d => d.rcp_scenario))].sort();
  }, [data]);

  const formatMultiplier = (value: number) => {
    const pct = ((value - 1) * 100).toFixed(2);
    return `${value >= 1 ? '+' : ''}${pct}%`;
  };

  // Compute tight Y-axis domain from actual data
  const yDomain = useMemo(() => {
    if (!chartData.length) return [0.99, 1.01];
    const allVals: number[] = [];
    for (const row of chartData) {
      for (const rcp of rcpScenarios) {
        const v = row[rcp] as number | undefined;
        if (v != null) allVals.push(v);
      }
    }
    if (!allVals.length) return [0.99, 1.01];
    const lo = Math.min(...allVals);
    const hi = Math.max(...allVals);
    const pad = Math.max((hi - lo) * 0.15, 0.0005);
    return [lo - pad, hi + pad];
  }, [chartData, rcpScenarios, component]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold mb-2">Year {label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-gray-600">{p.name}:</span>
            <span className="font-medium">{formatMultiplier(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6DC201]" />
        <span className="ml-3 text-gray-600">Loading mortality data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600 font-medium">No mortality multiplier data for {countryCode}</p>
          <p className="text-sm text-gray-500 mt-1">Data covers: AT, BE, BG, CH, CY, CZ, DE, DK, EE, EL, ES, FI, FR, HR, HU</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Age Group</label>
          <div className="flex gap-1">
            {AGE_GROUPS.map(ag => (
              <button
                key={ag}
                onClick={() => setAgeGroup(ag)}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  ageGroup === ag
                    ? 'bg-[#6DC201] text-white border-[#6DC201]'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-[#6DC201]'
                }`}
              >
                {ag}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Component</label>
          <div className="flex gap-1">
            {(Object.keys(COMPONENT_LABELS) as Component[]).map(c => (
              <button
                key={c}
                onClick={() => setComponent(c)}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  component === c
                    ? 'bg-[#6DC201] text-white border-[#6DC201]'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-[#6DC201]'
                }`}
              >
                {COMPONENT_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          {COMPONENT_LABELS[component]} Mortality Multiplier — {countryCode}, age {ageGroup}
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11 }}
              tickLine={false}
              interval={9}
            />
            <YAxis
              domain={yDomain as [number, number]}
              tickFormatter={formatMultiplier}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine y={1} stroke="#9ca3af" strokeDasharray="4 4" label={{ value: 'Baseline', position: 'right', fontSize: 10, fill: '#9ca3af' }} />
            {rcpScenarios.map(rcp => (
              <Line
                key={rcp}
                type="monotone"
                dataKey={rcp}
                stroke={RCP_COLORS[rcp] ?? '#6b7280'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary cards for end year */}
      {data && chartData.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {rcpScenarios.map(rcp => {
            const endRow = chartData[chartData.length - 1];
            const val = endRow?.[rcp] as number | undefined;
            if (val == null) return null;
            const pct = ((val - 1) * 100);
            return (
              <div key={rcp} className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">{rcp} by 2099</p>
                <p
                  className="text-lg font-bold"
                  style={{ color: RCP_COLORS[rcp] ?? '#374151' }}
                >
                  {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400">vs baseline</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
