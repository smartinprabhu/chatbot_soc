/**
 * Follow-up Questions Service - Generates contextual clarifying questions before analysis
 */

export interface FollowUpQuestion {
  id: string;
  question: string;
  type: 'single_choice' | 'multiple_choice' | 'text_input' | 'number_input';
  options?: string[];
  required: boolean;
  category: string;
}

export interface AnalysisRequirements {
  analysisType: string;
  questions: FollowUpQuestion[];
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
}

export interface UserResponse {
  questionId: string;
  answer: string | string[] | number;
}

export class FollowUpQuestionsService {

  /**
   * Analyze user message and determine if follow-up questions are needed
   * Only triggers for requests that have meaningful customization options
   */
  needsFollowUpQuestions(message: string, context?: any): boolean {
    const lowerMessage = message.toLowerCase();
    
    // Only trigger for specific scenarios with customization options
    const customizableScenarios = [
      // Forecasting with specific parameters
      /(forecast|predict|prediction).*?(days?|weeks?|months?|period|horizon)/i,
      /(forecast|predict|prediction).*?(model|algorithm|approach|method)/i,
      
      // Model training with algorithm choices
      /(train|build|create).*?(model|algorithm)/i,
      /(model|algorithm).*?(train|build|create|select|choose)/i,
      
      // Complete analysis workflows
      /(complete|comprehensive|full|end.to.end).*?(analysis|workflow|forecast)/i,
      /(run|perform|execute).*?(complete|comprehensive|full)/i,
      
      // Business insights with specific objectives
      /(business|strategic).*?(insight|recommendation|analysis)/i,
      /(insight|recommendation).*?(business|strategic)/i
    ];

    // Check if any customizable scenario matches
    const hasCustomizableScenario = customizableScenarios.some(pattern => pattern.test(message));
    
    // Additional checks for complexity that warrants customization
    const hasComplexityIndicators = [
      'model', 'algorithm', 'approach', 'method', 'strategy',
      'days', 'weeks', 'months', 'period', 'horizon',
      'confidence', 'accuracy', 'performance',
      'business', 'strategic', 'planning'
    ].some(keyword => lowerMessage.includes(keyword));

    return hasCustomizableScenario && hasComplexityIndicators;
  }

  /**
   * Generate follow-up questions based on user intent
   */
  generateFollowUpQuestions(message: string, context?: any): AnalysisRequirements | null {
    const lowerMessage = message.toLowerCase();
    const analysisType = this.detectAnalysisType(message);

    if (!analysisType) {
      return null;
    }

    switch (analysisType) {
      case 'forecasting':
        return this.generateForecastingQuestions();
      case 'data_exploration':
        return this.generateExplorationQuestions();
      case 'modeling':
        return this.generateModelingQuestions();
      case 'complete_analysis':
        return this.generateCompleteAnalysisQuestions();
      case 'business_insights':
        return this.generateBusinessInsightsQuestions();
      default:
        return null;
    }
  }

  private detectAnalysisType(message: string): string | null {
    const lowerMessage = message.toLowerCase();

    // Forecasting detection - only for specific forecasting requests with parameters
    if (/(forecast|predict).*?(days?|weeks?|months?|period|horizon|model|algorithm)/i.test(message)) {
      return 'forecasting';
    }

    // Complete analysis detection - only for comprehensive workflows
    if (/(complete|comprehensive|full|end.to.end).*?(analysis|workflow|forecast)/i.test(message)) {
      return 'complete_analysis';
    }

    // Modeling detection - only when specifically asking about models/algorithms
    if (/(train|build|create).*?(model|algorithm)|model.*?(train|build|selection|choose)/i.test(message)) {
      return 'modeling';
    }

    // Business insights detection - only for strategic business requests
    if (/(business|strategic).*?(insight|recommendation|analysis)/i.test(message)) {
      return 'business_insights';
    }

    // Data exploration - only if asking for specific exploration approaches
    if (/(explore|eda).*?(approach|method|focus|type)/i.test(message)) {
      return 'data_exploration';
    }

    return null;
  }

