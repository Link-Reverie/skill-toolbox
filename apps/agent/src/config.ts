import 'dotenv/config';

export interface AgentConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  skillsDir: string;
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
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096', 10),
    skillsDir: process.env.SKILLS_DIR || './skills',
    sandbox: {
      timeout: parseInt(process.env.SANDBOX_TIMEOUT || '30000', 10),
      maxMemory: process.env.SANDBOX_MAX_MEMORY || '512MB',
      allowedCommands: (process.env.ALLOWED_COMMANDS || 'ls,cat,echo,node,npm,pnpm').split(','),
    },
  };
}
