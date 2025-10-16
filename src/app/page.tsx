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
      </div>
    </main>
  );
}
