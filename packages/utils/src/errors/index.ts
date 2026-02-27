/**
 * Base error class for skill-toolbox
 */
export class SkillToolboxError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SkillToolboxError';
  }
}

/**
 * Parse error
 */
export class ParseError extends SkillToolboxError {
  constructor(
    message: string,
    details?: { line?: number; column?: number; [key: string]: unknown }
  ) {
    super(message, 'PARSE_ERROR', details);
    this.name = 'ParseError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends SkillToolboxError {
  constructor(
    message: string,
    public errors: Array<{ field: string; message: string }>
  ) {
    super(message, 'VALIDATION_ERROR', { errors });
    this.name = 'ValidationError';
  }
}

/**
 * Plugin error
 */
export class PluginError extends SkillToolboxError {
  constructor(
    pluginName: string,
    message: string,
    cause?: Error
  ) {
    super(
      `Plugin "${pluginName}" error: ${message}`,
      'PLUGIN_ERROR',
      { pluginName, cause: cause?.message }
    );
    this.name = 'PluginError';
  }
}

/**
 * Git source error
 */
export class GitSourceError extends SkillToolboxError {
  constructor(message: string, source?: string) {
    super(message, 'GIT_SOURCE_ERROR', { source });
    this.name = 'GitSourceError';
  }
}

/**
 * Network error
 */
export class NetworkError extends SkillToolboxError {
  constructor(message: string, public statusCode?: number) {
    super(message, 'NETWORK_ERROR', { statusCode });
    this.name = 'NetworkError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends SkillToolboxError {
  constructor(resource: string, type: 'skill' | 'file' | 'repository') {
    super(`${type} not found: ${resource}`, 'NOT_FOUND', { resource, type });
    this.name = 'NotFoundError';
  }
}
