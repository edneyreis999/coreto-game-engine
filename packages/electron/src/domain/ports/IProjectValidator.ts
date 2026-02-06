/**
 * IProjectValidator Port
 *
 * Port interface for validating RPG Maker MZ project structure and integrity.
 * Implements Clean Architecture's Dependency Inversion Principle.
 */

/**
 * Input for project validation
 */
export interface ValidateProjectInput {
  /**
   * Absolute path to the RPG Maker MZ project directory
   */
  projectPath: string;
}

/**
 * Output from project validation
 */
export interface ValidateProjectOutput {
  /**
   * Whether the project passes all validations
   */
  isValid: boolean;

  /**
   * Critical errors that prevent project from being used
   */
  errors: string[];

  /**
   * Non-critical issues that may affect functionality
   */
  warnings: string[];

  /**
   * List of required files that must exist in a valid project
   */
  requiredFiles?: string[];
}

/**
 * Port interface for project validation logic.
 * Implementations should be placed in infrastructure/adapters.
 */
export interface IProjectValidator {
  /**
   * Validates an RPG Maker MZ project structure and data integrity.
   *
   * @param input - Project path and validation options
   * @returns Validation result with errors and warnings
   */
  validate(input: ValidateProjectInput): Promise<ValidateProjectOutput>;

  /**
   * Opens a project and returns basic metadata.
   *
   * @param projectPath - Absolute path to project directory
   * @returns Project information including counts of entities
   */
  getProjectInfo(projectPath: string): Promise<ProjectInfo>;
}

/**
 * Project information returned after opening/validating
 */
export interface ProjectInfo {
  path: string;
  name: string;
  isValid: boolean;
  troopsCount: number;
  classesCount: number;
  enemiesCount: number;
}
