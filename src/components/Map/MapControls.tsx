'use client';

import { useAppStore } from '@/lib/store';
import { CLIMATE_METRICS, DATE_RANGE } from '@/lib/types';
import { Play, Pause } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useMetricSnapshot } from '@/hooks/useClimateData';

export default function MapControls() {
  const {
    selectedMetric,
    selectedYear,
    selectedWeek,
    setSelectedMetric,
    setSelectedYear,
    setSelectedWeek,
  } = useAppStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Check if current data is loading
  const { isFetching } = useMetricSnapshot(
    selectedMetric as any,
    selectedYear,
    selectedWeek
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
      // Don't advance if still fetching
      if (isFetching) return;

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
    };

    // Set interval to check and advance
    animationRef.current = setInterval(advanceTime, 800); // Slower to allow data loading

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isPlaying, isFetching, setSelectedWeek, setSelectedYear]);

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
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CLIMATE_METRICS.map((metric) => (
            <option key={metric} value={metric}>
              {metric}
            </option>
          ))}
        </select>
      </div>

      {/* Year Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Year: {selectedYear}
        </label>
        <input
          type="range"
          min={DATE_RANGE.minYear}
          max={DATE_RANGE.maxYear}
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{DATE_RANGE.minYear}</span>
          <span>{DATE_RANGE.maxYear}</span>
        </div>
      </div>

      {/* Week Selection */}
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

      {/* Animation Controls */}
      <div>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
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
    </div>
  );
}
