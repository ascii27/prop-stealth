import { db } from "../db/client.js";

// ---------------------------------------------------------------------------
// Agent types
// ---------------------------------------------------------------------------

export interface AgentContext {
  userId: string;
  agentName: string;
  params: Record<string, unknown>;
}

export interface AgentResult {
  status: "success" | "error";
  summary: string;
  data: Record<string, unknown>;
  actions: number;
}

export type AgentRunner = (context: AgentContext) => Promise<AgentResult>;

// ---------------------------------------------------------------------------
// Agent registry
// ---------------------------------------------------------------------------

const agents: Record<string, AgentRunner> = {};

export function registerAgent(name: string, runner: AgentRunner): void {
  agents[name] = runner;
}

export function getAgent(name: string): AgentRunner | undefined {
  return agents[name];
}

// ---------------------------------------------------------------------------
// Run logging
// ---------------------------------------------------------------------------

export async function logAgentRun(
  userId: string,
  agentName: string,
  result: AgentResult,
  durationMs: number,
): Promise<void> {
  await db.query(
    `INSERT INTO agent_runs (user_id, agent_name, status, summary, actions, duration_ms, error)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      userId,
      agentName,
      result.status,
      result.summary,
      result.actions,
      durationMs,
      result.status === "error" ? result.summary : null,
    ],
  );
}
