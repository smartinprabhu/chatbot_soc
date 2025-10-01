export interface DataPoint {
  date: Date;
  value: number;
  orders: number;
}

export interface StatisticalSummary {
  mean: number;
  median: number;
  standardDeviation: number;
  variance: number;
  min: number;
  max: number;
  skewness: number;
  kurtosis: number;
  outliers: {
    values: number[];
    indices: number[];
  };
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  linearRegression: {
    slope: number;
    intercept: number;
    rSquared: number;
  };
}

export interface SeasonalityAnalysis {
  hasSeasonality: boolean;
  dominantPeriods: Array<{
    period: number;
    strength: number;
  }>;
}

export interface DataQualityReport {
  score: number;
  issues: string[];
  recommendations: string[];
}

export class StatisticalAnalyzer {
  calculateStatisticalSummary(values: number[]): StatisticalSummary {
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Simple outlier detection using IQR
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    const outliers = values.map((val, idx) => ({ val, idx }))
      .filter(({ val }) => val < lowerBound || val > upperBound);

    return {
      mean,
      median: sorted[Math.floor(sorted.length / 2)],
      standardDeviation,
      variance,
      min: Math.min(...values),
      max: Math.max(...values),
      skewness: this.calculateSkewness(values, mean, standardDeviation),
      kurtosis: this.calculateKurtosis(values, mean, standardDeviation),
      outliers: {
        values: outliers.map(o => o.val),
        indices: outliers.map(o => o.idx)
      }
    };
  }

  analyzeTrend(dataPoints: DataPoint[]): TrendAnalysis {
    const values = dataPoints.map(d => d.value);
    const x = dataPoints.map((_, i) => i);
    
    const n = values.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = values.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const ssRes = values.reduce((sum, val, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    const rSquared = 1 - (ssRes / ssTotal);
    
    return {
      direction: slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable',
      confidence: Math.abs(rSquared),
      linearRegression: {
        slope,
        intercept,
        rSquared
      }
    };
  }

  analyzeSeasonality(dataPoints: DataPoint[]): SeasonalityAnalysis {
    // Simple seasonality detection
    const values = dataPoints.map(d => d.value);
    
    // Check for weekly patterns (7-day cycle)
    const weeklyCorrelation = this.calculateAutocorrelation(values, 7);
    
    return {
      hasSeasonality: weeklyCorrelation > 0.3,
      dominantPeriods: [
        { period: 7, strength: weeklyCorrelation }
      ]
    };
  }

  private calculateSkewness(values: number[], mean: number, stdDev: number): number {
    const n = values.length;
    const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0);
    return (n / ((n - 1) * (n - 2))) * sum;
  }

  private calculateKurtosis(values: number[], mean: number, stdDev: number): number {
    const n = values.length;
    const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0);
    return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
  }

  private calculateAutocorrelation(values: number[], lag: number): number {
    if (lag >= values.length) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < values.length - lag; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }
    
    for (let i = 0; i < values.length; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }
    
    return numerator / denominator;
  }
}

export class InsightsGenerator {
  generateDataQualityReport(dataPoints: DataPoint[]): DataQualityReport {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check for missing values (simplified)
    const hasNullValues = dataPoints.some(d => d.value === null || d.value === undefined);
    if (hasNullValues) {
      issues.push('Missing values detected');
      recommendations.push('Handle missing values through imputation or removal');
      score -= 20;
    }

    // Check for outliers
    const values = dataPoints.map(d => d.value);
    const analyzer = new StatisticalAnalyzer();
    const stats = analyzer.calculateStatisticalSummary(values);
    
    if (stats.outliers.values.length > values.length * 0.05) {
      issues.push('High number of outliers detected');
      recommendations.push('Review and potentially treat outliers');
      score -= 15;
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  generateForecastInsights(dataPoints: DataPoint[], forecastData: any): any {
    return {
      opportunities: ['Seasonal growth pattern identified', 'Upward trend suggests expansion potential'],
      riskFactors: ['High volatility in recent periods'],
      actionableRecommendations: ['Consider inventory scaling', 'Monitor trend changes closely']
    };
  }
}

export const statisticalAnalyzer = new StatisticalAnalyzer();
export const insightsGenerator = new InsightsGenerator();