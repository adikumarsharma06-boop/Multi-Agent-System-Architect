export type IntelligenceTier = 'gemini-3.5-flash' | 'gemini-3.1-pro-preview';

export interface AgentNode {
  id: string;
  name: string;
  role: string;
  description: string;
  intelligenceTier: IntelligenceTier;
  inputs: string[];
  outputs: string[];
  tools: string[];
  systemInstruction: string;
  decisionLogic: string;
  costOptimization: string;
}

export interface ValidationGate {
  id: string;
  name: string;
  reviewerAgentId: string; // The agent who reviews this
  criteria: string[];
  testAsserts: string[];
  ifPassedTargetNodeId: string;
  ifFailedTargetNodeId: string;
  feedbackProtocol: string;
}

export interface WorkflowEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'standard_route' | 'validation_pass' | 'validation_fail' | 'feedback_loop' | 'fallback_route';
  label: string;
}

export interface MultiAgentSystem {
  task: string;
  agents: AgentNode[];
  gates: ValidationGate[];
  edges: WorkflowEdge[];
  failureHandling: {
    maxRetryBudgets: number;
    fallbackTriggerPolicy: string;
    alertingChannels: string[];
    circuitBreakerConditions: string;
  };
  optimization: {
    promptWrapping: string;
    cachingStrategy: string;
    parallelizationOpportunity: string;
  };
  scalability: {
    concurrencyModel: string;
    agentOrchestrationPattern: string; // e.g. CrewAI style, LangGraph state-graph, etc.
    eventSubscriptionModel: string;
  };
}

export interface SimulationStepLog {
  timestamp: string;
  nodeId: string; // Active agent or gate
  nodeName: string;
  nodeType: 'agent' | 'gate' | 'system';
  status: 'pending' | 'processing' | 'success' | 'failed' | 'feedback_sent';
  message: string;
  inputReceived: string;
  outputProduced: string;
  tokensUsed?: number;
  simulatedCost?: number; // USD
  feedbackNote?: string;
}

export interface TemplateWorkflow {
  name: string;
  taskDescription: string;
  system: MultiAgentSystem;
}
