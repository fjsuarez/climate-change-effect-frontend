'use client';

import { useAppStore } from '@/lib/store';
import { useTimeSeries } from '@/hooks/useClimateData';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TimeSeriesChart from '@/components/Charts/TimeSeriesChart';
import ScatterPlot from '@/components/Charts/ScatterPlot';
import { CLIMATE_METRICS, ClimateMetric } from '@/lib/types';
import { useState } from 'react';

export default function RegionDetailModal() {
  const { selectedRegion, selectedMetric, resetSelection } = useAppStore();
  const isMobile = useIsMobile();
  
  const [secondMetric, setSecondMetric] = useState<string | undefined>(undefined);

  const { data, isLoading, error } = useTimeSeries(
    selectedRegion,
    selectedMetric as ClimateMetric,
    secondMetric as ClimateMetric | undefined
  );

  if (!selectedRegion) return null;

  const handleClose = () => {
    resetSelection();
    setSecondMetric(undefined);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`fixed z-50 bg-white shadow-2xl ${
          isMobile
            ? 'inset-x-0 bottom-0 rounded-t-2xl max-h-[90vh]'
            : 'right-0 top-0 bottom-0 w-full max-w-2xl'
        } overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">
              {data?.nuts_id || selectedRegion}
            </h2>
            <p className="text-sm text-gray-500">Climate Data Analysis</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Loading data...</p>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <p className="text-red-500">Error loading data</p>
            </div>
          )}

          {data && (
            <Tabs defaultValue="timeseries" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="timeseries">Time Series</TabsTrigger>
                <TabsTrigger value="correlation">Correlation</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>

              {/* Time Series Tab */}
              <TabsContent value="timeseries" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compare with (optional)
                  </label>
                  <select
                    value={secondMetric || ''}
                    onChange={(e) => setSecondMetric(e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {CLIMATE_METRICS.filter((m) => m !== selectedMetric).map(
                      (metric) => (
                        <option key={metric} value={metric}>
                          {metric}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <TimeSeriesChart data={data} height={isMobile ? 250 : 400} />
                </div>
              </TabsContent>

              {/* Correlation Tab */}
              <TabsContent value="correlation" className="space-y-4">
                {!secondMetric ? (
                  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">
                      Select a second metric in the Time Series tab to view correlation
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <ScatterPlot data={data} height={isMobile ? 250 : 400} />
                  </div>
                )}
              </TabsContent>

              {/* Summary Tab */}
              <TabsContent value="summary" className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Region ID</p>
                    <p className="font-semibold">{data.nuts_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Primary Metric</p>
                    <p className="font-semibold">{data.metric1}</p>
                  </div>
                  {data.metric2 && (
                    <div>
                      <p className="text-sm text-gray-600">Secondary Metric</p>
                      <p className="font-semibold">{data.metric2}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Data Points</p>
                    <p className="font-semibold">{data.data.length}</p>
                  </div>
                  {data.data.length > 0 && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Average {data.metric1}</p>
                        <p className="font-semibold">
                          {(
                            data.data.reduce((sum, d) => sum + d.metric1_value, 0) /
                            data.data.length
                          ).toFixed(2)}
                        </p>
                      </div>
                      {data.metric2 && data.data[0].metric2_value !== undefined && (
                        <div>
                          <p className="text-sm text-gray-600">Average {data.metric2}</p>
                          <p className="font-semibold">
                            {(
                              data.data.reduce(
                                (sum, d) => sum + (d.metric2_value || 0),
                                0
                              ) / data.data.length
                            ).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </>
  );
}
