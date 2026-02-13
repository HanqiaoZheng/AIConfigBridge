import { ToolType, Adapter, ParseResult, SerializeResult, AICConfig } from '../types';
import { ConfigTransformer } from '../transformer/ConfigTransformer';

export class AdapterFactory {
  private adapters: Map<ToolType, Adapter> = new Map();
  private transformer: ConfigTransformer;

  constructor() {
    this.transformer = new ConfigTransformer();
  }

  register(adapter: Adapter): void {
    this.adapters.set(adapter.toolType, adapter);
    this.transformer.registerAdapter(adapter);
  }

  get(toolType: ToolType): Adapter | undefined {
    return this.adapters.get(toolType);
  }

  getAll(): Adapter[] {
    return Array.from(this.adapters.values());
  }

  getSupportedTools(): ToolType[] {
    return Array.from(this.adapters.keys());
  }

  getTransformer(): ConfigTransformer {
    return this.transformer;
  }

  async parse(content: string, toolType: ToolType): Promise<ParseResult> {
    const adapter = this.adapters.get(toolType);
    
    if (!adapter) {
      return {
        success: false,
        error: `Unsupported tool: ${toolType}`,
      };
    }

    return adapter.parse(content);
  }

  async serialize(config: AICConfig, toolType: ToolType): Promise<SerializeResult> {
    const adapter = this.adapters.get(toolType);
    
    if (!adapter) {
      return {
        success: false,
        error: `Unsupported tool: ${toolType}`,
      };
    }

    return adapter.serialize(config);
  }

  canParse(filePath: string): ToolType | null {
    for (const [toolType, adapter] of this.adapters) {
      if (adapter.supportedFilePatterns.some(pattern => {
        if (pattern.startsWith('*')) {
          return filePath.endsWith(pattern.slice(1));
        }
        return filePath === pattern || filePath.endsWith('/' + pattern);
      })) {
        return toolType;
      }
    }
    return null;
  }

  detectToolFromFile(filePath: string): ToolType | null {
    const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || '';
    
    if (fileName === '.cursorrules' || fileName === '.cursor' || fileName.endsWith('.cursorrules')) {
      return 'cursor';
    }
    if (fileName === '.windsurfrules' || fileName === '.windsurf' || fileName.endsWith('.windsurfrules')) {
      return 'windsurf';
    }
    if (fileName === '.zedrules' || fileName === 'config.json') {
      return 'zed';
    }
    if (fileName === 'bolt.json') {
      return 'bolt';
    }
    if (fileName === '.aider.conf.yml' || fileName === 'aider.conf.yml') {
      return 'aider';
    }

    return this.canParse(filePath);
  }
}

export const factory = new AdapterFactory();
