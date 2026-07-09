export interface AgentLog {
  agentName: string;
  status: "success" | "warning" | "error" | "corrected";
  message: string;
  timestamp: string;
  details?: any;
}

export interface PipelineResult {
  originalSql: string;
  finalSql: string;
  executedResults: any[] | null;
  executionError: string | null;
  wasHealed: boolean;
  healingAttempts: number;
  confidenceScore: number;
  explanation: {
    businessSummary: string;
    steps: string[];
    technicalDetails: string;
  };
  security: {
    isSafe: boolean;
    detectedRisks: string[];
    userRole: string;
    appliedGuardrails: string[];
  };
  optimization: {
    estimatedCost: "Low" | "Medium" | "High";
    indexRecommendations: string[];
    improvements: string[];
  };
  visualization: {
    chartType: "bar" | "line" | "pie" | "metric" | "table";
    xAxisKey?: string;
    yAxisKey?: string;
    title: string;
  };
  logs: AgentLog[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  result?: PipelineResult;
}

export interface SchemaColumn {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  foreignKey?: { table: string; column: string };
  description: string;
}

export interface SchemaTable {
  name: string;
  description: string;
  columns: SchemaColumn[];
}

export interface DatabaseSchema {
  id: string;
  name: string;
  description: string;
  tables: SchemaTable[];
  seedSample: Record<string, any[]>;
}

export interface SuggestedPrompt {
  text: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
}
