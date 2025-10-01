'use client';

import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Bot, Paperclip, Send, User, BarChart, CheckCircle, FileText, Brain, TrendingUp, AlertCircle, Zap, Settings } from 'lucide-react';
import TableSnippet from '@/components/ui/table-snippet';
import { useApp } from '../dashboard/app-provider';
import type { ChatMessage, WeeklyData, WorkflowStep } from '@/lib/types';
import { cn } from '@/lib/utils';
import EnhancedAgentMonitor from './enhanced-agent-monitor';
import DataVisualizer from './data-visualizer';
import { enhancedAPIClient, validateChatMessage, sanitizeUserInput } from '@/lib/enhanced-api-client';
import { statisticalAnalyzer, insightsGenerator, type DataPoint } from '@/lib/statistical-analysis';
import APISettingsDialog from './api-settings-dialog';

type AgentConfig = {
  name: string;
  emoji: string;
  specialty: string;
  keywords: string[];
  systemPrompt: string;
  color: string;
  capabilities: string[];
};

export const ENHANCED_AGENTS: Record<string, AgentConfig> = {
  onboarding: {
    name: "Onboarding Guide",
    emoji: "🚀",
    specialty: "User Onboarding & Setup",
    keywords: ['start', 'begin', 'setup', 'help', 'guide', 'onboard', 'getting started'],
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    capabilities: ["User Guidance", "Process Planning", "Best Practices"],
    systemPrompt: `You are an expert onboarding guide for business intelligence and forecasting applications. Your goal is to help users understand the platform and plan their data analysis journey.

CORE RESPONSIBILITIES:
- Guide users through the complete BI workflow
- Explain the plan-and-proceed methodology  
- Help users understand what data they need and how to prepare it
- Suggest optimal analysis approaches based on user goals

INTERACTION STYLE:
- Use simple, clear language suitable for business users
- Provide step-by-step guidance with clear next actions
- Ask clarifying questions to understand user needs
- Explain technical concepts in business terms

PLAN-AND-PROCEED METHODOLOGY:
Always follow this structure:
1. Understand user goals and data context
2. Recommend appropriate analysis workflow
3. Explain each step and expected outcomes
4. Provide clear next actions

WORKFLOW PLANNING FORMAT:
[WORKFLOW_PLAN]
[
  {"name": "Step Name", "estimatedTime": "2m", "details": "Step description", "expectedOutcome": "What user will get"}
]
[/WORKFLOW_PLAN]

Focus on creating confidence and clarity for the user's BI journey.`
  },
  
  eda: {
    name: "Data Explorer",
    emoji: "🔬",
    specialty: "Exploratory Data Analysis",
    keywords: ['explore', 'eda', 'analyze', 'distribution', 'pattern', 'correlation', 'outlier', 'statistics', 'summary', 'data quality'],
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    capabilities: ["Statistical Analysis", "Pattern Detection", "Data Quality Assessment", "Outlier Detection"],
    systemPrompt: `You are an advanced EDA specialist with deep statistical expertise. You perform comprehensive data exploration and provide actionable insights.

ADVANCED CAPABILITIES:
- Comprehensive statistical analysis with confidence intervals
- Advanced pattern recognition and correlation analysis  
- Sophisticated outlier detection using multiple methods
- Data quality assessment with actionable recommendations
- Business-relevant insights from statistical findings

ANALYSIS APPROACH:
1. Perform comprehensive statistical summary
2. Detect patterns, trends, and seasonality
3. Assess data quality and identify issues
4. Generate business-relevant insights
5. Recommend next steps based on findings

RESPONSE FORMAT:
- Lead with key statistical findings
- Highlight business-relevant patterns
- Identify data quality issues and recommendations
- Suggest optimal analysis paths forward

STATISTICAL RIGOR:
- Always provide confidence levels for findings
- Use appropriate statistical tests
- Explain significance in business terms
- Identify limitations and assumptions

Include structured insights:
[REPORT_DATA]
{
  "title": "Comprehensive EDA Report",
  "keyFindings": ["Statistical insight 1", "Pattern insight 2", "Quality insight 3"],
  "statisticalSummary": {"metric": "value with confidence"},
  "dataQuality": {"score": "0-100", "issues": ["issue1", "issue2"]},
  "recommendations": ["Next analysis step 1", "Data improvement 2"]
}
[/REPORT_DATA]

Focus on actionable statistical insights that drive business decisions.`
  },

  preprocessing: {
    name: "Data Engineer",
    emoji: "🔧",
    specialty: "Data Processing & Cleaning",
    keywords: ['clean', 'preprocess', 'prepare', 'missing', 'outliers', 'transform', 'normalize', 'feature engineering'],
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    capabilities: ["Data Cleaning", "Missing Value Handling", "Outlier Treatment", "Feature Engineering"],
    systemPrompt: `You are an expert data engineer specializing in advanced data preprocessing and feature engineering for forecasting applications.

PREPROCESSING EXPERTISE:
- Advanced missing value imputation strategies
- Sophisticated outlier detection and treatment
- Feature engineering for time series forecasting
- Data transformation and normalization techniques
- Data validation and quality assurance

PREPROCESSING WORKFLOW:
1. Assess data quality and identify issues
2. Handle missing values with appropriate strategies
3. Detect and treat outliers based on business context
4. Engineer relevant features for forecasting
5. Validate preprocessing results
6. Prepare data for modeling

TECHNIQUES AVAILABLE:
- Multiple imputation methods (mean, median, forward-fill, interpolation)
- Outlier treatment (IQR, Z-score, domain knowledge)
- Feature engineering (lags, rolling statistics, seasonality features)
- Normalization and scaling techniques
- Data validation and quality checks

Always explain the reasoning behind preprocessing choices and their impact on downstream analysis.

[REPORT_DATA]
{
  "title": "Data Preprocessing Report",
  "processingSteps": ["Step 1", "Step 2", "Step 3"],
  "qualityImprovements": {"before": "score", "after": "improved_score"},
  "featuresCreated": ["feature1", "feature2"],
  "recommendations": ["modeling recommendation 1", "validation step 2"]
}
[/REPORT_DATA]

Focus on preparing high-quality, modeling-ready datasets.`
  },

  modeling: {
    name: "ML Engineer", 
    emoji: "🤖",
    specialty: "Model Training & Selection",
    keywords: ['model', 'train', 'machine learning', 'algorithm', 'xgboost', 'prophet', 'lightgbm', 'cross validation'],
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    capabilities: ["Algorithm Selection", "Hyperparameter Tuning", "Cross Validation", "Model Optimization"],
    systemPrompt: `You are an expert ML engineer specializing in forecasting model development with deep knowledge of advanced algorithms and optimization techniques.

MODEL EXPERTISE:
- Advanced forecasting algorithms (Prophet, XGBoost, LightGBM, LSTM, ARIMA)
- Sophisticated hyperparameter optimization
- Cross-validation strategies for time series
- Model ensemble techniques
- Performance optimization and scalability

MODELING APPROACH:
1. Analyze data characteristics to select optimal algorithms
2. Design appropriate cross-validation strategy
3. Implement hyperparameter optimization
4. Train multiple models with different approaches
5. Create ensemble models for improved performance
6. Validate model performance and robustness

ALGORITHM SELECTION:
- Prophet: For seasonal data with trend changes and holidays
- XGBoost/LightGBM: For complex non-linear patterns with features
- LSTM: For complex sequential patterns and long-term dependencies
- ARIMA: For stationary time series with clear autocorrelation
- Ensemble: Combination for robust predictions

Always explain model selection rationale and expected performance characteristics.

[REPORT_DATA]
{
  "title": "Model Training Report",
  "modelsTrained": ["Prophet", "XGBoost", "LightGBM"],
  "bestModel": {"name": "XGBoost", "performance": "MAPE: 8.2%"},
  "crossValidation": {"folds": 5, "avgPerformance": "MAPE: 9.1%"},
  "hyperparameters": {"learning_rate": 0.1, "max_depth": 6},
  "recommendations": ["deployment readiness", "monitoring strategy"]
}
[/REPORT_DATA]

Focus on building robust, production-ready forecasting models.`
  },

  forecasting: {
    name: "Forecast Analyst",
    emoji: "📈", 
    specialty: "Predictive Analytics & Forecasting",
    keywords: ['forecast', 'predict', 'future', 'projection', 'trend', 'time series', 'prediction intervals'],
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    capabilities: ["Time Series Forecasting", "Confidence Intervals", "Scenario Analysis", "Business Impact Assessment"],
    systemPrompt: `You are an expert forecasting analyst with deep expertise in predictive analytics and business impact assessment.

FORECASTING EXPERTISE:
- Advanced time series forecasting techniques
- Confidence interval calculation and interpretation
- Scenario modeling and what-if analysis  
- Business impact assessment and risk quantification
- Forecast validation and performance monitoring

FORECASTING PROCESS:
1. Generate point forecasts with selected models
2. Calculate prediction intervals with proper uncertainty quantification
3. Perform scenario analysis for different business conditions
4. Assess business impact and risk factors
5. Provide actionable recommendations based on forecasts
6. Set up monitoring and validation frameworks

BUSINESS FOCUS:
- Translate statistical forecasts into business language
- Quantify potential business impact and risks
- Provide scenario-based recommendations
- Identify key forecast drivers and assumptions
- Suggest monitoring and updating strategies

[REPORT_DATA]
{
  "title": "Forecast Analysis Report",
  "forecastHorizon": "30 days",
  "pointForecast": {"value": "125,000", "change": "+12%"},
  "confidenceIntervals": {"80%": "[118k, 132k]", "95%": "[112k, 138k]"},
  "scenarios": [{"scenario": "optimistic", "impact": "+20%"}],
  "businessImpact": ["Expected revenue increase", "Capacity planning needs"],
  "recommendations": ["Action 1", "Action 2"]
}
[/REPORT_DATA]

Focus on actionable forecasts that drive business decisions.`
  },

  validation: {
    name: "Quality Analyst", 
    emoji: "✅",
    specialty: "Model Validation & Testing",
    keywords: ['validate', 'test', 'accuracy', 'performance', 'metrics', 'evaluation', 'residuals'],
    color: "bg-teal-500/10 text-teal-600 border-teal-500/20",
    capabilities: ["Model Validation", "Performance Metrics", "Residual Analysis", "Statistical Testing"],
    systemPrompt: `You are an expert model validation specialist with deep expertise in statistical testing and performance assessment.

VALIDATION EXPERTISE:
- Comprehensive model performance evaluation
- Advanced residual analysis and diagnostic testing
- Statistical significance testing
- Cross-validation and out-of-sample testing
- Business performance metrics

VALIDATION PROCESS:
1. Calculate comprehensive performance metrics (MAPE, RMSE, MAE, MASE)
2. Perform residual analysis and diagnostic tests
3. Validate model assumptions and limitations
4. Assess business performance and value
5. Test model robustness and stability
6. Provide validation recommendations

VALIDATION METRICS:
- Statistical: MAPE, RMSE, MAE, MASE, R², AIC, BIC
- Business: Revenue impact, cost savings, decision support value
- Diagnostic: Residual normality, autocorrelation, heteroscedasticity
- Robustness: Out-of-sample performance, stability over time

[REPORT_DATA]
{
  "title": "Model Validation Report", 
  "performanceMetrics": {"MAPE": "8.2%", "RMSE": "1,250", "R2": "0.89"},
  "residualAnalysis": {"normality": "Pass", "autocorrelation": "Pass"},
  "businessValue": {"accuracy": "High", "reliability": "Excellent"},
  "limitations": ["Assumption 1", "Limitation 2"],
  "recommendations": ["Deploy with confidence", "Monitor weekly"]
}
[/REPORT_DATA]

Focus on providing confidence in model reliability and business value.`
  },

  insights: {
    name: "Business Analyst",
    emoji: "💡",
    specialty: "Business Insights & Strategy",  
    keywords: ['insights', 'business', 'strategy', 'impact', 'recommendations', 'opportunities', 'risks'],
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    capabilities: ["Business Intelligence", "Strategic Analysis", "Risk Assessment", "Opportunity Identification"],
    systemPrompt: `You are an expert business analyst specializing in extracting strategic insights from data analysis and forecasting results.

INSIGHTS EXPERTISE:
- Strategic business intelligence from data patterns
- Risk assessment and opportunity identification
- Competitive analysis and market insights
- ROI analysis and business impact quantification
- Strategic recommendations and action planning

INSIGHTS PROCESS:
1. Analyze data patterns for business implications
2. Identify strategic opportunities and threats
3. Quantify business impact and ROI potential
4. Assess risks and mitigation strategies
5. Develop actionable strategic recommendations
6. Create implementation roadmaps

BUSINESS FOCUS:
- Connect data insights to business strategy
- Identify revenue and cost optimization opportunities
- Assess competitive positioning and market trends
- Quantify business risks and opportunities
- Provide actionable strategic recommendations

[REPORT_DATA]
{
  "title": "Business Insights Report",
  "keyInsights": ["Strategic insight 1", "Market opportunity 2"],
  "opportunities": ["Revenue opportunity", "Cost optimization"],
  "risks": ["Market risk", "Operational risk"], 
  "businessImpact": {"revenue": "+15%", "efficiency": "+20%"},
  "recommendations": ["Strategic action 1", "Implementation plan 2"]
}
[/REPORT_DATA]

Focus on transforming analytical findings into strategic business value.`
  },

  general: {
    name: "BI Assistant",
    emoji: "🤖",
    specialty: "General BI Support",
    keywords: [],
    color: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    capabilities: ["General Support", "Guidance", "Information"],
    systemPrompt: `You are a helpful business intelligence assistant providing general support and guidance.

CORE RESPONSIBILITIES:
- Provide helpful information about BI processes
- Guide users to appropriate specialized agents
- Answer general questions about data analysis
- Explain BI concepts in simple terms

INTERACTION STYLE:
- Be helpful, friendly, and informative
- Provide clear, concise answers
- Direct users to specialized agents when appropriate
- Focus on user needs and goals

Always aim to be helpful and guide users toward their analytical goals.`
  }
};

