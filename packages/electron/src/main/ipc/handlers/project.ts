/**
 * Project IPC Handlers
 *
 * Handlers for opening and validating RPG Maker MZ projects.
 * Uses DI container for dependency resolution.
 */

import type { IpcMainInvokeEvent } from 'electron';

import type { IPCResult } from '../protocol-types.js';
import type { ProjectInfo, ValidationResult } from '../types.js';
import { ProjectOpenPayloadSchema, ProjectValidatePayloadSchema } from '../types.js';
import { wrapHandler } from '../ipc-response.js';
import { resolve } from '../../di/container.js';
import { IProjectValidatorToken } from '../../di/tokens.js';
import type { IProjectValidator } from '@coreto/electron/domain/ports';

/**
 * Validates an IPC payload against its Zod schema.
 */
function validatePayload<T extends unknown>(
  channel: string,
  payload: unknown,
  schema: { safeParse: (data: unknown) => { success: boolean; error?: { errors: Array<{ path: string[]; message: string }> } } }
): asserts payload is T {
  const result = schema.safeParse(payload);

  if (!result.success) {
    const errorMessages = result.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    throw new Error(`Invalid payload for ${channel}: ${errorMessages}`);
  }
}

/**
 * Handler: project:open
 *
 * Opens an RPG Maker MZ project and returns basic project info.
 * Thin adapter - delegates to domain use case.
 */
export async function handleProjectOpen(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<ProjectInfo>> {
  return wrapHandler(async () => {
    validatePayload('project:open', payload, ProjectOpenPayloadSchema);

    const { path: projectPath } = payload;

    // Resolve IProjectValidator from DI container
    const validator = resolve<IProjectValidator>(IProjectValidatorToken);

    return validator.getProjectInfo(projectPath);
  });
}

/**
 * Handler: project:validate
 *
 * Validates an RPG Maker MZ project structure and data integrity.
 * Thin adapter - delegates to domain use case.
 */
export async function handleProjectValidate(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<ValidationResult>> {
  return wrapHandler(async () => {
    validatePayload('project:validate', payload, ProjectValidatePayloadSchema);

    const { path: projectPath } = payload;

    // Resolve IProjectValidator from DI container
    const validator = resolve<IProjectValidator>(IProjectValidatorToken);

    return validator.validate({ projectPath });
  });
}
