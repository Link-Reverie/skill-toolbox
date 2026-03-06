import type {
  SkillIR,
  SkillMetadata,
  SkillSection,
  SkillCodeBlock,
  SkillDependency,
  SkillReference,
} from './skill';

/**
 * Type guard for SkillMetadata
 */
export function isSkillMetadata(value: unknown): value is SkillMetadata {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const meta = value as Record<string, unknown>;
  return typeof meta.name === 'string' && typeof meta.version === 'string';
}

/**
 * Type guard for SkillSection
 */
export function isSkillSection(value: unknown): value is SkillSection {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const section = value as Record<string, unknown>;
  return (
    typeof section.level === 'number' &&
    typeof section.title === 'string' &&
    typeof section.content === 'string'
  );
}

/**
 * Type guard for SkillSection array
 */
export function isSkillSections(value: unknown): value is SkillSection[] {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.every(isSkillSection);
}

/**
 * Type guard for SkillCodeBlock
 */
export function isSkillCodeBlock(value: unknown): value is SkillCodeBlock {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const block = value as Record<string, unknown>;
  return typeof block.language === 'string' && typeof block.code === 'string';
}

/**
 * Type guard for SkillCodeBlock array
 */
export function isSkillCodeBlocks(value: unknown): value is SkillCodeBlock[] {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.every(isSkillCodeBlock);
}

/**
 * Type guard for SkillDependency
 */
export function isSkillDependency(value: unknown): value is SkillDependency {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const dep = value as Record<string, unknown>;
  const validTypes = ['skill', 'npm', 'system'];
  return (
    typeof dep.type === 'string' &&
    validTypes.includes(dep.type) &&
    typeof dep.name === 'string'
  );
}

/**
 * Type guard for SkillDependency array
 */
export function isSkillDependencies(value: unknown): value is SkillDependency[] {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.every(isSkillDependency);
}

/**
 * Type guard for SkillReference
 */
export function isSkillReference(value: unknown): value is SkillReference {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const ref = value as Record<string, unknown>;
  const validTypes = ['skill', 'file', 'url'];
  return (
    typeof ref.type === 'string' &&
    validTypes.includes(ref.type) &&
    typeof ref.path === 'string'
  );
}

/**
 * Type guard for SkillReference array
 */
export function isSkillReferences(value: unknown): value is SkillReference[] {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.every(isSkillReference);
}

/**
 * Extract metadata from IR with type safety
 */
export function extractMetadata(ir: SkillIR): SkillMetadata {
  if (isSkillMetadata(ir.metadata)) {
    return ir.metadata;
  }
  // Return default metadata if not present or invalid
  return { name: '', version: '' };
}

/**
 * Extract sections from IR with type safety
 */
export function extractSections(ir: SkillIR): SkillSection[] {
  if (isSkillSections(ir.sections)) {
    return ir.sections;
  }
  return [];
}

/**
 * Extract code blocks from IR with type safety
 */
export function extractCodeBlocks(ir: SkillIR): SkillCodeBlock[] {
  if (isSkillCodeBlocks(ir.codeBlocks)) {
    return ir.codeBlocks;
  }
  return [];
}

/**
 * Extract dependencies from IR with type safety
 */
export function extractDependencies(ir: SkillIR): SkillDependency[] {
  if (isSkillDependencies(ir.dependencies)) {
    return ir.dependencies;
  }
  return [];
}

/**
 * Extract references from IR with type safety
 */
export function extractReferences(ir: SkillIR): SkillReference[] {
  if (isSkillReferences(ir.references)) {
    return ir.references;
  }
  return [];
}
