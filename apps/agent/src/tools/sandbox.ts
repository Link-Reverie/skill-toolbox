/**
 * Three-layer sandbox defense for bash tool
 *
 * Layer 1: Permission presets (command whitelist)
 * Layer 2: Subcommand rules (per-command allow/deny)
 * Layer 3: Dangerous pattern blocklist (always active)
 */

// ============================================================
// Types
// ============================================================

export type SandboxPreset = 'readonly' | 'standard' | 'full';

export interface SubcommandRule {
  /** If set, only these subcommands are allowed */
  allow?: string[];
  /** If set, these subcommands are blocked */
  deny?: string[];
}

export interface SandboxConfig {
  /** Permission preset (default: 'standard') */
  preset: SandboxPreset;
  /** Extra commands to add on top of the preset */
  extraCommands?: string[];
  /** Commands to remove from the preset */
  denyCommands?: string[];
  /** Per-command subcommand rules */
  subcommandRules?: Record<string, SubcommandRule>;
  /** Execution timeout in ms */
  timeout: number;
  /** Default working directory */
  defaultCwd?: string;
}

export interface CommandValidationResult {
  allowed: boolean;
  reason?: string;
}

// ============================================================
// Layer 1: Permission Presets
// ============================================================

const READONLY_COMMANDS = [
  // File inspection
  'ls', 'cat', 'head', 'tail', 'wc', 'find', 'grep', 'awk', 'sed',
  'tree', 'file', 'stat', 'du', 'df',
  // Output
  'echo', 'printf',
  // System info
  'which', 'where', 'pwd', 'whoami', 'env', 'date', 'uname',
  // Windows equivalents
  'dir', 'type', 'findstr', 'Get-ChildItem', 'Get-Content',
  // Text processing
  'sort', 'uniq', 'cut', 'tr', 'diff', 'less', 'more',
];

const STANDARD_COMMANDS = [
  ...READONLY_COMMANDS,
  // Node.js ecosystem
  'node', 'npm', 'pnpm', 'npx', 'yarn',
  'tsc', 'tsx', 'vitest', 'jest', 'eslint', 'prettier',
  // Version control (subcommands controlled by Layer 2)
  'git',
  // File manipulation (non-destructive)
  'mkdir', 'cp', 'mv', 'touch', 'ln',
  // Build tools
  'make', 'cargo', 'go', 'python', 'python3', 'pip', 'pip3',
  // Navigation
  'cd', 'pushd', 'popd',
];

const FULL_COMMANDS = [
  ...STANDARD_COMMANDS,
  // Destructive file ops
  'rm', 'rmdir',
  // Network
  'curl', 'wget', 'ssh', 'scp',
  // Permissions
  'chmod', 'chown',
  // Containers
  'docker', 'docker-compose', 'podman',
  // Misc
  'tar', 'zip', 'unzip', 'gzip', 'gunzip',
];

const PRESETS: Record<SandboxPreset, string[]> = {
  readonly: READONLY_COMMANDS,
  standard: STANDARD_COMMANDS,
  full: FULL_COMMANDS,
};

// ============================================================
// Layer 2: Default Subcommand Rules
// ============================================================

const DEFAULT_SUBCOMMAND_RULES: Record<string, SubcommandRule> = {
  npm: {
    deny: ['publish', 'unpublish', 'deprecate', 'owner', 'token', 'adduser', 'login', 'logout'],
  },
  pnpm: {
    deny: ['publish', 'unpublish'],
  },
  yarn: {
    deny: ['publish', 'npm publish'],
  },
  git: {
    deny: ['push', 'reset', 'rebase', 'clean', 'gc', 'remote'],
  },
  pip: {
    deny: ['install'],  // default deny pip install for safety; user can override
  },
  pip3: {
    deny: ['install'],
  },
  docker: {
    deny: ['rm', 'rmi', 'system prune', 'volume rm'],
  },
};

// ============================================================
// Layer 3: Dangerous Pattern Blocklist (always active)
// ============================================================

interface DangerousPattern {
  pattern: RegExp;
  reason: string;
}

