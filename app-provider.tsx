"use client";

import React, { createContext, useContext, useReducer } from 'react';
import type { BusinessUnit, LineOfBusiness, ChatMessage, WorkflowStep } from '@/lib/types';
import { mockBusinessUnits } from '@/lib/data';
import type { AgentMonitorProps } from '@/lib/types';

type OnboardingStep =
  | 'welcome'
  | 'create_bu'
  | 'create_lob'
  | 'upload_data'
  | 'use_mock_data'
  | 'analyze'
  | 'complete';

type OnboardingProgressStep = {
  id: OnboardingStep;
  name: string;
  status: 'pending' | 'active' | 'completed';
  description: string;
};

type AppState = {
  apiKey: string | null;
  businessUnits: BusinessUnit[];
  selectedBu: BusinessUnit | null;
  selectedLob: LineOfBusiness | null;
  messages: ChatMessage[];
  workflow: WorkflowStep[];
  isProcessing: boolean;
  thinkingSteps: string[];
  agentMonitor: AgentMonitorProps;
  dataPanelOpen: boolean;
  dataPanelMode: 'dashboard' | 'charts' | 'insights' | 'data';
  dataPanelTarget: 'Value' | 'Orders';
  dataPanelWidthPct: number; // 20 - 70
  isOnboarding: boolean;
  onboardingStep: OnboardingStep;
  onboardingProgress: OnboardingProgressStep[];
  queuedUserPrompt?: string | null;
  analyzedData: {
    hasEDA: boolean;
    hasForecasting: boolean;
    hasInsights: boolean;
    lastAnalysisType?: string;
  };
  dateRange?: {
    start: Date;
    end: Date;
    preset?: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year';
  };
  isAuthenticated: boolean;
};

