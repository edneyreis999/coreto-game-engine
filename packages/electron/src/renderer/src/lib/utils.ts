/**
 * Utility Functions
 *
 * Common utility functions used across the application.
 * Includes className merging, date formatting, and string utilities.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================================================
// Class Name Utilities
// ============================================================================

/**
 * Merges Tailwind CSS classes using clsx and tailwind-merge.
 * Combines conditional classes and resolves Tailwind conflicts.
 *
 * @param inputs - Class names to merge
 * @returns Merged class string
 *
 * @example
 * cn('px-2 py-1', 'px-4') // 'py-1 px-4' (px-4 overrides px-2)
 * cn('text-red-500', someCondition && 'text-blue-500') // conditional classes
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ============================================================================
// Date Formatting Utilities
// ============================================================================

/**
 * Formats an ISO timestamp as a relative date string.
 * Returns "Today", "Yesterday", or a formatted date.
 *
 * @param isoString - ISO 8601 timestamp string
 * @returns Formatted date string
 *
 * @example
 * formatDateRelative('2026-01-20T10:30:00.000Z') // "Today" (if today)
 * formatDateRelative('2026-01-19T10:30:00.000Z') // "Yesterday" (if yesterday)
 * formatDateRelative('2026-01-15T10:30:00.000Z') // "Jan 15, 2026"
 */
export function formatDateRelative(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time portions for accurate day comparison
  const resetTime = (d: Date): Date => {
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const dateOnly = resetTime(new Date(date));
  const nowOnly = resetTime(new Date(now));
  const yesterdayOnly = resetTime(new Date(yesterday));

  if (dateOnly.getTime() === nowOnly.getTime()) {
    return 'Today';
  }

  if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return 'Yesterday';
  }

  return formatDate(isoString);
}

/**
 * Formats an ISO timestamp as a localized date string.
 *
 * @param isoString - ISO 8601 timestamp string
 * @returns Formatted date string (e.g., "Jan 15, 2026")
 *
 * @example
 * formatDate('2026-01-15T10:30:00.000Z') // "Jan 15, 2026"
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const locale = navigator.language || 'en-US';

  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats an ISO timestamp as a localized date and time string.
 *
 * @param isoString - ISO 8601 timestamp string
 * @returns Formatted date and time string
 *
 * @example
 * formatDateTime('2026-01-15T10:30:00.000Z') // "Jan 15, 2026, 10:30 AM"
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  const locale = navigator.language || 'en-US';

  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ============================================================================
// String Utilities
// ============================================================================

/**
 * Truncates a string to a maximum length and adds ellipsis.
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated string with ellipsis if needed
 *
 * @example
 * truncate('/very/long/path/to/project', 20) // "/very/long/path/to..."
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }

  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Gets the base name from a file path (last segment).
 *
 * @param filePath - File path
 * @returns Base name of the file/directory
 *
 * @example
 * getBaseName('/path/to/project') // 'project'
 */
export function getBaseName(filePath: string): string {
  const segments = filePath.replace(/\\/g, '/').split('/');
  return segments[segments.length - 1] ?? filePath;
}

/**
 * Formats a file size in bytes to human-readable format.
 *
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 *
 * @example
 * formatFileSize(1024) // '1 KB'
 * formatFileSize(1048576) // '1 MB'
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