const DANGEROUS_PATTERNS: DangerousPattern[] = [
  // Remote code execution
  {
    pattern: /curl\s.*\|\s*(?:ba)?sh/i,
    reason: 'Remote code execution via curl pipe to shell',
  },
  {
    pattern: /wget\s.*\|\s*(?:ba)?sh/i,
    reason: 'Remote code execution via wget pipe to shell',
  },
  // Destructive filesystem operations
  {
    pattern: /rm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+)?[\/~]\s*/,
    reason: 'Destructive deletion of root or home directory',
  },
  {
    pattern: /rm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+)?\.\.\//,
    reason: 'Destructive deletion above current directory',
  },
  // Disk operations
  {
    pattern: />\s*\/dev\/sd[a-z]/,
    reason: 'Direct write to disk device',
  },
  {
    pattern: /\bmkfs\b/,
    reason: 'Filesystem format command',
  },
  {
    pattern: /\bdd\b.*\bof\s*=/,
    reason: 'Low-level disk write via dd',
  },
  // Fork bomb
  {
    pattern: /:\(\)\s*\{\s*:\|:&\s*\}\s*;?\s*:/,
    reason: 'Fork bomb detected',
  },
  // Privilege escalation
  {
    pattern: /\bsudo\b/,
    reason: 'Privilege escalation via sudo',
  },
  // Permission abuse
  {
    pattern: /chmod\s+[0-7]*7[0-7]*\s/,
    reason: 'Overly permissive chmod (world-writable)',
  },
  // Eval injection
  {
    pattern: /\beval\s+/,
    reason: 'Shell eval injection risk',
  },
  // Sensitive file access
  {
    pattern: /(?:cat|head|tail|less|more|grep)\s+.*(?:\/etc\/shadow|\/etc\/passwd|\.env\b)/,
    reason: 'Accessing sensitive system/environment files',
  },
  // History/credential theft
  {
    pattern: /(?:cat|head|tail)\s+.*(?:\.bash_history|\.ssh\/|\.gnupg\/)/,
    reason: 'Accessing credentials or shell history',
  },
];

// ============================================================
// Sandbox Implementation
// ============================================================

export class CommandSandbox {
  private allowedCommands: Set<string>;
  private subcommandRules: Record<string, SubcommandRule>;
  readonly timeout: number;
  readonly defaultCwd?: string;

  constructor(config: SandboxConfig) {
    // Layer 1: Build allowed command set from preset + modifications
    const presetCommands = PRESETS[config.preset] || PRESETS.standard;
    const extra = config.extraCommands || [];
    const deny = new Set(config.denyCommands || []);

    this.allowedCommands = new Set(
      [...presetCommands, ...extra].filter(cmd => !deny.has(cmd))
    );

    // Layer 2: Merge default subcommand rules with user overrides
    this.subcommandRules = {
      ...DEFAULT_SUBCOMMAND_RULES,
      ...config.subcommandRules,
    };

    this.timeout = config.timeout;
    this.defaultCwd = config.defaultCwd;
  }

  /**
   * Validate a full command string against all 3 layers.
   * Returns { allowed: true } or { allowed: false, reason: '...' }
   */
  validate(command: string): CommandValidationResult {
    // Layer 3 first (always active, catches the worst stuff)
    const patternResult = this.checkDangerousPatterns(command);
    if (!patternResult.allowed) return patternResult;

    // Extract all commands in the chain
    const commandSegments = this.extractSegments(command);

    for (const segment of commandSegments) {
      // Layer 1: Is the command name allowed?
      if (!this.allowedCommands.has(segment.name)) {
        return {
          allowed: false,
          reason: `Command "${segment.name}" is not allowed in "${this.getPresetName()}" preset. ` +
            `Use SANDBOX_EXTRA_COMMANDS to add it.`,
        };
      }

      // Layer 2: Is the subcommand allowed?
      const subResult = this.checkSubcommand(segment.name, segment.subcommand);
      if (!subResult.allowed) return subResult;
    }

    return { allowed: true };
  }

  /**
   * Get the list of allowed commands (for error messages / introspection)
   */
  getAllowedCommands(): string[] {
    return Array.from(this.allowedCommands);
  }

  // --- Layer 1 helpers ---

  private getPresetName(): string {
    // Reverse-lookup (approximate - fine for error messages)
    for (const [name, commands] of Object.entries(PRESETS)) {
      if (commands.length <= this.allowedCommands.size) {
        return name;
      }
    }
    return 'custom';
  }

  // --- Layer 2: Subcommand check ---

  private checkSubcommand(command: string, subcommand: string | null): CommandValidationResult {
    if (!subcommand) return { allowed: true };

    const rule = this.subcommandRules[command];
    if (!rule) return { allowed: true };

    // "allow" list takes priority: if set, subcommand must be in it
    if (rule.allow) {
      if (!rule.allow.includes(subcommand)) {
        return {
          allowed: false,
          reason: `"${command} ${subcommand}" is not allowed. ` +
            `Allowed subcommands: ${rule.allow.join(', ')}`,
        };
      }
      return { allowed: true };
    }

    // "deny" list: subcommand must NOT be in it
    if (rule.deny && rule.deny.includes(subcommand)) {
      return {
        allowed: false,
        reason: `"${command} ${subcommand}" is blocked for safety.`,
      };
    }

    return { allowed: true };
  }

