export type ToolType = 'cursor' | 'windsurf' | 'zed' | 'bolt' | 'copilot' | 'claude-code' | 'aider';

export interface AICConfig {
  version: string;
  meta: {
    name: string;
    description: string;
    author?: string;
  };
  rules: Rule[];
  context: Context;
  mcpServers?: MCPServer[];
  model?: Model;
}

export interface Rule {
  id?: string;
  name: string;
  description?: string;
  files?: string[];
  content: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface Context {
  projectType: string;
  projectPath?: string;
  codingStandards: string[];
  allowedCommands: string[];
  forbiddenPatterns?: string[];
  customInstructions?: string[];
}

export interface MCPServer {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  enabled?: boolean;
}

export interface Model {
  provider: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface Adapter {
  name: string;
  toolType: ToolType;
  version: string;
  parse(content: string): Promise<AICConfig>;
  serialize(config: AICConfig): Promise<string>;
  supportedFilePatterns: string[];
}

export interface Transformer {
  from: ToolType;
  to: ToolType;
  transform(config: AICConfig): Promise<AICConfig>;
}

export interface ParseResult {
  success: boolean;
  config?: AICConfig;
  error?: string;
  warnings?: string[];
}

export interface SerializeResult {
  success: boolean;
  content?: string;
  error?: string;
}

export interface ConfigMetadata {
  toolType: ToolType;
  sourceFile?: string;
  parsedAt: Date;
  version: string;
}
