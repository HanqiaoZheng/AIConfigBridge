import { AICConfig, ToolType, Adapter } from '../types';

export interface TransformOptions {
  preserveMetadata?: boolean;
  mergeRules?: boolean;
  overwriteRules?: boolean;
}

export interface TransformResult {
  success: boolean;
  config?: AICConfig;
  error?: string;
  warnings?: string[];
}

export class ConfigTransformer {
  private adapters: Map<ToolType, Adapter> = new Map();

  registerAdapter(adapter: Adapter): void {
    this.adapters.set(adapter.toolType, adapter);
  }

  getAdapter(toolType: ToolType): Adapter | undefined {
    return this.adapters.get(toolType);
  }

  getSupportedTools(): ToolType[] {
    return Array.from(this.adapters.keys());
  }

  async transform(
    config: AICConfig,
    fromTool: ToolType,
    toTool: ToolType,
    options: TransformOptions = {}
  ): Promise<TransformResult> {
    const warnings: string[] = [];

    if (fromTool === toTool) {
      return {
        success: true,
        config,
        warnings: ['Source and target tools are the same, no transformation needed'],
      };
    }

    const fromAdapter = this.adapters.get(fromTool);
    const toAdapter = this.adapters.get(toTool);

    if (!fromAdapter) {
      return {
        success: false,
        error: `Unsupported source tool: ${fromTool}`,
      };
    }

    if (!toAdapter) {
      return {
        success: false,
        error: `Unsupported target tool: ${toTool}`,
      };
    }

    try {
      let transformedConfig = { ...config };

      if (!options.preserveMetadata) {
        transformedConfig.meta = {
          ...transformedConfig.meta,
          name: `${config.meta.name} (${toTool})`,
        };
      }

      transformedConfig = this.applyToolSpecificTransformations(transformedConfig, toTool, warnings);

      if (options.mergeRules && config.rules) {
        transformedConfig.rules = this.mergeRules(transformedConfig.rules);
      }

      return {
        success: true,
        config: transformedConfig,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown transform error',
      };
    }
  }

  private applyToolSpecificTransformations(
    config: AICConfig,
    toTool: ToolType,
    warnings: string[]
  ): AICConfig {
    const transformed = { ...config };

    switch (toTool) {
      case 'cursor':
      case 'windsurf':
        if (transformed.rules.length > 10) {
          warnings.push('Cursor/Windsurf works best with fewer than 10 rules. Consider combining some rules.');
        }
        transformed.rules = transformed.rules.map(rule => ({
          ...rule,
          files: rule.files?.filter(f => !f.includes('*') || f.startsWith('*')),
        }));
        break;

      case 'zed':
        if (transformed.mcpServers && transformed.mcpServers.length > 5) {
          warnings.push('Zed recommends fewer than 5 MCP servers for optimal performance.');
        }
        break;

      case 'aider':
        transformed.context.allowedCommands = transformed.context.allowedCommands.filter(
          cmd => !cmd.includes('sudo')
        );
        warnings.push('Aider does not support sudo commands. Such commands will be removed.');
        break;
    }

    return transformed;
  }

  private mergeRules(rules: AICConfig['rules']): AICConfig['rules'] {
    const ruleMap = new Map<string, AICConfig['rules'][0]>();

    for (const rule of rules) {
      const key = rule.name.toLowerCase().replace(/\s+/g, '-');
      
      if (ruleMap.has(key)) {
        const existing = ruleMap.get(key)!;
        ruleMap.set(key, {
          ...existing,
          content: existing.content + '\n\n' + rule.content,
          files: [...new Set([...(existing.files || []), ...(rule.files || [])])],
        });
      } else {
        ruleMap.set(key, { ...rule });
      }
    }

    return Array.from(ruleMap.values());
  }

  async convert(
    content: string,
    fromTool: ToolType,
    toTool: ToolType,
    options: TransformOptions = {}
  ): Promise<TransformResult> {
    const fromAdapter = this.adapters.get(fromTool);
    
    if (!fromAdapter) {
      return {
        success: false,
        error: `Unsupported source tool: ${fromTool}`,
      };
    }

    const parseResult = await fromAdapter.parse(content);
    
    if (!parseResult.success || !parseResult.config) {
      return {
        success: false,
        error: parseResult.error || 'Failed to parse source configuration',
      };
    }

    return this.transform(parseResult.config, fromTool, toTool, options);
  }
}
