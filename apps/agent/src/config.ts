import 'dotenv/config';

export interface AgentConfig {
  apiKey: string;
  baseURL?: string;
  model: string;
  maxTokens: number;
  skillsDir: string;
  /** Enable auto-discovery from .claude/.agents directories */
  enableDiscovery: boolean;
  /** Enable remote HTTP sources */
  enableHttp: boolean;
  /** Remote skill URLs (comma-separated) */
  httpUrls: string[];
  /** Project directory for discovery */
  projectDir?: string;
  sandbox: {
    timeout: number;
    maxMemory: string;
    allowedCommands: string[];
  };
}

export function loadConfig(): AgentConfig {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required in .env file');
  }

  return {
    apiKey,
    baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096', 10),
    skillsDir: process.env.SKILLS_DIR || './skills',
    enableDiscovery: process.env.ENABLE_DISCOVERY !== 'false', // Default true
    enableHttp: process.env.ENABLE_HTTP === 'true', // Default false
    httpUrls: process.env.HTTP_SKILL_URLS
      ? process.env.HTTP_SKILL_URLS.split(',').map(u => u.trim())
      : [],
    projectDir: process.env.PROJECT_DIR || process.cwd(),
    sandbox: {
      timeout: parseInt(process.env.SANDBOX_TIMEOUT || '30000', 10),
      maxMemory: process.env.SANDBOX_MAX_MEMORY || '512MB',
      allowedCommands: (process.env.ALLOWED_COMMANDS || 'ls,cat,echo,node,npm,pnpm').split(','),
    },
  };
}
