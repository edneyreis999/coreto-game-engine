/**
 * Type declarations for window.coreto API
 *
 * This declares the coreto API that is injected by the preload script
 * in the Electron renderer process.
 */

declare global {
  interface Window {
    /**
     * Coreto API - injected by preload script
     */
    coreto: {
      openProject: (projectPath: string) => Promise<void>;
      validateProject: (projectPath: string) => Promise<void>;
      runSimulation: (config: unknown) => Promise<void>;
      startSimulation: (config: unknown) => Promise<void>;
      getSimulationProgress: () => Promise<unknown>;
      cancelSimulation: () => Promise<void>;
      getSimulationResults: () => Promise<unknown>;
      loadConfig: () => Promise<unknown>;
      getTrechos: () => Promise<unknown[]>;
      updateTrecho: (id: string, data: unknown) => Promise<void>;
      deleteTrecho: (id: string) => Promise<void>;
      getTroops: () => Promise<unknown[]>;
      getClasses: () => Promise<unknown[]>;
      getEnemies: () => Promise<unknown[]>;
      listRecent: () => Promise<unknown[]>;
      addRecent: (project: unknown) => Promise<void>;
      getPreferences: () => Promise<unknown>;
      setPreferences: (prefs: unknown) => Promise<void>;
      updateGlobalSettings: (settings: unknown) => Promise<void>;
      onProgress: (callback: (payload: unknown) => void) => () => void;
      onComplete: (callback: (result: unknown) => void) => () => void;
      onError: (callback: (error: unknown) => void) => () => void;
    };
  }
}

export {};
