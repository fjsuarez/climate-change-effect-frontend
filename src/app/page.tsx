'use client';

import dynamic from 'next/dynamic';
import MapControls from '@/components/Map/MapControls';
import RegionDetailModal from '@/components/Modal/RegionDetailModal';

// Dynamically import ClimateMap with no SSR to avoid hydration errors
const ClimateMap = dynamic(() => import('@/components/Map/ClimateMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <div className="relative w-full h-full">
        <ClimateMap />
        <MapControls />
        <RegionDetailModal />
        
        {/* Navigation link to coefficients page */}
        <div className="absolute top-4 right-4 z-10">
          <a
            href="/coefficients"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg"
          >
            View B-Spline Coefficients →
          </a>
        </div>
      </div>
    </main>
  );
}
