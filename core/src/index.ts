export interface AICConfig {
  version: string;
  meta: {
    name: string;
    description: string;
  };
  rules: {
    files: string[];
    content: string;
  }[];
  context: {
    projectType: string;
    codingStandards: string[];
    allowedCommands: string[];
  };
  mcpServers?: {
    name: string;
    command: string;
    args: string[];
  }[];
  model?: {
    provider: string;
    model: string;
  };
}

export interface Adapter {
  name: string;
  version: string;
  parse(content: string): Promise<AICConfig>;
  serialize(config: AICConfig): Promise<string>;
  supportedFilePatterns: string[];
}

export interface Transformer {
  from: string;
  to: string;
  transform(config: AICConfig): Promise<AICConfig>;
}
