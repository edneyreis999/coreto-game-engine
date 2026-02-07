/**
 * Project Config Schema Tests
 *
 * Tests for project configuration Zod schemas.
 *
 * @see packages/electron/src/domain/schemas/ui-config.schema.ts
 */

import {
  ProjectConfigSchema,
  TrechoConfigSchema,
} from '@/domain/schemas';
import { UITrechoConfigBuilder, UIProjectConfigBuilder } from '../../../helpers/builders';

describe('ProjectConfigSchema', () => {
  describe('parse()', () => {
    it('should parse valid config successfully', () => {
      const config = UIProjectConfigBuilder.create().build();
      const result = ProjectConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept config with empty trechos array', () => {
      const config = UIProjectConfigBuilder.create()
        .withEmptyTrechos()
        .build();
      const result = ProjectConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept default version', () => {
      const config = { trechos: [], version: undefined };
      const result = ProjectConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.version).toBe('1.0');
      }
    });

    it('should accept config without metadata', () => {
      const config = {
        version: '1.0',
        trechos: [],
      };
      const result = ProjectConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept config with metadata', () => {
      const config = UIProjectConfigBuilder.create()
        .withMetadata({
          projectName: 'Test Project',
          lastModified: Date.now(),
        })
        .build();
      const result = ProjectConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject empty trecho id', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withId('')
        .build();
      const result = ProjectConfigSchema.safeParse({
        version: '1.0',
        trechos: [trecho],
      });
      expect(result.success).toBe(false);
    });

    it('should reject trecho with empty name', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withName('')
        .build();
      const result = ProjectConfigSchema.safeParse({
        version: '1.0',
        trechos: [trecho],
      });
      expect(result.success).toBe(false);
    });

    it('should reject trecho with invalid anchor level range (min > max)', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withInvalidAnchorLevelRange()
        .build();
      const result = ProjectConfigSchema.safeParse({
        version: '1.0',
        trechos: [trecho],
      });
      expect(result.success).toBe(false);
    });

    it('should reject trecho with empty troopIds array', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withEmptyTroopIds()
        .build();
      const result = ProjectConfigSchema.safeParse({
        version: '1.0',
        trechos: [trecho],
      });
      expect(result.success).toBe(false);
    });

    it('should reject trecho with empty party array', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withEmptyParty()
        .build();
      const result = ProjectConfigSchema.safeParse({
        version: '1.0',
        trechos: [trecho],
      });
      expect(result.success).toBe(false);
    });

    it('should reject trecho with negative tolerance', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withNegativeTolerance()
        .build();
      const result = ProjectConfigSchema.safeParse({
        version: '1.0',
        trechos: [trecho],
      });
      expect(result.success).toBe(false);
    });

    it('should reject trecho with tolerance over 100', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withToleranceOver100()
        .build();
      const result = ProjectConfigSchema.safeParse({
        version: '1.0',
        trechos: [trecho],
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('TrechoConfigSchema', () => {
  describe('parse()', () => {
    it('should accept valid trecho config', () => {
      const trecho = UITrechoConfigBuilder.create().build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(true);
    });

    it('should accept valid id format with hyphens and numbers', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withId('ato1-nivel5-42')
        .build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(true);
    });

    it('should accept valid anchorLevelMin 1', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withAnchorLevelMin(1)
        .withAnchorLevelMax(5)
        .build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(true);
    });

    it('should accept valid anchorLevelMax 99', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withAnchorLevelMin(5)
        .withAnchorLevelMax(99)
        .build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(true);
    });

    it('should accept anchorLevelMin equals anchorLevelMax', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withAnchorLevelMin(10)
        .withAnchorLevelMax(10)
        .build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(true);
    });

    it('should accept valid tolerancePercent 0', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withTolerancePercent(0)
        .build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(true);
    });

    it('should accept valid tolerancePercent 100', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withTolerancePercent(100)
        .build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(true);
    });

    it('should reject empty id', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withId('')
        .build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withName('')
        .build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject anchorLevelMin below 1', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withAnchorLevelMin(0)
        .build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject anchorLevelMin above 99', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withAnchorLevelMin(100)
        .build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject anchorLevelMax below 1', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withAnchorLevelMin(5)
        .withAnchorLevelMax(0)
        .build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject anchorLevelMax above 99', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withAnchorLevelMin(5)
        .withAnchorLevelMax(100)
        .build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject invalid anchor level range (min > max)', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withInvalidAnchorLevelRange()
        .build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject empty troopIds array', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withEmptyTroopIds()
        .build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject empty party array', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withEmptyParty()
        .build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject party with more than 4 members', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withParty([
          { classId: 1, level: 10 },
          { classId: 2, level: 10 },
          { classId: 3, level: 10 },
          { classId: 4, level: 10 },
          { classId: 5, level: 10 }, // 5th member - too many!
        ])
        .build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject negative tolerancePercent', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withNegativeTolerance()
        .build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject tolerancePercent over 100', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withToleranceOver100()
        .build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject non-positive targetTtkTurns', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withTargetTtkTurns(0)
        .build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject non-positive targetTtkActions', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withTargetTtkActions(0)
        .build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject party member with level below 1', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withParty([{ classId: 1, level: 0 }])
        .build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject party member with level above 99', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withParty([{ classId: 1, level: 100 }])
        .build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject party member with non-positive classId', () => {
      const trecho = UITrechoConfigBuilder.create()
        .withParty([{ classId: 0, level: 10 }])
        .build();
      const result = TrechoConfigSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });
  });
});