class EnhancedMultiAgentChatHandler {
  conversationHistory: { role: 'user' | 'assistant' | 'system'; content: string }[] = [];
  private dispatch: any;
  private currentAgent: string = 'general';
  private performanceMetrics = {
    requestCount: 0,
    errorCount: 0,
    avgResponseTime: 0,
    cacheHitRate: 0
  };

  constructor(dispatch: any) {
    this.dispatch = dispatch;
  }

  // Enhanced agent selection with workflow intelligence
  selectOptimalAgents(userMessage: string, context: any): {
    agents: string[];
    workflow: WorkflowStep[];
    reasoning: string;
  } {
    const lowerMessage = userMessage.toLowerCase();
    const selectedAgents: string[] = [];
    let workflow: WorkflowStep[] = [];
    let reasoning = '';

    // Onboarding detection
    if (/(start|begin|help|guide|getting started|onboard|setup)/i.test(lowerMessage) && !context.selectedLob?.hasData) {
      selectedAgents.push('onboarding');
      reasoning = 'User needs onboarding guidance';
      workflow = [
        { id: 'step-1', name: 'Business Setup', status: 'pending', dependencies: [], estimatedTime: '2m', details: 'Select Business Unit and Line of Business', agent: 'Onboarding Guide' },
        { id: 'step-2', name: 'Data Upload', status: 'pending', dependencies: ['step-1'], estimatedTime: '1m', details: 'Upload your dataset for analysis', agent: 'Onboarding Guide' },
        { id: 'step-3', name: 'Analysis Planning', status: 'pending', dependencies: ['step-2'], estimatedTime: '30s', details: 'Plan your analysis workflow', agent: 'Onboarding Guide' }
      ];
    }
    // Complete forecasting workflow
    else if (/(forecast|predict|train|process|complete analysis|end to end)/i.test(lowerMessage)) {
      selectedAgents.push('eda', 'preprocessing', 'modeling', 'validation', 'forecasting', 'insights');
      reasoning = 'Complete forecasting workflow requested';
      workflow = [
        { id: 'step-1', name: 'Exploratory Data Analysis', status: 'pending', dependencies: [], estimatedTime: '45s', details: 'Comprehensive statistical analysis', agent: 'Data Explorer' },
        { id: 'step-2', name: 'Data Preprocessing', status: 'pending', dependencies: ['step-1'], estimatedTime: '30s', details: 'Clean and prepare data', agent: 'Data Engineer' },
        { id: 'step-3', name: 'Model Training', status: 'pending', dependencies: ['step-2'], estimatedTime: '2m', details: 'Train multiple forecasting models', agent: 'ML Engineer' },
        { id: 'step-4', name: 'Model Validation', status: 'pending', dependencies: ['step-3'], estimatedTime: '30s', details: 'Validate model performance', agent: 'Quality Analyst' },
        { id: 'step-5', name: 'Forecast Generation', status: 'pending', dependencies: ['step-4'], estimatedTime: '15s', details: 'Generate forecasts with confidence intervals', agent: 'Forecast Analyst' },
        { id: 'step-6', name: 'Business Insights', status: 'pending', dependencies: ['step-5'], estimatedTime: '20s', details: 'Extract strategic business insights', agent: 'Business Analyst' }
      ];
    }
    // Individual agent selection
    else {
      for (const [agentKey, agent] of Object.entries(ENHANCED_AGENTS)) {
        if (agentKey === 'general') continue;

        for (const keyword of agent.keywords) {
          if (lowerMessage.includes(keyword)) {
            selectedAgents.push(agentKey);
            reasoning = `${agent.name} selected for ${keyword}-related query`;
            workflow = [
              { id: 'step-1', name: agent.specialty, status: 'pending', dependencies: [], estimatedTime: '30s', details: `${agent.specialty} analysis`, agent: agent.name }
            ];
            break;
          }
        }
        if (selectedAgents.length > 0) break;
      }
    }

    if (selectedAgents.length === 0) {
      selectedAgents.push('general');
      reasoning = 'General assistant for broad query';
      workflow = [
        { id: 'step-1', name: 'General Assistance', status: 'pending', dependencies: [], estimatedTime: '10s', details: 'Provide general help', agent: 'BI Assistant' }
      ];
    }

    this.dispatch({
      type: 'ADD_THINKING_STEP',
      payload: `🧠 Agent Selection: ${reasoning}`
    });

    return { agents: selectedAgents, workflow, reasoning };
  }
  
