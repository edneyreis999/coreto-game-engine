import * as fs from 'fs';
import * as path from 'path';

/* eslint-disable @typescript-eslint/no-explicit-any */
// This file intentionally uses 'any' types to interface with RPG Maker MZ database APIs

/**
 * DatabaseLoader
 *
 * Override DataManager._loadDataFile para usar fs.readFileSync síncronamente
 * ao invés de XMLHttpRequest assíncrono.
 *
 * CRÍTICO: DataManager.onLoad callback DEVE ser chamado manualmente após
 * fs.readFileSync para atualizar contadores de carregamento (pesquisa linha 354).
 *
 * Baseado em:
 * - Pesquisa POC: Headless RPG Maker MZ Node.js POC.md - Seção 4.1
 * - ADR-016: Synchronous Database Loading
 */
export class DatabaseLoader {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Override DataManager.loadDataFile para usar fs.readFileSync.
   *
   * Substitui o comportamento assíncrono de XMLHttpRequest por leitura
   * síncrona de arquivos JSON usando Node.js fs.
   *
   * IMPORTANTE: Chama DataManager.onLoad(window[name]) manualmente
   * para notificar o sistema que o arquivo foi carregado.
   *
   * @throws {Error} Se DataManager não existir (scripts não carregados)
   */
  overrideDataManager(): void {
    const DATA_PATH = path.join(this.projectPath, 'data');
    const DataManager = (global as any).DataManager;

    if (!DataManager) {
      throw new Error('DataManager not found - load core scripts first (Task 22)');
    }

    // Override loadDataFile (pesquisa linha 341)
    DataManager.loadDataFile = function (name: string, src: string) {
      const filePath = path.join(DATA_PATH, src);

      try {
        // Leitura síncrona do arquivo JSON (pesquisa linha 345)
        const data = fs.readFileSync(filePath, 'utf8');

        // Parse do JSON e atribuição à variável global (ex: $dataActors)
        // O RMMZ espera que window[name] seja populado
        (window as any)[name] = JSON.parse(data);

        // CRÍTICO: Disparar onLoad manualmente (pesquisa linha 354)
        // O RMMZ usa contadores/callbacks para saber quando DB está pronto
        // Sem isso, isDatabaseLoaded() nunca retorna true
        DataManager.onLoad((window as any)[name]);

          console.log(`[DatabaseLoader] Loaded ${src} → ${name}`);

        // CRITICAL: Sync to global for RPG Maker MZ compatibility
        // Some RMMZ code accesses $data* via global, not window
        (global as any)[name] = (window as any)[name];
      } catch (e) {
        console.error(`[DatabaseLoader] Failed to load ${src}:`, e);
        // Define flag de erro para o DataManager tratar
        DataManager._errorUrl = name;
      }
    };

    console.log('[DatabaseLoader] DataManager.loadDataFile override applied');
  }

  /**
   * Loop de espera até database estar pronta.
   *
   * Aguarda até que DataManager.isDatabaseLoaded() retorne true.
   * Essencial após DataManager.loadDatabase() para garantir que todos
   * os arquivos JSON foram carregados e processados.
   *
   * @param timeout - Tempo máximo de espera em ms (padrão: 10000ms)
   * @returns Promise que resolve quando database está pronta
   * @throws {Error} Se timeout for atingido
   */
  async waitForDatabase(timeout: number = 10000): Promise<void> {
    const DataManager = (global as any).DataManager;

    // Loop de espera até database estar pronta (pesquisa linhas 521-526)
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const waitInterval = setInterval(() => {
        if (DataManager.isDatabaseLoaded()) {
          clearInterval(waitInterval);
          console.log('[DatabaseLoader] Database loaded successfully');
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(waitInterval);
          reject(new Error('Database loading timeout'));
        }
      }, 10); // Check a cada 10ms
    });
  }

  /**
   * Inicia o carregamento da database do RPG Maker MZ.
   *
   * Chama DataManager.loadDatabase() que irá usar o override
   * aplicado por overrideDataManager().
   */
  loadDatabase(): void {
    const DataManager = (global as any).DataManager;

    if (!DataManager) {
      throw new Error('DataManager not found');
    }

    console.log('[DatabaseLoader] Starting database load...');
    DataManager.loadDatabase();
  }

  /**
   * Valida que todos os dados obrigatórios foram carregados.
   *
   * Verifica que as variáveis globais $data* não são null e,
   * se forem arrays, não estão vazias (exceto casos válidos).
   *
   * @throws {Error} Se algum dado obrigatório estiver null
   */
  validateDatabase(): void {
    const requiredData = [
      '$dataActors',
      '$dataClasses',
      '$dataSkills',
      '$dataItems',
      '$dataWeapons',
      '$dataArmors',
      '$dataEnemies',
      '$dataTroops',
      '$dataStates',
      '$dataSystem',
    ];

    for (const dataName of requiredData) {
      // Database é sincronizado para global[name] (linha 67)
      const data = (global as any)[dataName];

      if (!data) {
        throw new Error(`Database validation failed: ${dataName} is ${data === null ? 'null' : 'undefined'}`);
      }

      // Avisar se array está vazio (pode ser válido em projetos novos)
      if (Array.isArray(data) && data.length === 0) {
        console.warn(`[DatabaseLoader] ${dataName} is empty array`);
      }
    }

    console.log('[DatabaseLoader] Database validation passed');
  }
}
