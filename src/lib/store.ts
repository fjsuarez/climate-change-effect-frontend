// Zustand store for global state management

import { create } from 'zustand';
import type { MapState } from './types';

interface AppStore extends MapState {
  // Actions
  setSelectedRegion: (nutsId: string | null) => void;
  setSelectedMetric: (metric: string) => void;
  setSelectedYear: (year: number | ((prev: number) => number)) => void;
  setSelectedWeek: (week: number | ((prev: number) => number)) => void;
  setMapView: (zoom: number, center: [number, number]) => void;
  resetSelection: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Initial state
  selectedRegion: null,
  selectedMetric: 'temp_era5_q50',
  selectedYear: 2010,
  selectedWeek: 26,
  zoom: 4,
  center: [13.0, 47.5], // Center on Austria/Europe

  // Actions
  setSelectedRegion: (nutsId) => set({ selectedRegion: nutsId }),
  setSelectedMetric: (metric) => set({ selectedMetric: metric }),
  setSelectedYear: (year) => set((state) => ({
    selectedYear: typeof year === 'function' ? year(state.selectedYear) : year
  })),
  setSelectedWeek: (week) => set((state) => ({
    selectedWeek: typeof week === 'function' ? week(state.selectedWeek) : week
  })),
  setMapView: (zoom, center) => set({ zoom, center }),
  resetSelection: () => set({ selectedRegion: null }),
}));
