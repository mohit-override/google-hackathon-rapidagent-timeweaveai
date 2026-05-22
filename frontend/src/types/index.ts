export interface ReplaySession {
  id: string;
  name: string;
  description: string;
  triggeredAt: string;
  status: string;
  scenarioName: string;
  causalChainJson?: string;
  rootCauseSummary?: string;
  geminiAnalysis?: string;
}

export interface TelemetrySpan {
  id: string;
  sessionId: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  serviceName: string;
  name: string;
  startTimeUnixNano: number;
  endTimeUnixNano: number;
  durationMs: number;
  statusCode: string;
  statusMessage?: string;
  attributesJson: string; // JSON string
}

export interface SimulationResult {
  id: string;
  sessionId: string;
  scenarioName: string;
  cappedRetries: boolean;
  latencyImprovementMs: number;
  originalFailureCount: number;
  simulatedFailureCount: number;
  simulationSummary?: string;
  runAt: string;
}

export interface NodePosition {
  x: number;
  y: number;
}
