'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, ComposedChart, Area, ReferenceLine
} from 'recharts';
import { actuarialAPI, type ClimateImpactResponse, type MultiScenarioResponse } from '@/lib/api';

interface ActuarialTabProps {
  nutsId: string;
}

// Format currency
const formatCurrency = (value: number): string => {
  if (Math.abs(value) >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

// Format percentage
const formatPercent = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

export const ActuarialTab: React.FC<ActuarialTabProps> = ({ nutsId }) => {
  // Parameters state
  const [temperatureDelta, setTemperatureDelta] = useState(2.5);
  const [interestRate, setInterestRate] = useState(0.01);
  const [erfRiskPerDegree, setErfRiskPerDegree] = useState(0.02);
  const [erfNonlinear, setErfNonlinear] = useState(false);
  const [portfolioSize, setPortfolioSize] = useState(100); // number of policies
  const [portfolioMix, setPortfolioMix] = useState<'annuity_heavy' | 'balanced' | 'insurance_heavy'>('annuity_heavy');

  // Fetch single scenario analysis
  const { data: climateImpact, isLoading, error } = useQuery({
    queryKey: ['actuarial-analysis', temperatureDelta, interestRate, erfRiskPerDegree, erfNonlinear, portfolioSize, portfolioMix],
    queryFn: () => actuarialAPI.analyzeClimateRisk({
      temperature_delta: temperatureDelta,
      interest_rate: interestRate,
      erf_risk_per_degree: erfRiskPerDegree,
      erf_nonlinear: erfNonlinear,
      n_policies: portfolioSize,
      portfolio_mix: portfolioMix,
    }),
    staleTime: 60000,
  });

  // Fetch multi-scenario analysis for stress testing chart
  const { data: multiScenario } = useQuery({
    queryKey: ['actuarial-multi-scenario', interestRate, erfRiskPerDegree, erfNonlinear, portfolioSize],
    queryFn: () => actuarialAPI.analyzeMultipleScenarios(
      [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0],
      interestRate,
      erfRiskPerDegree,
      erfNonlinear,
      portfolioSize
    ),
    staleTime: 60000,
  });

  // Fetch mortality comparison for survival curves
  const { data: mortalityData } = useQuery({
    queryKey: ['actuarial-mortality', temperatureDelta, erfRiskPerDegree, erfNonlinear],
    queryFn: () => actuarialAPI.adjustMortality(temperatureDelta, erfRiskPerDegree, erfNonlinear),
    staleTime: 60000,
  });

  // Process survival data for chart
  const survivalData = useMemo(() => {
    if (!mortalityData) return [];
    return mortalityData.mortality_comparison.filter(d => d.age % 5 === 0).map(d => ({
      age: d.age,
      baseline: d.baseline_lx,
      adjusted: d.adjusted_lx,
      gap: d.baseline_lx - d.adjusted_lx,
    }));
  }, [mortalityData]);

  // Process life expectancy data
  const lifeExpectancyData = useMemo(() => {
    if (!mortalityData) return [];
    return mortalityData.mortality_comparison.filter(d => d.age % 10 === 0).map(d => ({
      age: d.age,
      baseline: d.baseline_ex,
      adjusted: d.adjusted_ex,
      yearsLost: d.baseline_ex - d.adjusted_ex,
    }));
  }, [mortalityData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Analyzing climate risk...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load actuarial analysis</p>
        <p className="text-sm text-red-600">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Parameter Controls - Two Rows */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3">📊 Scenario Parameters</h3>
        
        {/* Row 1: Climate & Financial Parameters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {/* Temperature Delta */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Temperature Δ (°C)
            </label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={temperatureDelta}
              onChange={(e) => setTemperatureDelta(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <span className="text-sm font-bold text-red-600">+{temperatureDelta}°C</span>
          </div>

          {/* Interest Rate */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Interest Rate
            </label>
            <select
              value={interestRate}
              onChange={(e) => setInterestRate(parseFloat(e.target.value))}
              className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value={0.005}>0.5%</option>
              <option value={0.01}>1.0%</option>
              <option value={0.02}>2.0%</option>
              <option value={0.03}>3.0%</option>
            </select>
          </div>

          {/* ERF Risk per Degree */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              ERF (% per °C)
            </label>
            <select
              value={erfRiskPerDegree}
              onChange={(e) => setErfRiskPerDegree(parseFloat(e.target.value))}
              className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value={0.01}>1%</option>
              <option value={0.02}>2%</option>
              <option value={0.03}>3%</option>
              <option value={0.05}>5%</option>
            </select>
          </div>

          {/* ERF Model */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              ERF Model
            </label>
            <select
              value={erfNonlinear ? 'exponential' : 'linear'}
              onChange={(e) => setErfNonlinear(e.target.value === 'exponential')}
              className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="linear">Linear</option>
              <option value="exponential">Exponential</option>
            </select>
          </div>
        </div>

        {/* Row 2: Portfolio Configuration */}
        <div className="border-t border-gray-200 pt-3">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">📁 Portfolio Configuration</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Portfolio Size */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Total Policies
              </label>
              <select
                value={portfolioSize}
                onChange={(e) => setPortfolioSize(parseInt(e.target.value))}
                className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value={50}>50 policies</option>
                <option value={100}>100 policies</option>
                <option value={200}>200 policies</option>
                <option value={500}>500 policies</option>
              </select>
            </div>

            {/* Portfolio Mix */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Product Mix
              </label>
              <select
                value={portfolioMix}
                onChange={(e) => setPortfolioMix(e.target.value as 'annuity_heavy' | 'balanced' | 'insurance_heavy')}
                className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="annuity_heavy">Annuity Heavy (60/40)</option>
                <option value="balanced">Balanced (50/50)</option>
                <option value="insurance_heavy">Insurance Heavy (40/60)</option>
              </select>
            </div>

            {/* Info */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Info
              </label>
              <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                Ages: 25-80, Volumes: $50k-$1M
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      {climateImpact && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Relative Risk */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-xs text-orange-600 font-medium">Relative Risk</p>
            <p className="text-xl font-bold text-orange-800">
              {climateImpact.scenario.relative_risk.toFixed(3)}
            </p>
            <p className="text-xs text-orange-500">
              +{((climateImpact.scenario.relative_risk - 1) * 100).toFixed(1)}% mortality
            </p>
          </div>

          {/* Life Expectancy Change */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-600 font-medium">Life Expectancy</p>
            <p className="text-xl font-bold text-red-800">
              {climateImpact.mortality_impact.life_expectancy_change_years.toFixed(2)} yrs
            </p>
            <p className="text-xs text-red-500">
              {climateImpact.mortality_impact.baseline_life_expectancy.toFixed(1)} → {climateImpact.mortality_impact.adjusted_life_expectancy.toFixed(1)}
            </p>
          </div>

          {/* Reserve Impact */}
          <div className={`border rounded-lg p-3 ${climateImpact.climate_impact_delta.total < 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-xs font-medium ${climateImpact.climate_impact_delta.total < 0 ? 'text-green-600' : 'text-red-600'}`}>
              Reserve Impact
            </p>
            <p className={`text-xl font-bold ${climateImpact.climate_impact_delta.total < 0 ? 'text-green-800' : 'text-red-800'}`}>
              {formatCurrency(climateImpact.climate_impact_delta.total)}
            </p>
            <p className={`text-xs ${climateImpact.climate_impact_delta.total < 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatPercent(climateImpact.climate_impact_delta.total_pct_change)}
            </p>
          </div>

          {/* Portfolio Stats */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-600 font-medium">Portfolio Composition</p>
            <p className="text-xl font-bold text-blue-800">
              {climateImpact.portfolio_stats.n_policies} policies
            </p>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-purple-600 font-medium">{climateImpact.portfolio_stats.n_annuities} annuities</span>
              <span className="text-gray-400">•</span>
              <span className="text-teal-600 font-medium">{climateImpact.portfolio_stats.n_life_insurance} life ins</span>
            </div>
            <p className="text-xs text-blue-400 mt-1">
              Vol: {formatCurrency(climateImpact.portfolio_stats.total_annuity_volume + climateImpact.portfolio_stats.total_life_insurance_volume)}
            </p>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Survival Curves */}
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Survival Curves</h4>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={survivalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="age" label={{ value: 'Age', position: 'bottom', offset: -5 }} />
              <YAxis 
                label={{ value: 'Survivors (per 100k)', angle: -90, position: 'insideLeft' }} 
                domain={[0, 100000]}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  value.toLocaleString(), 
                  name
                ]}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="gap" 
                fill="#fecaca" 
                stroke="none" 
                name="Lives Lost"
              />
              <Line type="monotone" dataKey="baseline" stroke="#2563eb" strokeWidth={2} dot={false} name="Baseline" />
              <Line type="monotone" dataKey="adjusted" stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Climate-Adjusted" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Life Expectancy by Age */}
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Life Expectancy Loss by Age</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={lifeExpectancyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="age" label={{ value: 'Age', position: 'bottom', offset: -5 }} />
              <YAxis 
                label={{ value: 'Years Lost', angle: -90, position: 'insideLeft' }} 
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(2)} years`, 'Years Lost']}
              />
              <Bar dataKey="yearsLost" fill="#3b82f6" name="Years Lost" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stress Testing Chart */}
      {multiScenario && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-1">📈 Multi-Scenario Stress Test</h4>
          <div className="flex justify-between text-xs text-gray-500 mb-2 px-2">
            <span>← Reserve Change ($M)</span>
            <span>Life Exp. Change (yrs) →</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={multiScenario.scenarios} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="temperature_delta" 
                label={{ value: 'Temperature Change (°C)', position: 'bottom', offset: -5 }} 
              />
              <YAxis 
                yAxisId="left"
                tickFormatter={(v) => `${(v / 1e6).toFixed(1)}`}
                domain={['auto', 'auto']}
                width={45}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                domain={['auto', 0]}
                width={45}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'Life Exp. Change') return [`${value.toFixed(2)} yrs`, name];
                  return [formatCurrency(value), name];
                }}
              />
              <Legend />
              <ReferenceLine yAxisId="left" y={0} stroke="#666" strokeDasharray="3 3" />
              <Bar yAxisId="left" dataKey="delta_annuities" fill="#22c55e" name="Annuity Δ" />
              <Bar yAxisId="left" dataKey="delta_life_insurance" fill="#f97316" name="Life Ins. Δ" />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="life_expectancy_change" 
                stroke="#dc2626" 
                strokeWidth={3}
                dot={{ fill: '#dc2626', r: 5 }}
                name="Life Exp. Change"
              />
            </ComposedChart>
          </ResponsiveContainer>
          
          {/* Interpretation */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <div className="bg-green-50 p-2 rounded">
              <span className="font-semibold text-green-800">Annuities (Green):</span>
              <span className="text-green-700 ml-1">{multiScenario.interpretation.annuities}</span>
            </div>
            <div className="bg-orange-50 p-2 rounded">
              <span className="font-semibold text-orange-800">Life Ins. (Orange):</span>
              <span className="text-orange-700 ml-1">{multiScenario.interpretation.life_insurance}</span>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="font-semibold text-gray-800">Net Effect:</span>
              <span className="text-gray-700 ml-1">{multiScenario.interpretation.total}</span>
            </div>
          </div>
        </div>
      )}

      {/* Reserve Breakdown */}
      {climateImpact && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">💰 Reserve Breakdown</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Product</th>
                  <th className="text-right py-2 px-3">Baseline</th>
                  <th className="text-right py-2 px-3">Adjusted</th>
                  <th className="text-right py-2 px-3">Delta</th>
                  <th className="text-right py-2 px-3">Impact</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">Annuities</td>
                  <td className="text-right py-2 px-3">{formatCurrency(climateImpact.baseline_reserves.annuities)}</td>
                  <td className="text-right py-2 px-3">{formatCurrency(climateImpact.adjusted_reserves.annuities)}</td>
                  <td className={`text-right py-2 px-3 font-semibold ${climateImpact.climate_impact_delta.annuities < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(climateImpact.climate_impact_delta.annuities)}
                  </td>
                  <td className="text-right py-2 px-3 text-gray-500">
                    {climateImpact.climate_impact_delta.annuities < 0 ? '📉 Lower reserves' : '📈 Higher reserves'}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">Life Insurance</td>
                  <td className="text-right py-2 px-3">{formatCurrency(climateImpact.baseline_reserves.life_insurance)}</td>
                  <td className="text-right py-2 px-3">{formatCurrency(climateImpact.adjusted_reserves.life_insurance)}</td>
                  <td className={`text-right py-2 px-3 font-semibold ${climateImpact.climate_impact_delta.life_insurance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(climateImpact.climate_impact_delta.life_insurance)}
                  </td>
                  <td className="text-right py-2 px-3 text-gray-500">
                    {climateImpact.climate_impact_delta.life_insurance < 0 ? '📉 Lower reserves' : '📈 Higher reserves'}
                  </td>
                </tr>
                <tr className="bg-gray-100 font-semibold">
                  <td className="py-2 px-3">TOTAL</td>
                  <td className="text-right py-2 px-3">{formatCurrency(climateImpact.baseline_reserves.total)}</td>
                  <td className="text-right py-2 px-3">{formatCurrency(climateImpact.adjusted_reserves.total)}</td>
                  <td className={`text-right py-2 px-3 ${climateImpact.climate_impact_delta.total < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(climateImpact.climate_impact_delta.total)}
                  </td>
                  <td className={`text-right py-2 px-3 ${climateImpact.climate_impact_delta.total < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(climateImpact.climate_impact_delta.total_pct_change)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Methodology Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <strong>Methodology:</strong> This analysis uses Gompertz-Makeham mortality tables adjusted by 
        an Exposure-Response Function (ERF). Reserves are calculated using actuarial commutation functions 
        (Dx, Nx, Cx, Mx) with the selected discount rate. Annuity reserves decrease with higher mortality 
        (shorter payout period), while life insurance reserves increase (death benefit paid sooner).
      </div>
    </div>
  );
};

export default ActuarialTab;
