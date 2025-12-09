'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Map, { Source, Layer, MapRef } from 'react-map-gl/mapbox';
import type { MapMouseEvent } from 'mapbox-gl';
import { useAppStore } from '@/lib/store';
import { useRegions, useMetricSnapshot, useMetricRange } from '@/hooks/useClimateData';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { MapLegend } from './MapLegend';
import type { ClimateMetric } from '@/lib/types';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function ClimateMap() {
  const mapRef = useRef<MapRef>(null);
  const isMobile = useIsMobile();
  
  const {
    selectedMetric,
    selectedYear,
    selectedWeek,
    selectedRegion,
    zoom,
    center,
    setSelectedRegion,
    setMapView,
  } = useAppStore();

  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // Fetch regions once (they don't change)
  const tolerance = isMobile ? 0.01 : 0.001;
  const { data: regionsData, isLoading: regionsLoading } = useRegions(tolerance);
  
  // Fetch metric data (changes with year/week/metric)
  const { data: metricData, isLoading: metricLoading } = useMetricSnapshot(
    selectedMetric as ClimateMetric,
    selectedYear,
    selectedWeek
  );

  // Fetch global range for the metric (for consistent color scale)
  const { data: metricRange } = useMetricRange(selectedMetric as ClimateMetric);

  // Merge regions with metric values - memoized to prevent unnecessary re-renders
  const geoJsonWithValues = useMemo(() => {
    if (!regionsData || !metricData) return null;
    
    return {
      type: 'FeatureCollection' as const,
      features: regionsData.features.map((feature) => ({
        ...feature,
        id: feature.properties.NUTS_ID,
        properties: {
          ...feature.properties,
          value: metricData[feature.properties.NUTS_ID] || null
        }
      }))
    };
  }, [regionsData, metricData]);

  // Use global min/max for consistent scale, or fallback to defaults
  const minValue = metricRange?.min_value ?? -20;
  const maxValue = metricRange?.max_value ?? 40;

  // Choropleth layer style with zoom-based filtering
  const dataLayer = {
    id: 'climate-data',
    type: 'fill' as const,
    paint: {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'value'],
        -20, '#0000ff',
        0, '#00ffff',
        20, '#ffff00',
        40, '#ff0000',
      ] as any,
      'fill-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        // At zoom 4.5: NUTS 0 fully visible, NUTS 3 invisible
        4.5, [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          ['case', ['==', ['length', ['get', 'NUTS_ID']], 2], 0.8, 0],
          ['case', ['==', ['length', ['get', 'NUTS_ID']], 2], 0.6, 0],
        ],
        // At zoom 5: Both visible at same opacity
        5, [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          0.8,
          0.6,
        ],
        // At zoom 5.5: NUTS 3 fully visible, NUTS 0 invisible
        5.5, [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          ['case', ['==', ['length', ['get', 'NUTS_ID']], 5], 0.8, 0],
          ['case', ['==', ['length', ['get', 'NUTS_ID']], 5], 0.6, 0],
        ],
      ] as any,
    },
    filter: [
      'any',
      // Show NUTS 0 (countries - 2 chars) at zoom < 5.5 (extended range to reduce artifacts)
      ['all', ['<', ['zoom'], 5.5], ['==', ['length', ['get', 'NUTS_ID']], 2]],
      // Show NUTS 3 (regions - 5 chars) at zoom >= 4.5 (start earlier for smoother transition)
      ['all', ['>=', ['zoom'], 4.5], ['==', ['length', ['get', 'NUTS_ID']], 5]],
    ] as any,
  };

  const outlineLayer = {
    id: 'climate-outline',
    type: 'line' as const,
    paint: {
      'line-color': '#ffffff',
      'line-width': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        3,
        1,
      ] as any,
    },
    filter: [
      'any',
      // Show NUTS 0 (countries - 2 chars) at zoom < 5.5 (extended range to reduce artifacts)
      ['all', ['<', ['zoom'], 5.5], ['==', ['length', ['get', 'NUTS_ID']], 2]],
      // Show NUTS 3 (regions - 5 chars) at zoom >= 4.5 (start earlier for smoother transition)
      ['all', ['>=', ['zoom'], 4.5], ['==', ['length', ['get', 'NUTS_ID']], 5]],
    ] as any,
  };

  // Handle region click
  const handleClick = (event: MapMouseEvent & { features?: GeoJSON.Feature[] }) => {
    const feature = event.features?.[0];
    if (feature && feature.properties) {
      const nutsId = feature.properties.NUTS_ID;
      setSelectedRegion(nutsId);
    }
  };

  // Expose map instance to window for console debugging (screencast purposes)
  const handleMapLoad = () => {
    if (mapRef.current) {
      // @ts-ignore - Expose for console access
      window.myMap = mapRef.current.getMap();
      console.log('🗺️  Map exposed as window.myMap - Use for screencast animations!');
    }
  };

  // Handle hover
  const handleMouseMove = (event: MapMouseEvent & { features?: GeoJSON.Feature[] }) => {
    const feature = event.features?.[0];
    if (feature && feature.properties) {
      setHoveredRegion(feature.properties.NUTS_ID);
      if (mapRef.current) {
        mapRef.current.getMap().getCanvas().style.cursor = 'pointer';
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredRegion(null);
    if (mapRef.current) {
      mapRef.current.getMap().getCanvas().style.cursor = '';
    }
  };

  // Update feature state for hover and selection
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !geoJsonWithValues) return;

    // Clear previous states
    geoJsonWithValues.features.forEach((feature: { properties: { NUTS_ID: string } }) => {
      const nutsId = feature.properties.NUTS_ID;
      map.setFeatureState(
        { source: 'climate-data', id: nutsId },
        { hover: nutsId === hoveredRegion, selected: nutsId === selectedRegion }
      );
    });
  }, [hoveredRegion, selectedRegion, geoJsonWithValues]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p className="text-red-500">Mapbox token not configured</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: center[0],
          latitude: center[1],
          zoom: zoom,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        interactiveLayerIds={['climate-data']}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMove={(evt: { viewState: { zoom: number; longitude: number; latitude: number } }) => 
          setMapView(evt.viewState.zoom, [evt.viewState.longitude, evt.viewState.latitude])
        }
        onLoad={handleMapLoad}
        attributionControl={false}
      >
        {geoJsonWithValues && (
          <Source 
            id="climate-data" 
            type="geojson" 
            data={geoJsonWithValues}
            promoteId="NUTS_ID"
          >
            <Layer {...dataLayer} />
            <Layer {...outlineLayer} />
          </Source>
        )}
      </Map>

      {/* Legend */}
      {metricData && (
        <MapLegend
          minValue={minValue}
          maxValue={maxValue}
          metric={selectedMetric}
        />
      )}

      {/* Loading indicator */}
      {(regionsLoading || metricLoading) && (
        <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded shadow">
          Loading...
        </div>
      )}
    </div>
  );
}
