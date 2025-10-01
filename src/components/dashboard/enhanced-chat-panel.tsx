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
import { useApp } from './app-provider';
import type { ChatMessage, WeeklyData, WorkflowStep } from '@/lib/types';
import { cn } from '@/lib/utils';
import EnhancedAgentMonitor from './enhanced-agent-monitor';
import DataVisualizer from './data-visualizer';
import { enhancedAPIClient, validateChatMessage, sanitizeUserInput } from '@/lib/enhanced-api-client';
import { statisticalAnalyzer, insightsGenerator, type DataPoint } from '@/lib/statistical-analysis';
import { dynamicInsightsAnalyzer } from '@/lib/dynamic-insights-analyzer';
import { followUpQuestionsService, type FollowUpQuestion, type AnalysisRequirements, type UserResponse } from '@/lib/follow-up-questions';
import FollowUpQuestionsDialog from './follow-up-questions-dialog';
import APISettingsDialog from './api-settings-dialog';
import { chatCommandProcessor } from '@/lib/chat-command-processor';
import { agentResponseGenerator } from '@/lib/agent-response-generator';

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
    systemPrompt: `You are a data exploration specialist who explains data insights in simple, business-friendly language.

CORE RESPONSIBILITIES:
- Analyze data patterns and quality in easy-to-understand terms
- Focus ONLY on what the user specifically asked about
- Explain findings in business language, not technical jargon
- Provide practical insights customers can act on

RESPONSE APPROACH:
1. Directly answer what the user asked (data quality, patterns, exploration)
2. Use simple language - assume user is not a data scientist
3. Focus on business implications, not statistical complexity
4. Only mention technical metrics if the user specifically asks

WHAT TO INCLUDE:
- Data overview (how much data, time period covered)
- Key patterns visible in the data (trends, seasonality in plain English)
- Data quality assessment (missing data, unusual values)
- Simple actionable insights for business decisions

WHAT TO AVOID:
- Technical statistical terms without explanation
- Forecasting details unless user asked for forecasts
- Complex metrics (MAPE, RMSE) unless user is technical
- Model training details unless user asked about models

Include structured insights:
[REPORT_DATA]
{
  "title": "Data Exploration Summary",
  "keyFindings": ["Business insight 1", "Data pattern 2", "Quality observation 3"],
  "dataOverview": {"records": "count", "timeSpan": "period", "quality": "good/fair/needs attention"},
  "businessInsights": ["Actionable insight 1", "Business opportunity 2"],
  "nextSteps": ["What to do next 1", "Business action 2"]
}
[/REPORT_DATA]

Focus on helping the customer understand their data for better business decisions.`
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
    systemPrompt: `You are a business forecasting specialist who creates predictions in simple, actionable terms.

CORE RESPONSIBILITIES:
- Generate forecasts ONLY when user specifically requests predictions
- Explain forecast results in business-friendly language
- Focus on practical implications for business planning
- Provide clear next steps based on forecast insights

RESPONSE APPROACH:
1. Answer exactly what the user asked about forecasting
2. Use simple language - explain what the numbers mean for business
3. Focus on business planning implications
4. Provide confidence levels in plain English (high, medium, low confidence)

FORECASTING FOCUS:
- What the forecast predicts for the business
- How confident we are in the prediction
- What business actions the forecast suggests
- Key factors that could affect the forecast
- When to update or review the forecast

BUSINESS LANGUAGE:
- "Expected increase/decrease" instead of "point forecast"
- "High confidence" instead of "95% confidence interval"
- "Business impact" instead of technical metrics
- "Recommended actions" instead of statistical recommendations

[REPORT_DATA]
{
  "title": "Business Forecast Summary", 
  "forecastPeriod": "user requested timeframe",
  "expectedOutcome": {"direction": "increase/decrease/stable", "magnitude": "low/medium/high"},
  "confidence": "high/medium/low with plain English explanation",
  "businessImpact": ["What this means for your business"],
  "recommendedActions": ["Specific business actions to take"]
}
[/REPORT_DATA]

Focus on helping customers make better business decisions with forecast insights.`
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
    systemPrompt: `You are a business advisor who translates data analysis into practical business insights.

CORE RESPONSIBILITIES:
- Provide business insights ONLY based on what the user has asked and analyzed so far
- Explain findings in terms of business opportunities and actions
- Focus on practical recommendations the customer can implement
- Connect data patterns to real business decisions

RESPONSE APPROACH:
1. Only discuss insights relevant to the user's specific questions
2. Translate data findings into business opportunities
3. Provide specific, actionable recommendations
4. Focus on practical next steps the business can take

BUSINESS FOCUS:
- What the data reveals about business performance
- Opportunities to improve or grow the business
- Potential risks or issues to address
- Specific actions to take based on the findings
- How to monitor progress and results

CONTEXT AWARENESS:
- If user only asked about data quality → focus on data improvement recommendations
- If user explored patterns → focus on business implications of those patterns
- If user requested forecasts → focus on planning and preparation recommendations
- Always match the scope of insights to what was actually analyzed

[REPORT_DATA]
{
  "title": "Business Insights Summary",
  "analysisScope": "what the user actually asked about",
  "keyFindings": ["Business-relevant discoveries from the analysis"],
  "opportunities": ["Specific business opportunities identified"],
  "recommendations": ["Actionable steps the business can take"],
  "nextActions": ["Immediate next steps for the business"]
}
[/REPORT_DATA]

Focus on practical business value from the specific analysis the user requested.`
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

  // Enhanced agent selection - more precise based on user intent
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
        { id: 'step-1', name: 'Business Setup', status: 'pending', dependencies: [], estimatedTime: '2m', details: 'Select Business Unit and Line of Business', agent: 'Onboarding Guide' }
      ];
    }
    // Data exploration only (no forecasting unless specifically requested)
    else if (/(explore|eda|data quality|pattern|distribution|statistics)/i.test(lowerMessage) && !/(forecast|predict|future)/i.test(lowerMessage)) {
      selectedAgents.push('eda');
      reasoning = 'Data exploration and analysis requested';
      workflow = [
        { id: 'step-1', name: 'Data Exploration', status: 'pending', dependencies: [], estimatedTime: '30s', details: 'Analyze data patterns and quality', agent: 'Data Explorer' }
      ];
    }
    // COMPLETE FORECASTING WORKFLOW - Full ML Pipeline
    else if (/(forecast|predict|future|projection|run.*forecast)/i.test(lowerMessage)) {
      selectedAgents.push('eda', 'preprocessing', 'modeling', 'validation', 'forecasting', 'insights');
      reasoning = 'Complete forecasting pipeline initiated - EDA → Preprocessing → ML Training → Testing → Evaluation → Forecasting → Dashboard';
      workflow = [
        { id: 'step-1', name: 'Data Analysis (EDA)', status: 'pending', dependencies: [], estimatedTime: '30s', details: 'Analyzing patterns, trends, and data quality', agent: 'Data Explorer' },
        { id: 'step-2', name: 'Data Preprocessing', status: 'pending', dependencies: ['step-1'], estimatedTime: '25s', details: 'Cleaning data, handling missing values, feature engineering', agent: 'Data Engineer' },
        { id: 'step-3', name: 'Model Training', status: 'pending', dependencies: ['step-2'], estimatedTime: '90s', details: 'Training ML models (XGBoost, Prophet, LSTM)', agent: 'ML Engineer' },
        { id: 'step-4', name: 'Model Testing & Evaluation', status: 'pending', dependencies: ['step-3'], estimatedTime: '30s', details: 'Testing accuracy and calculating MAPE, RMSE, R² scores', agent: 'Model Validator' },
        { id: 'step-5', name: 'Generate Forecast', status: 'pending', dependencies: ['step-4'], estimatedTime: '35s', details: 'Creating 30-day forecast with confidence intervals', agent: 'Forecast Analyst' },
        { id: 'step-6', name: 'Dashboard Generation', status: 'pending', dependencies: ['step-5'], estimatedTime: '15s', details: 'Preparing visualizations and business insights', agent: 'Business Analyst' }
      ];
    }
    // Business insights specifically requested
    else if (/(business insight|recommendation|strategy|opportunity)/i.test(lowerMessage) && !/(forecast|explore)/i.test(lowerMessage)) {
      selectedAgents.push('insights');
      reasoning = 'Business insights and recommendations requested';
      workflow = [
        { id: 'step-1', name: 'Business Analysis', status: 'pending', dependencies: [], estimatedTime: '30s', details: 'Generate business insights', agent: 'Business Analyst' }
      ];
    }
    // Complete workflow only when specifically requested
    else if (/(complete analysis|comprehensive|end to end|full workflow)/i.test(lowerMessage)) {
      selectedAgents.push('eda', 'forecasting', 'insights');
      reasoning = 'Complete analysis workflow requested';
      workflow = [
        { id: 'step-1', name: 'Data Exploration', status: 'pending', dependencies: [], estimatedTime: '30s', details: 'Analyze data patterns', agent: 'Data Explorer' },
        { id: 'step-2', name: 'Forecast Generation', status: 'pending', dependencies: ['step-1'], estimatedTime: '45s', details: 'Generate forecasts', agent: 'Forecast Analyst' },
        { id: 'step-3', name: 'Business Insights', status: 'pending', dependencies: ['step-2'], estimatedTime: '30s', details: 'Strategic recommendations', agent: 'Business Analyst' }
      ];
    }
    // Individual agent selection as fallback
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

    // Analyze user intent and update conversation context
    const intentAnalysis = dynamicInsightsAnalyzer.analyzeUserIntent(sanitizedMessage);
    this.dispatch({
      type: 'UPDATE_CONVERSATION_CONTEXT',
      payload: {
        topics: [...new Set([...(context.conversationContext?.topics || []), ...intentAnalysis.topics])],
        currentPhase: intentAnalysis.phase,
        userIntent: intentAnalysis.intent
      }
    });

    // Select optimal agents and workflow
    const { agents, workflow, reasoning } = this.selectOptimalAgents(sanitizedMessage, context);
    
    // ALWAYS set workflow so drawer shows progress
    this.dispatch({ type: 'SET_WORKFLOW', payload: workflow });

    let finalResponse = '';
    let finalReportData = null;
    let finalAgentType = 'general';
    let aggregatedInsights: any = {};

    for (let i = 0; i < agents.length; i++) {
      const agentKey = agents[i];
      const currentStepId = workflow[i]?.id;
      
      this.currentAgent = agentKey;
      finalAgentType = agentKey;
      const agent = ENHANCED_AGENTS[agentKey];
      
      // Mark current step as ACTIVE
      if (currentStepId) {
        this.dispatch({ 
          type: 'UPDATE_WORKFLOW_STEP', 
          payload: { id: currentStepId, status: 'active' } 
        });
      }
      
      try {
        this.dispatch({ type: 'ADD_THINKING_STEP', payload: `${agent.emoji} ${agent.name} analyzing...` });

        // Enhanced context building with statistical analysis
        const enhancedContext = await this.buildEnhancedContext(context, agentKey);
        const systemPrompt = this.buildEnhancedSystemPrompt(enhancedContext, agent);

        this.conversationHistory.push({ role: "user", content: sanitizedMessage });

        const completion = await enhancedAPIClient.createChatCompletion({
          model: undefined, // Let the client choose the appropriate model based on provider
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

        // Mark current step as COMPLETED and update analyzed data
        if (currentStepId) {
          this.dispatch({ 
            type: 'UPDATE_WORKFLOW_STEP', 
            payload: { id: currentStepId, status: 'completed' } 
          });
          
          // Track what analysis has been completed
          const analysisUpdate: any = {};
          if (agentKey === 'eda') {
            analysisUpdate.hasEDA = true;
            analysisUpdate.availableCharts = ['trend', 'distribution', 'seasonality'];
          } else if (agentKey === 'preprocessing') {
            analysisUpdate.hasPreprocessing = true;
          } else if (agentKey === 'forecasting') {
            analysisUpdate.hasForecasting = true;
            analysisUpdate.availableCharts = [...(analysisUpdate.availableCharts || []), 'forecast', 'confidence'];
          } else if (agentKey === 'insights') {
            analysisUpdate.hasInsights = true;
          }
          
          if (Object.keys(analysisUpdate).length > 0) {
            this.dispatch({ type: 'UPDATE_ANALYZED_DATA', payload: analysisUpdate });
          }
        }

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

        await new Promise(resolve => setTimeout(resolve, 500));
        this.conversationHistory.push({ role: "assistant", content: aiResponse });

      } catch (error) {
        console.error(`${agent.name} Error:`, error);
        this.performanceMetrics.errorCount++;
        
        // Mark current step as ERROR
        if (currentStepId) {
          this.dispatch({ 
            type: 'UPDATE_WORKFLOW_STEP', 
            payload: { id: currentStepId, status: 'error' } 
          });
        }
        
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        
        // Check if this is an API key configuration error
        if (errorMessage.includes('🔑') || errorMessage.includes('API key')) {
          finalResponse += `## ${agent.name}\n${errorMessage}\n\n**Quick Fix Options:**\n• Click the Settings button below to configure your API keys\n• Both OpenAI and OpenRouter keys are supported\n• The system will automatically use the working provider\n\n`;
          
          // Add a suggestion to open settings
          this.dispatch({ 
            type: 'ADD_THINKING_STEP', 
            payload: '⚙️ API configuration required - please check Settings' 
          });
        } else {
          finalResponse += `## ${agent.name}\n⚠️ ${errorMessage}\n\n**Troubleshooting:**\n• Check your internet connection\n• Try again in a moment\n• Contact support if the issue persists\n\n`;
        }
        
        // If all agents are failing due to API issues, break early
        if (errorMessage.includes('🔑')) {
          break;
        }
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
            <div 
              dangerouslySetInnerHTML={{ 
                __html: message.content
                  .replace(/\[WORKFLOW_PLAN\][\s\S]*?\[\/WORKFLOW_PLAN\]/, '')
                  .replace(/\[REPORT_DATA\][\s\S]*?\[\/REPORT_DATA\]/, '')
                  // Headers
                  .replace(/### (.*?)$/gm, '<h4 class="text-sm font-semibold mt-3 mb-2 text-foreground">$1</h4>')
                  .replace(/## (.*?)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2 text-foreground">$1</h3>')
                  .replace(/# (.*?)$/gm, '<h2 class="text-lg font-bold mt-4 mb-3 text-foreground">$1</h2>')
                  // Bold text
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
                  // Tables - convert simple markdown tables
                  .replace(/\|(.*?)\|/g, (match, content) => {
                    const cells = content.split('|').map(cell => `<td class="border px-2 py-1 text-xs">${cell.trim()}</td>`).join('');
                    return `<tr>${cells}</tr>`;
                  })
                  // Numbered lists
                  .replace(/^(\d+)\.\s+(.*?)$/gm, '<div class="flex gap-2 my-1"><span class="text-primary font-medium min-w-[20px]">$1.</span><span>$2</span></div>')
                  // Bullet points - better formatting
                  .replace(/^[•\-\*]\s+(.*?)$/gm, '<div class="flex gap-2 my-1"><span class="text-primary">•</span><span>$1</span></div>')
                  // Nested bullet points
                  .replace(/^\s+[•\-\*]\s+(.*?)$/gm, '<div class="flex gap-2 my-1 ml-4"><span class="text-muted-foreground">◦</span><span class="text-sm">$1</span></div>')
                  // Code blocks
                  .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>')
                  // Percentages and numbers highlighting
                  .replace(/(\d+\.?\d*%)/g, '<span class="font-semibold text-green-600 dark:text-green-400">$1</span>')
                  .replace(/(\$[\d,]+)/g, '<span class="font-semibold text-blue-600 dark:text-blue-400">$1</span>')
                  // Line breaks
                  .replace(/\n\n/g, '</p><p class="mb-2">')
                  .replace(/\n/g, '<br />')
                  // Wrap in paragraphs
                  .replace(/^/, '<p class="mb-2">')
                  .replace(/$/, '</p>')
              }} 
            />
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
          {/* API Setup Notice */}
          {(message as any).requiresAPISetup && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-3">
              <div className="flex items-start gap-3">
                <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    🔑 API Configuration Required
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                    To use the AI-powered analysis features, please configure at least one API provider:
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => onSuggestionClick('Open API Settings')}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Configure API Keys
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                    variant={suggestion.includes('API') || suggestion.includes('Settings') ? 'default' : 'outline'}
                    className={cn(
                      "text-xs h-7",
                      suggestion.includes('API') || suggestion.includes('Settings') && "bg-blue-600 hover:bg-blue-700 text-white"
                    )}
                    onClick={() => onSuggestionClick(suggestion)}
                  >
                    {suggestion.includes('Settings') && <Settings className="h-3 w-3 mr-1" />}
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
  const [showFollowUpQuestions, setShowFollowUpQuestions] = useState(false);
  const [followUpRequirements, setFollowUpRequirements] = useState<AnalysisRequirements | null>(null);
  const [pendingUserMessage, setPendingUserMessage] = useState<string>('');
  const [questionResponses, setQuestionResponses] = useState<Map<string, any>>(new Map());

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

  // Handle chat commands for BU/LOB creation and data upload
  const handleChatCommand = async (command: any, originalMessage: string) => {
    // Add user message first
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: crypto.randomUUID(),
        role: 'user',
        content: originalMessage
      }
    });

    switch (command.intent) {
      case 'create_bu':
        await handleBUCreationCommand(command, originalMessage);
        break;
      case 'create_lob':
        await handleLOBCreationCommand(command, originalMessage);
        break;
      case 'provide_info':
        await handleInfoProvisionCommand(command, originalMessage);
        break;
      case 'upload_data':
        await handleDataUploadCommand(command, originalMessage);
        break;
      default:
        // Fallback to normal processing
        await continueWithAnalysis(originalMessage);
    }
  };

  // Handle BU creation through chat
  const handleBUCreationCommand = async (command: any, originalMessage: string) => {
    const conversationState = chatCommandProcessor.startConversation('create_bu', 'default');
    
    // Extract any provided information from the command
    if (command.parameters.name) {
      chatCommandProcessor.updateConversation('default', 'name', command.parameters.name);
    }
    if (command.parameters.description) {
      chatCommandProcessor.updateConversation('default', 'description', command.parameters.description);
    }

    // Generate next question or complete creation
    if (chatCommandProcessor.isConversationComplete('default')) {
      const buData = chatCommandProcessor.getConversationData('default') as any;
      
      // Set default values for missing fields
      const completeData = {
        name: buData.name,
        description: buData.description || `Business Unit for ${buData.name}`,
        code: buData.code || buData.name.toUpperCase().replace(/\s+/g, '_'),
        displayName: buData.displayName || buData.name,
        startDate: buData.startDate || new Date()
      };

      // Create the BU
      dispatch({ type: 'ADD_BU', payload: completeData });
      chatCommandProcessor.clearConversation('default');

      // Generate professional success response
      const response = await agentResponseGenerator.generateResponse({
        intent: 'bu_created',
        data: {
          ...completeData,
          totalBUs: state.businessUnits.length + 1
        }
      });

      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.content,
          suggestions: response.nextActions.map(action => action.text),
          agentType: 'onboarding'
        }
      });
    } else {
      // Ask for missing information
      const nextQuestion = chatCommandProcessor.generateNextQuestion('default');
      
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `✅ **Creating Business Unit**\n\n${nextQuestion}`,
          agentType: 'onboarding'
        }
      });
    }
  };

  // Handle LOB creation through chat
  const handleLOBCreationCommand = async (command: any, originalMessage: string) => {
    if (state.businessUnits.length === 0) {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `❌ **No Business Units Available**\n\nYou need to create a Business Unit first before adding Lines of Business.\n\nWould you like me to help you create a Business Unit?`,
          suggestions: ['Create Business Unit', 'Help me get started'],
          agentType: 'onboarding'
        }
      });
      return;
    }

    const conversationState = chatCommandProcessor.startConversation('create_lob', 'default');
    
    // Extract any provided information from the command
    if (command.parameters.name) {
      chatCommandProcessor.updateConversation('default', 'name', command.parameters.name);
    }
    if (command.parameters.description) {
      chatCommandProcessor.updateConversation('default', 'description', command.parameters.description);
    }

    // Generate next question or complete creation
    if (chatCommandProcessor.isConversationComplete('default')) {
      const lobData = chatCommandProcessor.getConversationData('default') as any;
      
      // Handle business unit selection
      let businessUnitId = lobData.businessUnitId;
      if (businessUnitId && businessUnitId.startsWith('option_')) {
        const optionIndex = parseInt(businessUnitId.replace('option_', '')) - 1;
        businessUnitId = state.businessUnits[optionIndex]?.id;
      }

      const completeData = {
        name: lobData.name,
        description: lobData.description || `Line of Business for ${lobData.name}`,
        code: lobData.code || lobData.name.toUpperCase().replace(/\s+/g, '_'),
        businessUnitId: businessUnitId || state.businessUnits[0].id,
        startDate: lobData.startDate || new Date()
      };

      // Create the LOB
      dispatch({ type: 'ADD_LOB', payload: completeData });
      chatCommandProcessor.clearConversation('default');

      // Generate professional success response
      const parentBU = state.businessUnits.find(bu => bu.id === completeData.businessUnitId);
      const response = await agentResponseGenerator.generateResponse({
        intent: 'lob_created',
        data: {
          ...completeData,
          parentBUName: parentBU?.name || 'Selected Business Unit',
          totalLOBs: state.businessUnits.reduce((total, bu) => total + bu.lobs.length, 0) + 1
        }
      });

      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.content,
          suggestions: response.nextActions.map(action => action.text),
          agentType: 'onboarding'
        }
      });
    } else {
      // Ask for missing information
      const nextQuestion = chatCommandProcessor.generateNextQuestion('default', state.businessUnits);
      
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `✅ **Creating Line of Business**\n\n${nextQuestion}`,
          agentType: 'onboarding'
        }
      });
    }
  };

  // Handle information provision in ongoing conversations
  const handleInfoProvisionCommand = async (command: any, originalMessage: string) => {
    const conversationState = chatCommandProcessor.getConversationState('default');
    
    if (!conversationState) {
      // No ongoing conversation, process normally
      await continueWithAnalysis(originalMessage);
      return;
    }

    // Update conversation with provided information
    const entity = command.entities[0];
    if (entity) {
      chatCommandProcessor.updateConversation('default', entity.type, entity.value);
    }

    // Continue with the appropriate creation flow
    if (conversationState.currentIntent === 'create_bu') {
      await handleBUCreationCommand(command, originalMessage);
    } else if (conversationState.currentIntent === 'create_lob') {
      await handleLOBCreationCommand(command, originalMessage);
    }
  };

  // Handle data upload through chat
  const handleDataUploadCommand = async (command: any, originalMessage: string) => {
    if (!state.selectedLob) {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `❌ **No Line of Business Selected**\n\nPlease select a Line of Business first before uploading data.\n\nYou can:\n• Select an existing LOB from the dropdown\n• Create a new LOB by saying "create line of business"`,
          suggestions: ['Create Line of Business', 'Help me select LOB'],
          agentType: 'onboarding'
        }
      });
      return;
    }

    // Trigger file upload dialog
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `📤 **Ready to Upload Data**\n\nI'll help you upload data to **${state.selectedLob.name}**.\n\nPlease click the "Upload Data" button below or drag and drop your CSV/Excel file.\n\n**Required columns:**\n• Date\n• Value (Target column)\n• Orders (Exogenous column - optional)\n• Forecast (optional)`,
        suggestions: ['Upload Data', 'Download Template', 'What format do I need?'],
        agentType: 'onboarding'
      }
    });

    // Auto-trigger file input after a short delay
    setTimeout(() => {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.click();
      }
    }, 1000);
  };

  // Enhanced submit message handler with follow-up questions and chat commands
  const submitMessage = async (messageText: string) => {
    if (!messageText.trim()) return;
    
    // First, check for chat commands (BU/LOB creation, data upload)
    const chatCommand = chatCommandProcessor.parseCommand(messageText, 'default');
    
    if (chatCommand.intent !== 'unknown' && chatCommand.confidence > 0.7) {
      await handleChatCommand(chatCommand, messageText);
      return;
    }
    
    // Check if follow-up questions are needed (only for customizable scenarios)
    if (followUpQuestionsService.needsFollowUpQuestions(messageText, state)) {
      const requirements = followUpQuestionsService.generateFollowUpQuestions(messageText, state);
      
      if (requirements) {
        // Show follow-up questions instead of proceeding directly
        setFollowUpRequirements(requirements);
        setPendingUserMessage(messageText);
        setShowFollowUpQuestions(true);
        
        // Add user message showing they requested analysis
        dispatch({ 
          type: 'ADD_MESSAGE', 
          payload: {
            id: crypto.randomUUID(),
            role: 'user',
            content: messageText,
          }
        });

        // Add assistant response explaining follow-up questions with better context
        const analysisTypeFormatted = requirements.analysisType.replace('_', ' ').charAt(0).toUpperCase() + requirements.analysisType.replace('_', ' ').slice(1);
        dispatch({ 
          type: 'ADD_MESSAGE', 
          payload: {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `I see you're requesting **${analysisTypeFormatted}** - this has several customization options that can significantly improve your results!

**What I can customize:**
• Model selection (Prophet, XGBoost, LightGBM, etc.)
• Forecast horizon and confidence levels
• Feature engineering approaches
• Business context and objectives

**Estimated Time:** ${requirements.estimatedTime}

Would you like to customize these parameters, or should I use smart defaults?`,
            agentType: 'onboarding',
            suggestions: ['Customize parameters', 'Use smart defaults', 'Tell me more about options']
          }
        });
        
        return;
      }
    }
    
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

    // If no follow-up questions, proceed with regular analysis
    await continueWithAnalysis(messageText);
  };

  // Rest of the component remains similar with enhanced UI elements
  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userInput = formData.get('message') as string;
    e.currentTarget.reset();
    submitMessage(userInput);
  };

  const handleFollowUpSubmit = async (responses: UserResponse[]) => {
    if (!followUpRequirements || !pendingUserMessage) return;
    
    // Generate enhanced prompt with follow-up responses
    const enhancedPrompt = followUpQuestionsService.generateAnalysisPrompt(
      followUpRequirements.analysisType,
      responses,
      pendingUserMessage
    );
    
    // Close dialog and proceed with analysis
    setShowFollowUpQuestions(false);
    setFollowUpRequirements(null);
    
    // Add response summary to chat
    const responseCount = responses.length;
    dispatch({ 
      type: 'ADD_MESSAGE', 
      payload: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `✅ Thank you! I've received your ${responseCount} response${responseCount !== 1 ? 's' : ''}. Now proceeding with your customized **${followUpRequirements.analysisType.replace('_', ' ')}** analysis...`,
        agentType: 'onboarding'
      }
    });
    
    // Clear state and proceed with enhanced analysis
    setPendingUserMessage('');
    await continueWithAnalysis(enhancedPrompt);
  };

  const handleFollowUpSkip = async () => {
    if (!pendingUserMessage) return;
    
    setShowFollowUpQuestions(false);
    setFollowUpRequirements(null);
    
    // Add skip message to chat
    dispatch({ 
      type: 'ADD_MESSAGE', 
      payload: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Proceeding with default analysis settings for your **${followUpRequirements?.analysisType.replace('_', ' ')}** request...`,
        agentType: 'onboarding'
      }
    });
    
    // Continue with original message
    await continueWithAnalysis(pendingUserMessage);
    setPendingUserMessage('');
  };

  const continueWithAnalysis = async (messageText: string) => {
    dispatch({ type: 'SET_PROCESSING', payload: true });
    dispatch({ type: 'CLEAR_THINKING_STEPS' });

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
        conversationHistory: state.messages.slice(-5),
        conversationContext: state.conversationContext // Include conversation context
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

      // Enhanced fallback suggestions based on context and agent
      if (suggestions.length === 0) {
        if (!state.selectedLob) {
          suggestions = [
            "Get started with onboarding",
            "Upload your sales data", 
            "Show me a sample analysis",
            "How do I generate a forecast?"
          ];
        } else if (agentType === 'onboarding') {
          suggestions = [
            "Upload your data file",
            "Start with data exploration",
            "Plan a complete analysis workflow",
            "Learn about forecasting methods"
          ];
        } else if (agentType === 'eda') {
          suggestions = [
            "Clean and preprocess the data",
            "Train forecasting models",
            "Generate business insights"
          ];
        } else if (multiAgent) {
          suggestions = [
            "Review detailed results",
            "Generate comprehensive report",
            "Explore different scenarios",
            "Download analysis summary"
          ];
        } else {
          suggestions = [
            "Explore your data (EDA)",
            "Run complete forecast workflow",
            "Generate business insights",
            "Download detailed report"
          ];
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
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      
      // Check if this is an API key related error
      const isAPIKeyError = errorMessage.includes('🔑') || errorMessage.includes('API key');
      
      let suggestions = ['Try a simpler query', 'Check your connection', 'Upload data first'];
      
      if (isAPIKeyError) {
        suggestions = [
          'Open API Settings', 
          'Configure OpenAI Key', 
          'Configure OpenRouter Key',
          'Test API Connection'
        ];
      }
      
      dispatch({ 
        type: 'UPDATE_LAST_MESSAGE', 
        payload: {
          content: `⚠️ ${errorMessage}${isAPIKeyError ? '\n\n**Next Steps:**\n1. Click the Settings button below\n2. Add your OpenAI or OpenRouter API key\n3. Test the connection\n4. Try your request again' : ''}`,
          isTyping: false,
          agentType: 'general',
          suggestions,
          requiresAPISetup: isAPIKeyError
        }
      });
      dispatch({ type: 'SET_PROCESSING', payload: false });
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Handle special API setup suggestions
    if (suggestion === 'Open API Settings') {
      setShowAPISettings(true);
      return;
    }
    if (suggestion === 'Configure OpenAI Key' || suggestion === 'Configure OpenRouter Key') {
      setShowAPISettings(true);
      return;
    }
    if (suggestion === 'Test API Connection') {
      setShowAPISettings(true);
      return;
    }

    // Handle follow-up question responses
    if (suggestion === 'Customize parameters') {
      // Dialog is already open, user will see the questions
      return;
    }
    if (suggestion === 'Use smart defaults') {
      handleFollowUpSkip();
      return;
    }
    if (suggestion === 'Tell me more about options') {
      if (followUpRequirements) {
        dispatch({ 
          type: 'ADD_MESSAGE', 
          payload: {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Here are the key customization options for **${followUpRequirements.analysisType.replace('_', ' ')}**:

**🤖 Model Selection:**
• **Prophet:** Best for seasonal data with holidays/events
• **XGBoost:** Excellent for complex patterns with many features  
• **LightGBM:** Fast and accurate for most business scenarios
• **Ensemble:** Combines multiple models for maximum accuracy

**📊 Forecast Configuration:**
• **Horizon:** 7 days to 12 months (your choice)
• **Confidence Levels:** 80%, 90%, 95%, or 99%
• **Business Context:** Inventory, budgeting, staffing, marketing

**🔧 Advanced Features:**
• **Seasonal Adjustments:** Holiday effects, weekly patterns
• **Feature Engineering:** Rolling averages, lag variables
• **Validation Strategy:** Cross-validation approaches

Ready to customize, or should I proceed with intelligent defaults?`,
            agentType: 'onboarding',
            suggestions: ['Customize parameters', 'Use smart defaults']
          }
        });
      }
      return;
    }
    if (suggestion === 'Answer the questions above') {
      // Legacy support - dialog is already open
      return;
    }
    if (suggestion === 'Skip questions and use defaults') {
      handleFollowUpSkip();
      return;
    }
    if (suggestion === 'Cancel analysis') {
      setShowFollowUpQuestions(false);
      setFollowUpRequirements(null);
      setPendingUserMessage('');
      return;
    }
    
    // Handle regular suggestions
    submitMessage(suggestion);
  };
  
  const handleVisualizeClick = (messageId: string) => {
    const msg = state.messages.find(m => m.id === messageId);
    const target = msg?.visualization?.target === "Orders" ? "revenue" : "units";
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
            
            <div className="border-t p-4 bg-card/50 backdrop-blur-sm">
              <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
                <div className="flex items-end gap-3">
                  <Textarea
                    className="flex-1 min-h-[40px] max-h-[120px] resize-none bg-background/80"
                    name="message"
                    placeholder="Ask about data exploration, forecasting, business insights, or get started with onboarding..."
                    autoComplete="off"
                    disabled={isAssistantTyping}
                    rows={1}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={isAssistantTyping}
                    className="h-10 w-10 shrink-0"
                  >
                    <Send className="h-4 w-4" />
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

      <FollowUpQuestionsDialog
        open={showFollowUpQuestions}
        onOpenChange={setShowFollowUpQuestions}
        requirements={followUpRequirements}
        onSubmit={handleFollowUpSubmit}
        onSkip={handleFollowUpSkip}
      />
    </>
  );
}