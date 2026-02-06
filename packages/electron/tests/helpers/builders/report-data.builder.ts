/**
 * FakeBuilder for ReportData in tests.
 * Provides realistic test data following DDD testing patterns.
 *
 * @see packages/core/src/core/domain/Report.ts
 */

import Chance from 'chance';
import type { ReportData, ReportMetadata, ReportSummary, TrechoSummary, WarningData } from '@coreto/core';
import { TrechoSummaryBuilder } from './trecho-summary.builder';
import { WarningBuilder } from './warning.builder';

const chance = new Chance();

/**
 * Builder for creating ReportData in tests.
 */
export class ReportDataBuilder {
  private data: Partial<ReportData> = {};

  static create(): ReportDataBuilder {
    return new ReportDataBuilder().withDefaults();
  }

  withDefaults(): this {
    const trechoCount = chance.natural({ min: 1, max: 5 });
    const trechos = Array.from({ length: trechoCount }, () =>
      TrechoSummaryBuilder.create().build()
    );

    const totalBattles = trechos.reduce((sum, t) => sum + t.battles.length, 0);
    const successRate = trechos.filter((t) => t.passed).length / trechos.length;

    this.data = {
      metadata: {
        version: '1.0.0',
        generatedAt: new Date(),
        seed: chance.natural({ min: 1, max: 999999 }),
        projectPath: `/Users/dev/rpgmaker/${chance.word()}`,
      },
      summary: {
        executionTimeMs: chance.natural({ min: 1000, max: 60000 }),
        totalTrechos: trechoCount,
        totalBattles,
        totalWarnings: chance.natural({ min: 0, max: 20 }),
        warningsByType: {},
        successRate,
        peakMemoryMB: chance.floating({ min: 50, max: 500, fixed: 2 }),
      },
      trechos,
      warnings: [],
    };
    return this;
  }

  withMetadata(metadata: ReportMetadata): this {
    this.data.metadata = metadata;
    return this;
  }

  withVersion(version: string): this {
    if (this.data.metadata) {
      this.data.metadata = { ...this.data.metadata, version };
    }
    return this;
  }

  withGeneratedAt(date: Date): this {
    if (this.data.metadata) {
      this.data.metadata = { ...this.data.metadata, generatedAt: date };
    }
    return this;
  }

  withSeed(seed: number): this {
    if (this.data.metadata) {
      this.data.metadata = { ...this.data.metadata, seed };
    }
    return this;
  }

  withProjectPath(path: string): this {
    if (this.data.metadata) {
      this.data.metadata = { ...this.data.metadata, projectPath: path };
    }
    return this;
  }

  withSummary(summary: ReportSummary): this {
    this.data.summary = summary;
    return this;
  }

  withTrechos(trechos: unknown[]): this {
    this.data.trechos = trechos as TrechoSummary[];
    return this;
  }

  addTrecho(trecho: unknown): this {
    this.data.trechos = [...(this.data.trechos || []), trecho] as TrechoSummary[];
    return this;
  }

  withWarnings(warnings: unknown[]): this {
    this.data.warnings = warnings as WarningData[];
    return this;
  }

  addWarning(warning: unknown): this {
    this.data.warnings = [...(this.data.warnings || []), warning] as WarningData[];
    return this;
  }

  withCriticalWarning(): this {
    return this.addWarning(WarningBuilder.create().critical().build());
  }

  withAllPassed(): this {
    this.data.trechos = (this.data.trechos || []).map((t) => ({ ...t, passed: true }));
    if (this.data.summary) {
      this.data.summary = { ...this.data.summary, successRate: 1.0 };
    }
    return this;
  }

  build(): ReportData {
    return this.data as ReportData;
  }
}
