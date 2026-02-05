/**
 * Simple test script to run TTK simulation for comparison with Electron
 */

import path from 'path';
import fs from 'fs';
import 'reflect-metadata';

// Import DI and built core modules
import {
  registerDependencies,
  resolve,
  ILoggerToken,
  IDataLoaderToken,
  IBattleSimulatorToken,
} from './dist/infrastructure/di/container.js';
import { PartyConfig } from './dist/core/domain/index.js';
import { TtkTarget } from './dist/core/domain/index.js';

// Register dependencies before using resolve
registerDependencies();

async function runSimulation() {
  const logger = resolve(ILoggerToken);
  const dataLoader = resolve(IDataLoaderToken);
  const simulator = resolve(IBattleSimulatorToken);

  const projectPath = '/Users/edney/projects/coreto/projectX/frontend';
  const trechoId = 'primeiro-caminho-a-kravens';
  const seed = 12345;
  const maxTurns = 100;

  console.log('='.repeat(60));
  console.log('TTK Simulation Test (Direct Core)');
  console.log('='.repeat(60));
  console.log(`Project: ${projectPath}`);
  console.log(`Trecho: ${trechoId}`);
  console.log(`Seed: ${seed}`);
  console.log(`Max Turns: ${maxTurns}`);
  console.log('='.repeat(60));

  // Load database
  const database = await dataLoader.loadDatabase(projectPath);
  logger.info('Database loaded', { actors: database.$dataActors.length, troops: database.$dataTroops.length });

  // Initialize simulator
  await simulator.initialize(database, projectPath);

  // Load config to get trecho details
  const configPath = '/Users/edney/projects/coreto/game-engine/temp/project.config.json';
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const trecho = config.trechos.find(t => t.id === trechoId);
  if (!trecho) {
    throw new Error(`Trecho not found: ${trechoId}`);
  }

  console.log('\nTrecho Config:');
  console.log(`  Name: ${trecho.name}`);
  console.log(`  Troop IDs: ${trecho.troopIds.join(', ')}`);
  console.log(`  TTK Target: ${trecho.ttkTarget.turns} turns, ${trecho.ttkTarget.actions} actions`);
  console.log(`  Tolerance: ${trecho.ttkTarget.tolerance}%`);
  console.log(`  Party: ${JSON.stringify(trecho.party.members)}`);

  // Run battle with first troop
  const troopId = trecho.troopIds[0];
  const troop = database.$dataTroops.find(t => t && t.id === troopId);
  console.log(`\nRunning battle against: ${troop ? troop.name : 'Unknown'}`);

  const result = await simulator.executeBattle({
    troopId,
    party: trecho.party,
    seed,
    maxTurns,
  });

  console.log('\n' + '='.repeat(60));
  console.log('RESULT:');
  console.log('='.repeat(60));
  console.log(JSON.stringify(result, null, 2));
  console.log('='.repeat(60));

  // Check tolerance
  const target = new TtkTarget(
    trecho.ttkTarget.turns,
    trecho.ttkTarget.actions,
    trecho.ttkTarget.tolerance
  );
  const passed = target.isWithinTolerance(result.ttkTurns, result.ttkActions);
  console.log(`\nWithin Tolerance: ${passed}`);
  if (!passed) {
    console.log(`  Target: ${trecho.ttkTarget.turns} turns, ${trecho.ttkTarget.actions} actions`);
    console.log(`  Actual: ${result.ttkTurns} turns, ${result.ttkActions} actions`);
  }

  // Compare with Electron output
  console.log('\n' + '='.repeat(60));
  console.log('COMPARISON WITH ELECTRON:');
  console.log('='.repeat(60));
  console.log('Electron output:');
  console.log('  ttkTurns: 1, ttkActions: 2, outcome: victory');
  console.log('\nCore output:');
  console.log(`  ttkTurns: ${result.ttkTurns}, ttkActions: ${result.ttkActions}, outcome: ${result.outcome}`);
  console.log('\nMatch:', result.ttkTurns === 1 && result.ttkActions === 2 && result.outcome === 'victory' ? '✓ YES' : '✗ NO');
}

runSimulation().catch(console.error);
