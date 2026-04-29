'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Map, { Source, Layer, MapRef } from 'react-map-gl/mapbox';
import type { MapMouseEvent } from 'mapbox-gl';
import { useAppStore } from '@/lib/store';
import { useRegions, useMetricSnapshot, useMetricRange, useCitiesWithERF, useMortalitySnapshot } from '@/hooks/useClimateData';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { MapLegend } from './MapLegend';
import type { ClimateMetric } from '@/lib/types';
import type { AgeGroup } from '@/lib/api';
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
    showCityBubbles,
    selectedRcp,
    selectedMortalityAgeGroup,
    setSelectedRegion,
    setMapView,
    setShowCityBubbles,
  } = useAppStore();

  const isMortalityMetric = selectedMetric === 'mortality_multiplier';

  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  // Fetch regions once (they don't change)
  const tolerance = isMobile ? 0.01 : 0.001;
  const { data: regionsData, isLoading: regionsLoading } = useRegions(tolerance);
  
  // Fetch metric data (changes with year/week/metric) — skip for mortality_multiplier
  const { data: metricData, isLoading: metricLoading } = useMetricSnapshot(
    selectedMetric as ClimateMetric,
    selectedYear,
    selectedWeek,
    !isMortalityMetric
  );

  // Fetch global range for the metric (for consistent color scale) — skip for mortality
  const { data: metricRange } = useMetricRange(selectedMetric as ClimateMetric, !isMortalityMetric);

  // Fetch mortality snapshot when mortality_multiplier metric is selected
  const { data: mortalitySnapshot, isLoading: mortalityLoading } = useMortalitySnapshot(
    selectedYear,
    selectedRcp,
    selectedMortalityAgeGroup as AgeGroup,
    isMortalityMetric
  );

  const isLoading = isMortalityMetric ? mortalityLoading : metricLoading;

  // Fetch cities with ERF data
  const { data: citiesData } = useCitiesWithERF();

  // Merge regions with metric values - memoized to prevent unnecessary re-renders
  const geoJsonWithValues = useMemo(() => {
    if (!regionsData) return null;

    if (isMortalityMetric) {
      if (!mortalitySnapshot) return null;
      // Mortality data is country-level: key is 2-char country code (NUTS-0)
      return {
        type: 'FeatureCollection' as const,
        features: regionsData.features.map((feature) => {
          const nutsId = feature.properties.NUTS_ID;
          // Only NUTS-0 (2-char) entries have data; sub-regions get null
          const value = nutsId.length === 2 ? (mortalitySnapshot[nutsId] ?? null) : null;
          return {
            ...feature,
            id: nutsId,
            properties: { ...feature.properties, value },
          };
        }),
      };
    }

    if (!metricData) return null;
    return {
      type: 'FeatureCollection' as const,
      features: regionsData.features.map((feature) => ({
        ...feature,
        id: feature.properties.NUTS_ID,
        properties: {
          ...feature.properties,
          value: metricData[feature.properties.NUTS_ID] || null,
        },
      })),
    };
  }, [regionsData, metricData, mortalitySnapshot, isMortalityMetric]);

  // Color scale bounds
  // Mortality uses a symmetric scale clamped at ±0.04 around baseline (1.0).
  // This covers ~95% of the data with full color variation; the rare outliers above
  // 1.04 naturally render as the deepest red via Mapbox's interpolation clamping,
  // so they stay visible without compressing the majority of countries into a
  // near-white band. Scale is fixed so colors are comparable across years/scenarios.
  const MORTALITY_MIN = 0.96;
  const MORTALITY_MAX = 1.04;
  const minValue = isMortalityMetric ? MORTALITY_MIN : (metricRange?.min_value ?? -20);
  const maxValue = isMortalityMetric ? MORTALITY_MAX : (metricRange?.max_value ?? 40);

  // Choropleth layer style with zoom-based filtering
  const dataLayer = {
    id: 'climate-data',
    type: 'fill' as const,
    paint: {
      'fill-color': isMortalityMetric
        ? ([
            'interpolate',
            ['linear'],
            ['get', 'value'],
            minValue, '#2563eb',  // blue = lower mortality
            1.0,       '#f9fafb', // white = baseline
            maxValue, '#dc2626',  // red = higher mortality
          ] as any)
        : ([
            'interpolate',
            ['linear'],
            ['get', 'value'],
            -20, '#0000ff',
            0, '#00ffff',
            20, '#ffff00',
            40, '#ff0000',
          ] as any),
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
    filter: isMortalityMetric
      // Mortality is country-level only — always show NUTS-0
      ? (['==', ['length', ['get', 'NUTS_ID']], 2] as any)
      : ([
          'any',
          // Show NUTS 0 (countries - 2 chars) at zoom < 5.5
          ['all', ['<', ['zoom'], 5.5], ['==', ['length', ['get', 'NUTS_ID']], 2]],
          // Show NUTS 3 (regions - 5 chars) at zoom >= 4.5
          ['all', ['>=', ['zoom'], 4.5], ['==', ['length', ['get', 'NUTS_ID']], 5]],
        ] as any),
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
    filter: isMortalityMetric
      ? (['==', ['length', ['get', 'NUTS_ID']], 2] as any)
      : ([
          'any',
          ['all', ['<', ['zoom'], 5.5], ['==', ['length', ['get', 'NUTS_ID']], 2]],
          ['all', ['>=', ['zoom'], 4.5], ['==', ['length', ['get', 'NUTS_ID']], 5]],
        ] as any),
  };

  // City bubble layer for cities with ERF data
  const cityBubbleLayer = {
    id: 'city-bubbles',
    type: 'circle' as const,
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        4, 4,
        6, 6,
        8, 8,
        10, 10,
      ] as any,
      'circle-color': '#e74c3c',  // Red color for visibility
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
      'circle-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        1,
        0.8,
      ] as any,
    },
  };

  // Handle region click
  const handleClick = (event: MapMouseEvent & { features?: GeoJSON.Feature[] }) => {
    const feature = event.features?.[0];
    if (feature && feature.properties) {
      // Check if clicked on a city bubble
      if (feature.layer?.id === 'city-bubbles') {
        const urauCode = feature.properties.urau_code;
        console.log('Clicked city:', urauCode, feature.properties.name);
        // For now, just log - in the future this could open a city detail modal
        return;
      }
      // Otherwise, handle region click
      const nutsId = feature.properties.NUTS_ID;
      if (nutsId) {
        setSelectedRegion(nutsId);
      }
    }
  };

  // Expose map instance to window for console debugging (screencast purposes)
  const handleMapLoad = () => {
    if (mapRef.current) {
      // @ts-expect-error - Expose for console access
      window.myMap = mapRef.current.getMap();
      // @ts-expect-error - Expose for screencast scripts
      window.selectRegion = setSelectedRegion;
      // @ts-expect-error - Expose for screencast scripts
      window.setShowCityBubbles = setShowCityBubbles;
      console.log('🗺️  Map exposed as window.myMap - Use for screencast animations!');
    }
  };

  // Handle hover
  const handleMouseMove = (event: MapMouseEvent & { features?: GeoJSON.Feature[] }) => {
    const feature = event.features?.[0];
    if (feature && feature.properties) {
      // Check if hovering over a city bubble
      if (feature.layer?.id === 'city-bubbles') {
        setHoveredCity(feature.properties.urau_code);
        setHoveredRegion(null);
        // Track mouse position for tooltip
        setTooltipPosition({ x: event.point.x, y: event.point.y });
      } else {
        setHoveredRegion(feature.properties.NUTS_ID);
        setHoveredCity(null);
        setTooltipPosition(null);
      }
      if (mapRef.current) {
        mapRef.current.getMap().getCanvas().style.cursor = 'pointer';
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredRegion(null);
    setHoveredCity(null);
    setTooltipPosition(null);
    if (mapRef.current) {
      mapRef.current.getMap().getCanvas().style.cursor = '';
    }
  };

  // Update feature state for hover and selection (regions)
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
        interactiveLayerIds={['climate-data', 'city-bubbles']}
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
        
        {/* City bubbles for cities with ERF data */}
        {showCityBubbles && citiesData && (
          <Source
            id="city-bubbles"
            type="geojson"
            data={citiesData}
            promoteId="urau_code"
          >
            <Layer {...cityBubbleLayer} />
          </Source>
        )}
      </Map>

      {/* City tooltip - positioned near cursor */}
      {showCityBubbles && hoveredCity && citiesData && tooltipPosition && (
        <div 
          className="absolute bg-white px-3 py-2 rounded shadow-lg z-10 pointer-events-none"
          style={{
            left: tooltipPosition.x + 15,
            top: tooltipPosition.y - 10,
            transform: 'translateY(-100%)',
          }}
        >
          <p className="text-sm font-semibold text-gray-800">
            {citiesData.features.find(f => f.properties.urau_code === hoveredCity)?.properties.name || hoveredCity}
          </p>
          <p className="text-xs text-gray-500">ERF data available</p>
        </div>
      )}

      {/* Legend */}
      {(metricData || mortalitySnapshot) && (
        <MapLegend
          minValue={minValue}
          maxValue={maxValue}
          metric={selectedMetric}
          diverging={isMortalityMetric}
        />
      )}

      {/* Loading indicator */}
      {(regionsLoading || isLoading) && (
        <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded shadow">
          Loading...
        </div>
      )}
    </div>
  );
}
