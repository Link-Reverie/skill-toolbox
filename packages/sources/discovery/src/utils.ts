import { stat } from 'fs/promises';
import { join, dirname, resolve } from 'path';

/**
 * Walk up directories to find target directories
 *
 * @param targets - Target directory names to search for
 * @param start - Starting directory
 * @param stop - Stop directory (exclusive)
 * @returns Array of found directory paths
 *
 * @example
 * // Find .claude and .agents directories from current dir up to root
 * const dirs = await walkUp(['.claude', '.agents'], process.cwd());
 */
export async function walkUp(
  targets: string[],
  start: string,
  stop?: string
): Promise<string[]> {
  const results: string[] = [];
  let current = resolve(start);
  const stopResolved = stop ? resolve(stop) : undefined;

  while (true) {
    // Check if we've reached the stop point
    if (stopResolved && current === stopResolved) {
      break;
    }

    // Check each target directory
    for (const target of targets) {
      const targetPath = join(current, target);
      if (await isDirectory(targetPath)) {
        results.push(targetPath);
      }
    }

    // Move up one level
    const parent = dirname(current);
    if (parent === current) {
      // Reached root directory
      break;
    }
    current = parent;
  }

  return results;
}

/**
 * Check if a path is a directory
 */
export async function isDirectory(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a path exists
 */
export async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