  // --- Layer 3: Dangerous patterns ---

  private checkDangerousPatterns(command: string): CommandValidationResult {
    for (const { pattern, reason } of DANGEROUS_PATTERNS) {
      if (pattern.test(command)) {
        return {
          allowed: false,
          reason: `Blocked by safety rule: ${reason}`,
        };
      }
    }
    return { allowed: true };
  }

  // --- Command parsing ---

  /**
   * Extract command segments from a chained command string.
   * Each segment has a command name and optional subcommand.
   */
  private extractSegments(command: string): Array<{ name: string; subcommand: string | null }> {
    // Split on shell operators
    const parts = command.split(/\s*(?:&&|\|\||[|;])\s*/);

    return parts
      .map(part => part.trim())
      .filter(part => part.length > 0)
      .map(part => {
        // Strip redirections
        const cleaned = part.replace(/\s*\d*>[>&]*\s*\S+/g, '').trim();
        // Strip leading env vars
        const withoutEnv = cleaned.replace(/^(?:\w+=\S+\s+)+/, '');
        // Get tokens
        const tokens = withoutEnv.split(/\s+/);
        // Command name (strip path prefix)
        const name = (tokens[0] || '').replace(/^.*[\\/]/, '');
        // Subcommand (second token, if it doesn't start with -)
        const sub = tokens[1] && !tokens[1].startsWith('-') ? tokens[1] : null;
        return { name, subcommand: sub };
      })
      .filter(seg => seg.name.length > 0);
  }
}

// ============================================================
// Config Factory (from env vars)
// ============================================================

/**
 * Build SandboxConfig from environment variables.
 *
 * Supported env vars:
 *   SANDBOX_PRESET=standard          (readonly | standard | full)
 *   SANDBOX_EXTRA_COMMANDS=python3,cargo
 *   SANDBOX_DENY_COMMANDS=mv,cp
 *   SANDBOX_TIMEOUT=30000
 *
 *   SANDBOX_NPM_ALLOW=install,run,test    (overrides default npm deny list)
 *   SANDBOX_NPM_DENY=publish,unpublish
 *   SANDBOX_GIT_ALLOW=status,log,diff
 *   SANDBOX_GIT_DENY=push,reset
 *
 * For backward compatibility, ALLOWED_COMMANDS still works but SANDBOX_PRESET takes priority.
 */
export function buildSandboxConfig(): SandboxConfig {
  const preset = (process.env.SANDBOX_PRESET || 'standard') as SandboxPreset;

  // Validate preset
  if (!['readonly', 'standard', 'full'].includes(preset)) {
    console.warn(`Unknown SANDBOX_PRESET "${preset}", falling back to "standard"`);
  }

  const extraCommands = process.env.SANDBOX_EXTRA_COMMANDS
    ? process.env.SANDBOX_EXTRA_COMMANDS.split(',').map(s => s.trim()).filter(Boolean)
    : undefined;

  const denyCommands = process.env.SANDBOX_DENY_COMMANDS
    ? process.env.SANDBOX_DENY_COMMANDS.split(',').map(s => s.trim()).filter(Boolean)
    : undefined;

  // Parse per-command subcommand rules from env vars
  const subcommandRules: Record<string, SubcommandRule> = {};

  for (const cmd of ['npm', 'pnpm', 'yarn', 'git', 'pip', 'docker']) {
    const envAllow = process.env[`SANDBOX_${cmd.toUpperCase()}_ALLOW`];
    const envDeny = process.env[`SANDBOX_${cmd.toUpperCase()}_DENY`];

    if (envAllow || envDeny) {
      subcommandRules[cmd] = {};
      if (envAllow) {
        subcommandRules[cmd].allow = envAllow.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (envDeny) {
        subcommandRules[cmd].deny = envDeny.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
  }

  return {
    preset: ['readonly', 'standard', 'full'].includes(preset) ? preset as SandboxPreset : 'standard',
    extraCommands,
    denyCommands,
    subcommandRules: Object.keys(subcommandRules).length > 0 ? subcommandRules : undefined,
    timeout: parseInt(process.env.SANDBOX_TIMEOUT || '30000', 10),
    defaultCwd: process.env.PROJECT_DIR || process.cwd(),
  };
}
