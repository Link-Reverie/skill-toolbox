/**
 * YAML frontmatter fallback sanitization
 *
 * Handles non-standard YAML formats, such as values containing colons,
 * by converting them to block scalars for proper parsing.
 *
 * Ported from OpenCode's fallbackSanitization
 */

/**
 * Sanitizes YAML content to handle non-standard formats.
 *
 * This function processes YAML content and converts problematic values
 * (like those containing colons) into block scalar format for safe parsing.
 *
 * @param content - The YAML content string (can be with or without --- delimiters)
 * @returns The sanitized YAML content
 *
 * @example
 * // Input with colon in value
 * const input = `name: my-skill
 * description: This: contains a colon`;
 *
 * // Output with block scalar
 * const output = `name: my-skill
 * description: |-
 *   This: contains a colon`;
 */
export function sanitizeYamlFrontmatter(content: string): string {
  // Check if content has frontmatter delimiters
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (match) {
    // Content has --- delimiters, process the frontmatter inside
    const frontmatter = match[1];
    const processed = sanitizeYamlContent(frontmatter);
    return content.replace(frontmatter, () => processed);
  } else {
    // Content is raw YAML without delimiters, process directly
    return sanitizeYamlContent(content);
  }
}

/**
 * Internal function to sanitize raw YAML content.
 */
function sanitizeYamlContent(content: string): string {
  const lines = content.split(/\r?\n/);
  const result: string[] = [];

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || line.trim() === '') {
      result.push(line);
      continue;
    }

    // Skip indented continuation lines
    if (line.match(/^\s+/)) {
      result.push(line);
      continue;
    }

    // Match key: value pattern
    const kvMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:\s*(.*)$/);
    if (!kvMatch) {
      result.push(line);
      continue;
    }

    const key = kvMatch[1];
    const value = kvMatch[2].trim();

    // Skip empty values, already quoted values, or block scalar indicators
    if (
      value === '' ||
      value === '>' ||
      value === '|' ||
      value.startsWith('"') ||
      value.startsWith("'")
    ) {
      result.push(line);
      continue;
    }

    // If value contains colon, convert to block scalar
    if (value.includes(':')) {
      result.push(`${key}: |-`);
      result.push(`  ${value}`);
      continue;
    }

    result.push(line);
  }

  return result.join('\n');
}
