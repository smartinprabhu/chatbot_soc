"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useApp } from "./app-provider";
import BuLobSelector from "./bu-lob-selector";
import EnhancedDataVisualizer from "./enhanced-data-visualizer";
import { statisticalAnalyzer, insightsGenerator, type DataPoint } from "@/lib/statistical-analysis";
import BIDashboard from './bi-dashboard';
import { dynamicInsightsAgent } from "@/lib/dynamic-insights-agent";
import ForecastComparisonChart from './forecast-comparison-chart';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  BarChart3, PieChart, LineChart, Activity, Target,
  Zap, Brain, Eye, Download, RefreshCw, Filter, Calendar
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { DateRange, DynamicInsight } from "@/lib/types";

interface EnhancedMetrics {
  value: number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

interface InsightCard {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success' | 'error';
  actionable: boolean;
  recommendation?: string;
}

export default function EnhancedDataPanel({ className }: { className?: string }) {
  const { state, dispatch } = useApp();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyticsResults, setAnalyticsResults] = useState<any>(null);
  const [insightCards, setInsightCards] = useState<InsightCard[]>([]);
  const [dynamicInsights, setDynamicInsights] = useState<DynamicInsight[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>(state.dateRange);

  // Enhanced data processing with date filtering
  const filteredData = useMemo(() => {
    if (!state.selectedLob?.mockData) return null;
    
    let data = state.selectedLob.mockData;
    
    // Apply date range filter
    if (state.dateRange) {
      data = data.filter(item => {
        const itemDate = new Date(item.Date);
        return itemDate >= state.dateRange!.start && itemDate <= state.dateRange!.end;
      });
    }
    
    return data;
  }, [state.selectedLob?.mockData, state.dateRange]);

  const enhancedMetrics = useMemo(() => {
    if (!filteredData || !state.analyzedData.hasEDA) return null;

    const data = filteredData;
    const currentValue = data[data.length - 1]?.Value || 0;
    const previousValue = data[data.length - 2]?.Value || 0;
    const change = ((currentValue - previousValue) / previousValue) * 100;

    const totalValue = data.reduce((sum, item) => sum + item.Value, 0);
    const totalOrders = data.reduce((sum, item) => sum + item.Orders, 0);
    const avgValue = totalValue / data.length;
    const avgOrders = totalOrders / data.length;

    // Calculate trend using linear regression
    const dataPoints: DataPoint[] = data.map(item => ({
      date: new Date(item.Date),
      value: item.Value,
      orders: item.Orders
    }));

    const trendAnalysis = statisticalAnalyzer.analyzeTrend(dataPoints);

    return {
      totalValue: {
        value: totalValue,
        change: change,
        changeType: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral' as const,
        confidence: trendAnalysis.confidence,
        trend: trendAnalysis.direction === 'increasing' ? 'up' : trendAnalysis.direction === 'decreasing' ? 'down' : 'stable' as const
      },
      avgValue: {
        value: avgValue,
        change: change * 0.8, // Simplified
        changeType: change > 0 ? 'positive' : 'negative' as const,
        confidence: trendAnalysis.confidence * 0.9,
        trend: trendAnalysis.direction === 'increasing' ? 'up' : 'down' as const
      },
      totalOrders: {
        value: totalOrders,
        change: change * 0.6, // Simplified correlation
        changeType: change > 0 ? 'positive' : 'negative' as const,
        confidence: trendAnalysis.confidence * 0.8,
        trend: trendAnalysis.direction === 'increasing' ? 'up' : 'down' as const
      },
      efficiency: {
        value: avgValue / (avgOrders || 1), // Value per order
        change: change * 0.4,
        changeType: change > 0 ? 'positive' : 'negative' as const,
        confidence: trendAnalysis.confidence * 0.7,
        trend: 'stable' as const
      }
    };
  }, [state.selectedLob?.mockData]);

  // Generate real AI-driven insights based on actual session data
  const generateRealInsights = async () => {
    try {
      const sessionData = {
        businessUnits: state.businessUnits,
        messages: state.messages,
        selectedBuId: state.selectedBu?.id || null,
        selectedLobId: state.selectedLob?.id || null,
        hasAnalyzedData: state.analyzedData.hasEDA || state.analyzedData.hasInsights,
        hasForecasting: state.analyzedData.hasForecasting
      };

      const insights = await dynamicInsightsAgent.generateSessionInsights(sessionData);
      setDynamicInsights(insights);
    } catch (error) {
      console.error('Failed to generate real insights:', error);
      setDynamicInsights([]);
    }
  };

  // Advanced analytics processing
  const performAdvancedAnalytics = async () => {
    if (!state.selectedLob?.mockData) return;

    setIsAnalyzing(true);

    try {
      const dataPoints: DataPoint[] = state.selectedLob.mockData.map(item => ({
        date: new Date(item.Date),
        value: item.Value,
        orders: item.Orders
      }));

      // Comprehensive analysis
      const values = dataPoints.map(d => d.value);
      const statisticalSummary = statisticalAnalyzer.calculateStatisticalSummary(values);
      const trendAnalysis = statisticalAnalyzer.analyzeTrend(dataPoints);
      const seasonalityAnalysis = statisticalAnalyzer.analyzeSeasonality(dataPoints);
      const qualityReport = insightsGenerator.generateDataQualityReport(dataPoints);

      // Only generate insights based on what has been analyzed in chat
      const businessInsights = state.analyzedData.hasForecasting
        ? insightsGenerator.generateForecastInsights(dataPoints, {})
        : null;

      const results = {
        statistical: statisticalSummary,
        trend: trendAnalysis,
        seasonality: seasonalityAnalysis,
        quality: qualityReport,
        business: businessInsights || undefined
      };

      setAnalyticsResults(results);

      // Generate insight cards
      const cards: InsightCard[] = [];

      // Data quality insights
      if (qualityReport.score < 80) {
        cards.push({
          id: 'quality-warning',
          title: 'Data Quality Alert',
          description: `Data quality score is ${qualityReport.score}/100. ${qualityReport.issues.length} issues detected.`,
          severity: 'warning',
          actionable: true,
          recommendation: qualityReport.recommendations[0]
        });
      } else {
        cards.push({
          id: 'quality-good',
          title: 'High Data Quality',
          description: `Excellent data quality with a score of ${qualityReport.score}/100.`,
          severity: 'success',
          actionable: false
        });
      }

      // Trend insights
      if (trendAnalysis.confidence > 0.7) {
        cards.push({
          id: 'trend-insight',
          title: `${trendAnalysis.direction === 'increasing' ? 'Growth' : 'Decline'} Trend Detected`,
          description: `Strong ${trendAnalysis.direction} trend with ${(trendAnalysis.confidence * 100).toFixed(0)}% confidence.`,
          severity: trendAnalysis.direction === 'increasing' ? 'success' : 'warning',
          actionable: true,
          recommendation: trendAnalysis.direction === 'increasing' ?
            'Consider scaling operations to meet growing demand' :
            'Investigate causes and develop intervention strategies'
        });
      }

      // Seasonality insights
      if (seasonalityAnalysis.hasSeasonality) {
        cards.push({
          id: 'seasonality-insight',
          title: 'Seasonal Pattern Identified',
          description: `Strong seasonal pattern detected with ${seasonalityAnalysis.dominantPeriods[0]?.period}-period cycle.`,
          severity: 'info',
          actionable: true,
          recommendation: 'Leverage seasonal patterns for inventory and marketing planning'
        });
      }

      // Business insights (only if requested)
      if (businessInsights) {
        if (businessInsights.opportunities.length > 0) {
          cards.push({
            id: 'business-opportunity',
            title: 'Business Opportunity',
            description: businessInsights.opportunities[0],
            severity: 'success',
            actionable: true,
            recommendation: businessInsights.actionableRecommendations[0]
          });
        }

        if (businessInsights.riskFactors.length > 0) {
          cards.push({
            id: 'business-risk',
            title: 'Risk Factor Identified',
            description: businessInsights.riskFactors[0],
            severity: 'warning',
            actionable: true,
            recommendation: businessInsights.actionableRecommendations[1] || 'Monitor closely and develop mitigation strategies'
          });
        }
      }

      setInsightCards(cards);

    } catch (error) {
      console.error('Advanced analytics error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-refresh real insights based on actual session changes
  useEffect(() => {
    // Always generate real insights based on actual session data
    generateRealInsights();
    
    if (state.selectedLob?.hasData && (state.analyzedData.hasEDA || state.analyzedData.hasInsights)) {
      performAdvancedAnalytics();
    }
  }, [state.selectedLob, state.selectedBu, state.businessUnits, state.analyzedData]);

  // Cleanup interval
  useEffect(() => {
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [refreshInterval]);

  const MetricCard = ({ title, metric, icon: Icon }: {
    title: string;
    metric: EnhancedMetrics;
    icon: React.ComponentType<any>
  }) => (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof metric.value === 'number' && metric.value > 1000
            ? metric.value.toLocaleString()
            : metric.value.toFixed(2)
          }
        </div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <div className={cn(
            "flex items-center space-x-1",
            metric.changeType === 'positive' && "text-green-600",
            metric.changeType === 'negative' && "text-red-600"
          )}>
            {metric.trend === 'up' && <TrendingUp className="h-3 w-3" />}
            {metric.trend === 'down' && <TrendingDown className="h-3 w-3" />}
            <span>{metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%</span>
          </div>
          <div className="flex items-center space-x-1">
            <Badge variant="outline" className="text-xs">
              {(metric.confidence * 100).toFixed(0)}% confidence
            </Badge>
          </div>
        </div>
        <Progress
          value={metric.confidence * 100}
          className="mt-2 h-1"
        />
      </CardContent>
    </Card>
  );

  const DynamicInsightCard = ({ insight }: { insight: DynamicInsight }) => {
    // Generate next action chips based on current state
    const getNextActionChips = () => {
      const chips = [];
      
      if (state.businessUnits.length === 0) {
        chips.push({ text: 'Create Business Unit', action: 'create_bu', variant: 'default' as const });
        chips.push({ text: 'Learn Setup', action: 'help', variant: 'outline' as const });
      } else if (state.businessUnits.every(bu => bu.lobs.length === 0)) {
        chips.push({ text: 'Create Line of Business', action: 'create_lob', variant: 'default' as const });
        chips.push({ text: 'Add Another BU', action: 'create_bu', variant: 'outline' as const });
      } else if (!state.businessUnits.some(bu => bu.lobs.some(lob => lob.hasData))) {
        chips.push({ text: 'Upload Data', action: 'upload_data', variant: 'default' as const });
        chips.push({ text: 'Download Template', action: 'template', variant: 'outline' as const });
      } else if (!state.analyzedData.hasEDA) {
        chips.push({ text: 'Explore Data', action: 'explore', variant: 'default' as const });
        chips.push({ text: 'View Data Quality', action: 'quality', variant: 'outline' as const });
      } else if (!state.analyzedData.hasForecasting) {
        chips.push({ text: 'Generate Forecast', action: 'forecast', variant: 'default' as const });
        chips.push({ text: 'Advanced Analysis', action: 'advanced', variant: 'outline' as const });
      } else {
        chips.push({ text: 'Export Results', action: 'export', variant: 'default' as const });
        chips.push({ text: 'New Analysis', action: 'new_analysis', variant: 'outline' as const });
      }
      
      return chips;
    };

    const nextActionChips = getNextActionChips();

    return (
      <Card className={cn(
        "border-l-4 break-inside-avoid",
        insight.significance === 'high' && "border-l-red-500 bg-red-50/50 dark:bg-red-950/20",
        insight.significance === 'medium' && "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20",
        insight.significance === 'low' && "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
      )}>
        <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
          <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-sm font-medium flex items-center gap-2 flex-1 min-w-0">
              <span className="flex-shrink-0">
                {insight.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                {insight.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                {!insight.trend && <Brain className="h-4 w-4 text-blue-500" />}
              </span>
              <span className="truncate">{insight.title}</span>
            </CardTitle>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                {insight.category}
              </Badge>
              {insight.actionable && (
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  <Target className="h-3 w-3 mr-1" />
                  Actionable
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
          <p className="text-sm text-muted-foreground mb-3 break-words">{insight.description}</p>
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-semibold text-primary">
              {insight.value}
            </div>
            <Badge variant={insight.significance === 'high' ? 'destructive' : insight.significance === 'medium' ? 'default' : 'secondary'} className="text-xs">
              {insight.significance} priority
            </Badge>
          </div>
          
          {/* Next Action Chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {nextActionChips.map((chip, index) => (
              <Button
                key={index}
                size="sm"
                variant={chip.variant}
                className="h-7 text-xs"
                onClick={() => {
                  // Handle action - could dispatch or trigger chat message
                  console.log(`Action: ${chip.action}`);
                }}
              >
                {chip.text}
              </Button>
            ))}
          </div>
          
          {insight.recommendation && (
            <div className="text-xs bg-muted/50 rounded p-2 border-l-2 border-primary break-words">
              <strong>💡 Recommendation:</strong> {insight.recommendation}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const InsightCardComponent = ({ insight }: { insight: InsightCard }) => (
    <Card className={cn(
      "border-l-4 break-inside-avoid",
      insight.severity === 'error' && "border-l-red-500 bg-red-50/50 dark:bg-red-950/20",
      insight.severity === 'warning' && "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20",
      insight.severity === 'success' && "border-l-green-500 bg-green-50/50 dark:bg-green-950/20",
      insight.severity === 'info' && "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
    )}>
      <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
        <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm font-medium flex items-center gap-2 flex-1 min-w-0">
            <span className="flex-shrink-0">
              {insight.severity === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
              {insight.severity === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
              {insight.severity === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {insight.severity === 'info' && <Eye className="h-4 w-4 text-blue-500" />}
            </span>
            <span className="truncate">{insight.title}</span>
          </CardTitle>
          {insight.actionable && (
            <Badge variant="outline" className="text-xs flex-shrink-0">
              <Target className="h-3 w-3 mr-1" />
              Actionable
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
        <p className="text-sm text-muted-foreground mb-2 break-words">{insight.description}</p>
        {insight.recommendation && (
          <div className="text-xs bg-muted/50 rounded p-2 border-l-2 border-primary break-words">
            <strong>Recommendation:</strong> {insight.recommendation}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const vizData = useMemo(() => filteredData, [filteredData]);

  // Show message if no analysis has been done
  if (!state.selectedLob?.hasData) {
    return (
      <Card className={cn("flex flex-col rounded-none border-0 md:border-r", className)}>
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Enhanced Insights Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Brain className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium">No Data Available</p>
            <p className="text-sm">Upload data and run analysis in chat to see insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!state.analyzedData.hasEDA && !state.analyzedData.hasInsights && !state.analyzedData.hasForecasting) {
    return (
      <Card className={cn("flex flex-col rounded-none border-0 md:border-r", className)}>
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Enhanced Insights Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Activity className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium">No Analysis Done Yet</p>
            <p className="text-sm">Ask me to explore your data or generate insights in the chat</p>
            <div className="mt-4 text-xs space-y-1">
              <p><strong>Try asking:</strong></p>
              <p>• "Explore my data patterns"</p>
              <p>• "Generate business insights"</p>
              <p>• "Run a forecast analysis"</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("flex flex-col rounded-none border-0 md:border-r", className)}>
      <CardHeader className="p-4 border-b">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Enhanced Insights Panel
            </CardTitle>
            {isAnalyzing && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Analyzing...
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={performAdvancedAnalytics}
              disabled={isAnalyzing || !state.selectedLob?.hasData}
            >
              <RefreshCw className={cn("h-4 w-4", isAnalyzing && "animate-spin")} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => dispatch({ type: 'SET_DATA_PANEL_OPEN', payload: false })}
            >
              Hide
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mt-2">
          <BuLobSelector />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={state.dataPanelTarget === "units" ? "secondary" : "ghost"}
              onClick={() => dispatch({ type: 'SET_DATA_PANEL_TARGET', payload: 'units' })}
            >
              <Activity className="h-3 w-3 mr-1" />
              Value
            </Button>
            <Button
              size="sm"
              variant={state.dataPanelTarget === "revenue" ? "secondary" : "ghost"}
              onClick={() => dispatch({ type: 'SET_DATA_PANEL_TARGET', payload: 'revenue' })}
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Orders
            </Button>
          </div>
        </div>

        {/* Date Filter Section */}
        <div className="flex items-center gap-2 mt-2 p-2 bg-muted/50 rounded-md">
          <Label className="text-sm font-medium flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Date Range:
          </Label>
          <Select
            value={state.dateRange?.preset || 'last_30_days'}
            onValueChange={(preset) => {
              const now = new Date();
              let start: Date;

              switch (preset) {
                case 'last_7_days':
                  start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                  break;
                case 'last_30_days':
                  start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                  break;
                case 'last_90_days':
                  start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                  break;
                case 'last_year':
                  start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                  break;
                default:
                  return;
              }

              const newDateRange = {
                start,
                end: now,
                preset: preset as DateRange['preset']
              };

              dispatch({ type: 'SET_DATE_RANGE', payload: newDateRange });
              setSelectedDateRange(newDateRange);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Last 7 days</SelectItem>
              <SelectItem value="last_30_days">Last 30 days</SelectItem>
              <SelectItem value="last_90_days">Last 90 days</SelectItem>
              <SelectItem value="last_year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-xs">
            {state.dateRange ?
              `${state.dateRange.start.toLocaleDateString()} - ${state.dateRange.end.toLocaleDateString()}` :
              'All data'
            }
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 min-h-0">
        <Tabs
          value={state.dataPanelMode}
          onValueChange={(v) => dispatch({ type: 'SET_DATA_PANEL_MODE', payload: v as any })}
          className="flex flex-col h-full"
        >
          <div className="px-2 sm:px-4 pt-3 border-b overflow-x-auto">
            <TabsList className="grid w-full grid-cols-4 min-w-max">
              <TabsTrigger 
                value="dashboard" 
                className="text-xs sm:text-sm px-2 sm:px-4"
                disabled={!state.analyzedData.hasEDA}
              >
                <PieChart className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger 
                value="chart" 
                className="text-xs sm:text-sm px-2 sm:px-4"
                disabled={!state.analyzedData.hasEDA}
              >
                <LineChart className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Charts</span>
              </TabsTrigger>
              <TabsTrigger 
                value="insights" 
                className="text-xs sm:text-sm px-2 sm:px-4"
                disabled={!state.analyzedData.hasInsights && !state.analyzedData.hasForecasting}
              >
                <Zap className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Insights</span>
              </TabsTrigger>
              <TabsTrigger 
                value="table" 
                className="text-xs sm:text-sm px-2 sm:px-4"
                disabled={!state.analyzedData.hasEDA}
              >
                <Filter className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Data</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="flex-1 min-h-0 m-0">
            <ScrollArea className="h-full">
              {state.analyzedData.hasEDA ? (
                <BIDashboard />
              ) : (
                <div className="p-4">
                  <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <PieChart className="h-4 w-4 text-yellow-500" />
                        <h4 className="text-sm font-medium">Dashboard Not Available</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Dashboard requires data analysis to be completed first. Ask me to explore your data in the chat.
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="default" className="h-7 text-xs">
                          Explore Data
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          Upload Data
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="chart" className="flex-1 min-h-0 m-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {vizData ? (
                  <>
                    {!state.analyzedData.hasEDA && (
                      <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20 mb-4">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <LineChart className="h-4 w-4 text-blue-500" />
                            <h4 className="text-sm font-medium">Basic Charts Available</h4>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Showing basic visualization. Run data analysis for enhanced insights and statistical overlays.
                          </p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="default" className="h-7 text-xs">
                              Analyze Data
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs">
                              View Patterns
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Forecast vs Actual Comparison */}
                    {state.analyzedData.hasForecasting && vizData.some(d => d.Forecast) && (
                      <ForecastComparisonChart
                        data={vizData}
                        target={state.dataPanelTarget === 'units' ? 'Value' : 'Orders'}
                        title="Actual vs Forecast Analysis"
                      />
                    )}
                    
                    <EnhancedDataVisualizer
                      data={vizData}
                      target={state.dataPanelTarget as 'Value' | 'Orders'}
                      isRealData={true}
                      statisticalAnalysis={analyticsResults}
                    />
                  </>
                ) : (
                  <Card className="border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <LineChart className="h-4 w-4 text-red-500" />
                        <h4 className="text-sm font-medium">No Data for Charts</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Select a Business Unit and Line of Business with uploaded data to see visualizations.
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="default" className="h-7 text-xs">
                          Upload Data
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          Create LOB
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="insights" className="flex-1 min-h-0 m-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {/* Real AI-Driven Insights - Always Show Based on Actual Session */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-medium">Session Insights</h3>
                    <Badge variant="outline" className="text-xs">
                      AI-Generated
                    </Badge>
                  </div>
                  {dynamicInsights.length > 0 ? (
                    dynamicInsights.map(insight => (
                      <DynamicInsightCard key={insight.id} insight={insight} />
                    ))
                  ) : (
                    <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="h-4 w-4 text-blue-500" />
                          <h4 className="text-sm font-medium">Analyzing Session...</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          I'm analyzing your current session to provide personalized insights.
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" className="h-7 text-xs">
                            Create Business Unit
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            Learn More
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Statistical Insights - Only show if data has been analyzed */}
                {insightCards.length > 0 && state.analyzedData.hasEDA && (
                  <div className="space-y-3 mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <h3 className="text-sm font-medium">Statistical Analysis</h3>
                      <Badge variant="outline" className="text-xs">
                        Data-Driven
                      </Badge>
                    </div>
                    {insightCards.map(insight => (
                      <InsightCardComponent key={insight.id} insight={insight} />
                    ))}
                  </div>
                )}

                {/* Refresh Button */}
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={generateRealInsights}
                    className="w-full"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Refresh Insights
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="table" className="flex-1 min-h-0 m-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                {vizData ? (
                  <Table>
                    <TableCaption>
                      Weekly {state.dataPanelTarget} for {state.selectedLob?.name}
                      {analyticsResults && ` (Quality Score: ${analyticsResults.quality?.score || 'N/A'}/100)`}
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Efficiency</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vizData.map((row, i) => {
                        const efficiency = row.Value / (row.Orders || 1);
                        const isOutlier = analyticsResults?.statistical?.outliers.indices.includes(i);
                        return (
                          <TableRow key={i} className={isOutlier ? "bg-yellow-50/50 dark:bg-yellow-950/20" : ""}>
                            <TableCell className="font-medium">
                              {new Date(row.Date).toLocaleDateString()}
                              {isOutlier && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Outlier
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {row.Value.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {row.Orders.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono text-muted-foreground">
                              {efficiency.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-10 px-4 border rounded-md bg-muted/30">
                    <Filter className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                    <p>Select a Business Unit / LOB with data to see enhanced data table.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
