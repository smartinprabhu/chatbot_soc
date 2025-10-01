import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import type { WeeklyData } from '@/lib/types';

interface ForecastComparisonChartProps {
  data: WeeklyData[];
  title?: string;
  target: 'Value' | 'Orders';
}

export default function ForecastComparisonChart({ 
  data, 
  title = "Actual vs Forecast Comparison",
  target 
}: ForecastComparisonChartProps) {
  // Separate historical and forecast data
  const historicalData = data.filter(d => !d.Forecast);
  const forecastData = data.filter(d => d.Forecast);
  
  // Calculate accuracy metrics
  const actualVsForecast = data.filter(d => d.Forecast && d[target]);
  const mape = actualVsForecast.length > 0 
    ? actualVsForecast.reduce((sum, d) => {
        const actual = d[target];
        const forecast = d.Forecast!;
        return sum + Math.abs((actual - forecast) / actual);
      }, 0) / actualVsForecast.length * 100
    : 0;

  const trend = historicalData.length > 1 
    ? historicalData[historicalData.length - 1][target] > historicalData[0][target] ? 'up' : 'down'
    : 'stable';

  // Generate simple ASCII-style chart
  const generateMiniChart = (values: number[]) => {
    if (values.length === 0) return '';
    
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min;
    
    return values.map(val => {
      const normalized = range > 0 ? (val - min) / range : 0.5;
      const height = Math.round(normalized * 8);
      return '▁▂▃▄▅▆▇█'[height] || '▁';
    }).join('');
  };

  const historicalValues = historicalData.map(d => d[target]);
  const forecastValues = forecastData.map(d => d.Forecast!);

  return (
    <Card className="border-l-4 border-l-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-500" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              MAPE: {mape.toFixed(1)}%
            </Badge>
            {trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Historical Data */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-600">Historical {target}</span>
            <span className="text-xs text-muted-foreground">
              {historicalData.length} data points
            </span>
          </div>
          <div className="bg-background/50 rounded p-3 font-mono text-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-600">Actual:</span>
              <span className="text-lg">{generateMiniChart(historicalValues)}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Range: {Math.min(...historicalValues).toFixed(1)} - {Math.max(...historicalValues).toFixed(1)}
            </div>
          </div>
        </div>

        {/* Forecast Data */}
        {forecastData.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-600">Forecast {target}</span>
              <span className="text-xs text-muted-foreground">
                {forecastData.length} predictions
              </span>
            </div>
            <div className="bg-background/50 rounded p-3 font-mono text-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-600">Forecast:</span>
                <span className="text-lg">{generateMiniChart(forecastValues)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Range: {Math.min(...forecastValues).toFixed(1)} - {Math.max(...forecastValues).toFixed(1)}
              </div>
            </div>
          </div>
        )}

        {/* Comparison Table */}
        {actualVsForecast.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Recent Comparisons</span>
            <div className="bg-background/50 rounded p-3">
              <div className="space-y-1 text-xs font-mono">
                <div className="grid grid-cols-4 gap-2 font-semibold text-muted-foreground">
                  <span>Date</span>
                  <span>Actual</span>
                  <span>Forecast</span>
                  <span>Error</span>
                </div>
                {actualVsForecast.slice(-5).map((d, i) => {
                  const actual = d[target];
                  const forecast = d.Forecast!;
                  const error = ((actual - forecast) / actual * 100);
                  
                  return (
                    <div key={i} className="grid grid-cols-4 gap-2">
                      <span>{new Date(d.Date).toLocaleDateString()}</span>
                      <span>{actual.toFixed(1)}</span>
                      <span>{forecast.toFixed(1)}</span>
                      <span className={error > 0 ? 'text-green-600' : 'text-red-600'}>
                        {error > 0 ? '+' : ''}{error.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Confidence Bounds */}
        {forecastData.some(d => d.ForecastLower && d.ForecastUpper) && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Confidence Bounds</span>
            <div className="bg-background/50 rounded p-3 text-xs">
              <div className="space-y-1">
                {forecastData.filter(d => d.ForecastLower && d.ForecastUpper).slice(-3).map((d, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{new Date(d.Date).toLocaleDateString()}</span>
                    <span className="font-mono">
                      [{d.ForecastLower!.toFixed(1)}, {d.ForecastUpper!.toFixed(1)}]
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}