  async generateEnhancedResponse(userMessage: string, context: any) {
    const startTime = Date.now();
    this.performanceMetrics.requestCount++;

    // Validate input
    const validation = validateChatMessage(userMessage);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const sanitizedMessage = sanitizeUserInput(userMessage);
    
    this.dispatch({ type: 'ADD_THINKING_STEP', payload: '🔍 Analyzing request with enhanced intelligence...' });

    // Select optimal agents and workflow
    const { agents, workflow, reasoning } = this.selectOptimalAgents(sanitizedMessage, context);
    
    // Set workflow if multi-step
    if (workflow.length > 1) {
      this.dispatch({ type: 'SET_WORKFLOW', payload: workflow });
    }

    let finalResponse = '';
    let finalReportData = null;
    let finalAgentType = 'general';
    let aggregatedInsights: any = {};

    for (const agentKey of agents) {
      this.currentAgent = agentKey;
      finalAgentType = agentKey;
      const agent = ENHANCED_AGENTS[agentKey];
      
      try {
        this.dispatch({ type: 'ADD_THINKING_STEP', payload: `${agent.emoji} ${agent.name} analyzing...` });

        // Enhanced context building with statistical analysis
        const enhancedContext = await this.buildEnhancedContext(context, agentKey);
        const systemPrompt = this.buildEnhancedSystemPrompt(enhancedContext, agent);

        this.conversationHistory.push({ role: "user", content: sanitizedMessage });

        const completion = await enhancedAPIClient.createChatCompletion({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...this.conversationHistory.slice(-10) // Keep recent context
          ],
          temperature: agentKey === 'insights' ? 0.7 : 0.5,
          max_tokens: 1200,
          useCache: true
        });

        const aiResponse = completion.choices[0].message.content ?? "";
        this.dispatch({ type: 'ADD_THINKING_STEP', payload: `✅ ${agent.name} analysis complete` });

        // Parse and aggregate insights
        const reportMatch = aiResponse.match(/\[REPORT_DATA\]([\s\S]*?)\[\/REPORT_DATA\]/);
        if (reportMatch) {
          try {
            const reportData = JSON.parse(reportMatch[1].trim());
            aggregatedInsights[agentKey] = reportData;
            if (agents.length === 1) {
              finalReportData = reportData;
            }
            this.dispatch({ type: 'ADD_THINKING_STEP', payload: '📊 Insights extracted and processed' });
          } catch (e) {
            console.error('Failed to parse report data:', e);
          }
        }

        // Append response
        if (agents.length === 1) {
          finalResponse = aiResponse;
        } else {
          finalResponse += `## ${agent.name}\n${aiResponse.replace(/\[REPORT_DATA\][\s\S]*?\[\/REPORT_DATA\]/, '')}\n\n`;
        }

        await new Promise(resolve => setTimeout(resolve, 200));
        this.conversationHistory.push({ role: "assistant", content: aiResponse });

      } catch (error) {
        console.error(`${agent.name} Error:`, error);
        this.performanceMetrics.errorCount++;
        
        finalResponse += `## ${agent.name}\n⚠️ ${error instanceof Error ? error.message : 'An unexpected error occurred'}\n\n`;
      }
    }

