/**
 * Canonical RPG Maker MZ Game Data Entities
 *
 * Single source of truth for game data structure.
 * All ports, use cases, and adapters must import from here.
 */

export interface TroopData {
  id: number;
  name: string;
  members: Array<{
    enemyId: number;
    x: number;
    y: number;
    hidden: boolean;
  }>;
}

export interface ClassData {
  id: number;
  name: string;
  expTable: number[];
}

export interface EnemyData {
  id: number;
  name: string;
  params: number[];
  dropItems: Array<{
    kind: number;
    dataId: number;
    denominator: number;
  }>;
}