  private generateForecastingQuestions(): AnalysisRequirements {
    return {
      analysisType: 'forecasting',
      priority: 'high',
      estimatedTime: '3-5 minutes',
      questions: [
        {
          id: 'forecast_horizon',
          question: 'How many days ahead would you like to forecast?',
          type: 'single_choice',
          options: [
            '7 days (1 week)',
            '14 days (2 weeks)', 
            '30 days (1 month)',
            '60 days (2 months)',
            '90 days (3 months)',
            'Custom period'
          ],
          required: true,
          category: 'timeline'
        },
        {
          id: 'forecast_model',
          question: 'Which forecasting approach would you prefer?',
          type: 'single_choice',
          options: [
            'Automatic (I\'ll choose the best model)',
            'Prophet (Good for seasonal data)',
            'XGBoost (Machine learning approach)',
            'LightGBM (Fast and accurate)',
            'Ensemble (Multiple models combined)'
          ],
          required: true,
          category: 'methodology'
        },
        {
          id: 'confidence_level',
          question: 'What confidence level do you need for predictions?',
          type: 'single_choice',
          options: [
            '80% (Wider range, more certainty)',
            '90% (Balanced)',
            '95% (Narrow range, high precision)',
            '99% (Maximum precision)'
          ],
          required: true,
          category: 'accuracy'
        },
        {
          id: 'business_context',
          question: 'What will you use these forecasts for?',
          type: 'multiple_choice',
          options: [
            'Inventory planning',
            'Budget planning',
            'Staffing decisions', 
            'Marketing campaigns',
            'Strategic planning',
            'Risk assessment',
            'Other'
          ],
          required: false,
          category: 'application'
        },
        {
          id: 'seasonal_factors',
          question: 'Are there specific seasonal patterns I should consider?',
          type: 'multiple_choice',
          options: [
            'Holiday effects',
            'Weekend patterns',
            'Monthly cycles',
            'Quarterly trends',
            'Annual seasonality',
            'External events',
            'No specific patterns'
          ],
          required: false,
          category: 'patterns'
        }
      ]
    };
  }

  private generateExplorationQuestions(): AnalysisRequirements {
    return {
      analysisType: 'data_exploration',
      priority: 'medium',
      estimatedTime: '2-3 minutes',
      questions: [
        {
          id: 'exploration_focus',
          question: 'What aspects of your data are you most interested in?',
          type: 'multiple_choice',
          options: [
            'Data quality assessment',
            'Trend analysis',
            'Seasonal patterns',
            'Outlier detection',
            'Statistical summaries',
            'Correlation analysis',
            'Distribution analysis'
          ],
          required: true,
          category: 'focus'
        },
        {
          id: 'data_period',
          question: 'What time period should I focus the analysis on?',
          type: 'single_choice',
          options: [
            'All available data',
            'Last 30 days',
            'Last 90 days',
            'Last 6 months',
            'Last 12 months',
            'Custom period'
          ],
          required: true,
          category: 'timeline'
        },
        {
          id: 'visualization_preference',
          question: 'What type of visualizations would be most helpful?',
          type: 'multiple_choice',
          options: [
            'Time series charts',
            'Statistical histograms',
            'Correlation heatmaps',
            'Box plots',
            'Scatter plots',
            'Trend decomposition',
            'Summary tables only'
          ],
          required: false,
          category: 'presentation'
        },
        {
          id: 'specific_concerns',
          question: 'Do you have any specific data quality concerns?',
          type: 'multiple_choice',
          options: [
            'Missing data points',
            'Unusual values/outliers',
            'Data consistency',
            'Seasonal irregularities',
            'Recent trend changes',
            'No specific concerns'
          ],
          required: false,
          category: 'quality'
        }
      ]
    };
  }

  private generateModelingQuestions(): AnalysisRequirements {
    return {
      analysisType: 'modeling',
      priority: 'high',
      estimatedTime: '4-6 minutes',
      questions: [
        {
          id: 'model_type',
          question: 'What type of model would you like to build?',
          type: 'single_choice',
          options: [
            'Forecasting model (predict future values)',
            'Classification model (categorize data)',
            'Regression model (predict continuous values)',
            'Anomaly detection (identify outliers)',
            'Let me choose the best approach'
          ],
          required: true,
          category: 'methodology'
        },
        {
          id: 'accuracy_priority',
          question: 'What\'s most important for your model?',
          type: 'single_choice',
          options: [
            'Highest accuracy possible',
            'Balanced accuracy and speed',
            'Fast predictions',
            'Explainable results',
            'Robust to data changes'
          ],
          required: true,
          category: 'priorities'
        },
        {
          id: 'validation_approach',
          question: 'How should I validate the model performance?',
          type: 'single_choice',
          options: [
            'Time series cross-validation (recommended)',
            'Random cross-validation',
            'Hold-out test set',
            'Walk-forward validation',
            'Custom validation approach'
          ],
          required: true,
          category: 'validation'
        },
        {
          id: 'feature_engineering',
          question: 'Should I create additional features from your data?',
          type: 'multiple_choice',
          options: [
            'Lag features (past values)',
            'Rolling averages',
            'Seasonal indicators',
            'Trend components',
            'Holiday effects',
            'External factors',
            'Keep it simple'
          ],
          required: false,
          category: 'features'
        }
      ]
    };
  }

