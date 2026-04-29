'use client';

import { useAppStore } from '@/lib/store';
import { CLIMATE_METRICS, DATE_RANGE, type ClimateMetric } from '@/lib/types';
import { getMetricLabel } from '@/lib/metricConfig';
import { Play, Pause } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useMetricSnapshot } from '@/hooks/useClimateData';
import type { AgeGroup } from '@/lib/api';

const RCP_SCENARIOS = ['RCP 2.6', 'RCP 4.5', 'RCP 7.0'];
const AGE_GROUPS: AgeGroup[] = ['20-44', '45-64', '65-74', '75-84', '85+'];

export default function MapControls() {
  const {
    selectedMetric,
    selectedYear,
    selectedWeek,
    showCityBubbles,
    selectedRcp,
    selectedMortalityAgeGroup,
    setSelectedMetric,
    setSelectedYear,
    setSelectedWeek,
    setShowCityBubbles,
    setSelectedRcp,
    setSelectedMortalityAgeGroup,
  } = useAppStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  const isMortalityMetric = selectedMetric === 'mortality_multiplier';

  // Check if current data is loading — skip for mortality (it has its own snapshot hook)
  const { isFetching } = useMetricSnapshot(
    selectedMetric as ClimateMetric,
    selectedYear,
    selectedWeek,
    !isMortalityMetric
  );

  // Animation logic - wait for data to load before advancing
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // Don't start animation if data is still loading
    if (isFetching) return;

    const advanceTime = () => {
      if (isFetching) return;

      if (isMortalityMetric) {
        // Mortality data is annual — advance year within mortality bounds
        setSelectedYear((year: number) => {
          if (year >= DATE_RANGE.mortalityMaxYear) {
            setIsPlaying(false);
            return DATE_RANGE.mortalityMinYear;
          }
          return year + 1;
        });
      } else {
        setSelectedWeek((week: number) => {
          if (week >= DATE_RANGE.maxWeek) {
            setSelectedYear((year: number) => {
              if (year >= DATE_RANGE.maxYear) {
                setIsPlaying(false);
                return DATE_RANGE.minYear;
              }
              return year + 1;
            });
            return DATE_RANGE.minWeek;
          }
          return week + 1;
        });
      }
    };

    animationRef.current = setInterval(advanceTime, 800);

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isPlaying, isFetching, isMortalityMetric, setSelectedWeek, setSelectedYear]);

  // Stop animation when unmounting
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 space-y-4 max-w-xs">
      {/* Metric Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Climate Metric
        </label>
        <select
          value={selectedMetric}
          onChange={(e) => {
            const newMetric = e.target.value;
            setSelectedMetric(newMetric);
            // Clamp year to mortality bounds when switching to/from mortality_multiplier
            if (newMetric === 'mortality_multiplier') {
              setSelectedYear((y: number) =>
                Math.min(DATE_RANGE.mortalityMaxYear, Math.max(DATE_RANGE.mortalityMinYear, y))
              );
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CLIMATE_METRICS.map((metric) => (
            <option key={metric} value={metric}>
              {getMetricLabel(metric)}
            </option>
          ))}
        </select>
      </div>

      {/* Mortality-specific controls */}
      {isMortalityMetric && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RCP Scenario
            </label>
            <select
              value={selectedRcp}
              onChange={(e) => setSelectedRcp(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {RCP_SCENARIOS.map((rcp) => (
                <option key={rcp} value={rcp}>{rcp}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age Group
            </label>
            <div className="flex gap-1 flex-wrap">
              {AGE_GROUPS.map((ag) => (
                <button
                  key={ag}
                  onClick={() => setSelectedMortalityAgeGroup(ag)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    selectedMortalityAgeGroup === ag
                      ? 'bg-[#6DC201] text-white border-[#6DC201]'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-[#6DC201]'
                  }`}
                >
                  {ag}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Year Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Year: {selectedYear}
        </label>
        <input
          type="range"
          min={isMortalityMetric ? DATE_RANGE.mortalityMinYear : DATE_RANGE.minYear}
          max={isMortalityMetric ? DATE_RANGE.mortalityMaxYear : DATE_RANGE.maxYear}
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{isMortalityMetric ? DATE_RANGE.mortalityMinYear : DATE_RANGE.minYear}</span>
          <span>{isMortalityMetric ? DATE_RANGE.mortalityMaxYear : DATE_RANGE.maxYear}</span>
        </div>
      </div>

      {/* Week Selection — hidden for annual metrics like mortality_multiplier */}
      {!isMortalityMetric && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Week: {selectedWeek}
          </label>
          <input
            type="range"
            min={DATE_RANGE.minWeek}
            max={DATE_RANGE.maxWeek}
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{DATE_RANGE.minWeek}</span>
            <span>{DATE_RANGE.maxWeek}</span>
          </div>
        </div>
      )}

      {/* Animation Controls */}
      <div>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#6DC201] text-white rounded-md hover:bg-[#5ba801] transition-colors"
        >
          {isPlaying ? (
            <>
              <Pause size={16} />
              Pause
            </>
          ) : (
            <>
              <Play size={16} />
              Play Animation
            </>
          )}
        </button>
      </div>

      {/* Layer Toggles */}
      <div className="border-t pt-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Map Layers
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showCityBubbles}
            onChange={(e) => setShowCityBubbles(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">Show ERF Cities</span>
        </label>
      </div>
    </div>
  );
}
