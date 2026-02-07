/**
 * Canonical Simulation Entity Definitions
 */

export interface SimulationSummary {
  trechos: Array<{
    id: string;
    description: string;
    avgTTK: number;
    maxTTK: number;
    minTTK: number;
    battleCount: number;
    status: 'SUCCESS' | 'FAILED';
  }>;
  overallTTK: number;
  totalBattles: number;
  warningCount: number;
  criticalWarningCount: number;
  duration: number;
  seed?: number;
}

export interface SimulationHistoryEntry {
  id: string;
  projectPath: string;
  timestamp: number;
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  summary: SimulationSummary;
  hasReport: boolean;
}

export interface SimulationReport {
  metadata: {
    id: string;
    timestamp: number;
    projectPath: string;
    version: string;
  };
  summary: SimulationSummary;
  trechos: Array<{
    id: string;
    description: string;
    battles: Array<{
      battleId: string;
      turns: number;
      ttk: number;
      winner: 'heroes' | 'enemies';
      heroes: Array<{ actorId: number; hp: number; damage: number }>;
      enemies: Array<{ enemyId: number; hp: number; damage: number }>;
    }>;
  }>;
  warnings: Array<{
    type: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    context: Record<string, unknown>;
  }>;
}