type Action =
  | { type: 'SET_API_KEY'; payload: string }
  | { type: 'SET_AUTH'; payload: boolean }
  | { type: 'SET_SELECTED_BU'; payload: BusinessUnit | null }
  | { type: 'SET_SELECTED_LOB'; payload: LineOfBusiness | null }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_LAST_MESSAGE'; payload: Partial<ChatMessage> }
  | { type: 'STREAM_UPDATE_LAST_MESSAGE'; payload: { contentChunk: string } }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_THINKING_STEPS'; payload: string[] }
  | { type: 'ADD_THINKING_STEP'; payload: string }
  | { type: 'CLEAR_THINKING_STEPS' }
  | { type: 'UPDATE_WORKFLOW_STEP'; payload: Partial<WorkflowStep> & { id: string } }
  | { type: 'SET_WORKFLOW'; payload: WorkflowStep[] }
  | { type: 'RESET_WORKFLOW' }
  | { type: 'SET_AGENT_MONITOR_OPEN'; payload: boolean }
  | { type: 'ADD_BU'; payload: { name: string; description: string; id?: string } }
  | { type: 'ADD_LOB'; payload: { buId: string; name: string; description: string; id?: string } }
  | { type: 'UPLOAD_DATA', payload: { lobId: string, file: File } }
  | { type: 'TOGGLE_VISUALIZATION', payload: { messageId: string } }
  | { type: 'SET_DATA_PANEL_OPEN'; payload: boolean }
  | { type: 'SET_DATA_PANEL_MODE'; payload: 'dashboard' | 'charts' | 'insights' | 'data' }
  | { type: 'SET_DATA_PANEL_TARGET'; payload: 'Value' | 'Orders' }
  | { type: 'SET_DATA_PANEL_WIDTH'; payload: number }
  | { type: 'END_ONBOARDING' }
  | { type: 'QUEUE_USER_PROMPT'; payload: string }
  | { type: 'CLEAR_QUEUED_PROMPT' }
  | { type: 'GENERATE_REPORT'; payload: { messageId: string; reportData: any; agentType: string; timestamp: string } }
  | { type: 'SET_ANALYZED_DATA'; payload: { hasEDA?: boolean; hasForecasting?: boolean; hasInsights?: boolean; lastAnalysisType?: string } }
  | { type: 'SET_DATE_RANGE'; payload: { start: Date; end: Date; preset?: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year' } }
  | { type: 'ADD_FORECAST_DATA' }
  | { type: 'SET_ONBOARDING_STEP'; payload: OnboardingStep }
  | { type: 'ADVANCE_ONBOARDING_STEP' }
  | { type: 'RESET_ONBOARDING_PROGRESS' }
  | { type: 'SET_ONBOARDING_PROGRESS'; payload: OnboardingProgressStep[] };

const defaultOnboardingProgress: OnboardingProgressStep[] = [
  { id: 'welcome', name: 'Welcome', status: 'completed', description: 'Welcome to the BI onboarding assistant.' },
  { id: 'create_bu', name: 'Create Business Unit', status: 'pending', description: 'Set up your first Business Unit.' },
  { id: 'create_lob', name: 'Create Line of Business', status: 'pending', description: 'Add a Line of Business to your BU.' },
  { id: 'upload_data', name: 'Upload Data', status: 'pending', description: 'Upload your data or use demo data.' },
  { id: 'use_mock_data', name: 'Use Demo Data', status: 'pending', description: 'Generate and use 5-year mock data for demo/analysis.' },
  { id: 'analyze', name: 'Analyze & Explore', status: 'pending', description: 'Analyze, visualize, and explore your data.' },
  { id: 'complete', name: 'Complete', status: 'pending', description: 'Onboarding complete! Ready for advanced analysis.' },
];

const initialState: AppState = {
  apiKey: null,
  businessUnits: mockBusinessUnits,
  isAuthenticated: typeof window !== "undefined" ? localStorage.getItem("isAuthenticated") === "true" : false,
  selectedBu: null,
  selectedLob: null,
  messages: [
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your BI forecasting assistant. Select a Business Unit and Line of Business to get started.",
      suggestions: ['Compare LOB performance', 'Summarize the key business drivers', 'Upload new data']
    },
  ],
  workflow: [],
  isProcessing: false,
  thinkingSteps: [],
  agentMonitor: {
    isOpen: false,
  },
  dataPanelOpen: false,
  dataPanelMode: 'dashboard',
  dataPanelTarget: 'Value',
  dataPanelWidthPct: 40,
  isOnboarding: true,
  onboardingStep: 'welcome',
  onboardingProgress: defaultOnboardingProgress,
  queuedUserPrompt: null,
  analyzedData: {
    hasEDA: false,
    hasForecasting: false,
    hasInsights: false,
  },
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
    preset: 'last_30_days'
  },
};

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_AUTH':
      if (typeof window !== "undefined") {
        localStorage.setItem("isAuthenticated", action.payload.toString());
      }
      return { ...state, isAuthenticated: action.payload };

    case 'SET_API_KEY':
      return { ...state, apiKey: action.payload };

    case 'SET_SELECTED_BU':
      return { ...state, selectedBu: action.payload, selectedLob: null };

    case 'SET_SELECTED_LOB':
      return { ...state, selectedLob: action.payload };

    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };

    case 'UPDATE_LAST_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1 ? { ...msg, ...action.payload } : msg
        ),
      };

    case 'STREAM_UPDATE_LAST_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1
            ? { ...msg, content: msg.content + action.payload.contentChunk }
            : msg
        ),
      };

    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };

    case 'SET_THINKING_STEPS':
      return { ...state, thinkingSteps: action.payload };

    case 'ADD_THINKING_STEP':
      return { ...state, thinkingSteps: [...state.thinkingSteps, action.payload] };

    case 'CLEAR_THINKING_STEPS':
      return { ...state, thinkingSteps: [] };

    case 'UPDATE_WORKFLOW_STEP':
      return {
        ...state,
        workflow: state.workflow.map(step =>
          step.id === action.payload.id ? { ...step, ...action.payload } : step
        ),
      };

    case 'SET_WORKFLOW':
      return { ...state, workflow: action.payload };

    case 'RESET_WORKFLOW':
      return { ...state, workflow: [] };

    case 'SET_AGENT_MONITOR_OPEN':
      return {
        ...state,
        agentMonitor: { ...state.agentMonitor, isOpen: action.payload },
      };

    case 'ADD_BU':
      const newBu: BusinessUnit = {
        id: action.payload.id || `bu-${Date.now()}`,
        name: action.payload.name,
        description: action.payload.description,
        linesOfBusiness: [],
      };
      return { ...state, businessUnits: [...state.businessUnits, newBu] };

    case 'ADD_LOB':
      return {
        ...state,
        businessUnits: state.businessUnits.map(bu =>
          bu.id === action.payload.buId
            ? {
              ...bu,
              linesOfBusiness: [
                ...bu.linesOfBusiness,
                {
                  id: action.payload.id || `lob-${Date.now()}`,
                  name: action.payload.name,
                  description: action.payload.description,
                  recordCount: 0,
                  dataQuality: { score: 0, trend: 'stable', seasonality: 'none' },
                  data: [],
                },
              ],
            }
            : bu
        ),
      };

    case 'UPLOAD_DATA':
      return {
        ...state,
        businessUnits: state.businessUnits.map(bu => ({
          ...bu,
          linesOfBusiness: bu.linesOfBusiness.map(lob =>
            lob.id === action.payload.lobId
              ? { ...lob, recordCount: lob.recordCount + 1 }
              : lob
          ),
        })),
      };

    case 'TOGGLE_VISUALIZATION':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? { ...msg, showVisualization: !msg.showVisualization }
            : msg
        ),
      };

    case 'SET_DATA_PANEL_OPEN':
      return { ...state, dataPanelOpen: action.payload };

    case 'SET_DATA_PANEL_MODE':
      return { ...state, dataPanelMode: action.payload };

    case 'SET_DATA_PANEL_TARGET':
      return { ...state, dataPanelTarget: action.payload };

    case 'SET_DATA_PANEL_WIDTH':
      return { ...state, dataPanelWidthPct: Math.max(20, Math.min(70, action.payload)) };

    case 'END_ONBOARDING':
      return { ...state, isOnboarding: false };

    case 'QUEUE_USER_PROMPT':
      return { ...state, queuedUserPrompt: action.payload };

    case 'CLEAR_QUEUED_PROMPT':
      return { ...state, queuedUserPrompt: null };

    case 'GENERATE_REPORT':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? { ...msg, reportData: action.payload.reportData }
            : msg
        ),
      };

    case 'SET_ANALYZED_DATA':
      return {
        ...state,
        analyzedData: { ...state.analyzedData, ...action.payload },
      };

    case 'SET_DATE_RANGE':
      return { ...state, dateRange: action.payload };

    case 'ADD_FORECAST_DATA':
      return state;

    case 'SET_ONBOARDING_STEP': {
      const stepIndex = state.onboardingProgress.findIndex(s => s.id === action.payload);
      const updatedProgress = state.onboardingProgress.map((step, idx) => ({
        ...step,
        status: (
          idx < stepIndex
            ? 'completed'
            : idx === stepIndex
              ? 'active'
              : 'pending'
        ) as 'pending' | 'active' | 'completed',
      }));
      return { ...state, onboardingStep: action.payload, onboardingProgress: updatedProgress };
    }

    case 'ADVANCE_ONBOARDING_STEP': {
      const currentIdx = state.onboardingProgress.findIndex(s => s.id === state.onboardingStep);
      const nextIdx = Math.min(currentIdx + 1, state.onboardingProgress.length - 1);
      const nextStep = state.onboardingProgress[nextIdx].id;
      const updatedProgress = state.onboardingProgress.map((step, idx) => ({
        ...step,
        status: (
          idx < nextIdx
            ? 'completed'
            : idx === nextIdx
              ? 'active'
              : 'pending'
        ) as 'pending' | 'active' | 'completed',
      }));
      return { ...state, onboardingStep: nextStep, onboardingProgress: updatedProgress };
    }

    case 'RESET_ONBOARDING_PROGRESS':
      return {
        ...state,
        onboardingStep: 'welcome',
        onboardingProgress: defaultOnboardingProgress.map((step, idx) => ({
          ...step,
          status: (idx === 0 ? 'active' : 'pending') as 'pending' | 'active' | 'completed',
        })),
      };

    case 'SET_ONBOARDING_PROGRESS':
      return { ...state, onboardingProgress: action.payload };

    default:
      return state;
  }
}

type AppContextType = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
