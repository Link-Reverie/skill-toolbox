import type { SkillPlugin, SkillIR, PluginValidationResult } from '@skill-toolbox/utils';

/**
 * Security issue detected by the plugin
 */
export interface SecurityIssue {
  type: 'dangerous-pattern' | 'sensitive-data' | 'unsafe-command';
  pattern: string;
  line?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

/**
 * Security checking plugin
 *
 * Scans skill content for potential security issues:
 * - Dangerous bash patterns (curl | bash, eval, etc.)
 * - Sensitive data patterns (API keys, passwords, secrets)
 * - Unsafe commands
 *
 * @example
 * ```typescript
 * const plugin = securityPlugin({
 *   failOnError: true,  // Throw error if issues found
 *   severity: 'high'    // Minimum severity to report
 * });
 * ```
 */
export function securityPlugin(options: {
  failOnError?: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
} = {}): SkillPlugin {
  const { failOnError = false, severity = 'medium' } = options;

  const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
  const minSeverity = severityLevels[severity];

  // Dangerous patterns to detect
  const dangerousPatterns = [
    { pattern: /curl\s+[^|]+\|\s*bash/gi, severity: 'critical' as const, message: 'Remote code execution: curl | bash' },
    { pattern: /wget\s+[^|]+\|\s*bash/gi, severity: 'critical' as const, message: 'Remote code execution: wget | bash' },
    { pattern: /eval\s*\(/gi, severity: 'high' as const, message: 'eval() is dangerous' },
    { pattern: /eval\s+"?\$/gi, severity: 'high' as const, message: 'eval with variable is dangerous' },
    { pattern: /\$\([^)]+\)/g, severity: 'medium' as const, message: 'Command substitution - review carefully' },
  ];

  // Sensitive data patterns
  const sensitivePatterns = [
    { pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"]?[^'"\s]+/gi, severity: 'high' as const, message: 'Hardcoded password' },
    { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"]?[^'"\s]+/gi, severity: 'high' as const, message: 'Hardcoded API key' },
    { pattern: /(?:secret|token)\s*[:=]\s*['"]?[^'"\s]+/gi, severity: 'high' as const, message: 'Hardcoded secret/token' },
    { pattern: /(?:aws[_-]?access[_-]?key[_-]?id)\s*[:=]\s*['"]?[A-Z0-9]{20}/gi, severity: 'critical' as const, message: 'AWS access key' },
    { pattern: /(?:aws[_-]?secret[_-]?access[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9/+=]{40}/gi, severity: 'critical' as const, message: 'AWS secret key' },
  ];

  return {
    name: 'security',
    version: '1.0.0',

    parse(ir: SkillIR): SkillIR {
      const issues: SecurityIssue[] = [];

      // Check dangerous patterns
      for (const { pattern, severity: sev, message } of dangerousPatterns) {
        const matches = ir.raw.matchAll(pattern);
        for (const match of matches) {
          if (severityLevels[sev] >= minSeverity) {
            issues.push({
              type: 'dangerous-pattern',
              pattern: pattern.source,
              line: getLineNumber(ir.raw, match.index || 0),
              severity: sev,
              message
            });
          }
        }
      }

      // Check sensitive data
      for (const { pattern, severity: sev, message } of sensitivePatterns) {
        const matches = ir.raw.matchAll(pattern);
        for (const match of matches) {
          if (severityLevels[sev] >= minSeverity) {
            issues.push({
              type: 'sensitive-data',
              pattern: pattern.source,
              line: getLineNumber(ir.raw, match.index || 0),
              severity: sev,
              message
            });
          }
        }
      }

      // Add issues to IR
      const result = { ...ir, securityIssues: issues };

      // Fail on error if configured
      if (failOnError && issues.length > 0) {
        const errorMsg = issues
          .map(i => `${i.severity.toUpperCase()}: ${i.message} (line ${i.line || '?'})`)
          .join('\n');
        throw new Error(`Security issues detected:\n${errorMsg}`);
      }

      return result;
    },

    validate(ir: SkillIR): PluginValidationResult {
      const issues = ir.securityIssues as SecurityIssue[] | undefined;

      if (!issues || issues.length === 0) {
        return { valid: true };
      }

      return {
        valid: false,
        errors: issues.map(issue => ({
          message: `[${issue.severity.toUpperCase()}] ${issue.message} (line ${issue.line || '?'})`
        }))
      };
    }
  };
}

/**
 * Get line number from character index
 */
function getLineNumber(text: string, index: number): number {
  const lines = text.substring(0, index).split('\n');
  return lines.length;
}
