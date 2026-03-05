import type { Token } from 'marked';

/**
 * Intermediate Representation of a skill
 */
export interface SkillIR {
  /** YAML frontmatter raw content */
  frontmatter?: string;

  /** Marked parsed tokens */
  tokens: Token[];

  /** Raw markdown content */
  raw: string;

  /** Plugin extension fields */
  [key: string]: unknown;
}

/**
 * Skill metadata from YAML frontmatter
 */
export interface SkillMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  tags?: string[];
  keywords?: string[];
  [key: string]: unknown;
}

/**
 * Skill section (extracted from headings)
 */
export interface SkillSection {
  level: number;
  title: string;
  content: string;
}

/**
 * Code block in skill
 */
export interface SkillCodeBlock {
  language: string;
  code: string;
  commands?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Skill dependency
 */
export interface SkillDependency {
  type: 'skill' | 'npm' | 'system';
  name: string;
  version?: string;
  optional?: boolean;
}

/**
 * Skill reference (to other skills or files)
 */
export interface SkillReference {
  type: 'skill' | 'file' | 'url';
  path: string;
  alias?: string;
}

/**
 * Complete parsed skill object
 */
export interface Skill {
  /** Metadata from frontmatter */
  metadata: SkillMetadata;

  /** Sections from headings */
  sections: SkillSection[];

  /** Code blocks */
  codeBlocks: SkillCodeBlock[];

  /** Dependencies */
  dependencies: SkillDependency[];

  /** References */
  references: SkillReference[];

  /** Raw content */
  raw: {
    markdown: string;
    path?: string;
    source?: string;
  };

  // ✅ Plugin extension data - allows plugins to add custom fields
  [key: string]: any;
}

/**
 * Plugin validation result
 */
export interface PluginValidationResult {
  valid: boolean;
  errors?: Array<{ message: string }>;
}
