import fs from 'fs-extra';
import path from 'path';

/**
 * Default skill file candidates to search for
 */
const SKILL_FILE_CANDIDATES = ['SKILL.md', 'skill.md', 'README.md', 'readme.md'];

/**
 * Find skill file in a directory
 * @param dir Directory to search
 * @param candidates File names to search for (default: SKILL.md, skill.md, README.md, readme.md)
 * @returns Path to skill file or null if not found
 */
export async function findSkillFile(
  dir: string,
  candidates: string[] = SKILL_FILE_CANDIDATES
): Promise<string | null> {
  for (const file of candidates) {
    const filePath = path.join(dir, file);
    if (await fs.pathExists(filePath)) {
      return filePath;
    }
  }
  return null;
}

/**
 * Check if a directory contains a skill file
 * @param dir Directory to check
 * @returns True if directory contains a skill file
 */
export async function isSkillDirectory(dir: string): Promise<boolean> {
  return (await findSkillFile(dir)) !== null;
}
