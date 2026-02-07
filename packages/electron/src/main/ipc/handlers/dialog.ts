/**
 * Dialog IPC Handlers
 *
 * Handlers for native dialogs (directory selection, etc.).
 */

import type { IpcMainInvokeEvent } from 'electron';
import { dialog, BrowserWindow, BaseWindow } from 'electron';

import type { IPCResult } from '../protocol-types.js';
import type { OpenDirectoryResponse } from '../types.js';
import { wrapHandler } from '../ipc-response.js';

/**
 * Handler: dialog:openDirectory
 *
 * Opens a native directory selection dialog.
 * Returns the selected directory path or cancellation status.
 */
export async function handleDialogOpenDirectory(
  _event: IpcMainInvokeEvent,
  _payload: unknown
): Promise<IPCResult<OpenDirectoryResponse>> {
  return wrapHandler(async () => {
    // Get the focused window using getFocusedWindow() (more efficient)
    // If no window is focused, fall back to checking isFocused()
    const focusedWindow =
      BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows().find((w) => w.isFocused());

    // dialog.showOpenDialog can accept undefined (per Electron docs), but TS types don't reflect this
    // Type assertion needed because BaseWindow type doesn't include undefined
    const result = await dialog.showOpenDialog(
      (focusedWindow ?? undefined) as unknown as BaseWindow,
      {
        properties: ['openDirectory'],
        title: 'Select RPG Maker MZ Project Folder',
      }
    );

    return {
      canceled: result.canceled,
      filePaths: result.filePaths,
    };
  });
}
