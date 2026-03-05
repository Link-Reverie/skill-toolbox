/**
 * Minimal plugin set for skill-toolbox agent
 *
 * Only includes plugins that are actually consumed:
 * - metadata: Extract name/description (used in system prompt)
 * - variables: Replace {{placeholders}} (used for customization)
 * - security: Optional, for validation
 */

// Import plugins for internal use
import { variablesPlugin as _variablesPlugin } from './variables-plugin';
import { securityPlugin as _securityPlugin } from './security-plugin';

// Re-export for external use
export { variablesPlugin } from './variables-plugin';
export { securityPlugin, type SecurityIssue } from './security-plugin';

/**
 * Create a minimal plugin set for the agent
 *
 * Only includes what's actually needed:
 * - metadata: Always (for skill listing)
 * - variables: Optional (for customization)
 * - security: Optional (for validation)
 *
 * @example
 * ```typescript
 * import { createMinimalPlugins } from './plugins';
 *
 * const plugins = createMinimalPlugins({
 *   variables: { project_name: 'MyApp' },
 *   security: { severity: 'high' }
 * });
 * ```
 */
export function createMinimalPlugins(options: {
  variables?: Record<string, any>;
  security?: {
    failOnError?: boolean;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  };
} = {}) {
  const plugins = [];

  // 1. Variables plugin (optional)
  if (options.variables) {
    plugins.push(_variablesPlugin(options.variables));
  }

  // 2. Security plugin (optional)
  if (options.security) {
    plugins.push(_securityPlugin(options.security));
  }

  return plugins;
}

/**
 * Create standard plugin set (backward compatible)
 * @deprecated Use createMinimalPlugins instead
 */
export function createStandardPlugins(options: {
  variables?: Record<string, any>;
  security?: {
    failOnError?: boolean;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  };
} = {}) {
  return createMinimalPlugins(options);
}