    // Generate comprehensive report for multi-agent workflows
    if (agents.length > 1 && Object.keys(aggregatedInsights).length > 0) {
      finalReportData = this.generateComprehensiveReport(aggregatedInsights);
    }

    // Update performance metrics
    const responseTime = Date.now() - startTime;
    this.performanceMetrics.avgResponseTime = 
      (this.performanceMetrics.avgResponseTime * (this.performanceMetrics.requestCount - 1) + responseTime) / this.performanceMetrics.requestCount;
    this.performanceMetrics.cacheHitRate = enhancedAPIClient.getCacheStats().hitRate;

    this.dispatch({ type: 'CLEAR_THINKING_STEPS' });
    
    return {
      response: finalResponse.trim() || "I apologize, but I couldn't generate a complete response. Please try again.",
      agentType: finalAgentType,
      reportData: finalReportData,
      performance: this.performanceMetrics,
      multiAgent: agents.length > 1
    };
  }

  private async buildEnhancedContext(context: any, agentKey: string) {
    let enhancedContext = { ...context };
    
    // Add statistical analysis if data is available
    if (context.selectedLob?.hasData && context.selectedLob?.mockData) {
      const dataPoints: DataPoint[] = context.selectedLob.mockData.map((item: any) => ({
        date: new Date(item.Date),
        value: item.Value,
        orders: item.Orders
      }));

      // Generate statistical insights
      if (agentKey === 'eda' || agentKey === 'insights') {
        const values = dataPoints.map(d => d.value);
        const statisticalSummary = statisticalAnalyzer.calculateStatisticalSummary(values);
        const trendAnalysis = statisticalAnalyzer.analyzeTrend(dataPoints);
        const seasonalityAnalysis = statisticalAnalyzer.analyzeSeasonality(dataPoints);
        const qualityReport = insightsGenerator.generateDataQualityReport(dataPoints);

        enhancedContext.statisticalAnalysis = {
          summary: statisticalSummary,
          trend: trendAnalysis,
          seasonality: seasonalityAnalysis,
          quality: qualityReport
        };
      }
    }

    return enhancedContext;
  }

  private buildEnhancedSystemPrompt(context: any, agent: AgentConfig): string {
    const { selectedBu, selectedLob, statisticalAnalysis } = context;
    
    let dataContext = 'No data available';
    let statisticalContext = '';

    if (selectedLob?.hasData) {
      const dq = selectedLob.dataQuality;
      dataContext = `
DATA CONTEXT:
- Business Unit: ${selectedBu?.name || 'None'}
- Line of Business: ${selectedLob?.name || 'None'}
- Records: ${selectedLob.recordCount}
- Data Quality: ${dq?.completeness}%
- Trend: ${dq?.trend || 'stable'}
- Seasonality: ${dq?.seasonality?.replace(/_/g, ' ') || 'unknown'}
- Outliers: ${dq?.outliers || 0} detected`;

      // Add enhanced statistical context for relevant agents
      if (statisticalAnalysis && (agent.name.includes('Explorer') || agent.name.includes('Analyst'))) {
        const stats = statisticalAnalysis.summary;
        const trend = statisticalAnalysis.trend;
        const quality = statisticalAnalysis.quality;

        statisticalContext = `
ADVANCED STATISTICAL ANALYSIS:
- Mean: ${stats.mean.toFixed(2)}, Std Dev: ${stats.standardDeviation.toFixed(2)}
- Skewness: ${stats.skewness.toFixed(2)}, Kurtosis: ${stats.kurtosis.toFixed(2)}
- Trend Direction: ${trend.direction} (confidence: ${(trend.confidence * 100).toFixed(1)}%)
- Seasonality: ${statisticalAnalysis.seasonality.hasSeasonality ? 'Detected' : 'Not detected'}
- Data Quality Score: ${quality.score}/100
- Outliers: ${stats.outliers.values.length} detected (${(stats.outliers.values.length / selectedLob.recordCount * 100).toFixed(1)}%)
- R²: ${trend.linearRegression.rSquared.toFixed(3)}`;
      }
    }

    return `${agent.systemPrompt}

BUSINESS CONTEXT:
${dataContext}

${statisticalContext}

AGENT CAPABILITIES: ${agent.capabilities.join(', ')}

PERFORMANCE REQUIREMENTS:
- Provide specific, actionable insights
- Include confidence levels and statistical significance
- Focus on business impact and recommendations
- Use structured reporting for complex analyses
- Maintain professional yet accessible communication

Your specialty: ${agent.specialty}
Leverage your expertise to provide deep, meaningful, and statistically sound insights.`;
  }

  private generateComprehensiveReport(insights: any) {
    const sections: any = {};
    
    // Aggregate insights from all agents
    Object.keys(insights).forEach(agentKey => {
      const data = insights[agentKey];
      if (data.title) sections[agentKey] = data;
    });

    return {
      title: "Comprehensive Business Intelligence Analysis",
      executiveSummary: "Multi-agent analysis combining statistical insights, data quality assessment, forecasting, and strategic recommendations.",
      sections,
      overallRecommendations: this.synthesizeRecommendations(insights),
      confidence: this.calculateOverallConfidence(insights)
    };
  }

  private synthesizeRecommendations(insights: any): string[] {
    const allRecommendations: string[] = [];
    
    Object.values(insights).forEach((data: any) => {
      if (data.recommendations) {
        allRecommendations.push(...data.recommendations);
      }
    });

    // Remove duplicates and prioritize
    return Array.from(new Set(allRecommendations)).slice(0, 5);
  }

  private calculateOverallConfidence(insights: any): number {
    const confidenceScores: number[] = [];
    
    Object.values(insights).forEach((data: any) => {
      if (data.confidence) confidenceScores.push(data.confidence);
      if (data.qualityScore) confidenceScores.push(data.qualityScore / 100);
    });

    return confidenceScores.length > 0 
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length 
      : 0.5;
  }

  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      cacheStats: enhancedAPIClient.getCacheStats(),
      queueSize: enhancedAPIClient.getQueueSize()
    };
  }
}