  private generateCompleteAnalysisQuestions(): AnalysisRequirements {
    return {
      analysisType: 'complete_analysis',
      priority: 'high',
      estimatedTime: '5-8 minutes',
      questions: [
        {
          id: 'analysis_depth',
          question: 'How comprehensive should the analysis be?',
          type: 'single_choice',
          options: [
            'Full analysis (exploration + modeling + forecasting + insights)',
            'Quick comprehensive (key insights across all areas)',
            'Focus on forecasting with basic exploration',
            'Focus on business insights with supporting analysis',
            'Custom workflow'
          ],
          required: true,
          category: 'scope'
        },
        {
          id: 'forecast_horizon_complete',
          question: 'What forecasting horizon do you need?',
          type: 'single_choice',
          options: [
            '1-2 weeks (operational planning)',
            '1 month (tactical planning)',
            '3 months (strategic planning)',
            '6-12 months (long-term planning)',
            'Multiple horizons'
          ],
          required: true,
          category: 'timeline'
        },
        {
          id: 'business_objectives',
          question: 'What are your main business objectives?',
          type: 'multiple_choice',
          options: [
            'Improve forecast accuracy',
            'Identify growth opportunities',
            'Risk management',
            'Cost optimization',
            'Resource planning',
            'Performance monitoring',
            'Strategic decision making'
          ],
          required: true,
          category: 'objectives'
        },
        {
          id: 'decision_timeline',
          question: 'When do you need to make business decisions based on this analysis?',
          type: 'single_choice',
          options: [
            'Immediately (today)',
            'This week',
            'Next 2 weeks',
            'Next month',
            'Ongoing basis'
          ],
          required: false,
          category: 'urgency'
        },
        {
          id: 'stakeholder_level',
          question: 'Who will be using these insights?',
          type: 'multiple_choice',
          options: [
            'Executive leadership',
            'Department managers',
            'Operations team',
            'Data analysts',
            'External stakeholders',
            'Just me'
          ],
          required: false,
          category: 'audience'
        }
      ]
    };
  }

  private generateBusinessInsightsQuestions(): AnalysisRequirements {
    return {
      analysisType: 'business_insights',
      priority: 'medium',
      estimatedTime: '2-4 minutes',
      questions: [
        {
          id: 'insight_focus',
          question: 'What type of business insights are you looking for?',
          type: 'multiple_choice',
          options: [
            'Growth opportunities',
            'Cost reduction opportunities',
            'Risk identification',
            'Market trends',
            'Operational efficiency',
            'Customer behavior patterns',
            'Performance benchmarks'
          ],
          required: true,
          category: 'focus'
        },
        {
          id: 'business_domain',
          question: 'What\'s your primary business domain?',
          type: 'single_choice',
          options: [
            'Sales & Revenue',
            'Operations & Supply Chain',
            'Marketing & Customer Acquisition',
            'Finance & Risk Management',
            'Product Development',
            'Human Resources',
            'Other'
          ],
          required: true,
          category: 'domain'
        },
        {
          id: 'action_orientation',
          question: 'What level of actionable recommendations do you need?',
          type: 'single_choice',
          options: [
            'High-level strategic guidance',
            'Specific actionable steps',
            'Detailed implementation plans',
            'Just insights and observations',
            'Mix of strategic and tactical'
          ],
          required: true,
          category: 'actionability'
        },
        {
          id: 'competitive_context',
          question: 'Should I consider competitive or market factors?',
          type: 'single_choice',
          options: [
            'Yes, include market benchmarks',
            'Focus on internal performance only',
            'Compare to industry standards',
            'No external context needed'
          ],
          required: false,
          category: 'context'
        }
      ]
    };
  }

