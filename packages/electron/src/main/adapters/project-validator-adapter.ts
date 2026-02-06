/**
 * Project Validator Adapter
 *
 * Infrastructure adapter that implements IProjectValidator port.
 * Delegates to domain use cases with injected dependencies.
 *
 * Import Convention (CLAUDE-ARCH-CONVENTION):
 * - @coreto/core imports: external package (standard)
 * - @coreto/electron/domain/* imports: cross-layer (domain ports, use-cases)
 *
 * @see packages/electron/CLAUDE.md (Import Conventions)
 */

// External dependencies (@coreto/core)
import type { IFileSystem, IDataLoader, ILogger } from '@coreto/core';

// Domain layer (cross-layer - module aliases)
import type {
  IProjectValidator,
  ValidateProjectInput,
  ValidateProjectOutput,
  ProjectInfo,
} from '@coreto/electron/domain/ports';
import { validateProject, getProjectInfo } from '@coreto/electron/domain/use-cases';

/**
 * Adapter implementation of IProjectValidator port.
 * Bridges IPC handlers with domain use cases.
 */
export class ProjectValidatorAdapter implements IProjectValidator {
  constructor(
    private readonly fs: IFileSystem,
    private readonly dataLoader: IDataLoader,
    private readonly logger: ILogger
  ) {}

  /**
   * Validates project structure using domain use case.
   */
  async validate(input: ValidateProjectInput): Promise<ValidateProjectOutput> {
    return validateProject(input, this.fs, this.dataLoader, this.logger);
  }

  /**
   * Gets project info using domain use case.
   */
  async getProjectInfo(projectPath: string): Promise<ProjectInfo> {
    return getProjectInfo(projectPath, this.fs, this.logger);
  }
}

/**
 * Factory function for creating ProjectValidatorAdapter instances.
 * Simplifies dependency injection without full DI container.
 *
 * @param fs - File system implementation
 * @param dataLoader - Data loader implementation
 * @param logger - Logger implementation
 * @returns ProjectValidatorAdapter instance
 */
export function createProjectValidator(
  fs: IFileSystem,
  dataLoader: IDataLoader,
  logger: ILogger
): IProjectValidator {
  return new ProjectValidatorAdapter(fs, dataLoader, logger);
}