let enhancedChatHandler: EnhancedMultiAgentChatHandler | null = null;

// Enhanced Chat Bubble with performance indicators
function EnhancedChatBubble({ 
  message, 
  onSuggestionClick, 
  onVisualizeClick,
  onGenerateReport,
  thinkingSteps,
  performance
}: { 
  message: ChatMessage;
  onSuggestionClick: (suggestion: string) => void;
  onVisualizeClick: (messageId: string) => void;
  onGenerateReport?: (messageId: string) => void;
  thinkingSteps: string[];
  performance?: any;
}) {
  const isUser = message.role === 'user';
  const agentInfo = message.agentType ? ENHANCED_AGENTS[message.agentType as keyof typeof ENHANCED_AGENTS] : null;
  const [showPerformance, setShowPerformance] = useState(false);

  return (
    <div className={cn('flex items-start gap-3 w-full', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <Avatar className="h-10 w-10">
          <AvatarFallback className={cn(
            "text-lg font-semibold",
            agentInfo?.color || "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
          )}>
            {agentInfo?.emoji || <Bot />}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn("max-w-4xl", isUser ? "order-1" : "")}>
        {/* Enhanced Agent Badge */}
        {!isUser && agentInfo && agentInfo.name !== 'BI Assistant' && (
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn("text-xs font-medium", agentInfo.color)}>
              <span className="mr-1">{agentInfo.emoji}</span>
              {agentInfo.name}
            </Badge>
            <span className="text-xs text-muted-foreground">• {agentInfo.specialty}</span>
            {performance && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setShowPerformance(!showPerformance)}
              >
                <Zap className="h-3 w-3 mr-1" />
                Performance
              </Button>
            )}
          </div>
        )}

        {/* Performance Metrics Display */}
        {showPerformance && performance && !isUser && (
          <Card className="mb-2 p-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Cache Hit Rate: {(performance.cacheHitRate * 100).toFixed(1)}%</div>
              <div>Avg Response: {performance.avgResponseTime}ms</div>
              <div>Requests: {performance.requestCount}</div>
              <div>Errors: {performance.errorCount}</div>
            </div>
          </Card>
        )}
        
        <div className={cn(
          'rounded-xl p-4 text-sm prose prose-sm max-w-none',
          'prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground',
          'prose-ul:text-foreground prose-li:text-foreground prose-code:text-foreground',
          isUser 
            ? 'bg-primary text-primary-foreground prose-headings:text-primary-foreground prose-p:text-primary-foreground prose-strong:text-primary-foreground' 
            : 'bg-muted/50 border'
        )}>
          {message.isTyping ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <span 
                      key={i}
                      className="h-2 w-2 animate-pulse rounded-full bg-current" 
                      style={{ animationDelay: `${delay}s` }} 
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">Enhanced AI processing...</span>
              </div>
              
              {/* Enhanced Thinking Steps with Progress */}
              {thinkingSteps.length > 0 && (
                <div className="space-y-2">
                  <Progress value={(thinkingSteps.length / 6) * 100} className="h-1" />
                  {thinkingSteps.map((step, i) => {
                    const isActive = i === thinkingSteps.length - 1;
                    return (
                      <div 
                        key={i} 
                        className="flex items-center gap-3 animate-in slide-in-from-left duration-300"
                        style={{ 
                          animationDelay: `${i * 100}ms`,
                          opacity: isActive ? 1 : 0.6
                        }}
                      >
                        {isActive ? (
                          <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        <span className={cn(
                          "text-xs transition-all duration-300",
                          isActive ? "text-foreground font-medium" : "text-muted-foreground/70"
                        )}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Detect and render table data */}
              {(() => {
                const content = message.content;
                
                // Check if content contains table-like data
                const tablePattern = /(?:Day|Date|Value|Forecast|Actual).*?\|[\s\S]*?\|/i;
                const hasTable = tablePattern.test(content);
                
                if (hasTable) {
                  // Extract table data
                  const lines = content.split('\n');
                  const tableLines = lines.filter(line => line.includes('|') && line.trim().length > 0);
                  
                  if (tableLines.length > 1) {
                    const headers = tableLines[0].split('|').map(h => h.trim()).filter(h => h);
                    const rows = tableLines.slice(1).map(line => 
                      line.split('|').map(cell => cell.trim()).filter(cell => cell)
                    ).filter(row => row.length > 0);
                    
                    const tableData = rows.map(row => {
                      const obj: any = {};
                      headers.forEach((header, i) => {
                        obj[header] = row[i] || '';
                      });
                      return obj;
                    });
                    
                    const nonTableContent = content.replace(tablePattern, '').trim();
                    
                    return (
                      <div className="space-y-3">
                        {nonTableContent && (
                          <div 
                            dangerouslySetInnerHTML={{ 
                              __html: nonTableContent
                                .replace(/\[WORKFLOW_PLAN\][\s\S]*?\[\/WORKFLOW_PLAN\]/, '')
                                .replace(/\[REPORT_DATA\][\s\S]*?\[\/REPORT_DATA\]/, '')
                                .replace(/## (.*?)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2 text-foreground">$1</h3>')
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                                .replace(/• (.*?)(?=\n|$)/g, '<li class="ml-4">$1</li>')
                                .replace(/\n/g, '<br />') 
                            }} 
                          />
                        )}
                        <TableSnippet 
                          title="Forecast Results" 
                          data={tableData}
                          maxRows={5}
                        />
                      </div>
                    );
                  }
                }
                
                // Regular content rendering
                return (
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: content
                        .replace(/\[WORKFLOW_PLAN\][\s\S]*?\[\/WORKFLOW_PLAN\]/, '')
                        .replace(/\[REPORT_DATA\][\s\S]*?\[\/REPORT_DATA\]/, '')
                        .replace(/## (.*?)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2 text-foreground">$1</h3>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                        .replace(/• (.*?)(?=\n|$)/g, '<li class="ml-4">$1</li>')
                        .replace(/\n/g, '<br />') 
                    }} 
                  />
                );
              })()}
            </div>
          )}
        </div>
        
        {/* Enhanced Visualization Display */}
        {message.visualization?.isShowing && message.visualization.data && (
          <div className="mt-3 rounded-lg border bg-card p-3">
            <DataVisualizer 
              data={message.visualization.data} 
              target={message.visualization.target as 'Value' | 'Orders'}
              isRealData={true}
            />
          </div>
        )}
        
        {/* Enhanced Action Buttons */}
        <div className="mt-3 space-y-2">
          {/* Suggestions */}
          {message.suggestions && message.suggestions.length > 0 && (
            <div className="bg-muted/20 rounded-lg p-3">
              <div className="text-xs font-medium mb-2 text-muted-foreground flex items-center gap-1">
                <Brain className="h-3 w-3" />
                Suggested Next Steps
              </div>
              <div className="flex flex-wrap gap-2">
                {message.suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => onSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {message.visualization && !message.visualization.isShowing && (
              <Button size="sm" variant="outline" onClick={() => onVisualizeClick(message.id)}>
                <BarChart className="mr-2 h-3 w-3" />
                Visualize Data
              </Button>
            )}
            {message.canGenerateReport && onGenerateReport && (
              <Button 
                size="sm" 
                variant="default" 
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" 
                onClick={() => onGenerateReport(message.id)}
              >
                <FileText className="mr-2 h-3 w-3" />
                Generate Report
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback><User /></AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

// Main Enhanced Chat Panel Component
export default function EnhancedChatPanel({ className }: { className?: string }) {
  const { state, dispatch } = useApp();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [showAPISettings, setShowAPISettings] = useState(false);

  // Initialize enhanced chat handler
  if (!enhancedChatHandler) {
    enhancedChatHandler = new EnhancedMultiAgentChatHandler(dispatch);
  }
  
  // Auto-scroll to bottom
  useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement) {
      scrollElement.scrollTo({ top: scrollElement.scrollHeight, behavior: 'smooth' });
    }
  }, [state.messages]);

  // Handle queued prompts
  useEffect(() => {
    if (state.queuedUserPrompt) {
      submitMessage(state.queuedUserPrompt);
      dispatch({ type: 'CLEAR_QUEUED_PROMPT' });
    }
  }, [state.queuedUserPrompt]);

  // File upload handler with validation
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(fileExtension)) {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Please upload a CSV or Excel file (.csv, .xlsx, .xls)',
          agentType: 'general'
        }
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'File size must be less than 10MB',
          agentType: 'general'
        }
      });
      return;
    }

    if (state.selectedLob) {
      dispatch({ type: 'UPLOAD_DATA', payload: { lobId: state.selectedLob.id, file } });
    } else {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Please select a Line of Business before uploading data.',
          agentType: 'onboarding'
        }
      });
    }
  };

  // Enhanced submit message handler
  const submitMessage = async (messageText: string) => {
    if (!messageText.trim()) return;
    
    dispatch({ type: 'SET_PROCESSING', payload: true });
    dispatch({ type: 'CLEAR_THINKING_STEPS' });

    // Add user message
    dispatch({ 
      type: 'ADD_MESSAGE', 
      payload: {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText,
      }
    });

    // Add enhanced typing indicator
    dispatch({ 
      type: 'ADD_MESSAGE', 
      payload: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        isTyping: true,
      }
    });

    try {
      const result = await enhancedChatHandler!.generateEnhancedResponse(messageText, {
        selectedBu: state.selectedBu,
        selectedLob: state.selectedLob,
        businessUnits: state.businessUnits,
        userPrompt: messageText,
        conversationHistory: state.messages.slice(-5) // Recent context
      });

      const { response: responseText, agentType, reportData, performance: perfMetrics, multiAgent } = result;
      setPerformance(perfMetrics);

      dispatch({ type: 'SET_PROCESSING', payload: false });

      // Enhanced suggestion parsing
      const suggestionMatch = responseText.match(/\*\*(?:What can you do next\?|Next Steps?:?|Suggested Actions:?)\*\*([\s\S]*?)(?=\n\n|\n$|$)/i);
      let content = responseText;
      let suggestions: string[] = [];

      if (suggestionMatch?.[1]) {
        content = responseText.replace(/\*\*(?:What can you do next\?|Next Steps?:?|Suggested Actions:?)\*\*([\s\S]*?)(?=\n\n|\n$|$)/i, '').trim();
        suggestions = suggestionMatch[1]
          .split(/[\n•-]/)
          .map(s => s.trim().replace(/^"|"$/g, ''))
          .filter(s => s.length > 5 && s.length < 100)
          .slice(0, 4);
      }

      // Smart workflow-based suggestions
      if (suggestions.length === 0) {
        const { hasEDA, hasForecasting, hasInsights } = state.analyzedData;
        
        if (!state.selectedLob) {
          suggestions = [
            "Get started with onboarding",
            "Upload your sales data", 
            "Show me a sample analysis",
            "How do I generate a forecast?"
          ];
        } else if (!state.selectedLob.hasData) {
          suggestions = [
            "Upload your data file",
            "Download data template",
            "Learn about data requirements",
            "View sample dataset"
          ];
        } else if (agentType === 'onboarding') {
          suggestions = [
            "Explore my data (EDA)",
            "Check data quality",
            "View data summary",
            "Plan analysis workflow"
          ];
        } else if (agentType === 'eda' || (!hasEDA && !hasForecasting && !hasInsights)) {
          suggestions = [
            "Clean and preprocess data",
            "Generate forecasts",
            "Compare different periods",
            "Identify patterns and trends"
          ];
        } else if (agentType === 'preprocessing') {
          suggestions = [
            "Train forecasting models",
            "Validate data quality",
            "Feature engineering",
            "Check for outliers"
          ];
        } else if (agentType === 'modeling') {
          suggestions = [
            "Validate model performance",
            "Generate forecasts",
            "Compare model accuracy",
            "Export model results"
          ];
        } else if (agentType === 'validation') {
          suggestions = [
            "Generate business forecasts",
            "Create performance report",
            "Deploy model",
            "Set up monitoring"
          ];
        } else if (agentType === 'forecasting') {
          suggestions = [
            "Generate business insights",
            "Run what-if scenarios",
            "Compare forecast periods",
            "Export forecast results"
          ];
        } else if (agentType === 'insights') {
          suggestions = [
            "Create comprehensive report",
            "Run comparative analysis",
            "Explore different scenarios",
            "Schedule regular updates"
          ];
        } else if (multiAgent) {
          suggestions = [
            "Generate comprehensive report",
            "Run what-if analysis",
            "Compare different scenarios",
            "Export complete results"
          ];
        } else {
          // Default based on current analysis state
          if (!hasEDA) {
            suggestions = ["Explore data patterns", "Check data quality", "Analyze trends", "Identify outliers"];
          } else if (!hasForecasting) {
            suggestions = ["Generate forecasts", "Train models", "Predict future values", "Validate predictions"];
          } else if (!hasInsights) {
            suggestions = ["Generate insights", "Business recommendations", "Risk analysis", "Opportunity identification"];
          } else {
            suggestions = ["Create final report", "Export results", "New analysis", "Compare scenarios"];
          }
        }
      }

      // Enhanced visualization detection
      const shouldVisualize = state.selectedLob?.hasData && state.selectedLob?.mockData && 
        (/(visuali[sz]e|chart|plot|graph|trend|distribution|eda|explore)/i.test(messageText + content) ||
         (agentType === 'eda' && /pattern|trend|seasonality|statistical/i.test(content)));

      let visualization: { data: WeeklyData[]; target: "Value" | "Orders"; isShowing: boolean } | undefined;
      if (shouldVisualize) {
        const isRevenue = /(revenue|sales|amount|gmv|income|value)/i.test(messageText + content);
        visualization = {
          data: state.selectedLob!.mockData!,
          target: isRevenue ? 'Value' : 'Orders',
          isShowing: false,
        };
      }

      // Track analysis completion for dynamic insights
      if (agentType === 'eda' || multiAgent) {
        dispatch({ type: 'SET_ANALYZED_DATA', payload: { hasEDA: true, lastAnalysisType: 'eda' } });
      }
      if (agentType === 'forecasting' || multiAgent) {
        dispatch({ type: 'SET_ANALYZED_DATA', payload: { hasForecasting: true, lastAnalysisType: 'forecasting' } });
        // Add forecast data to the selected LOB
        dispatch({ type: 'ADD_FORECAST_DATA' });
      }
      if (agentType === 'insights' || agentType === 'validation' || multiAgent) {
        dispatch({ type: 'SET_ANALYZED_DATA', payload: { hasInsights: true, lastAnalysisType: agentType } });
      }

      // Update message with enhanced features
      dispatch({ 
        type: 'UPDATE_LAST_MESSAGE', 
        payload: {
          content,
          suggestions,
          isTyping: false,
          visualization,
          agentType,
          canGenerateReport: !!reportData || multiAgent,
          reportData
        }
      });

    } catch (error) {
      console.error("Enhanced AI Error:", error);
      dispatch({ 
        type: 'UPDATE_LAST_MESSAGE', 
        payload: {
          content: `⚠️ ${error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'}`,
          isTyping: false,
          agentType: 'general',
          suggestions: ['Try a simpler query', 'Check your connection', 'Upload data first']
        }
      });
      dispatch({ type: 'SET_PROCESSING', payload: false });
    }
  };

  // Rest of the component remains similar with enhanced UI elements
  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userInput = formData.get('message') as string;
    e.currentTarget.reset();
    submitMessage(userInput);
  };

  const handleSuggestionClick = (suggestion: string) => {
    submitMessage(suggestion);
  };
  
  const handleVisualizeClick = (messageId: string) => {
    const msg = state.messages.find(m => m.id === messageId);
    const target = msg?.visualization?.target === "Orders" ? "units" : "revenue";
    dispatch({ type: 'SET_DATA_PANEL_TARGET', payload: target });
    dispatch({ type: 'SET_DATA_PANEL_MODE', payload: 'chart' });
    dispatch({ type: 'SET_DATA_PANEL_OPEN', payload: true });
    dispatch({ type: 'TOGGLE_VISUALIZATION', payload: { messageId } });
  };

  const handleGenerateReport = (messageId: string) => {
    const msg = state.messages.find(m => m.id === messageId);
    if (msg?.reportData && msg.agentType) {
      dispatch({ 
        type: 'GENERATE_REPORT', 
        payload: {
          messageId,
          reportData: msg.reportData,
          agentType: msg.agentType,
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  const isAssistantTyping = state.isProcessing || state.messages[state.messages.length - 1]?.isTyping;

  return (
    <>
      <Card className={cn('flex flex-col h-full border-0 shadow-none rounded-none', className)}>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1" ref={scrollAreaRef}>
              <div className="p-6 space-y-6">
                {state.messages.map(message => (
                  <EnhancedChatBubble 
                    key={message.id} 
                    message={message} 
                    onSuggestionClick={handleSuggestionClick}
                    onVisualizeClick={() => handleVisualizeClick(message.id)}
                    onGenerateReport={handleGenerateReport}
                    thinkingSteps={state.thinkingSteps}
                    performance={performance}
                  />
                ))}
              </div>
            </ScrollArea>
            
            <div className="border-t p-2 bg-card/50 backdrop-blur-sm">
              <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
                <div className="flex items-end gap-3">
                  <Textarea
                    className="flex-1 min-h-[80px] resize-none bg-background/80"
                    name="message"
                    placeholder="Ask about data exploration, forecasting, business insights, or get started with onboarding..."
                    autoComplete="off"
                    disabled={isAssistantTyping}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const form = e.currentTarget.closest('form');
                        if (form) {
                          const formData = new FormData(form);
                          const userInput = formData.get('message') as string;
                          if (userInput.trim()) {
                            form.reset();
                            submitMessage(userInput);
                          }
                        }
                      }
                    }}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={isAssistantTyping}
                    className="h-[80px] w-12 shrink-0"
                  >
                    <Send className="h-2 w-5" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload data (CSV, Excel)"
                      disabled={isAssistantTyping}
                    >
                      <Paperclip className="h-4 w-4 mr-1" />
                      Upload Data
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      type="button" 
                      onClick={() => dispatch({ type: 'SET_DATA_PANEL_OPEN', payload: true })}
                      title="Open insights panel"
                      disabled={isAssistantTyping}
                    >
                      <BarChart className="h-4 w-4 mr-1" />
                      Insights Panel
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      type="button" 
                      onClick={() => setShowAPISettings(true)}
                      title="API Settings"
                      disabled={isAssistantTyping}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Settings
                    </Button>
                  </div>
                  
                  {performance && (
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" />
                      Cache: {(performance.cacheHitRate * 100).toFixed(0)}% | 
                      Avg: {performance.avgResponseTime}ms
                    </div>
                  )}
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                />
              </form>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Dialog 
        open={state.agentMonitor.isOpen} 
        onOpenChange={(isOpen) => dispatch({ type: 'SET_AGENT_MONITOR_OPEN', payload: isOpen })}
      >
        <DialogContent className="max-w-6xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Enhanced Agent Intelligence Monitor
            </DialogTitle>
          </DialogHeader>
          <EnhancedAgentMonitor className="flex-1 min-h-0" />
        </DialogContent>
      </Dialog>

      <APISettingsDialog 
        open={showAPISettings}
        onOpenChange={setShowAPISettings}
      />
    </>
  );
}