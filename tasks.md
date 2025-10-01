# Refactor Agent System Prompts for Customer-Friendly Responses

## Objective
Optimize all agent system prompts to ensure responses are concise, bullet-pointed, and include key statistics and highlights, suitable for users with no prior knowledge.

## Implementation Tasks

- [x] Analyze requirements from design.md
- [x] Review current agent implementations
- [x] Identify gaps and define new agentic flow
- [x] Redefine chat content logic for dynamic, accurate info
- [x] Fine-tune response section for correctness

- [ ] Refactor agent system:
  - Introduce AgentOrchestrator class/module
  - Modularize agents (EDA, Preprocessing, Modeling, Evaluation, Forecasting, etc.)
  - Implement workflow execution and agent coordination
  - Track agent status and workflow progress

- [ ] Update chat/response logic:
  - Only allow charts/tables/dashboards if data is from real backend workflow
  - Strictly check data provenance before rendering
  - Add UI cues for missing/unavailable data
  - Never display mock/demo data as real

- [ ] Update report generation:
  - Ensure reports are only generated from validated, real data
  - Clearly indicate unavailable/missing sections

- [ ] Test and verify:
  - Run end-to-end workflow with real data
  - Confirm no fabricated content is shown
  - Validate UI/UX for missing data cases