  /**
   * Validate user responses to follow-up questions
   */
  validateResponses(questions: FollowUpQuestion[], responses: UserResponse[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const responseMap = new Map(responses.map(r => [r.questionId, r]));

    // Check required questions
    questions.forEach(question => {
      if (question.required && !responseMap.has(question.id)) {
        errors.push(`Please answer the required question: ${question.question}`);
      }

      const response = responseMap.get(question.id);
      if (response && question.type === 'single_choice' && question.options) {
        if (typeof response.answer === 'string' && !question.options.includes(response.answer)) {
          errors.push(`Invalid option selected for: ${question.question}`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate analysis prompt based on user responses
   */
  generateAnalysisPrompt(
    analysisType: string, 
    responses: UserResponse[], 
    originalMessage: string
  ): string {
    const responseMap = new Map(responses.map(r => [r.questionId, r]));
    
    let prompt = `User requested: ${originalMessage}\n\nAnalysis Configuration:\n`;
    
    switch (analysisType) {
      case 'forecasting':
        prompt += this.generateForecastingPrompt(responseMap);
        break;
      case 'data_exploration':
        prompt += this.generateExplorationPrompt(responseMap);
        break;
      case 'modeling':
        prompt += this.generateModelingPrompt(responseMap);
        break;
      case 'complete_analysis':
        prompt += this.generateCompleteAnalysisPrompt(responseMap);
        break;
      case 'business_insights':
        prompt += this.generateBusinessInsightsPrompt(responseMap);
        break;
    }

    return prompt;
  }

  private generateForecastingPrompt(responses: Map<string, UserResponse>): string {
    const horizon = responses.get('forecast_horizon')?.answer || '30 days (1 month)';
    const model = responses.get('forecast_model')?.answer || 'Automatic';
    const confidence = responses.get('confidence_level')?.answer || '90%';
    const context = responses.get('business_context')?.answer || [];
    const seasonal = responses.get('seasonal_factors')?.answer || [];

    return `
Forecasting Specifications:
- Forecast Horizon: ${horizon}
- Model Preference: ${model}
- Confidence Level: ${confidence}
- Business Context: ${Array.isArray(context) ? context.join(', ') : context}
- Seasonal Considerations: ${Array.isArray(seasonal) ? seasonal.join(', ') : seasonal}

Please generate forecasts with these specifications and provide detailed business insights.`;
  }

  private generateExplorationPrompt(responses: Map<string, UserResponse>): string {
    const focus = responses.get('exploration_focus')?.answer || [];
    const period = responses.get('data_period')?.answer || 'All available data';
    const visualizations = responses.get('visualization_preference')?.answer || [];
    const concerns = responses.get('specific_concerns')?.answer || [];

    return `
Data Exploration Specifications:
- Analysis Focus: ${Array.isArray(focus) ? focus.join(', ') : focus}
- Time Period: ${period}
- Visualizations Needed: ${Array.isArray(visualizations) ? visualizations.join(', ') : visualizations}
- Specific Concerns: ${Array.isArray(concerns) ? concerns.join(', ') : concerns}

Please conduct thorough exploratory data analysis with focus on these areas.`;
  }

  private generateModelingPrompt(responses: Map<string, UserResponse>): string {
    const modelType = responses.get('model_type')?.answer || 'Let me choose the best approach';
    const priority = responses.get('accuracy_priority')?.answer || 'Balanced accuracy and speed';
    const validation = responses.get('validation_approach')?.answer || 'Time series cross-validation';
    const features = responses.get('feature_engineering')?.answer || [];

    return `
Modeling Specifications:
- Model Type: ${modelType}
- Priority: ${priority}
- Validation Approach: ${validation}
- Feature Engineering: ${Array.isArray(features) ? features.join(', ') : features}

Please build and validate models according to these specifications.`;
  }

  private generateCompleteAnalysisPrompt(responses: Map<string, UserResponse>): string {
    const depth = responses.get('analysis_depth')?.answer || 'Full analysis';
    const horizon = responses.get('forecast_horizon_complete')?.answer || '1 month';
    const objectives = responses.get('business_objectives')?.answer || [];
    const timeline = responses.get('decision_timeline')?.answer || 'Next month';
    const stakeholders = responses.get('stakeholder_level')?.answer || [];

    return `
Complete Analysis Specifications:
- Analysis Depth: ${depth}
- Forecast Horizon: ${horizon}
- Business Objectives: ${Array.isArray(objectives) ? objectives.join(', ') : objectives}
- Decision Timeline: ${timeline}
- Stakeholders: ${Array.isArray(stakeholders) ? stakeholders.join(', ') : stakeholders}

Please conduct comprehensive analysis covering all specified areas with business focus.`;
  }

  private generateBusinessInsightsPrompt(responses: Map<string, UserResponse>): string {
    const focus = responses.get('insight_focus')?.answer || [];
    const domain = responses.get('business_domain')?.answer || 'Sales & Revenue';
    const actionOrientation = responses.get('action_orientation')?.answer || 'Specific actionable steps';
    const competitive = responses.get('competitive_context')?.answer || 'Focus on internal performance';

    return `
Business Insights Specifications:
- Insight Focus: ${Array.isArray(focus) ? focus.join(', ') : focus}
- Business Domain: ${domain}
- Action Level: ${actionOrientation}
- Competitive Context: ${competitive}

Please generate strategic business insights with actionable recommendations.`;
  }
}

export const followUpQuestionsService = new FollowUpQuestionsService();